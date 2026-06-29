package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "waitlist",
       uniqueConstraints = @UniqueConstraint(columnNames = {"activity_id", "user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaitlistEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long activityId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Integer queuePosition;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "WAITING";

    private LocalDateTime notifiedAt;

    private LocalDateTime confirmDeadline;

    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}
