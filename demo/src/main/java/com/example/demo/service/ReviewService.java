package com.example.demo.service;

import com.example.demo.dto.AvgRatingResponse;
import com.example.demo.dto.CreateReviewRequest;
import com.example.demo.dto.ReviewResponse;
import com.example.demo.entity.Activity;
import com.example.demo.entity.Registration;
import com.example.demo.entity.Review;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.RegistrationRepository;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ActivityRepository activityRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    public ReviewResponse createReview(Long activityId, Long userId, CreateReviewRequest req) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(404, "活动不存在"));

        if (activity.getEndTime().isAfter(LocalDateTime.now())) {
            throw new BusinessException("活动还未结束，不能评价");
        }

        Registration reg = registrationRepository.findByActivityIdAndUserId(activityId, userId)
                .orElseThrow(() -> new BusinessException("您未报名此活动"));

        if (!"CHECKED_IN".equals(reg.getStatus())) {
            throw new BusinessException("您未签到此活动，不能评价");
        }

        if (reviewRepository.existsByActivityIdAndUserId(activityId, userId)) {
            throw new BusinessException("您已评价过此活动");
        }

        Review review = reviewRepository.save(Review.builder()
                .activityId(activityId)
                .userId(userId)
                .rating(req.getRating())
                .content(req.getContent())
                .build());

        User user = userRepository.findById(userId).orElse(null);
        return toResponse(review, user);
    }

    public Page<ReviewResponse> getReviews(Long activityId, int page, int size) {
        Page<Review> reviews = reviewRepository
                .findByActivityIdOrderByCreatedAtDesc(activityId, PageRequest.of(page, size));
        return reviews.map(r -> {
            User user = userRepository.findById(r.getUserId()).orElse(null);
            return toResponse(r, user);
        });
    }

    public AvgRatingResponse getAvgRating(Long activityId) {
        BigDecimal avg = reviewRepository.getAvgRatingByActivityId(activityId);
        long count = reviewRepository.countByActivityId(activityId);
        return AvgRatingResponse.builder()
                .avgRating(avg.setScale(1, RoundingMode.HALF_UP))
                .totalCount(count)
                .build();
    }

    private ReviewResponse toResponse(Review review, User user) {
        return ReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .content(review.getContent())
                .userId(review.getUserId())
                .userNickname(user != null ? user.getNickname() : "未知用户")
                .userAvatar(user != null ? user.getAvatar() : null)
                .createdAt(review.getCreatedAt() != null ? review.getCreatedAt().toString() : null)
                .build();
    }
}
