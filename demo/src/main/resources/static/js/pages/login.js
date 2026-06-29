// ====== 登录页 ======
Router.register('/login', {
    title: '登录',
    authOnly: true,  // 已登录用户不可访问

    render: function() {
        return `
        <div class="container">
            <div class="header">
                <div class="logo">🎯</div>
                <h1>趣聚</h1>
                <p>以兴趣为纽带，发现身边精彩活动</p>
            </div>
            <div id="loginAlert" class="alert"></div>
            <div class="card">
                <form id="loginForm">
                    <div class="form-group">
                        <label>邮箱地址</label>
                        <input type="email" id="loginEmail" placeholder="请输入邮箱" required>
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" id="loginPwd" placeholder="请输入密码" required>
                    </div>
                    <button type="submit" class="btn btn-primary" id="loginBtn">登 录</button>
                </form>
            </div>
            <div class="form-footer"><a href="#/register">还没有账号？立即注册</a></div>
            <div class="card" style="margin-top:20px;background:#f8fafc;">
                <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">测试账号（点击快速填充）：</p>
                <button class="btn btn-outline btn-sm" style="margin-bottom:6px;text-align:left;"
                    onclick="document.getElementById('loginEmail').value='user@test.com';document.getElementById('loginPwd').value='test1234'">
                    👤 个人用户: user@test.com
                </button>
                <button class="btn btn-outline btn-sm" style="text-align:left;"
                    onclick="document.getElementById('loginEmail').value='business@test.com';document.getElementById('loginPwd').value='test1234'">
                    🏪 商家用户: business@test.com
                </button>
            </div>
        </div>`;
    },

    init: function() {
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            var alertEl = document.getElementById('loginAlert');
            var btn = document.getElementById('loginBtn');
            alertEl.classList.remove('show');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> 登录中...';

            try {
                var res = await AuthAPI.login({
                    email: document.getElementById('loginEmail').value,
                    password: document.getElementById('loginPwd').value
                });
                setToken(res.data.token);
                setCurUser(res.data.user);
                toast('登录成功！');
                Router.navigate('/home');
            } catch (err) {
                alertEl.textContent = err.message || '登录失败';
                alertEl.className = 'alert alert-error show';
                btn.disabled = false;
                btn.textContent = '登 录';
            }
        });
    }
});
