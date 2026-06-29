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
        User admin = userRepository.findByEmail("admin@platform.com").orElseGet(() -> userRepository.save(User.builder()
                .email("admin@platform.com")
                .password(passwordEncoder.encode("admin123"))
                .nickname("平台管理员")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build()));

        userRepository.findByEmail("user@test.com").orElseGet(() -> userRepository.save(User.builder()
                .email("user@test.com")
                .password(passwordEncoder.encode("test1234"))
                .nickname("测试用户")
                .phone("13800138000")
                .bio("这是一个测试用户")
                .gender("male")
                .tags("[\"运动\",\"户外\",\"桌游\"]")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build()));

        User business = userRepository.findByEmail("business@test.com").orElseGet(() -> userRepository.save(User.builder()
                .email("business@test.com")
                .password(passwordEncoder.encode("test1234"))
                .nickname("测试商家")
                .phone("13900139000")
                .address("北京市朝阳区")
                .businessFields("[\"餐饮\",\"运动\"]")
                .role(UserRole.BUSINESS)
                .status(UserStatus.ACTIVE)
                .build()));

        seedActivities(business.getId(), admin.getId());

        System.out.println("===== 测试账号已初始化 =====");
        System.out.println("管理员: admin@platform.com / admin123");
        System.out.println("个人用户: user@test.com / test1234");
        System.out.println("商家用户: business@test.com / test1234");
        System.out.println("===========================");
    }

    private void seedActivities(Long businessId, Long adminId) {
        if (activityRepository.count() > 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        activityRepository.save(Activity.builder()
                .title("周末羽毛球新手局")
                .description("面向新手和轻量运动爱好者，提供场地和基础教学，适合想恢复运动节奏的朋友。")
                .category("sports")
                .tags("运动,羽毛球,新手友好")
                .startTime(now.plusDays(3).withHour(14).withMinute(0).withSecond(0).withNano(0))
                .endTime(now.plusDays(3).withHour(16).withMinute(0).withSecond(0).withNano(0))
                .registrationDeadline(now.plusDays(2).withHour(22).withMinute(0).withSecond(0).withNano(0))
                .location("市民体育中心 3 号馆")
                .maxParticipants(12)
                .currentParticipants(5)
                .fee(new BigDecimal("35.00"))
                .creatorId(businessId)
                .build());

        activityRepository.save(Activity.builder()
                .title("城市夜跑 5 公里")
                .description("沿河道轻松夜跑，全程约 5 公里，配速友好，结束后可自由交流。")
                .category("sports")
                .tags("运动,夜跑,城市")
                .startTime(now.plusDays(5).withHour(19).withMinute(30).withSecond(0).withNano(0))
                .endTime(now.plusDays(5).withHour(21).withMinute(0).withSecond(0).withNano(0))
                .registrationDeadline(now.plusDays(4).withHour(20).withMinute(0).withSecond(0).withNano(0))
                .location("滨河公园东门")
                .maxParticipants(30)
                .currentParticipants(18)
                .fee(BigDecimal.ZERO)
                .creatorId(adminId)
                .build());

        activityRepository.save(Activity.builder()
                .title("咖啡馆桌游下午场")
                .description("狼人杀、璀璨宝石、卡坦岛轮换开局，有主持人带新手入门。")
                .category("boardgame")
                .tags("桌游,社交,室内")
                .startTime(now.plusDays(7).withHour(15).withMinute(0).withSecond(0).withNano(0))
                .endTime(now.plusDays(7).withHour(18).withMinute(0).withSecond(0).withNano(0))
                .registrationDeadline(now.plusDays(6).withHour(18).withMinute(0).withSecond(0).withNano(0))
                .location("慢响咖啡二楼")
                .maxParticipants(16)
                .currentParticipants(9)
                .fee(new BigDecimal("58.00"))
                .creatorId(businessId)
                .build());

        activityRepository.save(Activity.builder()
                .title("产品经理读书交流")
                .description("围绕产品发现、用户访谈和需求优先级展开分享，每位参与者可带一个真实案例。")
                .category("study")
                .tags("学习,产品,交流")
                .startTime(now.plusDays(10).withHour(19).withMinute(0).withSecond(0).withNano(0))
                .endTime(now.plusDays(10).withHour(21).withMinute(0).withSecond(0).withNano(0))
                .registrationDeadline(now.plusDays(9).withHour(20).withMinute(0).withSecond(0).withNano(0))
                .location("联合办公空间 A 区")
                .maxParticipants(20)
                .currentParticipants(7)
                .fee(BigDecimal.ZERO)
                .creatorId(adminId)
                .build());

        activityRepository.save(Activity.builder()
                .title("周日城市漫步")
                .description("从老街区出发，串联书店、展览和特色小店，适合喜欢探索城市的人。")
                .category("citywalk")
                .tags("城市漫步,摄影,户外")
                .startTime(now.plusDays(12).withHour(10).withMinute(0).withSecond(0).withNano(0))
                .endTime(now.plusDays(12).withHour(12).withMinute(30).withSecond(0).withNano(0))
                .registrationDeadline(now.plusDays(11).withHour(18).withMinute(0).withSecond(0).withNano(0))
                .location("老城南门集合")
                .maxParticipants(15)
                .currentParticipants(6)
                .fee(new BigDecimal("20.00"))
                .creatorId(businessId)
                .build());
    }
}
