package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiGenerateRequest {
    @NotBlank(message = "活动主题不能为空")
    private String topic;

    @NotBlank(message = "活动分类不能为空")
    private String category;
}
