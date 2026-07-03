package com.example.demo.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * WebSocket 事件监听器 — 监听连接/断开等生命周期事件
 *
 * Spring 在 WebSocket 连接建立/断开时会发布 ApplicationEvent，
 * 通过 @EventListener 注解可以监听这些事件。
 *
 * 这里主要监听 DISCONNECT 事件来做会话清理的双保险
 * （StompChannelInterceptor 已经处理了 DISCONNECT，这里作为兜底）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SessionManager sessionManager;

    /**
     * 连接建立事件 — 日志记录
     */
    @EventListener
    public void handleConnectEvent(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        log.info("WebSocket 连接建立: sessionId={}", accessor.getSessionId());
    }

    /**
     * 断开连接事件 — 清理会话管理器
     *
     * 用户关闭标签页/断网/心跳超时都会触发此事件。
     * 调用 sessionManager.removeSession() 清理映射关系。
     */
    @EventListener
    public void handleDisconnectEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (sessionId != null) {
            sessionManager.removeSession(sessionId);
            log.info("WebSocket 连接断开: sessionId={}, 当前在线用户数={}",
                    sessionId, sessionManager.getOnlineUserCount());
        }
    }
}
