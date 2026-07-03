package com.example.demo.dto;

import com.example.demo.entity.Activity;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ActivitySummaryResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String tags;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private BigDecimal fee;
    private String status;
    private Long creatorId;
    private String creatorName;
    private String coverImage;

    public static ActivitySummaryResponse from(Activity activity, String creatorName) {
        return ActivitySummaryResponse.builder()
                .id(activity.getId())
                .title(activity.getTitle())
                .description(activity.getDescription())
                .category(activity.getCategory())
                .tags(activity.getTags())
                .startTime(activity.getStartTime())
                .endTime(activity.getEndTime())
                .location(activity.getLocation())
                .maxParticipants(activity.getMaxParticipants())
                .currentParticipants(activity.getCurrentParticipants())
                .fee(activity.getFee())
                .status(activity.getStatus())
                .creatorId(activity.getCreatorId())
                .creatorName(creatorName)
                .coverImage(activity.getCoverImage())
                .build();
    }
}
