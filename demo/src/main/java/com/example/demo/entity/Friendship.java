package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 好友关系实体
 * 对应数据库表: friendships
 */
@Entity
@Table(name = "friendships")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 发起好友请求的用户ID */
    @Column(name = "from_user_id", nullable = false)
    private Long fromUserId;

    /** 接收好友请求的用户ID */
    @Column(name = "to_user_id", nullable = false)
    private Long toUserId;

    /** 状态: PENDING(待处理), ACCEPTED(已接受), REJECTED(已拒绝) */
    @Column(nullable = false)
    private String status;

    /** 发起方对好友的备注 */
    @Column(name = "from_note", length = 100)
    private String fromNote;

    /** 接收方对好友的备注 */
    @Column(name = "to_note", length = 100)
    private String toNote;

    /** 发起方的分组 */
    @Column(name = "from_group", length = 50)
    private String fromGroup;

    /** 接收方的分组 */
    @Column(name = "to_group", length = 50)
    private String toGroup;

    /** 创建时间 */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 更新时间 */
    @Column(name = "updated_at", nullable = false)
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

    public enum FriendshipStatus {
        PENDING, ACCEPTED, REJECTED
    }
}
