package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FriendHandleRequest {

    @NotBlank(message = "操作类型不能为空")
    private String status; // accept / reject
}