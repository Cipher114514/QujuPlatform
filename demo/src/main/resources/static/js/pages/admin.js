// ====== 管理员后台 ======
Router.register('/admin', {
    title: '管理员后台',
    requireAuth: true,

    render: function() {
        var user = getCurUser();
        if (!user || user.role !== 'admin') {
            return '<div class="container" style="text-align:center;padding:60px;"><p style="font-size:48px;">🚫</p><h2>权限不足</h2><p style="color:var(--text-secondary);">仅限管理员访问</p></div>';
        }
        return `
        <div class="home-content">
            <div class="welcome-card">
                <h2>管理员后台</h2>
                <p>用户管理 | 商家审批 | 活动管理</p>
            </div>

            <!-- 统计面板 -->
            <div id="adminStats" style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
                <div class="card stat-card" style="flex:1;min-width:130px;text-align:center;padding:16px;">
                    <div style="font-size:28px;font-weight:700;color:var(--primary);">-</div>
                    <div style="font-size:13px;color:var(--text-secondary);">总用户</div>
                </div>
                <div class="card stat-card" style="flex:1;min-width:130px;text-align:center;padding:16px;">
                    <div style="font-size:28px;font-weight:700;color:#10b981;">-</div>
                    <div style="font-size:13px;color:var(--text-secondary);">活跃用户</div>
                </div>
                <div class="card stat-card" style="flex:1;min-width:130px;text-align:center;padding:16px;">
                    <div style="font-size:28px;font-weight:700;color:#f59e0b;">-</div>
                    <div style="font-size:13px;color:var(--text-secondary);">待审商家</div>
                </div>
                <div class="card stat-card" style="flex:1;min-width:130px;text-align:center;padding:16px;">
                    <div style="font-size:28px;font-weight:700;color:var(--danger);">-</div>
                    <div style="font-size:13px;color:var(--text-secondary);">封禁用户</div>
                </div>
                <div class="card stat-card" style="flex:1;min-width:130px;text-align:center;padding:16px;">
                    <div style="font-size:28px;font-weight:700;color:var(--primary);">-</div>
                    <div style="font-size:13px;color:var(--text-secondary);">活动总数</div>
                </div>
            </div>

            <!-- Tab -->
            <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm admin-tab-btn active" data-tab="users">👥 用户管理</button>
                <button class="btn btn-outline btn-sm admin-tab-btn" data-tab="business">🏪 商家审批 <span id="pendingBadge" style="display:none;background:#f59e0b;color:#fff;border-radius:50%;padding:0 6px;font-size:11px;margin-left:4px;">0</span></button>
                <button class="btn btn-outline btn-sm admin-tab-btn" data-tab="activities">📋 活动管理</button>
            </div>

            <!-- 用户管理 -->
            <div id="tabUsers" class="admin-tab-content">
                <div class="card" style="margin-bottom:12px;padding:12px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                    <input type="text" id="userSearchInput" placeholder="搜索昵称或邮箱..." style="flex:1;min-width:160px;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;background:var(--bg);color:var(--text);">
                    <select id="userRoleFilter" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);">
                        <option value="">全部角色</option><option value="USER">个人用户</option><option value="BUSINESS">商家</option><option value="ADMIN">管理员</option>
                    </select>
                    <select id="userStatusFilter" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);">
                        <option value="">全部状态</option><option value="ACTIVE">正常</option><option value="PENDING">待审批</option><option value="BANNED">已封禁</option>
                    </select>
                    <button class="btn btn-primary btn-sm" id="userSearchBtn">搜索</button>
                </div>
                <div id="userList"><p style="text-align:center;padding:20px;color:var(--text-secondary);">点击搜索查看用户</p></div>
                <div id="userPagination" style="text-align:center;margin-top:12px;"></div>
            </div>

            <!-- 商家审批 -->
            <div id="tabBusiness" class="admin-tab-content" style="display:none;">
                <div id="businessList"><p style="text-align:center;padding:40px;color:var(--text-secondary);"><span class="spinner"></span> 加载中...</p></div>
            </div>

            <!-- 活动管理 -->
            <div id="tabActivities" class="admin-tab-content" style="display:none;">
                <div id="activityAdminList"><p style="text-align:center;padding:40px;color:var(--text-secondary);"><span class="spinner"></span> 加载中...</p></div>
                <div id="activityAdminPagination" style="text-align:center;margin-top:12px;"></div>
            </div>
        </div>`;
    },

    init: function() {
        var self = this;
        if (!getCurUser() || getCurUser().role !== 'admin') return;

        self.currentTab = 'users';
        self.userPage = 0;
        self.activityPage = 0;

        // Tab 切换
        document.querySelectorAll('.admin-tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var tab = this.dataset.tab;
                self.switchTab(tab);
            });
        });

        // 搜索按钮
        document.getElementById('userSearchBtn').addEventListener('click', function() {
            self.userPage = 0;
            self.loadUsers();
        });
        document.getElementById('userSearchInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { self.userPage = 0; self.loadUsers(); }
        });

        // 加载初始数据
        this.loadStats();
        this.loadUsers();
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.admin-tab-btn').forEach(function(btn) {
            btn.className = 'btn btn-outline btn-sm admin-tab-btn';
            if (btn.dataset.tab === tab) btn.className = 'btn btn-primary btn-sm admin-tab-btn active';
        });
        document.querySelectorAll('.admin-tab-content').forEach(function(el) { el.style.display = 'none'; });
        document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).style.display = 'block';

        if (tab === 'business') this.loadPendingBusinesses();
        if (tab === 'activities') this.loadActivities();
    },

    // ========== 统计 ==========
    loadStats: async function() {
        try {
            var res = await api('/admin/stats');
            var d = res.data;
            var cards = document.querySelectorAll('.stat-card');
            if (cards.length >= 5 && d) {
                cards[0].querySelector('div:first-child').textContent = d.totalUsers || 0;
                cards[1].querySelector('div:first-child').textContent = d.activeUsers || 0;
                cards[2].querySelector('div:first-child').textContent = d.pendingBusinesses || 0;
                cards[3].querySelector('div:first-child').textContent = d.bannedUsers || 0;
                cards[4].querySelector('div:first-child').textContent = d.totalActivities || 0;
            }
            var badge = document.getElementById('pendingBadge');
            if (d && d.pendingBusinesses > 0) {
                badge.style.display = 'inline';
                badge.textContent = d.pendingBusinesses;
            }
        } catch (err) {
            console.error('加载统计失败', err);
        }
    },

    // ========== 用户管理 ==========
    loadUsers: async function() {
        var self = this;
        var container = document.getElementById('userList');
        container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);"><span class="spinner"></span> 加载中...</p>';

        var keyword = document.getElementById('userSearchInput').value.trim();
        var role = document.getElementById('userRoleFilter').value;
        var status = document.getElementById('userStatusFilter').value;

        try {
            var params = '?page=' + self.userPage + '&size=15';
            if (keyword) params += '&keyword=' + encodeURIComponent(keyword);
            if (role) params += '&role=' + role;
            if (status) params += '&status=' + status;

            var res = await api('/admin/users' + params);
            var page = res.data;
            self.renderUsers(page.content || []);
            self.renderUserPagination(page);
        } catch (err) {
            container.innerHTML = '<p style="text-align:center;color:var(--danger);padding:16px;">加载失败: ' + escapeHtml(err.message) + '</p>';
        }
    },

    renderUsers: function(users) {
        var self = this;
        var container = document.getElementById('userList');
        if (!users || users.length === 0) {
            container.innerHTML = '<div class="card" style="text-align:center;padding:30px;color:var(--text-secondary);">无匹配用户</div>';
            return;
        }

        var statusLabel = { ACTIVE: '✅ 正常', PENDING: '⏳ 待审批', BANNED: '🚫 已封禁' };
        var roleLabel = { USER: '个人', BUSINESS: '商家', ADMIN: '管理员' };

        container.innerHTML = users.map(function(u) {
            var statusText = statusLabel[u.status] || u.status;
            var roleText = roleLabel[u.role] || u.role;
            var isAdmin = u.role === 'admin';
            var isBanned = u.status === 'BANNED';

            var actionBtns = '';
            if (!isAdmin) {
                if (isBanned) {
                    actionBtns = '<button class="btn btn-success btn-sm unban-btn" data-id="' + u.id + '" style="padding:2px 10px;font-size:12px;">解封</button>';
                } else {
                    actionBtns = '<button class="btn btn-warning btn-sm ban-btn" data-id="' + u.id + '" data-name="' + escapeHtml(u.nickname) + '" style="padding:2px 10px;font-size:12px;background:#f59e0b;color:#fff;border:none;">封禁</button>';
                }
                actionBtns += ' <button class="btn btn-outline btn-sm role-btn" data-id="' + u.id + '" data-role="' + u.role + '" style="padding:2px 10px;font-size:12px;">改角色</button>';
            }

            return '<div class="card" style="margin-bottom:6px;padding:10px 14px;display:flex;align-items:center;gap:10px;font-size:14px;">' +
                '<div style="width:36px;height:36px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;color:var(--primary);">' + (u.avatar ? '<img src="' + escapeHtml(u.avatar) + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' : '👤') + '</div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div><b>' + escapeHtml(u.nickname) + '</b> <span style="font-size:11px;color:var(--text-secondary);">#' + u.id + '</span></div>' +
                    '<div style="font-size:12px;color:var(--text-secondary);">' + escapeHtml(u.email) + (u.phone ? ' | ' + u.phone : '') + '</div>' +
                    '<div style="font-size:11px;margin-top:2px;">' +
                        '<span class="role-badge ' + u.role.toLowerCase() + '" style="padding:1px 6px;border-radius:4px;font-size:11px;">' + roleText + '</span> ' +
                        '<span style="color:var(--text-secondary);">' + statusText + '</span>' +
                        (u.banReason ? ' <span style="color:var(--danger);font-size:11px;">原因: ' + escapeHtml(u.banReason) + '</span>' : '') +
                        (u.banUntil ? ' <span style="color:var(--danger);font-size:11px;">至 ' + new Date(u.banUntil).toLocaleString('zh-CN') + '</span>' : '') +
                    '</div>' +
                '</div>' +
                '<div style="display:flex;gap:4px;flex-shrink:0;">' + actionBtns + '</div>' +
                '</div>';
        }).join('');

        // 绑定封禁按钮
        container.querySelectorAll('.ban-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.dataset.id);
                var name = this.dataset.name;
                self.showBanDialog(id, name);
            });
        });
        // 绑定解封按钮
        container.querySelectorAll('.unban-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                self.unbanUser(parseInt(this.dataset.id));
            });
        });
        // 绑定改角色按钮
        container.querySelectorAll('.role-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                self.showRoleDialog(parseInt(this.dataset.id), this.dataset.role);
            });
        });
    },

    renderUserPagination: function(page) {
        var container = document.getElementById('userPagination');
        if (!page || page.totalPages <= 1) { container.innerHTML = ''; return; }
        var self = this;
        var html = '<button class="btn btn-outline btn-sm" ' + (page.number === 0 ? 'disabled' : '') + ' data-p="' + (page.number - 1) + '">上一页</button> ';
        html += '<span style="font-size:13px;color:var(--text-secondary);">' + (page.number + 1) + ' / ' + page.totalPages + '</span> ';
        html += '<button class="btn btn-outline btn-sm" ' + (page.number >= page.totalPages - 1 ? 'disabled' : '') + ' data-p="' + (page.number + 1) + '">下一页</button>';
        container.innerHTML = html;
        container.querySelectorAll('button').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (this.disabled) return;
                self.userPage = parseInt(this.dataset.p);
                self.loadUsers();
                window.scrollTo(0, 0);
            });
        });
    },

    showBanDialog: function(userId, name) {
        var reason = prompt('请输入封禁原因（必填）:');
        if (!reason || !reason.trim()) return toast('封禁原因不能为空', 'error');
        var daysStr = prompt('封禁天数（留空=永久封禁，输入数字如7表示封禁7天）:');
        var banUntil = null;
        if (daysStr && daysStr.trim()) {
            var days = parseInt(daysStr);
            if (!isNaN(days) && days > 0) {
                banUntil = new Date(Date.now() + days * 86400000).toISOString().slice(0, 19);
            }
        }

        var self = this;
        api('/admin/users/' + userId + '/ban', {
            method: 'PUT',
            body: { reason: reason.trim(), banUntil: banUntil }
        }).then(function() {
            toast('已封禁用户 ' + name);
            self.loadUsers();
            self.loadStats();
        }).catch(function(err) {
            toast(err.message, 'error');
        });
    },

    unbanUser: function(userId) {
        if (!confirm('确定要解封此用户吗？')) return;
        var self = this;
        api('/admin/users/' + userId + '/unban', { method: 'PUT' })
            .then(function() {
                toast('已解封用户');
                self.loadUsers();
                self.loadStats();
            })
            .catch(function(err) { toast(err.message, 'error'); });
    },

    showRoleDialog: function(userId, currentRole) {
        var newRole = prompt('当前角色: ' + currentRole + '\n输入新角色 (USER / BUSINESS / ADMIN):', currentRole);
        if (!newRole || !newRole.trim()) return;
        newRole = newRole.trim().toUpperCase();
        if (['USER', 'BUSINESS', 'ADMIN'].indexOf(newRole) === -1) return toast('无效角色', 'error');

        var self = this;
        api('/admin/users/' + userId + '/role', {
            method: 'PUT',
            body: { role: newRole }
        }).then(function() {
            toast('角色已更新');
            self.loadUsers();
        }).catch(function(err) { toast(err.message, 'error'); });
    },

    // ========== 商家审批 ==========
    loadPendingBusinesses: async function() {
        var container = document.getElementById('businessList');
        var self = this;
        try {
            var res = await api('/admin/businesses/pending?size=50');
            var page = res.data;
            var businesses = page.content || [];
            if (businesses.length === 0) {
                container.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text-secondary);"><p style="font-size:32px;">📭</p><p>暂无待审批商家</p></div>';
                return;
            }
            container.innerHTML = businesses.map(function(b) {
                return '<div class="card" style="margin-bottom:8px;padding:14px 16px;display:flex;align-items:center;gap:12px;">' +
                    '<div style="width:40px;height:40px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;color:var(--primary);">🏪</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div><b>' + escapeHtml(b.nickname) + '</b> <span style="font-size:11px;color:var(--text-secondary);">#' + b.id + '</span></div>' +
                        '<div style="font-size:12px;color:var(--text-secondary);">' + escapeHtml(b.email) + (b.phone ? ' | ' + b.phone : '') + '</div>' +
                        '<div style="font-size:11px;color:var(--text-secondary);">' +
                            (b.address ? '地址: ' + escapeHtml(b.address) : '') +
                            (b.businessFields ? ' | 领域: ' + escapeHtml(b.businessFields) : '') +
                        '</div>' +
                        (b.businessLicense ? '<div style="font-size:11px;margin-top:2px;">营业执照: <a href="/' + escapeHtml(b.businessLicense).replace(/^\/+/, '') + '" target="_blank" style="color:var(--primary);">查看</a></div>' : '') +
                    '</div>' +
                    '<div style="display:flex;gap:6px;flex-shrink:0;">' +
                        '<button class="btn btn-primary btn-sm approve-btn" data-id="' + b.id + '" style="padding:4px 14px;font-size:12px;">通过</button>' +
                        '<button class="btn btn-danger btn-sm reject-btn" data-id="' + b.id + '" style="padding:4px 14px;font-size:12px;">拒绝</button>' +
                    '</div>' +
                '</div>';
            }).join('');

            container.querySelectorAll('.approve-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    self.approveBusiness(parseInt(this.dataset.id));
                });
            });
            container.querySelectorAll('.reject-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    self.rejectBusiness(parseInt(this.dataset.id));
                });
            });
        } catch (err) {
            container.innerHTML = '<p style="text-align:center;color:var(--danger);padding:16px;">加载失败: ' + escapeHtml(err.message) + '</p>';
        }
    },

    approveBusiness: function(userId) {
        if (!confirm('确定审批通过此商家吗？')) return;
        var self = this;
        api('/admin/businesses/' + userId + '/approve', { method: 'PUT' })
            .then(function() {
                toast('商家已审批通过');
                self.loadPendingBusinesses();
                self.loadStats();
            })
            .catch(function(err) { toast(err.message, 'error'); });
    },

    rejectBusiness: function(userId) {
        if (!confirm('确定拒绝此商家注册吗？此操作会删除该账号，不可撤销。')) return;
        var self = this;
        api('/admin/businesses/' + userId, { method: 'DELETE' })
            .then(function() {
                toast('已拒绝并删除');
                self.loadPendingBusinesses();
                self.loadStats();
            })
            .catch(function(err) { toast(err.message, 'error'); });
    },

    // ========== 活动管理 ==========
    loadActivities: async function() {
        var self = this;
        var container = document.getElementById('activityAdminList');
        container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);"><span class="spinner"></span> 加载中...</p>';
        try {
            var res = await api('/admin/activities?page=' + self.activityPage + '&size=15');
            var page = res.data;
            var activities = page.content || [];
            if (activities.length === 0) {
                container.innerHTML = '<div class="card" style="text-align:center;padding:30px;color:var(--text-secondary);">暂无活动</div>';
                return;
            }
            var statusStyle = { ACTIVE: 'color:#10b981;', CANCELLED: 'color:var(--danger);' };
            container.innerHTML = activities.map(function(a) {
                var st = statusStyle[a.status] || '';
                return '<div class="card" style="margin-bottom:6px;padding:10px 14px;display:flex;align-items:center;gap:10px;font-size:14px;">' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div><b>' + escapeHtml(a.title) + '</b> <span style="font-size:11px;color:var(--text-secondary);">#' + a.id + '</span></div>' +
                        '<div style="font-size:12px;color:var(--text-secondary);">' + (a.category || '') + ' | ' + (a.location || '') + ' | ' + a.currentParticipants + '/' + a.maxParticipants + '人</div>' +
                        '<div style="font-size:11px;margin-top:2px;"><span style="' + st + '">' + a.status + '</span> | 创建者ID: ' + a.creatorId + '</div>' +
                    '</div>' +
                    '<div style="display:flex;gap:4px;flex-shrink:0;">' +
                        (a.status === 'ACTIVE' ? '<button class="btn btn-warning btn-sm cancel-act-btn" data-id="' + a.id + '" style="padding:2px 10px;font-size:12px;background:#f59e0b;color:#fff;border:none;">下架</button>' : '') +
                        '<button class="btn btn-danger btn-sm del-act-btn" data-id="' + a.id + '" style="padding:2px 10px;font-size:12px;">删除</button>' +
                    '</div>' +
                '</div>';
            }).join('');

            container.querySelectorAll('.cancel-act-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    self.cancelActivity(parseInt(this.dataset.id));
                });
            });
            container.querySelectorAll('.del-act-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    self.deleteActivity(parseInt(this.dataset.id));
                });
            });

            // 分页
            var pgContainer = document.getElementById('activityAdminPagination');
            if (page.totalPages > 1) {
                var html = '<button class="btn btn-outline btn-sm" ' + (page.number === 0 ? 'disabled' : '') + ' data-ap="' + (page.number - 1) + '">上一页</button> ';
                html += '<span style="font-size:13px;color:var(--text-secondary);">' + (page.number + 1) + ' / ' + page.totalPages + '</span> ';
                html += '<button class="btn btn-outline btn-sm" ' + (page.number >= page.totalPages - 1 ? 'disabled' : '') + ' data-ap="' + (page.number + 1) + '">下一页</button>';
                pgContainer.innerHTML = html;
                pgContainer.querySelectorAll('button').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        if (this.disabled) return;
                        self.activityPage = parseInt(this.dataset.ap);
                        self.loadActivities();
                    });
                });
            } else {
                pgContainer.innerHTML = '';
            }
        } catch (err) {
            container.innerHTML = '<p style="text-align:center;color:var(--danger);padding:16px;">加载失败: ' + escapeHtml(err.message) + '</p>';
        }
    },

    cancelActivity: function(activityId) {
        if (!confirm('确定下架此活动吗？')) return;
        var self = this;
        api('/admin/activities/' + activityId + '/cancel', { method: 'PUT' })
            .then(function() {
                toast('活动已下架');
                self.loadActivities();
                self.loadStats();
            })
            .catch(function(err) { toast(err.message, 'error'); });
    },

    deleteActivity: function(activityId) {
        if (!confirm('确定永久删除此活动吗？此操作不可撤销！')) return;
        var self = this;
        api('/admin/activities/' + activityId, { method: 'DELETE' })
            .then(function() {
                toast('活动已删除');
                self.loadActivities();
                self.loadStats();
            })
            .catch(function(err) { toast(err.message, 'error'); });
    },

    destroy: function() {}
});

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
