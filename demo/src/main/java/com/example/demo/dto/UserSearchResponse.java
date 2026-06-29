package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户搜索/发现响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchResponse {
    private Long id;
    private String nickname;
    private String avatar;
    private String bio;
    private String role;
    private Boolean isFollowing;
    private Boolean isFriend;
    private Long followersCount;
    private Long followingCount;
}
