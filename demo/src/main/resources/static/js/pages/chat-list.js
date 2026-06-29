// ====== 聊天会话列表页 ======
// 路由: #/chat
// 负责人: P7

const USE_MOCK_CHATLIST = true;

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
        const el = document.getElementById('chatListContent');
        if (!el) return;

        el.innerHTML = '<div class="loading">加载中...</div>';

        try {
            let data;
            if (USE_MOCK_CHATLIST) {
                data = MOCK_CONVERSATIONS;
            } else {
                const res = await MessageAPI.conversations();
                data = res.data;
            }
            this._data = data || [];
            this._renderList(el);
        } catch (e) {
            el.innerHTML = '<div class="empty-state">加载失败，请刷新重试</div>';
        }
    },

    _renderList: function (el) {
        const data = this._data;
        if (!data || data.length === 0) {
            el.innerHTML = '<div class="empty-state">暂无聊天消息</div>';
            return;
        }

        let html = '<div class="conversation-list">';
        for (let i = 0; i < data.length; i++) {
            const c = data[i];
            const tu = c.targetUser || {};
            const lastMsg = c.lastMessage || '';
            const summary = lastMsg.length > 30 ? lastMsg.substring(0, 30) + '...' : lastMsg;
            const timeStr = ChatListPage._formatTime(c.updatedAt);
            const unreadBadge = c.unreadCount > 0
                ? '<span class="badge">' + (c.unreadCount > 99 ? '99+' : c.unreadCount) + '</span>'
                : '';
            const avatarText = tu.nickname ? tu.nickname.charAt(0) : '?';

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

        // 绑定点击事件
        const items = el.querySelectorAll('.conversation-item');
        for (let i = 0; i < items.length; i++) {
            items[i].addEventListener('click', function () {
                const uid = this.getAttribute('data-user-id');
                if (uid) Router.navigate('/chat/' + uid);
            });
        }
    },

    _formatTime: function (dtStr) {
        if (!dtStr) return '';
        const d = new Date(dtStr);
        const now = new Date();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        if (d.toDateString() === now.toDateString()) {
            return hh + ':' + mm;
        }
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) {
            return '昨天';
        }
        return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
};

// ===== Mock 数据 =====
const MOCK_CONVERSATIONS = [
    {
        conversationId: 1,
        targetUser: { id: 2, nickname: '小明', avatar: '' },
        lastMessage: '明天篮球局别忘了带球！',
        unreadCount: 2,
        updatedAt: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
        conversationId: 2,
        targetUser: { id: 3, nickname: '小红', avatar: '' },
        lastMessage: '好的，到时候见~',
        unreadCount: 0,
        updatedAt: new Date(Date.now() - 120 * 60000).toISOString()
    },
    {
        conversationId: 3,
        targetUser: { id: 4, nickname: '户外运动俱乐部', avatar: '' },
        lastMessage: '这周末的徒步活动你要参加吗？路线已经规划好了，全程约8公里',
        unreadCount: 5,
        updatedAt: new Date(Date.now() - 60 * 60000).toISOString()
    }
];

Router.register('/chat', {
    title: '消息',
    requireAuth: true,
    render: function () { return ChatListPage.render(); },
    init: function () { ChatListPage.init(); },
    destroy: function () { ChatListPage.destroy(); }
});
