package com.example.demo.service;

import com.example.demo.entity.Activity;
import com.example.demo.entity.Registration;
import com.example.demo.entity.WaitlistEntry;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.RegistrationRepository;
import com.example.demo.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WaitlistService {

    private final WaitlistRepository waitlistRepository;
    private final ActivityRepository activityRepository;
    private final RegistrationRepository registrationRepository;

    @Transactional
    public WaitlistEntry joinWaitlist(Long activityId, Long userId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        if (registrationRepository.existsByActivityIdAndUserId(activityId, userId)) {
            throw new BusinessException(400, "您已报名该活动");
        }

        if (waitlistRepository.existsByActivityIdAndUserId(activityId, userId)) {
            throw new BusinessException(400, "您已在等待队列中");
        }

        if (activity.getCurrentParticipants() < activity.getMaxParticipants()) {
            throw new BusinessException(400, "活动还有名额，请直接报名");
        }

        int nextPosition = waitlistRepository.countByActivityId(activityId) + 1;

        WaitlistEntry entry = WaitlistEntry.builder()
                .activityId(activityId)
                .userId(userId)
                .queuePosition(nextPosition)
                .status("WAITING")
                .build();

        return waitlistRepository.save(entry);
    }

    @Transactional
    public void leaveWaitlist(Long activityId, Long userId) {
        WaitlistEntry entry = waitlistRepository.findByActivityIdAndUserId(activityId, userId)
                .orElseThrow(() -> new BusinessException(404, "您不在等待队列中"));

        waitlistRepository.decrementQueuePositions(activityId, entry.getQueuePosition());
        waitlistRepository.delete(entry);
    }

    public WaitlistEntry getMyWaitlistEntry(Long activityId, Long userId) {
        return waitlistRepository.findByActivityIdAndUserId(activityId, userId).orElse(null);
    }

    public List<WaitlistEntry> getWaitlist(Long activityId) {
        return waitlistRepository.findByActivityIdOrderByQueuePositionAsc(activityId);
    }

    public int getQueuePosition(Long activityId, Long userId) {
        WaitlistEntry entry = waitlistRepository.findByActivityIdAndUserId(activityId, userId).orElse(null);
        return entry != null ? entry.getQueuePosition() : -1;
    }

    public int getWaitlistCount(Long activityId) {
        return waitlistRepository.countByActivityId(activityId);
    }
}