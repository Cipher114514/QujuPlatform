package com.example.demo.config;

import com.example.demo.entity.*;
import com.example.demo.entity.User.UserRole;
import com.example.demo.entity.User.UserStatus;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;
    private final RegistrationRepository registrationRepository;
    private final FollowRepository followRepository;
    private final FriendshipRepository friendshipRepository;
    private final WaitlistRepository waitlistRepository;
    private final ActivityTemplateRepository templateRepository;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // 清空旧数据（按 FK 依赖逆序，deleteInBatch 立即刷库）
        waitlistRepository.deleteAllInBatch();
        registrationRepository.deleteAllInBatch();
        friendshipRepository.deleteAllInBatch();
        followRepository.deleteAllInBatch();
        messageRepository.deleteAllInBatch();
        conversationRepository.deleteAllInBatch();
        templateRepository.deleteAllInBatch();
        activityRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();

        // ==================== 1. 创建用户 ====================
        String pwd = passwordEncoder.encode("test1234");

        User admin = userRepository.save(User.builder()
                .email("admin@platform.com").password(pwd).nickname("平台管理员")
                .phone("13800000000").bio("趣聚平台管理员").gender("other")
                .role(UserRole.ADMIN).status(UserStatus.ACTIVE).build());

        User zhangsan = userRepository.save(User.builder()
                .email("zhangsan@test.com").password(pwd).nickname("张三")
                .phone("13800000001").bio("热爱篮球和户外运动，周末闲不住").gender("male")
                .tags("[\"运动\",\"户外\",\"篮球\"]")
                .role(UserRole.USER).status(UserStatus.ACTIVE).build());

        User lisi = userRepository.save(User.builder()
                .email("lisi@test.com").password(pwd).nickname("李四")
                .phone("13800000002").bio("桌游爱好者，狼人杀重度玩家").gender("female")
                .tags("[\"桌游\",\"聚会\",\"公益\"]")
                .role(UserRole.USER).status(UserStatus.ACTIVE).build());

        User wangwu = userRepository.save(User.builder()
                .email("wangwu@test.com").password(pwd).nickname("王五")
                .phone("13800000003").bio("喜欢城市漫步和探索美食").gender("male")
                .tags("[\"城市\",\"美食\",\"公益\"]")
                .role(UserRole.USER).status(UserStatus.ACTIVE).build());

        User zhaoliu = userRepository.save(User.builder()
                .email("zhaoliu@test.com").password(pwd).nickname("赵六")
                .phone("13800000004").bio("户外徒步达人，周末必出门").gender("male")
                .tags("[\"户外\",\"徒步\",\"运动\"]")
                .role(UserRole.USER).status(UserStatus.ACTIVE).build());

        User sunqi = userRepository.save(User.builder()
                .email("sunqi@test.com").password(pwd).nickname("孙七")
                .phone("13800000005").bio("文艺青年，喜欢读书和公益活动").gender("female")
                .tags("[\"公益\",\"读书\",\"学习\"]")
                .role(UserRole.USER).status(UserStatus.ACTIVE).build());

        User zhouba = userRepository.save(User.builder()
                .email("zhouba@test.com").password(pwd).nickname("周八的运动馆")
                .phone("13900000001").bio("专业运动场地租赁，定期组织篮球/羽毛球活动")
                .address("北京市海淀区中关村大街88号")
                .businessFields("[\"运动\",\"健身\"]")
                .businessLicense("uploads/business_license/5419688d_20260629101359.pdf")
                .role(UserRole.BUSINESS).status(UserStatus.ACTIVE).build());

        User wujiu = userRepository.save(User.builder()
                .email("wujiu@test.com").password(pwd).nickname("吴九")
                .phone("13800000006").bio("程序员一枚，热爱Python和摄影").gender("male")
                .tags("[\"学习\",\"编程\",\"摄影\"]")
                .role(UserRole.USER).status(UserStatus.ACTIVE).build());

        User zhengshi = userRepository.save(User.builder()
                .email("zhengshi@test.com").password(pwd).nickname("郑十的桌游吧")
                .phone("13900000002").bio("三里屯专业桌游吧，每周组织狼人杀、剧本杀活动")
                .address("北京市朝阳区三里屯SOHO 5号楼301")
                .businessFields("[\"桌游\",\"聚会\"]")
                .role(UserRole.BUSINESS).status(UserStatus.ACTIVE).build());

        User liuyi = userRepository.save(User.builder()
                .email("liuyi@test.com").password(pwd).nickname("刘一")
                .phone("13800000007").bio("旅行摄影博主，喜欢探索城市角落").gender("female")
                .tags("[\"摄影\",\"旅行\",\"城市\"]")
                .role(UserRole.USER).status(UserStatus.ACTIVE).build());

        // ==================== 2. 创建活动模板 ====================
        templateRepository.save(ActivityTemplate.builder()
                .name("运动健身").category("sports").icon("🏃")
                .titleTemplate("{主题}运动局")
                .descriptionTemplate("一起参与{主题}运动，强身健体，结交运动伙伴！").build());
        templateRepository.save(ActivityTemplate.builder()
                .name("户外徒步").category("hiking").icon("🥾")
                .titleTemplate("{目的地}徒步")
                .descriptionTemplate("周末{目的地}徒步之旅，沿途欣赏自然风光。全程约{公里数}公里。").build());
        templateRepository.save(ActivityTemplate.builder()
                .name("桌游聚会").category("boardgame").icon("🎲")
                .titleTemplate("{游戏名}桌游局")
                .descriptionTemplate("{游戏名}主题桌游聚会，新手友好，有教学环节。").build());
        templateRepository.save(ActivityTemplate.builder()
                .name("学习交流").category("study").icon("📚")
                .titleTemplate("{主题}学习交流会")
                .descriptionTemplate("{主题}主题学习交流，分享经验，互相成长。").build());
        templateRepository.save(ActivityTemplate.builder()
                .name("公益活动").category("charity").icon("🤝")
                .titleTemplate("{主题}公益行动")
                .descriptionTemplate("{主题}公益活动，用行动传递温暖。").build());
        templateRepository.save(ActivityTemplate.builder()
                .name("城市探索").category("citywalk").icon("🗺️")
                .titleTemplate("{区域}城市漫步")
                .descriptionTemplate("漫步{区域}，发现城市隐藏的美，品尝地道美食。").build());

        // ==================== 3. 创建活动 ====================
        var now = LocalDateTime.now();

        Activity act1 = activityRepository.save(Activity.builder()
                .title("周末篮球对抗赛").description("一起参与周末篮球运动，强身健体，结交运动伙伴！无论新手老手都能找到乐趣。现场分组对抗，每局10分钟轮换。")
                .category("sports").location("朝阳公园篮球场")
                .startTime(now.plusDays(5).withHour(14).withMinute(0))
                .endTime(now.plusDays(5).withHour(17).withMinute(0))
                .registrationDeadline(now.plusDays(4).withHour(12).withMinute(0))
                .maxParticipants(20).currentParticipants(8)
                .fee(BigDecimal.ZERO).status("ACTIVE")
                .tags("运动,篮球,户外").creatorId(zhangsan.getId()).build());

        Activity act2 = activityRepository.save(Activity.builder()
                .title("香山徒步之旅").description("周末香山徒步，全程约8公里，沿途欣赏自然风光。适合初级户外爱好者，有专业领队带队。请穿运动鞋、自带饮水。")
                .category("hiking").location("香山公园东门")
                .startTime(now.plusDays(6).withHour(8).withMinute(0))
                .endTime(now.plusDays(6).withHour(15).withMinute(0))
                .registrationDeadline(now.plusDays(5).withHour(18).withMinute(0))
                .maxParticipants(15).currentParticipants(10)
                .fee(new BigDecimal("10")).status("ACTIVE")
                .tags("户外,徒步,自然").creatorId(zhaoliu.getId()).build());

        Activity act3 = activityRepository.save(Activity.builder()
                .title("狼人杀桌游之夜").description("每周固定桌游局，新手友好有教学。提供多种桌游选择：狼人杀、阿瓦隆、卡坦岛等。含饮品和小食。")
                .category("boardgame").location("三里屯桌游吧")
                .startTime(now.plusDays(3).withHour(19).withMinute(0))
                .endTime(now.plusDays(3).withHour(22).withMinute(0))
                .registrationDeadline(now.plusDays(2).withHour(20).withMinute(0))
                .maxParticipants(8).currentParticipants(8)
                .fee(new BigDecimal("30")).status("ACTIVE")
                .tags("桌游,聚会,社交").creatorId(zhengshi.getId()).build());

        Activity act4 = activityRepository.save(Activity.builder()
                .title("Python学习交流会").description("Python主题学习交流，分享编程经验和项目心得。本期主题：FastAPI vs Flask 实战对比。适合有一定基础的同学。")
                .category("study").location("中关村创业咖啡")
                .startTime(now.plusDays(8).withHour(10).withMinute(0))
                .endTime(now.plusDays(8).withHour(12).withMinute(0))
                .registrationDeadline(now.plusDays(7).withHour(18).withMinute(0))
                .maxParticipants(15).currentParticipants(5)
                .fee(BigDecimal.ZERO).status("ACTIVE")
                .tags("学习,编程,Python").creatorId(wujiu.getId()).build());

        Activity act5 = activityRepository.save(Activity.builder()
                .title("社区环保公益行动").description("社区环保公益活动，清理公园垃圾并分类。用行动传递温暖，共建美丽家园。提供工具和饮用水，参与即可获得志愿时长。")
                .category("charity").location("奥林匹克公园南门")
                .startTime(now.plusDays(7).withHour(9).withMinute(0))
                .endTime(now.plusDays(7).withHour(12).withMinute(0))
                .registrationDeadline(now.plusDays(6).withHour(12).withMinute(0))
                .maxParticipants(30).currentParticipants(10)
                .fee(BigDecimal.ZERO).status("ACTIVE")
                .tags("公益,志愿,环保").creatorId(sunqi.getId()).build());

        Activity act6 = activityRepository.save(Activity.builder()
                .title("胡同城市漫步").description("漫步老北京胡同，发现城市隐藏的美。途经南锣鼓巷、什刹海、烟袋斜街，品尝地道小吃，了解胡同文化。全程约3公里。")
                .category("citywalk").location("南锣鼓巷地铁站E口")
                .startTime(now.plusDays(4).withHour(14).withMinute(0))
                .endTime(now.plusDays(4).withHour(17).withMinute(30))
                .registrationDeadline(now.plusDays(3).withHour(12).withMinute(0))
                .maxParticipants(10).currentParticipants(7)
                .fee(new BigDecimal("50")).status("ACTIVE")
                .tags("城市,探索,美食,文化").creatorId(wangwu.getId()).build());

        Activity act7 = activityRepository.save(Activity.builder()
                .title("摄影外拍——798艺术区").description("城市风光摄影外拍活动，交流拍摄技巧和后期经验。不限器材，手机也可参加。结束后AA聚餐，自由参加。")
                .category("citywalk").location("798艺术区")
                .startTime(now.plusDays(10).withHour(15).withMinute(0))
                .endTime(now.plusDays(10).withHour(18).withMinute(30))
                .registrationDeadline(now.plusDays(9).withHour(12).withMinute(0))
                .maxParticipants(20).currentParticipants(10)
                .fee(BigDecimal.ZERO).status("ACTIVE")
                .tags("摄影,城市,艺术").creatorId(wujiu.getId()).build());

        Activity act8 = activityRepository.save(Activity.builder()
                .title("清晨户外瑜伽").description("清晨户外瑜伽，在大自然中放松身心。适合所有水平，请自带瑜伽垫。课后提供柠檬水。如遇雨天则顺延至次日。")
                .category("sports").location("朝阳公园湖畔草坪")
                .startTime(now.plusDays(3).withHour(7).withMinute(0))
                .endTime(now.plusDays(3).withHour(8).withMinute(30))
                .registrationDeadline(now.plusDays(2).withHour(20).withMinute(0))
                .maxParticipants(15).currentParticipants(6)
                .fee(new BigDecimal("15")).status("ACTIVE")
                .tags("瑜伽,户外,健康").creatorId(liuyi.getId()).build());

        // ==================== 4. 创建报名记录 ====================
        // act1 (篮球, 20上限, 8人已报): zhangsan, lisi, wangwu, zhaoliu, sunqi, wujiu, liuyi, zhouba
        register(act1.getId(), zhangsan.getId(), registrationRepository);
        register(act1.getId(), lisi.getId(), registrationRepository);
        register(act1.getId(), wangwu.getId(), registrationRepository);
        register(act1.getId(), zhaoliu.getId(), registrationRepository);
        register(act1.getId(), sunqi.getId(), registrationRepository);
        register(act1.getId(), wujiu.getId(), registrationRepository);
        register(act1.getId(), liuyi.getId(), registrationRepository);
        register(act1.getId(), zhouba.getId(), registrationRepository);

        // act2 (徒步, 15上限, 10人已报)
        register(act2.getId(), zhaoliu.getId(), registrationRepository);
        register(act2.getId(), zhangsan.getId(), registrationRepository);
        register(act2.getId(), lisi.getId(), registrationRepository);
        register(act2.getId(), wangwu.getId(), registrationRepository);
        register(act2.getId(), sunqi.getId(), registrationRepository);
        register(act2.getId(), zhouba.getId(), registrationRepository);
        register(act2.getId(), wujiu.getId(), registrationRepository);
        register(act2.getId(), zhengshi.getId(), registrationRepository);
        register(act2.getId(), liuyi.getId(), registrationRepository);
        register(act2.getId(), admin.getId(), registrationRepository);

        // act3 (狼人杀, 满员8人): zhangsan, lisi, wangwu, zhaoliu, zhouba, wujiu, zhengshi, admin
        // liuyi和sunqi 在等待队列中
        for (User u : List.of(zhangsan, lisi, wangwu, zhaoliu, zhouba, wujiu, zhengshi, admin)) {
            register(act3.getId(), u.getId(), registrationRepository);
        }

        // act4 (Python, 5人)
        register(act4.getId(), wujiu.getId(), registrationRepository);
        register(act4.getId(), zhangsan.getId(), registrationRepository);
        register(act4.getId(), lisi.getId(), registrationRepository);
        register(act4.getId(), sunqi.getId(), registrationRepository);
        register(act4.getId(), admin.getId(), registrationRepository);

        // act5 (公益, 30上限, 10人已报)
        for (User u : List.of(sunqi, lisi, wangwu, zhangsan, zhaoliu, zhouba, wujiu, zhengshi, liuyi, admin)) {
            register(act5.getId(), u.getId(), registrationRepository);
        }

        // act6 (胡同漫步, 7人)
        register(act6.getId(), wangwu.getId(), registrationRepository);
        register(act6.getId(), lisi.getId(), registrationRepository);
        register(act6.getId(), sunqi.getId(), registrationRepository);
        register(act6.getId(), liuyi.getId(), registrationRepository);
        register(act6.getId(), zhangsan.getId(), registrationRepository);
        register(act6.getId(), wujiu.getId(), registrationRepository);
        register(act6.getId(), zhaoliu.getId(), registrationRepository);

        // act7 (摄影, 11人)
        for (User u : List.of(wujiu, liuyi, zhangsan, lisi, wangwu, zhaoliu, sunqi, zhouba, zhengshi, admin)) {
            register(act7.getId(), u.getId(), registrationRepository);
        }

        // act8 (瑜伽, 6人)
        register(act8.getId(), liuyi.getId(), registrationRepository);
        register(act8.getId(), sunqi.getId(), registrationRepository);
        register(act8.getId(), lisi.getId(), registrationRepository);
        register(act8.getId(), wangwu.getId(), registrationRepository);
        register(act8.getId(), zhangsan.getId(), registrationRepository);
        register(act8.getId(), zhaoliu.getId(), registrationRepository);

        // ==================== 5. 等待队列 (满员活动) ====================
        waitlistRepository.save(WaitlistEntry.builder()
                .activityId(act3.getId()).userId(liuyi.getId())
                .queuePosition(1).status("WAITING").build());
        waitlistRepository.save(WaitlistEntry.builder()
                .activityId(act3.getId()).userId(sunqi.getId())
                .queuePosition(2).status("WAITING").build());

        // ==================== 6. 关注关系 ====================
        follow(followRepository, zhangsan.getId(), lisi.getId());
        follow(followRepository, zhangsan.getId(), wangwu.getId());
        follow(followRepository, zhangsan.getId(), zhaoliu.getId());
        follow(followRepository, lisi.getId(), zhangsan.getId());
        follow(followRepository, lisi.getId(), wangwu.getId());
        follow(followRepository, lisi.getId(), zhengshi.getId());
        follow(followRepository, wangwu.getId(), liuyi.getId());
        follow(followRepository, wangwu.getId(), sunqi.getId());
        follow(followRepository, zhaoliu.getId(), zhangsan.getId());
        follow(followRepository, zhaoliu.getId(), zhouba.getId());
        follow(followRepository, sunqi.getId(), lisi.getId());
        follow(followRepository, sunqi.getId(), wujiu.getId());
        follow(followRepository, zhouba.getId(), zhangsan.getId());
        follow(followRepository, wujiu.getId(), sunqi.getId());
        follow(followRepository, wujiu.getId(), liuyi.getId());
        follow(followRepository, zhengshi.getId(), lisi.getId());
        follow(followRepository, liuyi.getId(), wangwu.getId());
        follow(followRepository, liuyi.getId(), wujiu.getId());

        // ==================== 7. 好友关系 (互相关注 → 好友) ====================
        // zhangsan <-> lisi (互关已成好友)
        // zhangsan <-> zhaoliu (互关已成好友)
        // 这些由 FollowService 的逻辑自动处理
        // 手动创建几个 ACCEPTED friendship
        friendshipRepository.save(Friendship.builder()
                .fromUserId(zhangsan.getId()).toUserId(lisi.getId())
                .status("ACCEPTED").fromNote("一起打球吧").build());
        friendshipRepository.save(Friendship.builder()
                .fromUserId(lisi.getId()).toUserId(zhangsan.getId())
                .status("ACCEPTED").fromNote("好呀").build());
        friendshipRepository.save(Friendship.builder()
                .fromUserId(zhangsan.getId()).toUserId(zhaoliu.getId())
                .status("ACCEPTED").build());
        friendshipRepository.save(Friendship.builder()
                .fromUserId(zhaoliu.getId()).toUserId(zhangsan.getId())
                .status("ACCEPTED").build());
        friendshipRepository.save(Friendship.builder()
                .fromUserId(wangwu.getId()).toUserId(liuyi.getId())
                .status("ACCEPTED").build());
        friendshipRepository.save(Friendship.builder()
                .fromUserId(liuyi.getId()).toUserId(wangwu.getId())
                .status("ACCEPTED").build());
        friendshipRepository.save(Friendship.builder()
                .fromUserId(sunqi.getId()).toUserId(lisi.getId())
                .status("ACCEPTED").build());
        friendshipRepository.save(Friendship.builder()
                .fromUserId(lisi.getId()).toUserId(sunqi.getId())
                .status("ACCEPTED").build());

        // ==================== 8. 待处理好友申请 ====================
        friendshipRepository.save(Friendship.builder()
                .fromUserId(zhengshi.getId()).toUserId(zhangsan.getId())
                .status("PENDING").fromNote("你好，欢迎来我们桌游吧玩！").build());
        friendshipRepository.save(Friendship.builder()
                .fromUserId(zhouba.getId()).toUserId(wujiu.getId())
                .status("PENDING").fromNote("一起打球吗").build());

        System.out.println("===== 测试数据初始化完成 =====");
        System.out.println("管理员: admin@platform.com / test1234");
        System.out.println("个人用户: zhangsan@test.com ~ liuyi@test.com / test1234");
        System.out.println("商家用户: zhouba@test.com, zhengshi@test.com / test1234");
        System.out.println("活动数量: 8 | 模板数量: 6");
        System.out.println("===========================");
    }

    private void register(Long activityId, Long userId, RegistrationRepository repo) {
        repo.save(Registration.builder()
                .activityId(activityId).userId(userId)
                .participants(1).status("CONFIRMED").build());
    }

    private void follow(FollowRepository repo, Long followerId, Long followingId) {
        repo.save(Follow.builder()
                .followerId(followerId).followingId(followingId).build());
    }
}
