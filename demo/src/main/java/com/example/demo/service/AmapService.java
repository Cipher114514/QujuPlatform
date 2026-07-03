package com.example.demo.service;

import com.example.demo.dto.ActivityMapResponse;
import com.example.demo.entity.Activity;
import com.example.demo.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 高德地图服务
 * US-014: 地图模式查看活动分布
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AmapService {

    private final ActivityRepository activityRepository;
    private final RestTemplate restTemplate;

    @Value("${amap.api.key:}")
    private String amapApiKey;

    // TODO: 高德Web服务API基础URL，需要从配置文件读取或确认最新地址
    private static final String AMAP_GEOCODE_URL = "https://restapi.amap.com/v3/geocode/geo";
    private static final String AMAP_REGEocode_URL = "https://restapi.amap.com/v3/geocode/regeo";

    /**
     * 获取所有有位置信息的活动（用于地图展示）
     * 返回活动的基本信息和坐标
     */
    public List<ActivityMapResponse> getActivitiesForMap() {
        // TODO: 只获取状态为ACTIVE且location不为空的活动
        // TODO: 需要根据用户位置或默认城市过滤，目前返回全部
        List<Activity> activities = activityRepository.findAll();
        
        return activities.stream()
                .filter(activity -> activity.getLocation() != null && !activity.getLocation().isEmpty())
                .map(this::convertToMapResponse)
                .collect(Collectors.toList());
    }

    /**
     * 根据关键字搜索附近活动
     * TODO: 需要实现基于地理位置的搜索
     */
    public List<ActivityMapResponse> searchNearbyActivities(String keyword, Double lat, Double lng, Integer radius) {
        // TODO: 调用高德POI搜索API，或基于数据库地理位置查询
        // 目前返回所有活动，后续需要实现真正的附近搜索
        log.info("搜索附近活动: keyword={}, lat={}, lng={}, radius={}", keyword, lat, lng, radius);
        return getActivitiesForMap();
    }

    /**
     * 将活动实体转换为地图响应DTO
     */
    private ActivityMapResponse convertToMapResponse(Activity activity) {
        // TODO: 需要将活动地址转换为经纬度坐标
        // 方案1: 在创建/更新活动时调用高德地理编码API，存储坐标到数据库
        // 方案2: 每次请求时实时转换（性能较差）
        // 目前返回占位坐标
        
        // TODO: 如果activity中有存储坐标字段，直接使用
        // 如果没有，调用高德地理编码API转换
        Double lat = null;
        Double lng = null;
        
        // TODO: 实现地理编码转换
        // String location = activity.getLocation();
        // GeocodeResult result = geocode(location);
        // lat = result.getLat();
        // lng = result.getLng();
        
        return ActivityMapResponse.builder()
                .id(activity.getId())
                .title(activity.getTitle())
                .description(activity.getDescription())
                .location(activity.getLocation())
                .startTime(activity.getStartTime())
                .endTime(activity.getEndTime())
                .category(activity.getCategory())
                .currentParticipants(activity.getCurrentParticipants())
                .maxParticipants(activity.getMaxParticipants())
                .status(activity.getStatus())
                .coverImage(activity.getCoverImage())
                // TODO: 以下坐标需要从数据库获取或实时转换
                .lat(lat != null ? lat : 39.9042) // 默认北京坐标
                .lng(lng != null ? lng : 116.4074)
                .build();
    }

    /**
     * 地理编码：地址转坐标
     * TODO: 调用高德地理编码API
     */
    public String geocode(String address) {
        // TODO: 实现地理编码
        // 需要处理API Key、限流、异常等
        log.info("地理编码: {}", address);
        return "{\"status\":\"1\",\"geocodes\":[]}";
    }

    /**
     * 逆地理编码：坐标转地址
     * TODO: 调用高德逆地理编码API
     */
    public String regeocode(Double lat, Double lng) {
        log.info("逆地理编码: lat={}, lng={}", lat, lng);
        // TODO: 实现逆地理编码
        return "{\"status\":\"1\",\"regeocode\":{\"formatted_address\":\"\"}}";
    }
}