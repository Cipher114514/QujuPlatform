// ====== 兴趣小队发现页（US-027） ======
// 功能：搜索小队、按标签筛选、查看小队列表、创建小队
// 负责人：P5

Router.register('/teams', {
    title: '兴趣小队',
    requireAuth: true,

    render: function() {
        // 预设标签列表
        const PRESET_TAGS = [
            '运动', '户外', '徒步', '篮球', '羽毛球', '足球', '瑜伽',
            '桌游', '聚会', '交友', '狼人杀', '剧本杀',
            '学习', '读书', '编程', '语言学习',
            '音乐', '电影', '摄影', '艺术',
            '游戏', '电竞',
            '美食', '烹饪',
            '旅行', '城市漫步', '城市探索',
            '公益', '志愿', '环保',
            '健身', '跑步',
            '其他'
        ];

        return `
        <div class="home-content">
            <div class="welcome-card" style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <h2>兴趣小队</h2>
                    <p>发现同好，创建或加入属于你的圈子</p>
                </div>
                <button id="createTeamBtnTop" class="btn btn-primary btn-sm" style="width:auto;white-space:nowrap;">+ 创建小队</button>
            </div>

            <!-- 搜索区域 -->
            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <input type="text" id="searchInput" placeholder="搜索小队名称或简介..." style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;" />
                <button id="searchBtn" class="btn btn-primary btn-sm" style="width:auto;padding:10px 20px;">搜索</button>
            </div>

            <!-- 标签筛选 -->
            <div class="tags-filter-section">
                <div class="tags-filter-label">按标签筛选：</div>
                <div class="tags-filter" id="tagsFilter">
                    <button class="tag-btn active" data-tag="">全部</button>
                    ${PRESET_TAGS.map(tag => `<button class="tag-btn" data-tag="${tag}">${tag}</button>`).join('')}
                </div>
            </div>

            <!-- 小队列表 -->
            <div id="teamsListContainer">
                <div class="section-title">
                    <span id="listTitle">发现小队</span>
                    <span id="resultCount" class="result-count"></span>
                </div>
                <div id="teamsList" class="home-feed-list">
                    <div class="loading">加载中...</div>
                </div>
            </div>

            <!-- 空状态 -->
            <div id="emptyState" class="empty-state" style="display: none;">
                <p style="font-size: 48px;">👥</p>
                <p id="emptyText">未找到相关小队</p>
                <p style="font-size: 13px; color: var(--text-secondary);">试试创建一个新小队吧</p>
            </div>
        </div>

        <!-- 创建小队模态框 -->
        <div id="createTeamModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>创建兴趣小队</h2>
                    <button class="modal-close" onclick="closeCreateModal()">&times;</button>
                </div>
                <form id="createTeamForm" class="modal-body">
                    <div class="form-group">
                        <label>小队名称 *</label>
                        <input type="text" id="teamName" maxlength="20" placeholder="给小队起个响亮的名字（≤20字）" required />
                    </div>
                    <div class="form-group">
                        <label>小队简介</label>
                        <textarea id="teamDesc" maxlength="200" rows="3" placeholder="介绍一下小队的宗旨（≤200字）"></textarea>
                    </div>
                    <div class="form-group">
                        <label>兴趣标签 *（1-5个）</label>
                        <div class="tags-input-wrapper">
                            <input type="text" id="tagInput" placeholder="输入标签后回车添加，或从下方选择" maxlength="10" />
                            <div id="presetTagsForCreate" class="preset-tags-list">
                                <span class="preset-hint">快速选择：</span>
                                ${PRESET_TAGS.map(tag => `<span class="preset-tag" onclick="selectPresetTag('${tag}')">${tag}</span>`).join('')}
                            </div>
                            <div id="selectedTags" class="selected-tags"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>小队类型 *</label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="teamType" value="public" checked />
                                <span>公开小队</span>
                                <small>用户可一键加入</small>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="teamType" value="private" />
                                <span>审核小队</span>
                                <small>用户需申请，队长审批</small>
                            </label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeCreateModal()">取消</button>
                        <button type="submit" class="btn btn-primary">创建</button>
                    </div>
                </form>
            </div>
        </div>`;
    },

    init: function() {
        const USE_MOCK = false;
        let teams = [];
        let currentTag = '';
        let currentKeyword = '';
        let currentPage = 1;
        let selectedTags = [];

        // Mock数据
        const MOCK_TEAMS = [
            { id: 1, name: '周末徒步小队', description: '每周组织周边徒步活动，亲近自然', tags: ['户外', '徒步', '运动'], isPublic: true, memberCount: 128, leaderId: 2, leaderNickname: '户外达人', userRole: null, hasRequested: false },
            { id: 2, name: '桌游交友圈', description: '每周五晚上桌游局，新手友好', tags: ['桌游', '交友'], isPublic: true, memberCount: 56, leaderId: 3, leaderNickname: '桌游爱好者', userRole: null, hasRequested: false },
            { id: 3, name: '读书分享会', description: '每月共读一本书，分享感悟', tags: ['学习', '读书'], isPublic: false, memberCount: 23, leaderId: 4, leaderNickname: '书虫', userRole: null, hasRequested: false },
            { id: 4, name: '羽毛球俱乐部', description: '羽毛球爱好者聚集地', tags: ['运动', '羽毛球'], isPublic: true, memberCount: 89, leaderId: 5, leaderNickname: '羽毛球高手', userRole: null, hasRequested: false },
            { id: 5, name: '摄影交流群', description: '分享摄影作品，交流拍摄技巧', tags: ['摄影', '艺术'], isPublic: true, memberCount: 167, leaderId: 6, leaderNickname: '摄影师', userRole: null, hasRequested: false },
        ];

        // 加载小队列表
        async function loadTeams(resetPage = true) {
            if (resetPage) currentPage = 1;

            document.getElementById('teamsList').innerHTML = '<div class="loading">加载中...</div>';

            try {
                let data;
                if (USE_MOCK) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    let filteredTeams = MOCK_TEAMS;
                    if (currentTag) {
                        filteredTeams = filteredTeams.filter(t => t.tags && t.tags.includes(currentTag));
                    }
                    if (currentKeyword) {
                        const kw = currentKeyword.toLowerCase();
                        filteredTeams = filteredTeams.filter(t =>
                            (t.name && t.name.toLowerCase().includes(kw)) ||
                            (t.description && t.description.toLowerCase().includes(kw))
                        );
                    }
                    data = { data: { content: filteredTeams, totalElements: filteredTeams.length } };
                } else {
                    const res = await TeamAPI.list({
                        keyword: currentKeyword,
                        tag: currentTag,
                        page: currentPage,
                        size: 12
                    });
                    data = res;
                }

                teams = data.data.content || [];
                renderTeams();
            } catch (e) {
                document.getElementById('teamsList').innerHTML = '<div class="error">加载失败：' + e.message + '</div>';
            }
        }

        // 渲染小队列表
        function renderTeams() {
            const container = document.getElementById('teamsList');
            const emptyState = document.getElementById('emptyState');
            const emptyText = document.getElementById('emptyText');
            const resultCount = document.getElementById('resultCount');

            if (teams.length > 0) {
                resultCount.textContent = `(${teams.length}个)`;
            } else {
                resultCount.textContent = '';
            }

            if (teams.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                if (currentTag) {
                    emptyText.textContent = `暂无"${currentTag}"标签的小队`;
                } else if (currentKeyword) {
                    emptyText.textContent = '未找到相关小队';
                } else {
                    emptyText.textContent = '暂无小队';
                }
                return;
            }

            container.style.display = 'grid';
            emptyState.style.display = 'none';

            container.innerHTML = teams.map(team => {
                var desc = team.description || '';
                if (desc.length > 40) desc = desc.substring(0, 40) + '...';
                var badge = team.isPublic
                    ? '<span class="home-feed-badge" style="background:#dcfce7;color:#166534;">公开</span>'
                    : '<span class="home-feed-badge" style="background:#fef3c7;color:#b45309;">审核</span>';
                var actionHtml = renderTeamAction(team);

                return '<div class="home-feed-card" onclick="Router.navigate(\'#/team/' + team.id + '\')">' +
                    '<div class="home-feed-cover placeholder team">👥</div>' +
                    '<div class="home-feed-body">' +
                        '<div class="feed-title">' + escHtmlTeam(team.name) + '</div>' +
                        (desc ? '<div class="feed-desc">' + escHtmlTeam(desc) + '</div>' : '') +
                        '<div class="feed-tags">' + (team.tags || []).slice(0, 3).map(function(tag) {
                            return '<span class="tag">' + escHtmlTeam(tag) + '</span>';
                        }).join('') + '</div>' +
                        '<div class="feed-meta">' +
                            badge +
                            '<span>👤 ' + escHtmlTeam(team.leaderNickname || '') + '</span>' +
                            '<span>👥 ' + (team.memberCount || 0) + '人</span>' +
                        '</div>' +
                        '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' + actionHtml + '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        // 渲染小队操作按钮
        function renderTeamAction(team) {
            if (team.userRole === 'leader') {
                return '<button class="btn btn-outline btn-sm" style="width:auto;" onclick="event.stopPropagation();Router.navigate(\'#/team/' + team.id + '\')">管理</button>';
            } else if (team.userRole === 'member') {
                return '<button class="btn btn-primary btn-sm" style="width:auto;" onclick="event.stopPropagation();Router.navigate(\'#/team/' + team.id + '\')">进入小队</button>';
            } else if (team.requestStatus === 'pending') {
                return '<button class="btn btn-secondary btn-sm" style="width:auto;" disabled>等待审核</button>';
            } else if (team.requestStatus === 'rejected') {
                return '<button class="btn btn-primary btn-sm" style="width:auto;" onclick="event.stopPropagation();showJoinRequest(' + team.id + ')">重新申请</button>';
            } else if (team.isPublic) {
                return '<button class="btn btn-primary btn-sm" style="width:auto;" onclick="event.stopPropagation();handleJoinTeam(' + team.id + ', true)">一键加入</button>';
            } else {
                return '<button class="btn btn-primary btn-sm" style="width:auto;" onclick="event.stopPropagation();showJoinRequest(' + team.id + ')">申请加入</button>';
            }
        }

        // 一键加入公开小队
        window.handleJoinTeam = async function(teamId, isPublic) {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '加入中...';

            try {
                await TeamAPI.join(teamId);
                toast('成功加入小队！', 'success');
                loadTeams();
            } catch (e) {
                toast(e.message || '加入失败', 'error');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        };

        // 显示申请加入模态框
        window.showJoinRequest = function(teamId) {
            const message = prompt('请输入申请留言（选填，限200字）：');
            if (message !== null) {
                handleJoinRequestWithMsg(teamId, message);
            }
        };

        // 申请加入审核小队
        async function handleJoinRequestWithMsg(teamId, message) {
            try {
                await TeamAPI.join(teamId, message);
                toast('申请已提交，等待队长审核', 'success');
                loadTeams();
            } catch (e) {
                toast(e.message || '申请失败', 'error');
            }
        }

        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;

        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentKeyword = searchInput.value.trim();
                loadTeams();
            }, 300);
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                currentKeyword = searchInput.value.trim();
                loadTeams();
            }
        });

        document.getElementById('searchBtn').addEventListener('click', function() {
            currentKeyword = searchInput.value.trim();
            loadTeams();
        });

        // 标签筛选
        document.getElementById('tagsFilter').addEventListener('click', function(e) {
            if (e.target.classList.contains('tag-btn')) {
                document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentTag = e.target.dataset.tag;
                loadTeams();
            }
        });

        // 创建小队模态框
        document.getElementById('createTeamBtnTop').addEventListener('click', function() {
            document.getElementById('createTeamModal').style.display = 'flex';
        });

        window.closeCreateModal = function() {
            document.getElementById('createTeamModal').style.display = 'none';
            document.getElementById('createTeamForm').reset();
            selectedTags = [];
            renderSelectedTags();
        };

        // 点击模态框背景关闭
        document.getElementById('createTeamModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeCreateModal();
            }
        });

        // 标签输入（手动输入）
        const tagInput = document.getElementById('tagInput');
        tagInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = tagInput.value.trim();
                if (tag && selectedTags.length < 5 && !selectedTags.includes(tag)) {
                    selectedTags.push(tag);
                    tagInput.value = '';
                    renderSelectedTags();
                } else if (selectedTags.length >= 5) {
                    toast('最多添加5个标签', 'error');
                } else if (selectedTags.includes(tag)) {
                    toast('标签已存在', 'error');
                }
            }
        });

        // 选择预设标签
        window.selectPresetTag = function(tag) {
            if (selectedTags.length >= 5) {
                toast('最多添加5个标签', 'error');
                return;
            }
            if (selectedTags.includes(tag)) {
                toast('标签已存在', 'error');
                return;
            }
            selectedTags.push(tag);
            renderSelectedTags();
        };

        function renderSelectedTags() {
            const container = document.getElementById('selectedTags');
            if (selectedTags.length === 0) {
                container.innerHTML = '<span class="no-tags">尚未选择标签</span>';
                return;
            }
            container.innerHTML = selectedTags.map((tag, index) => `
                <span class="selected-tag">
                    ${tag}
                    <span onclick="removeTag(${index})" class="tag-remove">&times;</span>
                </span>
            `).join('');
        }

        window.removeTag = function(index) {
            selectedTags.splice(index, 1);
            renderSelectedTags();
        };

        // 创建小队表单提交
        document.getElementById('createTeamForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('teamName').value.trim();
            const description = document.getElementById('teamDesc').value.trim();
            const isPublic = document.querySelector('input[name="teamType"]:checked').value === 'public';

            if (selectedTags.length === 0) {
                toast('请至少添加一个兴趣标签', 'error');
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '创建中...';

            try {
                await TeamAPI.create({
                    name: name,
                    description: description,
                    tags: selectedTags,
                    isPublic: isPublic
                });
                toast('小队创建成功！', 'success');
                closeCreateModal();
                loadTeams();
            } catch (e) {
                toast(e.message || '创建失败', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = '创建';
            }
        });

        // 初始渲染
        renderSelectedTags();

        // 初始加载
        loadTeams();

        // 暴露渲染函数供刷新使用
        window.refreshTeamsList = loadTeams;
    }
});

function escHtmlTeam(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
