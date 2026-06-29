// ====== 活动广场：US-012 首页活动信息流 + US-013 多条件搜索 ======
(function() {
    var state = {
        page: 0,
        size: 8,
        loading: false,
        last: false,
        filters: {}
    };

    Router.register('/activities', {
        title: '活动广场',
        requireAuth: false,

        render: function() {
            return `
            <div class="activity-page">
                <section class="activity-hero">
                    <div>
                        <h1>活动广场</h1>
                        <p>浏览平台已发布活动，按关键词、时间和标签快速筛选。</p>
                    </div>
                    <button class="btn btn-outline btn-sm" id="activityResetBtn" type="button">重置</button>
                </section>

                <section class="activity-toolbar" aria-label="活动筛选">
                    <div class="activity-search">
                        <input id="activityKeyword" type="search" placeholder="搜索标题或简介" autocomplete="off">
                        <button id="activitySearchBtn" class="btn btn-primary" type="button">搜索</button>
                    </div>
                    <div class="activity-filters">
                        <select id="activityCategory" aria-label="活动分类">
                            <option value="">全部分类</option>
                            <option value="sports">运动健身</option>
                            <option value="hiking">户外徒步</option>
                            <option value="boardgame">桌游聚会</option>
                            <option value="study">学习交流</option>
                            <option value="charity">公益活动</option>
                            <option value="citywalk">城市探索</option>
                        </select>
                        <input id="activityTag" type="text" placeholder="标签，如：户外">
                        <input id="activityStartFrom" type="date" aria-label="开始日期从">
                        <input id="activityStartTo" type="date" aria-label="开始日期至">
                    </div>
                </section>

                <div id="activityList" class="activity-masonry"></div>
                <div id="activityEmpty" class="activity-empty" hidden>未找到相关活动</div>
                <div class="activity-load">
                    <button id="activityMoreBtn" class="btn btn-outline" type="button">加载更多</button>
                </div>
            </div>`;
        },

        init: function() {
            bindEvents();
            resetAndLoad();
        }
    });

    function bindEvents() {
        document.getElementById('activitySearchBtn').addEventListener('click', resetAndLoad);
        document.getElementById('activityMoreBtn').addEventListener('click', loadActivities);
        document.getElementById('activityResetBtn').addEventListener('click', function() {
            ['activityKeyword', 'activityCategory', 'activityTag', 'activityStartFrom', 'activityStartTo'].forEach(function(id) {
                document.getElementById(id).value = '';
            });
            resetAndLoad();
        });
        document.getElementById('activityKeyword').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') resetAndLoad();
        });
        ['activityCategory', 'activityStartFrom', 'activityStartTo'].forEach(function(id) {
            document.getElementById(id).addEventListener('change', resetAndLoad);
        });
    }

    function collectFilters() {
        var startFrom = document.getElementById('activityStartFrom').value;
        var startTo = document.getElementById('activityStartTo').value;
        return {
            keyword: document.getElementById('activityKeyword').value.trim(),
            category: document.getElementById('activityCategory').value,
            tag: document.getElementById('activityTag').value.trim(),
            startFrom: startFrom ? startFrom + 'T00:00:00' : '',
            startTo: startTo ? startTo + 'T23:59:59' : ''
        };
    }

    function resetAndLoad() {
        state.page = 0;
        state.last = false;
        state.filters = collectFilters();
        document.getElementById('activityList').innerHTML = '';
        document.getElementById('activityEmpty').hidden = true;
        loadActivities();
    }

    async function loadActivities() {
        if (state.loading || state.last) return;
        state.loading = true;
        setMoreButton('加载中...', true);

        try {
            var res = await ActivityAPI.list(Object.assign({}, state.filters, {
                page: state.page,
                size: state.size
            }));
            var data = res.data || {};
            var items = data.content || [];
            renderActivities(items);
            state.last = !!data.last;
            state.page += 1;
            document.getElementById('activityEmpty').hidden = document.getElementById('activityList').children.length > 0;
            setMoreButton(state.last ? '没有更多活动' : '加载更多', state.last);
        } catch (err) {
            toast(err.message || '活动加载失败', 'error');
            setMoreButton('重新加载', false);
        } finally {
            state.loading = false;
        }
    }

    function renderActivities(items) {
        var list = document.getElementById('activityList');
        items.forEach(function(item) {
            list.insertAdjacentHTML('beforeend', renderCard(item));
        });
    }

    function renderCard(item) {
        var tags = splitTags(item.tags).map(function(tag) {
            return '<span class="activity-tag">' + escapeHtml(tag) + '</span>';
        }).join('');

        return `
        <article class="activity-feed-card">
            <div class="activity-card-top">
                <span class="category-tag">${categoryName(item.category)}</span>
                <span>${formatFee(item.fee)}</span>
            </div>
            <h2>${escapeHtml(item.title || '')}</h2>
            <p class="activity-desc">${escapeHtml(item.description || '')}</p>
            <div class="activity-meta">
                <span>时间：${formatDateTime(item.startTime)}</span>
                <span>地点：${escapeHtml(item.location || '待定')}</span>
                <span>发起人：${escapeHtml(item.creatorName || '未知发起人')}</span>
                <span>人数：${item.currentParticipants || 0}/${item.maxParticipants || 0}</span>
            </div>
            <div class="activity-tags">${tags}</div>
        </article>`;
    }

    function setMoreButton(text, disabled) {
        var btn = document.getElementById('activityMoreBtn');
        if (!btn) return;
        btn.textContent = text;
        btn.disabled = disabled;
    }

    function splitTags(tags) {
        if (!tags) return [];
        return tags.split(/[,，]/).map(function(tag) { return tag.trim(); }).filter(Boolean).slice(0, 4);
    }

    function categoryName(value) {
        var names = {
            sports: '运动健身',
            hiking: '户外徒步',
            boardgame: '桌游聚会',
            study: '学习交流',
            charity: '公益活动',
            citywalk: '城市探索'
        };
        return names[value] || value || '活动';
    }

    function formatDateTime(value) {
        if (!value) return '待定';
        var date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatFee(value) {
        var n = Number(value || 0);
        return n > 0 ? '¥' + n.toFixed(2) : '免费';
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
