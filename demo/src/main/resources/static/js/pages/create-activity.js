// ====== 创建活动页（US-006: 文本创建活动基础版） ======
// 负责：P1 | 路径：#/create-activity | 对应故事：US-006

var CREATE_USE_MOCK = false;  // 独立开发时改为 true

Router.register('/create-activity', {
    title: '创建活动',
    requireAuth: true,

    render: function() {
        var draft = loadDraft();
        return `
        <div class="container" style="max-width:600px;">
            <div class="header">
                <div class="logo">📝</div>
                <h1>创建活动</h1>
                <p>填写活动信息，发布即上架</p>
            </div>
            <div id="createAlert" class="alert"></div>
            <div class="card">
                <form id="createForm">
                    <!-- 活动名称 -->
                    <div class="form-group">
                        <label>活动名称 <span style="color:var(--danger);">*</span></label>
                        <input type="text" id="actTitle" placeholder="给活动起个名字" maxlength="30"
                            value="${escHtml(draft.title || '')}">
                        <div class="hint"><span id="titleCount">${(draft.title || '').length}</span>/30</div>
                        <div class="error-msg" id="errTitle"></div>
                    </div>

                    <!-- 活动分类 -->
                    <div class="form-group">
                        <label>活动分类 <span style="color:var(--danger);">*</span></label>
                        <select id="actCategory">
                            <option value="">请选择分类</option>
                            <option value="运动健身" ${draft.category==='运动健身'?'selected':''}>运动健身</option>
                            <option value="户外徒步" ${draft.category==='户外徒步'?'selected':''}>户外徒步</option>
                            <option value="桌游聚会" ${draft.category==='桌游聚会'?'selected':''}>桌游聚会</option>
                            <option value="学习交流" ${draft.category==='学习交流'?'selected':''}>学习交流</option>
                            <option value="公益活动" ${draft.category==='公益活动'?'selected':''}>公益活动</option>
                            <option value="城市探索" ${draft.category==='城市探索'?'selected':''}>城市探索</option>
                        </select>
                        <div class="error-msg" id="errCategory"></div>
                    </div>

                    <!-- 活动简介 -->
                    <div class="form-group">
                        <label>活动简介 <span style="color:var(--danger);">*</span></label>
                        <textarea id="actDesc" rows="4" placeholder="描述活动内容和亮点" maxlength="500">${escHtml(draft.description || '')}</textarea>
                        <div class="hint"><span id="descCount">${(draft.description || '').length}</span>/500</div>
                        <div class="error-msg" id="errDesc"></div>
                    </div>

                    <!-- 活动开始时间 -->
                    <div class="form-group">
                        <label>活动开始时间 <span style="color:var(--danger);">*</span></label>
                        <input type="datetime-local" id="actStartTime" value="${escHtml(draft.startTime || '')}">
                        <div class="error-msg" id="errStartTime"></div>
                    </div>

                    <!-- 活动结束时间 -->
                    <div class="form-group">
                        <label>活动结束时间 <span style="color:var(--danger);">*</span></label>
                        <input type="datetime-local" id="actEndTime" value="${escHtml(draft.endTime || '')}">
                        <div class="error-msg" id="errEndTime"></div>
                    </div>

                    <!-- 报名截止时间 -->
                    <div class="form-group">
                        <label>报名截止时间 <span style="color:var(--danger);">*</span></label>
                        <input type="datetime-local" id="actDeadline" value="${escHtml(draft.registrationDeadline || '')}">
                        <div class="error-msg" id="errDeadline"></div>
                    </div>

                    <!-- 活动地点（纯文本，不加载地图SDK） -->
                    <div class="form-group">
                        <label>活动地点 <span style="color:var(--danger);">*</span></label>
                        <input type="text" id="actLocation" placeholder="如：北京市朝阳区xxx路xx号" maxlength="200"
                            value="${escHtml(draft.location || '')}">
                        <div class="error-msg" id="errLocation"></div>
                    </div>

                    <!-- 人数上限 -->
                    <div class="form-group">
                        <label>人数上限 <span style="color:var(--danger);">*</span></label>
                        <input type="number" id="actMaxParticipants" placeholder="最大参与人数" min="1"
                            value="${draft.maxParticipants || 20}">
                        <div class="error-msg" id="errMaxParticipants"></div>
                    </div>

                    <!-- 活动费用 -->
                    <div class="form-group">
                        <label>活动费用（元）</label>
                        <input type="number" id="actFee" placeholder="0 表示免费" min="0" step="0.01"
                            value="${draft.fee || 0}">
                    </div>

                    <!-- 标签 -->
                    <div class="form-group">
                        <label>标签</label>
                        <input type="text" id="actTags" placeholder="多个标签用逗号分隔，如：新手友好,轻松社交"
                            value="${escHtml(draft.tags || '')}">
                        <div class="hint">用逗号分隔多个标签</div>
                    </div>

                    <!-- 封面图片URL -->
                    <div class="form-group">
                        <label>封面图片URL</label>
                        <input type="text" id="actCover" placeholder="可选，填入图片链接"
                            value="${escHtml(draft.coverImage || '')}">
                    </div>

                    <!-- 按钮 -->
                    <div style="display:flex;gap:12px;margin-top:24px;">
                        <button type="button" class="btn btn-outline" id="btnDraft">保存草稿</button>
                        <button type="submit" class="btn btn-primary" id="btnPublish">发布活动</button>
                    </div>
                </form>
            </div>
        </div>`;
    },

    init: function() {
        bindFormEvents();
    }
});

// ===== 草稿管理 =====
var DRAFT_KEY = 'activity_draft';

function loadDraft() {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch(e) { return {}; }
}

function saveDraft(data) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    toast('草稿已保存');
}

function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
}

// ===== HTML 转义 =====
function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== 表单事件绑定 =====
function bindFormEvents() {
    // 字数统计
    var titleEl = document.getElementById('actTitle');
    var descEl = document.getElementById('actDesc');
    titleEl.addEventListener('input', function() {
        document.getElementById('titleCount').textContent = titleEl.value.length;
    });
    descEl.addEventListener('input', function() {
        document.getElementById('descCount').textContent = descEl.value.length;
    });

    // 保存草稿
    document.getElementById('btnDraft').addEventListener('click', function() {
        saveDraft(collectFormData());
    });

    // 提交表单
    document.getElementById('createForm').addEventListener('submit', function(e) {
        e.preventDefault();
        clearErrors();
        var data = collectFormData();
        var errors = validateForm(data);
        if (errors.length > 0) {
            showErrors(errors);
            return;
        }
        submitActivity(data);
    });
}

function collectFormData() {
    return {
        title: document.getElementById('actTitle').value.trim(),
        category: document.getElementById('actCategory').value,
        description: document.getElementById('actDesc').value.trim(),
        startTime: document.getElementById('actStartTime').value,
        endTime: document.getElementById('actEndTime').value,
        registrationDeadline: document.getElementById('actDeadline').value,
        location: document.getElementById('actLocation').value.trim(),
        maxParticipants: parseInt(document.getElementById('actMaxParticipants').value) || 0,
        fee: parseFloat(document.getElementById('actFee').value) || 0,
        tags: document.getElementById('actTags').value.trim(),
        coverImage: document.getElementById('actCover').value.trim()
    };
}

function validateForm(data) {
    var errors = [];
    if (!data.title) { errors.push({ field: 'errTitle', msg: '请输入活动名称' }); }
    else if (data.title.length > 30) { errors.push({ field: 'errTitle', msg: '活动名称不能超过30字' }); }
    if (!data.category) { errors.push({ field: 'errCategory', msg: '请选择活动分类' }); }
    if (!data.description) { errors.push({ field: 'errDesc', msg: '请输入活动简介' }); }
    else if (data.description.length > 500) { errors.push({ field: 'errDesc', msg: '活动简介不能超过500字' }); }
    if (!data.startTime) { errors.push({ field: 'errStartTime', msg: '请选择活动开始时间' }); }
    else if (new Date(data.startTime) <= new Date()) { errors.push({ field: 'errStartTime', msg: '活动开始时间必须晚于当前时间' }); }
    if (!data.endTime) { errors.push({ field: 'errEndTime', msg: '请选择活动结束时间' }); }
    else if (data.startTime && new Date(data.endTime) <= new Date(data.startTime)) { errors.push({ field: 'errEndTime', msg: '结束时间必须晚于开始时间' }); }
    if (!data.registrationDeadline) { errors.push({ field: 'errDeadline', msg: '请选择报名截止时间' }); }
    else if (data.startTime && new Date(data.registrationDeadline) >= new Date(data.startTime)) { errors.push({ field: 'errDeadline', msg: '报名截止时间必须早于活动开始时间' }); }
    if (!data.location) { errors.push({ field: 'errLocation', msg: '请输入活动地点' }); }
    if (!data.maxParticipants || data.maxParticipants < 1) { errors.push({ field: 'errMaxParticipants', msg: '人数上限必须大于0' }); }
    return errors;
}

function showErrors(errors) {
    for (var i = 0; i < errors.length; i++) {
        var el = document.getElementById(errors[i].field);
        if (el) { el.textContent = errors[i].msg; el.classList.add('show'); }
    }
}

function clearErrors() {
    var errs = document.querySelectorAll('.error-msg');
    for (var i = 0; i < errs.length; i++) {
        errs[i].textContent = '';
        errs[i].classList.remove('show');
    }
    var alertEl = document.getElementById('createAlert');
    alertEl.classList.remove('show');
}

async function submitActivity(data) {
    var btn = document.getElementById('btnPublish');
    var alertEl = document.getElementById('createAlert');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> 发布中...';

    try {
        if (CREATE_USE_MOCK) {
            // Mock 模式：模拟成功
            await sleep(800);
            var mockRes = { code: 200, message: '创建成功（Mock）', data: { id: Date.now(), title: data.title, status: 'PUBLISHED' } };
            toast(mockRes.message);
            clearDraft();
            Router.navigate('/activities');
            return;
        }

        var body = {
            title: data.title,
            description: data.description,
            category: data.category,
            startTime: new Date(data.startTime).toISOString(),
            endTime: new Date(data.endTime).toISOString(),
            registrationDeadline: new Date(data.registrationDeadline).toISOString(),
            location: data.location,
            maxParticipants: data.maxParticipants,
            fee: data.fee,
            tags: data.tags ? data.tags.split(',').map(function(t){ return t.trim(); }).filter(function(t){ return t; }) : [],
            coverImage: data.coverImage || undefined
        };

        var res = await api('/activities', { method: 'POST', body: body });
        toast(res.message || '创建成功');
        clearDraft();
        Router.navigate('/activities');
    } catch (err) {
        alertEl.textContent = err.message || '创建失败，请稍后重试';
        alertEl.className = 'alert alert-error show';
        btn.disabled = false;
        btn.textContent = '发布活动';
    }
}

function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
}
