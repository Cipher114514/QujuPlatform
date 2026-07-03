# AGENTS.md — 趣聚平台 (QujuPlatform)

## 项目概述

趣聚是一个活动组织与社交平台，后端为 Spring Boot 3.x + JPA + MySQL，前端为纯原生 JavaScript SPA（无框架/无构建工具），通过嵌入式静态资源方式部署在 Spring Boot 中。

---

## 常用命令

项目位于 `demo/` 子目录下，所有 Gradle 命令需在该目录执行。

```bash
# 启动应用（开发模式，默认端口 8080）
cd demo
./gradlew bootRun          # Linux/macOS
gradlew.bat bootRun        # Windows

# 运行测试
./gradlew test

# 运行单个测试类
./gradlew test --tests "com.example.demo.DemoApplicationTests"

# 构建
./gradlew build

# 初始化数据库（首次启动前执行一次）
mysql -u root -p < init.sql
```

### 数据库切换

#### 切换到 H2（单人开发，无需安装 MySQL）

1. **修改 `demo/build.gradle`**：注释 MySQL，启用 H2
   ```gradle
   // MySQL (团队协作)
   // runtimeOnly 'com.mysql:mysql-connector-j'

   // H2 for dev (单人快速启动,无需安装MySQL)
   runtimeOnly 'com.h2database:h2'
   ```

2. **修改 `demo/src/main/resources/application.properties`**：
   - 注释掉 MySQL 配置（`spring.datasource.*`、`spring.jpa.properties.hibernate.dialect`）
   - 取消注释 H2 配置（`spring.datasource.url=jdbc:h2:mem:quju`）

#### 切换到 MySQL（团队协作）

1. **修改 `demo/build.gradle`**：注释 H2，启用 MySQL
   ```gradle
   // H2 for dev (单人快速启动,无需安装MySQL)
   // runtimeOnly 'com.h2database:h2'

   // MySQL (团队协作)
   runtimeOnly 'com.mysql:mysql-connector-j'
   ```

2. **修改 `demo/src/main/resources/application.properties`**：注释 H2，启用 MySQL 配置

3. **初始化数据库**：执行 `mysql -u root -p < init.sql`

---

## 技术栈

| 层 | 技术 |
|---|---|
| 后端框架 | Spring Boot 3.x (Java 21) |
| ORM | Spring Data JPA (Hibernate, `ddl-auto=update`) |
| 认证 | JWT (jjwt 0.12.6) + Spring Security, 无状态 |
| 实时通信 | STOMP over WebSocket (SockJS fallback) |
| 数据库 | MySQL 8.0（可切换 H2） |
| 前端 | 原生 JS (ES5/ES6)，无框架，哈希路由 SPA |
| 构建 | Gradle |

---

## 项目结构

```
QujuPlatform/
├── init.sql                         # 建表脚本（首次使用执行一次）
├── README-新人接入指南.md             # 新人前端页面开发指南
├── AGENTS.md                        # 本文件
└── demo/
    ├── build.gradle                 # 依赖：Spring Boot, JPA, Security, WebSocket, JWT, MySQL, Lombok
    ├── settings.gradle
    └── src/main/
        ├── resources/
        │   ├── application.properties
        │   └── static/              # ★ 前端 SPA 所有文件
        │       ├── index.html       # SPA 壳子，加载所有 JS/CSS
        │       ├── css/style.css    # 全局样式（CSS 变量 + 组件类）
        │       └── js/
        │           ├── api.js       # HTTP 封装 + Token 管理 + Toast
        │           ├── router.js    # Hash 路由器（注册/匹配/守卫）
        │           ├── ws-client.js # STOMP WebSocket 客户端
        │           ├── components/navbar.js  # 导航栏组件
        │           └── pages/       # 页面模块（每个文件自注册到一个路由）
        └── java/com/example/demo/
            ├── DemoApplication.java
            ├── common/Result.java           # 统一响应 {code, message, data}
            ├── config/
            │   ├── WebSocketConfig.java     # STOMP 端点 /ws，/topic /queue
            │   └── DataInitializer.java     # 启动时插入测试数据
            ├── controller/                  # REST 控制器（11个）
            ├── service/                     # 业务服务（14个）
            ├── entity/                      # JPA 实体（10个）
            ├── repository/                  # Spring Data 仓库（9个）
            ├── dto/                         # 请求/响应 DTO（18个）
            ├── security/
            │   ├── JwtUtil.java             # JWT 生成/解析
            │   ├── JwtAuthFilter.java       # 从 Authorization header 提取 JWT
            │   ├── SecurityConfig.java      # 安全配置 + CORS
            │   └── WebSocketAuthInterceptor.java  # WebSocket 握手时校验 JWT
            ├── websocket/
            │   ├── SessionManager.java      # 在线用户会话管理
            │   ├── StompChannelInterceptor.java  # STOMP CONNECT/DISCONNECT 处理
            │   └── WebSocketEventListener.java
            └── exception/
                ├── BusinessException.java
                └── GlobalExceptionHandler.java
```

---

## 后端架构

### 统一响应格式

所有 Controller 返回 `Result<T>`，序列化为：

```json
{ "code": 200, "message": "success", "data": {...} }
```

- `Result.ok(data)` — 成功 (code=200)
- `Result.fail("msg")` — 客户端错误 (code=400)
- `Result.fail(code, "msg")` — 自定义错误码

### 认证流程

1. 用户登录 → `AuthService` 返回 JWT（含 userId, email, role，24h 过期）
2. 前端将 JWT 存入 `localStorage.token`，每次请求通过 `api()` 自动附加 `Authorization: Bearer <token>`
3. `JwtAuthFilter` 拦截请求 → 解析 JWT → 从 DB 加载 User 实体 → 注入 `SecurityContext`
4. Controller 通过 `@AuthenticationPrincipal User currentUser` 获取当前用户
5. WebSocket 通过 URL 参数 `?token=<JWT>` 认证，`WebSocketAuthInterceptor` 在握手阶段校验

### 安全配置要点

- 公开路径：`/auth/**`、`/upload/**`、静态资源、`/ws/**`
- 公开 GET：`/activities/**`（游客可浏览活动）
- 其余路径需认证
- CORS 全部放开，CSRF 已禁用，会话无状态

### WebSocket 架构

- STOMP 端点：`/ws`（支持 SockJS）
- 应用前缀：`/app`（客户端发送到 `/app/xxx`）
- 广播目标：`/topic`（群发）
- 点对点目标：`/queue`（单播，配合 `convertAndSendToUser`）
- 心跳：10 秒间隔
- `SessionManager` 用 `ConcurrentHashMap` 维护 `userId → Set<sessionId>` 映射，支持多标签页

### 关键业务规则

- **互关即好友**：`FollowService.follow()` 检测到双向关注时，自动创建 `Friendship` 记录
- **报名原子操作**：`ActivityRepository.incrementParticipants` 使用 `@Modifying @Query` 原子 UPDATE，防止超卖
- **取消报名候补晋升**：`RegistrationManageService` 取消时会自动将等待队列第一名转为报名
- **标签和图片存储**：以逗号分隔字符串存 DB，在 Service/DTO 层解析为 `List<String>`

---

## 前端架构

### 路由系统

基于 `window.location.hash` 的 SPA 路由。每个页面 JS 文件在加载时调用 `Router.register(path, config)` 自注册。

```javascript
Router.register('/activity/:id', {
    title: '活动详情',          // 必填，浏览器标签页标题
    requireAuth: true,         // 可选，未登录 → 重定向 /login
    authOnly: true,            // 可选，已登录 → 重定向 /home（用于登录/注册页）

    render: function(params) {  // 必填，返回 HTML 字符串
        return '<div>...</div>';
    },

    init: function(params) {    // 可选，render 后调用，绑定事件/发请求
        // DOM 在此可用
    },

    destroy: function() {       // 可选，离开页面时清理
    }
});
```

路由支持 `:param` 动态路径参数，在 `render(params)` 和 `init(params)` 中接收。

### API 调用

```javascript
// 全局函数 api(path, options)，自动附加 Bearer token
var res = await api('/activities?page=1&size=10');
var res = await api('/activities', { method: 'POST', body: {...} });
var res = await api('/activities/' + id, { method: 'DELETE' });

// 文件上传
var fd = new FormData(); fd.append('file', file);
var res = await api('/upload', { method: 'POST', body: fd });

// 预封装的快捷 API 模块
AuthAPI.login({...})    UserAPI.profile()
UploadAPI.upload(f, t)  ActivityAPI.create({...})
MessageAPI.*            FollowAPI.*
```

- 401 时自动清除 token 并跳转 `/login`
- 错误格式：`{ code: number, message: string }`，通过 `catch(err)` 捕获

### WebSocket 客户端

```javascript
WsClient.connect();                          // 自动连接 + 指数退避重连
WsClient.subscribe('/topic/xxx', callback);  // 未连接时自动排队
WsClient.isConnected();                      // 查询状态
WsClient.disconnect();
```

### CSS 约定

CSS 变量定义在 `index.html` 的 `:root` 中：`--primary`(紫)、`--danger`(红)、`--bg`、`--card`、`--text`、`--border` 等。

页面布局使用 `.container`（窄，440px，用于登录/注册）或 `.home-content`（宽，640px，用于主页/列表）。

卡片用 `.card`，顶部强调卡片用 `.welcome-card`（紫色渐变），表单用 `.form-group > label + input/select/textarea`，按钮 `.btn.btn-primary|btn-outline|btn-danger|btn-sm`。

### 脚本加载顺序

`index.html` 中 `<script>` 标签的顺序决定了全局变量的可用性：

1. CDN：SockJS → STOMP
2. `api.js` → `router.js` → `ws-client.js`
3. `components/navbar.js`
4. `pages/*.js`（页面文件，每个调用 `Router.register`）

新增页面必须同时：① 在 `index.html` 添加 `<script>` 引入 ② 在 `navbar.js` 的 `menus` 数组添加导航项。

---

## 数据库表

共 10 张表：`users`、`activities`、`activity_templates`、`registrations`、`waitlist`、`friendships`、`follows`、`conversations`、`messages`、`uploads`。

完整建表语句在项目根目录的 `init.sql`。首次使用需手动执行，后续 JPA 的 `ddl-auto=update` 会自动同步实体变更。

`DataInitializer.java` 在启动时自动插入测试数据（10 个用户、6 个模板、8 个活动及关系数据），密码统一为 `test1234`。
