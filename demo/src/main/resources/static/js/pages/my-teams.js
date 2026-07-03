// ====== 我的小队页面（US-027） ======
// 功能：查看我加入的小队、我创建的小队、我申请的小队
// 负责人：P5

Router.register('/my-teams', {
    title: '我的小队',
    requireAuth: true,

    render: function() {
        return `
        <div class="my-teams-page">
            <div class="teams-header">
                <h1>我的小队</h1>
                <p class="subtitle">管理我加入和创建的兴趣小队</p>
            </div>

            <!-- 标签切换 -->
            <div class="team-tabs">
                <button class="tab-btn active" data-tab="joined">我加入的小队</button>
                <button class="tab-btn" data-tab="created">我创建的小队</button>
                <button class="tab-btn" data-tab="pending">我的申请</button>
            </div>

            <!-- 我加入的小队 -->
            <div id="joinedTab" class="tab-panel active">
                <div id="joinedTeamsList" class="teams-list">
                    <div class="loading">加载中...</div>
                </div>
                <div id="joinedEmpty" class="empty-state" style="display: none;">
                    <p style="font-size: 48px;">👥</p>
                    <p>你还没有加入任何小队</p>
                    <a href="#/teams" class="btn btn-primary" style="margin-top: 12px;">去发现小队</a>
                </div>
            </div>

            <!-- 我创建的小队 -->
            <div id="createdTab" class="tab-panel">
                <div id="createdTeamsList" class="teams-list">
                    <div class="loading">加载中...</div>
                </div>
                <div id="createdEmpty" class="empty-state" style="display: none;">
                    <p style="font-size: 48px;">🎯</p>
                    <p>你还没有创建任何小队</p>
                    <a href="#/teams" class="btn btn-primary" style="margin-top: 12px;" onclick="setTimeout(() => Router.navigate('/teams'), 100)">去创建小队</a>
                </div>
            </div>

            <!-- 我的申请 -->
            <div id="pendingTab" class="tab-panel">
                <div id="pendingRequestsList" class="requests-list-full">
                    <div class="loading">加载中...</div>
                </div>
                <div id="pendingEmpty" class="empty-state" style="display: none;">
                    <p style="font-size: 48px;">📋</p>
                    <p>你没有待处理的申请</p>
                </div>
            </div>
        </div>`;
    },

    init: function() {
        let myTeams = [];
        let createdTeams = [];
        let myRequests = [];

        // 加载我的小队列表
        async function loadMyTeams() {
            try {
                const res = await TeamAPI.myTeams();
                myTeams = res.data || [];
                processTeams();
            } catch (e) {
                document.getElementById('joinedTeamsList').innerHTML =
                    '<div class="error">加载失败：' + e.message + '</div>';
            }
        }

        // 处理小队数据，分离我加入的和我创建的
        function processTeams() {
            createdTeams = myTeams.filter(t => t.userRole === 'leader');
            const joined = myTeams.filter(t => t.userRole === 'member');

            renderJoinedTeams(joined);
            renderCreatedTeams();
        }

        // 渲染我加入的小队
        function renderJoinedTeams(teams) {
            const container = document.getElementById('joinedTeamsList');
            const emptyState = document.getElementById('joinedEmpty');

            if (teams.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            container.style.display = 'grid';
            emptyState.style.display = 'none';

            container.innerHTML = teams.map(team => `
                <div class="team-card" data-team-id="${team.id}">
                    <div class="team-card-header">
                        <h3 class="team-name">
                            <a href="#/team/${team.id}">${team.name}</a>
                            ${team.isPublic ? '<span class="team-type-badge public">公开</span>' : '<span class="team-type-badge private">审核</span>'}
                        </h3>
                        <p class="team-desc">${team.description || '暂无简介'}</p>
                    </div>
                    <div class="team-tags">
                        ${(team.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="team-card-footer">
                        <div class="team-meta">
                            <span>👤 队长: ${team.leaderNickname || '未知'}</span>
                            <span>👥 ${team.memberCount || 0} 成员</span>
                        </div>
                        <a href="#/team/${team.id}" class="btn btn-primary">进入小队</a>
                    </div>
                </div>
            `).join('');
        }

        // 渲染我创建的小队
        function renderCreatedTeams() {
            const container = document.getElementById('createdTeamsList');
            const emptyState = document.getElementById('createdEmpty');

            if (createdTeams.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            container.style.display = 'grid';
            emptyState.style.display = 'none';

            container.innerHTML = createdTeams.map(team => `
                <div class="team-card" data-team-id="${team.id}">
                    <div class="team-card-header">
                        <h3 class="team-name">
                            <a href="#/team/${team.id}">${team.name}</a>
                            <span class="team-type-badge leader">队长</span>
                        </h3>
                        <p class="team-desc">${team.description || '暂无简介'}</p>
                    </div>
                    <div class="team-tags">
                        ${(team.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="team-card-footer">
                        <div class="team-meta">
                            <span>👥 ${team.memberCount || 0} 成员</span>
                            ${!team.isPublic ? '<span class="pending-count" id="pendingCount' + team.id + '">加载中...</span>' : ''}
                        </div>
                        <a href="#/team/${team.id}" class="btn btn-primary">管理小队</a>
                    </div>
                </div>
            `).join('');

            // 加载审核制小队的待处理申请数量
            createdTeams.forEach(team => {
                if (!team.isPublic) {
                    loadPendingCount(team.id);
                }
            });
        }

        // 加载待处理申请数量
        async function loadPendingCount(teamId) {
            try {
                const res = await TeamAPI.pendingRequests(teamId);
                const count = res.data ? res.data.length : 0;
                const countEl = document.getElementById('pendingCount' + teamId);
                if (countEl) {
                    if (count > 0) {
                        countEl.textContent = `${count} 条待审核`;
                        countEl.style.color = 'var(--primary)';
                        countEl.style.fontWeight = '600';
                    } else {
                        countEl.textContent = '无待审核';
                        countEl.style.color = 'var(--text-secondary)';
                    }
                }
            } catch (e) {
                // 忽略错误
            }
        }

        // 渲染我的申请（需要从后端获取）
        async function loadMyRequests() {
            try {
                // 获取所有小队，然后筛选我申请的
                const allTeamsRes = await TeamAPI.list({ page: 1, size: 100 });
                const allTeams = allTeamsRes.data.content || [];

                // 筛选出我有申请的小队（requestStatus不为null的）
                const requestedTeams = allTeams.filter(t => t.requestStatus);

                const container = document.getElementById('pendingRequestsList');
                const emptyState = document.getElementById('pendingEmpty');

                if (requestedTeams.length === 0) {
                    container.style.display = 'none';
                    emptyState.style.display = 'block';
                    return;
                }

                container.style.display = 'block';
                emptyState.style.display = 'none';

                container.innerHTML = requestedTeams.map(team => {
                    const statusText = team.requestStatus === 'pending' ? '等待审核' :
                                      team.requestStatus === 'rejected' ? '已拒绝' : '已通过';
                    const statusClass = team.requestStatus === 'pending' ? 'pending' :
                                      team.requestStatus === 'rejected' ? 'rejected' : 'approved';
                    const actionBtn = team.requestStatus === 'rejected' ?
                        `<button class="btn btn-sm btn-primary" onclick="handleReapply(${team.id})">重新申请</button>` : '';

                    return `
                    <div class="request-item-full">
                        <div class="request-team-info">
                            <h4 class="request-team-name">
                                <a href="#/team/${team.id}">${team.name}</a>
                            </h4>
                            <p class="request-team-desc">${team.description || '暂无简介'}</p>
                            <div class="team-tags">
                                ${(team.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                        <div class="request-status">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                            ${actionBtn}
                        </div>
                    </div>
                `}).join('');
            } catch (e) {
                document.getElementById('pendingRequestsList').innerHTML =
                    '<div class="error">加载失败：' + e.message + '</div>';
            }
        }

        // 重新申请（从我的小队页面）
        window.handleReapply = async function(teamId) {
            const message = prompt('请输入申请留言（选填，限200字）：');
            if (message !== null) {
                try {
                    await TeamAPI.join(teamId, message);
                    toast('申请已提交', 'success');
                    loadMyRequests();
                } catch (e) {
                    toast(e.message || '申请失败', 'error');
                }
            }
        };

        // 标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tab = this.dataset.tab;

                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                document.getElementById(tab + 'Tab').classList.add('active');

                // 加载对应的数据
                if (tab === 'pending' && myRequests.length === 0) {
                    loadMyRequests();
                }
            });
        });

        // 初始加载
        loadMyTeams();
    }
});
