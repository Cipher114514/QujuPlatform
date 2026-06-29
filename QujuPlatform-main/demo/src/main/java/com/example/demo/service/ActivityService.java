package com.example.demo.service;

import com.example.demo.dto.ActivitySummaryResponse;
import com.example.demo.entity.Activity;
import com.example.demo.entity.User;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public Page<ActivitySummaryResponse> searchActivities(String keyword,
                                                          String category,
                                                          String tag,
                                                          LocalDateTime startFrom,
                                                          LocalDateTime startTo,
                                                          int page,
                                                          int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 30);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Activity> activities = activityRepository.findAll(buildSpec(keyword, category, tag, startFrom, startTo), pageable);
        Map<Long, User> creators = loadCreators(activities);

        return activities.map(activity -> {
            User creator = creators.get(activity.getCreatorId());
            String creatorName = creator == null ? "未知发起人" : creator.getNickname();
            return ActivitySummaryResponse.from(activity, creatorName);
        });
    }

    private Specification<Activity> buildSpec(String keyword,
                                              String category,
                                              String tag,
                                              LocalDateTime startFrom,
                                              LocalDateTime startTo) {
        return (root, query, cb) -> {
            Predicate predicate = cb.equal(root.get("status"), "ACTIVE");

            if (StringUtils.hasText(keyword)) {
                String like = "%" + keyword.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), like);
                Predicate descriptionLike = cb.like(cb.lower(root.get("description")), like);
                predicate = cb.and(predicate, cb.or(titleLike, descriptionLike));
            }

            if (StringUtils.hasText(category)) {
                predicate = cb.and(predicate, cb.equal(root.get("category"), category.trim()));
            }

            if (StringUtils.hasText(tag)) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("tags")), "%" + tag.trim().toLowerCase() + "%"));
            }

            if (startFrom != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("startTime"), startFrom));
            }

            if (startTo != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("startTime"), startTo));
            }

            return predicate;
        };
    }

    private Map<Long, User> loadCreators(Page<Activity> activities) {
        var ids = activities.getContent().stream()
                .map(Activity::getCreatorId)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return new HashMap<>();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }
}
