// ====== 草稿箱页面 ======
// 路由: #/drafts
// 覆盖故事: US-008 活动全量草稿箱暂存与重新编辑

const DRAFTS_USE_MOCK = false;

var MOCK_DRAFTS = [
    { id: 1, title: '周末篮球局（草稿）', category: 'sports', location: '朝阳公园', maxParticipants: 20, fee: 0, status: 'DRAFT', updatedAt: '2026-07-01T10:30:00' },
    { id: 2, title: '桌游之夜', category: 'boardgame', location: '', maxParticipants: 12, fee: 30, status: 'DRAFT', updatedAt: '2026-07-01T09:00:00' }
];

Router.register('/drafts', {
    title: '草稿箱',
    requireAuth: true,

    render: function () {
        return '\
        <div class="home-content">\
            <div class="welcome-card"><h2>草稿箱</h2><p>管理未完成的草稿，可随时继续编辑</p></div>\
            <div id="draftsContainer">\
                <div style="text-align:center;padding:30px;color:var(--text-secondary);">\
                    <p>加载中...</p>\
                </div>\
            </div>\
        </div>';
    },

    init: function () {
        loadDrafts();
    }
});

async function loadDrafts() {
    var container = document.getElementById('draftsContainer');

    try {
        var data;
        if (DRAFTS_USE_MOCK) {
            data = MOCK_DRAFTS;
        } else {
            var res = await api('/activities/drafts');
            data = res.data;
        }

        if (!data || data.length === 0) {
            container.innerHTML = '\
            <div class="card" style="text-align:center;padding:40px;">\
                <div style="font-size:48px;margin-bottom:12px;">📭</div>\
                <p style="font-weight:700;">草稿箱是空的</p>\
                <p style="font-size:13px;color:var(--text-secondary);margin:8px 0 16px;">创建活动时选择"存为草稿"即可保存到这里</p>\
                <button class="btn btn-primary" style="width:auto;" onclick="Router.navigate(\'/create-activity\')">\
                    去创建活动\
                </button>\
            </div>';
            return;
        }

        var html = '';
        for (var i = 0; i < data.length; i++) {
            html += renderDraftCard(data[i]);
        }
        container.innerHTML = '<div class="activity-list">' + html + '</div>';
        bindDraftEvents();
    } catch (err) {
        container.innerHTML = '\
        <div class="card" style="text-align:center;padding:40px;color:var(--danger);">\
            <p>加载失败: ' + (err.message || '未知错误') + '</p>\
            <button class="btn btn-outline btn-sm" style="margin-top:12px;width:auto;" onclick="loadDrafts()">重试</button>\
        </div>';
    }
}

function renderDraftCard(d) {
    var catLabel = getDraftCatLabel(d.category);
    var timeStr = d.updatedAt ? formatDraftTime(d.updatedAt) : '';

    return '\
    <div class="activity-card draft-card" data-id="' + d.id + '">\
        <div class="draft-header">\
            <span class="title">' + escDraft(d.title || '未命名草稿') + '</span>\
            <span class="status-badge status-warning">草稿</span>\
        </div>\
        <div class="meta" style="margin-top:6px;">\
            ' + (catLabel ? '<span class="category-tag">' + catLabel + '</span>' : '') + '\
            ' + (d.location ? '<span>' + escDraft(d.location) + '</span>' : '<span style="color:var(--text-secondary);">地点未填写</span>') + '\
            ' + (timeStr ? '<span>' + timeStr + '</span>' : '') + '\
        </div>\
        <div class="meta" style="margin-top:4px;">\
            <span>' + (d.maxParticipants || 20) + ' 人上限</span>\
            ' + (d.fee > 0 ? '<span>' + d.fee + ' 元</span>' : '<span style="color:var(--success);">免费</span>') + '\
        </div>\
        <div class="my-card-actions">\
            <button class="btn btn-primary btn-sm btn-edit-draft" data-id="' + d.id + '">继续编辑</button>\
            <button class="btn btn-outline btn-sm btn-delete-draft" data-id="' + d.id + '" style="color:var(--danger);border-color:var(--danger);">删除</button>\
        </div>\
    </div>';
}

function bindDraftEvents() {
    var container = document.getElementById('draftsContainer');
    container.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var id = parseInt(btn.dataset.id);

        if (btn.classList.contains('btn-edit-draft')) {
            Router.navigate('/create-activity?editDraft=' + id);
        }
        if (btn.classList.contains('btn-delete-draft')) {
            deleteDraft(id);
        }
    });
}

async function deleteDraft(id) {
    if (!confirm('确定要删除这个草稿吗？此操作不可恢复。')) return;

    try {
        if (DRAFTS_USE_MOCK) {
            toast('草稿已删除（Mock）');
        } else {
            await api('/activities/' + id, { method: 'DELETE' });
        }
        toast('草稿已删除');
        loadDrafts();
    } catch (err) {
        toast(err.message || '删除失败', 'error');
    }
}

function escDraft(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var DRAFT_CAT_OPTIONS = [
    { value: 'sports', label: '运动健身' },
    { value: 'hiking', label: '户外徒步' },
    { value: 'boardgame', label: '桌游聚会' },
    { value: 'study', label: '学习交流' },
    { value: 'charity', label: '公益活动' },
    { value: 'citywalk', label: '城市探索' }
];

function getDraftCatLabel(cat) {
    var found = DRAFT_CAT_OPTIONS.filter(function (o) { return o.value === cat; });
    return found.length ? found[0].label : cat;
}

function formatDraftTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    if (minutes < 10) minutes = '0' + minutes;
    return month + '月' + day + '日 ' + hours + ':' + minutes;
}
