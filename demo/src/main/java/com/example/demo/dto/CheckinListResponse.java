package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckinListResponse {
    private int total;
    private int checkedInCount;
    private int uncheckedCount;
    private List<CheckinUserItem> checkedInUsers;
    private List<CheckinUserItem> uncheckedUsers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckinUserItem {
        private Long userId;
        private String nickname;
        private String avatar;
        private String registeredAt;
        private String checkedInAt;
    }
}
