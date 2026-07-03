package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckinStatusResponse {
    private Long activityId;
    private Long userId;
    private boolean registered;
    private boolean checkedIn;
    private String status;
    private String checkedInAt;
}
