package com.example.demo.controller;

import com.example.demo.common.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 前端配置接口
 */
@RestController
@RequiredArgsConstructor
public class ConfigController {

    @Value("${app.amap.js-api-key:}")
    private String amapJsApiKey;

    @Value("${app.amap.security-code:}")
    private String amapSecurityCode;

    @Value("${app.amap.js-version:2.0}")
    private String amapJsVersion;

    /**
     * 获取高德地图配置
     * GET /config/map
     */
    @GetMapping("/config/map")
    public Result<Map<String, String>> getAmapConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("jsApiKey", amapJsApiKey);
        config.put("securityCode", amapSecurityCode);
        config.put("jsVersion", amapJsVersion);
        return Result.ok(config);
    }
}