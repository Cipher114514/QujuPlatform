// ====== 好友管理页 ======
// 任务范围：US-024 添加好友（搜索用户，发送/同意/拒绝好友申请）
//          US-025 管理好友（好友列表，删除好友）
// 注意：备注、分组功能为未来迭代预留，当前使用 TODO 占位
Router.register('/friends', {
    title: '我的好友',
    requireAuth: true,

    render: function() {
        return `
        <div class="home-content">
            <!-- 顶部标题 -->
            <div class="welcome-card">
                <h2>我的好友</h2>
                <p>管理好友关系和社交网络</p>
            </div>

            <!-- Tab 切换 -->
            <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm tab-btn active" data-tab="friends">👥 好友列表</button>
                <button class="btn btn-outline btn-sm tab-btn" data-tab="requests">📩 好友请求 <span id="requestBadge" style="display:none;background:var(--danger);color:#fff;border-radius:50%;padding:0 6px;font-size:11px;margin-left:4px;">0</span></button>
                <button class="btn btn-outline btn-sm tab-btn" data-tab="add">➕ 添加好友</button>
            </div>

            <!-- ====== Tab: 好友列表 ====== -->
            <div id="tabFriends" class="tab-content">
                <div class="card" style="margin-bottom:12px;padding:12px 16px;">
                    <input type="text" id="friendSearch" placeholder="🔍 搜索好友..." style="width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none;background:var(--bg);color:var(--text);">
                </div>
                <div id="friendList">
                    <p style="text-align:center;padding:40px;color:var(--text-secondary);">
                        <span class="spinner" style="border-color:rgba(0,0,0,.15);border-top-color:var(--primary);display:inline-block;width:20px;height:20px;"></span> 加载中...
                    </p>
                </div>
            </div>

            <!-- ====== Tab: 好友请求 ====== -->
            <div id="tabRequests" class="tab-content" style="display:none;">
                <div id="requestList">
                    <p style="text-align:center;padding:40px;color:var(--text-secondary);">
                        <span class="spinner" style="border-color:rgba(0,0,0,.15);border-top-color:var(--primary);display:inline-block;width:20px;height:20px;"></span> 加载中...
                    </p>
                </div>
                <div id="sentRequestList" style="margin-top:16px;">
                    <p style="text-align:center;padding:20px;color:var(--text-secondary);font-size:14px;">📤 已发送的请求</p>
                </div>
            </div>

            <!-- ====== Tab: 添加好友 ====== -->
            <div id="tabAdd" class="tab-content" style="display:none;">
                <div class="card">
                    <div class="form-group">
                        <label>搜索用户</label>
                        <input type="text" id="searchUserInput" placeholder="输入用户ID或昵称搜索...">
                        <p class="hint">输入用户ID或昵称，点击搜索找到要添加的好友</p>
                    </div>
                    <button class="btn btn-primary" id="searchUserBtn">🔍 搜索用户</button>
                </div>
                <div id="searchResult" style="margin-top:16px;"></div>
            </div>
        </div>`;
    },

    init: function() {
        var self = this;
        self.currentTab = 'friends';
        self.friendList = [];

        // Tab 切换
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var tab = this.dataset.tab;
                self.switchTab(tab);
            });
        });

        // 好友搜索（实时过滤）
        document.getElementById('friendSearch').addEventListener('input', function() {
            self.filterFriends(this.value);
        });

        // 搜索用户
        document.getElementById('searchUserBtn').addEventListener('click', function() {
            self.searchUser();
        });
        document.getElementById('searchUserInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                self.searchUser();
            }
        });

        // 默认加载好友列表
        this.loadFriends();
        this.loadRequests();
    },

    // ========== Tab 切换 ==========
    switchTab: function(tab) {
        this.currentTab = tab;

        // 更新按钮样式
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.className = 'btn btn-outline btn-sm tab-btn';
            if (btn.dataset.tab === tab) {
                btn.className = 'btn btn-primary btn-sm tab-btn active';
            }
        });

        // 显示对应内容
        document.querySelectorAll('.tab-content').forEach(function(el) {
            el.style.display = 'none';
        });
        document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).style.display = 'block';

        // 切换时刷新数据
        if (tab === 'requests') {
            this.loadRequests();
        }
        if (tab === 'add') {
            document.getElementById('searchResult').innerHTML = '';
            document.getElementById('searchUserInput').value = '';
        }
    },

    // ========== 加载好友列表（US-025） ==========
    loadFriends: async function() {
        var container = document.getElementById('friendList');
        try {
            var res = await api('/friends', { method: 'GET' });
            this.friendList = res.data || [];
            this.renderFriends(this.friendList);
        } catch (err) {
            container.innerHTML = '<p style="text-align:center;color:var(--danger);padding:16px;">加载失败: ' + escapeHtml(err.message) + '</p>';
        }
    },

    renderFriends: function(list) {
        var container = document.getElementById('friendList');
        if (!list || list.length === 0) {
            container.innerHTML = `
                <div class="card" style="text-align:center;padding:40px;color:var(--text-secondary);">
                    <p style="font-size:40px;">👥</p>
                    <p style="font-weight:700;">暂无好友</p>
                    <p style="font-size:13px;margin-top:4px;">去「添加好友」页面搜索添加吧</p>
                </div>`;
            return;
        }

        var html = list.map(function(friend) {
            var friendSince = friend.friendSince ? new Date(friend.friendSince).toLocaleDateString('zh-CN') : '未知';
            return `
            <div class="card friend-item" style="margin-bottom:8px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
                <div style="width:44px;height:44px;border-radius:50%;background:var(--primary-light, #e8e0f0);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;color:var(--primary);">
                    ${friend.avatar ? '<img src="'+escapeHtml(friend.avatar)+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' : '👤'}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:15px;">
                        ${escapeHtml(friend.nickname)}
                        <span style="font-size:12px;font-weight:400;color:var(--text-secondary);">#${friend.id}</span>
                    </div>
                    <!-- TODO: US-025 备注功能，预留显示位置 -->
                    <div style="font-size:12px;color:var(--text-secondary);display:flex;gap:12px;margin-top:2px;flex-wrap:wrap;">
                        <span>📅 好友于 ${friendSince}</span>
                        <!-- TODO: US-025 分组标签，预留 -->
                        <!-- <span class="group-tag">默认分组</span> -->
                    </div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0;">
                    <!-- TODO: US-025 备注功能，预留按钮 -->
                    <!-- <button class="btn btn-outline btn-sm note-btn" data-id="${friend.id}" style="width:auto;padding:4px 10px;font-size:12px;">✏️ 备注</button> -->
                    <!-- TODO: US-025 分组功能，预留按钮 -->
                    <!-- <button class="btn btn-outline btn-sm group-btn" data-id="${friend.id}" style="width:auto;padding:4px 10px;font-size:12px;">📁 分组</button> -->
                    <button class="btn btn-danger btn-sm delete-friend-btn" data-id="${friend.id}" data-name="${escapeHtml(friend.nickname)}" style="width:auto;padding:4px 12px;font-size:12px;">✕ 删除</button>
                </div>
            </div>`;
        }).join('');

        container.innerHTML = html;

        // 绑定删除好友事件（US-025）
        container.querySelectorAll('.delete-friend-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.dataset.id);
                var name = this.dataset.name;
                self.deleteFriend(id, name);
            });
        });

        // TODO: US-025 备注功能，绑定事件
        // container.querySelectorAll('.note-btn').forEach(function(btn) {
        //     btn.addEventListener('click', function() { ... });
        // });

        // TODO: US-025 分组功能，绑定事件
        // container.querySelectorAll('.group-btn').forEach(function(btn) {
        //     btn.addEventListener('click', function() { ... });
        // });
    },

    // ========== 搜索好友过滤（US-025） ==========
    filterFriends: function(keyword) {
        if (!keyword.trim()) {
            this.renderFriends(this.friendList);
            return;
        }
        var filtered = this.friendList.filter(function(f) {
            return f.nickname && f.nickname.includes(keyword.trim());
        });
        this.renderFriends(filtered);
    },

    // ========== 删除好友（US-025） ==========
    deleteFriend: function(friendId, friendName) {
        if (!confirm('确定要删除好友 "' + friendName + '" 吗？')) {
            return;
        }

        var self = this;
        // 禁用按钮防止重复点击
        var btns = document.querySelectorAll('.delete-friend-btn[data-id="' + friendId + '"]');
        btns.forEach(function(b) { b.disabled = true; b.textContent = '⏳'; });

        api('/friends/' + friendId, { method: 'DELETE' })
            .then(function() {
                toast('已删除好友');
                // 从列表中移除
                self.friendList = self.friendList.filter(function(f) { return f.id !== friendId; });
                self.renderFriends(self.friendList);
            })
            .catch(function(err) {
                toast(err.message, 'error');
                btns.forEach(function(b) { b.disabled = false; b.textContent = '✕ 删除'; });
            });
    },

    // ========== 加载好友请求（US-024） ==========
    loadRequests: async function() {
        var container = document.getElementById('requestList');
        var sentContainer = document.getElementById('sentRequestList');

        try {
            // 获取收到的请求
            var res = await api('/friends/requests/pending', { method: 'GET' });
            var requests = res.data || [];

            // 更新徽章
            var badge = document.getElementById('requestBadge');
            if (requests.length > 0) {
                badge.style.display = 'inline';
                badge.textContent = requests.length;
            } else {
                badge.style.display = 'none';
            }

            if (requests.length === 0) {
                container.innerHTML = `
                    <div class="card" style="text-align:center;padding:30px;color:var(--text-secondary);">
                        <p style="font-size:32px;">📭</p>
                        <p>暂无好友请求</p>
                    </div>`;
            } else {
                var html = requests.map(function(req) {
                    return `
                    <div class="card" style="margin-bottom:8px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
                        <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-light, #e8e0f0);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;color:var(--primary);">👤</div>
                        <div style="flex:1;min-width:0;">
                            <!-- TODO: 显示请求者的昵称和头像，需要后端返回用户详细信息 -->
                            <div style="font-weight:600;font-size:14px;">用户 #${req.fromUserId}</div>
                            <div style="font-size:12px;color:var(--text-secondary);">📅 ${req.createdAt ? new Date(req.createdAt).toLocaleString('zh-CN') : '未知'}</div>
                        </div>
                        <div style="display:flex;gap:6px;flex-shrink:0;">
                            <button class="btn btn-primary btn-sm accept-request-btn" data-id="${req.id}" style="width:auto;padding:4px 14px;font-size:12px;">接受</button>
                            <button class="btn btn-danger btn-sm reject-request-btn" data-id="${req.id}" style="width:auto;padding:4px 14px;font-size:12px;">拒绝</button>
                        </div>
                    </div>`;
                }).join('');
                container.innerHTML = html;

                // 绑定接受/拒绝事件（US-024）
                container.querySelectorAll('.accept-request-btn').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        var id = parseInt(this.dataset.id);
                        self.handleRequest(id, 'accept');
                    });
                });
                container.querySelectorAll('.reject-request-btn').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        var id = parseInt(this.dataset.id);
                        self.handleRequest(id, 'reject');
                    });
                });
            }

            // 获取已发送的请求
            var sentRes = await api('/friends/requests/sent', { method: 'GET' });
            var sentRequests = sentRes.data || [];

            if (sentRequests.length === 0) {
                sentContainer.innerHTML = `
                    <div class="card" style="text-align:center;padding:20px;color:var(--text-secondary);font-size:14px;">
                        暂无已发送的请求
                    </div>`;
            } else {
                var sentHtml = sentRequests.map(function(req) {
                    return `
                    <div class="card" style="margin-bottom:6px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <!-- TODO: 显示接收者的昵称，需要后端返回用户详细信息 -->
                            <span style="font-weight:500;">→ 用户 #${req.toUserId}</span>
                            <span style="font-size:12px;color:var(--text-secondary);margin-left:8px;">${req.createdAt ? new Date(req.createdAt).toLocaleString('zh-CN') : ''}</span>
                        </div>
                        <span style="font-size:12px;color:var(--text-secondary);">⏳ 等待处理</span>
                    </div>`;
                }).join('');
                sentContainer.innerHTML = sentHtml;
            }

        } catch (err) {
            container.innerHTML = '<p style="text-align:center;color:var(--danger);padding:16px;">加载失败: ' + escapeHtml(err.message) + '</p>';
        }
    },

    // ========== 处理好友请求：接受/拒绝（US-024） ==========
    handleRequest: async function(requestId, action) {
        var self = this;
        // 禁用按钮防止重复点击
        var btns = document.querySelectorAll('.accept-request-btn[data-id="' + requestId + '"], .reject-request-btn[data-id="' + requestId + '"]');
        btns.forEach(function(b) { b.disabled = true; b.textContent = '⏳'; });

        try {
            var res = await api('/friends/' + requestId, {
                method: 'PUT',
                body: { status: action }
            });
            toast(action === 'accept' ? '✅ 已接受好友请求' : '已拒绝好友请求');
            // 刷新请求列表和好友列表
            this.loadRequests();
            this.loadFriends();
        } catch (err) {
            toast(err.message, 'error');
            btns.forEach(function(b) { b.disabled = false; b.textContent = action === 'accept' ? '接受' : '拒绝'; });
        }
    },

    // ========== 搜索用户（US-024） ==========
    searchUser: async function() {
        var input = document.getElementById('searchUserInput');
        var keyword = input.value.trim();
        var container = document.getElementById('searchResult');

        if (!keyword) {
            toast('请输入用户ID或昵称', 'error');
            return;
        }

        container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);"><span class="spinner"></span> 搜索中...</p>';

        try {
            // TODO: 替换为实际的用户搜索接口
            // 需要后端提供 /users/search 接口，返回包含 id, nickname, avatar, bio 的用户列表
            var res = await api('/users/search?keyword=' + encodeURIComponent(keyword), { method: 'GET' });
            var users = res.data || [];

            if (users.length === 0) {
                container.innerHTML = `
                    <div class="card" style="text-align:center;padding:30px;color:var(--text-secondary);">
                        <p style="font-size:32px;">🔍</p>
                        <p>未找到用户</p>
                        <p style="font-size:13px;">请检查输入的ID或昵称是否正确</p>
                    </div>`;
                return;
            }

            this.renderSearchResults(users);

        } catch (err) {
            // TODO: 如果搜索接口不存在，使用降级方案或提示
            container.innerHTML = `
                <div class="card" style="text-align:center;padding:30px;color:var(--text-secondary);">
                    <p style="font-size:32px;">⚠️</p>
                    <p>搜索功能需要后端支持</p>
                    <p style="font-size:13px;">请确保 /users/search 接口已实现</p>
                    <p style="font-size:12px;margin-top:8px;color:var(--danger);">错误: ${escapeHtml(err.message)}</p>
                </div>`;
        }
    },

    renderSearchResults: function(users) {
        var container = document.getElementById('searchResult');
        var self = this;
        var friendIds = this.friendList.map(function(f) { return f.id; });
        var currentUserId = getCurUser ? getCurUser().id : null;

        var html = users.map(function(user) {
            var isFriend = friendIds.indexOf(user.id) !== -1;
            var isSelf = user.id === currentUserId;

            var buttonHtml = '';
            if (isSelf) {
                buttonHtml = '<span style="font-size:13px;color:var(--text-secondary);">👤 自己</span>';
            } else if (isFriend) {
                buttonHtml = '<span style="font-size:13px;color:var(--text-secondary);">✅ 已是好友</span>';
            } else {
                buttonHtml = `
                    <button class="btn btn-primary btn-sm add-friend-btn" data-id="${user.id}" data-name="${escapeHtml(user.nickname)}" style="width:auto;padding:4px 14px;font-size:12px;">➕ 添加好友</button>`;
            }

            return `
            <div class="card" style="margin-bottom:8px;padding:12px 16px;display:flex;align-items:center;gap:12px;">
                <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-light, #e8e0f0);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;color:var(--primary);">
                    ${user.avatar ? '<img src="'+escapeHtml(user.avatar)+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' : '👤'}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:14px;">${escapeHtml(user.nickname)} <span style="font-size:12px;font-weight:400;color:var(--text-secondary);">#${user.id}</span></div>
                    <div style="font-size:12px;color:var(--text-secondary);">${escapeHtml(user.bio || '这个人很懒，什么都没写')}</div>
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0;flex-wrap:wrap;">
                    ${buttonHtml}
                </div>
            </div>`;
        }).join('');

        container.innerHTML = html;

        // 绑定添加好友事件（US-024）
        container.querySelectorAll('.add-friend-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.dataset.id);
                var name = this.dataset.name;
                self.sendFriendRequest(id, name);
            });
        });
    },

    // ========== 发送好友请求（US-024） ==========
    sendFriendRequest: function(userId, userName) {
        if (!confirm('确定要向 "' + userName + '" 发送好友请求吗？')) {
            return;
        }

        var self = this;
        var btns = document.querySelectorAll('.add-friend-btn[data-id="' + userId + '"]');
        btns.forEach(function(b) { b.disabled = true; b.textContent = '⏳'; });

        api('/friends', {
            method: 'POST',
            body: { userId: userId }
        })
        .then(function(res) {
            toast('✅ 好友请求已发送');
            // 更新按钮状态
            btns.forEach(function(b) {
                b.disabled = true;
                b.textContent = '已发送';
                b.className = 'btn btn-outline btn-sm';
            });
            // 刷新好友列表（以便后续显示状态变化）
            self.loadFriends();
        })
        .catch(function(err) {
            toast(err.message, 'error');
            btns.forEach(function(b) { b.disabled = false; b.textContent = '➕ 添加好友'; });
        });
    },

    destroy: function() {
        // 清理定时器或事件监听
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }
    }
});

// ========== HTML 转义工具 ==========
function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}