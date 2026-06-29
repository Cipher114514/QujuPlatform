// ====== 活动广场（占位页，留待P3实现） ======
// P3接到任务后，替换此文件内容即可
Router.register('/activities', {
    title: '活动广场',
    requireAuth: true,

    render: function() {
        return `
        <div class="home-content">
            <div class="welcome-card"><h2>活动广场</h2><p>发现精彩线下活动</p></div>
            <div class="card" style="text-align:center;padding:40px;color:var(--text-secondary);">
                <p style="font-size:48px;margin-bottom:12px;">🚧</p>
                <p style="font-weight:700;font-size:16px;">此页面由 P3 负责开发</p>
                <p style="font-size:13px;margin-top:4px;">功能：活动信息流 + 搜索 + 筛选 + 详情</p>
                <p style="font-size:13px;">对应故事：US-012, US-013, US-015</p>
                <p style="font-size:12px;margin-top:8px;color:var(--primary);">API: GET /activities | GET /activities/search | GET /activities/:id</p>
                <button class="btn btn-outline btn-sm" style="margin-top:16px;width:auto;" onclick="toast('等待P3开发','success')">提醒P3开发</button>
            </div>
        </div>`;
    },
    init: function() {}
});
