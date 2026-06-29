package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 关注请求DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowRequest {
    /** 目标用户ID */
    private Long userId;
}
