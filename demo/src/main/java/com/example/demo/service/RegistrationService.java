package com.example.demo.service;

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
    public Registration register(Long activityId, Long userId) {
        // 检查活动是否存在
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        // 检查是否为创建者本人
        if (activity.getCreatorId().equals(userId)) {
            throw new BusinessException("您不能报名自己创建的活动");
        }

        // 检查是否已报名
        if (registrationRepository.existsByActivityIdAndUserId(activityId, userId)) {
            throw new BusinessException("您已报名该活动");
        }

        // 检查活动状态
        if (!"ACTIVE".equals(activity.getStatus())) {
            throw new BusinessException("该活动当前不可报名");
        }

        // 检查报名截止时间
        if (activity.getRegistrationDeadline() != null
                && activity.getRegistrationDeadline().isBefore(LocalDateTime.now())) {
            throw new BusinessException("报名已截止");
        }

        // 原子递增参与人数（乐观锁），满员时返回 0
        int updated = activityRepository.incrementParticipants(activityId);
        if (updated == 0) {
            throw new BusinessException(409, "活动已满员");
        }

        // 创建报名记录
        Registration registration = Registration.builder()
                .activityId(activityId)
                .userId(userId)
                .status("CONFIRMED")
                .participants(1)
                .build();

        return registrationRepository.save(registration);
    }
}
