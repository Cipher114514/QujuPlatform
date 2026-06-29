package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户列表项响应DTO（用于关注/粉丝列表）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListItemResponse {
    private Long id;
    private String nickname;
    private String avatar;
    private String bio;
    private Boolean isFollowing;   // 当前用户是否关注对方
    private Boolean isFollowedBy;   // 对方是否关注当前用户
    private Boolean isFriend;       // 是否是好友
    private String followedAt;      // 关注时间
}
