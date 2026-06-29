// ====== 首页（仪表盘） ======
Router.register('/home', {
    title: '首页',
    requireAuth: true,

    render: function() {
        var u = getCurUser();
        return `
        <div id="homeContent" class="home-content">
            <div class="welcome-card">
                <h2>你好，${u ? u.nickname : ''}</h2>
                <p id="homeSub">欢迎回到趣聚平台</p>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
                <div class="card" style="text-align:center;cursor:pointer;padding:20px;" onclick="Router.navigate('/profile')">
                    <div style="font-size:32px;margin-bottom:8px;">👤</div>
                    <div style="font-weight:700;">我的资料</div>
                    <div style="font-size:12px;color:var(--text-secondary);">查看和编辑个人信息</div>
                </div>
                <div class="card" style="text-align:center;cursor:pointer;padding:20px;" onclick="Router.navigate('/activities')">
                    <div style="font-size:32px;margin-bottom:8px;">📋</div>
                    <div style="font-weight:700;">活动广场</div>
                    <div style="font-size:12px;color:var(--text-secondary);">发现精彩线下活动</div>
                </div>
                <div class="card" style="text-align:center;cursor:pointer;padding:20px;" onclick="Router.navigate('/friends')">
                    <div style="font-size:32px;margin-bottom:8px;">💬</div>
                    <div style="font-weight:700;">我的好友</div>
                    <div style="font-size:12px;color:var(--text-secondary);">管理好友和聊天</div>
                </div>
                <div class="card" style="text-align:center;cursor:pointer;padding:20px;background:#f8fafc;">
                    <div style="font-size:32px;margin-bottom:8px;">🚧</div>
                    <div style="font-weight:700;">更多功能</div>
                    <div style="font-size:12px;color:var(--text-secondary);">开发中...</div>
                </div>
            </div>
        </div>`;
    },
    init: function() {}
});
