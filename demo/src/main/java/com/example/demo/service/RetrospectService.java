package com.example.demo.service;

import com.example.demo.dto.GalleryItemResponse;
import com.example.demo.dto.RetrospectDetailResponse;
import com.example.demo.dto.RetrospectResponse;
import com.example.demo.dto.UserBriefResponse;
import com.example.demo.entity.Activity;
import com.example.demo.entity.ActivityGallery;
import com.example.demo.entity.Registration;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.ActivityGalleryRepository;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.RegistrationRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RetrospectService {

    private final RegistrationRepository registrationRepository;
    private final ActivityGalleryRepository galleryRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public RetrospectResponse getRetrospect(Long activityId) {
        activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        long total = registrationRepository.countByActivityId(activityId);
        long checkedIn = registrationRepository.countByActivityIdAndStatus(activityId, "CHECKED_IN");
        long confirmed = registrationRepository.countByActivityIdAndStatus(activityId, "CONFIRMED");
        long cancelled = registrationRepository.countByActivityIdAndStatus(activityId, "CANCELLED");

        BigDecimal rate = total > 0
                ? BigDecimal.valueOf(checkedIn).multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return RetrospectResponse.builder()
                .totalRegistrations(total)
                .checkedInCount(checkedIn)
                .confirmedCount(confirmed)
                .cancelledCount(cancelled)
                .checkInRate(rate)
                .build();
    }

    public RetrospectDetailResponse getRetrospectDetails(Long activityId) {
        activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        List<Registration> allRegs = registrationRepository.findByActivityId(activityId);

        return RetrospectDetailResponse.builder()
                .checkedInUsers(toUserBriefList(allRegs, "CHECKED_IN"))
                .confirmedUsers(toUserBriefList(allRegs, "CONFIRMED"))
                .cancelledUsers(toUserBriefList(allRegs, "CANCELLED"))
                .build();
    }

    private List<UserBriefResponse> toUserBriefList(List<Registration> regs, String status) {
        return regs.stream()
                .filter(r -> status.equals(r.getStatus()))
                .map(r -> userRepository.findById(r.getUserId()).orElse(null))
                .filter(u -> u != null)
                .map(u -> UserBriefResponse.builder()
                        .id(u.getId()).nickname(u.getNickname()).avatar(u.getAvatar()).build())
                .collect(Collectors.toList());
    }

    public Page<GalleryItemResponse> getGallery(Long activityId, int page, int size) {
        Page<ActivityGallery> gallery = galleryRepository
                .findByActivityIdOrderByCreatedAtDesc(activityId, PageRequest.of(page, size));
        return gallery.map(g -> GalleryItemResponse.builder()
                .id(g.getId())
                .imageUrl(g.getImageUrl())
                .createdAt(g.getCreatedAt() != null ? g.getCreatedAt().toString() : null)
                .build());
    }

    public GalleryItemResponse addGallery(Long activityId, Long userId, String imageUrl) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        if (!activity.getCreatorId().equals(userId)) {
            throw new BusinessException(403, "只有活动发起人可以上传花絮");
        }

        ActivityGallery gallery = galleryRepository.save(ActivityGallery.builder()
                .activityId(activityId)
                .userId(userId)
                .imageUrl(imageUrl)
                .build());

        return GalleryItemResponse.builder()
                .id(gallery.getId())
                .imageUrl(gallery.getImageUrl())
                .createdAt(gallery.getCreatedAt() != null ? gallery.getCreatedAt().toString() : null)
                .build();
    }

    public void deleteGallery(Long activityId, Long galleryId, Long userId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        if (!activity.getCreatorId().equals(userId)) {
            throw new BusinessException(403, "只有活动发起人可以删除花絮");
        }

        ActivityGallery gallery = galleryRepository.findById(galleryId)
                .orElseThrow(() -> new BusinessException(404, "花絮不存在"));

        if (!gallery.getActivityId().equals(activityId)) {
            throw new BusinessException("花絮不属于此活动");
        }

        galleryRepository.delete(gallery);
    }
}
