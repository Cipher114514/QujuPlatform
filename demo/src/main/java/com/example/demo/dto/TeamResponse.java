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
public class TeamResponse {

    private Long id;
    private String name;
    private String description;
    private List<String> tags;
    private Boolean isPublic;
    private String coverImage;
    private Long leaderId;
    private String leaderNickname;
    private String leaderAvatar;
    private Integer memberCount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 群公告 */
    private String announcement;

    /** 当前用户在该小队的角色：null(未加入), leader(队长), admin(管理员), member(成员) */
    private String userRole;

    /** 当前用户的申请状态：null(无申请), PENDING(待审核), REJECTED(已拒绝), APPROVED(已批准) */
    private String requestStatus;
}
