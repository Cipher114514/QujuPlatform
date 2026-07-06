// ====== 趣聚 SPA Hash 路由 ======
// 用法：在 pages/ 目录下创建 yourPage.js，然后调用 Router.register('/yourPath', yourPageConfig)
// 详见 README-新人接入指南.md

const Router = {
    routes: {},
    patternRoutes: [],   // [{ pattern: '/activity/:id', regex: /^\/activity\/([^/]+)$/, paramNames: ['id'], config }]
    currentPath: null,
    currentConfig: null,
    currentParams: null,

    /**
     * 注册一个页面
     * @param {string} path   hash路径，如 '/login', '/register', '/home', '/chat/:userId'
     *   支持路径参数：'/activity/:id' 会匹配 '/activity/123'
     * @param {object} config {
     *   title: '页面标题',
     *   requireAuth: true|false,     // 是否需要登录
     *   authOnly: true|false,        // 已登录用户不可访问（如登录页）
     *   render: (params) => htmlString,    // 返回HTML字符串
     *   init: (params) => void,            // 页面挂载后初始化（绑定事件等）
     *   destroy: () => void                // 页面离开时清理
     * }
     */
    register(path, config) {
        this.routes[path] = config;

        // 如果包含 :param，解析为模式路由
        if (path.indexOf(':') !== -1) {
            var paramNames = [];
            var regexStr = '^' + path.replace(/:([^/]+)/g, function(_, name) {
                paramNames.push(name);
                return '([^/]+)';
            }) + '$';
            this.patternRoutes.push({
                pattern: path,
                regex: new RegExp(regexStr),
                paramNames: paramNames,
                config: config
            });
        }

        console.log('[Router] 已注册:', path, config.title || '');
    },

    /** 跳转到指定路径 */
    navigate(path) {
        window.location.hash = path;
    },

    /** 获取当前路由参数 */
    getParams() {
        return this.currentParams || {};
    },

    /** 启动路由监听 */
    start() {
        window.addEventListener('hashchange', () => this._load());
        window.addEventListener('load', () => this._load());
    },

    /** 内部：加载当前哈希对应的页面 */
    _load() {
        const rawHash = window.location.hash.slice(1) || '/login';

        // 分离路径和查询参数
        var qIndex = rawHash.indexOf('?');
        var hash = qIndex !== -1 ? rawHash.substring(0, qIndex) : rawHash;
        var queryStr = qIndex !== -1 ? rawHash.substring(qIndex + 1) : '';

        // 将查询参数保存到 Router.query
        Router.query = {};
        if (queryStr) {
            var pairs = queryStr.split('&');
            for (var k = 0; k < pairs.length; k++) {
                var kv = pairs[k].split('=');
                if (kv.length === 2) {
                    Router.query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
                }
            }
        }

        var config = this.routes[hash];
        var params = {};

        // 精确匹配失败，尝试模式匹配
        if (!config) {
            for (var i = 0; i < this.patternRoutes.length; i++) {
                var pr = this.patternRoutes[i];
                var match = hash.match(pr.regex);
                if (match) {
                    config = pr.config;
                    for (var j = 0; j < pr.paramNames.length; j++) {
                        params[pr.paramNames[j]] = match[j + 1];
                    }
                    break;
                }
            }
        }

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

        // 审核中守卫：PENDING 用户只能访问 /pending 和 /login
        if (getToken()) {
            var curUser = getCurUser();
            if (curUser && curUser.status === 'pending' && hash !== '/pending' && hash !== '/login') {
                this.navigate('/pending');
                return;
            }
        }

        // 销毁旧页面
        if (this.currentConfig && this.currentConfig.destroy) {
            this.currentConfig.destroy();
        }

        // 渲染新页面
        this.currentPath = hash;
        this.currentConfig = config;
        this.currentParams = params;
        document.title = (config.title || '趣聚') + ' - 趣聚';
        document.getElementById('app').innerHTML = config.render(params);
        if (config.init) config.init(params);

        // 更新侧边栏高亮
        if (typeof Navbar !== 'undefined' && Navbar.updateActive) {
            Navbar.updateActive();
        }

        // 滚动到顶部
        window.scrollTo(0, 0);
    }
};
