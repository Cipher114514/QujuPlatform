package com.example.demo.config;

import com.example.demo.entity.Activity;
import com.example.demo.entity.User;
import com.example.demo.entity.User.UserRole;
import com.example.demo.entity.User.UserStatus;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;
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

        if (activityRepository.count() > 0) return;

        User businessUser = userRepository.findByEmail("business@test.com").orElse(null);
        Long creatorId = businessUser != null ? businessUser.getId() : 1L;

        activityRepository.save(Activity.builder()
                .title("周末篮球局")
                .description("每周六下午的篮球聚会，欢迎所有水平的球友参与！")
                .category("运动")
                .startTime(LocalDateTime.now().plusDays(7))
                .endTime(LocalDateTime.now().plusDays(7).plusHours(2))
                .location("朝阳公园篮球场")
                .maxParticipants(10)
                .currentParticipants(10)
                .fee(BigDecimal.ZERO)
                .status("ACTIVE")
                .tags("[\"篮球\",\"运动\",\"周末\"]")
                .creatorId(creatorId)
                .registrationDeadline(LocalDateTime.now().plusDays(5))
                .build());

        activityRepository.save(Activity.builder()
                .title("桌游聚会")
                .description("各类桌游畅玩，认识新朋友，度过愉快的周末夜晚")
                .category("娱乐")
                .startTime(LocalDateTime.now().plusDays(8))
                .endTime(LocalDateTime.now().plusDays(8).plusHours(4))
                .location("三里屯桌游吧")
                .maxParticipants(8)
                .currentParticipants(5)
                .fee(new BigDecimal("50"))
                .status("ACTIVE")
                .tags("[\"桌游\",\"聚会\",\"社交\"]")
                .creatorId(creatorId)
                .registrationDeadline(LocalDateTime.now().plusDays(6))
                .build());

        activityRepository.save(Activity.builder()
                .title("户外徒步")
                .description("香山公园一日徒步，欣赏秋季美景")
                .category("户外")
                .startTime(LocalDateTime.now().plusDays(14))
                .endTime(LocalDateTime.now().plusDays(14).plusHours(6))
                .location("香山公园")
                .maxParticipants(15)
                .currentParticipants(0)
                .fee(BigDecimal.ZERO)
                .status("ACTIVE")
                .tags("[\"徒步\",\"户外\",\"自然\"]")
                .creatorId(creatorId)
                .registrationDeadline(LocalDateTime.now().plusDays(12))
                .build());

        activityRepository.save(Activity.builder()
                .title("城市漫步")
                .description("探索上海外滩的历史建筑与现代风光")
                .category("旅行")
                .startTime(LocalDateTime.now().plusDays(21))
                .endTime(LocalDateTime.now().plusDays(21).plusHours(3))
                .location("上海外滩")
                .maxParticipants(20)
                .currentParticipants(20)
                .fee(new BigDecimal("30"))
                .status("ACTIVE")
                .tags("[\"旅行\",\"城市\",\"摄影\"]")
                .creatorId(creatorId)
                .registrationDeadline(LocalDateTime.now().plusDays(18))
                .build());

        System.out.println("===== 测试活动已初始化 =====");
        System.out.println("活动1: 周末篮球局（已满员，可测试等待队列）");
        System.out.println("活动2: 桌游聚会（5/8人，可测试报名）");
        System.out.println("活动3: 户外徒步（0/15人，可测试报名）");
        System.out.println("活动4: 城市漫步（已满员，可测试等待队列）");
        System.out.println("===========================");
    }
}
