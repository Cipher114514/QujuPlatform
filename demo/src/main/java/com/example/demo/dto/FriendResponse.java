package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendResponse {
    private Long id;
    private String nickname;
    private String avatar;
    private String status; // online / offline
    private LocalDateTime friendSince;
    @Builder.Default
    private String remark = null;
    @Builder.Default
    private String group = null;
    @Builder.Default
    private Boolean isBlocked = false;
}