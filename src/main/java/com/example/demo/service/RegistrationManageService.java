package com.example.demo.service;

import com.example.demo.entity.Activity;
import com.example.demo.entity.Registration;
import com.example.demo.entity.User;
import com.example.demo.entity.WaitlistEntry;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.RegistrationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistrationManageService {

    private final RegistrationRepository registrationRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final WaitlistRepository waitlistRepository;

    @Transactional
    public void cancelRegistration(Long activityId, Long userId) {
        Registration registration = registrationRepository.findByActivityIdAndUserId(activityId, userId)
                .orElseThrow(() -> new BusinessException(404, "未找到报名记录"));

        if ("CANCELLED".equals(registration.getStatus())) {
            throw new BusinessException(400, "报名已取消");
        }

        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        if (activity.getRegistrationDeadline() != null && activity.getRegistrationDeadline().isBefore(LocalDateTime.now())) {
            throw new BusinessException(400, "报名已截止，无法取消");
        }

        registration.setStatus("CANCELLED");
        registration.setCancelledAt(LocalDateTime.now());
        registrationRepository.save(registration);

        int releasedSlots = registration.getParticipants();
        activity.setCurrentParticipants(Math.max(0, activity.getCurrentParticipants() - releasedSlots));

        promoteFromWaitlist(activityId, activity, releasedSlots);

        activityRepository.save(activity);
    }

    private void promoteFromWaitlist(Long activityId, Activity activity, int slots) {
        List<WaitlistEntry> waitlist = waitlistRepository.findByActivityIdOrderByQueuePositionAsc(activityId);

        if (waitlist.isEmpty()) {
            return;
        }

        int availableSlots = slots;
        for (WaitlistEntry entry : waitlist) {
            if (availableSlots <= 0) {
                break;
            }

            if (!"WAITING".equals(entry.getStatus())) {
                continue;
            }

            Registration newRegistration = Registration.builder()
                    .activityId(activityId)
                    .userId(entry.getUserId())
                    .participants(1)
                    .status("CONFIRMED")
                    .build();
            registrationRepository.save(newRegistration);

            waitlistRepository.decrementQueuePositions(activityId, entry.getQueuePosition());
            waitlistRepository.delete(entry);

            activity.setCurrentParticipants(activity.getCurrentParticipants() + 1);
            availableSlots--;
        }
    }

    public List<Registration> getMyRegistrations(Long userId) {
        return registrationRepository.findByUserId(userId);
    }

    public List<Registration> getMyRegistrations(Long userId, String status) {
        if (status == null || status.isEmpty()) {
            return registrationRepository.findByUserId(userId);
        }
        return registrationRepository.findByUserIdAndStatus(userId, status);
    }

    public Registration getRegistration(Long activityId, Long userId) {
        return registrationRepository.findByActivityIdAndUserId(activityId, userId)
                .orElse(null);
    }
}