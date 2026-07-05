package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteResponse {
    private Long id;
    private Long teamId;
    private Long creatorId;
    private String creatorNickname;
    private String creatorAvatar;
    private String title;
    private List<VoteOptionItem> options;
    private Boolean isMultiple;
    private String status;
    private Integer totalVotes;
    private Boolean hasVoted;
    private LocalDateTime deadline;
    private LocalDateTime createdAt;
    private LocalDateTime closedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VoteOptionItem {
        private int index;
        private String text;
        private int count;
    }
}
