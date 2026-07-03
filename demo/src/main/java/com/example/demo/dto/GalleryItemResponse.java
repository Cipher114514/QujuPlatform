package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GalleryItemResponse {
    private Long id;
    private String imageUrl;
    private String createdAt;
}
