package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long conversationId;

    /** 小队群聊ID（群聊消息时使用，私聊时为null） */
    private Long teamId;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String type = "TEXT";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "DELIVERED";

    @Column(nullable = false, updatable = false)
    private LocalDateTime sentAt;

    private LocalDateTime readAt;

    private LocalDateTime recalledAt;

    // ===== 文件消息字段 =====
    /** 文件访问URL */
    @Column(length = 500)
    private String fileUrl;

    /** 文件名 */
    @Column(length = 200)
    private String fileName;

    /** 文件大小（字节） */
    private Long fileSize;

    @PrePersist
    void onCreate() {
        sentAt = LocalDateTime.now();
    }
}
