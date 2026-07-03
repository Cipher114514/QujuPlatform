package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamJoinRequestResponse {

    private Long id;
    private Long teamId;
    private String teamName;
    private Long userId;
    private String nickname;
    private String avatar;
    private String message;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}
