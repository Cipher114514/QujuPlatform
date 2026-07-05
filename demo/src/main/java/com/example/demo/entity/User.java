package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    /** 全平台唯一昵称 */
    @Column(nullable = false, unique = true)
    private String nickname;

    private String phone;

    private String avatar;

    @Column(length = 500)
    private String bio;

    /** 性别: male, female, other */
    private String gender;

    private String birthday;

    /** 兴趣标签, JSON数组字符串 */
    @Column(length = 1000)
    private String tags;

    /** 角色: USER, BUSINESS, ADMIN */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    /** 状态: ACTIVE, PENDING, BANNED */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    // ---- 商家专用字段 ----
    /** 营业执照图片URL */
    @Column(length = 500)
    private String businessLicense;

    /** 统一社会信用代码（18位） */
    @Column(unique = true)
    private String creditCode;

    /** 商家地址 */
    private String address;

    /** 商家关注活动领域 */
    @Column(length = 500)
    private String businessFields;

    /** 封禁原因 */
    private String banReason;

    /** 封禁截止时间 */
    private LocalDateTime banUntil;

    /** 登录连续失败次数 */
    @Builder.Default
    private int loginFailCount = 0;

    /** 登录临时锁定截止时间 */
    private LocalDateTime lockedUntil;

    @Column(unique = true, length = 100)
    private String activationToken;

    private LocalDateTime activationTokenExpiresAt;

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

    public enum UserRole {
        USER, BUSINESS, ADMIN
    }

    public enum UserStatus {
        ACTIVE, PENDING, BANNED
    }
}
