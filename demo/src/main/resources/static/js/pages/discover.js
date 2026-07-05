// ====== 用户发现页（US-026） ======
// 功能：搜索用户、查看推荐用户、关注用户
// 负责人：P9

Router.register('/discover', {
    title: '发现用户',
    requireAuth: true,

    render: function() {
        return `
        <div class="home-content">
            <div class="welcome-card">
                <h2>发现用户</h2>
                <p>搜索或推荐关注有趣的人</p>
            </div>

            <!-- 搜索区域 -->
            <div style="display:flex;gap:8px;margin-bottom:16px;">
                <input type="text" id="searchInput" placeholder="搜索用户昵称..." style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;" />
                <button id="searchBtn" class="btn btn-primary btn-sm" style="width:auto;padding:10px 20px;">搜索</button>
            </div>

            <!-- 用户列表 -->
            <div id="userListContainer">
                <div class="section-title">
                    <span>推荐用户</span>
                </div>
                <div id="userList" class="user-list">
                    <div class="loading">加载中...</div>
                </div>
            </div>

            <!-- 空状态 -->
            <div id="emptyState" class="empty-state" style="display: none;">
                <p style="font-size: 48px;">🔍</p>
                <p>没有找到相关用户</p>
                <p style="font-size: 13px; color: var(--text-secondary);">试试搜索其他关键词</p>
            </div>
        </div>`;
    },

    init: function() {
        const USE_MOCK = false;
        let users = [];
        let isSearchMode = false;

        // Mock数据
        const MOCK_USERS = {
            recommended: [
                { id: 2, nickname: '户外探险家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=outdoor', bio: '热爱户外徒步，周末常去爬山', role: 'user', isFollowing: false, isFriend: false, followersCount: 128, followingCount: 45 },
                { id: 3, nickname: '桌游达人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=boardgame', bio: '每周组织桌游局，新手友好', role: 'user', isFollowing: false, isFriend: false, followersCount: 256, followingCount: 89 },
                { id: 4, nickname: '摄影工作室', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=photo', bio: '专业摄影服务，记录美好瞬间', role: 'business', isFollowing: false, isFriend: false, followersCount: 512, followingCount: 23 },
                { id: 5, nickname: '读书会组织者', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reading', bio: '每月举办读书分享活动', role: 'user', isFollowing: false, isFriend: false, followersCount: 89, followingCount: 34 },
                { id: 6, nickname: '健身教练', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fitness', bio: '专业健身指导，一起变强', role: 'business', isFollowing: false, isFriend: false, followersCount: 1024, followingCount: 12 },
            ],
            search: [
                { id: 10, nickname: '搜索结果1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=search1', bio: '这是搜索结果', role: 'user', isFollowing: false, isFriend: false, followersCount: 50, followingCount: 20 },
            ]
        };

        // 加载推荐用户
        async function loadRecommendedUsers() {
            isSearchMode = false;
            document.getElementById('userList').innerHTML = '<div class="loading">加载中...</div>';
            document.querySelector('.section-title span').textContent = '推荐用户';

            try {
                let data;
                if (USE_MOCK) {
                    data = MOCK_USERS.recommended;
                } else {
                    const res = await FollowAPI.recommended(10);
                    data = res.data;
                }
                users = data || [];
                renderUsers();
            } catch (e) {
                document.getElementById('userList').innerHTML = '<div class="error">加载失败：' + e.message + '</div>';
            }
        }

        // 搜索用户
        async function searchUsers(nickname) {
            if (!nickname || nickname.trim() === '') {
                loadRecommendedUsers();
                return;
            }

            isSearchMode = true;
            document.getElementById('userList').innerHTML = '<div class="loading">搜索中...</div>';
            document.querySelector('.section-title span').textContent = '搜索结果';

            try {
                let data;
                if (USE_MOCK) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    data = MOCK_USERS.search.filter(u => u.nickname.includes(nickname));
                } else {
                    const res = await FollowAPI.search(nickname);
                    data = res.data;
                }
                users = data || [];
                renderUsers();
            } catch (e) {
                document.getElementById('userList').innerHTML = '<div class="error">搜索失败：' + e.message + '</div>';
            }
        }

        // 渲染用户列表
        function renderUsers() {
            const container = document.getElementById('userList');
            const emptyState = document.getElementById('emptyState');

            if (users.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            container.style.display = 'grid';
            emptyState.style.display = 'none';

            container.innerHTML = users.map(user => `
                <div class="user-card" data-user-id="${user.id}">
                    <div class="user-card-header">
                        <a href="#/follows?userId=${user.id}" class="user-avatar-link">
                            <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}" alt="${user.nickname}" class="user-avatar" />
                        </a>
                        <div class="user-info">
                            <div class="user-name-row">
                                <a href="#/follows?userId=${user.id}" class="user-name">${user.nickname}</a>
                                ${user.role === 'business' ? '<span class="business-tag">商家</span>' : ''}
                            </div>
                            <p class="user-bio">${user.bio || '这个人很懒，没有填写简介'}</p>
                            <div class="user-stats">
                                <span>${user.followersCount || 0} 粉丝</span>
                                <span>${user.followingCount || 0} 关注</span>
                            </div>
                        </div>
                    </div>
                    <div class="user-card-actions">
                        ${user.isFollowing
                            ? `<button class="btn btn-secondary" onclick="handleFollow(${user.id}, true)">已关注</button>`
                            : `<button class="btn btn-primary" onclick="handleFollow(${user.id}, false)">关注</button>`
                        }
                        <a href="#/chat/${user.id}" class="btn btn-outline">发消息</a>
                    </div>
                </div>
            `).join('');
        }

        // 关注/取关处理
        window.handleFollow = async function(userId, isFollowing) {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = isFollowing ? '取消中...' : '关注中...';

            try {
                if (isFollowing) {
                    await FollowAPI.unfollow(userId);
                    toast('取消关注成功');
                } else {
                    const res = await FollowAPI.follow(userId);
                    if (res.data.isNowFriend) {
                        toast('关注成功！你们已成为好友', 'success');
                    } else {
                        toast('关注成功');
                    }
                }

                // 刷新列表
                const user = users.find(u => u.id === userId);
                if (user) {
                    user.isFollowing = !isFollowing;
                    if (isFollowing) {
                        user.isFriend = false;
                    }
                }
                renderUsers();
            } catch (e) {
                toast(e.message || '操作失败', 'error');
                btn.textContent = originalText;
            } finally {
                btn.disabled = false;
            }
        };

        // 搜索输入框事件
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;

        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchUsers(searchInput.value);
            }, 300);
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                searchUsers(searchInput.value);
            }
        });

        // 搜索按钮
        document.getElementById('searchBtn').addEventListener('click', function() {
            searchUsers(searchInput.value);
        });

        // 初始加载推荐用户
        loadRecommendedUsers();
    }
});
