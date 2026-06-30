package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BanUserRequest {
    private String reason;
    private LocalDateTime banUntil;  // null = 永久封禁
}
