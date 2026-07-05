// ====== 商家审核中页面 ======
Router.register('/pending', {
    title: '审核中',
    requireAuth: true,

    render: function() {
        var user = getCurUser();
        return `
        <div class="container" style="text-align:center;padding:60px 20px;">
            <div style="font-size:64px;margin-bottom:16px;">⏳</div>
            <h1>审核中</h1>
            <p style="color:var(--text-secondary);margin-bottom:8px;font-size:16px;">商家账号 <b>${escapeHtml(user ? user.nickname : '')}</b></p>
            <p style="color:var(--text-secondary);margin-bottom:24px;">您的商家资质正在由平台管理员审核，请耐心等待。</p>
            <div class="card" style="display:inline-block;text-align:left;padding:20px 24px;margin-bottom:24px;">
                <div style="font-size:14px;color:var(--text-secondary);line-height:1.8;">
                    <p>📧 审核通过后将通过邮箱通知您</p>
                    <p>⏰ 通常审核时间为 1-2 个工作日</p>
                    <p>🔄 审核通过后刷新页面即可正常使用</p>
                </div>
            </div>
            <div>
                <button class="btn btn-outline" onclick="clearToken();Router.navigate('/login');">退出登录</button>
            </div>
        </div>`;
    },

    init: function() {},

    destroy: function() {}
});

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
