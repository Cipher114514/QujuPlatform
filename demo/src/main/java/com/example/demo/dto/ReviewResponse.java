package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Integer rating;
    private String content;
    private Long userId;
    private String userNickname;
    private String userAvatar;
    private String createdAt;
}
