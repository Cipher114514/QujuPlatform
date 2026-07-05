package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 群投票记录（谁投了哪个选项）
 */
@Entity
@Table(name = "team_vote_records",
       uniqueConstraints = @UniqueConstraint(columnNames = {"vote_id", "user_id", "option_index"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamVoteRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vote_id", nullable = false)
    private Long voteId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 选项索引 */
    @Column(name = "option_index", nullable = false)
    private Integer optionIndex;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
