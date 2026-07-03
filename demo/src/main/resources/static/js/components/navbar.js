// ====== 导航栏组件 ======
// 由 index.html 自动加载，不需要手动调用
// 根据登录状态自动显示/隐藏导航项
// 其他人如需加导航项，在下面 menus 数组中追加即可

var Navbar = {
    menus: [
        { path: '/home',       icon: '🏠', label: '首页' },
        { path: '/create-activity', icon: '➕', label: '创建' },
        { path: '/ai-create', icon: '🤖', label: 'AI创建' },
        { path: '/activities', icon: '📋', label: '活动' },
        { path: '/my-activities', icon: '📁', label: '我的活动' },
        { path: '/teams',      icon: '🎯', label: '小队发现' },
        { path: '/my-teams',   icon: '👥', label: '我的小队' },
        { path: '/map',        icon: '🗺️', label: '地图' },
        { path: '/friends',    icon: '👫', label: '好友' },
        { path: '/chat',       icon: '💬', label: '聊天' },
        { path: '/discover',   icon: '🔍', label: '发现' },
        { path: '/follows',    icon: '⭐', label: '关注' },
        { path: '/profile',    icon: '👤', label: '资料' },
        { path: '/admin',      icon: '⚙️', label: '管理', adminOnly: true }
    ],

    render: function() {
        var user = getCurUser();
        if (!user) return '';  // 未登录不显示导航栏

        if (user.status === 'pending') {
            var roleMap = { user:'个人用户', business:'商家用户', admin:'管理员' };
            return '<nav class="navbar" id="mainNav">' +
                '<span class="brand" onclick="Router.navigate(\'/pending\')" style="cursor:pointer;">🎯 趣聚</span>' +
                '<div class="nav-links"></div>' +
                '<div class="user-info">' +
                    '<span style="font-size:13px;color:#f59e0b;margin-right:8px;">⏳ 审核中 | ' + user.nickname + '</span>' +
                    '<button class="btn btn-outline btn-sm" onclick="clearToken();Router.navigate(\'/login\');">退出</button>' +
                '</div></nav>';
        }

        var currentPath = window.location.hash.slice(1) || '/home';
        var navHtml = '';
        for (var i = 0; i < this.menus.length; i++) {
            var m = this.menus[i];
            if (m.adminOnly && user.role !== 'admin') continue;
            var active = (currentPath === m.path || (m.path !== '/home' && currentPath.indexOf(m.path) === 0));
            navHtml += '<a href="#'+m.path+'" class="nav-item'+(active?' active':'')+'">'+
                '<span class="nav-icon">'+m.icon+'</span>'+
                '<span class="nav-label">'+m.label+'</span></a>';
        }
        var roleMap = { user:'个人用户', business:'商家用户', admin:'管理员' };
        return `\
        <nav class="navbar" id="mainNav">
            <span class="brand" onclick="Router.navigate('/home')" style="cursor:pointer;">🎯 趣聚</span>
            <div class="nav-links">${navHtml}</div>
            <div class="user-info">
                <span style="font-size:13px;color:var(--text-secondary);margin-right:8px;">${(roleMap[user.role]||'')+' | '+user.nickname}</span>
                <button class="btn btn-outline btn-sm" onclick="clearToken();Router.navigate('/login');">退出</button>
            </div>
        </nav>`;
    }
};
