package com.example.demo.service;

import com.example.demo.dto.ActivityMapResponse;
import com.example.demo.dto.GeocodeResult;
import com.example.demo.entity.Activity;
import com.example.demo.repository.ActivityRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

    @Value("${app.amap.web-api-key:}")
    private String amapApiKey;

    private static final String AMAP_GEOCODE_URL = "https://restapi.amap.com/v3/geocode/geo";
    private static final String AMAP_REGEOCODE_URL = "https://restapi.amap.com/v3/geocode/regeo";

    /**
     * 地理编码：地址转坐标
     * @param address 地址描述（如"北京市朝阳区朝阳公园"）
     * @return GeocodeResult 包含经纬度和格式化地址
     */
    public GeocodeResult geocode(String address) {
        return geocode(address, null);
    }

    /**
     * 地理编码：地址转坐标（带城市限定）
     * @param address 地址描述
     * @param city 城市名（如"北京"），用于限定搜索范围，提高精度
     * @return GeocodeResult 包含经纬度和格式化地址
     */
    public GeocodeResult geocode(String address, String city) {
        if (address == null || address.isBlank()) {
            log.warn("地址为空，无法进行地理编码");
            return null;
        }

        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(AMAP_GEOCODE_URL)
                    .queryParam("key", amapApiKey)
                    .queryParam("address", address)
                    .queryParam("output", "JSON");
            if (city != null && !city.isBlank()) {
                builder.queryParam("city", city);
            }
            String url = builder.build().toUriString();

            log.debug("调用高德地理编码API: {}", url);
            String response = restTemplate.getForObject(url, String.class);
            
            // 解析响应
            JsonNode root = objectMapper.readTree(response);
            String status = root.path("status").asText();
            
            if (!"1".equals(status)) {
                String info = root.path("info").asText("未知错误");
                log.error("地理编码失败: {}", info);
                return null;
            }

            JsonNode geocodes = root.path("geocodes");
            if (geocodes.isArray() && geocodes.size() > 0) {
                JsonNode first = geocodes.get(0);
                String location = first.path("location").asText();
                String formattedAddress = first.path("formatted_address").asText();
                
                // 解析经纬度（格式："经度,纬度"）
                String[] parts = location.split(",");
                if (parts.length == 2) {
                    double lng = Double.parseDouble(parts[0]);
                    double lat = Double.parseDouble(parts[1]);
                    return new GeocodeResult(lat, lng, formattedAddress);
                }
            }
            
            log.warn("地址 '{}' 未找到对应坐标", address);
            return null;
            
        } catch (Exception e) {
            log.error("地理编码异常: address={}, error={}", address, e.getMessage(), e);
            return null;
        }
    }

    /**
     * 逆地理编码：坐标转地址
     * @param lat 纬度
     * @param lng 经度
     * @return 格式化后的地址
     */
    public String regeocode(Double lat, Double lng) {
        if (lat == null || lng == null) {
            return null;
        }

        try {
            String url = UriComponentsBuilder.fromUriString(AMAP_REGEOCODE_URL)
                    .queryParam("key", amapApiKey)
                    .queryParam("location", lng + "," + lat)
                    .queryParam("output", "JSON")
                    .build()
                    .toUriString();

            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            if (!"1".equals(root.path("status").asText())) {
                return null;
            }
            
            return root.path("regeocode").path("formatted_address").asText(null);
            
        } catch (Exception e) {
            log.error("逆地理编码异常: lat={}, lng={}, error={}", lat, lng, e.getMessage(), e);
            return null;
        }
    }

    /**
     * 为单个活动填充坐标信息（如果已有坐标则跳过）
     * @param activity 活动对象（会直接修改）
     */
    public void fillActivityCoordinates(Activity activity) {
        if (activity == null) {
            return;
        }
        
        // 如果已有坐标，跳过
        if (activity.getLatitude() != null && activity.getLongitude() != null) {
            return;
        }
        
        String location = activity.getLocation();
        if (location == null || location.isBlank()) {
            return;
        }
        
        GeocodeResult result = geocode(location);
        if (result != null) {
            activity.setLatitude(result.getLat());
            activity.setLongitude(result.getLng());
            log.info("活动 '{}' 坐标获取成功: ({}, {})", activity.getTitle(), result.getLat(), result.getLng());
        } else {
            log.warn("活动 '{}' 坐标获取失败，地址: {}", activity.getTitle(), location);
        }
    }

    /**
     * 批量填充活动坐标（仅处理没有坐标的活动）
     * @param activities 活动列表（会直接修改）
     */
    public void fillActivitiesCoordinates(List<Activity> activities) {
        if (activities == null || activities.isEmpty()) {
            return;
        }
        
        activities.forEach(this::fillActivityCoordinates);
    }

    /**
     * 获取所有有位置信息的活动（用于地图展示）
     * @return 地图活动数据列表
     */
    public List<ActivityMapResponse> getActivitiesForMap() {
        // 获取状态为ACTIVE且location不为空的活动
        List<Activity> activities = activityRepository.findAll().stream()
                .filter(a -> "ACTIVE".equals(a.getStatus()))
                .filter(a -> a.getLocation() != null && !a.getLocation().isBlank())
                .collect(Collectors.toList());
        
        // 为没有坐标的活动填充坐标
        fillActivitiesCoordinates(activities);
        
        return activities.stream()
                .map(this::convertToMapResponse)
                .collect(Collectors.toList());
    }

    /**
     * 将活动实体转换为地图响应DTO
     */
    private ActivityMapResponse convertToMapResponse(Activity activity) {
        // 如果活动还没有坐标，尝试获取（兜底）
        if (activity.getLatitude() == null || activity.getLongitude() == null) {
            fillActivityCoordinates(activity);
        }
        
        // 如果还是没有坐标，使用默认值（北京坐标）
        Double lat = activity.getLatitude() != null ? activity.getLatitude() : 39.9042;
        Double lng = activity.getLongitude() != null ? activity.getLongitude() : 116.4074;
        
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
                .lat(lat)
                .lng(lng)
                .build();
    }

    /**
     * 根据活动ID获取地图展示信息
     * @param activityId 活动ID
     * @return 地图活动数据
     */
    public ActivityMapResponse getActivityForMap(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElse(null);
        
        if (activity == null) {
            return null;
        }
        
        // 如果活动没有坐标，尝试获取
        fillActivityCoordinates(activity);
        
        return convertToMapResponse(activity);
    }
}