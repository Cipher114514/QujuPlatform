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
                .status("ACTIVE")  // 发布即上架，无需审核
                .tags(tagsStr)
                .images(imagesStr)
                .coverImage(req.getCoverImage())
                .creatorId(creator.getId())
                .registrationDeadline(req.getRegistrationDeadline())
                .build();

        return activityRepository.save(activity);
    }

    /**
     * US-009: 修改已发布的活动（仅限创建者本人，且活动尚未开始）
     */
    public Activity updateActivity(Long activityId, CreateActivityRequest req, User editor) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        if (!activity.getCreatorId().equals(editor.getId())) {
            throw new BusinessException("只能修改自己创建的活动");
        }

        if (!"ACTIVE".equals(activity.getStatus())) {
            throw new BusinessException("只有进行中的活动可以修改");
        }

        if (activity.getStartTime() != null && activity.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BusinessException("活动已开始，无法修改");
        }

        if (!req.getStartTime().isAfter(LocalDateTime.now())) {
            throw new BusinessException("活动开始时间必须晚于当前系统时间");
        }
        if (!req.getEndTime().isAfter(req.getStartTime())) {
            throw new BusinessException("活动结束时间必须晚于开始时间");
        }
        if (req.getRegistrationDeadline() != null && !req.getRegistrationDeadline().isBefore(req.getStartTime())) {
            throw new BusinessException("报名截止时间必须早于活动开始时间");
        }

        String tagsStr = null;
        if (req.getTags() != null && !req.getTags().isEmpty()) {
            tagsStr = String.join(",", req.getTags());
        }

        activity.setTitle(req.getTitle());
        activity.setDescription(req.getDescription());
        activity.setCategory(req.getCategory());
        activity.setStartTime(req.getStartTime());
        activity.setEndTime(req.getEndTime());
        activity.setLocation(req.getLocation());
        activity.setMaxParticipants(req.getMaxParticipants());
        activity.setFee(req.getFee() != null ? req.getFee() : BigDecimal.ZERO);
        activity.setTags(tagsStr);
        activity.setCoverImage(req.getCoverImage());
        activity.setRegistrationDeadline(req.getRegistrationDeadline());

        return activityRepository.save(activity);
    }

    /**
     * US-009: 撤销发布（仅限创建者本人，且活动尚未开始）
     */
    public void cancelActivity(Long activityId, User creator) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        if (!activity.getCreatorId().equals(creator.getId())) {
            throw new BusinessException("只能撤销自己创建的活动");
        }

        if (!"ACTIVE".equals(activity.getStatus())) {
            throw new BusinessException("该活动当前状态不可撤销");
        }

        activity.setStatus("CANCELLED");
        activityRepository.save(activity);
    }

    /**
     * US-008: 保存草稿（不做时间校验，可覆盖已有草稿）
     */
    public Activity saveDraft(CreateActivityRequest req, User creator) {
        String tagsStr = null;
        if (req.getTags() != null && !req.getTags().isEmpty()) {
            tagsStr = String.join(",", req.getTags());
        }

        Activity activity = Activity.builder()
                .title(req.getTitle() != null ? req.getTitle() : "未命名活动")
                .description(req.getDescription() != null ? req.getDescription() : "")
                .category(req.getCategory() != null ? req.getCategory() : "sports")
                .startTime(req.getStartTime() != null ? req.getStartTime() : LocalDateTime.now().plusDays(7))
                .endTime(req.getEndTime() != null ? req.getEndTime() : LocalDateTime.now().plusDays(7).plusHours(2))
                .location(req.getLocation() != null ? req.getLocation() : "")
                .maxParticipants(req.getMaxParticipants() != null ? req.getMaxParticipants() : 20)
                .currentParticipants(0)
                .fee(req.getFee() != null ? req.getFee() : BigDecimal.ZERO)
                .status("DRAFT")
                .tags(tagsStr)
                .coverImage(req.getCoverImage())
                .creatorId(creator.getId())
                .registrationDeadline(req.getRegistrationDeadline())
                .build();

        return activityRepository.save(activity);
    }

    /** US-008: 获取用户草稿 */
    public java.util.List<Activity> getDrafts(Long userId) {
        return activityRepository.findByCreatorIdAndStatusOrderByCreatedAtDesc(userId, "DRAFT");
    }
}
