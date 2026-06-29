package com.example.demo.security;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * WebSocket 握手拦截器 — 在连接建立前验证 JWT Token
 *
 * 客户端连接时 URL 格式: ws://localhost:8080/ws?token=<JWT>
 * 从 URI 查询参数中提取 token 并验证，拒绝非法连接。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    /**
     * 握手前执行 — 验证 token
     *
     * 步骤:
     * 1. 从 request 的 URI 查询参数中取出 "token"
     *    → ServletServerHttpRequest → getServletRequest() → getParameter("token")
     * 2. 如果 token 为空 → 返回 false（拒绝连接）
     * 3. 调用 jwtUtil.validateToken(token)
     * 4. 如果无效 → 返回 false
     * 5. 调用 jwtUtil.getUserId(token) 获取 userId
     * 6. 从 userRepository 查出 User
     * 7. 将 userId 和 User 存入 attributes Map:
     *    attributes.put("userId", userId);
     *    attributes.put("user", user);
     * 8. 返回 true
     */
    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        // 1. 转换为 ServletServerHttpRequest，才能拿 query parameter
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String token = servletRequest.getServletRequest().getParameter("token");

            // 2. token 为空 → 拒绝
            if (token == null || token.isEmpty()) {
                log.warn("WebSocket 握手拒绝: 缺少 token");
                return false;
            }

            // 3-4. 验证 token
            if (!jwtUtil.validateToken(token)) {
                log.warn("WebSocket 握手拒绝: token 无效");
                return false;
            }

            // 5. 从 token 中解析 userId
            Long userId = jwtUtil.getUserId(token);

            // 6. 查数据库确认用户存在
            return userRepository.findById(userId).map(user -> {
                // 7. 存入 attributes，后续 ChannelInterceptor 会用到
                attributes.put("userId", userId);
                attributes.put("user", user);
                log.info("WebSocket 握手成功: userId={}, nickname={}", userId, user.getNickname());
                return true;
            }).orElseGet(() -> {
                log.warn("WebSocket 握手拒绝: userId={} 用户不存在", userId);
                return false;
            });
        }

        log.warn("WebSocket 握手拒绝: 非 HTTP 请求");
        return false;
    }

    /**
     * 握手后执行 — 一般不需要改
     */
    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
        // 握手后的清理或日志, 通常留空
    }
}
