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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("该邮箱已被注册");
        }
        if (userRepository.existsByNickname(req.getNickname())) {
            throw new BusinessException("该昵称已被使用");
        }
        if (req.getBusinessLicense() != null && userRepository.existsByBusinessLicense(req.getBusinessLicense())) {
            throw new BusinessException("该营业执照已被注册");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(req.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("角色类型无效，可选值: user / business");
        }

        UserStatus status = UserStatus.ACTIVE;

        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .nickname(req.getNickname())
                .phone(req.getPhone())
                .role(role)
                .status(status)
                .businessLicense(req.getBusinessLicense())
                .address(req.getAddress())
                .build();

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return buildLoginResponse(user, token);
    }

    public LoginResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BusinessException(401, "邮箱或密码错误"));

        // 检查临时锁定
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(java.time.LocalDateTime.now())) {
            long remainMinutes = java.time.Duration.between(java.time.LocalDateTime.now(), user.getLockedUntil()).toMinutes();
            throw new BusinessException(429, "账号已被临时锁定，请" + (remainMinutes > 0 ? remainMinutes + "分钟后" : "稍后") + "重试");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            String msg = "账号已被封禁";
            if (user.getBanReason() != null) msg += "，原因: " + user.getBanReason();
            if (user.getBanUntil() != null) msg += "，解封时间: " + user.getBanUntil();
            throw new BusinessException(403, msg);
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            // 记录失败次数
            int failCount = user.getLoginFailCount() + 1;
            user.setLoginFailCount(failCount);
            if (failCount >= 5) {
                user.setLockedUntil(java.time.LocalDateTime.now().plusMinutes(30));
            }
            userRepository.save(user);
            throw new BusinessException(401, "邮箱或密码错误");
        }

        // 登录成功，重置失败计数
        user.setLoginFailCount(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return buildLoginResponse(user, token);
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
