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
                        <div class="hint">格式: 年/月/日 时:分</div>
                        <div class="error-msg" id="errStartTime"></div>
                    </div>

                    <!-- 活动结束时间 -->
                    <div class="form-group">
                        <label>活动结束时间 <span style="color:var(--danger);">*</span></label>
                        <input type="datetime-local" id="actEndTime" value="${escHtml(draft.endTime || '')}">
                        <div class="hint">格式: 年/月/日 时:分</div>
                        <div class="error-msg" id="errEndTime"></div>
                    </div>

                    <!-- 报名截止时间 -->
                    <div class="form-group">
                        <label>报名截止时间 <span style="color:var(--danger);">*</span></label>
                        <input type="datetime-local" id="actDeadline" value="${escHtml(draft.registrationDeadline || '')}">
                        <div class="hint">格式: 年/月/日 时:分</div>
                        <div class="error-msg" id="errDeadline"></div>
                    </div>

                    <!-- 活动地点 -->
                    <div class="form-group">
                        <label>活动地点 <span style="color:var(--danger);">*</span></label>
                        <div class="location-picker ${draft.location ? 'has-location' : ''}" id="locationPicker">
                            <div class="loc-input-row">
                                <span class="loc-pin-icon">📍</span>
                                <input type="text" id="actLocation"
                                    placeholder="输入地址或点击右侧按钮在地图上选点"
                                    maxlength="200"
                                    value="${escHtml(draft.location || '')}"
                                    class="loc-input-field" />
                                <button type="button" class="btn btn-map-picker" id="btnMapPicker"
                                    title="在地图上选择地点">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/></svg>
                                    <span>地图选点</span>
                                </button>
                            </div>
                            <div class="loc-status" id="locStatus" style="${draft.location ? '' : 'display:none'}">
                                <span class="loc-status-icon">✅</span>
                                <span class="loc-status-text">已通过地图精确定位</span>
                                <span class="loc-coords" id="locCoords">${draft.latitude ? draft.latitude + ', ' + draft.longitude : ''}</span>
                            </div>
                        </div>
                        <input type="hidden" id="actLatitude" value="${draft.latitude || ''}" />
                        <input type="hidden" id="actLongitude" value="${draft.longitude || ''}" />
                        <div class="error-msg" id="errLocation"></div>
                    </div>

                    <!-- 人数上限 -->
                    <div class="form-group">
                        <label>人数上限 <span style="color:var(--danger);">*</span></label>
                        <input type="number" id="actMaxParticipants" placeholder="最大参与人数" min="1" max="100000"
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

                    <!-- 封面图片上传 -->
                    <div class="form-group">
                        <label>封面图片</label>
                        <div id="coverUploadZone" class="cover-upload-zone">
                            <input type="file" id="coverFileInput" accept="image/jpeg,image/png,image/webp" style="display:none;" />
                            <div id="coverPlaceholder">
                                <span style="font-size:32px;">📷</span>
                                <p>拖拽图片到此处，或点击上传</p>
                                <p style="font-size:12px;color:var(--text-secondary);">支持 JPG/PNG/WebP，≤5MB</p>
                            </div>
                            <img id="coverPreview" src="${escHtml(draft.coverImage || '')}" style="${draft.coverImage ? '' : 'display:none;'}max-width:100%;max-height:200px;border-radius:8px;" />
                            <button type="button" class="btn btn-sm btn-outline" id="btnRemoveCover" style="${draft.coverImage ? '' : 'display:none;'}margin-top:8px;">移除封面</button>
                        </div>
                        <input type="hidden" id="actCover" value="${escHtml(draft.coverImage || '')}" />
                    </div>

                    <!-- 按钮 -->
                    <div style="display:flex;gap:12px;margin-top:24px;">
                        <button type="button" class="btn btn-outline" id="btnDraft">保存草稿</button>
                        <button type="submit" class="btn btn-primary" id="btnPublish">发布活动</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- 地图选点弹窗 -->
        <div id="mapPickerModal" class="modal" style="display:none;">
            <div class="modal-content map-picker-content">
                <div class="map-picker-header">
                    <div class="map-picker-title-row">
                        <span class="map-picker-icon">📍</span>
                        <h3>在地图上选择活动地点</h3>
                    </div>
                    <button class="modal-close" id="closeMapPickerBtn">&times;</button>
                </div>
                <div class="map-search-area">
                    <div class="map-city-row">
                        <select id="mapProvinceSelect" class="map-province-select">
                            <option value="">省/直辖市</option>
                        </select>
                        <select id="mapCitySelect" class="map-city-select">
                            <option value="">城市</option>
                        </select>
                    </div>
                    <div class="map-search-row">
                        <svg class="map-search-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input type="text" id="mapSearchInput" class="map-search-input"
                            placeholder="输入地点名称搜索，或直接点击地图选点" />
                        <button class="map-search-clear" id="mapSearchClear" type="button" style="display:none;" title="清除搜索">&times;</button>
                    </div>
                </div>
                <div class="map-wrapper">
                    <div id="mapContainer"></div>
                    <div class="map-click-hint" id="mapClickHint">👆 点击地图或拖拽标记来选择位置</div>
                </div>
                <div class="map-addr-bar" id="mapAddrBar">
                    <div class="map-addr-left">
                        <span class="map-addr-icon">📌</span>
                        <span class="map-addr-text" id="selectedAddress">点击地图或在上方搜索选择地点</span>
                    </div>
                    <button class="map-addr-clear" id="mapAddrClear" type="button" style="display:none;" title="清除选点">&times;</button>
                </div>
                <div class="map-actions">
                    <button class="btn btn-outline" id="btnCancelMap">取消</button>
                    <button class="btn btn-primary" id="btnConfirmMap">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        确认选点
                    </button>
                </div>
            </div>
        </div>`;
    },

    init: function() {
        bindFormEvents();
        initCoverUpload();
        initMapPicker();
        // 检查克隆入口，使用 Router.query
        if (Router.query && Router.query.cloneFrom) {
            var cloneId = parseInt(Router.query.cloneFrom);
            if (cloneId) loadCloneDataToForm(cloneId);
        }
        // 检查编辑入口
        if (Router.query && Router.query.editFrom) {
            var editId = parseInt(Router.query.editFrom);
            if (editId) loadEditDataToForm(editId);
        }
        // 检查草稿编辑入口
        if (Router.query && Router.query.editDraft) {
            var draftId = parseInt(Router.query.editDraft);
            if (draftId) loadEditDataToForm(draftId, true);
        }
    }
});

// ===== 草稿管理 =====
var DRAFT_KEY = 'activity_draft';

function loadDraft() {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch(e) { return {}; }
}

function saveDraft(data) {
    // 检查是否全部为空
    var hasContent = false;
    var fields = ['title', 'category', 'description', 'startTime', 'endTime', 'registrationDeadline', 'location', 'tags', 'coverImage', 'latitude', 'longitude'];
    for (var i = 0; i < fields.length; i++) {
        if (data[fields[i]] && data[fields[i]].trim && data[fields[i]].trim()) {
            hasContent = true;
            break;
        } else if (data[fields[i]] && !data[fields[i]].trim) {
            hasContent = true;
            break;
        }
    }
    if (!hasContent) {
        toast('请至少填写一项内容', 'error');
        return;
    }

    // 如果正在编辑草稿，则更新草稿
    if (window._isEditingDraft && window._editingActivityId) {
        updateDraft(window._editingActivityId, data);
        return;
    }
    // 服务端持久化草稿
    api('/activities/draft', { method: 'POST', body: {
        title: data.title || '未命名活动',
        description: data.description || '',
        category: data.category || 'sports',
        startTime: data.startTime ? data.startTime + ':00' : new Date(Date.now() + 7*86400000).toISOString(),
        endTime: data.endTime ? data.endTime + ':00' : new Date(Date.now() + 7*86400000 + 2*3600000).toISOString(),
        registrationDeadline: data.registrationDeadline ? data.registrationDeadline + ':00' : null,
        location: data.location || '',
        maxParticipants: data.maxParticipants || 20,
        fee: data.fee || 0,
        tags: data.tags ? data.tags.split(',').map(function(t){ return t.trim(); }).filter(function(t){ return t; }) : [],
        coverImage: data.coverImage || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null
    }}).then(function() {
        toast('草稿已保存');
        // 同时保留localStorage作为本地备份
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    }).catch(function(err) {
        toast('草稿保存失败: ' + (err.message || '网络错误'), 'error');
        // 降级到localStorage
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    });
}

// 更新已有草稿
async function updateDraft(draftId, data) {
    try {
        await api('/activities/' + draftId + '/draft', { method: 'PUT', body: {
            title: data.title || '未命名活动',
            description: data.description || '',
            category: data.category || 'sports',
            startTime: data.startTime ? data.startTime + ':00' : null,
            endTime: data.endTime ? data.endTime + ':00' : null,
            registrationDeadline: data.registrationDeadline ? data.registrationDeadline + ':00' : null,
            location: data.location || '',
            maxParticipants: data.maxParticipants || 20,
            fee: data.fee || 0,
            tags: data.tags ? data.tags.split(',').map(function(t){ return t.trim(); }).filter(function(t){ return t; }) : [],
            coverImage: data.coverImage || '',
            latitude: data.latitude || null,
            longitude: data.longitude || null
        }});
        toast('草稿已更新');
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch (err) {
        toast('草稿更新失败: ' + (err.message || '网络错误'), 'error');
    }
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

    // 地点手动输入联动状态
    var locInput = document.getElementById('actLocation');
    var locPicker = document.getElementById('locationPicker');
    var locStatus = document.getElementById('locStatus');
    var locCoords = document.getElementById('locCoords');
    locInput.addEventListener('input', function() {
        if (locInput.value.trim()) {
            locPicker.classList.add('has-location');
            locStatus.style.display = '';
        } else {
            locPicker.classList.remove('has-location');
            locStatus.style.display = 'none';
        }
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
        coverImage: document.getElementById('actCover').value.trim(),
        latitude: document.getElementById('actLatitude').value.trim() || undefined,
        longitude: document.getElementById('actLongitude').value.trim() || undefined
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
    else if (data.maxParticipants > 100000) { errors.push({ field: 'errMaxParticipants', msg: '人数上限不能超过100000' }); }
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
            startTime: data.startTime + ':00',
            endTime: data.endTime + ':00',
            registrationDeadline: data.registrationDeadline + ':00',
            location: data.location,
            maxParticipants: data.maxParticipants,
            fee: data.fee,
            tags: data.tags ? data.tags.split(',').map(function(t){ return t.trim(); }).filter(function(t){ return t; }) : [],
            coverImage: data.coverImage || undefined,
            latitude: data.latitude || undefined,
            longitude: data.longitude || undefined
        };

        var editId = window._editingActivityId;
        var isDraft = window._isEditingDraft;

        if (editId) {
            if (isDraft) {
                // 发布草稿
                var res = await api('/activities/' + editId + '/publish', { method: 'POST', body: body });
                toast(res.message || '草稿发布成功');
            } else {
                // 修改已发布活动
                var res = await api('/activities/' + editId, { method: 'PUT', body: body });
                toast(res.message || '修改成功');
            }
            window._editingActivityId = null;
            window._isEditingDraft = false;
        } else {
            var res = await api('/activities', { method: 'POST', body: body });
            toast(res.message || '创建成功');
        }
        clearDraft();
        Router.navigate('/activities');
    } catch (err) {
        if (err.code === 451) {
            showBlockModal(err.message);
        } else {
            alertEl.textContent = err.message || '创建失败，请稍后重试';
            alertEl.className = 'alert alert-error show';
        }
        btn.disabled = false;
        btn.textContent = '发布活动';
    }
}

function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// ===== 克隆活动数据加载 =====
var CLONE_CAT_MAP = {
    'sports': '运动健身',
    'hiking': '户外徒步',
    'boardgame': '桌游聚会',
    'study': '学习交流',
    'charity': '公益活动',
    'citywalk': '城市探索'
};

async function loadCloneDataToForm(cloneId) {
    toast('正在加载克隆数据...');
    try {
        var d;
        if (CREATE_USE_MOCK) {
            d = {
                title: '周末篮球局',
                description: '一起打篮球',
                category: 'sports',
                location: '朝阳公园',
                maxParticipants: 20,
                fee: 0,
                tags: '篮球, 运动',
                coverImage: ''
            };
        } else {
            // 只读取原始活动信息，不提前写库
            var res = await api('/activities/' + cloneId);
            d = res.data;
        }

        setFieldVal('actTitle', (d.title || '') + '（克隆）');
        setFieldVal('actCategory', CLONE_CAT_MAP[d.category] || '');
        setFieldVal('actDesc', d.description || '');
        setFieldVal('actLocation', d.location || '');
        setFieldVal('actMaxParticipants', d.maxParticipants || 20);
        setFieldVal('actFee', d.fee || 0);
        setFieldVal('actTags', Array.isArray(d.tags) ? d.tags.join(', ') : (d.tags || ''));
        setFieldVal('actCover', d.coverImage || '');
        setFieldVal('actLatitude', d.latitude || '');
        setFieldVal('actLongitude', d.longitude || '');
        // 时间字段清空，让用户重新选择
        setFieldVal('actStartTime', '');
        setFieldVal('actEndTime', '');
        setFieldVal('actDeadline', '');

        // 更新字数统计
        var titleEl = document.getElementById('actTitle');
        var descEl = document.getElementById('actDesc');
        var titleCount = document.getElementById('titleCount');
        var descCount = document.getElementById('descCount');
        if (titleEl && titleCount) titleCount.textContent = titleEl.value.length;
        if (descEl && descCount) descCount.textContent = descEl.value.length;

        toast('已加载克隆数据，请设置时间后发布');
    } catch (err) {
        toast(err.message || '加载克隆数据失败', 'error');
    }
}

function setFieldVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val;
}

// ===== 编辑活动数据加载 =====
async function loadEditDataToForm(editId, isDraft) {
    toast('正在加载活动数据...');
    try {
        var d;
        if (CREATE_USE_MOCK) {
            d = {
                id: 1,
                title: '周末篮球局',
                description: '一起打篮球',
                category: 'sports',
                location: '朝阳公园',
                maxParticipants: 20,
                fee: 0,
                tags: '篮球, 运动',
                coverImage: '',
                startTime: '2026-07-05T14:00:00',
                endTime: '2026-07-05T17:00:00',
                registrationDeadline: '2026-07-04T18:00:00'
            };
        } else {
            var res = await api('/activities/' + editId);
            d = res.data;
        }

        setFieldVal('actTitle', d.title || '');
        setFieldVal('actCategory', CLONE_CAT_MAP[d.category] || '');
        setFieldVal('actDesc', d.description || '');
        setFieldVal('actLocation', d.location || '');
        setFieldVal('actMaxParticipants', d.maxParticipants || 20);
        setFieldVal('actFee', d.fee || 0);
        setFieldVal('actTags', Array.isArray(d.tags) ? d.tags.join(', ') : (d.tags || ''));
        setFieldVal('actCover', d.coverImage || '');
        setFieldVal('actLatitude', d.latitude || '');
        setFieldVal('actLongitude', d.longitude || '');
        setFieldVal('actStartTime', formatForDatetimeLocal(d.startTime));
        setFieldVal('actEndTime', formatForDatetimeLocal(d.endTime));
        setFieldVal('actDeadline', formatForDatetimeLocal(d.registrationDeadline));

        // 封面预览
        if (d.coverImage) {
            var preview = document.getElementById('coverPreview');
            var placeholder = document.getElementById('coverPlaceholder');
            var removeBtn = document.getElementById('btnRemoveCover');
            if (preview) { preview.src = d.coverImage; preview.style.display = ''; }
            if (placeholder) placeholder.style.display = 'none';
            if (removeBtn) removeBtn.style.display = '';
        }

        // 保存编辑ID和草稿状态
        window._editingActivityId = editId;
        window._isEditingDraft = isDraft;

        // 更新标题和按钮
        var header = document.querySelector('.header h1');
        if (header) header.textContent = isDraft ? '编辑草稿' : '编辑活动';
        var btn = document.getElementById('btnPublish');
        if (btn) btn.textContent = isDraft ? '发布活动' : '保存修改';
        var draftBtn = document.getElementById('btnDraft');
        if (draftBtn) {
            draftBtn.style.display = isDraft ? 'inline-flex' : 'none';
            draftBtn.textContent = '保存草稿';
        }

        // 更新字数统计
        var titleEl = document.getElementById('actTitle');
        var descEl = document.getElementById('actDesc');
        var titleCount = document.getElementById('titleCount');
        var descCount = document.getElementById('descCount');
        if (titleEl && titleCount) titleCount.textContent = titleEl.value.length;
        if (descEl && descCount) descCount.textContent = descEl.value.length;

        toast(isDraft ? '已加载草稿，可继续编辑或直接发布' : '已加载活动数据，修改后保存即可');
    } catch (err) {
        toast(err.message || '加载活动数据失败', 'error');
    }
}

function formatForDatetimeLocal(iso) {
    if (!iso) return '';
    return iso.substring(0, 16);
}

// ===== 封面图片上传（拖拽+点击） =====
function initCoverUpload() {
    var zone = document.getElementById('coverUploadZone');
    var fileInput = document.getElementById('coverFileInput');
    var preview = document.getElementById('coverPreview');
    var placeholder = document.getElementById('coverPlaceholder');
    var removeBtn = document.getElementById('btnRemoveCover');
    var hiddenInput = document.getElementById('actCover');
    var MAX_SIZE = 5 * 1024 * 1024; // 5MB

    function handleFile(file) {
        if (!file) return;
        if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
            toast('仅支持 JPG、PNG、WebP 格式', 'error');
            return;
        }
        if (file.size > MAX_SIZE) {
            toast('封面图片不能超过 5MB', 'error');
            return;
        }

        var btn = document.getElementById('btnPublish');
        var origText = btn.textContent;

        // 上传文件
        var fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'cover');

        api('/upload', { method: 'POST', body: fd }).then(function(res) {
            var url = res.data.url;
            hiddenInput.value = url;
            preview.src = url;
            preview.style.display = '';
            placeholder.style.display = 'none';
            removeBtn.style.display = '';
            toast('封面上传成功');
        }).catch(function(err) {
            toast('上传失败: ' + (err.message || '网络错误'), 'error');
        });
    }

    // 点击上传
    zone.addEventListener('click', function(e) {
        if (e.target === removeBtn || e.target === preview) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleFile(this.files[0]);
        }
    });

    // 拖拽上传
    zone.addEventListener('dragover', function(e) {
        e.preventDefault();
        zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', function() {
        zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        zone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // 移除封面
    removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        hiddenInput.value = '';
        preview.src = '';
        preview.style.display = 'none';
        placeholder.style.display = '';
        removeBtn.style.display = 'none';
    });
}

// ===== 高德地图选点 =====
var _mapInstance = null;
var _mapMarker = null;
var _mapPickerResult = null;
var _mapSearchBound = false;
var _searchReqId = 0;
var _geoReqId = 0;      // 防止异步竞态：旧请求结果覆盖新请求

    // ===== 省市两级数据 =====
    var CITY_DATA = {
        '直辖市': ['北京', '上海', '天津', '重庆'],
        '广东': ['广州', '深圳', '珠海', '东莞', '佛山', '惠州', '中山', '汕头'],
        '江苏': ['南京', '苏州', '无锡', '常州', '南通', '徐州', '扬州'],
        '浙江': ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '台州'],
        '四川': ['成都', '绵阳', '宜宾', '德阳', '南充', '泸州'],
        '湖北': ['武汉', '宜昌', '襄阳', '荆州', '黄石'],
        '陕西': ['西安', '咸阳', '宝鸡', '渭南', '汉中'],
        '湖南': ['长沙', '株洲', '湘潭', '衡阳', '岳阳'],
        '福建': ['福州', '厦门', '泉州', '漳州', '莆田'],
        '山东': ['济南', '青岛', '烟台', '潍坊', '威海', '淄博'],
        '辽宁': ['沈阳', '大连', '鞍山', '抚顺', '锦州'],
        '河南': ['郑州', '洛阳', '开封', '南阳', '新乡'],
        '安徽': ['合肥', '芜湖', '蚌埠', '马鞍山', '安庆'],
        '云南': ['昆明', '大理', '丽江', '曲靖', '玉溪'],
        '贵州': ['贵阳', '遵义', '毕节', '铜仁', '安顺'],
        '广西': ['南宁', '桂林', '柳州', '北海', '玉林'],
        '黑龙江': ['哈尔滨', '大庆', '齐齐哈尔', '牡丹江'],
        '吉林': ['长春', '吉林', '四平', '通化'],
        '河北': ['石家庄', '唐山', '保定', '邯郸', '廊坊'],
        '江西': ['南昌', '九江', '赣州', '景德镇'],
        '山西': ['太原', '大同', '阳泉', '长治'],
        '海南': ['海口', '三亚', '儋州'],
        '甘肃': ['兰州', '天水', '敦煌'],
        '内蒙古': ['呼和浩特', '包头', '鄂尔多斯'],
        '新疆': ['乌鲁木齐', '喀什', '伊犁'],
        '西藏': ['拉萨', '日喀则'],
        '宁夏': ['银川', '吴忠', '中卫'],
        '青海': ['西宁', '海东', '格尔木'],
        '香港': ['香港'],
        '澳门': ['澳门'],
        '台湾': ['台北', '高雄', '台中']
    };

function initMapPicker() {
    var modal = document.getElementById('mapPickerModal');
    var locationInput = document.getElementById('actLocation');
    var latInput = document.getElementById('actLatitude');
    var lngInput = document.getElementById('actLongitude');
    var searchInput = document.getElementById('mapSearchInput');
    var addrSpan = document.getElementById('selectedAddress');

    // 初始化省市两级下拉
    var provSelect = document.getElementById('mapProvinceSelect');
    var citySelect = document.getElementById('mapCitySelect');
    (function initCityDropdowns() {
        var provinces = Object.keys(CITY_DATA);
        for (var i = 0; i < provinces.length; i++) {
            var opt = document.createElement('option');
            opt.value = provinces[i];
            opt.textContent = provinces[i];
            if (provinces[i] === '直辖市') opt.selected = true;
            provSelect.appendChild(opt);
        }
        populateCities('直辖市');
    })();
    provSelect.addEventListener('change', function() { populateCities(this.value); });
    citySelect.addEventListener('change', function() { if (this.value) searchInput.focus(); });
    function populateCities(province) {
        citySelect.innerHTML = '<option value="">选择城市</option>';
        if (!province || !CITY_DATA[province]) return;
        var cities = CITY_DATA[province];
        for (var i = 0; i < cities.length; i++) {
            var opt = document.createElement('option');
            opt.value = cities[i];
            opt.textContent = cities[i];
            if (cities[i] === '北京') opt.selected = true;
            citySelect.appendChild(opt);
        }
    }

    // 点击模态框半透明背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeMapPicker();
    });

    // 关闭弹窗
    document.getElementById('closeMapPickerBtn').addEventListener('click', closeMapPicker);
    document.getElementById('btnCancelMap').addEventListener('click', closeMapPicker);

    function closeMapPicker() {
        modal.style.display = 'none';
        document.getElementById('mapSearchClear').style.display = 'none';
        document.getElementById('mapAddrClear').style.display = 'none';
        document.getElementById('mapClickHint').style.display = '';
        if (_mapInstance) {
            _mapInstance.destroy();
            _mapInstance = null;
        }
        _mapMarker = null;
        _geoReqId++;
        _searchReqId++;
        var mc = document.getElementById('mapContainer');
        if (mc) mc.innerHTML = '';
    }

    // 搜索框输入事件（只绑定一次）
    if (!_mapSearchBound) {
        _mapSearchBound = true;

        // 搜索框清除按钮
        var searchClearBtn = document.getElementById('mapSearchClear');
        searchClearBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchClearBtn.style.display = 'none';
            searchInput.focus();
        });
        searchInput.addEventListener('input', function() {
            searchClearBtn.style.display = searchInput.value ? '' : 'none';
        });

        // 地址栏清除按钮
        var addrClearBtn = document.getElementById('mapAddrClear');
        addrClearBtn.addEventListener('click', function() {
            _mapPickerResult = null;
            addrSpan.textContent = '点击地图或在上方搜索选择地点';
            addrClearBtn.style.display = 'none';
            document.getElementById('mapClickHint').style.display = '';
        });

        var searchTimer = null;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() {
                var keyword = searchInput.value.trim();
                if (!keyword || !_mapInstance) return;
                doPlaceSearch(keyword);
            }, 400);
        });
        // 回车直接搜索
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimer);
                var keyword = searchInput.value.trim();
                if (keyword && _mapInstance) doPlaceSearch(keyword);
            }
        });
    }

    // 打开弹窗
    document.getElementById('btnMapPicker').addEventListener('click', function() {
        modal.style.display = 'flex';
        _mapPickerResult = null;
        addrSpan.textContent = '点击地图或在上方搜索选择地点';
        document.getElementById('mapAddrClear').style.display = 'none';
        document.getElementById('mapClickHint').style.display = '';
        searchInput.value = '';
        document.getElementById('mapSearchClear').style.display = 'none';
        setTimeout(initMap, 200);
    });

    // 确认选点
    document.getElementById('btnConfirmMap').addEventListener('click', function() {
        if (!_mapPickerResult || !_mapPickerResult.lat) {
            toast('请先在地图上点击或搜索选点', 'error');
            return;
        }
        if (!_mapPickerResult.address || _mapPickerResult.address === '定位中...') {
            toast('正在获取地址信息，请稍后再试', 'error');
            return;
        }
        locationInput.value = _mapPickerResult.address;
        latInput.value = _mapPickerResult.lat;
        lngInput.value = _mapPickerResult.lng;
        // 更新位置选择器状态
        var picker = document.getElementById('locationPicker');
        picker.classList.add('has-location');
        var locStatus = document.getElementById('locStatus');
        locStatus.style.display = '';
        var locCoords = document.getElementById('locCoords');
        locCoords.textContent = _mapPickerResult.lat.toFixed(6) + ', ' + _mapPickerResult.lng.toFixed(6);
        toast('已选择: ' + _mapPickerResult.address);
        closeMapPicker();
    });

    // ===== 地图初始化 =====
    function initMap() {
        var container = document.getElementById('mapContainer');
        if (!container || container.offsetHeight === 0) return;

        if (_mapInstance) {
            _mapInstance.resize();
            return;
        }

        var AMap = window.AMap;
        if (!AMap) {
            container.innerHTML = '<div class="map-loading">地图组件加载中，请稍候…</div>';
            return;
        }

        var centerLng = parseFloat(lngInput.value) || 116.397428;
        var centerLat = parseFloat(latInput.value) || 39.90923;

        _mapInstance = new AMap.Map('mapContainer', {
            zoom: 15,
            center: [centerLng, centerLat],
            resizeEnable: true,
            mapStyle: 'amap://styles/light'
        });

        _mapMarker = new AMap.Marker({
            position: [centerLng, centerLat],
            map: _mapInstance,
            draggable: true,
            animation: 'AMAP_ANIMATION_DROP'
        });

        // 点击地图移动标记
        _mapInstance.on('click', function(e) {
            _mapMarker.setPosition(e.lnglat);
            reverseGeocode(e.lnglat.getLng(), e.lnglat.getLat());
        });

        // 拖拽标记结束
        _mapMarker.on('dragend', function(e) {
            reverseGeocode(e.lnglat.getLng(), e.lnglat.getLat());
        });

        // 初始逆地理编码
        reverseGeocode(centerLng, centerLat);
    }

    // ===== 逆地理编码：后端 v3 regeo =====
    function reverseGeocode(lng, lat) {
        var reqId = ++_geoReqId;
        addrSpan.textContent = '定位中...';

        api('/api/map/regeo?lng=' + lng + '&lat=' + lat).then(function(res) {
            if (reqId !== _geoReqId) return;
            var data = res.data;
            if (!data || data.status !== '1' || !data.regeocode) {
                fallbackCoord(lng, lat);
                return;
            }
            var regeo = data.regeocode;

            // 核心修复：先按距离排序，再过滤，确保最近的优先
            var pois = (regeo.pois || []).slice();
            pois.sort(function(a, b) {
                return (parseFloat(a.distance) || 999999) - (parseFloat(b.distance) || 999999);
            });

            var bestName = null;

            // 过滤街道/道路
            function isStreet(type) {
                var t = (type || '').toString();
                return /道路|街道|门牌|胡同|巷|弄/.test(t);
            }
            function isImportant(type) {
                var t = (type || '').toString();
                return /风景名胜|公园|广场|博物馆|纪念馆|展览馆|教堂|寺庙|塔|古建筑|故居|科教文化|学校|大学|图书馆|体育休闲|交通设施|火车站|机场|地铁|购物|商场|商圈/.test(t);
            }

            // 第一级：100m 内的非街道主 POI（最可信 - 用户精确点击）
            for (var i = 0; i < pois.length; i++) {
                var p = pois[i];
                var dist = parseFloat(p.distance) || 999;
                if (dist > 100) continue;
                var isMain = !p.parent || String(p.parent).trim() === '';
                if (isMain && !isStreet(p.type || p.typecode || '')) {
                    bestName = p.name;
                    break;
                }
            }
            // 第二级：300m 内的重要主 POI
            if (!bestName) {
                for (var i = 0; i < pois.length; i++) {
                    var p = pois[i];
                    var dist = parseFloat(p.distance) || 999;
                    if (dist > 300) continue;
                    var isMain = !p.parent || String(p.parent).trim() === '';
                    if (isMain && isImportant(p.type || p.typecode || '')) {
                        bestName = p.name;
                        break;
                    }
                }
            }
            // 第三级：300m 内任意非街道主 POI
            if (!bestName) {
                for (var i = 0; i < pois.length; i++) {
                    var p = pois[i];
                    var dist = parseFloat(p.distance) || 999;
                    if (dist > 300) continue;
                    var isMain = !p.parent || String(p.parent).trim() === '';
                    if (isMain && !isStreet(p.type || p.typecode || '')) {
                        bestName = p.name;
                        break;
                    }
                }
            }
            // 第四级：最近的非街道 POI（不限主/子，已按距离排好序）
            if (!bestName) {
                for (var i = 0; i < pois.length; i++) {
                    var p = pois[i];
                    if (!isStreet(p.type || p.typecode || '')) {
                        bestName = p.name;
                        break;
                    }
                }
            }
            // 第五级：格式化地址兜底
            if (!bestName) {
                bestName = regeo.formatted_address || regeo.formattedAddress || (lng.toFixed(6) + ', ' + lat.toFixed(6));
            }
            _mapPickerResult = { lng: lng, lat: lat, address: bestName };
            addrSpan.textContent = bestName;
            onLocationResolved();
        });
    }

    function onLocationResolved() {
        document.getElementById('mapClickHint').style.display = 'none';
        document.getElementById('mapAddrClear').style.display = '';
    }

    function fallbackCoord(lng, lat) {
        var s = lng.toFixed(6) + ', ' + lat.toFixed(6);
        _mapPickerResult = { lng: lng, lat: lat, address: s };
        addrSpan.textContent = s + ' (无法获取地址)';
    }

    // ===== 地点搜索：后端 v3 API =====
    function doPlaceSearch(keyword) {
        var reqId = ++_searchReqId;
        _geoReqId = reqId;
        addrSpan.textContent = '搜索中...';

        var citySelect = document.getElementById('mapCitySelect');
        var city = citySelect ? citySelect.value : '北京';

        api('/api/map/place-search?keywords=' + encodeURIComponent(keyword) +
            '&city=' + encodeURIComponent(city)).then(function(res) {
            if (reqId !== _searchReqId) return;
            var data = res.data;
            console.log('[MapSearch] status=' + (data && data.status) + ', count=' + (data && data.count));
            if (data && data.status === '1' && data.pois && data.pois.length > 0) {
                var allPois = data.pois;
                // 第1步：过滤出目标城市的POI（cityname 包含城市名）
                var cityPois = allPois.filter(function(p) {
                    return (p.cityname || '').indexOf(city) >= 0;
                });
                // 如果城市过滤后为空，保留全部（可能是小城市无结果）
                var pois = cityPois.length > 0 ? cityPois : allPois;
                console.log('[MapSearch] 总数=' + allPois.length + ', 城市过滤=' + cityPois.length + ', 使用=' + pois.length);

                // 第2步：按相关性排序
                var kw = keyword;
                pois.sort(function(a, b) {
                    var sa = 0, sb = 0;
                    var na = (a.name || ''), nb = (b.name || '');
                    var aa = (a.address || ''), ab = (b.address || '');
                    // 名称完全匹配
                    if (na === kw) sa += 500;
                    if (nb === kw) sb += 500;
                    // 名称包含关键词
                    if (na.indexOf(kw) >= 0) sa += 200;
                    if (nb.indexOf(kw) >= 0) sb += 200;
                    // 地址包含关键词
                    if (aa.indexOf(kw) >= 0) sa += 50;
                    if (ab.indexOf(kw) >= 0) sb += 50;
                    return sb - sa;
                });

                var p = pois[0];
                console.log('[MapSearch] 选中: ' + p.name + ' (' + p.cityname + ')');
                var loc = p.location;
                var lng, lat;
                if (typeof loc === 'string') { var parts = loc.split(','); lng = parseFloat(parts[0]); lat = parseFloat(parts[1]); }
                else if (loc && typeof loc === 'object') { lng = parseFloat(loc.lng || loc[0]); lat = parseFloat(loc.lat || loc[1]); }
                if (!isNaN(lng) && !isNaN(lat)) {
                    _mapInstance.setCenter([lng, lat]);
                    _mapMarker.setPosition([lng, lat]);
                    _mapPickerResult = { lng: lng, lat: lat, address: p.name + (p.address ? ' — ' + p.address : '') };
                    addrSpan.textContent = _mapPickerResult.address;
                    onLocationResolved();
                    return;
                }
            }
            addrSpan.textContent = '未找到，请直接在地图上点击选点';
        }).catch(function() {
            if (reqId !== _searchReqId) return;
            addrSpan.textContent = '搜索失败，请检查网络';
        });
    }

}
