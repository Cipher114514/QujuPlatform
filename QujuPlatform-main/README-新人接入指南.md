# 新人接入指南 — 如何添加你的页面

> 这篇文档教你三分钟内上手。前半部分快速入门，后半部分深入模板。

---

## 一、项目结构速览

```
demo/demo/src/main/resources/static/
├── index.html                  ← SPA壳子，加载所有JS，不要动
├── css/
│   └── style.css               ← 全局CSS（变量、按钮、表单、导航、卡片、Toast全齐）
└── js/
    ├── api.js                  ← API封装 + Token管理 + Toast + 快捷API
    ├── router.js               ← Hash路由（页面注册、导航、鉴权守卫）
    ├── components/
    │   └── navbar.js           ← 顶部导航栏，改 menus 数组即可加导航项
    └── pages/                  ← ★ 你的页面 JS 全部放这里 ★
        ├── login.js            ← P1 已写好
        ├── register.js         ← P1 已写好
        ├── home.js             ← 首页仪表盘 已写好
        ├── profile.js          ← P1 已写好
        ├── activities.js       ← P3 占位（替换此文件即可）
        └── friends.js          ← P5 占位（替换此文件即可）
```

**运行机制：**
```
浏览器打开 http://localhost:8080
    → Spring Boot 返回 static/index.html
    → index.html 按顺序加载 api.js → router.js → navbar.js → 各 pages/*.js
    → 每个 pages/*.js 调用 Router.register() 把自己的路径和配置注册到路由器
    → Router.start() 监听浏览器 hash 变化
    → 用户访问 #/login → 路由器找到对应的 config → 执行 render() → 插入 #app 区域 → 执行 init()
```

---

## 二、三步接入流程

### 第1步：创建你的页面 JS 文件

在 `static/js/pages/` 下新建一个 `.js` 文件，比如 `create-activity.js`：

```javascript
// ====== 活动创建页 ======
Router.register('/create-activity', {
    title: '创建活动',
    requireAuth: true,

    render: function() {
        // 返回一段 HTML 字符串，会被插入到 <div id="app"> 中
        return `
        <div class="home-content">
            <div class="welcome-card"><h2>创建活动</h2><p>填写活动信息</p></div>
            <div class="card">
                <form id="createForm">
                    <div class="form-group">
                        <label>活动名称 *</label>
                        <input type="text" id="title" placeholder="请输入活动名称" required>
                    </div>
                    <div class="form-group">
                        <label>活动简介 *</label>
                        <textarea id="description" rows="4" placeholder="描述你的活动"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" id="submitBtn">发布活动</button>
                </form>
            </div>
        </div>`;
    },

    init: function() {
        // render() 执行后自动调用 init()，在这里绑定事件
        document.getElementById('createForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            var btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> 发布中...';

            try {
                var res = await api('/activities', {
                    method: 'POST',
                    body: {
                        title: document.getElementById('title').value,
                        description: document.getElementById('description').value
                    }
                });
                toast('创建成功！');
                Router.navigate('/activities');
            } catch (err) {
                toast(err.message, 'error');
                btn.disabled = false;
                btn.textContent = '发布活动';
            }
        });
    },

    destroy: function() {
        // 可选：离开页面时清理定时器、WebSocket连接等
    }
});
```

### 第2步：在 `index.html` 中引入

打开 `static/index.html`，在最后一个 `<script src="/js/pages/...">` 后面加一行：

```html
<script src="/js/pages/create-activity.js"></script>
```

### 第3步：（可选）加导航栏入口

打开 `static/js/components/navbar.js`，在 `menus` 数组末尾加一项：

```javascript
var Navbar = {
    menus: [
        { path: '/home',       icon: '🏠', label: '首页' },
        { path: '/activities', icon: '📋', label: '活动' },
        { path: '/friends',    icon: '💬', label: '好友' },
        { path: '/profile',    icon: '👤', label: '资料' },
        // ↓ 加在这
        { path: '/create-activity', icon: '➕', label: '创建' }
    ],
    // ...
};
```

**搞定。** 重启 Spring Boot，浏览器访问 `http://localhost:8080/#/create-activity` 即可看到你的页面。

---

## 三、Router.register() 完整配置说明

```javascript
Router.register('/your/path', {

    // 【必填】浏览器标签页标题
    title: '页面标题',

    // 【可选】true = 必须登录才能访问，未登录自动跳转到 /login
    requireAuth: true,

    // 【可选】true = 已登录用户不可访问（如登录页、注册页用这个）
    authOnly: true,

    // 【必填】返回 HTML 字符串。路由匹配时执行，结果插入 #app
    render: function() {
        return '<div>Hello World</div>';
    },

    // 【可选】render() 执行后立即调用。在这里绑定事件、发请求
    init: function() {
        // document.getElementById 在这里才可用
        // 因为 render() 已经把 HTML 插入 DOM 了
    },

    // 【可选】离开页面时调用。清理定时器、WebSocket连接等
    destroy: function() {
        // clearInterval(this.timer);
    }
});
```

---

## 四、api() 完整用法

### 4.1 基础调用

```javascript
// GET — 查列表
var res = await api('/activities?page=1&size=10&category=sports');
// res = { code: 200, message: "success", data: { list: [...], pagination: {...} } }

// GET — 查详情（路径参数）
var res = await api('/activities/' + activityId);

// POST — 创建
var res = await api('/activities', {
    method: 'POST',
    body: { title: '活动名称', category: 'sports', maxParticipants: 20 }
});

// PUT — 更新
var res = await api('/users/me', {
    method: 'PUT',
    body: { nickname: '新昵称', bio: '新简介' }
});

// DELETE — 删除
var res = await api('/friends/' + userId, { method: 'DELETE' });
```

### 4.2 文件上传

```javascript
var file = document.getElementById('fileInput').files[0];
var fd = new FormData();
fd.append('file', file);
fd.append('type', 'avatar');   // avatar / business_license / activity / image

var res = await api('/upload', { method: 'POST', body: fd });
// res.data.url 就是文件路径
```

### 4.3 错误处理

```javascript
try {
    var res = await api('/activities', { method: 'POST', body: {...} });
    toast('操作成功');
} catch (err) {
    // err.code    — HTTP状态码 或 业务错误码
    // err.message — 错误描述文字
    toast(err.message, 'error');
}
// 注意：401 时 api() 会自动清除 token 并跳转登录页，不用你手动处理
```

### 4.4 快捷API（直接用，不用拼路径）

```javascript
// 已在 api.js 中预封装好：
var res = await AuthAPI.login({ email: '...', password: '...' });
var res = await AuthAPI.register({ email: '...', password: '...', nickname: '...', role: 'user' });
var res = await UserAPI.profile();          // GET /users/me
var res = await UserAPI.update({ ... });    // PUT /users/me
var res = await UploadAPI.upload(file, 'avatar');  // POST /upload

// 你可以自己在 api.js 末尾追加更多快捷API：
// var ActivityAPI = {
//     list: function(params) { return api('/activities?' + new URLSearchParams(params)); },
//     detail: function(id) { return api('/activities/' + id); },
//     create: function(body) { return api('/activities', { method:'POST', body:body }); }
// };
```

---

## 五、CSS 样式速查

### 5.1 布局容器

| 类名 | 宽度 | 用途 |
|------|------|------|
| `.container` | 最大 440px | 登录/注册等窄页面 |
| `.home-content` | 最大 640px | 首页、列表、详情等宽页面 |

```html
<div class="home-content">
    <!-- 你页面的全部内容放在这里 -->
</div>
```

### 5.2 卡片

```html
<!-- 普通白卡片 -->
<div class="card">内容</div>

<!-- 紫色渐变卡片（适合放在页面顶部做标题区） -->
<div class="welcome-card">
    <h2>页面标题</h2>
    <p>副标题说明</p>
</div>
```

### 5.3 表单

```html
<div class="form-group">
    <label>字段名 *</label>                          <!-- * 表示必填，实际校验你自己做 -->
    <input type="text" placeholder="请输入..." required>
    <p class="hint">帮助提示文字</p>                  <!-- 灰色小字，放约束说明 -->
</div>

<!-- 支持的类型：input[type=text/email/password/tel/date/number] -->
<!--           select、textarea 都会自动适配样式 -->
```

### 5.4 按钮

```html
<button class="btn btn-primary">主按钮</button>     <!-- 紫色实心，用于提交 -->
<button class="btn btn-outline">次按钮</button>     <!-- 白色边框，用于取消 -->
<button class="btn btn-danger">危险按钮</button>    <!-- 红色，用于删除 -->
<button class="btn btn-sm">小按钮</button>          <!-- 和 btn-primary 等组合 -->

<!-- 禁用态 + loading -->
<button class="btn btn-primary" disabled>
    <span class="spinner"></span> 提交中...
</button>
```

### 5.5 提示条

```html
<!-- 成功提示 -->
<div class="alert alert-success show">操作成功！</div>

<!-- 错误提示 -->
<div class="alert alert-error show">操作失败！</div>

<!-- 默认隐藏，用 JS 加 show 类显示 -->
<div id="myAlert" class="alert alert-error"></div>
<script>
    document.getElementById('myAlert').textContent = '出错了';
    document.getElementById('myAlert').className = 'alert alert-error show';
</script>
```

### 5.6 标签/徽章

```html
<span class="role-badge user">个人用户</span>
<span class="role-badge business">商家用户</span>
<span class="role-badge admin">管理员</span>
```

### 5.7 文件上传区域

```html
<div class="file-upload" onclick="document.getElementById('myFile').click()">
    <div class="icon">📄</div>
    <div class="text">点击上传文件</div>
    <div class="filename" id="fileName"></div>
</div>
<input type="file" id="myFile" accept="image/*" style="display:none;"
       onchange="document.getElementById('fileName').textContent=this.files[0].name">
<p class="hint">支持 JPG、PNG，不超过5MB</p>
```

### 5.8 加载动画

```html
<span class="spinner"></span>
<!-- 在白色背景上用，颜色会自动适配 -->
```

---

## 六、全局工具函数速查

| 函数 | 返回 | 说明 |
|------|------|------|
| `getToken()` | string | 当前 JWT，未登录返回 null |
| `getCurUser()` | object | 当前用户 `{id, email, nickname, role, status}` |
| `setCurUser(obj)` | void | 写入用户信息到 localStorage |
| `clearToken()` | void | 清除登录态（退出登录用） |
| `toast(msg)` | void | 绿色成功提示，2.5秒消失 |
| `toast(msg, 'error')` | void | 红色错误提示 |
| `Router.navigate(path)` | void | 跳转到 hash 路径 |

---

## 七、三种常见页面模板（直接复制改）

### 模板A：列表页（活动广场、好友列表、我的报名）

```javascript
Router.register('/my-list', {
    title: '我的列表',
    requireAuth: true,

    render: function() {
        return `
        <div class="home-content">
            <!-- 搜索栏 -->
            <div style="margin-bottom:16px;">
                <input type="text" id="searchInput" placeholder="搜索..."
                       style="width:100%;padding:10px 14px;border:1.5px solid var(--border);
                              border-radius:8px;font-size:14px;"
                       oninput="this._page.onSearch(this.value)">
            </div>
            <!-- 列表容器 -->
            <div id="listContainer">
                <p style="text-align:center;padding:40px;color:var(--text-secondary);">加载中...</p>
            </div>
            <!-- 加载更多 -->
            <div style="text-align:center;padding:16px;" id="loadMore">
                <button class="btn btn-outline btn-sm" id="loadMoreBtn" style="width:auto;">加载更多</button>
            </div>
        </div>`;
    },

    init: function() {
        var self = this;
        self.page = 1;
        self.keyword = '';

        // 把 this 挂到 DOM 上，方便 oninput 等内联事件回调
        document.getElementById('searchInput')._page = self;

        this.loadList();

        document.getElementById('loadMoreBtn').addEventListener('click', function() {
            self.page++;
            self.loadList(true);
        });
    },

    loadList: async function(append) {
        var container = document.getElementById('listContainer');
        if (!append) {
            container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-secondary);">加载中...</p>';
        }

        try {
            var params = '?page=' + this.page + '&size=10';
            if (this.keyword) params += '&keyword=' + encodeURIComponent(this.keyword);

            var res = await api('/api-path' + params);
            var list = res.data.list || [];

            if (list.length === 0 && !append) {
                container.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text-secondary);"><p style="font-size:40px;">📭</p><p>暂无数据</p></div>';
                document.getElementById('loadMore').style.display = 'none';
                return;
            }

            var html = list.map(function(item) {
                return `
                <div class="card" style="margin-bottom:12px;cursor:pointer;" onclick="Router.navigate('/detail/'+${item.id})">
                    <div style="font-weight:700;font-size:15px;margin-bottom:6px;">${escapeHtml(item.title || item.name)}</div>
                    <div style="font-size:13px;color:var(--text-secondary);">${escapeHtml(item.description || '')}</div>
                </div>`;
            }).join('');

            if (append) {
                container.insertAdjacentHTML('beforeend', html);
            } else {
                container.innerHTML = html;
            }

            document.getElementById('loadMore').style.display = list.length < 10 ? 'none' : 'block';
        } catch (err) {
            container.innerHTML = '<p style="text-align:center;color:var(--danger);padding:40px;">加载失败: ' + err.message + '</p>';
        }
    },

    onSearch: function(keyword) {
        this.keyword = keyword;
        this.page = 1;
        this.loadList(false);
    }
});

// HTML转义（防XSS）
function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
```

### 模板B：详情/表单页（活动详情、编辑资料、创建活动）

```javascript
Router.register('/detail/:id', {
    title: '详情',
    requireAuth: true,

    render: function() {
        return `
        <div class="home-content">
            <div id="detailContainer">
                <p style="text-align:center;padding:40px;color:var(--text-secondary);">
                    <span class="spinner" style="border-color:rgba(0,0,0,.15);border-top-color:var(--primary);display:inline-block;width:20px;height:20px;"></span> 加载中...
                </p>
            </div>
        </div>`;
    },

    init: function() {
        // 从 hash 中取参数
        var hash = window.location.hash;          // "#/detail/123"
        var parts = hash.split('/');              // ["#", "detail", "123"]
        var id = parts[parts.length - 1];          // "123"

        this.loadDetail(id);
    },

    loadDetail: async function(id) {
        var container = document.getElementById('detailContainer');
        try {
            var res = await api('/api-path/' + id);
            var item = res.data;

            container.innerHTML = `
                <div class="welcome-card"><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p></div>
                <div class="card">
                    <!-- 你的详情内容 -->
                    <div class="field"><span class="key">时间</span><span class="val">${item.startTime}</span></div>
                    <div class="field"><span class="key">地点</span><span class="val">${item.location}</span></div>
                </div>
                <button class="btn btn-primary" id="actionBtn" style="margin-top:16px;">执行操作</button>`;
        } catch (err) {
            container.innerHTML = '<p style="text-align:center;color:var(--danger);padding:40px;">加载失败: ' + err.message + '</p>';
        }
    }
});
```

### 模板C：带确认弹窗的操作（取消报名、删除好友、解散小队）

```javascript
function confirmAction(msg, onConfirm) {
    // 简单的浏览器原生确认框
    if (confirm(msg)) {
        onConfirm();
    }
}

// 使用：
document.getElementById('deleteBtn').addEventListener('click', function() {
    confirmAction('确定要删除吗？此操作不可恢复。', async function() {
        try {
            await api('/friends/' + userId, { method: 'DELETE' });
            toast('删除成功');
            Router.navigate('/friends');
        } catch (err) {
            toast(err.message, 'error');
        }
    });
});
```

---

## 八、导航栏工作原理

`navbar.js` 在每次路由切换时自动重新渲染：

```
用户访问 #/activities
    → Router 匹配到 /activities 页面
    → 触发 hashchange 事件
    → index.html 中的 updateNavbar() 执行
    → navbarSlot.innerHTML = Navbar.render()
    → Navbar.render() 读取当前 hash，匹配 menus 数组
    → 匹配到的菜单项高亮（加 .active 类）
    → 未登录返回空字符串（不显示导航栏）
```

**加导航项只需改一处：**

```javascript
// navbar.js
var Navbar = {
    menus: [
        { path: '/home',       icon: '🏠', label: '首页' },
        { path: '/activities', icon: '📋', label: '活动' },
        { path: '/friends',    icon: '💬', label: '好友' },
        { path: '/profile',    icon: '👤', label: '资料' },
        { path: '/my-new-page', icon: '⭐', label: '新页面' }  // ← 加这行
    ]
};
```

---

## 九、页面间传参

Hash路由本身不带 query string，传参有几种方式：

```javascript
// 方式1：路径里带ID（推荐）
Router.register('/activity/:id', { ... });  // 访问 #/activity/123
// 在 init() 中解析：var id = window.location.hash.split('/').pop();

// 方式2：存到 window 全局变量（临时）
window._sharedData = { activityId: 123 };
Router.navigate('/register-for-activity');
// 在目标页 init() 中读取：var id = window._sharedData.activityId;

// 方式3：localStorage（持久）
localStorage.setItem('currentActivityId', '123');
```

---

## 十、调试指南

```
1. 打开浏览器 → F12 → Console 面板
2. 看有没有红色报错
   常见错误：
   - "Router is not defined"       → router.js 没加载，检查 index.html 里的 script 顺序
   - "api is not defined"          → api.js 没加载
   - "Cannot read property 'xxx'"  → render() 返回的 HTML 里缺少某个 id 元素
   - "404"                         → API 路径写错了
   - "401"                         → Token 过期，会自动跳登录页

3. Network 面板
   - 看 XHR 请求的 Request/Response
   - 确认请求头里有没有 Authorization: Bearer xxx
   - 确认返回的 JSON 结构是否正确

4. 在代码里打 console.log
   - 比如 console.log('res:', res) 看 API 返回了什么
```

---

## 十一、各人开发清单

| 人 | 文件 | 路由 | 对应故事 | 页面类型 |
|----|------|------|---------|---------|
| **P1** | `pages/login.js` | `#/login` | US-003 | 表单页 |
| **P1** | `pages/register.js` | `#/register` | US-001,002 | 表单页 |
| **P1** | `pages/profile.js` | `#/profile` | US-004,005 | 详情页 |
| **P2** | 新建 `pages/create-activity.js` | `#/create-activity` | US-006 | 表单页 |
| **P2** | 新建 `pages/my-activities.js` | `#/my-activities` | US-009 | 列表页 |
| **P3** | 替换 `pages/activities.js` | `#/activities` | US-012,013 | 列表页（含搜索筛选） |
| **P3** | 新建 `pages/activity-detail.js` | `#/activity/:id` | US-015 | 详情页 |
| **P4** | 在 P3 的详情页中嵌入 | — | US-016,017,018 | 弹窗 + 列表 |
| **P5** | 替换 `pages/friends.js` | `#/friends` | US-024,025,026 | 列表页 |
| **P6** | 新建 `pages/chat.js` | `#/chat` | US-035,036 | 列表 + WebSocket |

---

## 十二、文件版本

- 版本: v2.0
- 更新: 2026-06-28
