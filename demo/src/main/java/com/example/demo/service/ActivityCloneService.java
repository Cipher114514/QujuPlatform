package com.example.demo.service;

import com.example.demo.entity.Activity;
import com.example.demo.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
                .startTime(null)
                .endTime(null)
                .registrationDeadline(null)
                .build();

        return activityRepository.save(cloned);
    }
}
