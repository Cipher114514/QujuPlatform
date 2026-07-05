package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UploadPhotoRequest {

    @NotBlank(message = "图片URL不能为空")
    private String imageUrl;

    private String description;
}
