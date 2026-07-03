package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long totalActivities;
    private long pendingBusinesses;
    private long bannedUsers;
    private long activeUsers;
    private long businessUsers;
}
