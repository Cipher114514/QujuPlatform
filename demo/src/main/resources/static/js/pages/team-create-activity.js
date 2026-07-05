// ====== 队内活动创建页（US-029） ======
// 路由: #/team/:id/create-activity
// 负责人: P6
// 仅队长可访问，活动自动关联到小队

Router.register('/team/:id/create-activity', {
    title: '创建队内活动',
    requireAuth: true,

    _teamId: null,
    _teamName: '',

    render: function(params) {
        return `
        <div class="container" style="max-width:600px;">
            <div class="header">
                <div class="logo">📢</div>
                <h1>发布队内活动</h1>
                <p id="teamActSubtitle">小队专属，仅队员可见</p>
            </div>
            <div id="teamActAlert" class="alert"></div>
            <div class="card">
                <form id="teamActForm">
                    <div class="form-group">
                        <label>活动名称 <span style="color:var(--danger);">*</span></label>
                        <input type="text" id="actTitle" placeholder="给活动起个名字" maxlength="30">
                        <div class="hint"><span id="titleCount">0</span>/30</div>
                        <div class="error-msg" id="errTitle"></div>
                    </div>

                    <div class="form-group">
                        <label>活动分类 <span style="color:var(--danger);">*</span></label>
                        <select id="actCategory">
                            <option value="">请选择分类</option>
                            <option value="sports">🏃 运动健身</option>
                            <option value="hiking">🥾 户外徒步</option>
                            <option value="boardgame">🎲 桌游聚会</option>
                            <option value="study">📚 学习交流</option>
                            <option value="charity">🤝 公益活动</option>
                            <option value="citywalk">🗺️ 城市探索</option>
                        </select>
                        <div class="error-msg" id="errCategory"></div>
                    </div>

                    <div class="form-group">
                        <label>活动简介 <span style="color:var(--danger);">*</span></label>
                        <textarea id="actDesc" rows="4" placeholder="描述活动内容和亮点" maxlength="500"></textarea>
                        <div class="hint"><span id="descCount">0</span>/500</div>
                        <div class="error-msg" id="errDesc"></div>
                    </div>

                    <div class="form-group">
                        <label>活动开始时间 <span style="color:var(--danger);">*</span></label>
                        <input type="datetime-local" id="actStartTime">
                        <div class="error-msg" id="errStartTime"></div>
                    </div>

                    <div class="form-group">
                        <label>活动结束时间 <span style="color:var(--danger);">*</span></label>
                        <input type="datetime-local" id="actEndTime">
                        <div class="error-msg" id="errEndTime"></div>
                    </div>

                    <div class="form-group">
                        <label>报名截止时间 <span style="color:var(--danger);">*</span></label>
                        <input type="datetime-local" id="actDeadline">
                        <div class="error-msg" id="errDeadline"></div>
                    </div>

                    <div class="form-group">
                        <label>活动地点 <span style="color:var(--danger);">*</span></label>
                        <input type="text" id="actLocation" placeholder="如：北京市朝阳区xxx路xx号" maxlength="200">
                        <div class="error-msg" id="errLocation"></div>
                    </div>

                    <div class="form-group">
                        <label>人数上限 <span style="color:var(--danger);">*</span></label>
                        <input type="number" id="actMaxParticipants" placeholder="最大参与人数" min="1" max="100000" value="20">
                        <div class="error-msg" id="errMaxParticipants"></div>
                    </div>

                    <div class="form-group">
                        <label>活动费用（元）</label>
                        <input type="number" id="actFee" placeholder="0 表示免费" min="0" step="0.01" value="0">
                    </div>

                    <div class="form-group">
                        <label>标签（用逗号分隔）</label>
                        <input type="text" id="actTags" placeholder="如：徒步,户外,周末">
                    </div>

                    <div style="display:flex;gap:12px;margin-top:20px;">
                        <a id="btnBack" class="btn btn-outline" style="flex:1;text-align:center;">返回小队</a>
                        <button type="submit" class="btn btn-primary" style="flex:2;">发布队内活动</button>
                    </div>
                </form>
            </div>
        </div>`;
    },

    init: function(params) {
        var teamId = parseInt(params.id);
        if (!teamId) { Router.navigate('/teams'); return; }

        var self = this;
        self._teamId = teamId;

        // 返回按钮
        document.getElementById('btnBack').setAttribute('href', '#/team/' + teamId);

        // 加载小队信息，验证队长权限
        (async function() {
            try {
                var res = await TeamAPI.detail(teamId);
                var team = res.data;
                self._teamName = team.name;
                document.getElementById('teamActSubtitle').textContent =
                    '「' + team.name + '」队内专属 · 仅队员可见';

                // 非队长/管理员重定向
                if (team.userRole !== 'leader' && team.userRole !== 'admin') {
                    toast('仅队长或管理员可发布队内活动', 'error');
                    Router.navigate('/team/' + teamId);
                    return;
                }
            } catch (e) {
                toast('加载小队信息失败', 'error');
                Router.navigate('/teams');
                return;
            }
        })();

        // 字数统计
        var titleInput = document.getElementById('actTitle');
        titleInput.addEventListener('input', function() {
            document.getElementById('titleCount').textContent = titleInput.value.length;
        });
        var descInput = document.getElementById('actDesc');
        descInput.addEventListener('input', function() {
            document.getElementById('descCount').textContent = descInput.value.length;
        });

        // 表单提交
        document.getElementById('teamActForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            self._submit();
        });
    },

    _submit: async function() {
        var self = this;
        var alert = document.getElementById('teamActAlert');
        alert.className = 'alert';
        alert.innerHTML = '';

        // 收集数据
        var title = document.getElementById('actTitle').value.trim();
        var category = document.getElementById('actCategory').value;
        var desc = document.getElementById('actDesc').value.trim();
        var startTime = document.getElementById('actStartTime').value;
        var endTime = document.getElementById('actEndTime').value;
        var deadline = document.getElementById('actDeadline').value;
        var location = document.getElementById('actLocation').value.trim();
        var maxParticipants = parseInt(document.getElementById('actMaxParticipants').value);
        var fee = parseFloat(document.getElementById('actFee').value) || 0;
        var tagsStr = document.getElementById('actTags').value.trim();

        // 前端校验
        var errors = {};
        if (!title) errors.title = '请输入活动名称';
        if (!category) errors.category = '请选择活动分类';
        if (!desc) errors.desc = '请输入活动简介';
        if (!startTime) errors.startTime = '请选择开始时间';
        if (!endTime) errors.endTime = '请选择结束时间';
        if (!deadline) errors.deadline = '请选择报名截止时间';
        if (!location) errors.location = '请输入活动地点';
        if (!maxParticipants || maxParticipants < 1) errors.maxParticipants = '人数上限至少为1';
        if (maxParticipants > 100000) errors.maxParticipants = '人数上限不能超过100000';

        // 显示错误
        ['title','category','desc','startTime','endTime','deadline','location','maxParticipants'].forEach(function(k) {
            var el = document.getElementById('err' + k.charAt(0).toUpperCase() + k.slice(1));
            if (el) el.textContent = errors[k] || '';
        });

        if (Object.keys(errors).length > 0) return;

        // 解析标签
        var tags = [];
        if (tagsStr) {
            tags = tagsStr.split(/[,，]/).map(function(t) { return t.trim(); }).filter(function(t) { return t; });
        }

        // 构建请求体
        var body = {
            title: title,
            category: category,
            description: desc,
            startTime: startTime + ':00',
            endTime: endTime + ':00',
            registrationDeadline: deadline + ':00',
            location: location,
            maxParticipants: maxParticipants,
            fee: fee,
            tags: tags
        };

        // 禁用按钮
        var btn = document.querySelector('#teamActForm button[type=submit]');
        btn.disabled = true;
        btn.textContent = '发布中...';

        try {
            var res = await api('/teams/' + self._teamId + '/activities', {
                method: 'POST',
                body: body
            });
            toast('队内活动发布成功！', 'success');
            Router.navigate('/team/' + self._teamId);
        } catch (e) {
            alert.className = 'alert error';
            alert.innerHTML = e.message || '发布失败，请重试';
            btn.disabled = false;
            btn.textContent = '发布队内活动';
        }
    }
});
