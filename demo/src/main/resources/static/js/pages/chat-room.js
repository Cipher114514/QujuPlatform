// ====== 聊天窗口页 ======
// 路由: #/chat/:userId
// 负责人: P7 — WebSocket 实时通信改造 (P8 集成)

const ChatRoomPage = {
    _conversationId: null,
    _targetUserId: null,
    _targetUser: null,
    _messages: [],
    _page: 1,
    _hasMore: true,
    _loading: false,
    _lastSentAt: null,
    _pollTimer: null,
    _contextMenu: null,

    render: function (params) {
        var tu = this._targetUser || {};
        var nickname = tu.nickname || '聊天';
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
        var userId = params && params.userId ? parseInt(params.userId) : null;
        if (!userId) {
            Router.navigate('/chat');
            return;
        }

        // 重置所有状态，防止切换到新用户时残留旧数据
        this._targetUserId = userId;
        this._conversationId = null;
        this._targetUser = null;
        this._messages = [];
        this._page = 1;
        this._hasMore = true;
        this._loading = false;
        this._lastSentAt = null;
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }

        var self = this;

        document.getElementById('chatBackBtn').addEventListener('click', function () {
            Router.navigate('/chat');
        });

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

        // 滚动加载历史
        var msgArea = document.getElementById('chatMessages');
        msgArea.addEventListener('scroll', function () {
            if (msgArea.scrollTop < 50 && self._hasMore && !self._loading) {
                self._loadMoreHistory();
            }
        });

        // 连接 WebSocket 并订阅消息
        WsClient._onStatusChange = function (connected) {
            console.log('[ChatRoom] WS状态: ' + (connected ? '已连接' : '已断开'));
        };
        WsClient.connect();
        WsClient.subscribe('/user/queue/messages', function (msg) {
            self._onWsMessage(msg);
        });

        this._loadData();
    },

    destroy: function () {
        WsClient.unsubscribe('/user/queue/messages');
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
        this._hideContextMenu();
    },

    // ========== WebSocket 消息处理 ==========

    _onWsMessage: function (msg) {
        console.log('[ChatRoom] WS消息:', msg);
        // 处理撤回事件
        if (msg.type === 'RECALL') {
            for (var i = 0; i < this._messages.length; i++) {
                if (this._messages[i].id === msg.id) {
                    this._messages[i].content = msg.content || '消息已被撤回';
                    this._messages[i].type = 'RECALL';
                    this._messages[i].recalledAt = msg.recalledAt;
                    this._renderMessages();
                    return;
                }
            }
            return;
        }
        if (msg.senderId !== this._targetUserId) return;
        for (var i = 0; i < this._messages.length; i++) {
            if (this._messages[i].id === msg.id) return;
        }
        this._messages.push(msg);
        if (msg.sentAt) this._lastSentAt = msg.sentAt;
        if (!this._conversationId && msg.conversationId) {
            this._conversationId = msg.conversationId;
        }
        this._renderMessages();
        this._scrollToBottom();
    },

    // ========== 轮询兜底（WebSocket 断开时仍能收到新消息） ==========
    _startPolling: function () {
        var self = this;
        if (self._pollTimer) clearInterval(self._pollTimer);
        self._pollTimer = setInterval(async function () {
            if (!self._conversationId || !self._lastSentAt) return;
            try {
                var res = await MessageAPI.newMessages(self._conversationId, self._lastSentAt);
                var newMsgs = res.data || [];
                if (newMsgs.length > 0) {
                    console.log('[ChatRoom] 轮询收到 ' + newMsgs.length + ' 条新消息');
                    for (var i = 0; i < newMsgs.length; i++) {
                        // 去重
                        var exists = false;
                        for (var j = 0; j < self._messages.length; j++) {
                            if (self._messages[j].id === newMsgs[i].id) { exists = true; break; }
                        }
                        if (!exists) {
                            self._messages.push(newMsgs[i]);
                        }
                    }
                    self._lastSentAt = newMsgs[newMsgs.length - 1].sentAt;
                    self._renderMessages();
                    self._scrollToBottom();
                }
            } catch (e) {
                // 轮询失败静默
            }
        }, 3000);
    },

    // ========== 数据加载 ==========

    _loadData: async function () {
        var self = this;
        var curUser = getCurUser();

        try {
            // 从会话列表找目标用户信息
            var convRes = await MessageAPI.conversations();
            var convs = convRes.data || [];
            var foundConv = null;
            for (var i = 0; i < convs.length; i++) {
                if (convs[i].targetUser && convs[i].targetUser.id === self._targetUserId) {
                    foundConv = convs[i];
                    break;
                }
            }

            if (foundConv) {
                self._conversationId = foundConv.conversationId;
                self._targetUser = foundConv.targetUser;
                MessageAPI.markRead(self._conversationId).catch(function () {});

                // 加载历史消息
                var msgRes = await MessageAPI.messages(self._conversationId, 1, 20);
                var pageData = msgRes.data;
                self._messages = (pageData.list || []).reverse();
                self._hasMore = pageData.pagination && pageData.pagination.page < pageData.pagination.pages;
                self._page = 1;
                if (self._messages.length > 0) {
                    self._lastSentAt = self._messages[self._messages.length - 1].sentAt;
                }
            } else {
                // 无历史会话，从 user search 获取用户信息
                try {
                    var searchRes = await api('/users/search?keyword=' + self._targetUserId);
                    var users = searchRes.data || [];
                    if (users.length > 0) {
                        self._targetUser = { id: users[0].id, nickname: users[0].nickname, avatar: users[0].avatar };
                    }
                } catch (e) {}
                if (!self._targetUser) {
                    self._targetUser = { id: self._targetUserId, nickname: '用户' + self._targetUserId, avatar: '' };
                }
            }
        } catch (e) {
            console.error('加载聊天数据失败:', e);
            self._targetUser = { id: self._targetUserId, nickname: '用户' + self._targetUserId, avatar: '' };
        }

        // 更新标题
        var headerName = document.querySelector('.chat-header span');
        if (headerName && self._targetUser) {
            headerName.textContent = self._targetUser.nickname || '聊天';
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
            var res = await MessageAPI.messages(self._conversationId, nextPage, 20);
            var pageData = res.data;
            var older = (pageData.list || []).reverse();
            self._messages = older.concat(self._messages);
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
            senderId: curUser ? curUser.id : 0,
            content: content,
            status: 'sending',
            sentAt: now
        };
        this._messages.push(tempMsg);
        this._renderMessages();
        this._scrollToBottom();

        try {
            var res = await MessageAPI.send(this._targetUserId, content);
            var sent = res.data;

            var idx = this._findMsgIndex(tempId);
            if (idx >= 0) {
                this._messages[idx].id = sent.id;
                this._messages[idx].status = sent.status || 'DELIVERED';
                this._messages[idx].sentAt = sent.sentAt;
            }

            if (!this._conversationId && sent.conversationId) {
                this._conversationId = sent.conversationId;
            }
            // 更新时间戳，用于轮询兜底
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

    // ========== 上下文菜单 & 撤回/转发 ==========

    _showContextMenu: function (e, msg) {
        this._hideContextMenu();
        var self = this;
        var menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = 'position:fixed;z-index:9999;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:4px 0;min-width:120px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';

        var canRecall = msg.senderId === (getCurUser() || {}).id &&
            msg.type !== 'RECALL' && msg.type !== 'SYSTEM' &&
            !msg.recalledAt &&
            (new Date() - new Date(msg.sentAt)) < 120000;

        var items = [];

        if (canRecall) {
            items.push({ label: '撤回', action: function () { self._recallMessage(msg); } });
        }
        if (msg.type !== 'RECALL' && !msg.recalledAt) {
            items.push({ label: '转发', action: function () { self._forwardMessage(msg); } });
        }

        if (items.length === 0) { return; }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var div = document.createElement('div');
            div.className = 'context-menu-item';
            div.textContent = item.label;
            div.style.cssText = 'padding:8px 16px;cursor:pointer;font-size:14px;color:var(--text);';
            div.addEventListener('mouseenter', function () { this.style.background = 'var(--bg)'; });
            div.addEventListener('mouseleave', function () { this.style.background = 'transparent'; });
            (function (action) {
                div.addEventListener('click', function () { action(); self._hideContextMenu(); });
            })(item.action);
            menu.appendChild(div);
        }

        document.body.appendChild(menu);
        this._contextMenu = menu;

        // 点击其他地方关闭菜单
        setTimeout(function () {
            document.addEventListener('click', self._hideContextMenu, { once: true });
        }, 10);
    },

    _hideContextMenu: function () {
        if (this._contextMenu) {
            this._contextMenu.remove();
            this._contextMenu = null;
        }
    },

    _recallMessage: async function (msg) {
        var self = this;
        try {
            await MessageAPI.recall(msg.id);
            var idx = self._findMsgIndex(msg.id);
            if (idx >= 0) {
                self._messages[idx].content = '消息已被撤回';
                self._messages[idx].type = 'RECALL';
                self._messages[idx].recalledAt = new Date().toISOString();
                self._renderMessages();
            }
        } catch (e) {
            toast(e.message || '撤回失败', 'error');
        }
    },

    _forwardMessage: function (msg) {
        // 弹出转发目标选择：好友列表
        this._showForwardModal(msg);
    },

    _showForwardModal: function (msg) {
        var self = this;
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;justify-content:center;align-items:center;';
        overlay.innerHTML = '<div style="background:var(--card);border-radius:12px;padding:20px;width:90%;max-width:360px;max-height:70vh;overflow-y:auto;">'
            + '<h3 style="margin:0 0 12px;">转发消息</h3>'
            + '<div id="forwardList" style="max-height:300px;overflow-y:auto;">加载中...</div>'
            + '<div style="text-align:right;margin-top:12px;"><button class="btn btn-outline btn-sm" id="forwardCancel">取消</button></div>'
            + '</div>';
        document.body.appendChild(overlay);

        document.getElementById('forwardCancel').addEventListener('click', function () { overlay.remove(); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

        // 加载好友列表（从会话列表）
        MessageAPI.conversations().then(function (res) {
            var convs = res.data || [];
            var html = '';
            if (convs.length === 0) {
                html = '<div class="empty-state" style="padding:20px;">暂无好友</div>';
            }
            for (var i = 0; i < convs.length; i++) {
                var c = convs[i];
                if (!c.targetUser) continue;
                html += '<div class="forward-user-item" style="display:flex;align-items:center;padding:10px;cursor:pointer;border-radius:8px;" '
                    + 'data-userid="' + c.targetUser.id + '" data-nickname="' + self._escapeHtml(c.targetUser.nickname || '') + '">'
                    + '<div style="width:36px;height:36px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;margin-right:12px;font-size:14px;">'
                    + (c.targetUser.nickname || '?').charAt(0).toUpperCase() + '</div>'
                    + '<span style="flex:1;">' + self._escapeHtml(c.targetUser.nickname || '用户' + c.targetUser.id) + '</span>'
                    + '</div>';
            }
            var listEl = document.getElementById('forwardList');
            if (listEl) listEl.innerHTML = html;

            // 绑定点击事件
            var items = overlay.querySelectorAll('.forward-user-item');
            for (var j = 0; j < items.length; j++) {
                items[j].addEventListener('click', function () {
                    var uid = parseInt(this.dataset.userid);
                    overlay.remove();
                    self._doForward(msg, uid);
                });
            }
        }).catch(function () {
            var listEl = document.getElementById('forwardList');
            if (listEl) listEl.innerHTML = '<div class="empty-state" style="padding:20px;">加载失败</div>';
        });
    },

    _doForward: async function (msg, targetUserId) {
        try {
            await MessageAPI.forward(msg.id, targetUserId);
            toast('转发成功');
        } catch (e) {
            toast(e.message || '转发失败', 'error');
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
            html += '<div class="empty-state">开始聊天吧！</div>';
        }

        for (var i = 0; i < this._messages.length; i++) {
            var m = this._messages[i];
            var isMe = m.senderId === curId;
            var isRecall = m.type === 'RECALL';
            var time = self._formatMsgTime(m.sentAt);
            var statusIcon = '';
            if (isMe) {
                if (m.status === 'sending') {
                    statusIcon = '<span style="font-size:10px;color:#aaa;">发送中...</span>';
                } else if (m.status === 'failed') {
                    statusIcon = '<span style="font-size:10px;color:#e74c3c;">发送失败</span>';
                } else if (m.status === 'DELIVERED') {
                    statusIcon = '<span style="font-size:12px;color:#aaa;">✓</span>';
                } else if (m.status === 'READ') {
                    statusIcon = '<span style="font-size:12px;color:#4a90d9;">✓✓</span>';
                }
            }

            if (isRecall) {
                html += '<div style="text-align:center;padding:8px;color:var(--text-secondary);font-size:12px;">'
                    + '<span style="background:var(--border);padding:4px 12px;border-radius:10px;">' + (isMe ? '你' : '对方') + '撤回了一条消息</span></div>';
                continue;
            }

            html += `
            <div class="msg-row ${isMe ? 'msg-me' : 'msg-other'}">
                <div class="msg-bubble ${isMe ? 'bubble-me' : 'bubble-other'}" data-msgid="${m.id}">
                    <div class="msg-text">${self._escapeHtml(m.content)}</div>
                </div>
                <div class="msg-meta">
                    <span class="msg-time">${time}</span>
                    ${statusIcon}
                </div>
            </div>`;
        }

        el.innerHTML = html;

        // 绑定右键菜单
        var bubbles = el.querySelectorAll('.msg-bubble[data-msgid]');
        for (var i = 0; i < bubbles.length; i++) {
            (function (bubbleEl) {
                bubbleEl.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    var msgId = parseInt(this.dataset.msgid);
                    var msg = null;
                    for (var j = 0; j < self._messages.length; j++) {
                        if (self._messages[j].id === msgId) { msg = self._messages[j]; break; }
                    }
                    if (msg) self._showContextMenu(e, msg);
                });
            })(bubbles[i]);
        }

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
};

// ===== 注册路由 =====
Router.register('/chat/:userId', {
    title: '聊天',
    requireAuth: true,
    render: function (params) { return ChatRoomPage.render(params); },
    init: function (params) { ChatRoomPage.init(params); },
    destroy: function () { ChatRoomPage.destroy(); }
});
