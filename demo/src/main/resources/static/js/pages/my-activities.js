// ====== 我的活动管理页 ======
// 路由: #/my-activities
// 覆盖故事: US-009 活动克隆

const USE_MOCK_MY_ACT = false;

var MOCK_MY_ACTIVITIES = [
    { id: 1, title: '周末篮球对抗赛', category: 'sports', startTime: '2026-07-05T14:00:00', endTime: '2026-07-05T17:00:00', location: '朝阳公园篮球场', maxParticipants: 20, currentParticipants: 8, fee: 0, status: 'ACTIVE', createdAt: '2026-06-28T10:00:00' },
    { id: 2, title: '桌游狼人杀之夜', category: 'boardgame', startTime: '2026-07-06T19:00:00', endTime: '2026-07-06T22:00:00', location: '三里屯桌游吧', maxParticipants: 12, currentParticipants: 12, fee: 30, status: 'ACTIVE', createdAt: '2026-06-29T09:00:00' },
    { id: 3, title: 'Python学习交流会', category: 'study', startTime: '2026-07-08T10:00:00', endTime: '2026-07-08T12:00:00', location: '中关村创业咖啡', maxParticipants: 15, currentParticipants: 5, fee: 0, status: 'ACTIVE', createdAt: '2026-06-27T15:00:00' }
];

Router.register('/my-activities', {
    title: '我的活动',
    requireAuth: true,

    render: function () {
        return '\
        <div class="home-content">\
            <div class="welcome-card"><h2>我的活动</h2><p>管理你创建的活动，支持克隆复用</p></div>\
            <div id="myActivitiesContainer">\
                <div style="text-align:center;padding:30px;color:var(--text-secondary);">\
                    <p>加载中...</p>\
                </div>\
            </div>\
            <div id="myPagination" style="text-align:center;margin-top:16px;"></div>\
        </div>';
    },

    init: function () {
        loadMyActivities();
    }
});

async function loadMyActivities() {
    var container = document.getElementById('myActivitiesContainer');

    try {
        var data;
        if (USE_MOCK_MY_ACT) {
            data = MOCK_MY_ACTIVITIES;
        } else {
            var res = await api('/activities/my');
            data = res.data;
        }

        if (!data || data.length === 0) {
            container.innerHTML = '\
            <div class="card" style="text-align:center;padding:40px;">\
                <div style="font-size:48px;margin-bottom:12px;">📭</div>\
                <p style="font-weight:700;">还没有创建任何活动</p>\
                <p style="font-size:13px;color:var(--text-secondary);margin:8px 0 16px;">去创建一个吧</p>\
                <button class="btn btn-primary" style="width:auto;" onclick="Router.navigate(\'/ai-create\')">\
                    创建活动\
                </button>\
            </div>';
            document.getElementById('myPagination').innerHTML = '';
            return;
        }

        var html = '';
        for (var i = 0; i < data.length; i++) {
            var a = data[i];
            html += renderMyActivityCard(a);
        }
        container.innerHTML = '<div class="activity-list">' + html + '</div>';

        bindMyCardEvents();
    } catch (err) {
        container.innerHTML = '\
        <div class="card" style="text-align:center;padding:40px;color:var(--danger);">\
            <p>加载失败: ' + (err.message || '未知错误') + '</p>\
            <button class="btn btn-outline btn-sm" style="margin-top:12px;width:auto;" onclick="loadMyActivities()">重试</button>\
        </div>';
    }
}

function renderMyActivityCard(a) {
    var statusMap = { ACTIVE: '报名中', FULL: '已满员', ENDED: '已结束', CANCELLED: '已取消', PENDING: '待审核' };
    var statusClassMap = { ACTIVE: 'success', FULL: 'danger', ENDED: 'secondary', CANCELLED: 'secondary', PENDING: 'warning' };
    var statusLabel = statusMap[a.status] || a.status;
    var statusCls = statusClassMap[a.status] || 'secondary';
    var catLabel = getCatLabelMyAct(a.category);
    var timeStr = a.startTime ? formatMyTime(a.startTime) : '时间待定';

    return '\
    <div class="activity-card my-activity-card" data-id="' + a.id + '">\
        <div class="my-card-header">\
            <span class="title">' + escHtmlMyAct(a.title) + '</span>\
            <span class="status-badge status-' + statusCls + '">' + statusLabel + '</span>\
        </div>\
        <div class="meta" style="margin-top:6px;">\
            <span class="category-tag">' + catLabel + '</span>\
            <span>' + timeStr + '</span>\
            <span>' + (a.location || '') + '</span>\
        </div>\
        <div class="meta" style="margin-top:4px;">\
            <span>已报 ' + a.currentParticipants + '/' + a.maxParticipants + ' 人</span>\
            ' + (a.fee > 0 ? '<span>费用 ' + a.fee + ' 元</span>' : '<span style="color:var(--success);">免费</span>') + '\
        </div>\
        <div class="my-card-actions">\
            <button class="btn btn-outline btn-sm btn-view" data-id="' + a.id + '">查看</button>\
            <button class="btn btn-outline btn-sm btn-clone" data-id="' + a.id + '">克隆</button>\
        </div>\
    </div>';
}

function bindMyCardEvents() {
    var container = document.getElementById('myActivitiesContainer');

    container.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var id = parseInt(btn.dataset.id);

        if (btn.classList.contains('btn-view')) {
            Router.navigate('/activity/' + id);
        }

        if (btn.classList.contains('btn-clone')) {
            doCloneMyActivity(id);
        }
    });
}

async function doCloneMyActivity(id) {
    if (!confirm('确定要克隆这个活动吗？时间字段将被清空，需要重新设置。')) return;

    // 直接跳转到创建页，由创建页读取原始数据填表
    toast('正在加载克隆数据...');
    setTimeout(function () {
        Router.navigate('/create-activity?cloneFrom=' + id);
    }, 300);
}

function escHtmlMyAct(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var CATEGORY_OPTIONS_MY_ACT = [
    { value: 'sports', label: '运动健身' },
    { value: 'hiking', label: '户外徒步' },
    { value: 'boardgame', label: '桌游聚会' },
    { value: 'study', label: '学习交流' },
    { value: 'charity', label: '公益活动' },
    { value: 'citywalk', label: '城市探索' }
];

function getCatLabelMyAct(cat) {
    var found = CATEGORY_OPTIONS_MY_ACT.filter(function (o) { return o.value === cat; });
    return found.length ? found[0].label : cat;
}

function formatMyTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    if (minutes < 10) minutes = '0' + minutes;
    return month + '月' + day + '日 ' + hours + ':' + minutes;
}
