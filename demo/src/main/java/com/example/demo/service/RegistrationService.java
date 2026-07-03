package com.example.demo.service;

import com.example.demo.annotation.RedisLock;
import com.example.demo.entity.Activity;
import com.example.demo.entity.Registration;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final ActivityRepository activityRepository;
    private final RegistrationRepository registrationRepository;

    @Transactional
    @RedisLock(key = "activity:{activityId}")
    public Registration register(Long activityId, Long userId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        if (activity.getCreatorId().equals(userId)) {
            throw new BusinessException("您不能报名自己创建的活动");
        }

        var existingReg = registrationRepository.findByActivityIdAndUserId(activityId, userId);
        if (existingReg.isPresent()) {
            Registration reg = existingReg.get();
            if ("CONFIRMED".equals(reg.getStatus())) {
                throw new BusinessException("您已报名该活动");
            }
            if ("CANCELLED".equals(reg.getStatus())) {
                return reactivateRegistration(activity, reg);
            }
        }

        if (!"ACTIVE".equals(activity.getStatus())) {
            throw new BusinessException("该活动当前不可报名");
        }

        if (activity.getRegistrationDeadline() != null
                && activity.getRegistrationDeadline().isBefore(LocalDateTime.now())) {
            throw new BusinessException("报名已截止");
        }

        int updated = activityRepository.incrementParticipants(activityId);
        if (updated == 0) {
            throw new BusinessException(409, "活动已满员");
        }

        Registration registration = Registration.builder()
                .activityId(activityId)
                .userId(userId)
                .status("CONFIRMED")
                .participants(1)
                .build();

        return registrationRepository.save(registration);
    }

    private Registration reactivateRegistration(Activity activity, Registration reg) {
        if (!"ACTIVE".equals(activity.getStatus())) {
            throw new BusinessException("该活动当前不可报名");
        }

        if (activity.getRegistrationDeadline() != null
                && activity.getRegistrationDeadline().isBefore(LocalDateTime.now())) {
            throw new BusinessException("报名已截止");
        }

        int updated = activityRepository.incrementParticipants(activity.getId());
        if (updated == 0) {
            throw new BusinessException(409, "活动已满员");
        }

        reg.setStatus("CONFIRMED");
        reg.setCancelledAt(null);
        reg.setCheckedInAt(null);
        return registrationRepository.save(reg);
    }
}