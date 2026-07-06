package com.example.demo.service;

import com.example.demo.dto.ActivityDetailResponse;
import com.example.demo.entity.Activity;
import com.example.demo.entity.Registration;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.RegistrationRepository;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityDetailService {

    private final ActivityRepository activityRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public ActivityDetailResponse getDetail(Long activityId, Long currentUserId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        // 查询发起人信息
        User creator = userRepository.findById(activity.getCreatorId())
                .orElse(null);
        ActivityDetailResponse.CreatorInfo creatorInfo = null;
        if (creator != null) {
            creatorInfo = ActivityDetailResponse.CreatorInfo.builder()
                    .id(creator.getId())
                    .nickname(creator.getNickname())
                    .avatar(creator.getAvatar())
                    .build();
        }

        // 查询当前用户的报名状态
        ActivityDetailResponse.MyRegistrationInfo myReg = null;
        Optional<Registration> reg = registrationRepository
                .findByActivityIdAndUserId(activityId, currentUserId);
        if (reg.isPresent()) {
            myReg = ActivityDetailResponse.MyRegistrationInfo.builder()
                    .id(reg.get().getId())
                    .status(reg.get().getStatus())
                    .build();
        }

        // 解析 tags（逗号分隔字符串 → 列表）
        List<String> tagList = activity.getTags() != null && !activity.getTags().isBlank()
                ? Arrays.asList(activity.getTags().split(","))
                : Collections.emptyList();

        // 解析 images
        List<String> imageList = activity.getImages() != null && !activity.getImages().isBlank()
                ? Arrays.asList(activity.getImages().split(","))
                : Collections.emptyList();

        return ActivityDetailResponse.builder()
                .id(activity.getId())
                .title(activity.getTitle())
                .description(activity.getDescription())
                .category(activity.getCategory())
                .startTime(activity.getStartTime() != null ? activity.getStartTime().toString() : null)
                .endTime(activity.getEndTime() != null ? activity.getEndTime().toString() : null)
                .location(activity.getLocation())
                .maxParticipants(activity.getMaxParticipants())
                .currentParticipants(activity.getCurrentParticipants())
                .fee(activity.getFee())
                .status(activity.getStatus())
                .tags(tagList)
                .images(imageList)
                .coverImage(activity.getCoverImage())
                .creatorId(activity.getCreatorId())
                .registrationDeadline(activity.getRegistrationDeadline() != null
                        ? activity.getRegistrationDeadline().toString() : null)
                .createdAt(activity.getCreatedAt() != null ? activity.getCreatedAt().toString() : null)
                .creator(creatorInfo)
                .myRegistration(myReg)
                .requireApproval(activity.getRequireApproval())
                .avgRating(reviewRepository.getAvgRatingByActivityId(activityId))
                .reviewCount(reviewRepository.countByActivityId(activityId))
                .build();
    }
}
