// ====== 注册页 ======
Router.register('/register', {
    title: '注册',
    authOnly: true,

    render: function() {
        return `
        <div class="container">
            <div class="header">
                <div class="logo">🎯</div>
                <h1>创建账号</h1>
                <p>加入趣聚，发现同好活动</p>
            </div>
            <div id="regAlert" class="alert"></div>
            <div class="card">
                <div class="role-tabs">
                    <div class="role-tab active" id="tabUser" onclick="switchRegRole('user')">👤 个人用户</div>
                    <div class="role-tab" id="tabBiz" onclick="switchRegRole('business')">🏪 商家用户</div>
                </div>
                <form id="regForm">
                    <div class="form-group"><label>邮箱 *</label><input type="email" id="regEmail" placeholder="请输入邮箱" required></div>
                    <div class="form-group"><label>昵称 *</label><input type="text" id="regNick" placeholder="全平台唯一昵称" required maxlength="20"></div>
                    <div class="form-group"><label>密码 *</label><input type="password" id="regPwd" placeholder="至少8位，包含字母和数字" required minlength="8"><p class="hint">至少8位，必须包含字母和数字</p></div>
                    <div class="form-group"><label>手机号</label><input type="tel" id="regPhone" placeholder="选填"></div>
                    <div id="bizFields" style="display:none;">
                        <div class="form-group"><label>统一社会信用代码 *</label><input type="text" id="regCreditCode" placeholder="18位统一社会信用代码" maxlength="18"></div>
                        <div class="form-group"><label>商家地址 *</label><input type="text" id="regAddr" placeholder="请输入商家地址"></div>
                        <div class="form-group">
                            <label>营业执照 *</label>
                            <div class="file-upload" id="licUpload" onclick="document.getElementById('licFile').click()">
                                <div class="icon">📄</div><div class="text">点击上传营业执照</div><div class="filename" id="licName"></div>
                            </div>
                            <input type="file" id="licFile" accept="image/*,.pdf" style="display:none;" onchange="onLicPick(event)">
                            <p class="hint">支持 JPG、PNG、PDF，不超过5MB</p>
                        </div>
                    </div>
                    <input type="hidden" id="regRole" value="user">
                    <button type="submit" class="btn btn-primary" id="regBtn">注 册</button>
                </form>
            </div>
            <div class="form-footer"><a href="#/login">已有账号？返回登录</a></div>
        </div>`;
    },

    init: function() {
        window.switchRegRole = function(role) {
            document.querySelectorAll('.role-tab').forEach(function(t) { t.classList.remove('active'); });
            document.getElementById(role === 'user' ? 'tabUser' : 'tabBiz').classList.add('active');
            document.getElementById('bizFields').style.display = role === 'business' ? 'block' : 'none';
            document.getElementById('regRole').value = role;
        };
        window.licFile = null;
        window.onLicPick = function(e) {
            if (e.target.files[0]) { window.licFile = e.target.files[0]; document.getElementById('licName').textContent = e.target.files[0].name; }
        };

        document.getElementById('regForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            var alertEl = document.getElementById('regAlert');
            var btn = document.getElementById('regBtn');
            var role = document.getElementById('regRole').value;
            var pwd = document.getElementById('regPwd').value;

            alertEl.classList.remove('show');
            var email = document.getElementById('regEmail').value;
            if (!isEmail(email)) { alertEl.textContent='请输入正确的邮箱地址'; alertEl.className='alert alert-error show'; return; }
            if (pwd.length < 8) { alertEl.textContent='密码至少8位'; alertEl.className='alert alert-error show'; return; }
            if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(pwd)) { alertEl.textContent='密码必须包含字母和数字'; alertEl.className='alert alert-error show'; return; }
            if (role === 'business') {
                var creditCode = document.getElementById('regCreditCode').value.trim();
                if (!creditCode) { alertEl.textContent='请输入统一社会信用代码'; alertEl.className='alert alert-error show'; return; }
                if (creditCode.length !== 18) { alertEl.textContent='统一社会信用代码应为18位'; alertEl.className='alert alert-error show'; return; }
                if (!document.getElementById('regAddr').value.trim()) { alertEl.textContent='商家地址不能为空'; alertEl.className='alert alert-error show'; return; }
                if (!window.licFile) { alertEl.textContent='请上传营业执照'; alertEl.className='alert alert-error show'; return; }
            }

            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> 注册中...';
            try {
                var body = { email: document.getElementById('regEmail').value, password: pwd,
                    nickname: document.getElementById('regNick').value, role: role,
                    phone: document.getElementById('regPhone').value || undefined };
                if (role === 'business') {
                    body.creditCode = creditCode;
                    var upRes = await UploadAPI.upload(window.licFile, 'business_license');
                    body.businessLicense = upRes.data.url;
                    body.address = document.getElementById('regAddr').value;
                }
                var res = await AuthAPI.register(body);
                setToken(res.data.token);
                setCurUser(res.data.user);
                toast('注册成功！');
                Router.navigate('/home');
            } catch (err) {
                alertEl.textContent = err.message || '注册失败';
                alertEl.className = 'alert alert-error show';
                btn.disabled = false; btn.textContent = '注 册';
            }
        });
    }
});
