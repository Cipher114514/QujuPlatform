package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.ActivityMapResponse;
import com.example.demo.service.AmapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 地图相关接口
 * US-014: 地图模式查看活动分布
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class MapController {

    private final AmapService amapService;

    /**
     * 获取地图活动数据
     * GET /api/map/activities
     */
    @GetMapping("/map/activities")
    public Result<List<ActivityMapResponse>> getMapActivities() {
        // TODO: 增加参数：经纬度、半径、分类过滤等
        List<ActivityMapResponse> activities = amapService.getActivitiesForMap();
        return Result.ok(activities);
    }

    /**
     * 搜索附近活动
     * GET /api/map/search
     */
    @GetMapping("/map/search")
    public Result<List<ActivityMapResponse>> searchNearby(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "5000") Integer radius) {
        // TODO: 实现基于位置的搜索
        List<ActivityMapResponse> activities = amapService.searchNearbyActivities(keyword, lat, lng, radius);
        return Result.ok(activities);
    }

    /**
     * 获取活动详情（用于地图弹窗跳转）
     * 复用已有的活动详情接口，这里只做重定向或兼容
     */
    @GetMapping("/map/activity/{id}")
    public Result<ActivityMapResponse> getActivityForMap(@PathVariable Long id) {
        // TODO: 获取单个活动的地图展示信息
        // 实际应该调用ActivityService获取详情，然后转换为地图格式
        // 这里暂不实现，由前端直接跳转到活动详情页
        return Result.fail("请直接跳转到活动详情页");
    }
}