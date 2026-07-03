package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GalleryUploadRequest {
    @NotBlank(message = "图片URL不能为空")
    private String imageUrl;
}
