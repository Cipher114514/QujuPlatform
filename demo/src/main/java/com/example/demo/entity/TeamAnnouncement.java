package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 小队群公告实体（成员 D）
 */
@Entity
@Table(name = "team_announcements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamAnnouncement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false, unique = true)
    private Long teamId;

    @Column(nullable = false, length = 500)
    private String content;

    @Column(name = "publisher_id", nullable = false)
    private Long publisherId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
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
}
