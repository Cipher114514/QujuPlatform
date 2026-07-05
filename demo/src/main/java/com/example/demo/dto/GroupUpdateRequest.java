package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GroupUpdateRequest {
    @NotNull(message = "用户ID不能为空")
    private Long userId;
    
    private String group;  // 分组标签，可为空（表示清空分组）
}