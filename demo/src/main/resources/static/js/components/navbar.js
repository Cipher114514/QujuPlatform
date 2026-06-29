// ====== 导航栏组件 ======
// 由 index.html 自动加载，不需要手动调用
// 根据登录状态自动显示/隐藏导航项
// 其他人如需加导航项，在下面 menus 数组中追加即可

var Navbar = {
    menus: [
        { path: '/home',       icon: '🏠', label: '首页' },
        { path: '/create-activity', icon: '➕', label: '创建' },
        { path: '/activities', icon: '📋', label: '活动' },
        { path: '/friends',    icon: '👥', label: '好友' },
        { path: '/chat',       icon: '💬', label: '聊天' },
        { path: '/profile',    icon: '👤', label: '资料' }
    ],

    render: function() {
        var user = getCurUser();
        if (!user) return '';  // 未登录不显示导航栏

        var currentPath = window.location.hash.slice(1) || '/home';
        var navHtml = '';
        for (var i = 0; i < this.menus.length; i++) {
            var m = this.menus[i];
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
