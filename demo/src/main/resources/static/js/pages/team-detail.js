// ====== 小队详情页（US-027/US-029） ======
// 功能：查看小队详情、加入/退出小队、查看成员列表、处理入队申请、查看队内活动
// 负责人：P5/P6

Router.register('/team/:id', {
    title: '小队详情',
    requireAuth: true,

    render: function(params) {
        return `
        <div class="team-detail-page">
            <!-- 小队信息区 -->
            <div id="teamInfo" class="team-info-section">
                <div class="loading">加载中...</div>
            </div>

            <!-- 标签页导航 -->
            <div class="team-tabs">
                <button class="tab-btn active" data-tab="members">成员列表</button>
                <button class="tab-btn" data-tab="activities" id="activitiesTab" style="display: none;">队内活动</button>
                <button class="tab-btn" data-tab="requests" id="requestsTab" style="display: none;">入队申请</button>
            </div>

            <!-- 标签内容区 -->
            <div class="tab-content">
                <div id="membersTab" class="tab-panel active">
                    <div id="membersList" class="members-list">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
                <div id="activitiesTabPanel" class="tab-panel">
                    <div id="activitiesList" class="activities-list">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
                <div id="requestsTabPanel" class="tab-panel">
                    <div id="requestsList" class="requests-list">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    init: function(params) {
        const teamId = parseInt(params.id);
        let teamData = null;
        let members = [];
        let requests = [];

        // 加载小队详情
        async function loadTeamDetail() {
            try {
                const res = await TeamAPI.detail(teamId);
                teamData = res.data;
                renderTeamInfo();
                loadMembers();

                // 成员/队长可见队内活动
                if (teamData.userRole === 'leader' || teamData.userRole === 'member') {
                    document.getElementById('activitiesTab').style.display = 'block';
                }

                // 队长显示申请列表（仅审核小队）
                if (teamData.userRole === 'leader' && !teamData.isPublic) {
                    document.getElementById('requestsTab').style.display = 'block';
                    loadRequests();
                }
            } catch (e) {
                document.getElementById('teamInfo').innerHTML =
                    '<div class="error">加载失败：' + e.message + '</div>';
            }
        }

        // 渲染小队信息
        function renderTeamInfo() {
            if (!teamData) return;

            const team = teamData;
            document.getElementById('teamInfo').innerHTML = `
                <div class="team-header">
                    <div class="team-avatar">
                        <span style="font-size: 48px;">👥</span>
                    </div>
                    <div class="team-meta-info">
                        <h1 class="team-title">
                            ${team.name}
                            ${team.isPublic
                                ? '<span class="team-type-badge public">公开小队</span>'
                                : '<span class="team-type-badge private">审核小队</span>'}
                        </h1>
                        <p class="team-description">${team.description || '暂无简介'}</p>
                        <div class="team-tags">
                            ${(team.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                        <div class="team-stats">
                            <span>👤 队长: ${team.leaderNickname || '未知'}</span>
                            <span>👥 成员: ${team.memberCount || 0}人</span>
                            <span>🕒 创建于 ${formatDate(team.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <div class="team-actions">
                    ${renderTeamActions()}
                </div>
            `;
        }

        // 渲染操作按钮
        function renderTeamActions() {
            const team = teamData;

            if (team.userRole === 'leader') {
                return `
                    <a href="#/team/${team.id}/chat" class="btn btn-primary">进入群聊</a>
                    <a href="#/team/${team.id}/create-activity" class="btn btn-outline">发布队内活动</a>
                    <button class="btn btn-outline" onclick="showRequests()">入队申请</button>
                `;
            } else if (team.userRole === 'member') {
                return `
                    <a href="#/team/${team.id}/chat" class="btn btn-primary">进入群聊</a>
                    <button class="btn btn-outline" onclick="handleLeaveTeam()">退出小队</button>
                `;
            } else if (team.requestStatus === 'pending') {
                return `
                    <button class="btn btn-secondary" disabled>等待审核</button>
                    <button class="btn btn-outline" onclick="handleLeaveTeam()">取消申请</button>
                `;
            } else if (team.requestStatus === 'rejected') {
                return `
                    <button class="btn btn-primary" onclick="showJoinRequest()">重新申请</button>
                `;
            } else if (team.isPublic) {
                return `
                    <button class="btn btn-primary" onclick="handleJoinTeam()">一键加入</button>
                `;
            } else {
                return `
                    <button class="btn btn-primary" onclick="showJoinRequest()">申请加入</button>
                `;
            }
        }

        // 加载成员列表
        async function loadMembers() {
            try {
                const res = await TeamAPI.members(teamId);
                members = res.data || [];
                renderMembers();
            } catch (e) {
                document.getElementById('membersList').innerHTML =
                    '<div class="error">加载失败：' + e.message + '</div>';
            }
        }

        // 渲染成员列表
        function renderMembers() {
            const container = document.getElementById('membersList');

            if (members.length === 0) {
                container.innerHTML = '<div class="empty-state">暂无成员</div>';
                return;
            }

            container.innerHTML = members.map(member => `
                <div class="member-item">
                    <img src="${member.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + member.userId}"
                         alt="${member.nickname}" class="member-avatar" />
                    <div class="member-info">
                        <div class="member-name-row">
                            <a href="#/follows?userId=${member.userId}" class="member-name">${member.nickname}</a>
                            ${member.role === 'leader'
                                ? '<span class="role-badge leader">队长</span>'
                                : '<span class="role-badge member">成员</span>'}
                        </div>
                        <p class="member-joined">加入于 ${formatDate(member.joinedAt)}</p>
                    </div>
                </div>
            `).join('');
        }

        // 加载入队申请（仅队长）
        async function loadRequests() {
            try {
                const res = await TeamAPI.pendingRequests(teamId);
                requests = res.data || [];
                renderRequests();
            } catch (e) {
                document.getElementById('requestsList').innerHTML =
                    '<div class="error">加载失败：' + e.message + '</div>';
            }
        }

        // 渲染入队申请
        function renderRequests() {
            const container = document.getElementById('requestsList');

            if (requests.length === 0) {
                container.innerHTML = '<div class="empty-state">暂无待处理申请</div>';
                return;
            }

            container.innerHTML = requests.map(req => `
                <div class="request-item" data-request-id="${req.id}">
                    <img src="${req.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + req.userId}"
                         alt="${req.nickname}" class="request-avatar" />
                    <div class="request-info">
                        <div class="request-name">${req.nickname}</div>
                        <p class="request-message">${req.message || '无申请留言'}</p>
                        <p class="request-time">申请于 ${formatDateTime(req.createdAt)}</p>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-primary btn-sm" onclick="handleRequest(${req.id}, 'approve')">同意</button>
                        <button class="btn btn-secondary btn-sm" onclick="handleRequest(${req.id}, 'reject')">拒绝</button>
                    </div>
                </div>
            `).join('');
        }

        // 加载队内活动
        async function loadActivities() {
            try {
                const res = await api('/teams/' + teamId + '/activities?page=1&size=20');
                const pageData = res.data;
                const activities = pageData.content || [];
                renderActivities(activities);
            } catch (e) {
                document.getElementById('activitiesList').innerHTML =
                    '<div class="error">加载失败：' + e.message + '</div>';
            }
        }

        // 渲染队内活动列表
        function renderActivities(activities) {
            const container = document.getElementById('activitiesList');

            if (!activities || activities.length === 0) {
                container.innerHTML = '<div class="empty-state">暂无队内活动</div>';
                return;
            }

            container.innerHTML = activities.map(a => {
                var startDate = formatDate(a.startTime);
                var startTime = formatDateTime(a.startTime);
                return `
                <div class="team-activity-item">
                    <div class="team-activity-info">
                        <h4 class="team-activity-title">
                            <a href="#/activity/${a.id}">${escapeHtml(a.title)}</a>
                        </h4>
                        <p class="team-activity-meta">
                            <span>📅 ${startDate}</span>
                            <span>📍 ${escapeHtml(a.location || '')}</span>
                            <span>👥 ${a.currentParticipants || 0}/${a.maxParticipants || 0}人</span>
                        </p>
                    </div>
                    <span class="activity-status-badge status-${(a.status || '').toLowerCase()}">${a.status === 'ACTIVE' ? '进行中' : a.status}</span>
                </div>`;
            }).join('');
        }

        // 处理入队申请
        window.handleRequest = async function(requestId, action) {
            const item = document.querySelector(`.request-item[data-request-id="${requestId}"]`);
            const btns = item.querySelectorAll('.request-actions button');
            btns.forEach(b => b.disabled = true);

            try {
                await TeamAPI.handleRequest(teamId, requestId, action);
                toast(action === 'approve' ? '已同意申请' : '已拒绝申请', 'success');
                loadRequests();
                loadTeamDetail(); // 刷新成员数
            } catch (e) {
                toast(e.message || '操作失败', 'error');
                btns.forEach(b => b.disabled = false);
            }
        };

        // 一键加入
        window.handleJoinTeam = async function() {
            try {
                await TeamAPI.join(teamId);
                toast('成功加入小队！', 'success');
                loadTeamDetail();
            } catch (e) {
                toast(e.message || '加入失败', 'error');
            }
        };

        // 申请加入
        window.showJoinRequest = function() {
            const message = prompt('请输入申请留言（选填，限200字）：');
            if (message !== null) {
                handleJoinRequestWithMsg(message);
            }
        };

        async function handleJoinRequestWithMsg(message) {
            try {
                await TeamAPI.join(teamId, message);
                toast('申请已提交，等待队长审核', 'success');
                loadTeamDetail();
            } catch (e) {
                toast(e.message || '申请失败', 'error');
            }
        }

        // 退出小队
        window.handleLeaveTeam = async function() {
            if (!confirm('确定要退出小队吗？')) return;

            try {
                await TeamAPI.leave(teamId);
                toast('已退出小队', 'success');
                Router.navigate('/teams');
            } catch (e) {
                toast(e.message || '退出失败', 'error');
            }
        };

        // 显示申请列表
        window.showRequests = function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('requestsTab').classList.add('active');

            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('requestsTabPanel').classList.add('active');

            loadRequests();
        };

        // 标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tab = this.dataset.tab;
                if (tab === 'requests' && teamData.userRole !== 'leader') return;

                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                var panelId = tab === 'requests' ? 'requestsTabPanel'
                            : tab === 'activities' ? 'activitiesTabPanel'
                            : 'membersTab';
                document.getElementById(panelId).classList.add('active');

                if (tab === 'requests') loadRequests();
                if (tab === 'activities') loadActivities();
            });
        });

        // 日期格式化
        function formatDate(dateStr) {
            if (!dateStr) return '未知';
            const d = new Date(dateStr);
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        }

        function formatDateTime(dateStr) {
            if (!dateStr) return '未知';
            const d = new Date(dateStr);
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
                   String(d.getDate()).padStart(2, '0') + ' ' +
                   String(d.getHours()).padStart(2, '0') + ':' +
                   String(d.getMinutes()).padStart(2, '0');
        }

        function escapeHtml(text) {
            if (!text) return '';
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // 初始加载
        loadTeamDetail();
    }
});
