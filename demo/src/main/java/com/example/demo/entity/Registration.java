package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "registrations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"activity_id", "user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long activityId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    @Builder.Default
    private Integer participants = 1;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "CONFIRMED";

    @Column(nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    private LocalDateTime cancelledAt;

    private LocalDateTime checkedInAt;

    @PrePersist
    void onCreate() {
        registeredAt = LocalDateTime.now();
    }
}
