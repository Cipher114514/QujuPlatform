package com.example.demo.service;

import com.example.demo.annotation.RedisLock;
import com.example.demo.dto.CheckinListResponse;
import com.example.demo.dto.CheckinQrResponse;
import com.example.demo.dto.CheckinStatusResponse;
import com.example.demo.entity.Activity;
import com.example.demo.entity.Registration;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.RegistrationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityCheckinService {

    private static final Duration TOKEN_TTL = Duration.ofSeconds(30);

    private final ActivityRepository activityRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, ManualCodeEntry> manualCodes = new ConcurrentHashMap<>();

    public CheckinQrResponse createQrToken(Long activityId, User currentUser) {
        Activity activity = getActivity(activityId);
        Registration registration = registrationRepository.findByActivityIdAndUserId(activityId, currentUser.getId())
                .orElseThrow(() -> new BusinessException(403, "该用户未报名此活动"));
        if (!"CONFIRMED".equals(registration.getStatus())) {
            throw new BusinessException(403, "该用户未报名此活动");
        }

        LocalDateTime expireAt = LocalDateTime.now().plus(TOKEN_TTL);
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "activity-checkin");
        claims.put("activityId", activityId);
        String token = jwtUtil.generateToken(currentUser.getId(), claims, TOKEN_TTL);
        String manualCode = createManualCode(activityId, currentUser.getId(), expireAt);

        return CheckinQrResponse.builder()
                .token(token)
                .manualCode(manualCode)
                .expireAt(expireAt.toString())
                .activityTitle(activity.getTitle())
                .build();
    }

    @Transactional
    @RedisLock(key = "checkin:{activityId}")
    public CheckinStatusResponse checkin(Long activityId, User organizer, String tokenOrCode) {
        Activity activity = getActivity(activityId);
        assertCreator(activity, organizer.getId());

        Long participantId = resolveParticipantId(activityId, tokenOrCode);
        Registration registration = registrationRepository.findByActivityIdAndUserId(activityId, participantId)
                .orElseThrow(() -> new BusinessException(403, "该用户未报名此活动"));
        if (!"CONFIRMED".equals(registration.getStatus())) {
            throw new BusinessException(403, "该用户未报名此活动");
        }
        boolean alreadyCheckedIn = registration.getCheckedInAt() != null;
        if (!alreadyCheckedIn) {
            registration.setCheckedInAt(LocalDateTime.now());
            registrationRepository.save(registration);
        }
        CheckinStatusResponse response = toStatus(registration);
        if (alreadyCheckedIn) {
            response.setStatus("ALREADY_CHECKED_IN");
        }
        return response;
    }

    public CheckinStatusResponse getMyStatus(Long activityId, User currentUser) {
        return registrationRepository.findByActivityIdAndUserId(activityId, currentUser.getId())
                .map(this::toStatus)
                .orElse(CheckinStatusResponse.builder()
                        .activityId(activityId)
                        .userId(currentUser.getId())
                        .registered(false)
                        .checkedIn(false)
                        .status("NOT_REGISTERED")
                        .build());
    }

    public CheckinListResponse getCheckinList(Long activityId, User organizer) {
        Activity activity = getActivity(activityId);
        assertCreator(activity, organizer.getId());

        List<Registration> registrations = registrationRepository
                .findByActivityIdAndStatusOrderByRegisteredAtAsc(activityId, "CONFIRMED");
        Map<Long, User> users = userRepository.findAllById(
                        registrations.stream().map(Registration::getUserId).toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<CheckinListResponse.CheckinUserItem> checkedInUsers = registrations.stream()
                .filter(r -> r.getCheckedInAt() != null)
                .sorted(Comparator.comparing(Registration::getCheckedInAt))
                .map(r -> toItem(r, users.get(r.getUserId())))
                .toList();
        List<CheckinListResponse.CheckinUserItem> uncheckedUsers = registrations.stream()
                .filter(r -> r.getCheckedInAt() == null)
                .map(r -> toItem(r, users.get(r.getUserId())))
                .toList();

        return CheckinListResponse.builder()
                .total(registrations.size())
                .checkedInCount(checkedInUsers.size())
                .uncheckedCount(uncheckedUsers.size())
                .checkedInUsers(checkedInUsers)
                .uncheckedUsers(uncheckedUsers)
                .build();
    }

    private Long resolveParticipantId(Long activityId, String tokenOrCode) {
        String raw = tokenOrCode == null ? "" : tokenOrCode.trim();
        if (raw.matches("\\d{6}")) {
            ManualCodeEntry entry = manualCodes.get(raw);
            if (entry == null || entry.expireAt().isBefore(LocalDateTime.now()) || !entry.activityId().equals(activityId)) {
                throw new BusinessException(410, "二维码已过期，请刷新后重试");
            }
            return entry.userId();
        }

        try {
            Claims claims = jwtUtil.parseToken(raw);
            if (!"activity-checkin".equals(claims.get("type", String.class))) {
                throw new BusinessException(400, "无效的签到凭证");
            }
            Long tokenActivityId = claims.get("activityId", Number.class).longValue();
            if (!activityId.equals(tokenActivityId)) {
                throw new BusinessException(400, "二维码不属于当前活动");
            }
            return Long.parseLong(claims.getSubject());
        } catch (ExpiredJwtException e) {
            throw new BusinessException(410, "二维码已过期，请刷新后重试");
        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException(400, "无效的签到凭证");
        }
    }

    private String createManualCode(Long activityId, Long userId, LocalDateTime expireAt) {
        cleanupManualCodes();
        for (int i = 0; i < 20; i++) {
            String code = String.format("%06d", random.nextInt(1_000_000));
            ManualCodeEntry old = manualCodes.putIfAbsent(code, new ManualCodeEntry(activityId, userId, expireAt));
            if (old == null || old.expireAt().isBefore(LocalDateTime.now())) {
                manualCodes.put(code, new ManualCodeEntry(activityId, userId, expireAt));
                return code;
            }
        }
        throw new BusinessException(500, "验证码生成失败，请重试");
    }

    private void cleanupManualCodes() {
        LocalDateTime now = LocalDateTime.now();
        manualCodes.entrySet().removeIf(e -> e.getValue().expireAt().isBefore(now));
    }

    private Activity getActivity(Long activityId) {
        return activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));
    }

    private void assertCreator(Activity activity, Long userId) {
        if (!activity.getCreatorId().equals(userId)) {
            throw new BusinessException(403, "仅活动发起者可核销");
        }
    }

    private CheckinStatusResponse toStatus(Registration registration) {
        return CheckinStatusResponse.builder()
                .activityId(registration.getActivityId())
                .userId(registration.getUserId())
                .registered("CONFIRMED".equals(registration.getStatus()))
                .checkedIn(registration.getCheckedInAt() != null)
                .status(registration.getCheckedInAt() == null ? "UNCHECKED" : "CHECKED_IN")
                .checkedInAt(registration.getCheckedInAt() == null ? null : registration.getCheckedInAt().toString())
                .build();
    }

    private CheckinListResponse.CheckinUserItem toItem(Registration registration, User user) {
        return CheckinListResponse.CheckinUserItem.builder()
                .userId(registration.getUserId())
                .nickname(user == null ? "未知用户" : user.getNickname())
                .avatar(user == null ? null : user.getAvatar())
                .registeredAt(registration.getRegisteredAt() == null ? null : registration.getRegisteredAt().toString())
                .checkedInAt(registration.getCheckedInAt() == null ? null : registration.getCheckedInAt().toString())
                .build();
    }

    private record ManualCodeEntry(Long activityId, Long userId, LocalDateTime expireAt) {
    }
}
