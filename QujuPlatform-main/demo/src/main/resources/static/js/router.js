// ====== 趣聚 SPA Hash 路由 ======
// 用法：在 pages/ 目录下创建 yourPage.js，然后调用 Router.register('/yourPath', yourPageConfig)
// 详见 README-新人接入指南.md

const Router = {
    routes: {},
    currentPath: null,
    currentConfig: null,

    /**
     * 注册一个页面
     * @param {string} path   hash路径，如 '/login', '/register', '/home'
     * @param {object} config {
     *   title: '页面标题',
     *   requireAuth: true|false,     // 是否需要登录
     *   authOnly: true|false,        // 已登录用户不可访问（如登录页）
     *   render: () => htmlString,    // 返回HTML字符串
     *   init: () => void,            // 页面挂载后初始化（绑定事件等）
     *   destroy: () => void          // 页面离开时清理
     * }
     */
    register(path, config) {
        this.routes[path] = config;
        console.log('[Router] 已注册:', path, config.title || '');
    },

    /** 跳转到指定路径 */
    navigate(path) {
        window.location.hash = path;
    },

    /** 启动路由监听 */
    start() {
        window.addEventListener('hashchange', () => this._load());
        window.addEventListener('load', () => this._load());
    },

    /** 内部：加载当前哈希对应的页面 */
    _load() {
        const hash = window.location.hash.slice(1) || '/activities';
        const config = this.routes[hash];

        // 404
        if (!config) {
            document.getElementById('app').innerHTML = `
                <div class="container" style="text-align:center;padding:60px 20px;">
                    <div style="font-size:64px;margin-bottom:16px;">🔍</div>
                    <h2>页面不存在</h2>
                    <p style="color:var(--text-secondary);margin-bottom:24px;">路径 ${hash} 未注册</p>
                    <button class="btn btn-primary" onclick="Router.navigate('/home')">返回首页</button>
                </div>`;
            return;
        }

        // 鉴权守卫
        if (config.requireAuth && !getToken()) {
            this.navigate('/login');
            return;
        }
        if (config.authOnly && getToken()) {
            this.navigate('/home');
            return;
        }

        // 销毁旧页面
        if (this.currentConfig && this.currentConfig.destroy) {
            this.currentConfig.destroy();
        }

        // 渲染新页面
        this.currentPath = hash;
        this.currentConfig = config;
        document.title = (config.title || '趣聚') + ' - 趣聚';
        document.getElementById('app').innerHTML = config.render();
        if (config.init) config.init();

        // 滚动到顶部
        window.scrollTo(0, 0);
    }
};
