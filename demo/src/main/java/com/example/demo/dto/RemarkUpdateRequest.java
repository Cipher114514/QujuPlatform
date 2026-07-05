package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RemarkUpdateRequest {
    @NotNull(message = "用户ID不能为空")
    private Long userId;
    
    private String remark;  // 备注，可为空（表示清空备注）
}