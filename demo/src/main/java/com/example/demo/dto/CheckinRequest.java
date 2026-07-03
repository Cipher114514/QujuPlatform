package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CheckinRequest {
    @NotBlank(message = "签到凭证不能为空")
    private String token;
}
