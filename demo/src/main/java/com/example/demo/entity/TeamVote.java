package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 小队群投票实体
 */
@Entity
@Table(name = "team_votes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;

    /** 投票标题 */
    @Column(nullable = false, length = 200)
    private String title;

    /** 选项列表，JSON数组字符串  [{"index":0,"text":"选项A","count":0}] */
    @Column(nullable = false, length = 2000)
    private String options;

    /** 是否允许多选 */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isMultiple = false;

    /** 状态: ACTIVE(进行中), CLOSED(已结束) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private VoteStatus status = VoteStatus.ACTIVE;

    /** 投票截止时间（null表示手动关闭） */
    private LocalDateTime deadline;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime closedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum VoteStatus {
        ACTIVE, CLOSED
    }
}
