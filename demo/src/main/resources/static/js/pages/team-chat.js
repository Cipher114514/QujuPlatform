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
    _contextMenu: null,
    _fileInput: null,

    render: function (params) {
        return `
        <div class="container chat-room-container">
            <div class="chat-header">
                <a href="#/team/${params.id}" class="btn btn-outline btn-sm">← 返回</a>
                <span style="font-weight:700;font-size:16px;" id="teamChatTitle">小队群聊</span>
                <button class="btn btn-outline btn-sm" id="fileListToggle" title="群文件">📁</button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="loading">加载中...</div>
            </div>
            <div id="fileListPanel" style="display:none;background:var(--card);border-top:1px solid var(--border);padding:12px;max-height:200px;overflow-y:auto;"></div>
            <div class="chat-input-area">
                <input type="file" id="fileUploadInput" style="display:none;" multiple />
                <button class="btn btn-outline btn-sm" id="fileUploadBtn" title="上传文件" style="font-size:18px;line-height:1;padding:4px 8px;">＋</button>
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

        // 文件上传
        document.getElementById('fileUploadBtn').addEventListener('click', function () {
            document.getElementById('fileUploadInput').click();
        });
        document.getElementById('fileUploadInput').addEventListener('change', function () {
            self._handleFileUpload(this.files);
        });

        // 群文件列表面板
        document.getElementById('fileListToggle').addEventListener('click', function () {
            self._toggleFileList();
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
        this._hideContextMenu();
    },

    // ========== WebSocket 消息处理 ==========

    _onWsMessage: function (msg) {
        // 处理撤回事件
        if (msg.type === 'RECALL') {
            for (var i = 0; i < this._messages.length; i++) {
                if (this._messages[i].id === msg.id) {
                    this._messages[i].content = msg.content || '消息已被撤回';
                    this._messages[i].type = 'RECALL';
                    this._messages[i].recalledAt = msg.recalledAt;
                    this._messages[i].fileUrl = null;
                    this._messages[i].fileName = null;
                    this._messages[i].fileSize = null;
                    this._renderMessages();
                    return;
                }
            }
            return;
        }
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

    // ========== 上下文菜单 & 撤回/转发 ==========

    _showContextMenu: function (e, msg) {
        this._hideContextMenu();
        var self = this;
        var curUser = getCurUser();
        var isMe = msg.senderId === (curUser ? curUser.id : 0);
        var isTeamLeader = self._teamData && self._teamData.leaderId === (curUser ? curUser.id : 0);
        var isAdmin = self._teamData && self._teamData.userRole === 'admin';
        var isFile = msg.type === 'FILE' && !msg.recalledAt;

        var menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = 'position:fixed;z-index:9999;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:4px 0;min-width:120px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';

        var items = [];
        var canRecall = isMe && msg.type !== 'RECALL' && msg.type !== 'SYSTEM' && !msg.recalledAt
            && (new Date() - new Date(msg.sentAt)) < 120000;

        if (canRecall) {
            items.push({ label: '撤回', action: function () { self._recallMessage(msg); } });
        }
        if (msg.type !== 'RECALL' && !msg.recalledAt) {
            items.push({ label: '转发', action: function () { self._forwardMessage(msg); } });
        }
        if (isFile && (isMe || isTeamLeader || isAdmin)) {
            items.push({ label: '删除文件', action: function () { self._deleteFile(msg); } });
        }

        if (items.length === 0) { return; }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var div = document.createElement('div');
            div.className = 'context-menu-item';
            div.textContent = item.label;
            div.style.cssText = 'padding:8px 16px;cursor:pointer;font-size:14px;color:' + (item.label === '删除文件' ? 'var(--danger)' : 'var(--text)') + ';';
            div.addEventListener('mouseenter', function () { this.style.background = 'var(--bg)'; });
            div.addEventListener('mouseleave', function () { this.style.background = 'transparent'; });
            (function (action) {
                div.addEventListener('click', function () { action(); self._hideContextMenu(); });
            })(item.action);
            menu.appendChild(div);
        }

        document.body.appendChild(menu);
        this._contextMenu = menu;
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
            await TeamAPI.recallMessage(self._teamId, msg.id);
            var idx = self._findMsgIndex(msg.id);
            if (idx >= 0) {
                self._messages[idx].content = '消息已被撤回';
                self._messages[idx].type = 'RECALL';
                self._messages[idx].recalledAt = new Date().toISOString();
                self._messages[idx].fileUrl = null;
                self._messages[idx].fileName = null;
                self._messages[idx].fileSize = null;
                self._renderMessages();
            }
        } catch (e) {
            toast(e.message || '撤回失败', 'error');
        }
    },

    _forwardMessage: function (msg) {
        this._showForwardModal(msg);
    },

    _showForwardModal: function (msg) {
        var self = this;
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;justify-content:center;align-items:center;';
        overlay.innerHTML = '<div style="background:var(--card);border-radius:12px;padding:20px;width:90%;max-width:380px;max-height:70vh;overflow-y:auto;">'
            + '<h3 style="margin:0 0 12px;">转发消息</h3>'
            + '<div style="margin-bottom:6px;font-weight:600;font-size:13px;color:var(--text-secondary);">转发到好友</div>'
            + '<div id="forwardFriendList" style="max-height:200px;overflow-y:auto;margin-bottom:16px;">加载中...</div>'
            + '<div style="margin-bottom:6px;font-weight:600;font-size:13px;color:var(--text-secondary);">转发到小队群聊</div>'
            + '<div id="forwardTeamList" style="max-height:120px;overflow-y:auto;margin-bottom:12px;">加载中...</div>'
            + '<div style="text-align:right;"><button class="btn btn-outline btn-sm" id="forwardCancel">取消</button></div>'
            + '</div>';
        document.body.appendChild(overlay);

        document.getElementById('forwardCancel').addEventListener('click', function () { overlay.remove(); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

        // 并行加载好友列表
        var seenIds = {};
        var friendItems = [];

        function renderFriendList() {
            var html = '';
            if (friendItems.length === 0) {
                html = '<div class="empty-state" style="padding:10px;">暂无好友</div>';
            }
            for (var k = 0; k < friendItems.length; k++) {
                var item = friendItems[k];
                html += '<div class="forward-friend-item" style="display:flex;align-items:center;padding:8px;cursor:pointer;border-radius:8px;" data-userid="' + item.id + '">'
                    + '<div style="width:32px;height:32px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;margin-right:10px;font-size:12px;flex-shrink:0;">'
                    + (item.nickname || '?').charAt(0).toUpperCase() + '</div>'
                    + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + self._escapeHtml(item.nickname || '用户' + item.id) + '</span>'
                    + '</div>';
            }
            var el = document.getElementById('forwardFriendList');
            if (el) el.innerHTML = html;
            var items = overlay.querySelectorAll('.forward-friend-item');
            for (var j = 0; j < items.length; j++) {
                items[j].addEventListener('click', function () {
                    var uid = parseInt(this.dataset.userid);
                    overlay.remove();
                    self._doForward(msg, uid);
                });
            }
        }

        FollowAPI.following().then(function (res) {
            var list = res.data || [];
            for (var i = 0; i < list.length; i++) {
                var u = list[i];
                if (u.id === (getCurUser() || {}).id) continue;
                if (!seenIds[u.id]) {
                    seenIds[u.id] = true;
                    friendItems.push({ id: u.id, nickname: u.nickname || u.name });
                }
            }
            renderFriendList();
        }).catch(function () {
            renderFriendList();
        });

        MessageAPI.conversations().then(function (res) {
            var convs = res.data || [];
            for (var i = 0; i < convs.length; i++) {
                var tu = (convs[i] || {}).targetUser;
                if (!tu) continue;
                if (tu.id === (getCurUser() || {}).id) continue;
                if (!seenIds[tu.id]) {
                    seenIds[tu.id] = true;
                    friendItems.push({ id: tu.id, nickname: tu.nickname });
                }
            }
            renderFriendList();
        }).catch(function () {});

        // 加载小队列表（排除当前小队）
        TeamAPI.myTeams().then(function (res) {
            var teams = res.data || [];
            var html = '';
            var filtered = [];
            for (var i = 0; i < teams.length; i++) {
                if (teams[i].id === self._teamId) continue;
                filtered.push(teams[i]);
            }
            if (filtered.length === 0) {
                html = '<div class="empty-state" style="padding:10px;">暂无其他小队</div>';
            }
            for (var i = 0; i < filtered.length; i++) {
                var t = filtered[i];
                html += '<div class="forward-team-item" style="display:flex;align-items:center;padding:8px;cursor:pointer;border-radius:8px;" data-teamid="' + t.id + '">'
                    + '<div style="width:32px;height:32px;border-radius:8px;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;margin-right:10px;font-size:12px;flex-shrink:0;">'
                    + (t.name || '?').charAt(0).toUpperCase() + '</div>'
                    + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + self._escapeHtml(t.name || '小队') + '</span>'
                    + '</div>';
            }
            var teamEl = document.getElementById('forwardTeamList');
            if (teamEl) teamEl.innerHTML = html;
            var teamItems = overlay.querySelectorAll('.forward-team-item');
            for (var j = 0; j < teamItems.length; j++) {
                teamItems[j].addEventListener('click', function () {
                    var tid = parseInt(this.dataset.teamid);
                    overlay.remove();
                    self._doForwardToTeam(msg, tid);
                });
            }
        }).catch(function () {
            var teamEl = document.getElementById('forwardTeamList');
            if (teamEl) teamEl.innerHTML = '<div class="empty-state" style="padding:10px;">加载失败</div>';
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

    _doForwardToTeam: async function (msg, targetTeamId) {
        try {
            await TeamAPI.forwardMessage(this._teamId, msg.id, { targetTeamId: targetTeamId });
            toast('已转发到小队群聊');
        } catch (e) {
            toast(e.message || '转发失败', 'error');
        }
    },

    // ========== 文件上传 ==========

    _handleFileUpload: async function (files) {
        if (!files || files.length === 0) return;
        var self = this;
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.size > 10 * 1024 * 1024) {
                toast('文件 ' + file.name + ' 超过10MB限制', 'error');
                continue;
            }
            try {
                var uploadRes = await UploadAPI.upload(file, 'chat');
                var fileData = uploadRes.data;
                // 发送文件消息
                var content = JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    fileUrl: fileData.url || fileData
                });
                await api('/teams/' + self._teamId + '/messages', {
                    method: 'POST',
                    body: {
                        content: content,
                        type: 'FILE',
                        fileUrl: fileData.url || fileData,
                        fileName: file.name,
                        fileSize: file.size
                    }
                });
                toast(file.name + ' 上传成功');
            } catch (e) {
                toast('上传 ' + file.name + ' 失败: ' + (e.message || '未知错误'), 'error');
            }
        }
        // 清空input以支持重复上传同一文件
        document.getElementById('fileUploadInput').value = '';
    },

    _deleteFile: async function (msg) {
        if (!confirm('确定要删除该文件吗？')) return;
        try {
            await TeamAPI.deleteFile(this._teamId, msg.id);
            var idx = this._findMsgIndex(msg.id);
            if (idx >= 0) {
                this._messages[idx].content = '文件已被删除';
                this._messages[idx].type = 'RECALL';
                this._messages[idx].recalledAt = new Date().toISOString();
                this._messages[idx].fileUrl = null;
                this._messages[idx].fileName = null;
                this._messages[idx].fileSize = null;
                this._renderMessages();
            }
        } catch (e) {
            toast(e.message || '删除失败', 'error');
        }
    },

    _toggleFileList: async function () {
        var panel = document.getElementById('fileListPanel');
        if (!panel) return;
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            await this._loadFileList();
        } else {
            panel.style.display = 'none';
        }
    },

    _loadFileList: async function () {
        var panel = document.getElementById('fileListPanel');
        if (!panel) return;
        try {
            var res = await TeamAPI.files(this._teamId);
            var files = res.data || [];
            if (files.length === 0) {
                panel.innerHTML = '<div style="color:var(--text-secondary);font-size:13px;padding:8px;">暂无共享文件</div>';
                return;
            }
            var self = this;
            var html = '<div style="font-weight:600;margin-bottom:8px;font-size:14px;">群文件 (' + files.length + ')</div>';
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                var sizeStr = f.fileSize ? (f.fileSize < 1024 * 1024 ? Math.round(f.fileSize / 1024) + 'KB' : (f.fileSize / (1024 * 1024)).toFixed(2) + 'MB') : '';
                html += '<div style="display:flex;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">'
                    + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-right:8px;color:var(--primary);">'
                    + '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>'
                    + '<polyline points="14 2 14 8 20 8"/>'
                    + '<line x1="16" y1="13" x2="8" y2="13"/>'
                    + '<line x1="16" y1="17" x2="8" y2="17"/>'
                    + '</svg>'
                    + '<a href="' + self._escapeHtml(f.fileUrl || '') + '" target="_blank" style="flex:1;color:var(--primary);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
                    + self._escapeHtml(f.fileName || f.content) + '</a>'
                    + '<span style="color:var(--text-secondary);margin-left:8px;white-space:nowrap;">' + sizeStr + '</span>'
                    + '<span style="color:var(--text-secondary);margin-left:8px;font-size:11px;">' + self._escapeHtml(f.senderNickname || '') + '</span>'
                    + '</div>';
            }
            panel.innerHTML = html;
        } catch (e) {
            panel.innerHTML = '<div style="color:var(--text-secondary);font-size:13px;padding:8px;">加载文件列表失败</div>';
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
            var isRecall = m.type === 'RECALL' || m.recalledAt;
            var isFile = m.type === 'FILE' && !m.recalledAt;
            var time = self._formatMsgTime(m.sentAt);

            if (isSystem) {
                html += '<div style="text-align:center;padding:8px;color:var(--text-secondary);font-size:12px;">'
                    + '<span style="background:var(--border);padding:4px 12px;border-radius:10px;">'
                    + self._escapeHtml(m.content) + '</span></div>';
                continue;
            }

            if (isRecall) {
                var who = isMe ? '你' : (m.senderNickname || '用户' + m.senderId);
                html += '<div style="text-align:center;padding:6px;color:var(--text-secondary);font-size:12px;">'
                    + '<span style="background:var(--border);padding:3px 10px;border-radius:10px;">' + who + '撤回了一条消息</span></div>';
                continue;
            }

            var statusIcon = '';
            if (isMe && m.status === 'sending') {
                statusIcon = '<span style="font-size:10px;color:#aaa;">发送中...</span>';
            } else if (isMe && m.status === 'failed') {
                statusIcon = '<span style="font-size:10px;color:#e74c3c;">发送失败</span>';
            }

            if (isFile) {
                // 解析文件信息（支持新旧两种格式）
                var fileName = m.fileName || '';
                var fileUrl = m.fileUrl || '';
                var fileSize = m.fileSize || 0;
                // 兼容content为JSON格式的文件信息
                if (!fileName && m.content) {
                    try {
                        var parsed = JSON.parse(m.content);
                        fileName = parsed.fileName || '';
                        fileUrl = parsed.fileUrl || '';
                        fileSize = parsed.fileSize || 0;
                    } catch (e) {}
                }
                var sizeStr = fileSize ? (fileSize < 1024 * 1024 ? Math.round(fileSize / 1024) + 'KB' : (fileSize / (1024 * 1024)).toFixed(2) + 'MB') : '';

                html += '<div class="msg-row ' + (isMe ? 'msg-me' : 'msg-other') + '" style="display:flex;flex-direction:row;align-items:flex-start;max-width:90%;' + (isMe ? 'margin-left:auto;' : 'margin-right:auto;') + '">'
                    + (!isMe ? '<img src="' + (m.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.senderId) + '" class="msg-avatar" alt="" />' : '')
                    + '<div class="msg-content-wrap" style="' + (isMe ? 'align-items:flex-end;' : 'align-items:flex-start;') + '">'
                    + (!isMe ? '<div class="msg-sender-name">' + self._escapeHtml(m.senderNickname || '用户' + m.senderId) + '</div>' : '')
                    + '<div class="msg-bubble ' + (isMe ? 'bubble-me' : 'bubble-other') + '" data-msgid="' + m.id + '" style="max-width:250px;">'
                    + '<div style="display:flex;align-items:center;gap:10px;">'
                    + '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;color:' + (isMe ? 'rgba(255,255,255,0.8)' : 'var(--primary)') + ';">'
                    + '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>'
                    + '<polyline points="14 2 14 8 20 8"/>'
                    + '<line x1="16" y1="13" x2="8" y2="13"/>'
                    + '<line x1="16" y1="17" x2="8" y2="17"/>'
                    + '<polyline points="10 9 9 9 8 9"/>'
                    + '</svg>'
                    + '<div style="min-width:0;">'
                    + '<a href="' + self._escapeHtml(fileUrl) + '" target="_blank" style="color:' + (isMe ? '#fff' : 'var(--primary)') + ';text-decoration:underline;font-size:13px;word-break:break-all;">'
                    + self._escapeHtml(fileName || '未知文件') + '</a>'
                    + (sizeStr ? '<div style="font-size:11px;color:' + (isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)') + ';">' + sizeStr + '</div>' : '')
                    + '</div></div></div>'
                    + '<div class="msg-meta" style="text-align:' + (isMe ? 'right' : 'left') + '">'
                    + '<span class="msg-time">' + time + '</span>' + statusIcon + '</div>'
                    + '</div>'
                    + (isMe ? '<img src="' + (m.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.senderId) + '" class="msg-avatar" alt="" />' : '')
                    + '</div>';
                continue;
            }

            html += `
            <div class="msg-row ${isMe ? 'msg-me' : 'msg-other'}" style="display:flex;flex-direction:row;align-items:flex-start;max-width:90%;${isMe ? 'margin-left:auto;' : 'margin-right:auto;'}">
                ${!isMe ? '<img src="' + (m.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.senderId) + '" class="msg-avatar" alt="" />' : ''}
                <div class="msg-content-wrap" style="${isMe ? 'align-items:flex-end;' : 'align-items:flex-start;'}">
                    ${!isMe ? '<div class="msg-sender-name">' + self._escapeHtml(m.senderNickname || '用户' + m.senderId) + '</div>' : ''}
                    <div class="msg-bubble ${isMe ? 'bubble-me' : 'bubble-other'}" data-msgid="${m.id}">
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
});
