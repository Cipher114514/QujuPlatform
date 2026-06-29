package com.example.demo.service;

import com.example.demo.dto.CreateActivityRequest;
import com.example.demo.entity.Activity;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;

    /**
     * 文本创建活动（发布即上架，无需审核）
     * US-006: 手动创建活动
     */
    public Activity createActivity(CreateActivityRequest req, User creator) {
        // 时间校验：活动开始时间必须晚于当前系统时间
        if (!req.getStartTime().isAfter(LocalDateTime.now())) {
            throw new BusinessException("活动开始时间必须晚于当前系统时间");
        }

        // 时间校验：报名截止时间必须早于活动开始时间
        if (!req.getRegistrationDeadline().isBefore(req.getStartTime())) {
            throw new BusinessException("报名截止时间必须早于活动开始时间");
        }

        // 时间校验：结束时间必须晚于开始时间
        if (!req.getEndTime().isAfter(req.getStartTime())) {
            throw new BusinessException("活动结束时间必须晚于开始时间");
        }

        // 标签转为逗号分隔字符串存储
        String tagsStr = null;
        if (req.getTags() != null && !req.getTags().isEmpty()) {
            tagsStr = String.join(",", req.getTags());
        }

        // 图片URL数组转为逗号分隔字符串存储
        String imagesStr = null;
        if (req.getImages() != null && !req.getImages().isEmpty()) {
            imagesStr = String.join(",", req.getImages());
        }

        Activity activity = Activity.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .category(req.getCategory())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .location(req.getLocation())
                .maxParticipants(req.getMaxParticipants())
                .currentParticipants(0)
                .fee(req.getFee() != null ? req.getFee() : BigDecimal.ZERO)
                .status("PUBLISHED")  // US-006: 发布即上架，无需审核
                .tags(tagsStr)
                .images(imagesStr)
                .coverImage(req.getCoverImage())
                .creatorId(creator.getId())
                .registrationDeadline(req.getRegistrationDeadline())
                .build();

        return activityRepository.save(activity);
    }
}
