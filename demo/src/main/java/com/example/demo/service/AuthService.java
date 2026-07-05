package com.example.demo.service;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.entity.User;
import com.example.demo.entity.User.UserRole;
import com.example.demo.entity.User.UserStatus;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final MailService mailService;

    @Value("${app.frontend.base-url:http://localhost:8080}")
    private String frontendBaseUrl;

    @Transactional
    public void register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("该邮箱已被注册");
        }
        if (userRepository.existsByNickname(req.getNickname())) {
            throw new BusinessException("该昵称已被使用");
        }
        if (req.getCreditCode() != null && !req.getCreditCode().isBlank()
                && userRepository.existsByCreditCode(req.getCreditCode())) {
            throw new BusinessException("该统一社会信用代码已被注册");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(req.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("角色类型无效，可选值：user / business");
        }

        String activationToken = UUID.randomUUID().toString().replace("-", "");
        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .nickname(req.getNickname())
                .phone(req.getPhone())
                .role(role)
                .status(UserStatus.PENDING)
                .businessLicense(req.getBusinessLicense())
                .creditCode(req.getCreditCode())
                .address(req.getAddress())
                .businessFields(req.getBusinessFields())
                .activationToken(activationToken)
                .activationTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .build();

        user = userRepository.save(user);
        mailService.sendActivationMail(user.getEmail(), user.getNickname(), buildActivationLink(activationToken));
    }

    public LoginResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BusinessException(401, "邮箱或密码错误"));

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            long remainMinutes = Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes();
            throw new BusinessException(429, "账号已被临时锁定，请"
                    + (remainMinutes > 0 ? remainMinutes + "分钟后" : "稍后") + "重试");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            String msg = "账号已被封禁";
            if (user.getBanReason() != null) msg += "，原因：" + user.getBanReason();
            if (user.getBanUntil() != null) msg += "，解封时间：" + user.getBanUntil();
            throw new BusinessException(403, msg);
        }

        if (user.getStatus() == UserStatus.PENDING) {
            throw new BusinessException(403, "账号未激活，请先打开邮箱中的激活链接");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            int failCount = user.getLoginFailCount() + 1;
            user.setLoginFailCount(failCount);
            if (failCount >= 5) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(30));
            }
            userRepository.save(user);
            throw new BusinessException(401, "邮箱或密码错误");
        }

        user.setLoginFailCount(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return buildLoginResponse(user, token);
    }

    @Transactional
    public void activate(String token) {
        if (token == null || token.isBlank()) {
            throw new BusinessException("激活链接无效");
        }

        User user = userRepository.findByActivationToken(token)
                .orElseThrow(() -> new BusinessException("激活链接无效或账号已激活"));

        if (user.getActivationTokenExpiresAt() == null
                || user.getActivationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("激活链接已过期，请重新注册或联系管理员");
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setActivationToken(null);
        user.setActivationTokenExpiresAt(null);
        userRepository.save(user);
    }

    private String buildActivationLink(String activationToken) {
        String baseUrl = frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;
        return baseUrl + "/#/activate?token=" + activationToken;
    }

    private LoginResponse buildLoginResponse(User user, String token) {
        return LoginResponse.builder()
                .token(token)
                .user(LoginResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .nickname(user.getNickname())
                        .role(user.getRole().name().toLowerCase())
                        .status(user.getStatus().name().toLowerCase())
                        .build())
                .build();
    }
}
