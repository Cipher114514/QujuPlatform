// ====== 个人资料页 ======
Router.register('/profile', {
    title: '我的资料',
    requireAuth: true,

    render: function() {
        return `
        <div class="home-content">
            <div class="welcome-card"><h2>我的资料</h2><p>查看和编辑你的个人信息</p></div>
            <div class="card profile-card" id="profileCard">
                <div style="text-align:center;padding:24px;color:var(--text-secondary);">
                    <span class="spinner" style="border-color:rgba(0,0,0,.15);border-top-color:var(--primary);display:inline-block;width:20px;height:20px;"></span> 加载中...
                </div>
            </div>
        </div>`;
    },

    init: function() {
        this.load();
    },

    load: async function() {
        var card = document.getElementById('profileCard');
        try {
            var res = await UserAPI.profile();
            var u = res.data;
            var roleMap = { user:'个人用户', business:'商家用户', admin:'管理员' };
            var statusMap = { active:'正常', pending:'审核中', banned:'已封禁' };
            card.innerHTML = `
                <div class="field"><span class="key">用户ID</span><span class="val">${u.id}</span></div>
                <div class="field"><span class="key">邮箱</span><span class="val">${u.email}</span></div>
                <div class="field"><span class="key">昵称</span><span class="val">${u.nickname}</span></div>
                <div class="field"><span class="key">手机号</span><span class="val">${u.phone || '未设置'}</span></div>
                <div class="field"><span class="key">性别</span><span class="val">${u.gender || '未设置'}</span></div>
                <div class="field"><span class="key">生日</span><span class="val">${u.birthday || '未设置'}</span></div>
                <div class="field"><span class="key">个性签名</span><span class="val">${u.bio || '未设置'}</span></div>
                <div class="field"><span class="key">角色</span><span class="val"><span class="role-badge ${u.role}">${roleMap[u.role] || u.role}</span></span></div>
                <div class="field"><span class="key">状态</span><span class="val">${statusMap[u.status] || u.status}</span></div>
                ${u.role === 'business' ? '<div class="field"><span class="key">商家地址</span><span class="val">'+(u.address||'未设置')+'</span></div><div class="field"><span class="key">关注领域</span><span class="val">'+(u.businessFields||'未设置')+'</span></div>' : ''}
                <div class="field"><span class="key">注册时间</span><span class="val">${u.createdAt || ''}</span></div>`;
        } catch (err) {
            card.innerHTML = '<p style="text-align:center;color:var(--danger);padding:16px;">加载失败: '+err.message+'</p>';
        }
    }
});
