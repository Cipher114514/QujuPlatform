// ====== 活动广场 ======
// 路由: #/activities
// 功能: 活动信息流 + 搜索 + 筛选 + 分页

const ACT_LIST_USE_MOCK = false;

var ACT_CATEGORIES = [
    { value: '', label: '全部分类' },
    { value: 'sports', label: '运动健身' },
    { value: 'hiking', label: '户外徒步' },
    { value: 'boardgame', label: '桌游聚会' },
    { value: 'study', label: '学习交流' },
    { value: 'charity', label: '公益活动' },
    { value: 'citywalk', label: '城市探索' }
];

var ACT_SORT_OPTIONS = [
    { value: 'newest',   label: '最新发布' },
    { value: 'time_asc', label: '即将开始' },
    { value: 'creator',  label: '按发起者' }
];

var ACT_CAT_LABEL = {};
for (var i = 0; i < ACT_CATEGORIES.length; i++) {
    ACT_CAT_LABEL[ACT_CATEGORIES[i].value] = ACT_CATEGORIES[i].label;
}

var MOCK_ACT_LIST = {
    content: [
        { id: 1, title: '周末篮球对抗赛', description: '一起参与周末篮球运动，强身健体，结交运动伙伴！无论新手老手都能找到乐趣。', category: 'sports', tags: '运动,健身,户外', startTime: '2026-07-12T14:00:00', endTime: '2026-07-12T17:00:00', location: '朝阳公园篮球场', maxParticipants: 20, currentParticipants: 8, fee: 0, status: 'ACTIVE', creatorId: 1, creatorName: '运动达人小王', coverImage: '' },
        { id: 2, title: '香山徒步之旅', description: '周末香山徒步，全程约8公里，沿途欣赏自然风光，适合初级户外爱好者。', category: 'hiking', tags: '户外,徒步,自然', startTime: '2026-07-13T08:00:00', endTime: '2026-07-13T15:00:00', location: '香山公园东门', maxParticipants: 15, currentParticipants: 12, fee: 10, status: 'ACTIVE', creatorId: 2, creatorName: '户外探险家', coverImage: '' },
        { id: 3, title: '狼人杀桌游局', description: '每周固定桌游局，新手友好，有教学环节。提供多种桌游选择。', category: 'boardgame', tags: '桌游,聚会,社交', startTime: '2026-07-12T19:00:00', endTime: '2026-07-12T22:00:00', location: '三里屯桌游吧', maxParticipants: 12, currentParticipants: 12, fee: 30, status: 'ACTIVE', creatorId: 3, creatorName: '桌游达人', coverImage: '' },
        { id: 4, title: 'Python学习交流会', description: 'Python主题学习交流，分享编程经验，互相成长。适合有一定编程基础的同学。', category: 'study', tags: '学习,交流,编程', startTime: '2026-07-15T10:00:00', endTime: '2026-07-15T12:00:00', location: '中关村创业咖啡', maxParticipants: 15, currentParticipants: 5, fee: 0, status: 'ACTIVE', creatorId: 4, creatorName: '编程爱好者', coverImage: '' },
        { id: 5, title: '社区环保公益行动', description: '社区环保公益活动，清理公园垃圾，用行动传递温暖。提供工具和饮用水。', category: 'charity', tags: '公益,志愿,环保', startTime: '2026-07-14T09:00:00', endTime: '2026-07-14T12:00:00', location: '奥林匹克公园', maxParticipants: 30, currentParticipants: 18, fee: 0, status: 'ACTIVE', creatorId: 5, creatorName: '公益先锋', coverImage: '' },
        { id: 6, title: '胡同城市漫步', description: '漫步老北京胡同，发现城市隐藏的美，品尝地道小吃，了解胡同文化。', category: 'citywalk', tags: '城市,探索,美食,文化', startTime: '2026-07-13T14:00:00', endTime: '2026-07-13T17:30:00', location: '南锣鼓巷地铁站', maxParticipants: 10, currentParticipants: 7, fee: 50, status: 'ACTIVE', creatorId: 6, creatorName: '城市探索者', coverImage: '' },
        { id: 7, title: '羽毛球双打友谊赛', description: '羽毛球双打友谊赛，随机组队，重在参与。球拍可自带也可现场租用。', category: 'sports', tags: '运动,羽毛球,社交', startTime: '2026-07-16T18:00:00', endTime: '2026-07-16T21:00:00', location: '海淀体育馆', maxParticipants: 16, currentParticipants: 4, fee: 20, status: 'ACTIVE', creatorId: 1, creatorName: '运动达人小王', coverImage: '' },
        { id: 8, title: '摄影外拍活动', description: '城市风光摄影外拍，交流拍摄技巧，分享后期经验。不限器材，手机也可参加。', category: 'citywalk', tags: '摄影,城市,艺术', startTime: '2026-07-17T15:00:00', endTime: '2026-07-17T18:30:00', location: '798艺术区', maxParticipants: 20, currentParticipants: 11, fee: 0, status: 'ACTIVE', creatorId: 7, creatorName: '摄影师老张', coverImage: '' }
    ],
    totalElements: 12,
    totalPages: 2,
    number: 0,
    size: 8
};

var MOCK_ACT_LIST_PAGE2 = {
    content: [
        { id: 9, title: '周末骑行活动', description: '周末城市绿道骑行，全程约20公里，适合休闲骑行。提供路线指引和补给。', category: 'sports', tags: '骑行,户外,运动', startTime: '2026-07-19T08:00:00', endTime: '2026-07-19T12:00:00', location: '奥森公园南门', maxParticipants: 20, currentParticipants: 9, fee: 0, status: 'ACTIVE', creatorId: 8, creatorName: '骑行爱好者', coverImage: '' },
        { id: 10, title: '日语角交流活动', description: '日语爱好者交流聚会，分初级和高级组。自由对话，互相学习。', category: 'study', tags: '语言,交流,日语', startTime: '2026-07-18T19:00:00', endTime: '2026-07-18T21:00:00', location: '五道口咖啡厅', maxParticipants: 25, currentParticipants: 16, fee: 0, status: 'ACTIVE', creatorId: 9, creatorName: '日语爱好者', coverImage: '' },
        { id: 11, title: '读书分享会', description: '本月读书分享会主题：《人类简史》，欢迎读过和想读的朋友一起讨论。', category: 'study', tags: '读书,交流,人文', startTime: '2026-07-20T14:00:00', endTime: '2026-07-20T16:00:00', location: 'PageOne书店', maxParticipants: 20, currentParticipants: 14, fee: 0, status: 'ACTIVE', creatorId: 10, creatorName: '书虫阿明', coverImage: '' },
        { id: 12, title: '户外瑜伽体验', description: '清晨户外瑜伽，在大自然中放松身心。适合所有水平，请自带瑜伽垫。', category: 'sports', tags: '瑜伽,户外,健康', startTime: '2026-07-21T07:00:00', endTime: '2026-07-21T08:30:00', location: '朝阳公园草坪', maxParticipants: 15, currentParticipants: 6, fee: 15, status: 'ACTIVE', creatorId: 11, creatorName: '瑜伽教练Lisa', coverImage: '' }
    ],
    totalElements: 12,
    totalPages: 2,
    number: 1,
    size: 8
};

Router.register('/activities', {
    title: '活动广场',
    requireAuth: true,

    render: function () {
        return '\
        <div class="discover-page">\
            <div class="discover-header">\
                <h1>活动广场</h1>\
                <p class="subtitle">发现精彩线下活动，遇见志同道合的人</p>\
            </div>\
            <div class="search-section">\
                <div class="search-box">\
                    <input type="text" id="actSearchInput" placeholder="搜索活动标题或描述..." />\
                    <select id="actCategoryFilter" class="form-input" style="width:140px;flex:none;">' +
            ACT_CATEGORIES.map(function (c) {
                return '<option value="' + c.value + '">' + c.label + '</option>';
            }).join('') +
            '</select>\
                    <select id="actSort" class="form-input" style="width:120px;flex:none;">' +
            ACT_SORT_OPTIONS.map(function (s) {
                return '<option value="' + s.value + '">' + s.label + '</option>';
            }).join('') +
            '</select>\
                    <button id="actSearchBtn">搜索</button>\
                </div>\
                <div class="search-box" style="margin-top:8px;">\
                    <input type="date" id="actDateFrom" class="form-input" style="width:140px;flex:none;" title="开始时间起点">\
                    <span style="color:var(--text-secondary);font-size:13px;line-height:36px;">至</span>\
                    <input type="date" id="actDateTo" class="form-input" style="width:140px;flex:none;" title="开始时间终点">\
                </div>\
            </div>\
            <div id="actListContainer">\
                <div style="text-align:center;padding:30px;color:var(--text-secondary);">\
                    <p>加载中...</p>\
                </div>\
            </div>\
            <div id="actPagination" style="text-align:center;margin-top:20px;"></div>\
        </div>';
    },

    init: function () {
        loadPage(0);

        document.getElementById('actSearchInput').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') loadPage(0);
        });

        document.getElementById('actSearchBtn').addEventListener('click', function () {
            loadPage(0);
        });

        document.getElementById('actSort').addEventListener('change', function () {
            loadPage(0);
        });
    },

    destroy: function () {
        // cleanup handled by DOM replacement
    }
});

function loadPage(page) {
    var keyword = '';
    var category = '';

    var searchInput = document.getElementById('actSearchInput');
    var catFilter = document.getElementById('actCategoryFilter');
    var sortEl = document.getElementById('actSort');
    var dateFrom = document.getElementById('actDateFrom');
    var dateTo = document.getElementById('actDateTo');
    if (searchInput) keyword = searchInput.value.trim();
    if (catFilter) category = catFilter.value;
    var sort = sortEl ? sortEl.value : 'newest';
    var startFrom = dateFrom ? dateFrom.value : '';
    var startTo = dateTo ? dateTo.value : '';

    var container = document.getElementById('actListContainer');
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-secondary);"><p>加载中...</p></div>';

    loadActivities(keyword, category, sort, startFrom, startTo, page).then(function (result) {
        var data = result.content || [];
        var totalPages = result.totalPages || 1;
        var pageNum = result.number || 0;
        var totalElements = result.totalElements || 0;

        if (!data || data.length === 0) {
            container.innerHTML = '\
            <div class="empty-state" style="display:block;text-align:center;padding:60px 20px;color:var(--text-secondary);">\
                <p style="font-size:48px;margin-bottom:12px;">📭</p>\
                <p style="font-weight:700;">没有找到相关活动</p>\
                <p style="font-size:13px;margin-top:4px;">试试调整搜索条件</p>\
            </div>';
            document.getElementById('actPagination').innerHTML = '';
            return;
        }

        var html = '<div class="section-title"><span>' +
            (keyword || category ? '搜索结果' : '全部活动') +
            ' (' + totalElements + ')</span></div>';
        html += '<div class="activity-list">';
        for (var i = 0; i < data.length; i++) {
            html += renderActCard(data[i]);
        }
        html += '</div>';
        container.innerHTML = html;

        renderPagination(pageNum, totalPages, keyword, category, sort, startFrom, startTo);
    }).catch(function (err) {
        container.innerHTML = '\
        <div class="empty-state" style="display:block;text-align:center;padding:40px;color:var(--danger);">\
            <p>加载失败: ' + (err.message || '未知错误') + '</p>\
            <button class="btn btn-outline btn-sm" style="margin-top:12px;width:auto;" onclick="loadPage(0)">重试</button>\
        </div>';
    });
}

async function loadActivities(keyword, category, sort, startFrom, startTo, page) {
    if (ACT_LIST_USE_MOCK) {
        await new Promise(function (r) { return setTimeout(r, 400); });

        var allData = MOCK_ACT_LIST.content.concat(MOCK_ACT_LIST_PAGE2.content);

        // filter
        var filtered = allData.filter(function (a) {
            if (category) {
                if (a.category !== category) return false;
            }
            if (keyword) {
                var kw = keyword.toLowerCase();
                if (a.title.toLowerCase().indexOf(kw) === -1 && a.description.toLowerCase().indexOf(kw) === -1) {
                    return false;
                }
            }
            if (startFrom) {
                var sf = new Date(startFrom).getTime();
                if (new Date(a.startTime).getTime() < sf) return false;
            }
            if (startTo) {
                var st = new Date(startTo + 'T23:59:59').getTime();
                if (new Date(a.startTime).getTime() > st) return false;
            }
            return true;
        });

        var size = 8;
        var totalElements = filtered.length;
        var totalPages = Math.max(1, Math.ceil(totalElements / size));
        var safePage = Math.min(page, totalPages - 1);
        var start = safePage * size;
        var content = filtered.slice(start, start + size);

        return {
            content: content,
            totalElements: totalElements,
            totalPages: totalPages,
            number: safePage,
            size: size
        };
    }

    var params = { page: page, size: 8, sort: sort };
    if (keyword) params.keyword = keyword;
    if (category) params.category = category;
    if (startFrom) params.startFrom = startFrom + 'T00:00:00';
    if (startTo) params.startTo = startTo + 'T23:59:59';

    var res = await ActivityAPI.list(params);
    return res.data;
}

function renderActCard(a) {
    var catLabel = ACT_CAT_LABEL[a.category] || a.category;
    var timeStr = formatActTime(a.startTime, a.endTime);
    var feeStr = a.fee > 0 ? '¥' + a.fee : '免费';
    var feeCls = a.fee > 0 ? '' : 'style="color:var(--success);"';
    var participantPercent = a.maxParticipants > 0 ? Math.round(a.currentParticipants / a.maxParticipants * 100) : 0;
    var desc = a.description || '';
    if (desc.length > 60) desc = desc.substring(0, 60) + '...';

    return '\
    <div class="activity-card" onclick="Router.navigate(\'/activity/' + a.id + '\')" style="cursor:pointer;">\
        <div class="title">' + escHtmlAct(a.title) + '</div>\
        <div class="meta" style="margin-top:6px;">\
            <span class="category-tag">' + catLabel + '</span>\
            <span>' + timeStr + '</span>\
        </div>\
        <div class="meta" style="margin-top:4px;">\
            <span>' + escHtmlAct(a.location || '地点待定') + '</span>\
            <span ' + feeCls + '>' + feeStr + '</span>\
        </div>\
        <div style="font-size:13px;color:var(--text-secondary);margin-top:6px;">' + escHtmlAct(desc) + '</div>\
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">\
            <div style="flex:1;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">\
                <div style="height:100%;width:' + participantPercent + '%;background:' + (participantPercent >= 100 ? 'var(--danger)' : 'var(--primary)') + ';border-radius:3px;transition:width .3s;"></div>\
            </div>\
            <span style="font-size:12px;color:var(--text-secondary);white-space:nowrap;">' + a.currentParticipants + '/' + a.maxParticipants + '人</span>\
        </div>\
        <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;">\
            发起人: ' + escHtmlAct(a.creatorName || '未知') + '\
        </div>\
    </div>';
}

function renderPagination(page, totalPages, keyword, category, sort, startFrom, startTo) {
    var container = document.getElementById('actPagination');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    var html = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;">';

    // 上一页
    html += '<button class="btn btn-outline btn-sm" style="width:auto;" ' +
        (page <= 0 ? 'disabled' : '') +
        ' onclick="goToActPage(' + (page - 1) + ',\'' + escHtmlAct(keyword) + '\',\'' + escHtmlAct(category) + '\',\'' + escHtmlAct(sort) + '\',\'' + escHtmlAct(startFrom) + '\',\'' + escHtmlAct(startTo) + '\')">上一页</button>';

    html += '<span style="padding:0 8px;color:var(--text-secondary);">' + (page + 1) + ' / ' + totalPages + '</span>';

    // 下一页
    html += '<button class="btn btn-outline btn-sm" style="width:auto;" ' +
        (page >= totalPages - 1 ? 'disabled' : '') +
        ' onclick="goToActPage(' + (page + 1) + ',\'' + escHtmlAct(keyword) + '\',\'' + escHtmlAct(category) + '\',\'' + escHtmlAct(sort) + '\',\'' + escHtmlAct(startFrom) + '\',\'' + escHtmlAct(startTo) + '\')">下一页</button>';

    html += '</div>';
    container.innerHTML = html;
}

function goToActPage(page, keyword, category, sort, startFrom, startTo) {
    var searchInput = document.getElementById('actSearchInput');
    var catFilter = document.getElementById('actCategoryFilter');
    var sortEl = document.getElementById('actSort');
    var dateFrom = document.getElementById('actDateFrom');
    var dateTo = document.getElementById('actDateTo');
    if (searchInput) searchInput.value = keyword;
    if (catFilter) catFilter.value = category;
    if (sortEl) sortEl.value = sort;
    if (dateFrom) dateFrom.value = startFrom;
    if (dateTo) dateTo.value = startTo;
    loadPage(page);
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

    var dateStr = month + '/' + day + ' ' + sh + ':' + sm;

    if (e) {
        var eh = e.getHours();
        var em = e.getMinutes();
        if (em < 10) em = '0' + em;
        // same day check
        if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate()) {
            dateStr += '-' + eh + ':' + em;
        }
    }
    return dateStr;
}

function escHtmlAct(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
