package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 地图活动展示DTO
 * US-014: 地图模式查看活动分布
 */
@Data
@Builder
public class ActivityMapResponse {
    private Long id;
    private String title;
    private String description;
    private String location;          // 地址描述
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String category;
    private Integer currentParticipants;
    private Integer maxParticipants;
    private String status;
    private String coverImage;
    
    // 经纬度坐标（用于地图标记）
    private Double lat;
    private Double lng;
    
    // 额外信息
    private String distance;           // 距离用户多远，格式如"2.3km"
}