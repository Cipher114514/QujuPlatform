package com.example.demo.config;

import com.example.demo.entity.User;
import com.example.demo.entity.User.UserRole;
import com.example.demo.entity.User.UserStatus;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        // 管理员账号
        userRepository.save(User.builder()
                .email("admin@platform.com")
                .password(passwordEncoder.encode("admin123"))
                .nickname("平台管理员")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build());

        // 测试个人用户
        userRepository.save(User.builder()
                .email("user@test.com")
                .password(passwordEncoder.encode("test1234"))
                .nickname("测试用户")
                .phone("13800138000")
                .bio("这是一个测试用户")
                .gender("male")
                .tags("[\"运动\",\"户外\",\"桌游\"]")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build());

        // 测试商家用户
        userRepository.save(User.builder()
                .email("business@test.com")
                .password(passwordEncoder.encode("test1234"))
                .nickname("测试商家")
                .phone("13900139000")
                .address("北京市朝阳区")
                .businessFields("[\"餐饮\",\"运动\"]")
                .role(UserRole.BUSINESS)
                .status(UserStatus.ACTIVE)
                .build());

        System.out.println("===== 测试账号已初始化 =====");
        System.out.println("管理员: admin@platform.com / admin123");
        System.out.println("个人用户: user@test.com / test1234");
        System.out.println("商家用户: business@test.com / test1234");
        System.out.println("===========================");
    }
}
