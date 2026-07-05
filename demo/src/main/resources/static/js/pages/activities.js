// ====== 活动广场 ======
// 路由: #/activities
// 功能: 活动信息流 + 搜索 + 筛选 + 分页

const ACT_LIST_USE_MOCK = false;

var ACT_CATEGORIES = [
    { value: '', label: '全部' },
    { value: 'sports', label: '运动健身' },
    { value: 'hiking', label: '户外徒步' },
    { value: 'boardgame', label: '桌游聚会' },
    { value: 'study', label: '学习交流' },
    { value: 'charity', label: '公益活动' },
    { value: 'citywalk', label: '城市探索' }
];

var ACT_CAT_LABEL = {};
for (var i = 0; i < ACT_CATEGORIES.length; i++) {
    ACT_CAT_LABEL[ACT_CATEGORIES[i].value] = ACT_CATEGORIES[i].label;
}

var ACT_CAT_ICONS = {
    'sports': '⚽', 'hiking': '🏔️', 'boardgame': '🎲',
    'study': '📚', 'charity': '🤝', 'citywalk': '🚶'
};
var ACT_CAT_NAMES = {
    'sports': '运动', 'hiking': '徒步', 'boardgame': '桌游',
    'study': '学习', 'charity': '公益', 'citywalk': '探索'
};

var MOCK_ACT_LIST = {
    content: [
        { id: 1, title: '周末篮球对抗赛', description: '一起参与周末篮球运动，强身健体，结交运动伙伴！无论新手老手都能找到乐趣。', category: 'sports', startTime: '2026-07-12T14:00:00', endTime: '2026-07-12T17:00:00', location: '朝阳公园篮球场', maxParticipants: 20, currentParticipants: 8, fee: 0, status: 'ACTIVE', creatorId: 1, creatorName: '运动达人小王', coverImage: '' },
        { id: 2, title: '香山徒步之旅', description: '周末香山徒步，全程约8公里，沿途欣赏自然风光，适合初级户外爱好者。', category: 'hiking', startTime: '2026-07-13T08:00:00', endTime: '2026-07-13T15:00:00', location: '香山公园东门', maxParticipants: 15, currentParticipants: 12, fee: 10, status: 'ACTIVE', creatorId: 2, creatorName: '户外探险家', coverImage: '' },
        { id: 3, title: '狼人杀桌游局', description: '每周固定桌游局，新手友好，有教学环节。提供多种桌游选择。', category: 'boardgame', startTime: '2026-07-12T19:00:00', endTime: '2026-07-12T22:00:00', location: '三里屯桌游吧', maxParticipants: 12, currentParticipants: 12, fee: 30, status: 'ACTIVE', creatorId: 3, creatorName: '桌游达人', coverImage: '' },
        { id: 4, title: 'Python学习交流会', description: 'Python主题学习交流，分享编程经验，互相成长。', category: 'study', startTime: '2026-07-15T10:00:00', endTime: '2026-07-15T12:00:00', location: '中关村创业咖啡', maxParticipants: 15, currentParticipants: 5, fee: 0, status: 'ACTIVE', creatorId: 4, creatorName: '编程爱好者', coverImage: '' },
        { id: 5, title: '社区环保公益行动', description: '社区环保公益活动，清理公园垃圾，用行动传递温暖。', category: 'charity', startTime: '2026-07-14T09:00:00', endTime: '2026-07-14T12:00:00', location: '奥林匹克公园', maxParticipants: 30, currentParticipants: 18, fee: 0, status: 'ACTIVE', creatorId: 5, creatorName: '公益先锋', coverImage: '' },
        { id: 6, title: '胡同城市漫步', description: '漫步老北京胡同，发现城市隐藏的美，品尝地道小吃。', category: 'citywalk', startTime: '2026-07-13T14:00:00', endTime: '2026-07-13T17:30:00', location: '南锣鼓巷地铁站', maxParticipants: 10, currentParticipants: 7, fee: 50, status: 'ACTIVE', creatorId: 6, creatorName: '城市探索者', coverImage: '' },
        { id: 7, title: '羽毛球双打友谊赛', description: '羽毛球双打友谊赛，随机组队重在参与。', category: 'sports', startTime: '2026-07-16T18:00:00', endTime: '2026-07-16T21:00:00', location: '海淀体育馆', maxParticipants: 16, currentParticipants: 4, fee: 20, status: 'ACTIVE', creatorId: 1, creatorName: '运动达人小王', coverImage: '' },
        { id: 8, title: '摄影外拍活动', description: '城市风光摄影外拍，交流拍摄技巧分享后期经验。', category: 'citywalk', startTime: '2026-07-17T15:00:00', endTime: '2026-07-17T18:30:00', location: '798艺术区', maxParticipants: 20, currentParticipants: 11, fee: 0, status: 'ACTIVE', creatorId: 7, creatorName: '摄影师老张', coverImage: '' }
    ],
    totalElements: 12,
    totalPages: 2,
    number: 0,
    size: 8
};

var MOCK_ACT_LIST_PAGE2 = {
    content: [
        { id: 9, title: '周末骑行活动', description: '城市绿道骑行，全程约20公里，适合休闲骑行。', category: 'sports', startTime: '2026-07-19T08:00:00', endTime: '2026-07-19T12:00:00', location: '奥森公园南门', maxParticipants: 20, currentParticipants: 9, fee: 0, status: 'ACTIVE', creatorId: 8, creatorName: '骑行爱好者', coverImage: '' },
        { id: 10, title: '日语角交流活动', description: '日语爱好者交流聚会，分初级和高级组自由对话。', category: 'study', startTime: '2026-07-18T19:00:00', endTime: '2026-07-18T21:00:00', location: '五道口咖啡厅', maxParticipants: 25, currentParticipants: 16, fee: 0, status: 'ACTIVE', creatorId: 9, creatorName: '日语爱好者', coverImage: '' },
        { id: 11, title: '读书分享会', description: '本月主题《人类简史》，欢迎读过和想读的朋友一起讨论。', category: 'study', startTime: '2026-07-20T14:00:00', endTime: '2026-07-20T16:00:00', location: 'PageOne书店', maxParticipants: 20, currentParticipants: 14, fee: 0, status: 'ACTIVE', creatorId: 10, creatorName: '书虫阿明', coverImage: '' },
        { id: 12, title: '户外瑜伽体验', description: '清晨户外瑜伽，在大自然中放松身心，请自带瑜伽垫。', category: 'sports', startTime: '2026-07-21T07:00:00', endTime: '2026-07-21T08:30:00', location: '朝阳公园草坪', maxParticipants: 15, currentParticipants: 6, fee: 15, status: 'ACTIVE', creatorId: 11, creatorName: '瑜伽教练Lisa', coverImage: '' }
    ],
    totalElements: 12,
    totalPages: 2,
    number: 1,
    size: 8
};

var _actCurPage = 0;
var _actCurCat = '';
var _actCurKeyword = '';
var _actCurSort = 'newest';
var _actCurDateFrom = '';
var _actCurDateTo = '';

Router.register('/activities', {
    title: '活动广场',
    requireAuth: true,

    render: function () {
        var catTabsHtml = ACT_CATEGORIES.map(function (c) {
            return '<span class="home-tab' + (c.value === '' ? ' active' : '') + '" data-cat="' + c.value + '">' + c.label + '</span>';
        }).join('');

        return '\
        <div class="home-content">\
            <div class="welcome-card">\
                <h2>活动广场</h2>\
                <p>发现精彩线下活动，遇见志同道合的人</p>\
            </div>\
            <div style="display:flex;gap:8px;margin-bottom:12px;">\
                <div style="flex:1;position:relative;">\
                    <input type="text" id="actSearchInput" placeholder="搜索活动标题..." style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;">\
                </div>\
                <select id="actSort" class="form-input" style="width:110px;flex:none;padding:10px 12px;border-radius:8px;">\
                    <option value="newest">最新发布</option>\
                    <option value="time_asc">即将开始</option>\
                </select>\
            </div>\
            <div class="home-tabs" id="actCatTabs" style="overflow-x:auto;white-space:nowrap;padding-bottom:4px;">' +
                catTabsHtml +
            '</div>\
            <div id="actFeedList" class="home-feed-list">\
                <div class="loading">加载中...</div>\
            </div>\
            <div id="actPagination" style="text-align:center;margin-top:20px;"></div>\
        </div>';
    },

    init: function () {
        _actCurPage = 0;
        _actCurCat = '';
        _actCurKeyword = '';
        _actCurSort = 'newest';
        _actCurDateFrom = '';
        _actCurDateTo = '';

        loadActPage(0);

        document.getElementById('actSearchInput').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') { _actCurKeyword = this.value.trim(); loadActPage(0); }
        });

        document.getElementById('actSort').addEventListener('change', function () {
            _actCurSort = this.value;
            loadActPage(0);
        });

        // 分类 tabs
        document.getElementById('actCatTabs').addEventListener('click', function (e) {
            var tab = e.target.closest('.home-tab');
            if (!tab) return;
            document.querySelectorAll('#actCatTabs .home-tab').forEach(function (t) {
                t.classList.remove('active');
            });
            tab.classList.add('active');
            _actCurCat = tab.getAttribute('data-cat');
            loadActPage(0);
        });
    },

    destroy: function () {}
});

function loadActPage(page) {
    _actCurPage = page;
    _actCurKeyword = document.getElementById('actSearchInput') ? document.getElementById('actSearchInput').value.trim() : '';

    var container = document.getElementById('actFeedList');
    container.innerHTML = '<div class="loading">加载中...</div>';

    loadActivities(_actCurKeyword, _actCurCat, _actCurSort, _actCurDateFrom, _actCurDateTo, page).then(function (result) {
        var data = result.content || [];
        var totalPages = result.totalPages || 1;
        var pageNum = result.number || 0;
        var totalElements = result.totalElements || 0;

        if (!data || data.length === 0) {
            container.innerHTML = '\
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-secondary);">\
                <p style="font-size:48px;margin-bottom:12px;">📭</p>\
                <p style="font-weight:700;">没有找到相关活动</p>\
                <p style="font-size:13px;margin-top:4px;">试试调整搜索条件</p>\
            </div>';
            document.getElementById('actPagination').innerHTML = '';
            return;
        }

        container.innerHTML = data.map(function (a) {
            return renderActCard(a);
        }).join('');

        renderActPagination(pageNum, totalPages);
    }).catch(function (err) {
        container.innerHTML = '\
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--danger);">\
            <p>加载失败: ' + (err.message || '未知错误') + '</p>\
            <button class="btn btn-outline btn-sm" style="margin-top:12px;width:auto;" onclick="loadActPage(0)">重试</button>\
        </div>';
    });
}

async function loadActivities(keyword, category, sort, startFrom, startTo, page) {
    if (ACT_LIST_USE_MOCK) {
        await new Promise(function (r) { return setTimeout(r, 400); });

        var allData = MOCK_ACT_LIST.content.concat(MOCK_ACT_LIST_PAGE2.content);

        var filtered = allData.filter(function (a) {
            if (category) { if (a.category !== category) return false; }
            if (keyword) {
                var kw = keyword.toLowerCase();
                if (a.title.toLowerCase().indexOf(kw) === -1 && a.description.toLowerCase().indexOf(kw) === -1) {
                    return false;
                }
            }
            return true;
        });

        var size = 8;
        var totalElements = filtered.length;
        var totalPages = Math.max(1, Math.ceil(totalElements / size));
        var safePage = Math.min(page, totalPages - 1);
        var start = safePage * size;
        var content = filtered.slice(start, start + size);

        return { content: content, totalElements: totalElements, totalPages: totalPages, number: safePage, size: size };
    }

    var params = { page: page, size: 8, sort: sort };
    if (keyword) params.keyword = keyword;
    if (category) params.category = category;
    if (startFrom) params.startFrom = startFrom + 'T00:00:00';
    if (startTo) params.startTo = startTo + 'T23:59:59';

    var res = await ActivityAPI.list(params);
    return res.data;
}

function getCardStatusBadge(a) {
    var now = Date.now();
    if (a.status === 'CANCELLED') return '<span class="status-badge status-ended">已取消</span>';
    if (a.endTime && now > new Date(a.endTime).getTime()) return '<span class="status-badge status-ended">已结束</span>';
    if (a.startTime && now > new Date(a.startTime).getTime()) return '<span class="status-badge status-active">进行中</span>';
    if (a.registrationDeadline && now > new Date(a.registrationDeadline).getTime()) return '<span class="status-badge status-closed">报名截止</span>';
    if (a.status === 'FULL') return '<span class="status-badge" style="background:#fee2e2;color:#dc2626;">已满员</span>';
    if (a.status === 'ACTIVE') return '<span class="status-badge status-open">报名中</span>';
    return '';
}

function renderActCard(a) {
    var cat = a.category || '';
    var catIcon = ACT_CAT_ICONS[cat] || '📌';
    var catName = ACT_CAT_NAMES[cat] || cat;
    var dateStr = formatActTime(a.startTime, a.endTime);
    var loc = a.location || '';
    var feeStr = a.fee > 0 ? '¥' + a.fee : '免费';
    var badge = getCardStatusBadge(a);
    var desc = a.description || '';
    if (desc.length > 40) desc = desc.substring(0, 40) + '...';

    var coverHtml = a.coverImage
        ? '<img class="home-feed-cover" src="' + escHtmlAct(a.coverImage) + '" alt="" loading="lazy">'
        : '<div class="home-feed-cover placeholder ' + escHtmlAct(cat) + '">' + catIcon + '</div>';

    return '\
    <div class="home-feed-card" onclick="Router.navigate(\'/activity/' + a.id + '\')">\
        ' + coverHtml + '\
        <div class="home-feed-body">\
            <div class="feed-title">' + escHtmlAct(a.title) + '</div>\
            <div class="feed-meta">\
                <span class="home-feed-badge" style="background:#eef2ff;color:#4f46e5;">' + catName + '</span>\
                ' + badge + '\
            </div>\
            <div class="feed-meta">\
                <span>📅 ' + escHtmlAct(dateStr) + '</span>\
                ' + (loc ? '<span>📍 ' + escHtmlAct(loc) + '</span>' : '') + '\
            </div>\
            ' + (desc ? '<div class="feed-desc">' + escHtmlAct(desc) + '</div>' : '') + '\
            <div class="feed-meta">\
                <span>👥 ' + (a.currentParticipants || 0) + '/' + (a.maxParticipants || '∞') + '人</span>\
                <span style="color:var(--primary);font-weight:600;">' + escHtmlAct(feeStr) + '</span>\
            </div>\
        </div>\
    </div>';
}

function renderActPagination(page, totalPages) {
    var container = document.getElementById('actPagination');
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    var html = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;">';
    html += '<button class="btn btn-outline btn-sm" style="width:auto;" ' +
        (page <= 0 ? 'disabled' : '') +
        ' onclick="loadActPage(' + (page - 1) + ')">上一页</button>';
    html += '<span style="padding:0 8px;color:var(--text-secondary);">' + (page + 1) + ' / ' + totalPages + '</span>';
    html += '<button class="btn btn-outline btn-sm" style="width:auto;" ' +
        (page >= totalPages - 1 ? 'disabled' : '') +
        ' onclick="loadActPage(' + (page + 1) + ')">下一页</button>';
    html += '</div>';
    container.innerHTML = html;
}

function formatActTime(start, end) {
    if (!start) return '时间待定';
    var s = new Date(start);
    var e = end ? new Date(end) : null;
    var month = s.getMonth() + 1;
    var day = s.getDate();
    var sh = s.getHours();
    var sm = s.getMinutes();
    if (sm < 10) sm = '0' + sm;
    var dateStr = month + '月' + day + '日 ' + sh + ':' + sm;
    if (e) {
        var eh = e.getHours();
        var em = e.getMinutes();
        if (em < 10) em = '0' + em;
        if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate()) {
            dateStr += ' - ' + eh + ':' + em;
        }
    }
    return dateStr;
}

function escHtmlAct(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
