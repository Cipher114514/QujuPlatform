package com.example.demo.repository;

import com.example.demo.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByConversationIdOrderBySentAtDesc(Long conversationId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversationId = :convId AND m.senderId != :userId AND m.status = 'DELIVERED'")
    long countUnread(@Param("convId") Long convId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.status = 'READ', m.readAt = CURRENT_TIMESTAMP WHERE m.conversationId = :convId AND m.senderId != :userId AND m.status = 'DELIVERED'")
    int markAsRead(@Param("convId") Long convId, @Param("userId") Long userId);

    @Query("SELECT m FROM Message m WHERE m.conversationId = :convId AND m.sentAt > :since ORDER BY m.sentAt ASC")
    List<Message> findNewMessages(@Param("convId") Long convId, @Param("since") LocalDateTime since);

    /** 小队群聊消息历史（分页，倒序） */
    Page<Message> findByTeamIdOrderBySentAtDesc(Long teamId, Pageable pageable);

    /** 小队群聊新消息轮询 */
    @Query("SELECT m FROM Message m WHERE m.teamId = :teamId AND m.sentAt > :since ORDER BY m.sentAt ASC")
    List<Message> findNewTeamMessages(@Param("teamId") Long teamId, @Param("since") LocalDateTime since);
}
