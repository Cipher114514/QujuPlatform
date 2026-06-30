// ====== 个人资料页（查看 / 编辑双模式） ======
Router.register('/profile', {
    title: '我的资料',
    requireAuth: true,

    render: function() {
        return '\
        <div class="home-content">\
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">\
                <div>\
                    <h2 style="margin:0;">我的资料</h2>\
                    <p style="margin:4px 0 0;color:var(--text-secondary);font-size:13px;">查看和编辑你的个人信息</p>\
                </div>\
                <button class="btn btn-primary btn-sm" id="profileEditBtn" style="display:none;" onclick="Router._currentProfile.toggleEdit()">✏️ 编辑资料</button>\
            </div>\
            <div class="card" id="profileAlert" style="display:none;margin-bottom:12px;"></div>\
            <div class="card profile-card" id="profileCard">\
                <div style="text-align:center;padding:24px;color:var(--text-secondary);">\
                    <span class="spinner" style="border-color:rgba(0,0,0,.15);border-top-color:var(--primary);display:inline-block;width:20px;height:20px;"></span> 加载中...\
                </div>\
            </div>\
        </div>';
    },

    init: function() {
        Router._currentProfile = this;
        this.load();
    },

    load: async function() {
        this.editing = false;
        var card = document.getElementById('profileCard');
        try {
            var res = await UserAPI.profile();
            this.userData = res.data;
            this.renderReadView();
            document.getElementById('profileEditBtn').style.display = '';
        } catch (err) {
            card.innerHTML = '<p style="text-align:center;color:var(--danger);padding:16px;">加载失败: '+err.message+'</p>';
        }
    },

    renderReadView: function() {
        this.editing = false;
        var u = this.userData;
        var roleMap = { user:'个人用户', business:'商家用户', admin:'管理员' };
        var genderMap = { male:'男', female:'女', other:'其他' };

        document.getElementById('profileCard').innerHTML = '\
            <div style="text-align:center;margin-bottom:16px;">\
                ' + (u.avatar ? '<img src="' + escapeHtml(u.avatar) + '" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">' : '<div style="width:80px;height:80px;border-radius:50%;background:var(--primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;">' + (u.nickname ? u.nickname.charAt(0) : '?') + '</div>') + '\
            </div>\
            <div class="field"><span class="key">邮箱</span><span class="val">' + u.email + '</span></div>\
            <div class="field"><span class="key">昵称</span><span class="val">' + escapeHtml(u.nickname) + '</span></div>\
            <div class="field"><span class="key">手机号</span><span class="val">' + escapeHtml(u.phone || '未设置') + '</span></div>\
            <div class="field"><span class="key">性别</span><span class="val">' + (genderMap[u.gender] || u.gender || '未设置') + '</span></div>\
            <div class="field"><span class="key">生日</span><span class="val">' + (u.birthday || '未设置') + '</span></div>\
            <div class="field"><span class="key">个性签名</span><span class="val">' + escapeHtml(u.bio || '未设置') + '</span></div>\
            ' + (u.role !== 'business' ? '\
            <div class="field"><span class="key">兴趣标签</span><span class="val">' + escapeHtml(u.tags || '未设置') + '</span></div>' : '') + '\
            ' + (u.role === 'business' ? '\
            <div class="field" style="border-top:1px solid var(--border);padding-top:12px;margin-top:8px;"><span class="key" style="font-weight:700;color:var(--primary);">🏪 店铺信息</span></div>\
            <div class="field"><span class="key">品牌昵称</span><span class="val">' + escapeHtml(u.nickname) + ' <span style="font-size:11px;color:var(--text-secondary);">(作为店铺名称展示)</span></span></div>\
            <div class="field"><span class="key">统一社会信用代码</span><span class="val">' + escapeHtml(u.creditCode || '未设置') + '</span></div>\
            <div class="field"><span class="key">商家地址</span><span class="val">' + escapeHtml(u.address || '未设置') + '</span></div>\
            <div class="field"><span class="key">服务领域描述</span><span class="val"><div style="font-size:13px;line-height:1.6;max-width:400px;">' + (u.businessFields ? escapeHtml(u.businessFields).replace(/\n/g, '<br>') : '未设置') + '</div></span></div>' : '') + '\
            <div class="field"><span class="key">角色</span><span class="val"><span class="role-badge ' + u.role + '">' + (roleMap[u.role] || u.role) + '</span></span></div>\
            <div class="field"><span class="key">注册时间</span><span class="val">' + (u.createdAt || '') + '</span></div>';

        document.getElementById('profileEditBtn').textContent = '✏️ 编辑资料';
    },

    toggleEdit: function() {
        if (this.editing) {
            this.renderReadView();
        } else {
            this.enterEdit();
        }
    },

    enterEdit: function() {
        this.editing = true;
        var u = this.userData;
        var genderOpts = [
            {v:'',t:'未设置'},
            {v:'male',t:'男'},
            {v:'female',t:'女'},
            {v:'other',t:'其他'}
        ];

        document.getElementById('profileCard').innerHTML = '\
        <form id="profileForm" enctype="multipart/form-data">\
            <div class="form-group">\
                <label>头像</label>\
                <div style="display:flex;align-items:center;gap:12px;">\
                    <img id="avatarPreview" src="' + (u.avatar || '') + '" style="width:60px;height:60px;border-radius:50%;object-fit:cover;' + (u.avatar ? '' : 'display:none;') + '">\
                    <div style="width:60px;height:60px;border-radius:50%;background:var(--primary);color:#fff;display:' + (u.avatar ? 'none' : 'inline-flex') + ';align-items:center;justify-content:center;font-size:24px;font-weight:700;" id="avatarFallback">' + (u.nickname ? u.nickname.charAt(0) : '?') + '</div>\
                    <input type="file" name="avatarFile" accept="image/*" style="font-size:13px;">\
                </div>\
                <span class="hint">支持 JPG/PNG，选新文件后自动上传</span>\
            </div>\
            <div class="form-group">\
                <label>邮箱</label>\
                <input class="form-input" value="' + u.email + '" disabled>\
                <span class="hint">邮箱不可修改</span>\
            </div>\
            <div class="form-group">\
                <label>昵称 <span style="color:var(--danger);">*</span></label>\
                <input class="form-input" name="nickname" maxlength="30" value="' + escapeHtml(u.nickname || '') + '" required>\
            </div>\
            <div class="form-group">\
                <label>手机号</label>\
                <input class="form-input" name="phone" maxlength="20" value="' + escapeHtml(u.phone || '') + '">\
            </div>\
            <div class="form-group">\
                <label>性别</label>\
                <select class="form-input" name="gender">\
                    ' + genderOpts.map(function(o){ return '<option value="'+o.v+'"'+(u.gender===o.v?' selected':'')+'>'+o.t+'</option>'; }).join('') + '\
                </select>\
            </div>\
            <div class="form-group">\
                <label>生日</label>\
                <input class="form-input" name="birthday" type="date" value="' + (u.birthday || '') + '">\
            </div>\
            <div class="form-group">\
                <label>个性签名</label>\
                <textarea class="form-input" name="bio" maxlength="200" rows="3" style="resize:vertical;">' + escapeHtml(u.bio || '') + '</textarea>\
                <span class="hint">最多200字</span>\
            </div>\
            ' + (u.role !== 'business' ? '\
            <div class="form-group">\
                <label>兴趣标签</label>\
                <input class="form-input" name="tags" maxlength="200" value="' + escapeHtml(u.tags || '') + '" placeholder="多个标签用逗号分隔">\
                <span class="hint">多个标签用逗号分隔，如：摄影,户外,美食</span>\
            </div>' : '') + '\
            ' + (u.role === 'business' ? '\
            <div style="margin:16px 0;padding:16px;background:#eef2ff;border-radius:8px;border:1px solid var(--primary);">\
                <div style="font-weight:700;color:var(--primary);margin-bottom:12px;">🏪 店铺资料维护</div>\
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">完善店铺信息，帮助用户更好地了解您的服务</div>\
            </div>\
            <div class="form-group">\
                <label>统一社会信用代码</label>\
                <input class="form-input" name="creditCode" maxlength="18" value="' + escapeHtml(u.creditCode || '') + '" placeholder="18位统一社会信用代码">\
                <span class="hint">请填写准确的统一社会信用代码</span>\
            </div>\
            <div class="form-group">\
                <label>商家地址</label>\
                <input class="form-input" name="address" maxlength="200" value="' + escapeHtml(u.address || '') + '" placeholder="请填写商家经营地址">\
                <span class="hint">详细地址，便于用户找到您的店铺</span>\
            </div>\
            <div class="form-group">\
                <label>服务领域描述</label>\
                <textarea class="form-input" name="businessFields" maxlength="500" rows="4" style="resize:vertical;" placeholder="请描述您提供的主要服务领域和特色...">' + escapeHtml(u.businessFields || '') + '</textarea>\
                <span class="hint">详细描述您的服务领域，如：青少年运动培训、企业团建活动策划等</span>\
            </div>' : '') + '\
            <div style="display:flex;gap:12px;margin-top:16px;">\
                <button type="submit" class="btn btn-primary" id="profileSaveBtn">保存修改</button>\
                <button type="button" class="btn btn-outline" id="profileCancelBtn">取消</button>\
            </div>\
        </form>';

        document.getElementById('profileEditBtn').textContent = '👁 取消编辑';

        var self = this;
        document.getElementById('profileForm').addEventListener('submit', function(e) { self.handleSave(e); });
        document.getElementById('profileCancelBtn').addEventListener('click', function() { self.renderReadView(); });

        // 头像预览
        document.querySelector('#profileForm [name="avatarFile"]').addEventListener('change', function() {
            var file = this.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('avatarPreview').src = e.target.result;
                    document.getElementById('avatarPreview').style.display = '';
                    document.getElementById('avatarFallback').style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    },

    handleSave: async function(e) {
        e.preventDefault();
        var alertEl = document.getElementById('profileAlert');
        var btn = document.getElementById('profileSaveBtn');
        btn.disabled = true;
        btn.textContent = '保存中...';

        // 处理头像文件上传
        var avatarFileInput = document.querySelector('#profileForm [name="avatarFile"]');
        var avatarUrl = null;
        if (avatarFileInput && avatarFileInput.files.length > 0) {
            try {
                var uploadRes = await UploadAPI.upload(avatarFileInput.files[0], 'avatar');
                avatarUrl = uploadRes.data.url;
            } catch (err) {
                alertEl.style.display = 'block';
                alertEl.innerHTML = '<div class="alert alert-error show">头像上传失败: ' + (err.message || '未知错误') + '</div>';
                btn.disabled = false;
                btn.textContent = '保存修改';
                return;
            }
        }

        var data = {};
        document.querySelectorAll('#profileForm [name]').forEach(function(el) {
            if (el.type === 'file') return;
            var v = el.value.trim();
            if (v !== '' || el.name === 'bio' || el.name === 'address' || el.name === 'businessFields' || el.name === 'tags' || el.name === 'creditCode') {
                data[el.name] = v;
            }
        });
        if (avatarUrl) {
            data.avatar = avatarUrl;
        }

        try {
            var res = await UserAPI.update(data);
            this.userData = res.data;
            setCurUser(res.data);
            this.renderReadView();
            alertEl.style.display = 'block';
            alertEl.innerHTML = '<div class="alert alert-success show">资料已更新</div>';
            toast('资料已更新');
        } catch (err) {
            alertEl.style.display = 'block';
            alertEl.innerHTML = '<div class="alert alert-error show">' + (err.message || '更新失败') + '</div>';
            btn.disabled = false;
            btn.textContent = '保存修改';
        }
    }
});

function escapeHtml(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str || ''));
    return d.innerHTML;
}
