// ====== 首页（仪表盘） ======
Router.register('/home', {
    title: '首页',
    requireAuth: true,

    render: function () {
        var u = getCurUser();
        return '\
        <div id="homeContent" class="home-content">\
            <div class="welcome-card">\
                <h2>你好，' + (u ? u.nickname : '') + '</h2>\
                <p id="homeSub">欢迎回到趣聚平台</p>\
            </div>\
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;" id="homeStats">\
                <div class="card" style="text-align:center;padding:18px;">\
                    <div style="font-size:28px;font-weight:700;color:var(--primary);" id="statActivities">-</div>\
                    <div style="font-size:12px;color:var(--text-secondary);">可报名活动</div>\
                </div>\
                <div class="card" style="text-align:center;padding:18px;">\
                    <div style="font-size:28px;font-weight:700;color:var(--primary);" id="statFriends">-</div>\
                    <div style="font-size:12px;color:var(--text-secondary);">我的好友</div>\
                </div>\
                <div class="card" style="text-align:center;padding:18px;">\
                    <div style="font-size:28px;font-weight:700;color:var(--primary);" id="statRegs">-</div>\
                    <div style="font-size:12px;color:var(--text-secondary);">已报名活动</div>\
                </div>\
                <div class="card" style="text-align:center;padding:18px;">\
                    <div style="font-size:28px;font-weight:700;color:var(--primary);" id="statCreated">-</div>\
                    <div style="font-size:12px;color:var(--text-secondary);">我创建的活动</div>\
                </div>\
            </div>\
            <div style="margin-bottom:12px;font-size:15px;font-weight:600;color:var(--text);">快捷入口</div>\
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">\
                <div class="card" style="text-align:center;cursor:pointer;padding:18px;" onclick="Router.navigate(\'/activities\')">\
                    <div style="font-size:28px;margin-bottom:6px;">📋</div>\
                    <div style="font-weight:700;font-size:14px;">活动广场</div>\
                    <div style="font-size:11px;color:var(--text-secondary);">发现精彩线下活动</div>\
                </div>\
                <div class="card" style="text-align:center;cursor:pointer;padding:18px;" onclick="Router.navigate(\'/ai-create\')">\
                    <div style="font-size:28px;margin-bottom:6px;">🤖</div>\
                    <div style="font-weight:700;font-size:14px;">创建活动</div>\
                    <div style="font-size:11px;color:var(--text-secondary);">AI 辅助快速创建</div>\
                </div>\
                <div class="card" style="text-align:center;cursor:pointer;padding:18px;" onclick="Router.navigate(\'/friends\')">\
                    <div style="font-size:28px;margin-bottom:6px;">👥</div>\
                    <div style="font-weight:700;font-size:14px;">好友管理</div>\
                    <div style="font-size:11px;color:var(--text-secondary);">好友列表与聊天</div>\
                </div>\
                <div class="card" style="text-align:center;cursor:pointer;padding:18px;" onclick="Router.navigate(\'/my-registrations\')">\
                    <div style="font-size:28px;margin-bottom:6px;">📝</div>\
                    <div style="font-weight:700;font-size:14px;">我的报名</div>\
                    <div style="font-size:11px;color:var(--text-secondary);">查看已报名活动</div>\
                </div>\
            </div>\
        </div>';
    },

    init: function () {
        loadHomeStats();
    }
});

async function loadHomeStats() {
    try {
        var results = await Promise.allSettled([
            api('/activities?size=1'),
            api('/friends'),
            api('/users/me/registrations'),
            api('/activities/my')
        ]);

        var actCount = results[0].status === 'fulfilled' ? (results[0].value.data.totalElements || 0) : 0;
        var friends = results[1].status === 'fulfilled' ? (results[1].value.data || []) : [];
        var regs = results[2].status === 'fulfilled' ? (results[2].value.data || []) : [];
        var myActs = results[3].status === 'fulfilled' ? (results[3].value.data || []) : [];

        setStat('statActivities', actCount);
        setStat('statFriends', friends.length);
        setStat('statRegs', regs.length);
        setStat('statCreated', Array.isArray(myActs) ? myActs.length : 0);
    } catch (e) {
        setStat('statActivities', '-');
        setStat('statFriends', '-');
        setStat('statRegs', '-');
        setStat('statCreated', '-');
    }
}

function setStat(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
}
