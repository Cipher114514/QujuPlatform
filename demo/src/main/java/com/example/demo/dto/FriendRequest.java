package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FriendRequest {

    @NotNull(message = "用户ID不能为空")
    private Long userId;
}