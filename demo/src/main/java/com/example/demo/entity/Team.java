package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 兴趣小队实体
 */
@Entity
@Table(name = "teams",
       uniqueConstraints = @UniqueConstraint(columnNames = {"name"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 小队名称（全局唯一） */
    @Column(nullable = false, unique = true, length = 20)
    private String name;

    /** 小队简介 */
    @Column(length = 200)
    private String description;

    /** 兴趣标签，JSON数组字符串 */
    @Column(length = 500)
    private String tags;

    /** 公开小队(一键加入) or 审核小队(需队长审批) */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isPublic = true;

    /** 小队封面图片URL */
    @Column(length = 500)
    private String coverImage;

    /** 队长用户ID */
    @Column(name = "leader_id", nullable = false)
    private Long leaderId;

    /** 成员数量缓存 */
    @Column(nullable = false)
    @Builder.Default
    private Integer memberCount = 1;

    /** 状态: ACTIVE(正常), DISBANDED(已解散) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TeamStatus status = TeamStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TeamStatus {
        ACTIVE, DISBANDED
    }
}
