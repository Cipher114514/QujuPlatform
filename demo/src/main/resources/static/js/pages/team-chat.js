// ====== 小队群聊页（增强版 v2） ======
// 路由: #/team/:id/chat
// 功能: 群聊 + @提醒 + 群文件 + 群投票 + 群公告（页面内编辑）

Router.register('/team/:id/chat', {
    title: '小队群聊',
    requireAuth: true,

    _teamId: null,
    _teamData: null,
    _members: [],
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
            <div id="chatAnnouncement" class="chat-announcement" style="display:none;"></div>
            <div class="chat-messages" id="chatMessages">
                <div class="loading">加载中...</div>
            </div>
            <div id="mentionDropdown" class="mention-dropdown" style="display:none;"></div>
            <div class="chat-toolbar" id="chatToolbar">
                <button class="chat-tool-btn" id="btnVote" title="发起投票" style="display:none;">📊</button>
                <button class="chat-tool-btn" id="btnAnnounce" title="群公告" style="display:none;">📢</button>
                <button class="chat-tool-btn" id="btnFile" title="发送文件">📎</button>
                <input type="file" id="fileInput" accept="image/*,.pdf,.doc,.docx,.txt,.zip" style="display:none;" />
            </div>
            <div class="chat-input-area">
                <input type="text" id="chatInput" class="chat-input" placeholder="输入消息... @某人" maxlength="2000" />
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
        self._members = [];
        self._page = 1;
        self._hasMore = true;
        self._loading = false;
        self._lastSentAt = null;
        self._wsSubscribed = false;

        if (self._pollTimer) {
            clearInterval(self._pollTimer);
            self._pollTimer = null;
        }

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
        input.addEventListener('input', function () {
            self._handleMentionInput();
        });

        var msgArea = document.getElementById('chatMessages');
        msgArea.addEventListener('scroll', function () {
            if (msgArea.scrollTop < 50 && self._hasMore && !self._loading) {
                self._loadMoreHistory();
            }
        });

        document.getElementById('btnFile').addEventListener('click', function () {
            document.getElementById('fileInput').click();
        });
        document.getElementById('fileInput').addEventListener('change', function (e) {
            self._handleFileUpload(e);
        });

        document.getElementById('btnVote').addEventListener('click', function () {
            self._showCreateVoteDialog();
        });

        document.getElementById('btnAnnounce').addEventListener('click', function () {
            self._editAnnouncement();
        });

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

    // ========== WebSocket ==========

    _onWsMessage: function (msg) {
        for (var i = 0; i < this._messages.length; i++) {
            if (this._messages[i].id === msg.id) return;
        }
        this._messages.push(msg);
        if (msg.sentAt) this._lastSentAt = msg.sentAt;
        this._renderMessages();
        this._scrollToBottom();
    },

    // ========== 轮询 ==========

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
                        if (!exists) self._messages.push(list[i]);
                    }
                    self._messages.sort(function (a, b) {
                        return new Date(a.sentAt) - new Date(b.sentAt);
                    });
                    self._lastSentAt = self._messages[self._messages.length - 1].sentAt;
                    self._renderMessages();
                    self._scrollToBottom();
                }
            } catch (e) {}
        }, 3000);
    },

    // ========== 数据加载 ==========

    _loadData: async function () {
        var self = this;

        try {
            var teamRes = await TeamAPI.detail(self._teamId);
            self._teamData = teamRes.data;
            var titleEl = document.getElementById('teamChatTitle');
            if (titleEl && self._teamData) {
                titleEl.textContent = self._teamData.name + ' · 群聊';
            }
            // 权限控制：仅队长和管理员可发群公告/投票
            var isLeaderOrAdmin = self._teamData &&
                (self._teamData.userRole === 'leader' || self._teamData.userRole === 'admin');
            var btnVote = document.getElementById('btnVote');
            var btnAnnounce = document.getElementById('btnAnnounce');
            if (btnVote) btnVote.style.display = isLeaderOrAdmin ? '' : 'none';
            if (btnAnnounce) btnAnnounce.style.display = isLeaderOrAdmin ? '' : 'none';
            self._renderAnnouncement();
            self._loadMembers();
        } catch (e) {
            toast('加载小队信息失败: ' + (e.message || '未知错误'), 'error');
            Router.navigate('/teams');
            return;
        }

        try {
            var msgRes = await api('/teams/' + self._teamId + '/messages?page=1&size=20');
            var pageData = msgRes.data;
            var list = pageData.list || [];
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
        self._startPolling();
    },

    _loadMembers: async function () {
        var self = this;
        try {
            var res = await TeamAPI.members(self._teamId);
            self._members = res.data || [];
        } catch (e) {}
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

    // ========== 群公告（聊天页面内） ==========

    _renderAnnouncement: function () {
        var box = document.getElementById('chatAnnouncement');
        if (!box) return;
        var ann = this._teamData && this._teamData.announcement;
        var isLeaderOrAdmin = this._teamData &&
            (this._teamData.userRole === 'leader' || this._teamData.userRole === 'admin');
        if (ann) {
            box.style.display = 'block';
            box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<span style="font-weight:600;">📢 群公告</span>' +
                (isLeaderOrAdmin ? '<button class="btn btn-sm btn-outline" id="editAnnBtn" style="font-size:11px;padding:2px 8px;">编辑</button>' : '') +
                '</div><p style="margin:4px 0 0;font-size:13px;color:var(--text-secondary);white-space:pre-wrap;">' +
                this._escapeHtml(ann) + '</p>';
        } else if (isLeaderOrAdmin) {
            box.style.display = 'block';
            box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<span style="font-weight:600;color:var(--text-secondary);">暂无群公告</span>' +
                '<button class="btn btn-sm btn-outline" id="editAnnBtn" style="font-size:11px;padding:2px 8px;">发布</button></div>';
        } else {
            box.style.display = 'none';
        }

        var editBtn = document.getElementById('editAnnBtn');
        if (editBtn) {
            var self = this;
            editBtn.addEventListener('click', function () {
                self._editAnnouncement();
            });
        }
    },

    _editAnnouncement: function () {
        var self = this;
        var current = (this._teamData && this._teamData.announcement) || '';
        var content = prompt('请输入群公告（限500字）：', current);
        if (content === null) return;
        if (content.length > 500) {
            toast('公告内容不能超过500字', 'error');
            return;
        }
        TeamAPI.updateAnnouncement(self._teamId, content).then(function () {
            toast('公告已更新', 'success');
            self._loadData();
        }).catch(function (e) {
            toast(e.message || '更新失败', 'error');
        });
    },

    // ========== @提醒 ==========

    _handleMentionInput: function () {
        var input = document.getElementById('chatInput');
        var dropdown = document.getElementById('mentionDropdown');
        var val = input.value;
        var cursorPos = input.selectionStart;

        var before = val.substring(0, cursorPos);
        var atIdx = before.lastIndexOf('@');
        if (atIdx < 0) {
            dropdown.style.display = 'none';
            return;
        }
        // 检查@前是空格或行首
        if (atIdx > 0 && before.charAt(atIdx - 1) !== ' ') {
            dropdown.style.display = 'none';
            return;
        }

        var filter = before.substring(atIdx + 1).toLowerCase();
        var curUser = getCurUser();
        var isLeaderOrAdmin = this._teamData &&
            (this._teamData.userRole === 'leader' || this._teamData.userRole === 'admin');

        var filtered = this._members.filter(function (m) {
            if (m.userId === (curUser ? curUser.id : 0)) return false;
            if (!filter) return true;
            return (m.nickname || '').toLowerCase().indexOf(filter) >= 0;
        });

        var html = '';
        if (isLeaderOrAdmin && (!filter || '@所有人'.indexOf(filter) >= 0)) {
            html += '<div class="mention-item" data-replace="@所有人 ">' +
                '<span style="font-weight:700;">@所有人</span>' +
                '<span style="font-size:11px;color:var(--text-secondary);margin-left:8px;">通知全体成员</span></div>';
        }
        for (var i = 0; i < filtered.length; i++) {
            var m = filtered[i];
            html += '<div class="mention-item" data-replace="@' + m.nickname + ' ">' +
                '<img src="' + (m.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.userId) +
                '" style="width:24px;height:24px;border-radius:50%;margin-right:8px;" />' +
                m.nickname + '</div>';
        }

        if (html) {
            dropdown.innerHTML = html;
            dropdown.style.display = 'block';
            var items = dropdown.querySelectorAll('.mention-item');
            for (var j = 0; j < items.length; j++) {
                items[j].addEventListener('click', (function (replace) {
                    return function () {
                        var inp = document.getElementById('chatInput');
                        var v = inp.value;
                        var cp = inp.selectionStart;
                        var before2 = v.substring(0, cp);
                        var lastAt = before2.lastIndexOf('@');
                        inp.value = v.substring(0, lastAt) + replace + v.substring(cp);
                        inp.focus();
                        dropdown.style.display = 'none';
                    };
                })(items[j].dataset.replace));
            }
        } else {
            dropdown.style.display = 'none';
        }
    },

    // ========== 发送消息 ==========

    _sendMessage: async function () {
        var input = document.getElementById('chatInput');
        var content = input.value.trim();
        if (!content) return;

        input.value = '';
        document.getElementById('mentionDropdown').style.display = 'none';

        var curUser = getCurUser();
        var tempId = 'temp_' + Date.now();
        var now = new Date().toISOString();

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
                body: { content: content, type: 'TEXT' }
            });
            var sent = res.data;
            var idx = this._findMsgIndex(tempId);
            if (idx >= 0) this._messages[idx] = sent;
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

    // ========== 文件上传 ==========

    _handleFileUpload: async function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var self = this;

        if (file.size > 10 * 1024 * 1024) {
            toast('文件不能超过10MB', 'error');
            e.target.value = '';
            return;
        }

        var curUser = getCurUser();
        var tempId = 'temp_' + Date.now();
        var now = new Date().toISOString();
        var isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);

        var tempMsg = {
            id: tempId,
            teamId: this._teamId,
            senderId: curUser ? curUser.id : 0,
            senderNickname: curUser ? curUser.nickname : '我',
            senderAvatar: curUser ? curUser.avatar : null,
            content: isImage ? '[图片] ' + file.name : '[文件] ' + file.name,
            type: 'FILE',
            metadata: JSON.stringify({ fileName: file.name, fileSize: file.size }),
            status: 'sending',
            sentAt: now
        };
        this._messages.push(tempMsg);
        this._renderMessages();
        this._scrollToBottom();

        try {
            var uploadRes = await UploadAPI.upload(file, 'chat');
            // uploadRes.data 是 { url, filename, size, type }
            var fileData = uploadRes.data;
            var fileUrl = (typeof fileData === 'string') ? fileData : (fileData.url || '');

            var metadata = JSON.stringify({
                fileName: fileData.filename || file.name,
                fileSize: fileData.size || file.size,
                isImage: isImage
            });

            var res = await api('/teams/' + this._teamId + '/messages', {
                method: 'POST',
                body: { content: fileUrl, type: 'FILE', metadata: metadata }
            });
            if (res && res.data) {
                var idx = this._findMsgIndex(tempId);
                if (idx >= 0) this._messages[idx] = res.data;
            }
            this._renderMessages();
            this._scrollToBottom();
        } catch (err) {
            var idx = this._findMsgIndex(tempId);
            if (idx >= 0) this._messages[idx].status = 'failed';
            this._renderMessages();
            toast('文件发送失败: ' + (err.message || '未知错误'), 'error');
        }
        e.target.value = '';
    },

    // ========== 群投票对话框 ==========

    _showCreateVoteDialog: function () {
        var self = this;
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
        <div class="modal-content" style="background:var(--card);border-radius:12px;padding:24px;width:90%;max-width:440px;max-height:80vh;overflow-y:auto;">
            <h3 style="margin:0 0 16px;">发起群投票</h3>
            <div class="form-group">
                <label>投票标题</label>
                <input type="text" id="voteTitle" class="form-input" placeholder="输入投票标题" maxlength="200" />
            </div>
            <div class="form-group">
                <label>选项（每行一个，至少2个）</label>
                <textarea id="voteOptions" class="form-input" rows="4" placeholder="选项A&#10;选项B&#10;选项C"></textarea>
            </div>
            <div class="form-group" style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" id="voteMultiple" />
                <label for="voteMultiple" style="margin:0;">允许多选</label>
            </div>
            <div class="form-group">
                <label>截止时间（可选，不填则手动结束）</label>
                <input type="datetime-local" id="voteDeadline" class="form-input" />
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
                <button class="btn btn-outline" id="cancelVote">取消</button>
                <button class="btn btn-primary" id="confirmVote">发起投票</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);

        overlay.querySelector('#cancelVote').addEventListener('click', function () {
            overlay.remove();
        });

        overlay.querySelector('#confirmVote').addEventListener('click', async function () {
            var title = overlay.querySelector('#voteTitle').value.trim();
            var optionsText = overlay.querySelector('#voteOptions').value.trim();
            var isMultiple = overlay.querySelector('#voteMultiple').checked;
            var deadline = overlay.querySelector('#voteDeadline').value || null;

            if (!title) { toast('请输入投票标题', 'error'); return; }
            var opts = optionsText.split('\n').filter(function (o) { return o.trim(); });
            if (opts.length < 2) { toast('至少需要2个选项', 'error'); return; }
            if (opts.length > 20) { toast('最多支持20个选项', 'error'); return; }

            try {
                var body = { title: title, options: opts, isMultiple: isMultiple };
                if (deadline) body.deadline = deadline + ':00'; // datetime-local 返回 yyyy-MM-ddTHH:mm
                await TeamAPI.createVote(self._teamId, body);
                toast('投票已发起', 'success');
                overlay.remove();
            } catch (e) {
                toast(e.message || '发起投票失败', 'error');
            }
        });
    },

    // ========== 渲染消息 ==========

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
            var isSystem = m.type === 'SYSTEM';

            if (isSystem) {
                html += '<div style="text-align:center;padding:6px 0;color:var(--text-secondary);font-size:12px;">' +
                    '<span style="background:var(--border);padding:3px 12px;border-radius:10px;">' +
                    self._escapeHtml(m.content) + '</span></div>';
                continue;
            }

            // 所有非SYSTEM消息（TEXT/FILE/VOTE/ANNOUNCEMENT）统一渲染为普通气泡
            html += self._renderBubble(m, curId, i);
        }

        el.innerHTML = html;

        if (keepScroll) {
            el.scrollTop = el.scrollHeight - prevScrollHeight + prevScrollTop;
        }
    },

    _renderBubble: function (m, curId, idx) {
        var self = this;
        var isMe = m.senderId === curId;
        var type = m.type || 'TEXT';
        var time = self._formatMsgTime(m.sentAt);
        var curUser = getCurUser();
        var curNickname = curUser ? curUser.nickname : '';

        // 检查当前用户是否被@提及
        var isMentioned = false;
        if (!isMe && curNickname && m.content) {
            // 支持 @昵称 格式
            var escapedNick = curNickname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var mentionRegex = new RegExp('@' + escapedNick + '(?=\\s|$)', 'i');
            if (mentionRegex.test(m.content) || m.content.indexOf('@所有人') >= 0) {
                isMentioned = true;
            }
        }

        // 消息内容
        var contentHtml = '';
        if (type === 'FILE') {
            contentHtml = self._renderFileContent(m);
        } else if (type === 'VOTE') {
            var voteId = null;
            try { var meta = JSON.parse(m.metadata || '{}'); voteId = meta.voteId; } catch (e) {}
            contentHtml = '<div style="font-weight:600;">📊 ' + self._escapeHtml(m.content) + '</div>';
            if (voteId) {
                contentHtml += '<button class="btn btn-primary btn-sm vote-view-btn" data-vote-id="' + voteId +
                    '" style="margin-top:4px;">查看投票详情</button>';
            }
        } else if (type === 'ANNOUNCEMENT') {
            contentHtml = '<div style="font-weight:600;margin-bottom:2px;">📢 群公告</div>' +
                '<div style="white-space:pre-wrap;">' + self._escapeHtml(m.content.replace('📢 群公告：\n', '')) + '</div>';
        } else {
            // TEXT 默认 - 高亮@提及
            var text = self._escapeHtml(m.content);
            text = text.replace(/@所有人/g, '<span style="color:var(--primary);font-weight:600;">@所有人</span>');
            if (curNickname) {
                var escapedNick2 = curNickname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                var regex2 = new RegExp('@' + escapedNick2 + '(?=\\s|$)', 'gi');
                text = text.replace(regex2, '<span style="color:var(--primary);font-weight:600;background:rgba(79,70,229,0.1);padding:1px 4px;border-radius:3px;">@' + curNickname + '</span>');
            }
            contentHtml = text;
        }

        var statusIcon = '';
        if (isMe && m.status === 'sending') {
            statusIcon = '<span style="font-size:10px;color:#aaa;">发送中...</span>';
        } else if (isMe && m.status === 'failed') {
            statusIcon = '<span style="font-size:10px;color:#e74c3c;">发送失败</span>';
        }

        // 被@的消息添加左侧高亮边框
        var extraBubbleStyle = '';
        if (isMentioned && !isMe) {
            extraBubbleStyle = 'border-left:3px solid var(--primary);';
        }

        return `
        <div class="msg-row ${isMe ? 'msg-me' : 'msg-other'}">
            <div style="display:flex;align-items:flex-start;max-width:100%;${isMe ? 'justify-content:flex-end;' : ''}">
                ${!isMe ? '<img src="' + (m.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.senderId) + '" class="msg-avatar" alt="" />' : ''}
                <div class="msg-content-wrap" style="${isMe ? 'align-items:flex-end;' : 'align-items:flex-start;'}">
                    ${!isMe ? '<div class="msg-sender-name">' + self._escapeHtml(m.senderNickname || '用户' + m.senderId) + '</div>' : ''}
                    <div class="msg-bubble ${isMe ? 'bubble-me' : 'bubble-other'}" style="${extraBubbleStyle}">
                        <div class="msg-text">${contentHtml}</div>
                    </div>
                    <div class="msg-meta">
                        <span class="msg-time">${time}</span>
                        ${isMentioned && !isMe ? '<span style="font-size:10px;color:var(--primary);margin-left:4px;">@了你</span>' : ''}
                        ${statusIcon}
                    </div>
                </div>
                ${isMe ? '<img src="' + (m.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.senderId) + '" class="msg-avatar" alt="" />' : ''}
            </div>
        </div>`;
    },

    _renderFileContent: function (m) {
        var self = this;
        var content = m.content || '';
        var meta = {};
        try { meta = JSON.parse(m.metadata || '{}'); } catch (e) {}
        var fileName = meta.fileName || '';
        var isImage = meta.isImage || /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(content);

        if (isImage && content) {
            return '<div class="file-img-wrapper" data-full-src="' + self._escapeAttr(content) +
                '" style="cursor:pointer;position:relative;">' +
                '<img src="' + self._escapeHtml(content) +
                '" style="max-width:200px;max-height:150px;border-radius:8px;display:block;" ' +
                'onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\';" ' +
                'title="' + self._escapeHtml(fileName || '点击查看大图') + '" />' +
                '<span style="display:none;color:var(--text-secondary);font-size:12px;">[图片加载失败]</span>' +
                (fileName ? '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">' + self._escapeHtml(fileName) +
                    ' <a href="' + self._escapeHtml(content) + '" download="' + self._escapeAttr(fileName) +
                    '" style="color:var(--primary);font-size:10px;margin-left:4px;">下载</a></div>' : '') +
                '</div>';
        }
        var displayName = fileName || content.split('/').pop() || '文件';
        var downloadAttr = fileName ? ' download="' + self._escapeAttr(fileName) + '"' : ' download';
        return '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:28px;">📎</span>' +
            '<div>' +
            '<div style="font-size:13px;font-weight:500;">' + self._escapeHtml(displayName) + '</div>' +
            '<a href="' + self._escapeHtml(content) + '"' + downloadAttr +
            ' target="_blank" style="color:var(--primary);text-decoration:underline;font-size:11px;">下载文件</a>' +
            '</div></div>';
    },

    _scrollToBottom: function () {
        var self = this;
        var el = document.getElementById('chatMessages');
        if (el) {
            setTimeout(function () { el.scrollTop = el.scrollHeight; }, 50);
        }
        // 绑定投票查看按钮 + 图片预览点击
        setTimeout(function () {
            var voteBtns = document.querySelectorAll('.vote-view-btn');
            for (var i = 0; i < voteBtns.length; i++) {
                (function (vid) {
                    voteBtns[i].addEventListener('click', function () {
                        self._showVoteDetail(vid);
                    });
                })(parseInt(voteBtns[i].dataset.voteId));
            }
            // 图片预览：点击.file-img-wrapper弹出全屏大图
            var imgWrappers = document.querySelectorAll('.file-img-wrapper');
            for (var j = 0; j < imgWrappers.length; j++) {
                (function () {
                    var wrapper = imgWrappers[j];
                    wrapper.addEventListener('click', function () {
                        var fullSrc = wrapper.dataset.fullSrc;
                        if (!fullSrc) return;
                        var overlay = document.createElement('div');
                        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
                        overlay.innerHTML = '<img src="' + fullSrc + '" style="max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain;" />';
                        overlay.addEventListener('click', function () { overlay.remove(); });
                        document.body.appendChild(overlay);
                    });
                })();
            }
        }, 150);
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
        div.textContent = text || '';
        return div.innerHTML;
    },

    _escapeAttr: function (text) {
        return (text || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    // ========== 投票详情弹窗 ==========

    _showVoteDetail: async function (voteId) {
        var self = this;
        try {
            var res = await TeamAPI.getVoteDetail(self._teamId, voteId);
            var vote = res.data;
            if (!vote) return;

            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;';
            var totalVotes = vote.totalVotes || 0;
            var isActive = vote.status === 'active';
            var canVote = isActive && !vote.hasVoted;
            var canClose = self._teamData &&
                (self._teamData.userRole === 'leader' || self._teamData.userRole === 'admin' ||
                (getCurUser() && getCurUser().id === vote.creatorId)) && isActive;

            var maxCount = 0;
            for (var o = 0; o < (vote.options || []).length; o++) {
                if (vote.options[o].count > maxCount) maxCount = vote.options[o].count;
            }

            // 多选时已选中的选项索引
            var selectedIndexes = {};

            var optionsHtml = '';
            for (var i = 0; i < (vote.options || []).length; i++) {
                var opt = vote.options[i];
                var pct = maxCount > 0 ? Math.round(opt.count / maxCount * 100) : 0;

                if (canVote) {
                    // 可投票状态：显示可点击的选项行
                    if (vote.isMultiple) {
                        optionsHtml += '<div class="vote-option-row" data-opt-idx="' + i + '" style="padding:8px 12px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;">' +
                            '<input type="checkbox" class="vote-checkbox" data-opt-idx="' + i + '" style="pointer-events:none;flex-shrink:0;" />' +
                            '<span style="flex:1;font-size:14px;">' + self._escapeHtml(opt.text) + '</span>' +
                            '<span style="font-size:12px;color:var(--text-secondary);margin-left:16px;flex-shrink:0;">' + opt.count + '票</span>' +
                            '</div>';
                    } else {
                        optionsHtml += '<div class="vote-option-row" data-opt-idx="' + i + '" style="padding:10px 14px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;">' +
                            '<span class="vote-radio-dot" style="width:18px;height:18px;border-radius:50%;border:2px solid var(--border);margin-right:10px;flex-shrink:0;transition:all 0.15s;"></span>' +
                            '<span style="flex:1;font-size:14px;font-weight:500;">' + self._escapeHtml(opt.text) + '</span>' +
                            '<span style="font-size:12px;color:var(--text-secondary);margin-left:16px;flex-shrink:0;">' + opt.count + '票</span>' +
                            '</div>';
                    }
                } else {
                    // 已投票或已结束：显示结果条
                    optionsHtml += '<div style="margin-bottom:10px;">' +
                        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:2px;">' +
                        '<span>' + self._escapeHtml(opt.text) + '</span>' +
                        '<span style="color:var(--text-secondary);margin-left:16px;">' + opt.count + '票' +
                        (totalVotes > 0 ? ' (' + Math.round(opt.count / totalVotes * 100) + '%)' : '') + '</span>' +
                        '</div><div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">' +
                        '<div style="height:100%;width:' + pct + '%;background:var(--primary);border-radius:3px;"></div></div></div>';
                }
            }

            overlay.innerHTML = `
            <div style="background:var(--card);border-radius:12px;padding:24px;width:90%;max-width:440px;max-height:80vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 style="margin:0;">📊 ${self._escapeHtml(vote.title)}</h3>
                    <span style="font-size:12px;padding:2px 8px;border-radius:10px;background:${isActive ? '#e8f5e9' : '#f5f5f5'};color:${isActive ? '#2e7d32' : '#999'};">
                        ${isActive ? '进行中' : '已结束'}</span>
                </div>
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">
                    由 ${self._escapeHtml(vote.creatorNickname || '未知')} 发起 · ${totalVotes}人参与 · ${vote.isMultiple ? '多选' : '单选'}
                    ${vote.deadline ? ' · 截止: ' + new Date(vote.deadline).toLocaleString() : ''}
                </div>
                ${canVote ? '<div style="font-size:12px;color:var(--primary);margin-bottom:8px;">请选择一个选项后点击确认投票</div>' : ''}
                ${vote.hasVoted ? '<div style="font-size:12px;color:var(--primary);margin-bottom:8px;font-weight:500;">✓ 你已投票</div>' : ''}
                <div id="voteOptionsArea">${optionsHtml}</div>
                ${canVote ? '<button class="btn btn-primary" id="submitVoteBtn" style="margin-top:12px;width:100%;" disabled>确认投票</button>' : ''}
                <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
                    ${canClose ? '<button class="btn btn-outline btn-sm" id="closeVoteBtn">结束投票</button>' : ''}
                    <button class="btn btn-primary btn-sm" id="closeVoteDetail">关闭</button>
                </div>
            </div>`;
            document.body.appendChild(overlay);

            // 关闭按钮
            overlay.querySelector('#closeVoteDetail').addEventListener('click', function () {
                overlay.remove();
            });

            // 结束投票
            if (canClose) {
                overlay.querySelector('#closeVoteBtn').addEventListener('click', async function () {
                    try {
                        await TeamAPI.closeVote(self._teamId, voteId);
                        toast('投票已结束', 'success');
                        overlay.remove();
                    } catch (e) {
                        toast(e.message || '操作失败', 'error');
                    }
                });
            }

            // 单选：点击选中，radio dot 高亮
            if (canVote && !vote.isMultiple) {
                var rows = overlay.querySelectorAll('.vote-option-row');
                var selectedSingleIdx = -1;
                var submitBtn = overlay.querySelector('#submitVoteBtn');
                for (var r = 0; r < rows.length; r++) {
                    (function (optIdx) {
                        rows[r].addEventListener('click', function () {
                            // 取消所有选中
                            for (var s = 0; s < rows.length; s++) {
                                rows[s].style.background = '';
                                rows[s].style.borderColor = 'var(--border)';
                                var dot = rows[s].querySelector('.vote-radio-dot');
                                if (dot) {
                                    dot.style.background = '';
                                    dot.style.borderColor = 'var(--border)';
                                }
                            }
                            // 选中当前
                            this.style.background = 'rgba(79,70,229,0.06)';
                            this.style.borderColor = 'var(--primary)';
                            var dot = this.querySelector('.vote-radio-dot');
                            if (dot) {
                                dot.style.background = 'var(--primary)';
                                dot.style.borderColor = 'var(--primary)';
                            }
                            selectedSingleIdx = optIdx;
                            if (submitBtn) {
                                submitBtn.disabled = false;
                                submitBtn.textContent = '确认投票';
                            }
                        });
                        // hover 效果
                        rows[r].addEventListener('mouseenter', function () {
                            if (selectedSingleIdx !== parseInt(this.dataset.optIdx)) {
                                this.style.background = 'rgba(79,70,229,0.04)';
                            }
                        });
                        rows[r].addEventListener('mouseleave', function () {
                            if (selectedSingleIdx !== parseInt(this.dataset.optIdx)) {
                                this.style.background = '';
                            }
                        });
                    })(parseInt(rows[r].dataset.optIdx));
                }

                // 确认投票（单选）
                if (submitBtn) {
                    submitBtn.addEventListener('click', async function () {
                        if (selectedSingleIdx < 0) {
                            toast('请先选择一个选项', 'error');
                            return;
                        }
                        try {
                            await TeamAPI.castVote(self._teamId, voteId, { optionIndexes: [selectedSingleIdx] });
                            toast('投票成功', 'success');
                            overlay.remove();
                            self._refreshVoteInMessages(voteId);
                        } catch (e) {
                            toast(e.message || '投票失败', 'error');
                        }
                    });
                }
            }

            // 多选：勾选后点确认
            if (canVote && vote.isMultiple) {
                var checkboxes = overlay.querySelectorAll('.vote-checkbox');
                var submitBtn = overlay.querySelector('#submitVoteBtn');
                for (var c = 0; c < checkboxes.length; c++) {
                    checkboxes[c].addEventListener('change', function () {
                        var idx = parseInt(this.dataset.optIdx);
                        if (this.checked) {
                            selectedIndexes[idx] = true;
                        } else {
                            delete selectedIndexes[idx];
                        }
                        var parentRow = this.closest('.vote-option-row');
                        if (parentRow) {
                            parentRow.style.background = this.checked ? 'rgba(79,70,229,0.08)' : '';
                            parentRow.style.borderColor = this.checked ? 'var(--primary)' : 'var(--border)';
                        }
                        if (submitBtn) {
                            submitBtn.disabled = Object.keys(selectedIndexes).length === 0;
                        }
                    });
                }

                if (submitBtn) {
                    submitBtn.addEventListener('click', async function () {
                        var idxList = Object.keys(selectedIndexes).map(Number);
                        if (idxList.length === 0) {
                            toast('请至少选择一个选项', 'error');
                            return;
                        }
                        try {
                            await TeamAPI.castVote(self._teamId, voteId, { optionIndexes: idxList });
                            toast('投票成功', 'success');
                            overlay.remove();
                            self._refreshVoteInMessages(voteId);
                        } catch (e) {
                            toast(e.message || '投票失败', 'error');
                        }
                    });
                }

                // 多选行点击切换
                var multiRows = overlay.querySelectorAll('.vote-option-row');
                for (var mr = 0; mr < multiRows.length; mr++) {
                    multiRows[mr].addEventListener('click', function () {
                        var cb = this.querySelector('.vote-checkbox');
                        if (cb) {
                            cb.checked = !cb.checked;
                            cb.dispatchEvent(new Event('change'));
                        }
                    });
                }
            }
        } catch (e) {
            toast('加载投票失败: ' + (e.message || ''), 'error');
        }
    },

    // 投票后刷新消息列表中的投票状态（用于VOTE类型消息不再显示"查看详情"）
    _refreshVoteInMessages: function (voteId) {
        // 投票成功后，重新获取投票详情并更新消息渲染
        // 当前简化：不做额外处理，用户下次打开详情时会看到已投票
    }
});
