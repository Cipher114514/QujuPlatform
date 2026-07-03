package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 高德地理编码结果
 * 用于封装地址转坐标的返回结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeocodeResult {
    
    /**
     * 纬度
     */
    private Double lat;
    
    /**
     * 经度
     */
    private Double lng;
    
    /**
     * 格式化后的地址
     */
    private String formattedAddress;
}