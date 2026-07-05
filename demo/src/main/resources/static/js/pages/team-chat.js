// ====== 小队群聊页（US-029 + 成员 D：群公告 + @提醒） ======
// 路由: #/team/:id/chat

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
    _announcement: null,       // 群公告
    _members: [],             // 成员列表（@提及用）
    _mentionOpen: false,      // @下拉是否打开
    _mentionFilter: '',       // @过滤文本
    _mentionIdx: -1,          // 下拉选中索引
    _notifyAllowed: false,    // 浏览器通知权限

    render: function (params) {
        return `
        <div class="container chat-room-container">
            <div class="chat-header">
                <a href="#/team/${params.id}" class="btn btn-outline btn-sm">← 返回</a>
                <span style="font-weight:700;font-size:16px;" id="teamChatTitle">小队群聊</span>
                <span style="width:60px;"></span>
            </div>
            <div id="announcementBar"></div>
            <div class="chat-messages" id="chatMessages">
                <div class="loading">加载中...</div>
            </div>
            <div class="chat-input-area" style="position:relative;">
                <input type="text" id="chatInput" class="chat-input" placeholder="输入消息...  输入 @ 提及成员" maxlength="2000" autocomplete="off" />
                <button class="btn btn-primary" id="chatSendBtn">发送</button>
                <div id="mentionDropdown" class="mention-dropdown" style="display:none;"></div>
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
        self._announcement = null;
        self._members = [];
        self._mentionOpen = false;
        self._mentionFilter = '';
        self._mentionIdx = -1;

        if (self._pollTimer) {
            clearInterval(self._pollTimer);
            self._pollTimer = null;
        }

        // 请求浏览器通知权限
        self._requestNotify();

        // 发送按钮 + Enter
        document.getElementById('chatSendBtn').addEventListener('click', function () {
            self._sendMessage();
        });

        var input = document.getElementById('chatInput');
        input.addEventListener('keydown', function (e) {
            // @下拉键盘导航
            if (self._mentionOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    self._mentionIdx = Math.min(self._mentionIdx + 1, self._getFilteredMembers().length - 1);
                    self._renderMentionDropdown();
                    return;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    self._mentionIdx = Math.max(self._mentionIdx - 1, -1);
                    self._renderMentionDropdown();
                    return;
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    self._selectMention();
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    self._closeMention();
                    return;
                }
            }

            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (self._mentionOpen) {
                    self._selectMention();
                } else {
                    self._sendMessage();
                }
            }
        });

        input.addEventListener('input', function () {
            self._onInputChange();
        });

        var msgArea = document.getElementById('chatMessages');
        msgArea.addEventListener('scroll', function () {
            if (msgArea.scrollTop < 50 && self._hasMore && !self._loading) {
                self._loadMoreHistory();
            }
        });

        // 点击消息区域关闭 @下拉
        msgArea.addEventListener('click', function () {
            if (self._mentionOpen) self._closeMention();
        });

        // WebSocket 订阅群聊 + 公告 topic
        WsClient.connect();
        var chatTopic = '/topic/team/' + teamId;
        WsClient.subscribe(chatTopic, function (msg) {
            self._onWsMessage(msg);
            self._wsSubscribed = true;
        });
        // 订阅公告推送
        var announcementTopic = '/topic/team/' + teamId + '/announcement';
        WsClient.subscribe(announcementTopic, function (payload) {
            self._onAnnouncementPush(payload);
        });

        self._loadData();
        // 先加载成员再加载公告（公告渲染依赖成员角色判断）
        self._loadMembers().then(function () {
            self._loadAnnouncement();
        });
    },

    destroy: function () {
        var chatTopic = '/topic/team/' + this._teamId;
        WsClient.unsubscribe(chatTopic);
        var announcementTopic = '/topic/team/' + this._teamId + '/announcement';
        WsClient.unsubscribe(announcementTopic);
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    },

    // ========== 浏览器通知 ==========

    _requestNotify: function () {
        var self = this;
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            self._notifyAllowed = true;
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(function (perm) {
                if (perm === 'granted') self._notifyAllowed = true;
            });
        }
    },

    _showNotify: function (title, body) {
        // 页面内醒目提示
        toast(title + '\n' + body, 'info', 5000);
        if (!this._notifyAllowed) return;
        try {
            new Notification(title, {
                body: body,
                icon: '/favicon.ico',
                requireInteraction: true
            });
        } catch (e) {
            // 静默
        }
    },

    // ========== 群公告 ==========

    _loadAnnouncement: async function () {
        var self = this;
        try {
            var res = await api('/teams/' + self._teamId + '/announcement');
            if (res.data) {
                self._announcement = res.data;
            }
        } catch (e) {
            // 无公告或加载失败，静默
        }
        self._renderAnnouncement();
    },

    _onAnnouncementPush: function (payload) {
        // WebSocket 推送公告更新
        this._announcement = {
            id: payload.announcementId,
            teamId: payload.teamId,
            content: payload.content,
            publisherId: payload.publisherId,
            updatedAt: payload.updatedAt
        };
        this._renderAnnouncement();
        this._showNotify('群公告更新', payload.content.substring(0, 50));
    },

    _renderAnnouncement: function () {
        var el = document.getElementById('announcementBar');
        if (!el) return;

        var self = this;
        var curUser = getCurUser();
        var isLeaderOrAdmin = self._isCurrentUserLeaderOrAdmin();

        if (!self._announcement || !self._announcement.content) {
            // 无公告：队长看到"发布公告"入口
            if (isLeaderOrAdmin) {
                el.innerHTML = '<div class="announcement-bar announcement-empty">' +
                    '<span style="color:var(--text-secondary);font-size:13px;">暂无公告</span>' +
                    '<button class="btn btn-outline btn-sm" id="postAnnouncementBtn">发布公告</button>' +
                    '</div>';
                document.getElementById('postAnnouncementBtn').addEventListener('click', function () {
                    self._showAnnouncementEditor();
                });
            } else {
                el.innerHTML = '';
            }
            return;
        }

        var time = self._formatAnnouncementTime(self._announcement.updatedAt);
        var btnHtml = '';
        if (isLeaderOrAdmin) {
            btnHtml = '<button class="btn btn-outline btn-sm" id="editAnnouncementBtn">编辑</button>' +
                '<button class="btn btn-outline btn-sm" id="deleteAnnouncementBtn" style="color:#e74c3c;">删除</button>';
        }
        el.innerHTML = '<div class="announcement-bar">' +
            '<div class="announcement-content">' +
            '<span class="announcement-icon">📢</span>' +
            '<span class="announcement-text">' + self._escapeHtml(self._announcement.content) + '</span>' +
            '</div>' +
            '<div class="announcement-footer">' +
            '<span class="announcement-time">发布于 ' + time + '</span>' +
            '<div class="announcement-actions">' + btnHtml + '</div>' +
            '</div>' +
            '</div>';

        if (isLeaderOrAdmin) {
            var editBtn = document.getElementById('editAnnouncementBtn');
            var delBtn = document.getElementById('deleteAnnouncementBtn');
            if (editBtn) editBtn.addEventListener('click', function () { self._showAnnouncementEditor(); });
            if (delBtn) delBtn.addEventListener('click', function () { self._deleteAnnouncement(); });
        }
    },

    _showAnnouncementEditor: function () {
        var self = this;
        var curContent = self._announcement ? self._announcement.content : '';
        var content = prompt('请输入公告内容（最长500字）：', curContent);
        if (content === null) return;
        content = content.trim();
        if (!content) {
            toast('公告内容不能为空', 'error');
            return;
        }
        if (content.length > 500) {
            toast('公告内容不能超过500字', 'error');
            return;
        }
        self._saveAnnouncement(content);
    },

    _saveAnnouncement: async function (content) {
        var self = this;
        try {
            var res = await api('/teams/' + self._teamId + '/announcement', {
                method: 'POST',
                body: { content: content }
            });
            self._announcement = res.data;
            self._renderAnnouncement();
            toast('公告已发布', 'success');
        } catch (e) {
            toast((e.data && e.data.message) || '发布失败，请重试', 'error');
        }
    },

    _deleteAnnouncement: async function () {
        var self = this;
        if (!confirm('确定删除群公告？')) return;
        try {
            await api('/teams/' + self._teamId + '/announcement', { method: 'DELETE' });
            self._announcement = null;
            self._renderAnnouncement();
            toast('公告已删除', 'success');
        } catch (e) {
            toast((e.data && e.data.message) || '删除失败', 'error');
        }
    },

    _formatAnnouncementTime: function (dtStr) {
        if (!dtStr) return '';
        var d = new Date(dtStr);
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        var hh = String(d.getHours()).padStart(2, '0');
        var min = String(d.getMinutes()).padStart(2, '0');
        return mm + '-' + dd + ' ' + hh + ':' + min;
    },

    // ========== @提及 ==========

    _loadMembers: async function () {
        var self = this;
        try {
            var res = await api('/teams/' + self._teamId + '/members');
            self._members = res.data || [];
        } catch (e) {
            self._members = [];
        }
    },

    _onInputChange: function () {
        var self = this;
        var input = document.getElementById('chatInput');
        var text = input.value;
        var cursorPos = input.selectionStart;

        // 找到光标前最后一个 @ 的位置
        var lastAt = text.lastIndexOf('@', cursorPos - 1);
        if (lastAt === -1 || text.substring(lastAt, cursorPos).includes(' ')) {
            self._closeMention();
            return;
        }

        // @ 后面不能紧跟空格
        if (text.charAt(lastAt + 1) === ' ') {
            self._closeMention();
            return;
        }

        self._mentionFilter = text.substring(lastAt + 1, cursorPos).toLowerCase();
        self._mentionIdx = -1;
        self._mentionOpen = true;
        self._renderMentionDropdown();
    },

    _getFilteredMembers: function () {
        var self = this;
        var curUser = getCurUser();
        var curId = curUser ? curUser.id : 0;

        // @所有人（仅队长/管理员可见）
        var allMembers = [];
        if (self._isCurrentUserLeaderOrAdmin()) {
            allMembers.push({ userId: 0, nickname: '所有人', avatar: null, role: 'all' });
        }

        // 普通成员（排除自己）
        for (var i = 0; i < self._members.length; i++) {
            if (self._members[i].userId !== curId) {
                allMembers.push(self._members[i]);
            }
        }

        if (!self._mentionFilter) return allMembers;

        return allMembers.filter(function (m) {
            return m.nickname && m.nickname.toLowerCase().indexOf(self._mentionFilter) !== -1;
        });
    },

    _renderMentionDropdown: function () {
        var el = document.getElementById('mentionDropdown');
        if (!el) return;

        if (!this._mentionOpen) {
            el.style.display = 'none';
            return;
        }

        var members = this._getFilteredMembers();
        if (members.length === 0) {
            el.style.display = 'none';
            return;
        }

        var self = this;
        var html = '';
        for (var i = 0; i < members.length; i++) {
            var m = members[i];
            var isAll = m.role === 'all';
            var cls = (i === self._mentionIdx) ? 'mention-item active' : 'mention-item';
            var name = isAll ? '@所有人' : '@' + self._escapeHtml(m.nickname);
            html += '<div class="' + cls + '" data-idx="' + i + '">' +
                (isAll ? '<span class="mention-avatar mention-all-icon">📣</span>' :
                    '<img class="mention-avatar" src="' + (m.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.userId) + '" alt="" />') +
                '<span class="mention-name">' + name + '</span>' +
                (isAll ? '<span class="mention-hint">通知全体成员</span>' : '') +
                '</div>';
        }
        el.innerHTML = html;
        el.style.display = 'block';

        // 绑定点击事件
        var items = el.querySelectorAll('.mention-item');
        for (var j = 0; j < items.length; j++) {
            (function (idx) {
                items[j].addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    self._mentionIdx = idx;
                    self._selectMention();
                });
            })(j);
        }
    },

    _selectMention: function () {
        var members = this._getFilteredMembers();
        if (this._mentionIdx < 0 || this._mentionIdx >= members.length) {
            this._closeMention();
            return;
        }
        var selected = this._mentionIdx >= 0 ? members[this._mentionIdx] : members[0];
        if (!selected) { this._closeMention(); return; }

        var input = document.getElementById('chatInput');
        var text = input.value;
        var cursorPos = input.selectionStart;
        var lastAt = text.lastIndexOf('@', cursorPos - 1);
        if (lastAt === -1) { this._closeMention(); return; }

        var before = text.substring(0, lastAt);
        var mentionText = selected.role === 'all' ? '@所有人 ' : '@' + selected.nickname + ' ';
        var after = text.substring(cursorPos);
        input.value = before + mentionText + after;

        var newPos = before.length + mentionText.length;
        input.setSelectionRange(newPos, newPos);
        input.focus();
        this._closeMention();
    },

    _closeMention: function () {
        this._mentionOpen = false;
        this._mentionFilter = '';
        this._mentionIdx = -1;
        var el = document.getElementById('mentionDropdown');
        if (el) el.style.display = 'none';
    },

    _isCurrentUserLeaderOrAdmin: function () {
        var curUser = getCurUser();
        if (!curUser) return false;
        for (var i = 0; i < this._members.length; i++) {
            var m = this._members[i];
            if (m.userId === curUser.id && (m.role === 'LEADER' || m.role === 'ADMIN' || m.role === 'leader' || m.role === 'admin')) {
                return true;
            }
        }
        return false;
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

        // 检查是否 @ 了当前用户，发送浏览器通知
        var curUser = getCurUser();
        if (curUser && msg.content && msg.senderId !== curUser.id) {
            var curNickname = curUser.nickname;
            if (this._isMentioned(msg.content, curNickname)) {
                this._showNotify(
                    (msg.senderNickname || '用户') + ' 在群聊中@了你',
                    msg.content.substring(0, 80)
                );
            }
        }
    },

    _isMentioned: function (content, nickname) {
        if (!content || !nickname) return false;
        // 检查 @所有人
        if (content.indexOf('@所有人') !== -1) return true;
        // 检查 @昵称
        if (content.indexOf('@' + nickname) !== -1) return true;
        return false;
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
        this._closeMention();
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
            // 去重：WebSocket 可能抢先推送同一条（竞态）
            for (var j = this._messages.length - 1; j >= 0; j--) {
                if (j !== idx && this._messages[j].id === sent.id) {
                    this._messages.splice(j, 1);
                }
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
        var curNickname = curUser ? curUser.nickname : '';
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

            // 检查消息是否 @ 了当前用户
            var isCurrentUserMentioned = !isMe && self._isMentioned(m.content, curNickname);
            var bubbleClass = isMe ? 'bubble-me' : 'bubble-other';
            if (isCurrentUserMentioned) bubbleClass += ' mentioned';

            // 渲染消息内容，@name 加高亮
            var renderedContent = self._renderContentWithMentions(m.content);

            html += `
            <div class="msg-row ${isMe ? 'msg-me' : 'msg-other'}" style="display:flex;flex-direction:row;align-items:flex-start;max-width:90%;${isMe ? 'margin-left:auto;' : 'margin-right:auto;'}">
                ${!isMe ? '<img src="' + (m.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.senderId) + '" class="msg-avatar" alt="" />' : ''}
                <div class="msg-content-wrap" style="${isMe ? 'align-items:flex-end;' : 'align-items:flex-start;'}">
                    ${!isMe ? '<div class="msg-sender-name">' + self._escapeHtml(m.senderNickname || '用户' + m.senderId) + '</div>' : ''}
                    <div class="msg-bubble ${bubbleClass}">
                        <div class="msg-text">${renderedContent}</div>
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

    /**
     * 渲染消息内容，@name 加高亮
     */
    _renderContentWithMentions: function (text) {
        var self = this;
        if (!text) return '';

        // 先转义
        var escaped = self._escapeHtml(text);

        // 匹配 @所有人
        escaped = escaped.replace(/@所有人/g, '<span class="mention-tag mention-all">@所有人</span>');

        // 匹配 @昵称（中文/英文/数字/下划线，遇到空格或结尾停止）
        // 注意：@所有人 已经处理过了，这里处理其他 @xxx
        escaped = escaped.replace(/@([^\s\u200b<]+)/g, function (match, name) {
            // 不重复包裹
            if (match.indexOf('mention-tag') !== -1) return match;
            return '<span class="mention-tag">@' + name + '</span>';
        });

        return escaped;
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
