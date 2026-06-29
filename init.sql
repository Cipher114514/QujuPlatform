-- =============================================
-- 趣聚平台 - MySQL 8.0 完整建表脚本
-- 版本: v0.1.0 (迭代1)
-- 用法: mysql -u root -p < init.sql
-- =============================================

CREATE DATABASE IF NOT EXISTS quju DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quju;

-- 1. 用户表
CREATE TABLE users (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    nickname        VARCHAR(50)     NOT NULL UNIQUE,
    phone           VARCHAR(20)     NULL,
    avatar          VARCHAR(500)    NULL,
    bio             VARCHAR(500)    NULL,
    gender          VARCHAR(10)     NULL,
    birthday        VARCHAR(20)     NULL,
    tags            VARCHAR(1000)   NULL,
    role            VARCHAR(20)     NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    business_license VARCHAR(500)   NULL,
    address         VARCHAR(255)   NULL,
    business_fields VARCHAR(500)   NULL,
    ban_reason      VARCHAR(500)    NULL,
    ban_until       DATETIME        NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_nickname (nickname),
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 活动表
CREATE TABLE activities (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    title               VARCHAR(200)    NOT NULL,
    description         TEXT            NOT NULL,
    category            VARCHAR(50)     NOT NULL,
    start_time          DATETIME        NOT NULL,
    end_time            DATETIME        NOT NULL,
    location            VARCHAR(255)    NOT NULL,
    max_participants    INT             NOT NULL DEFAULT 20,
    current_participants INT            NOT NULL DEFAULT 0,
    fee                 DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    status              VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    tags                VARCHAR(1000)   NULL,
    images              VARCHAR(2000)   NULL,
    cover_image         VARCHAR(500)    NULL,
    creator_id          BIGINT          NOT NULL,
    registration_deadline DATETIME      NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_activities_status (status),
    INDEX idx_activities_category (category),
    INDEX idx_activities_creator (creator_id),
    INDEX idx_activities_start_time (start_time),
    FULLTEXT INDEX ft_activities_search (title, description) WITH PARSER ngram,
    CONSTRAINT fk_activities_creator FOREIGN KEY (creator_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 活动模板表
CREATE TABLE activity_templates (
    id                  BIGINT          AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100)    NOT NULL,
    category            VARCHAR(50)     NOT NULL,
    icon                VARCHAR(10)     NULL,
    title_template      VARCHAR(200)    NOT NULL,
    description_template TEXT           NOT NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO activity_templates (name, category, icon, title_template, description_template) VALUES
('运动健身', 'sports',    '🏃', '{主题}运动局', '一起参与{主题}运动，强身健体，结交运动伙伴！'),
('户外徒步', 'hiking',    '🥾', '{目的地}徒步', '周末{目的地}徒步之旅，沿途欣赏自然风光。全程约{公里数}公里。'),
('桌游聚会', 'boardgame', '🎲', '{游戏名}桌游局', '{游戏名}主题桌游聚会，新手友好，有教学环节。'),
('学习交流', 'study',     '📚', '{主题}学习交流会', '{主题}主题学习交流，分享经验，互相成长。'),
('公益活动', 'charity',   '🤝', '{主题}公益行动', '{主题}公益活动，用行动传递温暖。'),
('城市探索', 'citywalk',  '🗺️', '{区域}城市漫步', '漫步{区域}，发现城市隐藏的美，品尝地道美食。');

-- 4. 报名记录表
CREATE TABLE registrations (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    activity_id     BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    participants    INT             NOT NULL DEFAULT 1,
    status          VARCHAR(20)     NOT NULL DEFAULT 'CONFIRMED',
    registered_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at    DATETIME        NULL,
    INDEX idx_registrations_activity (activity_id),
    INDEX idx_registrations_user (user_id),
    UNIQUE KEY uk_activity_user (activity_id, user_id),
    CONSTRAINT fk_registrations_activity FOREIGN KEY (activity_id) REFERENCES activities(id),
    CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 等待队列表
CREATE TABLE waitlist (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    activity_id     BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    queue_position  INT             NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'WAITING',
    notified_at     DATETIME        NULL,
    confirm_deadline DATETIME       NULL,
    joined_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_waitlist_activity (activity_id),
    UNIQUE KEY uk_waitlist_activity_user (activity_id, user_id),
    CONSTRAINT fk_waitlist_activity FOREIGN KEY (activity_id) REFERENCES activities(id),
    CONSTRAINT fk_waitlist_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. 好友关系表
CREATE TABLE friendships (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    from_user_id    BIGINT          NOT NULL,
    to_user_id      BIGINT          NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    from_note       VARCHAR(100)    NULL,
    to_note         VARCHAR(100)    NULL,
    from_group      VARCHAR(50)     NULL,
    to_group        VARCHAR(50)     NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_friendships_from (from_user_id),
    INDEX idx_friendships_to (to_user_id),
    UNIQUE KEY uk_friendship_pair (from_user_id, to_user_id),
    CONSTRAINT fk_friendships_from FOREIGN KEY (from_user_id) REFERENCES users(id),
    CONSTRAINT fk_friendships_to FOREIGN KEY (to_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. 关注关系表
CREATE TABLE follows (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    follower_id     BIGINT          NOT NULL,
    following_id    BIGINT          NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_follows_follower (follower_id),
    INDEX idx_follows_following (following_id),
    UNIQUE KEY uk_follow_pair (follower_id, following_id),
    CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id),
    CONSTRAINT fk_follows_following FOREIGN KEY (following_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. 会话表
CREATE TABLE conversations (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user1_id        BIGINT          NOT NULL,
    user2_id        BIGINT          NOT NULL,
    last_message    VARCHAR(1000)   NULL,
    last_message_at DATETIME        NULL,
    unread_count_u1 INT             NOT NULL DEFAULT 0,
    unread_count_u2 INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_conversations_user1 (user1_id),
    INDEX idx_conversations_user2 (user2_id),
    UNIQUE KEY uk_conversation_pair (user1_id, user2_id),
    CONSTRAINT fk_conversations_u1 FOREIGN KEY (user1_id) REFERENCES users(id),
    CONSTRAINT fk_conversations_u2 FOREIGN KEY (user2_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. 消息表
CREATE TABLE messages (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT          NOT NULL,
    sender_id       BIGINT          NOT NULL,
    content         VARCHAR(2000)   NOT NULL,
    type            VARCHAR(20)     NOT NULL DEFAULT 'TEXT',
    status          VARCHAR(20)     NOT NULL DEFAULT 'DELIVERED',
    sent_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at         DATETIME        NULL,
    recalled_at     DATETIME        NULL,
    INDEX idx_messages_conversation (conversation_id),
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_sent_at (sent_at),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. 文件上传记录表
CREATE TABLE uploads (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    url             VARCHAR(500)    NOT NULL,
    filename        VARCHAR(255)    NOT NULL,
    size            BIGINT          NOT NULL,
    type            VARCHAR(50)     NOT NULL,
    uploaded_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_uploads_user (user_id),
    CONSTRAINT fk_uploads_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 初始数据由 DataInitializer.java 自动插入
-- 启动Spring Boot后会自动创建:
--   管理员: admin@platform.com / admin123
--   个人用户: user@test.com / test1234
--   商家用户: business@test.com / test1234
-- =============================================
