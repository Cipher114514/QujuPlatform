// ====== 聊天会话列表页 ======
// 路由: #/chat
// 负责人: P7

const ChatListPage = {
    _data: [],

    render: function () {
        return `
        <div class="container chat-list-container">
            <h2 style="margin-bottom:16px;">💬 消息</h2>
            <div id="chatListContent"></div>
        </div>`;
    },

    init: function () {
        this.loadConversations();
    },

    destroy: function () {},

    loadConversations: async function () {
        var el = document.getElementById('chatListContent');
        if (!el) return;

        el.innerHTML = '<div class="loading">加载中...</div>';

        try {
            var res = await MessageAPI.conversations();
            this._data = res.data || [];
            this._renderList(el);
        } catch (e) {
            el.innerHTML = '<div class="empty-state">加载失败，请刷新重试</div>';
        }
    },

    _renderList: function (el) {
        var data = this._data;
        if (!data || data.length === 0) {
            el.innerHTML = '<div class="empty-state">暂无聊天消息<br><small>去好友页面选一个好友开始聊天吧</small></div>';
            return;
        }

        var html = '<div class="conversation-list">';
        for (var i = 0; i < data.length; i++) {
            var c = data[i];
            var tu = c.targetUser || {};
            var lastMsg = c.lastMessage || '';
            var summary = lastMsg.length > 30 ? lastMsg.substring(0, 30) + '...' : lastMsg;
            var timeStr = ChatListPage._formatTime(c.updatedAt);
            var unreadBadge = c.unreadCount > 0
                ? '<span class="badge">' + (c.unreadCount > 99 ? '99+' : c.unreadCount) + '</span>'
                : '';
            var avatarText = tu.nickname ? tu.nickname.charAt(0) : '?';

            html += `
            <div class="conversation-item" data-user-id="${tu.id || ''}" style="cursor:pointer;display:flex;align-items:center;padding:12px;border-bottom:1px solid var(--border);gap:12px;">
                <div class="avatar-circle" style="width:48px;height:48px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;">
                    ${avatarText}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:600;">${tu.nickname || '未知用户'}</span>
                        <span style="font-size:12px;color:var(--text-secondary);">${timeStr}${unreadBadge}</span>
                    </div>
                    <div style="font-size:13px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px;">
                        ${summary || '暂无消息'}
                    </div>
                </div>
            </div>`;
        }
        html += '</div>';
        el.innerHTML = html;

        var items = el.querySelectorAll('.conversation-item');
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener('click', function () {
                var uid = this.getAttribute('data-user-id');
                if (uid) Router.navigate('/chat/' + uid);
            });
        }
    },

    _formatTime: function (dtStr) {
        if (!dtStr) return '';
        var d = new Date(dtStr);
        var now = new Date();
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        if (d.toDateString() === now.toDateString()) {
            return hh + ':' + mm;
        }
        var yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) {
            return '昨天';
        }
        return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
};

Router.register('/chat', {
    title: '消息',
    requireAuth: true,
    render: function () { return ChatListPage.render(); },
    init: function () { ChatListPage.init(); },
    destroy: function () { ChatListPage.destroy(); }
});
