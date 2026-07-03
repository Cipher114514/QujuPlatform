package com.example.demo.websocket;

import com.example.demo.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;

/**
 * STOMP 消息拦截器 — 在每条 STOMP 消息进出时触发
 *
 * 类似 HTTP 的 Filter，拦截 STOMP 协议帧: CONNECT / SEND / SUBSCRIBE / DISCONNECT
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StompChannelInterceptor implements ChannelInterceptor {

    private final SessionManager sessionManager;

    /**
     * 消息发送前触发 — 核心拦截点
     *
     * 根据 STOMP 命令类型做不同处理:
     *
     * CONNECT:
     *   1. 从 header 的 sessionAttributes 中取出 handshake 时存入的 userId 和 user
     *      → StompHeaderAccessor → getSessionAttributes() → get("userId")
     *   2. 获取当前 stomp sessionId: accessor.getSessionId()
     *   3. 调用 sessionManager.addSession(userId, stompSessionId)
     *   4. 将 user 设置为 Principal，这样后续 messagingTemplate.convertAndSendToUser()
     *      才能自动路由到正确的用户:
     *      → accessor.setUser(user)  // user 实现了 UserDetails 不行，用 Principal
     *      → 或创建一个 SimplePrincipal(userId.toString())
     *
     * DISCONNECT:
     *   1. 获取 stomp sessionId: accessor.getSessionId()
     *   2. 调用 sessionManager.removeSession(stompSessionId)
     *
     * SEND / SUBSCRIBE:
     *   一般不需要额外处理，Spring 自动路由。
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            // 从握手阶段存入的 attributes 中获取用户信息
            if (accessor.getSessionAttributes() != null) {
                Long userId = (Long) accessor.getSessionAttributes().get("userId");
                User user = (User) accessor.getSessionAttributes().get("user");

                if (userId != null && user != null) {
                    // 注册到会话管理器
                    String stompSessionId = accessor.getSessionId();
                    sessionManager.addSession(userId, stompSessionId);

                    // 设置 Principal，使得 convertAndSendToUser() 能自动路由
                    // 用 userId 作为 Principal 的 name
                    accessor.setUser(new java.security.Principal() {
                        @Override
                        public String getName() {
                            return userId.toString();
                        }
                    });

                    log.info("STOMP CONNECT: userId={}, sessionId={}", userId, stompSessionId);
                }
            }

        } else if (StompCommand.DISCONNECT.equals(command)) {
            String stompSessionId = accessor.getSessionId();
            if (stompSessionId != null) {
                sessionManager.removeSession(stompSessionId);
                log.info("STOMP DISCONNECT: sessionId={}", stompSessionId);
            }
        }

        return message;
    }

    /**
     * 消息发送完成后触发 — 可用于日志或统计
     */
    @Override
    public void afterSendCompletion(Message<?> message, MessageChannel channel,
                                    boolean sent, Exception ex) {
        // 可在此记录消息发送成功/失败日志
    }
}
