// ====== 好友管理页 ======
// 任务范围：US-024 添加好友（搜索用户，发送/同意/拒绝好友申请）
//          US-025 管理好友（好友列表，删除好友）
//          US-026 黑名单与备注分组（拉黑/取消拉黑，备注，分组）
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
                <button class="btn btn-outline btn-sm tab-btn" data-tab="blocklist">🚫 黑名单</button>
            </div>

            <!-- ====== Tab: 好友列表 ====== -->
            <div id="tabFriends" class="tab-content">
                <div class="card" style="margin-bottom:12px;padding:12px 16px;">
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                        <input type="text" id="friendSearch" placeholder="🔍 搜索好友..." style="flex:1;min-width:150px;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none;background:var(--bg);color:var(--text);">
                        <select id="groupFilter" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg);color:var(--text);outline:none;">
                            <option value="">📂 全部分组</option>
                        </select>
                        <button class="btn btn-outline btn-sm" id="refreshGroupsBtn" style="font-size:12px;padding:4px 10px;">🔄</button>
                    </div>
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

            <!-- ====== Tab: 黑名单 ====== -->
            <div id="tabBlocklist" class="tab-content" style="display:none;">
                <div id="blockListContainer">
                    <p style="text-align:center;padding:40px;color:var(--text-secondary);">
                        <span class="spinner" style="border-color:rgba(0,0,0,.15);border-top-color:var(--primary);display:inline-block;width:20px;height:20px;"></span> 加载中...
                    </p>
                </div>
            </div>
        </div>`;
    },

    init: function() {
        var self = this;
        self.currentTab = 'friends';
        self.friendList = [];
        self.allGroups = [];

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

        // 分组筛选
        document.getElementById('groupFilter').addEventListener('change', function() {
            self.filterByGroup(this.value);
        });

        // 刷新分组列表
        document.getElementById('refreshGroupsBtn').addEventListener('click', function() {
            self.loadGroups();
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
        this.loadGroups();
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
        if (tab === 'blocklist') {
            this.loadBlockList();
        }
    },

    // ========== 加载分组列表 ==========
    loadGroups: async function() {
        try {
            var res = await api('/friends/groups', { method: 'GET' });
            this.allGroups = res.data || [];
            this.renderGroupFilter(this.allGroups);
        } catch (err) {
            console.warn('加载分组失败:', err);
        }
    },

    renderGroupFilter: function(groups) {
        var select = document.getElementById('groupFilter');
        var currentValue = select.value;
        select.innerHTML = '<option value="">📂 全部分组</option>';
        groups.forEach(function(g) {
            var selected = g === currentValue ? 'selected' : '';
            select.innerHTML += `<option value="${escapeHtml(g)}" ${selected}>🏷️ ${escapeHtml(g)}</option>`;
        });
    },

    // ========== 按分组筛选 ==========
    filterByGroup: function(group) {
        if (!group) {
            this.renderFriends(this.friendList);
            return;
        }
        var filtered = this.friendList.filter(function(f) {
            return f.group === group;
        });
        this.renderFriends(filtered);
    },

    // ========== 加载好友列表 ==========
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
        var self = this;
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
            var remarkDisplay = friend.remark ? `<span style="font-size:12px;color:var(--text-secondary);">📝 ${escapeHtml(friend.remark)}</span>` : '';
            var groupDisplay = friend.group ? `<span style="background:var(--primary-light, #e8e0f0);padding:0 8px;border-radius:4px;font-size:11px;color:var(--primary);">${escapeHtml(friend.group)}</span>` : '';
            var blockedBadge = friend.isBlocked ? '<span style="margin-left:6px;font-size:11px;background:var(--danger);color:#fff;padding:1px 6px;border-radius:4px;">已拉黑</span>' : '';

            return `
            <div class="card friend-item" style="margin-bottom:8px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
                <div style="width:44px;height:44px;border-radius:50%;background:var(--primary-light, #e8e0f0);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;color:var(--primary);">
                    ${friend.avatar ? '<img src="'+escapeHtml(friend.avatar)+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' : '👤'}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:15px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
                        ${escapeHtml(friend.nickname)}
                        <span style="font-size:12px;font-weight:400;color:var(--text-secondary);">#${friend.id}</span>
                        ${blockedBadge}
                    </div>
                    <div style="font-size:12px;color:var(--text-secondary);display:flex;gap:8px;margin-top:2px;flex-wrap:wrap;align-items:center;">
                        <span>📅 ${friendSince}</span>
                        ${remarkDisplay}
                        ${groupDisplay}
                    </div>
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0;flex-wrap:wrap;">
                    <button class="btn btn-primary btn-sm chat-friend-btn" data-id="${friend.id}" style="width:auto;padding:4px 8px;font-size:11px;" title="发送消息">💬</button>
                    <button class="btn btn-outline btn-sm remark-friend-btn" data-id="${friend.id}" style="width:auto;padding:4px 8px;font-size:11px;" title="设置备注">✏️</button>
                    <button class="btn btn-outline btn-sm group-friend-btn" data-id="${friend.id}" style="width:auto;padding:4px 8px;font-size:11px;" title="设置分组">🏷️</button>
                    ${friend.isBlocked 
                        ? `<button class="btn btn-primary btn-sm unblock-friend-btn" data-id="${friend.id}" data-name="${escapeHtml(friend.nickname)}" style="width:auto;padding:4px 8px;font-size:11px;" title="解除拉黑">解除拉黑</button>`
                        : `<button class="btn btn-danger btn-sm block-friend-btn" data-id="${friend.id}" data-name="${escapeHtml(friend.nickname)}" style="width:auto;padding:4px 8px;font-size:11px;" title="拉黑好友">🚫</button>`
                    }
                    <button class="btn btn-danger btn-sm delete-friend-btn" data-id="${friend.id}" data-name="${escapeHtml(friend.nickname)}" style="width:auto;padding:4px 8px;font-size:11px;" title="删除好友">✕</button>
                </div>
            </div>`;
        }).join('');

        container.innerHTML = html;

        // 绑定事件
        this.bindFriendItemEvents(container);
    },

    bindFriendItemEvents: function(container) {
        var self = this;

        // 聊天
        container.querySelectorAll('.chat-friend-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                Router.navigate('/chat/' + this.dataset.id);
            });
        });

        // 备注
        container.querySelectorAll('.remark-friend-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.dataset.id);
                var friend = self.friendList.find(function(f) { return f.id === id; });
                if (friend) {
                    self.showRemarkDialog(friend);
                }
            });
        });

        // 分组
        container.querySelectorAll('.group-friend-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.dataset.id);
                var friend = self.friendList.find(function(f) { return f.id === id; });
                if (friend) {
                    self.showGroupDialog(friend);
                }
            });
        });

        // 拉黑
        container.querySelectorAll('.block-friend-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.dataset.id);
                var name = this.dataset.name;
                self.blockFriend(id, name);
            });
        });

        // 取消拉黑
        container.querySelectorAll('.unblock-friend-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.dataset.id);
                var name = this.dataset.name;
                self.unblockFriend(id, name);
            });
        });

        // 删除
        container.querySelectorAll('.delete-friend-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.dataset.id);
                var name = this.dataset.name;
                self.deleteFriend(id, name);
            });
        });
    },

    // ========== 搜索好友过滤 ==========
    filterFriends: function(keyword) {
        var currentGroup = document.getElementById('groupFilter').value;
        var filtered = this.friendList;

        if (keyword.trim()) {
            filtered = filtered.filter(function(f) {
                return f.nickname && f.nickname.includes(keyword.trim());
            });
        }

        if (currentGroup) {
            filtered = filtered.filter(function(f) {
                return f.group === currentGroup;
            });
        }

        this.renderFriends(filtered);
    },

    // ========== 删除好友 ==========
    deleteFriend: function(friendId, friendName) {
        if (!confirm('确定要删除好友 "' + friendName + '" 吗？')) {
            return;
        }

        var self = this;
        var btns = document.querySelectorAll('.delete-friend-btn[data-id="' + friendId + '"]');
        btns.forEach(function(b) { b.disabled = true; b.textContent = '⏳'; });

        api('/friends/' + friendId, { method: 'DELETE' })
            .then(function() {
                toast('已删除好友');
                self.friendList = self.friendList.filter(function(f) { return f.id !== friendId; });
                self.renderFriends(self.friendList);
            })
            .catch(function(err) {
                toast(err.message, 'error');
                btns.forEach(function(b) { b.disabled = false; b.textContent = '✕'; });
            });
    },

    // ========== 拉黑好友 ==========
    blockFriend: function(friendId, friendName) {
        if (!confirm('确定要拉黑 "' + friendName + '" 吗？\n\n拉黑后将自动解除好友关系，对方无法向你发送好友请求。')) {
            return;
        }

        var self = this;
        var btns = document.querySelectorAll('.block-friend-btn[data-id="' + friendId + '"]');
        btns.forEach(function(b) { b.disabled = true; b.textContent = '⏳'; });

        api('/friends/block', {
            method: 'POST',
            body: { userId: friendId }
        })
        .then(function() {
            toast('✅ 已拉黑 ' + friendName);
            // 刷新列表
            self.loadFriends();
            self.loadGroups();
        })
        .catch(function(err) {
            toast(err.message, 'error');
            btns.forEach(function(b) { b.disabled = false; b.textContent = '🚫'; });
        });
    },

    // ========== 取消拉黑 ==========
    unblockFriend: function(friendId, friendName) {
        if (!confirm('确定要取消拉黑 "' + friendName + '" 吗？')) {
            return;
        }

        var self = this;
        var btns = document.querySelectorAll('.unblock-friend-btn[data-id="' + friendId + '"], .unblock-from-list-btn[data-id="' + friendId + '"]');
        btns.forEach(function(b) { b.disabled = true; b.textContent = '⏳'; });

        api('/friends/block/' + friendId, { method: 'DELETE' })
            .then(function() {
                toast('已取消拉黑 ' + friendName);
                // 刷新所有相关列表
                self.loadFriends();
                self.loadGroups();
                // 如果当前在黑名单 tab，刷新黑名单列表
                if (self.currentTab === 'blocklist') {
                    self.loadBlockList();
                }
            })
            .catch(function(err) {
                toast(err.message, 'error');
                btns.forEach(function(b) { b.disabled = false; b.textContent = '解除拉黑'; });
            });
    },

    // ========== 设置备注 ==========
    showRemarkDialog: function(friend) {
        var self = this;
        var currentRemark = friend.remark || '';
        var remark = prompt('请输入给 "' + friend.nickname + '" 的备注：', currentRemark);
        if (remark === null) return; // 取消

        api('/friends/remark', {
            method: 'PUT',
            body: { userId: friend.id, remark: remark }
        })
        .then(function() {
            toast('✅ 备注已更新');
            friend.remark = remark;
            self.renderFriends(self.friendList);
        })
        .catch(function(err) {
            toast(err.message, 'error');
        });
    },

    // ========== 设置分组 ==========
    showGroupDialog: function(friend) {
        var self = this;
        var currentGroup = friend.group || '';
        
        // 构建分组选择对话框
        var groupOptions = self.allGroups.map(function(g) {
            var selected = g === currentGroup ? 'selected' : '';
            return `<option value="${escapeHtml(g)}" ${selected}>${escapeHtml(g)}</option>`;
        }).join('');
        
        // 使用更友好的自定义对话框
        var html = `
            <div style="padding:8px 0;">
                <p style="margin-bottom:8px;font-weight:500;">设置 "${friend.nickname}" 的分组：</p>
                <input type="text" id="groupInput" placeholder="输入分组名称..." value="${escapeHtml(currentGroup)}" 
                       style="width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none;background:var(--bg);color:var(--text);margin-bottom:8px;">
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">
                    ${self.allGroups.map(function(g) {
                        return `<button class="btn btn-outline btn-sm group-quick-btn" data-group="${escapeHtml(g)}" style="font-size:12px;padding:2px 10px;">${escapeHtml(g)}</button>`;
                    }).join('')}
                </div>
                <p class="hint" style="font-size:12px;color:var(--text-secondary);">输入新分组名称创建新分组，或点击已有分组快速选择</p>
            </div>
        `;

        // 使用 prompt 的简单方式，但为了更好的体验，使用自定义弹窗
        // 这里用 prompt 简化，但支持输入新分组
        var newGroup = prompt(
            '请输入给 "' + friend.nickname + '" 的分组标签：\n\n当前分组: ' + (currentGroup || '（未分组）') + '\n\n已有分组: ' + (self.allGroups.join(', ') || '无'),
            currentGroup
        );
        
        if (newGroup === null) return;

        api('/friends/group', {
            method: 'PUT',
            body: { userId: friend.id, group: newGroup }
        })
        .then(function() {
            toast('✅ 分组已更新');
            friend.group = newGroup;
            self.renderFriends(self.friendList);
            self.loadGroups(); // 刷新分组下拉列表
        })
        .catch(function(err) {
            toast(err.message, 'error');
        });
    },

    // ========== 加载黑名单 ==========
    loadBlockList: async function() {
        var self = this;
        var container = document.getElementById('blockListContainer');
        try {
            var res = await api('/friends/block/list', { method: 'GET' });
            var list = res.data || [];
            
            if (list.length === 0) {
                container.innerHTML = `
                    <div class="card" style="text-align:center;padding:40px;color:var(--text-secondary);">
                        <p style="font-size:40px;">🚫</p>
                        <p style="font-weight:700;">暂无黑名单</p>
                        <p style="font-size:13px;margin-top:4px;">在好友列表中可以将好友拉黑</p>
                    </div>`;
                return;
            }

            var html = list.map(function(item) {
                return `
                <div class="card" style="margin-bottom:8px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
                    <div style="width:44px;height:44px;border-radius:50%;background:var(--danger-light, #fde8e8);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;color:var(--danger);">
                        ${item.avatar ? '<img src="'+escapeHtml(item.avatar)+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' : '🚫'}
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;font-size:15px;color:var(--danger);">
                            ${escapeHtml(item.nickname)}
                            <span style="font-size:12px;font-weight:400;color:var(--text-secondary);">#${item.id}</span>
                        </div>
                        <div style="font-size:12px;color:var(--text-secondary);">
                            拉黑于 ${item.friendSince ? new Date(item.friendSince).toLocaleDateString('zh-CN') : '未知'}
                        </div>
                    </div>
                    <button class="btn btn-primary btn-sm unblock-from-list-btn" data-id="${item.id}" data-name="${escapeHtml(item.nickname)}" style="width:auto;padding:4px 14px;font-size:12px;">解除拉黑</button>
                </div>`;
            }).join('');

            container.innerHTML = html;

            // 绑定解除拉黑事件
            container.querySelectorAll('.unblock-from-list-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id = parseInt(this.dataset.id);
                    var name = this.dataset.name;
                    self.unblockFriend(id, name);
                });
            });

        } catch (err) {
            container.innerHTML = '<p style="text-align:center;color:var(--danger);padding:16px;">加载失败: ' + escapeHtml(err.message) + '</p>';
        }
    },

    // ========== 加载好友请求 ==========
    loadRequests: async function() {
        var self = this;
        var container = document.getElementById('requestList');
        var sentContainer = document.getElementById('sentRequestList');

        try {
            var res = await api('/friends/requests/pending', { method: 'GET' });
            var requests = res.data || [];

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

    // ========== 处理好友请求 ==========
    handleRequest: async function(requestId, action) {
        var self = this;
        var btns = document.querySelectorAll('.accept-request-btn[data-id="' + requestId + '"], .reject-request-btn[data-id="' + requestId + '"]');
        btns.forEach(function(b) { b.disabled = true; b.textContent = '⏳'; });

        try {
            await api('/friends/' + requestId, {
                method: 'PUT',
                body: { status: action }
            });
            toast(action === 'accept' ? '✅ 已接受好友请求' : '已拒绝好友请求');
            self.loadRequests();
            self.loadFriends();
            self.loadGroups();
        } catch (err) {
            toast(err.message, 'error');
            btns.forEach(function(b) { b.disabled = false; b.textContent = action === 'accept' ? '接受' : '拒绝'; });
        }
    },

    // ========== 搜索用户 ==========
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

        container.querySelectorAll('.add-friend-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.dataset.id);
                var name = this.dataset.name;
                self.sendFriendRequest(id, name);
            });
        });
    },

    // ========== 发送好友请求 ==========
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
        .then(function() {
            toast('✅ 好友请求已发送');
            btns.forEach(function(b) {
                b.disabled = true;
                b.textContent = '已发送';
                b.className = 'btn btn-outline btn-sm';
            });
            self.loadFriends();
        })
        .catch(function(err) {
            toast(err.message, 'error');
            btns.forEach(function(b) { b.disabled = false; b.textContent = '➕ 添加好友'; });
        });
    },

    destroy: function() {
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