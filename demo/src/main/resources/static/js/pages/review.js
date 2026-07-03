// ====== 活动评价页 (US-023) ======
// 路由 #/activity/:id/review

Router.register('/activity/:id/review', {
    title: '活动评价',
    requireAuth: true,

    render: function() {
        return `
        <div class="home-content">
            <button class="btn btn-outline btn-sm" onclick="Router.navigate('/activity/' + getReviewActivityId())" style="width:auto;margin-bottom:12px;">← 返回活动</button>
            <div class="welcome-card"><h2>活动评价</h2></div>
            <div id="reviewMyCard"></div>
            <div id="reviewListContainer">
                <p style="text-align:center;padding:30px;color:var(--text-secondary);">加载中...</p>
            </div>
            <div id="reviewPagination" style="text-align:center;margin-top:16px;"></div>
        </div>`;
    },

    init: function() {
        var activityId = getReviewActivityId();
        loadReviews(activityId);
        loadAvgRating(activityId);
    }
});

function getReviewActivityId() {
    var hash = window.location.hash;
    var parts = hash.split('/');
    return parts[parts.length - 2];
}

var _reviewPage = 0;
var _reviewActivityId = 0;

async function loadReviews(activityId) {
    _reviewActivityId = activityId;
    try {
        var res = await ReviewAPI.list(activityId, _reviewPage);
        var page = res.data;
        var html = '';

        if (!page.content || page.content.length === 0) {
            document.getElementById('reviewListContainer').innerHTML =
                '<div class="card" style="text-align:center;padding:30px;color:var(--text-secondary);">暂无评价</div>';
            document.getElementById('reviewPagination').innerHTML = '';
            return;
        }

        for (var i = 0; i < page.content.length; i++) {
            html += renderReviewCard(page.content[i]);
        }
        document.getElementById('reviewListContainer').innerHTML = html;

        var pagHtml = '';
        if (page.totalPages > 1) {
            pagHtml += '<button class="btn btn-outline btn-sm" ' + (_reviewPage === 0 ? 'disabled' : '') +
                ' onclick="changeReviewPage(' + (_reviewPage - 1) + ')" style="width:auto;">上一页</button> ';
            pagHtml += '<span style="font-size:13px;color:var(--text-secondary);">第' + (_reviewPage + 1) + '/' + page.totalPages + '页</span> ';
            pagHtml += '<button class="btn btn-outline btn-sm" ' + (_reviewPage >= page.totalPages - 1 ? 'disabled' : '') +
                ' onclick="changeReviewPage(' + (_reviewPage + 1) + ')" style="width:auto;">下一页</button>';
        }
        document.getElementById('reviewPagination').innerHTML = pagHtml;
    } catch (err) {
        document.getElementById('reviewListContainer').innerHTML =
            '<div class="card" style="text-align:center;padding:30px;color:var(--danger);">加载失败: ' + (err.message || '未知错误') + '</div>';
    }
}

function changeReviewPage(page) {
    _reviewPage = page;
    loadReviews(_reviewActivityId);
}

async function loadAvgRating(activityId) {
    try {
        var res = await ReviewAPI.avg(activityId);
        var d = res.data;
        var starsHtml = '';
        var avg = Math.round(d.avgRating || 0);
        for (var i = 0; i < 5; i++) {
            starsHtml += '<span style="color:' + (i < avg ? '#f5a623' : '#ddd') + ';font-size:22px;">' + (i < avg ? '★' : '☆') + '</span>';
        }

        var curUser = getCurUser();
        document.getElementById('reviewMyCard').innerHTML = `
            <div class="card" style="text-align:center;">
                <div style="margin-bottom:8px;">${starsHtml}</div>
                <p style="font-size:14px;color:var(--text-secondary);">${(d.avgRating || 0).toFixed(1)} 分 · ${d.totalCount} 条评价</p>
                <button class="btn btn-primary btn-sm" style="width:auto;margin-top:12px;" onclick="showReviewForm()">写评价</button>
                <div id="reviewForm" style="display:none;margin-top:16px;text-align:left;">
                    <div style="margin-bottom:8px;">
                        <label style="font-size:13px;font-weight:600;">评分</label>
                        <div id="starSelector" style="font-size:28px;cursor:pointer;user-select:none;">
                            <span data-v="1" onclick="setStar(1)">☆</span>
                            <span data-v="2" onclick="setStar(2)">☆</span>
                            <span data-v="3" onclick="setStar(3)">☆</span>
                            <span data-v="4" onclick="setStar(4)">☆</span>
                            <span data-v="5" onclick="setStar(5)">☆</span>
                        </div>
                    </div>
                    <textarea id="reviewContent" placeholder="分享你的活动体验（选填，最多500字）" maxlength="500"
                        style="width:100%;min-height:80px;padding:10px;border:1px solid var(--border);border-radius:var(--radius);resize:vertical;font-size:14px;"></textarea>
                    <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
                        <button class="btn btn-outline btn-sm" onclick="hideReviewForm()" style="width:auto;">取消</button>
                        <button class="btn btn-primary btn-sm" id="submitReviewBtn" onclick="submitReview()" style="width:auto;">提交评价</button>
                    </div>
                </div>
            </div>`;
    } catch (err) {
        document.getElementById('reviewMyCard').innerHTML = '';
    }
}

var _myRating = 0;

function showReviewForm() {
    document.getElementById('reviewForm').style.display = 'block';
    _myRating = 0;
    updateStars();
}

function hideReviewForm() {
    document.getElementById('reviewForm').style.display = 'none';
}

function setStar(v) {
    _myRating = v;
    updateStars();
}

function updateStars() {
    var spans = document.getElementById('starSelector').querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) {
        var v = parseInt(spans[i].getAttribute('data-v'));
        spans[i].textContent = v <= _myRating ? '★' : '☆';
        spans[i].style.color = v <= _myRating ? '#f5a623' : '#ddd';
    }
}

async function submitReview() {
    if (_myRating === 0) {
        toast('请选择评分', 'error');
        return;
    }
    var btn = document.getElementById('submitReviewBtn');
    btn.disabled = true;
    btn.textContent = '提交中...';

    try {
        var content = document.getElementById('reviewContent').value.trim();
        await ReviewAPI.create(_reviewActivityId, { rating: _myRating, content: content });
        toast('评价成功！');
        hideReviewForm();
        _reviewPage = 0;
        loadReviews(_reviewActivityId);
        loadAvgRating(_reviewActivityId);
    } catch (err) {
        toast(err.message || '评价失败', 'error');
        btn.disabled = false;
        btn.textContent = '提交评价';
    }
}

function renderReviewCard(r) {
    var stars = '';
    for (var i = 0; i < 5; i++) { stars += i < (r.rating || 0) ? '★' : '☆'; }
    var avatarHtml = r.userAvatar
        ? '<img src="' + r.userAvatar + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">'
        : '<div style="width:28px;height:28px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">' +
          (r.userNickname ? r.userNickname.charAt(0) : '?') + '</div>';

    return `
    <div class="card" style="margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            ${avatarHtml}
            <span style="font-weight:600;font-size:14px;">${r.userNickname || '匿名'}</span>
            <span style="color:#f5a623;font-size:14px;margin-left:auto;">${stars}</span>
        </div>
        ${r.content ? '<p style="font-size:14px;line-height:1.6;color:var(--text-secondary);white-space:pre-wrap;">' + (r.content) + '</p>' : ''}
        ${r.createdAt ? '<p style="font-size:11px;color:var(--text-secondary);margin-top:8px;">' + (r.createdAt).replace('T', ' ').substring(0, 16) + '</p>' : ''}
    </div>`;
}
