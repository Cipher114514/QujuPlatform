package com.example.demo.controller;

import com.example.demo.common.Result;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

/**
 * 高德地图 Web API v3 代理。
 */
@RestController
@RequestMapping("/api/map")
public class MapProxyController {

    private static final Logger log = LoggerFactory.getLogger(MapProxyController.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.amap.web-api-key}")
    private String amapKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();

    /**
     * 逆地理编码 v3：经纬度 → 地址 + 周边 POI
     */
    @GetMapping("/regeo")
    public Result<Map<String, Object>> regeo(@RequestParam("lng") double lng,
                                             @RequestParam("lat") double lat) {
        try {
            String url = "https://restapi.amap.com/v3/geocode/regeo?key=" + amapKey
                + "&location=" + String.format("%.6f,%.6f", lng, lat)
                + "&output=JSON&radius=1000&extensions=all";
            log.info("AMap regeo v3: lng={}, lat={}", lng, lat);
            String resp = httpGet(url);
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(resp, Map.class);
            log.info("AMap regeo v3 response: status={}, info={}", map.get("status"), map.get("info"));
            return Result.ok(map);
        } catch (Exception e) {
            log.error("AMap regeo v3 failed", e);
            return Result.fail("逆地理编码失败: " + e.getMessage());
        }
    }

    /**
     * 周边搜索 v3：获取某坐标周围 POI
     */
    @GetMapping("/around")
    public Result<Map<String, Object>> around(@RequestParam("lng") double lng,
                                              @RequestParam("lat") double lat) {
        try {
            String url = "https://restapi.amap.com/v3/place/around?key=" + amapKey
                + "&location=" + String.format("%.6f,%.6f", lng, lat)
                + "&radius=500&offset=10&page=1&output=JSON&extensions=all";
            log.info("AMap around v3: lng={}, lat={}", lng, lat);
            String resp = httpGet(url);
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(resp, Map.class);
            log.info("AMap around v3 response: status={}, count={}", map.get("status"), map.get("count"));
            return Result.ok(map);
        } catch (Exception e) {
            log.error("AMap around v3 failed", e);
            return Result.fail("周边搜索失败: " + e.getMessage());
        }
    }

    /**
     * 地点关键字搜索 v3
     */
    @GetMapping("/place-search")
    public Result<Map<String, Object>> placeSearch(@RequestParam("keywords") String keywords,
                                                    @RequestParam(value = "city", defaultValue = "北京") String city) {
        try {
            String url = "https://restapi.amap.com/v3/place/text?key=" + amapKey
                + "&keywords=" + URLEncoder.encode(keywords, StandardCharsets.UTF_8)
                + "&city=" + URLEncoder.encode(city, StandardCharsets.UTF_8)
                + "&offset=10&page=1&extensions=base&output=json";
            log.info("========== AMap place-search ==========");
            log.info("请求URL: {}", url);
            log.info("原始keywords: [{}], city: [{}]", keywords, city);

            String resp = httpGet(url);
            log.info("原始响应(前500): {}", resp.substring(0, Math.min(500, resp.length())));

            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(resp, Map.class);
            log.info("响应: status={}, info={}, count={}", map.get("status"), map.get("info"), map.get("count"));

            java.util.List<Map<String, Object>> pois = (java.util.List<Map<String, Object>>) map.get("pois");
            if (pois != null) {
                for (int i = 0; i < Math.min(pois.size(), 5); i++) {
                    Map<String, Object> p = pois.get(i);
                    log.info("  POI[{}]: name=[{}], address=[{}], pname=[{}], cityname=[{}]",
                        i, p.get("name"), p.get("address"), p.get("pname"), p.get("cityname"));
                }
            }
            log.info("========================================");
            return Result.ok(map);
        } catch (Exception e) {
            log.error("AMap place-search v3 failed", e);
            return Result.fail("地点搜索失败: " + e.getMessage());
        }
    }

    private String httpGet(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(Duration.ofSeconds(10))
            .header("User-Agent", "DemoApp/1.0")
            .GET()
            .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
}
