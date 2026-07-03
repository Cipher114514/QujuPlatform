package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.ActivityMapResponse;
import com.example.demo.service.AmapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 地图相关接口 US-014: 地图模式查看活动分布
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class MapController {

    private final AmapService amapService;
    
    // 地球平均半径（米）
    private static final double EARTH_RADIUS = 6371000;

    /**
     * 获取地图活动数据 GET /api/map/activities
     */
    @GetMapping("/map/activities")
    public Result<List<ActivityMapResponse>> getMapActivities(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "5000") Integer radius
    ) {
        List<ActivityMapResponse> activities = amapService.getActivitiesForMap();

        // 分类筛选
        if (category != null && !category.isEmpty()) {
            activities = activities.stream()
                    .filter(a -> category.equals(a.getCategory()))
                    .collect(Collectors.toList());
        }
        
        // 距离筛选（仅当提供了用户位置时）
        if (lat != null && lng != null && radius > 0) {
            activities = activities.stream()
                    .filter(a -> {
                        if (a.getLat() == null || a.getLng() == null) {
                            return false;
                        }
                        double distance = calculateDistance(lat, lng, a.getLat(), a.getLng());
                        a.setDistance(formatDistance(distance));
                        return distance <= radius;
                    })
                    .collect(Collectors.toList());
        }

        return Result.ok(activities);
    }

    /**
     * 搜索附近活动 GET /api/map/search
     */
    @GetMapping("/map/search")
    public Result<List<ActivityMapResponse>> searchNearby(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "5000") Integer radius) {
        List<ActivityMapResponse> activities = amapService.getActivitiesForMap();

        // 距离筛选（仅当提供了用户位置时）
        if (lat != null && lng != null && radius > 0) {
            activities = activities.stream()
                    .filter(a -> {
                        if (a.getLat() == null || a.getLng() == null) {
                            return false;
                        }
                        double distance = calculateDistance(lat, lng, a.getLat(), a.getLng());
                        a.setDistance(formatDistance(distance));
                        return distance <= radius;
                    })
                    .collect(Collectors.toList());
        }

        return Result.ok(activities);
    }
    
    /**
     * 计算两点之间的距离（米）- 使用 Haversine 公式
     * @param lat1 起点纬度
     * @param lng1 起点经度
     * @param lat2 终点纬度
     * @param lng2 终点经度
     * @return 距离（米）
     */
    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return EARTH_RADIUS * c;
    }

    /**
     * 格式化距离显示
     */
    private String formatDistance(double meters) {
        if (meters >= 1000) {
            return String.format("%.1fkm", meters / 1000);
        }
        return String.format("%.0fm", meters);
    }

    /**
     * 获取活动详情（用于地图弹窗跳转） 复用已有的活动详情接口，这里只做重定向或兼容
     */
    @GetMapping("/map/activity/{id}")
    public Result<ActivityMapResponse> getActivityForMap(@PathVariable Long id) {
        // 调用 AmapService 获取单个活动的地图信息
        ActivityMapResponse activity = amapService.getActivityForMap(id);
        if (activity == null) {
            return Result.fail("活动不存在");
        }
        return Result.ok(activity);
    }
}
