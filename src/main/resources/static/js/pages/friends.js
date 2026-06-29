// ====== 好友页（占位，留待P5实现） ======
Router.register('/friends', {
    title: '我的好友',
    requireAuth: true,

    render: function() {
        return `
        <div class="home-content">
            <div class="welcome-card"><h2>我的好友</h2><p>管理好友关系和聊天</p></div>
            <div class="card" style="text-align:center;padding:40px;color:var(--text-secondary);">
                <p style="font-size:48px;margin-bottom:12px;">🚧</p>
                <p style="font-weight:700;font-size:16px;">此页面由 P5 负责开发</p>
                <p style="font-size:13px;margin-top:4px;">功能：好友列表 + 添加好友 + 关注管理 + 聊天入口</p>
                <p style="font-size:13px;">对应故事：US-024, US-025, US-026</p>
                <p style="font-size:12px;margin-top:8px;color:var(--primary);">API: GET/POST /friends | POST /follow</p>
            </div>
        </div>`;
    },
    init: function() {}
});
