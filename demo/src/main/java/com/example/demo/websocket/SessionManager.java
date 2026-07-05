package com.example.demo.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket 会话管理器 — 维护 userId ↔ sessionId 映射
 *
 * 用途:
 * - P7 发消息时，判断目标用户是否在线
 * - 断线时清理对应 session
 * - 查询在线用户列表
 *
 * 一个用户可能有多个 session（多标签页/多设备），用 Set 存储。
 */
@Slf4j
@Component
public class SessionManager {

    /** userId → 该用户的所有 sessionId */
    private final Map<Long, Set<String>> userSessions = new ConcurrentHashMap<>();

    /** sessionId → userId（反向索引，方便断线时快速清理） */
    private final Map<String, Long> sessionUsers = new ConcurrentHashMap<>();

    /**
     * 用户上线 — 注册 session
     * 在 StompChannelInterceptor 的 CONNECT 事件中调用
     */
    public void addSession(Long userId, String sessionId) {
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
        sessionUsers.put(sessionId, userId);
        log.info("用户上线: userId={}, sessionId={}, 当前在线 session 数={}",
                userId, sessionId, userSessions.get(userId).size());
    }

    /**
     * 用户下线 — 移除 session
     * 在 WebSocketEventListener 的 DISCONNECT 事件中调用
     */
    public void removeSession(String sessionId) {
        Long userId = sessionUsers.remove(sessionId);
        if (userId != null) {
            Set<String> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                    log.info("用户完全离线: userId={}", userId);
                } else {
                    log.info("用户部分离线: userId={}, 剩余 session 数={}",
                            userId, sessions.size());
                }
            }
        }
    }

    /**
     * 判断用户是否在线（至少有一个活跃 session）
     */
    public boolean isUserOnline(Long userId) {
        Set<String> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    /**
     * 获取用户的所有 sessionId
     */
    public Set<String> getUserSessions(Long userId) {
        return userSessions.getOrDefault(userId, Set.of());
    }

    /**
     * 获取当前在线用户总数
     */
    public int getOnlineUserCount() {
        return userSessions.size();
    }

    /**
     * 获取所有在线用户的 userId 集合
     */
    public Set<Long> getOnlineUserIds() {
        return userSessions.keySet();
    }
}
