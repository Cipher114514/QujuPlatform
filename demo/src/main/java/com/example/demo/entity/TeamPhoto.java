package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 小队相册照片实体
 */
@Entity
@Table(name = "team_photos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 所属小队ID */
    @Column(name = "team_id", nullable = false)
    private Long teamId;

    /** 上传者用户ID */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 图片URL */
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    /** 照片描述（可选） */
    @Column(length = 200)
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
