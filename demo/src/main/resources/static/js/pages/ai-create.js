// ====== AI活动策划页面 ======
// 路由: #/ai-create
// 覆盖故事: US-007 AI策划 / US-008 模板选择
// 手动创建请使用 #/create-activity

const AI_CREATE_USE_MOCK = false;

// ---- Mock 数据 ----
const MOCK_AI_RESULT = {
    title: '周末篮球对抗赛',
    description: '一起参与周末篮球运动，强身健体，结交运动伙伴！无论你是新手还是老手，都能在这里找到乐趣。',
    tags: ['运动', '健身', '户外'],
    suggestedLocation: '朝阳公园篮球场'
};

const MOCK_TEMPLATES = [
    { id: 1, name: '运动健身', category: 'sports', icon: '🏃', titleTemplate: '{主题}运动局', descriptionTemplate: '一起参与{主题}运动，强身健体，结交运动伙伴！' },
    { id: 2, name: '户外徒步', category: 'hiking', icon: '🥾', titleTemplate: '{目的地}徒步', descriptionTemplate: '周末{目的地}徒步之旅，沿途欣赏自然风光。全程约5公里。' },
    { id: 3, name: '桌游聚会', category: 'boardgame', icon: '🎲', titleTemplate: '{游戏名}桌游局', descriptionTemplate: '{游戏名}主题桌游聚会，新手友好，有教学环节。' },
    { id: 4, name: '学习交流', category: 'study', icon: '📚', titleTemplate: '{主题}学习交流会', descriptionTemplate: '{主题}主题学习交流，分享经验，互相成长。' },
    { id: 5, name: '公益活动', category: 'charity', icon: '🤝', titleTemplate: '{主题}公益行动', descriptionTemplate: '{主题}公益活动，用行动传递温暖。' },
    { id: 6, name: '城市探索', category: 'citywalk', icon: '🗺️', titleTemplate: '{区域}城市漫步', descriptionTemplate: '漫步{区域}，发现城市隐藏的美，品尝地道美食。' }
];

// ---- 页面状态 ----
var aiCreateState = {
    mode: 'ai',
    form: {
        title: '',
        description: '',
        category: 'sports',
        startTime: '',
        endTime: '',
        location: '',
        maxParticipants: 20,
        fee: 0,
        tags: '',
        coverImage: '',
        registrationDeadline: ''
    }
};

var AI_CATEGORY_OPTIONS = [
    { value: 'sports', label: '运动健身' },
    { value: 'hiking', label: '户外徒步' },
    { value: 'boardgame', label: '桌游聚会' },
    { value: 'study', label: '学习交流' },
    { value: 'charity', label: '公益活动' },
    { value: 'citywalk', label: '城市探索' }
];

Router.register('/ai-create', {
    title: 'AI创建活动',
    requireAuth: true,

    render: function () {
        return '\
        <div class="home-content">\
            <div class="welcome-card"><h2>AI 智能创建</h2><p>使用 AI 生成或选择模板快速创建活动，也可<a href="#/create-activity" style="color:#fff;text-decoration:underline;">手动填写</a></p></div>\
            <div class="card" style="padding:0;overflow:hidden;">\
                <div id="createTabs" class="tab-bar">\
                    <button class="tab-btn active" data-mode="ai">AI生成</button>\
                    <button class="tab-btn" data-mode="template">模板选择</button>\
                </div>\
                <div id="tabContent" style="padding:16px;"></div>\
            </div>\
        </div>';
    },

    init: function () {
        document.getElementById('createTabs').addEventListener('click', function (e) {
            if (e.target.classList.contains('tab-btn')) {
                setAiMode(e.target.dataset.mode);
            }
        });

        setAiMode(aiCreateState.mode);
    }
});

// ---- Tab 切换 ----
function setAiMode(mode) {
    aiCreateState.mode = mode;
    var btns = document.querySelectorAll('#createTabs .tab-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('active', btns[i].dataset.mode === mode);
    }
    var container = document.getElementById('tabContent');
    if (mode === 'ai') container.innerHTML = renderAiTab();
    if (mode === 'template') container.innerHTML = renderTemplateTab();
    bindAiTabEvents(mode);
}

// ==================== Tab1: AI生成 ====================
function renderAiTab() {
    return '\
    <div id="aiTab">\
        <div class="form-group">\
            <label>活动主题 <span style="color:#ef4444;">*</span></label>\
            <input type="text" id="aiTopic" class="form-input" placeholder="例如：周末篮球、城市徒步" value="">\
        </div>\
        <div class="form-group">\
            <label>活动分类 <span style="color:#ef4444;">*</span></label>\
            <select id="aiCategory" class="form-input">' +
            AI_CATEGORY_OPTIONS.map(function(o) {
                return '<option value="' + o.value + '"' + (aiCreateState.form.category === o.value ? ' selected' : '') + '>' + o.label + '</option>';
            }).join('') +
            '</select>\
        </div>\
        <button id="btnGenerate" class="btn btn-primary" style="width:100%;margin-bottom:16px;">\
            生成活动内容\
        </button>\
        <div id="aiResult" style="display:none;"></div>\
    </div>';
}

function bindAiGenerateEvents() {
    document.getElementById('btnGenerate').addEventListener('click', doAiGenerate);
}

function renderAiResult(data) {
    aiCreateState.form.title = data.title || '';
    aiCreateState.form.description = data.description || '';
    aiCreateState.form.location = data.suggestedLocation || '';
    aiCreateState.form.tags = (data.tags || []).join(', ');

    return '\
    <div style="border-top:1px solid var(--border);padding-top:16px;">\
        <h4 style="margin-bottom:4px;">生成结果预览</h4>\
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">可修改后直接发布，或<a href="#/create-activity" onclick="saveAiDraftAndGo()" style="color:var(--primary);">去手动创建页</a>完善更多细节</p>\
        <div class="form-group">\
            <label>活动标题 <span style="color:#ef4444;">*</span></label>\
            <input type="text" id="aiTitle" class="form-input" value="' + escHtmlAi(aiCreateState.form.title) + '">\
        </div>\
        <div class="form-group">\
            <label>活动描述 <span style="color:#ef4444;">*</span></label>\
            <textarea id="aiDesc" class="form-input" rows="4">' + escHtmlAi(aiCreateState.form.description) + '</textarea>\
        </div>\
        <div class="form-group">\
            <label>标签</label>\
            <input type="text" id="aiTags" class="form-input" placeholder="多个标签用逗号分隔" value="' + escHtmlAi(aiCreateState.form.tags) + '">\
        </div>\
        <div class="form-group">\
            <label>活动地点 <span style="color:#ef4444;">*</span></label>\
            <input type="text" id="aiLocation" class="form-input" value="' + escHtmlAi(aiCreateState.form.location) + '">\
        </div>\
        ' + renderAiExtraFields() + '\
        <button id="btnPublishAi" class="btn btn-primary" style="width:100%;">发布活动</button>\
    </div>';
}

// ==================== Tab2: 模板选择 ====================
function renderTemplateTab() {
    return '\
    <div id="templateTab">\
        <p style="margin-bottom:12px;color:var(--text-secondary);">选择一个预设模板来快速创建活动</p>\
        <div id="templateGrid" class="template-grid"></div>\
        <div id="templatePreview" style="display:none;"></div>\
    </div>';
}

function bindTemplateEvents() {
    if (AI_CREATE_USE_MOCK) {
        renderTemplateCards(MOCK_TEMPLATES);
    } else {
        api('/activities/templates').then(function (res) {
            renderTemplateCards(res.data);
        }).catch(function () {
            renderTemplateCards(MOCK_TEMPLATES);
        });
    }
}

function renderTemplateCards(templates) {
    var grid = document.getElementById('templateGrid');
    var html = '';
    for (var i = 0; i < templates.length; i++) {
        var t = templates[i];
        var catLabel = getCatLabelAi(t.category);
        html += '\
        <div class="template-card" data-id="' + t.id + '" data-name="' + escHtmlAi(t.name) + '" data-category="' + t.category + '" data-title="' + escHtmlAi(t.titleTemplate) + '" data-desc="' + escHtmlAi(t.descriptionTemplate) + '">\
            <div class="template-icon">' + (t.icon || '📋') + '</div>\
            <div class="template-name">' + escHtmlAi(t.name) + '</div>\
            <div class="template-cat">' + catLabel + '</div>\
        </div>';
    }
    grid.innerHTML = html;

    grid.addEventListener('click', function (e) {
        var card = e.target.closest('.template-card');
        if (!card) return;
        selectTemplate({
            name: card.dataset.name,
            category: card.dataset.category,
            titleTemplate: card.dataset.title,
            descriptionTemplate: card.dataset.desc
        });
    });
}

function selectTemplate(t) {
    aiCreateState.form.category = t.category;
    aiCreateState.form.title = t.titleTemplate.replace(/\{[^}]+\}/g, '');
    aiCreateState.form.description = t.descriptionTemplate.replace(/\{[^}]+\}/g, '');
    aiCreateState.form.tags = '';

    document.getElementById('templateGrid').style.display = 'none';

    document.getElementById('templatePreview').style.display = 'block';
    document.getElementById('templatePreview').innerHTML = '\
    <div style="border-top:1px solid var(--border);padding-top:16px;">\
        <h4 style="margin-bottom:4px;">已选择模板：' + escHtmlAi(t.name) + '</h4>\
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">可修改后直接发布，或<a href="#/create-activity" onclick="saveAiDraftAndGo()" style="color:var(--primary);">去手动创建页</a>完善更多细节</p>\
        <div class="form-group">\
            <label>活动标题 <span style="color:#ef4444;">*</span></label>\
            <input type="text" id="tplTitle" class="form-input" value="' + escHtmlAi(aiCreateState.form.title) + '">\
        </div>\
        <div class="form-group">\
            <label>活动描述 <span style="color:#ef4444;">*</span></label>\
            <textarea id="tplDesc" class="form-input" rows="4">' + escHtmlAi(aiCreateState.form.description) + '</textarea>\
        </div>\
        <div class="form-group">\
            <label>标签</label>\
            <input type="text" id="tplTags" class="form-input" placeholder="多个标签用逗号分隔" value="">\
        </div>\
        <div class="form-group">\
            <label>活动地点 <span style="color:#ef4444;">*</span></label>\
            <input type="text" id="tplLocation" class="form-input" value="' + escHtmlAi(aiCreateState.form.location) + '">\
        </div>\
        ' + renderAiExtraFields() + '\
        <div style="display:flex;gap:8px;">\
            <button id="btnBackTemplate" class="btn btn-outline" style="flex:1;">返回模板列表</button>\
            <button id="btnPublishTpl" class="btn btn-primary" style="flex:1;">发布活动</button>\
        </div>\
    </div>';

    document.getElementById('btnBackTemplate').addEventListener('click', function () {
        document.getElementById('templateGrid').style.display = '';
        document.getElementById('templatePreview').style.display = 'none';
    });
    document.getElementById('btnPublishTpl').addEventListener('click', function () {
        collectFormFromAiPreview('tpl');
        doPublishAi();
    });
}

function renderAiExtraFields() {
    return '\
    <div class="form-row">\
        <div class="form-group">\
            <label>开始时间 <span style="color:#ef4444;">*</span></label>\
            <input type="datetime-local" id="fStartTime" class="form-input" value="' + escHtmlAi(aiCreateState.form.startTime) + '">\
        </div>\
        <div class="form-group">\
            <label>结束时间 <span style="color:#ef4444;">*</span></label>\
            <input type="datetime-local" id="fEndTime" class="form-input" value="' + escHtmlAi(aiCreateState.form.endTime) + '">\
        </div>\
    </div>\
    <div class="form-row">\
        <div class="form-group">\
            <label>人数上限</label>\
            <input type="number" id="fMaxParticipants" class="form-input" min="1" value="' + aiCreateState.form.maxParticipants + '">\
        </div>\
        <div class="form-group">\
            <label>费用 (元)</label>\
            <input type="number" id="fFee" class="form-input" min="0" step="0.01" value="' + aiCreateState.form.fee + '">\
        </div>\
    </div>\
    <div class="form-group">\
        <label>报名截止时间</label>\
        <input type="datetime-local" id="fRegistrationDeadline" class="form-input" value="' + escHtmlAi(aiCreateState.form.registrationDeadline) + '">\
    </div>';
}

function bindAiTabEvents(mode) {
    if (mode === 'ai') bindAiGenerateEvents();
    if (mode === 'template') bindTemplateEvents();
}

// ---- 保存当前表单数据为草稿并跳转手动创建页 ----
function saveAiDraftAndGo() {
    collectAiCurrentForm();
    var f = aiCreateState.form;
    var draft = {
        title: f.title || '',
        description: f.description || '',
        category: f.category || '',
        startTime: f.startTime || '',
        endTime: f.endTime || '',
        registrationDeadline: f.registrationDeadline || '',
        location: f.location || '',
        maxParticipants: f.maxParticipants,
        fee: f.fee,
        tags: f.tags || '',
        coverImage: f.coverImage || ''
    };
    localStorage.setItem('activity_draft', JSON.stringify(draft));
}

function collectAiCurrentForm() {
    // 尝试从当前可见的表单元素收集数据
    var mode = aiCreateState.mode;
    if (mode === 'ai') {
        var aiTitle = document.getElementById('aiTitle');
        var aiDesc = document.getElementById('aiDesc');
        var aiTags = document.getElementById('aiTags');
        var aiLocation = document.getElementById('aiLocation');
        if (aiTitle) aiCreateState.form.title = aiTitle.value.trim();
        if (aiDesc) aiCreateState.form.description = aiDesc.value.trim();
        if (aiTags) aiCreateState.form.tags = aiTags.value.trim();
        if (aiLocation) aiCreateState.form.location = aiLocation.value.trim();
    } else if (mode === 'template') {
        var tplTitle = document.getElementById('tplTitle');
        var tplDesc = document.getElementById('tplDesc');
        var tplTags = document.getElementById('tplTags');
        var tplLocation = document.getElementById('tplLocation');
        if (tplTitle) aiCreateState.form.title = tplTitle.value.trim();
        if (tplDesc) aiCreateState.form.description = tplDesc.value.trim();
        if (tplTags) aiCreateState.form.tags = tplTags.value.trim();
        if (tplLocation) aiCreateState.form.location = tplLocation.value.trim();
    }
    collectAiExtraFields();
}

function collectAiExtraFields() {
    var start = document.getElementById('fStartTime');
    var end = document.getElementById('fEndTime');
    var maxP = document.getElementById('fMaxParticipants');
    var fee = document.getElementById('fFee');
    var deadline = document.getElementById('fRegistrationDeadline');
    if (start) aiCreateState.form.startTime = start.value;
    if (end) aiCreateState.form.endTime = end.value;
    if (maxP) aiCreateState.form.maxParticipants = parseInt(maxP.value) || 20;
    if (fee) aiCreateState.form.fee = parseFloat(fee.value) || 0;
    if (deadline) aiCreateState.form.registrationDeadline = deadline.value;
}

// ---- AI生成请求 ----
async function doAiGenerate() {
    var topic = document.getElementById('aiTopic').value.trim();
    var category = document.getElementById('aiCategory').value;

    if (!topic) { toast('请输入活动主题', 'error'); return; }

    var btn = document.getElementById('btnGenerate');
    btn.disabled = true;
    btn.textContent = '生成中...';

    try {
        var data;
        if (AI_CREATE_USE_MOCK) {
            data = MOCK_AI_RESULT;
        } else {
            var res = await api('/activities/ai-generate', {
                method: 'POST',
                body: { topic: topic, category: category }
            });
            data = res.data;
        }
        document.getElementById('aiResult').style.display = 'block';
        document.getElementById('aiResult').innerHTML = renderAiResult(data);
        document.getElementById('btnPublishAi').addEventListener('click', function () {
            collectFormFromAiPreview('ai');
            doPublishAi();
        });
    } catch (err) {
        toast(err.message || '生成失败', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '生成活动内容';
    }
}

// ---- 发布活动 ----
async function doPublishAi() {
    var f = aiCreateState.form;
    if (!f.title || !f.description || !f.startTime || !f.endTime || !f.location) {
        toast('请填写所有必填项', 'error');
        return;
    }
    if (new Date(f.endTime) <= new Date(f.startTime)) {
        toast('结束时间必须晚于开始时间', 'error');
        return;
    }

    var body = {
        title: f.title,
        description: f.description,
        category: f.category,
        startTime: new Date(f.startTime).toISOString(),
        endTime: new Date(f.endTime).toISOString(),
        location: f.location,
        maxParticipants: f.maxParticipants || 20,
        fee: f.fee || 0,
        tags: f.tags ? f.tags.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [],
        registrationDeadline: f.registrationDeadline ? new Date(f.registrationDeadline).toISOString() : null
    };

    try {
        var res;
        if (AI_CREATE_USE_MOCK) {
            res = { data: { id: Math.floor(Math.random() * 1000) + 100 } };
        } else {
            res = await api('/activities', { method: 'POST', body: body });
        }
        toast('发布成功！');
        setTimeout(function () {
            Router.navigate('/activity/' + res.data.id);
        }, 500);
    } catch (err) {
        toast(err.message || '发布失败', 'error');
    }
}

function collectFormFromAiPreview(prefix) {
    aiCreateState.form.title = document.getElementById(prefix + 'Title').value.trim();
    aiCreateState.form.description = document.getElementById(prefix + 'Desc').value.trim();
    aiCreateState.form.tags = document.getElementById(prefix + 'Tags') ? document.getElementById(prefix + 'Tags').value.trim() : '';
    aiCreateState.form.location = document.getElementById(prefix + 'Location') ? document.getElementById(prefix + 'Location').value.trim() : '';
    collectAiExtraFields();
}

function escHtmlAi(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getCatLabelAi(cat) {
    var found = AI_CATEGORY_OPTIONS.filter(function (o) { return o.value === cat; });
    return found.length ? found[0].label : cat;
}
