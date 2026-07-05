package com.example.demo.service;

import com.example.demo.entity.Conversation;
import com.example.demo.entity.Message;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.ConversationRepository;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ---------- 会话列表 ----------

    public List<ConversationItem> getConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findByUserId(userId);
        List<ConversationItem> items = new ArrayList<>();
        for (Conversation c : conversations) {
            boolean isUser1 = c.getUser1Id().equals(userId);
            Long targetUserId = isUser1 ? c.getUser2Id() : c.getUser1Id();
            int unread = isUser1 ? c.getUnreadCountU1() : c.getUnreadCountU2();

            User targetUser = userRepository.findById(targetUserId).orElse(null);
            items.add(ConversationItem.builder()
                    .conversationId(c.getId())
                    .targetUser(targetUser == null ? null : TargetUser.builder()
                            .id(targetUser.getId())
                            .nickname(targetUser.getNickname())
                            .avatar(targetUser.getAvatar())
                            .build())
                    .lastMessage(c.getLastMessage())
                    .unreadCount(Math.max(unread, 0))
                    .updatedAt(c.getUpdatedAt() != null ? c.getUpdatedAt() : c.getCreatedAt())
                    .build());
        }
        return items;
    }

    // ---------- 消息历史 ----------

    @Transactional
    public MessagePage getMessages(Long userId, Long conversationId, int page, int size) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException(404, "会话不存在"));

        if (!conv.getUser1Id().equals(userId) && !conv.getUser2Id().equals(userId)) {
            throw new BusinessException(403, "无权查看该会话");
        }

        Page<Message> msgPage = messageRepository
                .findByConversationIdOrderBySentAtDesc(conversationId, PageRequest.of(page - 1, size));

        markAsRead(userId, conversationId);

        List<MessageItem> list = msgPage.getContent().stream()
                .map(m -> MessageItem.builder()
                        .id(m.getId())
                        .senderId(m.getSenderId())
                        .content(m.getContent())
                        .type(m.getType())
                        .status(m.getStatus())
                        .sentAt(m.getSentAt())
                        .recalledAt(m.getRecalledAt())
                        .fileUrl(m.getFileUrl())
                        .fileName(m.getFileName())
                        .fileSize(m.getFileSize())
                        .build())
                .collect(Collectors.toList());

        return MessagePage.builder()
                .list(list)
                .pagination(Pagination.builder()
                        .page(page)
                        .size(size)
                        .total(msgPage.getTotalElements())
                        .pages(msgPage.getTotalPages())
                        .build())
                .build();
    }

    // ---------- 发送消息 ----------

    @Transactional
    public MessageItem sendMessage(Long senderId, Long targetUserId, String content) {
        if (senderId.equals(targetUserId)) {
            throw new BusinessException("不能给自己发消息");
        }

        if (content == null || content.isBlank()) {
            throw new BusinessException("消息内容不能为空");
        }

        if (content.length() > 2000) {
            throw new BusinessException("消息内容不能超过2000字");
        }

        if (!userRepository.existsById(targetUserId)) {
            throw new BusinessException(404, "目标用户不存在");
        }

        Long u1 = Math.min(senderId, targetUserId);
        Long u2 = Math.max(senderId, targetUserId);

        Conversation conv = conversationRepository.findByUser1IdAndUser2Id(u1, u2)
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .user1Id(u1)
                            .user2Id(u2)
                            .unreadCountU1(0)
                            .unreadCountU2(0)
                            .build();
                    return conversationRepository.save(newConv);
                });

        Message msg = Message.builder()
                .conversationId(conv.getId())
                .senderId(senderId)
                .content(content)
                .type("TEXT")
                .status("DELIVERED")
                .build();
        msg = messageRepository.save(msg);

        conv.setLastMessage(content.length() > 100 ? content.substring(0, 100) : content);
        conv.setLastMessageAt(msg.getSentAt());
        if (conv.getUser1Id().equals(senderId)) {
            conv.setUnreadCountU2(conv.getUnreadCountU2() + 1);
        } else {
            conv.setUnreadCountU1(conv.getUnreadCountU1() + 1);
        }
        conversationRepository.save(conv);

        MessageItem result = MessageItem.builder()
                .id(msg.getId())
                .senderId(msg.getSenderId())
                .content(msg.getContent())
                .type(msg.getType())
                .status(msg.getStatus())
                .sentAt(msg.getSentAt())
                .conversationId(conv.getId())
                .fileUrl(msg.getFileUrl())
                .fileName(msg.getFileName())
                .fileSize(msg.getFileSize())
                .build();

        // WebSocket 实时推送给接收方
        messagingTemplate.convertAndSendToUser(
                targetUserId.toString(), "/queue/messages", result);
        log.info("WS推送: sender={} -> receiver={}, msgId={}", senderId, targetUserId, msg.getId());

        return result;
    }

    // ---------- 标记已读 ----------

    @Transactional
    public void markAsRead(Long userId, Long conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException(404, "会话不存在"));

        if (!conv.getUser1Id().equals(userId) && !conv.getUser2Id().equals(userId)) {
            throw new BusinessException(403, "无权操作该会话");
        }

        messageRepository.markAsRead(conversationId, userId);

        if (conv.getUser1Id().equals(userId)) {
            conv.setUnreadCountU1(0);
        } else {
            conv.setUnreadCountU2(0);
        }
        conversationRepository.save(conv);
    }

    // ---------- 轮询新消息 ----------

    public List<MessageItem> getNewMessages(Long userId, Long conversationId, LocalDateTime since) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException(404, "会话不存在"));

        if (!conv.getUser1Id().equals(userId) && !conv.getUser2Id().equals(userId)) {
            throw new BusinessException(403, "无权查看该会话");
        }

        return messageRepository.findNewMessages(conversationId, since).stream()
                .map(m -> MessageItem.builder()
                        .id(m.getId())
                        .senderId(m.getSenderId())
                        .content(m.getContent())
                        .type(m.getType())
                        .status(m.getStatus())
                        .sentAt(m.getSentAt())
                        .recalledAt(m.getRecalledAt())
                        .fileUrl(m.getFileUrl())
                        .fileName(m.getFileName())
                        .fileSize(m.getFileSize())
                        .build())
                .collect(Collectors.toList());
    }

    // ---------- 撤回消息（私聊）----------

    @Transactional
    public MessageItem recallMessage(Long userId, Long messageId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new BusinessException(404, "消息不存在"));

        if (!msg.getSenderId().equals(userId)) {
            throw new BusinessException(403, "只能撤回自己发送的消息");
        }

        if (msg.getRecalledAt() != null) {
            throw new BusinessException("消息已被撤回");
        }

        // 检查是否在2分钟内
        if (msg.getSentAt().plusMinutes(2).isBefore(LocalDateTime.now())) {
            throw new BusinessException("超过2分钟无法撤回");
        }

        msg.setRecalledAt(LocalDateTime.now());
        msg.setContent("消息已被撤回");
        msg.setFileUrl(null);
        msg.setFileName(null);
        msg.setFileSize(null);
        messageRepository.save(msg);

        // 构建撤回事件
        MessageItem recallEvent = MessageItem.builder()
                .id(msg.getId())
                .conversationId(msg.getConversationId())
                .senderId(msg.getSenderId())
                .content("消息已被撤回")
                .type("RECALL")
                .status(msg.getStatus())
                .sentAt(msg.getSentAt())
                .recalledAt(msg.getRecalledAt())
                .build();

        // WS 推送撤回事件给双方
        Conversation conv = conversationRepository.findById(msg.getConversationId()).orElse(null);
        if (conv != null) {
            Long otherUserId = conv.getUser1Id().equals(userId) ? conv.getUser2Id() : conv.getUser1Id();
            messagingTemplate.convertAndSendToUser(otherUserId.toString(), "/queue/messages", recallEvent);
            messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/messages", recallEvent);

            // 更新会话预览：如果撤回的是最后一条消息，更新lastMessage
            Page<Message> latestPage = messageRepository
                    .findByConversationIdOrderBySentAtDesc(msg.getConversationId(), PageRequest.of(0, 1));
            if (!latestPage.getContent().isEmpty()
                    && latestPage.getContent().get(0).getId().equals(msg.getId())) {
                conv.setLastMessage("消息已被撤回");
                conversationRepository.save(conv);
            }
        }

        log.info("用户 {} 撤回了私聊消息 msgId={}", userId, messageId);
        return recallEvent;
    }

    // ---------- 转发消息（私聊）----------

    @Transactional
    public MessageItem forwardMessage(Long userId, Long messageId, Long targetUserId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new BusinessException(404, "消息不存在"));

        // 已被撤回的消息无法转发
        if (msg.getRecalledAt() != null) {
            throw new BusinessException("已被撤回的消息无法转发");
        }

        // 只能转发自己参与的消息（发送方或接收方均可）
        Conversation origConv = conversationRepository.findById(msg.getConversationId()).orElse(null);
        boolean isParticipant = origConv != null
                && (origConv.getUser1Id().equals(userId) || origConv.getUser2Id().equals(userId));
        if (!isParticipant && !msg.getSenderId().equals(userId)) {
            throw new BusinessException(403, "无权转发该消息");
        }

        String forwardContent = msg.getContent();
        // 如果是文件消息，连同文件信息一起转发
        return sendMessage(userId, targetUserId, forwardContent);
    }

    // ===================== 内部响应类型 =====================

    @Data @Builder
    public static class ConversationItem {
        private Long conversationId;
        private TargetUser targetUser;
        private String lastMessage;
        private int unreadCount;
        private LocalDateTime updatedAt;
    }

    @Data @Builder
    public static class TargetUser {
        private Long id;
        private String nickname;
        private String avatar;
    }

    @Data @Builder
    public static class MessageItem {
        private Long id;
        private Long senderId;
        private Long conversationId;
        private String content;
        private String type;
        private String status;
        private LocalDateTime sentAt;
        private LocalDateTime recalledAt;
        private String fileUrl;
        private String fileName;
        private Long fileSize;
    }

    @Data @Builder
    public static class MessagePage {
        private List<MessageItem> list;
        private Pagination pagination;
    }

    @Data @Builder
    public static class Pagination {
        private int page;
        private int size;
        private long total;
        private int pages;
    }
}
