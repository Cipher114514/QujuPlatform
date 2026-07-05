// ====== 首页（仪表盘） ======
Router.register('/home', {
    title: '首页',
    requireAuth: true,

    render: function () {
        var u = getCurUser();
        return '\
        <div id="homeContent" class="home-content">\
            <div class="welcome-card">\
                <h2>你好，' + (u ? u.nickname : '') + '</h2>\
                <p id="homeSub">欢迎回到趣聚平台</p>\
            </div>\
            <div class="home-tabs">\
                <div class="home-tab active" data-tab="activities" onclick="switchHomeTab(\'activities\')">推荐活动</div>\
                <div class="home-tab" data-tab="teams" onclick="switchHomeTab(\'teams\')">推荐小队</div>\
            </div>\
            <div id="homeFeedWrapper" class="home-feed-list">\
                <div class="loading">加载中...</div>\
            </div>\
            <div style="margin-bottom:12px;font-size:15px;font-weight:600;color:var(--text);">快捷入口</div>\
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">\
                <div class="card" style="text-align:center;cursor:pointer;padding:18px;" onclick="Router.navigate(\'/activities\')">\
                    <div style="font-size:28px;margin-bottom:6px;">📋</div>\
                    <div style="font-weight:700;font-size:14px;">活动广场</div>\
                    <div style="font-size:11px;color:var(--text-secondary);">发现精彩线下活动</div>\
                </div>\
                <div class="card" style="text-align:center;cursor:pointer;padding:18px;" onclick="Router.navigate(\'/ai-create\')">\
                    <div style="font-size:28px;margin-bottom:6px;">🤖</div>\
                    <div style="font-weight:700;font-size:14px;">创建活动</div>\
                    <div style="font-size:11px;color:var(--text-secondary);">AI 辅助快速创建</div>\
                </div>\
                <div class="card" style="text-align:center;cursor:pointer;padding:18px;" onclick="Router.navigate(\'/friends\')">\
                    <div style="font-size:28px;margin-bottom:6px;">👥</div>\
                    <div style="font-weight:700;font-size:14px;">好友管理</div>\
                    <div style="font-size:11px;color:var(--text-secondary);">好友列表与聊天</div>\
                </div>\
                <div class="card" style="text-align:center;cursor:pointer;padding:18px;" onclick="Router.navigate(\'/my-registrations\')">\
                    <div style="font-size:28px;margin-bottom:6px;">📝</div>\
                    <div style="font-weight:700;font-size:14px;">我的报名</div>\
                    <div style="font-size:11px;color:var(--text-secondary);">查看已报名活动</div>\
                </div>\
            </div>\
        </div>';
    },

    init: function () {
        homeTabData = {};
        homeActiveTab = 'activities';
        loadHomeFeed();
    }
});

// 首页 Tab 状态
var homeActiveTab = 'activities';
var homeTabData = {};

function switchHomeTab(tab) {
    if (homeActiveTab === tab) return;
    homeActiveTab = tab;

    var tabs = document.querySelectorAll('.home-tab');
    tabs.forEach(function(t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === tab);
    });

    if (homeTabData[tab]) {
        renderHomeFeed(homeTabData[tab], tab);
    } else {
        loadHomeFeed();
    }
}

async function loadHomeFeed() {
    var container = document.getElementById('homeFeedWrapper');
    if (!container) return;

    container.innerHTML = '<div class="loading">加载中...</div>';

    var tab = homeActiveTab;

    try {
        var data;
        if (tab === 'activities') {
            var res = await api('/activities?size=9&page=0');
            data = (res.data && res.data.content) ? res.data.content : [];
        } else {
            var res = await api('/teams?size=9&page=1');
            data = (res.data && res.data.content) ? res.data.content : [];
        }

        homeTabData[tab] = data;
        renderHomeFeed(data, tab);
    } catch (e) {
        container.innerHTML = '<div class="empty-state">加载失败，下拉刷新重试</div>';
    }
}

function renderHomeFeed(data, tab) {
    var container = document.getElementById('homeFeedWrapper');
    if (!container) return;

    if (!data || data.length === 0) {
        var label = tab === 'activities' ? '暂无推荐活动' : '暂无推荐小队';
        container.innerHTML = '<div class="empty-state">' + label + '</div>';
        return;
    }

    if (tab === 'activities') {
        container.innerHTML = data.map(function(a) {
            var catIcons = { sports: '⚽', outdoor: '🏔️', boardgame: '🎲', study: '📚', charity: '🤝', citywalk: '🚶', hiking: '🥾' };
            var catIcon = catIcons[a.category] || '📌';
            var catNames = { sports: '运动', outdoor: '户外', boardgame: '桌游', study: '学习', charity: '公益', citywalk: '探索', hiking: '徒步' };
            var catName = catNames[a.category] || a.category;
            var dateStr = a.startTime ? formatHomeDate(a.startTime) : '';
            var loc = a.location || '';
            var feeStr = a.fee > 0 ? '¥' + a.fee : '免费';
            var cover = a.coverImage
                ? '<img class="home-feed-cover" src="' + escHtml(a.coverImage) + '" alt="" loading="lazy">'
                : '<div class="home-feed-cover placeholder ' + escHtml(a.category || '') + '">' + catIcon + '</div>';

            return '<div class="home-feed-card" onclick="Router.navigate(\'/activity/' + a.id + '\')">' +
                cover +
                '<div class="home-feed-body">' +
                    '<div class="feed-title">' + escHtml(a.title) + '</div>' +
                    '<div class="feed-meta">' +
                        '<span class="home-feed-badge">' + escHtml(catName) + '</span>' +
                        '<span>' + escHtml(dateStr) + '</span>' +
                        (loc ? '<span>' + escHtml(loc) + '</span>' : '') +
                    '</div>' +
                    '<div class="feed-meta">' +
                        '<span>👥 ' + (a.currentParticipants || 0) + '/' + (a.maxParticipants || '∞') + '人</span>' +
                        '<span style="color:var(--primary);font-weight:600;">' + escHtml(feeStr) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    } else {
        container.innerHTML = data.map(function(t) {
            var desc = t.description || '';
            var tags = t.tags || [];
            var tagsHtml = tags.length > 0
                ? '<div class="feed-tags">' + tags.slice(0, 3).map(function(tag) {
                    return '<span class="tag">' + escHtml(tag) + '</span>';
                  }).join('') + '</div>'
                : '';
            var badge = t.isPublic
                ? '<span class="home-feed-badge" style="background:#dcfce7;color:#166534;">公开</span>'
                : '<span class="home-feed-badge" style="background:#fef3c7;color:#b45309;">私密</span>';
            var cover = t.coverImage
                ? '<img class="home-feed-cover" src="' + escHtml(t.coverImage) + '" alt="" loading="lazy">'
                : '<div class="home-feed-cover placeholder team">👥</div>';

            return '<div class="home-feed-card" onclick="Router.navigate(\'/team/' + t.id + '\')">' +
                cover +
                '<div class="home-feed-body">' +
                    '<div class="feed-title">' + escHtml(t.name) + '</div>' +
                    (desc ? '<div class="feed-desc">' + escHtml(desc) + '</div>' : '') +
                    tagsHtml +
                    '<div class="feed-meta">' +
                        badge +
                        '<span>👤 ' + escHtml(t.leaderNickname || '') + '</span>' +
                        '<span>👥 ' + (t.memberCount || 0) + '人</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    }
}

// 首页日期格式化：同一年省略年份
function formatHomeDate(dateStr) {
    var d = new Date(dateStr);
    var now = new Date();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var hour = d.getHours().toString().padStart(2, '0');
    var min = d.getMinutes().toString().padStart(2, '0');
    if (d.getFullYear() === now.getFullYear()) {
        return month + '月' + day + '日 ' + hour + ':' + min;
    }
    return d.getFullYear() + '年' + month + '月' + day + '日';
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
