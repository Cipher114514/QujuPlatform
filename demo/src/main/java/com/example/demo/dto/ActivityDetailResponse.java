package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ActivityDetailResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String startTime;
    private String endTime;
    private String location;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private BigDecimal fee;
    private String status;
    private List<String> tags;
    private List<String> images;
    private String coverImage;
    private Long creatorId;
    private String registrationDeadline;
    private String createdAt;
    private CreatorInfo creator;
    private MyRegistrationInfo myRegistration;

    @Data
    @Builder
    public static class CreatorInfo {
        private Long id;
        private String nickname;
        private String avatar;
    }

    @Data
    @Builder
    public static class MyRegistrationInfo {
        private Long id;
        private String status;
    }
}
