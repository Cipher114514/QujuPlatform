package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long activityId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String content;

    /** 父评论ID，null表示主评论，非null表示回复 */
    private Long parentId;

    /** 举报状态: null=正常, REPORTED=已举报/审核中 */
    @Column(length = 20)
    private String reportStatus;

    /** 举报原因枚举 */
    @Column(length = 50)
    private String reportReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
