// ====== 侧边栏导航组件 ======
var Navbar = {
    // 分类菜单结构
    categories: [
        {
            icon: '📋', label: '活动',
            items: [
                { path: '/activities',      icon: '📋', label: '活动广场' },
                { path: '/my-activities',   icon: '📁', label: '我的活动' },
                { path: '/my-registrations',icon: '📝', label: '我的报名' },
                { path: '/create-activity', icon: '➕', label: '创建活动' },
                { path: '/ai-create',       icon: '🤖', label: 'AI 创建' },
            ]
        },
        {
            icon: '🎯', label: '小队',
            items: [
                { path: '/teams',    icon: '🎯', label: '小队发现' },
                { path: '/my-teams', icon: '👥', label: '我的小队' },
            ]
        },
        {
            icon: '💬', label: '社交',
            items: [
                { path: '/friends', icon: '👫', label: '好友' },
                { path: '/chat',    icon: '💬', label: '聊天' },
                { path: '/follows', icon: '⭐', label: '关注' },
            ]
        },
        {
            icon: '🗺️', label: '发现',
            items: [
                { path: '/discover', icon: '🔍', label: '发现用户' },
                { path: '/map',      icon: '🗺️', label: '活动地图' },
            ]
        },
    ],

    render: function() {
        var user = getCurUser();
        if (!user) return '';

        if (user.status === 'pending') {
            var roleMap = { user:'个人用户', business:'商家用户', admin:'管理员' };
            return '<nav class="sidebar">' +
                '<div class="sidebar-brand" onclick="Router.navigate(\'/pending\')">🎯 趣聚</div>' +
                '<div class="sidebar-nav" style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px;">' +
                    '<div style="text-align:center;color:#f59e0b;">⏳ 审核中<br><small>' + (roleMap[user.role] || '') + '</small></div>' +
                '</div>' +
                '<div class="sidebar-footer">' +
                    '<div class="sidebar-user"><span>' + user.nickname + '</span></div>' +
                    '<div class="sidebar-item" onclick="clearToken();Router.navigate(\'/login\');"><span class="s-icon">🚪</span><span class="s-label">退出</span></div>' +
                '</div></nav>';
        }

        var currentPath = window.location.hash.slice(1) || '/home';

        // 构建分类菜单 HTML
        var catHtml = '';
        for (var i = 0; i < this.categories.length; i++) {
            var cat = this.categories[i];
            // 检查当前路径是否匹配该分类下的任一子项
            var isCatActive = false;
            var flyoutId = 'flyout-' + i;
            var itemsHtml = '';
            for (var j = 0; j < cat.items.length; j++) {
                var item = cat.items[j];
                if (currentPath === item.path || (item.path !== '/home' && currentPath.indexOf(item.path) === 0)) {
                    isCatActive = true;
                }
                itemsHtml += '<a href="#' + item.path + '" class="flyout-item' + (currentPath === item.path || (item.path !== '/home' && currentPath.indexOf(item.path) === 0) ? ' active' : '') + '" onclick="Navbar.closeMobile();">' +
                    '<span class="fi-icon">' + item.icon + '</span>' +
                    '<span>' + item.label + '</span></a>';
            }
            catHtml += '<div class="sidebar-category" id="cat-' + i + '" onclick="Navbar.toggleMobileCat(' + i + ')">' +
                '<div class="sidebar-item' + (isCatActive ? ' active' : '') + '">' +
                    '<span class="s-icon">' + cat.icon + '</span>' +
                    '<span class="s-label">' + cat.label + '</span>' +
                    '<span class="s-arrow">▶</span>' +
                '</div>' +
                '<div class="sidebar-flyout" id="' + flyoutId + '">' +
                    '<div class="flyout-title">' + cat.label + '</div>' +
                    itemsHtml +
                '</div></div>';
        }

        var nameChar = user.nickname ? user.nickname.charAt(0) : '?';
        var roleMap = { user:'个人用户', business:'商家用户', admin:'管理员' };

        return '\
        <nav class="sidebar" id="mainSidebar">\
            <div class="sidebar-brand" onclick="Router.navigate(\'/home\');Navbar.closeMobile();">\
                🎯 趣聚\
            </div>\
            <div class="sidebar-nav" id="sidebarNav">\
                <a href="#/home" class="sidebar-item' + (currentPath === '/home' ? ' active' : '') + '" onclick="Navbar.closeMobile();">\
                    <span class="s-icon">🏠</span>\
                    <span class="s-label">首页</span>\
                </a>\
                ' + catHtml + '\
            </div>\
            <div class="sidebar-footer" id="sidebarFooter">\
                <a href="#/profile" class="sidebar-item' + (currentPath === '/profile' ? ' active' : '') + '" onclick="Navbar.closeMobile();">\
                    <span class="s-icon">👤</span>\
                    <span class="s-label">个人资料</span>\
                </a>' +
                (user.role === 'admin'
                    ? '<a href="#/admin" class="sidebar-item' + (currentPath === '/admin' ? ' active' : '') + '" onclick="Navbar.closeMobile();">' +
                        '<span class="s-icon">⚙️</span><span class="s-label">管理后台</span></a>'
                    : '') +
                '<div class="sidebar-user">' +
                    '<div class="su-avatar">' + nameChar + '</div>' +
                    '<div class="su-name" title="' + (user.nickname || '') + '">' + (user.nickname || '') + '</div>' +
                '</div>' +
                '<div class="sidebar-item" onclick="clearToken();Router.navigate(\'/login\');" style="cursor:pointer;">' +
                    '<span class="s-icon">🚪</span><span class="s-label">退出登录</span>' +
                '</div>' +
            '</div>' +
            '<div class="mobile-sidebar-toggle" onclick="Navbar.toggleMobile();">' +
                '<span></span><span></span><span></span>' +
            '</div>' +
        '</nav>';
    },

    // 手机端：切换侧边栏展开
    toggleMobile: function() {
        var nav = document.getElementById('sidebarNav');
        var footer = document.getElementById('sidebarFooter');
        if (!nav) return;
        nav.classList.toggle('mobile-open');
        if (footer) footer.classList.toggle('mobile-open');
    },

    // 关闭手机端菜单
    closeMobile: function() {
        var nav = document.getElementById('sidebarNav');
        var footer = document.getElementById('sidebarFooter');
        if (nav) nav.classList.remove('mobile-open');
        if (footer) footer.classList.remove('mobile-open');
    },

    // 手机端：切换分类展开
    toggleMobileCat: function(index) {
        if (window.innerWidth > 768) return; // 桌面端由 hover 处理
        var cat = document.getElementById('cat-' + index);
        if (!cat) return;
        cat.classList.toggle('open');
    },

    /** 路由切换后更新侧边栏高亮 */
    updateActive: function() {
        var currentPath = window.location.hash.slice(1) || '/home';

        // 首页
        var homeItem = document.querySelector('.sidebar-nav > a[href="#/home"]');
        if (homeItem) homeItem.classList.toggle('active', currentPath === '/home');

        // 遍历分类及 flyout 子项
        for (var i = 0; i < this.categories.length; i++) {
            var cat = this.categories[i];
            var catEl = document.getElementById('cat-' + i);
            if (!catEl) continue;

            var catActive = false;
            var catItem = catEl.querySelector('.sidebar-item');

            for (var j = 0; j < cat.items.length; j++) {
                var item = cat.items[j];
                var match = currentPath === item.path || (item.path !== '/home' && currentPath.indexOf(item.path) === 0);
                if (match) catActive = true;

                var flyoutItems = catEl.querySelectorAll('.flyout-item');
                if (flyoutItems[j]) {
                    flyoutItems[j].classList.toggle('active', match);
                }
            }

            if (catItem) catItem.classList.toggle('active', catActive);
        }

        // 个人资料
        var profileItem = document.querySelector('.sidebar-footer > a[href="#/profile"]');
        if (profileItem) profileItem.classList.toggle('active', currentPath === '/profile');

        // 管理后台
        var adminItem = document.querySelector('.sidebar-footer > a[href="#/admin"]');
        if (adminItem) adminItem.classList.toggle('active', currentPath === '/admin');
    }
};
