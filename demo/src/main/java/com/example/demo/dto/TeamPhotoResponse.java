package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamPhotoResponse {

    private Long id;
    private Long teamId;
    private Long userId;
    private String nickname;
    private String avatar;
    private String imageUrl;
    private String description;
    private LocalDateTime createdAt;

    /** 当前用户是否可以删除该照片（队长或上传者本人） */
    private Boolean canDelete;
}
