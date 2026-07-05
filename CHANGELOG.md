# 前端体验升级 — 工作总结

> 分支：`main`（本地未提交修改）  
> 对比基线：`origin/main`

---

## 修改文件清单

| # | 文件 | 变更类型 |
|---|---|---|
| 1 | `static/css/style.css` | CSS 全面重构（+~1800 行） |
| 2 | `static/index.html` | 粒子背景 + 主题初始化 |
| 3 | `static/js/pages/login.js` | 登录页角色动画重构 |
| 4 | `static/js/pages/register.js` | 注册页粒子背景 |
| 5 | `static/js/pages/create-activity.js` | 封面图片上传组件 |
| 6 | `static/js/components/navbar.js` | 主题切换功能 |
| 7 | `static/js/router.js` | 页面过渡动画 |

---

## 一、CSS 全面重构 (`style.css`)

原始约 2100 行 → 重构后约 3900 行。

- **CSS 变量体系**：40+ 变量，覆盖品牌色/语义色/背景/文字/阴影/圆角/过渡
- **暗色模式**：`@media (prefers-color-scheme: dark)` + `[data-theme="dark"]` 双路径，全组件适配（卡片、表单、模态框、聊天、侧边栏等）
- **骨架屏** `.skeleton-*`：加载占位动画
- **徽章** `.badge-*`：6 种颜色变体，暗色适配
- **封面上传** `.cover-upload-*`：拖拽区、预览、进度条样式
- **登录页角色** `.char-*`：4 个几何角色动画样式
- **工具类**：`.text-*`、`.flex-*`、`.gap-*`、`.mt-*` 等
- **其他**：空状态 `.empty-state`、模态框完善、自定义滚动条

---

## 二、暗色模式

| 文件 | 关键变更 |
|---|---|
| `style.css` | 40+ CSS 变量 + `@media` / `[data-theme]` 暗色覆盖 |
| `index.html` | 启动时调用 `Navbar.initTheme()` 尽早应用，避免闪烁 |
| `navbar.js` | 侧边栏主题切换按钮；`toggleTheme()` 切换并持久化 localStorage；`initTheme()` 遵循用户偏好 > 系统偏好；监听系统主题变化 |

---

## 三、登录页角色动画 (`login.js`)

完全重构：左侧 4 个 CSS 几何角色（紫/黑/橙/黄），右侧登录表单。

| 行为 | 描述 |
|---|---|
| 鼠标追踪 | 4 个角色瞳孔实时跟随鼠标，身体微倾斜 |
| 输入邮箱 | 角色聚拢互相对视 |
| 输入密码（密文） | 紫/黑角色变高并向右侧倾斜"偷看" |
| 密码可见 | 紫色角色探头偷看，其他角色恢复正常 |
| 随机眨眼 | 紫/黑角色每隔 3-7 秒随机眨眼 |
| 清理 | `destroy()` 正确移除所有事件监听和 `requestAnimationFrame` |

---

## 四、粒子背景动画 (`index.html`)

100 个紫色粒子在 Canvas 中漂浮，粒子间距 < 150px 时绘制连线，鼠标靠近产生排斥力 + 光晕。仅登录/注册页显示（`body.login-page` 控制显隐）。

`register.js` 中添加 `login-page` class 启用粒子背景。

---

## 五、封面图片上传 (`create-activity.js`)

将封面从"URL 输入框"升级为可视化上传组件：

- 拖拽上传 / 点击选择文件
- JPG/PNG/WebP 格式校验，最大 5MB
- XHR 上传 + 实时进度条
- 上传成功缩略图预览，支持更换 / 移除
- 编辑/克隆模式自动回显已有封面

---

## 六、页面过渡动画 (`router.js`)

页面切换时 `#app` 添加 `.page-enter` 类，触发淡入 + 上移，400ms 后自动移除。
