// ====== 小队群聊页（US-029） ======
// 路由: #/team/:id/chat
// 负责人: P6

Router.register('/team/:id/chat', {
    title: '小队群聊',
    requireAuth: true,

    _teamId: null,
    _teamData: null,
    _messages: [],
    _page: 1,
    _hasMore: true,
    _loading: false,
    _lastSentAt: null,
    _pollTimer: null,
    _wsSubscribed: false,

    render: function (params) {
        return `
        <div class="container chat-room-container">
            <div class="chat-header">
                <a href="#/team/${params.id}" class="btn btn-outline btn-sm">← 返回</a>
                <span style="font-weight:700;font-size:16px;" id="teamChatTitle">小队群聊</span>
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
        var teamId = parseInt(params.id);
        if (!teamId) {
            Router.navigate('/teams');
            return;
        }

        var self = this;
        self._teamId = teamId;
        self._messages = [];
        self._page = 1;
        self._hasMore = true;
        self._loading = false;
        self._lastSentAt = null;
        self._wsSubscribed = false;

        if (self._pollTimer) {
            clearInterval(self._pollTimer);
            self._pollTimer = null;
        }

        // 事件绑定
        document.getElementById('chatSendBtn').addEventListener('click', function () {
            self._sendMessage();
        });

        var input = document.getElementById('chatInput');
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                self._sendMessage();
            }
        });

        var msgArea = document.getElementById('chatMessages');
        msgArea.addEventListener('scroll', function () {
            if (msgArea.scrollTop < 50 && self._hasMore && !self._loading) {
                self._loadMoreHistory();
            }
        });

        // WebSocket 订阅群聊 topic
        WsClient.connect();
        var topic = '/topic/team/' + teamId;
        WsClient.subscribe(topic, function (msg) {
            self._onWsMessage(msg);
            self._wsSubscribed = true;
        });

        self._loadData();
    },

    destroy: function () {
        var topic = '/topic/team/' + this._teamId;
        WsClient.unsubscribe(topic);
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    },

    // ========== WebSocket 消息处理 ==========

    _onWsMessage: function (msg) {
        // 去重
        for (var i = 0; i < this._messages.length; i++) {
            if (this._messages[i].id === msg.id) return;
        }
        this._messages.push(msg);
        if (msg.sentAt) this._lastSentAt = msg.sentAt;
        this._renderMessages();
        this._scrollToBottom();
    },

    // ========== 轮询兜底 ==========

    _startPolling: function () {
        var self = this;
        if (self._pollTimer) clearInterval(self._pollTimer);
        self._pollTimer = setInterval(async function () {
            if (!self._lastSentAt) return;
            try {
                var res = await api('/teams/' + self._teamId + '/messages?page=1&size=5');
                var list = (res.data && res.data.list) || [];
                if (list.length > 0) {
                    for (var i = 0; i < list.length; i++) {
                        var exists = false;
                        for (var j = 0; j < self._messages.length; j++) {
                            if (self._messages[j].id === list[i].id) { exists = true; break; }
                        }
                        if (!exists) {
                            self._messages.push(list[i]);
                        }
                    }
                    // 排序
                    self._messages.sort(function (a, b) {
                        return new Date(a.sentAt) - new Date(b.sentAt);
                    });
                    self._lastSentAt = self._messages[self._messages.length - 1].sentAt;
                    self._renderMessages();
                    self._scrollToBottom();
                }
            } catch (e) {
                // 轮询失败静默忽略
            }
        }, 3000);
    },

    // ========== 数据加载 ==========

    _loadData: async function () {
        var self = this;
        var curUser = getCurUser();

        try {
            // 加载小队信息
            var teamRes = await TeamAPI.detail(self._teamId);
            self._teamData = teamRes.data;
            var titleEl = document.getElementById('teamChatTitle');
            if (titleEl && self._teamData) {
                titleEl.textContent = self._teamData.name + ' · 群聊';
            }
        } catch (e) {
            toast('加载小队信息失败: ' + (e.message || '未知错误'), 'error');
            Router.navigate('/teams');
            return;
        }

        try {
            // 加载历史消息
            var msgRes = await api('/teams/' + self._teamId + '/messages?page=1&size=20');
            var pageData = msgRes.data;
            var list = pageData.list || [];
            // 按时间升序排列（显示时底部最新）
            list.sort(function (a, b) {
                return new Date(a.sentAt) - new Date(b.sentAt);
            });
            self._messages = list;
            self._hasMore = pageData.pagination && pageData.pagination.page < pageData.pagination.pages;
            self._page = 1;
            if (self._messages.length > 0) {
                self._lastSentAt = self._messages[self._messages.length - 1].sentAt;
            }
        } catch (e) {
            console.error('加载群聊消息失败:', e);
        }

        self._renderMessages();
        self._scrollToBottom();

        // 启动轮询兜底
        self._startPolling();
    },

    _loadMoreHistory: async function () {
        if (this._loading || !this._hasMore) return;
        this._loading = true;
        var nextPage = this._page + 1;
        var self = this;

        try {
            var res = await api('/teams/' + self._teamId + '/messages?page=' + nextPage + '&size=20');
            var pageData = res.data;
            var list = pageData.list || [];
            list.sort(function (a, b) {
                return new Date(a.sentAt) - new Date(b.sentAt);
            });
            self._messages = list.concat(self._messages);
            self._page = nextPage;
            self._hasMore = pageData.pagination && pageData.pagination.page < pageData.pagination.pages;
        } catch (e) {
            console.error('加载历史失败:', e);
        }

        self._loading = false;
        self._renderMessages(true);
    },

    // ========== 发送消息 ==========

    _sendMessage: async function () {
        var input = document.getElementById('chatInput');
        var content = input.value.trim();
        if (!content) return;

        input.value = '';
        var curUser = getCurUser();
        var tempId = 'temp_' + Date.now();
        var now = new Date().toISOString();

        // 乐观更新
        var tempMsg = {
            id: tempId,
            teamId: this._teamId,
            senderId: curUser ? curUser.id : 0,
            senderNickname: curUser ? curUser.nickname : '我',
            senderAvatar: curUser ? curUser.avatar : null,
            content: content,
            type: 'TEXT',
            status: 'sending',
            sentAt: now
        };
        this._messages.push(tempMsg);
        this._renderMessages();
        this._scrollToBottom();

        try {
            var res = await api('/teams/' + this._teamId + '/messages', {
                method: 'POST',
                body: { content: content }
            });
            var sent = res.data;

            // 替换临时消息
            var idx = this._findMsgIndex(tempId);
            if (idx >= 0) {
                this._messages[idx] = sent;
            }
            if (sent.sentAt) this._lastSentAt = sent.sentAt;
            this._renderMessages();
            this._scrollToBottom();
        } catch (e) {
            var idx = this._findMsgIndex(tempId);
            if (idx >= 0) this._messages[idx].status = 'failed';
            this._renderMessages();
            toast('发送失败，请重试', 'error');
        }
    },

    // ========== 渲染 ==========

    _renderMessages: function (keepScroll) {
        var el = document.getElementById('chatMessages');
        if (!el) return;

        var curUser = getCurUser();
        var curId = curUser ? curUser.id : 0;
        var prevScrollHeight = el.scrollHeight;
        var prevScrollTop = el.scrollTop;
        var self = this;

        var html = '';
        if (this._hasMore) {
            html += '<div style="text-align:center;padding:12px;color:var(--text-secondary);font-size:12px;">上拉加载更多</div>';
        } else if (this._messages.length > 0) {
            html += '<div style="text-align:center;padding:8px;color:var(--text-secondary);font-size:12px;">—— 以上是全部消息 ——</div>';
        }

        if (this._messages.length === 0) {
            html += '<div class="empty-state">暂无消息，快来聊天吧！</div>';
        }

        for (var i = 0; i < this._messages.length; i++) {
            var m = this._messages[i];
            var isMe = m.senderId === curId;
            var isSystem = m.type === 'SYSTEM';
            var time = self._formatMsgTime(m.sentAt);

            if (isSystem) {
                // 系统消息居中展示
                html += '<div style="text-align:center;padding:8px;color:var(--text-secondary);font-size:12px;">' +
                    '<span style="background:var(--border);padding:4px 12px;border-radius:10px;">' +
                    self._escapeHtml(m.content) + '</span></div>';
                continue;
            }

            var statusIcon = '';
            if (isMe && m.status === 'sending') {
                statusIcon = '<span style="font-size:10px;color:#aaa;">发送中...</span>';
            } else if (isMe && m.status === 'failed') {
                statusIcon = '<span style="font-size:10px;color:#e74c3c;">发送失败</span>';
            }

            html += `
            <div class="msg-row ${isMe ? 'msg-me' : 'msg-other'}" style="display:flex;flex-direction:row;align-items:flex-start;max-width:90%;${isMe ? 'margin-left:auto;' : 'margin-right:auto;'}">
                ${!isMe ? '<img src="' + (m.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.senderId) + '" class="msg-avatar" alt="" />' : ''}
                <div class="msg-content-wrap" style="${isMe ? 'align-items:flex-end;' : 'align-items:flex-start;'}">
                    ${!isMe ? '<div class="msg-sender-name">' + self._escapeHtml(m.senderNickname || '用户' + m.senderId) + '</div>' : ''}
                    <div class="msg-bubble ${isMe ? 'bubble-me' : 'bubble-other'}">
                        <div class="msg-text">${self._escapeHtml(m.content)}</div>
                    </div>
                    <div class="msg-meta" style="text-align:${isMe ? 'right' : 'left'}">
                        <span class="msg-time">${time}</span>
                        ${statusIcon}
                    </div>
                </div>
                ${isMe ? '<img src="' + (m.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.senderId) + '" class="msg-avatar" alt="" />' : ''}
            </div>`;
        }

        el.innerHTML = html;

        if (keepScroll) {
            var newScrollHeight = el.scrollHeight;
            el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
        }
    },

    _scrollToBottom: function () {
        var el = document.getElementById('chatMessages');
        if (el) {
            setTimeout(function () { el.scrollTop = el.scrollHeight; }, 50);
        }
    },

    _findMsgIndex: function (id) {
        for (var i = this._messages.length - 1; i >= 0; i--) {
            if (this._messages[i].id === id) return i;
        }
        return -1;
    },

    _formatMsgTime: function (dtStr) {
        if (!dtStr) return '';
        var d = new Date(dtStr);
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
    },

    _escapeHtml: function (text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
