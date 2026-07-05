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

    /** 扩展元数据(JSON): 用于@提醒、文件URL等 */
    @Column(length = 2000)
    private String metadata;

    @Column(nullable = false, updatable = false)
    private LocalDateTime sentAt;

    private LocalDateTime readAt;

    private LocalDateTime recalledAt;

    @PrePersist
    void onCreate() {
        sentAt = LocalDateTime.now();
    }
}
