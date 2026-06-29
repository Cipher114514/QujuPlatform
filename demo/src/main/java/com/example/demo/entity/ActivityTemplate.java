package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(length = 10)
    private String icon;

    @Column(nullable = false, length = 200)
    private String titleTemplate;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descriptionTemplate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
