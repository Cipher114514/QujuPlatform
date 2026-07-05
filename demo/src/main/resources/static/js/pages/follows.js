// ====== 关注管理页（US-026） ======
// 功能：查看我关注的人、查看关注我的人、互关管理
// 负责人：P9

Router.register('/follows', {
    title: '关注管理',
    requireAuth: true,

    render: function() {
        return `
        <div class="follows-page">
            <div class="follows-header">
                <h1>关注管理</h1>
            </div>

            <!-- Tab切换 -->
            <div class="tabs">
                <button class="tab-btn active" data-tab="following">我关注的人</button>
                <button class="tab-btn" data-tab="followers">关注我的人</button>
            </div>

            <!-- 用户列表 -->
            <div id="followList" class="follow-list">
                <div class="loading">加载中...</div>
            </div>

            <!-- 空状态 -->
            <div id="emptyState" class="empty-state" style="display: none;">
                <p style="font-size: 48px;">👥</p>
                <p id="emptyText">暂无关注</p>
            </div>
        </div>`;
    },

    init: function() {
        const USE_MOCK = false;
        let currentTab = 'following';
        let users = [];

        // Mock数据
        const MOCK_DATA = {
            following: [
                { id: 2, nickname: '户外探险家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=outdoor', bio: '热爱户外徒步', isFollowing: true, isFollowedBy: true, isFriend: true, followedAt: '2026-06-20T10:00:00' },
                { id: 3, nickname: '桌游达人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=boardgame', bio: '每周组织桌游局', isFollowing: true, isFollowedBy: false, isFriend: false, followedAt: '2026-06-25T14:30:00' },
                { id: 5, nickname: '健身教练', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fitness', bio: '专业健身指导', isFollowing: true, isFollowedBy: false, isFriend: false, followedAt: '2026-06-28T09:15:00' },
            ],
            followers: [
                { id: 2, nickname: '户外探险家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=outdoor', bio: '热爱户外徒步', isFollowing: true, isFollowedBy: true, isFriend: true, followedAt: '2026-06-20T10:00:00' },
                { id: 7, nickname: '新朋友', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newfriend', bio: '刚加入平台', isFollowing: false, isFollowedBy: true, isFriend: false, followedAt: '2026-06-28T16:00:00' },
            ]
        };

        // 加载数据
        async function loadData() {
            document.getElementById('followList').innerHTML = '<div class="loading">加载中...</div>';

            try {
                let data;
                if (USE_MOCK) {
                    data = MOCK_DATA[currentTab];
                } else {
                    if (currentTab === 'following') {
                        const res = await FollowAPI.following();
                        data = res.data;
                    } else {
                        const res = await FollowAPI.followers();
                        data = res.data;
                    }
                }
                users = data || [];
                renderUsers();
            } catch (e) {
                document.getElementById('followList').innerHTML = '<div class="error">加载失败：' + e.message + '</div>';
            }
        }

        // 渲染用户列表
        function renderUsers() {
            const container = document.getElementById('followList');
            const emptyState = document.getElementById('emptyState');
            const emptyText = document.getElementById('emptyText');

            if (users.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                emptyText.textContent = currentTab === 'following' ? '还没有关注任何人' : '还没有粉丝';
                return;
            }

            container.style.display = 'block';
            emptyState.style.display = 'none';

            container.innerHTML = users.map(user => `
                <div class="follow-item" data-user-id="${user.id}">
                    <a href="#/follows?userId=${user.id}">
                        <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}" alt="${user.nickname}" class="follow-avatar" />
                    </a>
                    <div class="follow-info">
                        <div class="follow-name-row">
                            <a href="#/follows?userId=${user.id}" class="follow-name">${user.nickname}</a>
                            ${user.isFriend ? '<span class="friend-badge">好友</span>' : ''}
                            ${user.isFollowedBy && !user.isFriend ? '<span class="follower-badge">关注了你</span>' : ''}
                        </div>
                        <p class="follow-bio">${user.bio || '这个人很懒，没有填写简介'}</p>
                        ${user.followedAt ? '<p class="follow-time">关注时间：' + formatTime(user.followedAt) + '</p>' : ''}
                    </div>
                    <div class="follow-actions">
                        ${user.isFollowing
                            ? `<button class="btn btn-secondary btn-sm" onclick="handleUnfollow(${user.id})">取消关注</button>`
                            : `<button class="btn btn-primary btn-sm" onclick="handleFollowBack(${user.id})">回关</button>`
                        }
                        <a href="#/chat/${user.id}" class="btn btn-outline btn-sm">发消息</a>
                    </div>
                </div>
            `).join('');
        }

        // 格式化时间
        function formatTime(timeStr) {
            const date = new Date(timeStr);
            const now = new Date();
            const diff = now - date;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (days > 7) {
                return date.toLocaleDateString('zh-CN');
            } else if (days > 0) {
                return days + '天前';
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours > 0) {
                return hours + '小时前';
            }
            const minutes = Math.floor(diff / (1000 * 60));
            return minutes + '分钟前';
        }

        // 取消关注
        window.handleUnfollow = async function(userId) {
            if (!confirm('确定要取消关注吗？')) {
                return;
            }

            const btn = event.target;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '处理中...';

            try {
                await FollowAPI.unfollow(userId);
                toast('取消关注成功');

                // 刷新列表
                const user = users.find(u => u.id === userId);
                if (user) {
                    user.isFollowing = false;
                    user.isFriend = false;
                }
                renderUsers();
            } catch (e) {
                toast(e.message || '操作失败', 'error');
                btn.textContent = originalText;
            } finally {
                btn.disabled = false;
            }
        };

        // 回关
        window.handleFollowBack = async function(userId) {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '关注中...';

            try {
                const res = await FollowAPI.follow(userId);
                if (res.data.isNowFriend) {
                    toast('关注成功！你们已成为好友', 'success');
                } else {
                    toast('关注成功');
                }

                // 刷新列表
                const user = users.find(u => u.id === userId);
                if (user) {
                    user.isFollowing = true;
                    if (user.isFollowedBy) {
                        user.isFriend = true;
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

        // Tab切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentTab = this.dataset.tab;
                loadData();
            });
        });

        // 初始加载
        loadData();
    }
});
