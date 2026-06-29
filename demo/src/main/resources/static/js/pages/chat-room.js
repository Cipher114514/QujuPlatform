// ====== 聊天窗口页 ======
// 路由: #/chat/:userId
// 负责人: P7

const USE_MOCK_CHAT = true;

const ChatRoomPage = {
    _conversationId: null,
    _targetUserId: null,
    _targetUser: null,
    _messages: [],
    _lastSentAt: null,
    _pollTimer: null,
    _page: 1,
    _hasMore: true,
    _loading: false,

    render: function (params) {
        const tu = this._targetUser || {};
        const nickname = tu.nickname || '聊天';
        return `
        <div class="container chat-room-container">
            <div class="chat-header">
                <button class="btn btn-outline btn-sm" id="chatBackBtn">← 返回</button>
                <span style="font-weight:700;font-size:16px;">${nickname}</span>
                <span style="width:60px;"></span>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="loading">加载中...</div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chatInput" class="chat-input" placeholder="输入消息..." maxlength="2000" />
                <button class="btn btn-primary" id="chatSendBtn">发送</button>
            </div>
        </div>`;
    },

    init: function (params) {
        // 从路由参数获取 userId
        var userId = params && params.userId ? parseInt(params.userId) : null;
        if (!userId) {
            Router.navigate('/chat');
            return;
        }
        this._targetUserId = userId;

        const self = this;

        // 返回按钮
        document.getElementById('chatBackBtn').addEventListener('click', function () {
            Router.navigate('/chat');
        });

        // 发送按钮
        document.getElementById('chatSendBtn').addEventListener('click', function () {
            self._sendMessage();
        });

        // Enter 发送, Shift+Enter 换行
        const input = document.getElementById('chatInput');
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                self._sendMessage();
            }
        });

        // 滚动加载历史
        const msgArea = document.getElementById('chatMessages');
        msgArea.addEventListener('scroll', function () {
            if (msgArea.scrollTop < 50 && self._hasMore && !self._loading) {
                self._loadMoreHistory();
            }
        });

        // 加载数据和开启轮询
        this._loadData();
    },

    destroy: function () {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    },

    // ========== 数据加载 ==========

    _loadData: async function () {
        try {
            if (USE_MOCK_CHAT) {
                this._conversationId = 1;
                this._targetUser = { id: this._targetUserId, nickname: '小明', avatar: '' };

                // 模拟根据 targetUserId 选择不同的 mock 对话
                if (this._targetUserId === 2) {
                    this._messages = [...MOCK_MESSAGES_USER2];
                } else if (this._targetUserId === 3) {
                    this._targetUser = { id: 3, nickname: '小红', avatar: '' };
                    this._messages = [...MOCK_MESSAGES_USER3];
                } else {
                    this._targetUser = { id: this._targetUserId, nickname: '用户' + this._targetUserId, avatar: '' };
                    this._messages = [];
                }

                if (this._messages.length > 0) {
                    this._lastSentAt = this._messages[this._messages.length - 1].sentAt;
                }
            } else {
                // 发送任意消息以获取/创建 conversationId
                // 先从会话列表找到或通过获取消息历史来定位
                const res = await MessageAPI.conversations();
                const convs = res.data || [];
                let foundConv = null;
                for (let i = 0; i < convs.length; i++) {
                    if (convs[i].targetUser && convs[i].targetUser.id === this._targetUserId) {
                        foundConv = convs[i];
                        break;
                    }
                }

                if (foundConv) {
                    this._conversationId = foundConv.conversationId;
                    this._targetUser = foundConv.targetUser;
                    // 标记已读
                    MessageAPI.markRead(this._conversationId).catch(function () {});
                } else {
                    // 没有历史会话，等发第一条消息时创建
                    this._targetUser = { id: this._targetUserId, nickname: '用户' + this._targetUserId, avatar: '' };
                }

                // 加载历史消息
                if (this._conversationId) {
                    const msgRes = await MessageAPI.messages(this._conversationId, 1, 20);
                    const pageData = msgRes.data;
                    this._messages = (pageData.list || []).reverse();
                    this._hasMore = (pageData.pagination && pageData.pagination.page < pageData.pagination.pages);
                    this._page = 1;
                    if (this._messages.length > 0) {
                        this._lastSentAt = this._messages[this._messages.length - 1].sentAt;
                    }
                }
            }
        } catch (e) {
            console.error('加载聊天数据失败:', e);
        }

        this._renderMessages();
        this._scrollToBottom();
        this._startPolling();
    },

    _loadMoreHistory: async function () {
        if (this._loading || !this._hasMore) return;
        this._loading = true;
        const nextPage = this._page + 1;

        try {
            if (USE_MOCK_CHAT) {
                // mock 无更多历史
                this._hasMore = false;
            } else {
                const res = await MessageAPI.messages(this._conversationId, nextPage, 20);
                const pageData = res.data;
                const older = (pageData.list || []).reverse();
                this._messages = older.concat(this._messages);
                this._page = nextPage;
                this._hasMore = (pageData.pagination && pageData.pagination.page < pageData.pagination.pages);
            }
        } catch (e) {
            console.error('加载历史失败:', e);
        }

        this._loading = false;
        this._renderMessages(true);
    },

    // ========== 轮询 ==========

    _startPolling: function () {
        const self = this;
        if (this._pollTimer) clearInterval(this._pollTimer);

        this._pollTimer = setInterval(async function () {
            if (USE_MOCK_CHAT) {
                // mock 模式下模拟对方发消息
                if (Math.random() < 0.3 && self._messages.length < 20) {
                    const newId = self._messages.length + 100;
                    const newMsg = {
                        id: newId,
                        senderId: self._targetUserId,
                        content: MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)],
                        status: 'DELIVERED',
                        sentAt: new Date().toISOString()
                    };
                    self._messages.push(newMsg);
                    self._lastSentAt = newMsg.sentAt;
                    self._renderMessages();
                    self._scrollToBottom();
                }
                return;
            }

            if (!self._conversationId || !self._lastSentAt) return;
            try {
                const res = await MessageAPI.newMessages(self._conversationId, self._lastSentAt);
                const newMsgs = res.data || [];
                if (newMsgs.length > 0) {
                    for (let i = 0; i < newMsgs.length; i++) {
                        if (newMsgs[i].senderId !== getCurUser().id) {
                            self._messages.push(newMsgs[i]);
                        }
                    }
                    self._lastSentAt = newMsgs[newMsgs.length - 1].sentAt;
                    self._renderMessages();
                    self._scrollToBottom();
                    // 有新消息自动标记已读
                    MessageAPI.markRead(self._conversationId).catch(function () {});
                }
            } catch (e) {
                // 轮询失败静默处理
            }
        }, 3000);
    },

    // ========== 发送消息 ==========

    _sendMessage: async function () {
        const input = document.getElementById('chatInput');
        const content = input.value.trim();
        if (!content) return;

        input.value = '';
        const curUser = getCurUser();
        const tempId = 'temp_' + Date.now();
        const now = new Date().toISOString();

        // 乐观更新：立即显示
        const tempMsg = {
            id: tempId,
            senderId: curUser ? curUser.id : 1,
            content: content,
            status: 'sending',
            sentAt: now
        };
        this._messages.push(tempMsg);
        this._renderMessages();
        this._scrollToBottom();

        try {
            if (USE_MOCK_CHAT) {
                // mock 模拟成功
                const idx = this._findMsgIndex(tempId);
                if (idx >= 0) {
                    this._messages[idx].id = Date.now();
                    this._messages[idx].status = 'DELIVERED';
                }
                this._lastSentAt = new Date().toISOString();
                this._renderMessages();
                this._scrollToBottom();
                return;
            }

            const res = await MessageAPI.send(this._targetUserId, content);
            const sent = res.data;

            // 更新消息状态
            const idx = this._findMsgIndex(tempId);
            if (idx >= 0) {
                this._messages[idx].id = sent.id;
                this._messages[idx].status = sent.status;
                this._messages[idx].sentAt = sent.sentAt;
            }

            // 首次发消息时获取 conversationId
            if (!this._conversationId && sent.conversationId) {
                this._conversationId = sent.conversationId;
            }
            this._lastSentAt = sent.sentAt;
            this._renderMessages();
            this._scrollToBottom();
        } catch (e) {
            const idx = this._findMsgIndex(tempId);
            if (idx >= 0) {
                this._messages[idx].status = 'failed';
            }
            this._renderMessages();
            toast('发送失败，请重试', 'error');
        }
    },

    // ========== 渲染 ==========

    _renderMessages: function (keepScroll) {
        const el = document.getElementById('chatMessages');
        if (!el) return;

        const curUser = getCurUser();
        const curId = curUser ? curUser.id : 1;
        const prevScrollHeight = el.scrollHeight;
        const prevScrollTop = el.scrollTop;

        let html = '';
        // 加载更多提示
        if (this._hasMore) {
            html += '<div style="text-align:center;padding:12px;color:var(--text-secondary);font-size:12px;">上拉加载更多</div>';
        } else if (this._messages.length > 0) {
            html += '<div style="text-align:center;padding:8px;color:var(--text-secondary);font-size:12px;">—— 以上是全部消息 ——</div>';
        }

        if (this._messages.length === 0) {
            html += '<div class="empty-state">开始聊天吧！</div>';
        }

        for (let i = 0; i < this._messages.length; i++) {
            const m = this._messages[i];
            const isMe = m.senderId === curId;
            const time = this._formatMsgTime(m.sentAt);
            let statusIcon = '';
            if (isMe) {
                if (m.status === 'sending') {
                    statusIcon = '<span style="font-size:10px;color:#aaa;">发送中...</span>';
                } else if (m.status === 'failed') {
                    statusIcon = '<span style="font-size:10px;color:#e74c3c;">发送失败</span>';
                } else if (m.status === 'DELIVERED') {
                    statusIcon = '<span style="font-size:12px;color:#aaa;">✓✓</span>';
                } else if (m.status === 'READ') {
                    statusIcon = '<span style="font-size:12px;color:#4a90d9;">✓✓</span>';
                }
            }

            html += `
            <div class="msg-row ${isMe ? 'msg-me' : 'msg-other'}">
                <div class="msg-bubble ${isMe ? 'bubble-me' : 'bubble-other'}">
                    <div class="msg-text">${this._escapeHtml(m.content)}</div>
                </div>
                <div class="msg-meta">
                    <span class="msg-time">${time}</span>
                    ${statusIcon}
                </div>
            </div>`;
        }

        el.innerHTML = html;

        if (keepScroll) {
            const newScrollHeight = el.scrollHeight;
            el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
        }
    },

    _scrollToBottom: function () {
        const el = document.getElementById('chatMessages');
        if (el) {
            setTimeout(function () { el.scrollTop = el.scrollHeight; }, 50);
        }
    },

    _findMsgIndex: function (id) {
        for (let i = this._messages.length - 1; i >= 0; i--) {
            if (this._messages[i].id === id) return i;
        }
        return -1;
    },

    _formatMsgTime: function (dtStr) {
        if (!dtStr) return '';
        const d = new Date(dtStr);
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    },

    _escapeHtml: function (text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===== Mock 数据 =====
const MOCK_MESSAGES_USER2 = [
    { id: 1, senderId: 1, content: '你好，明天的篮球局你参加吗？', status: 'READ', sentAt: '2026-06-29T14:00:00' },
    { id: 2, senderId: 2, content: '参加参加！几点开始？', status: 'READ', sentAt: '2026-06-29T14:02:00' },
    { id: 3, senderId: 1, content: '下午2点，朝阳公园', status: 'READ', sentAt: '2026-06-29T14:05:00' },
    { id: 4, senderId: 2, content: 'OK，我带球过去', status: 'READ', sentAt: '2026-06-29T14:10:00' },
    { id: 5, senderId: 1, content: '好的，明天见！', status: 'DELIVERED', sentAt: '2026-06-29T14:30:00' }
];

const MOCK_MESSAGES_USER3 = [
    { id: 1, senderId: 1, content: '小红你好！', status: 'READ', sentAt: '2026-06-29T11:00:00' },
    { id: 2, senderId: 3, content: '你好呀~', status: 'READ', sentAt: '2026-06-29T11:05:00' },
    { id: 3, senderId: 1, content: '周末的徒步活动你会去吗？', status: 'READ', sentAt: '2026-06-29T11:10:00' },
    { id: 4, senderId: 3, content: '会的！已经报名了', status: 'DELIVERED', sentAt: '2026-06-29T12:00:00' }
];

const MOCK_REPLIES = [
    '好的', '收到！', '没问题', '哈哈', '太棒了',
    '我也觉得', '到时候见', 'OK', '嗯嗯', '可以的'
];

// ===== 注册路由 =====
// 使用参数化路由匹配: /chat/:userId
Router.register('/chat/:userId', {
    title: '聊天',
    requireAuth: true,
    render: function (params) { return ChatRoomPage.render(params); },
    init: function (params) { ChatRoomPage.init(params); },
    destroy: function () { ChatRoomPage.destroy(); }
});
