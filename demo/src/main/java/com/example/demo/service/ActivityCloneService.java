package com.example.demo.service;

import com.example.demo.entity.Activity;
import com.example.demo.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ActivityCloneService {

    private final ActivityRepository activityRepository;

    public Activity clone(Long activityId, Long currentUserId) {
        Activity source = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("活动不存在"));

        if (!source.getCreatorId().equals(currentUserId)) {
            throw new RuntimeException("只能克隆自己创建的活动");
        }

        // 给时间设置默认占位值，前端会清空让用户重新填写
        LocalDateTime defaultStart = LocalDateTime.now().plusDays(7).withHour(9).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime defaultEnd   = defaultStart.plusHours(3);

        Activity cloned = Activity.builder()
                .title(source.getTitle() + "（克隆）")
                .description(source.getDescription())
                .category(source.getCategory())
                .location(source.getLocation())
                .maxParticipants(source.getMaxParticipants())
                .fee(source.getFee())
                .tags(source.getTags())
                .coverImage(source.getCoverImage())
                .images(source.getImages())
                .creatorId(currentUserId)
                .status("ACTIVE")
                .currentParticipants(0)
                .startTime(defaultStart)
                .endTime(defaultEnd)
                .registrationDeadline(null)
                .build();

        return activityRepository.save(cloned);
    }
}
