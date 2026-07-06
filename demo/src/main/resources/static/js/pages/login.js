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
        </div>`;
    },

    init: function() {
        // 读取 URL 参数自动填充邮箱
        var hash = window.location.hash.slice(1);
        var m = hash.match(/[?&]email=([^&]*)/);
        if (m) {
            document.getElementById('loginEmail').value = decodeURIComponent(m[1]);
            document.getElementById('loginPwd').focus();
        }

        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            var alertEl = document.getElementById('loginAlert');
            var btn = document.getElementById('loginBtn');
            alertEl.classList.remove('show');
            var email = document.getElementById('loginEmail').value;
            if (!isEmail(email)) { alertEl.textContent='请输入正确的邮箱地址'; alertEl.className='alert alert-error show'; return; }
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> 登录中...';

            try {
                var res = await AuthAPI.login({
                    email: document.getElementById('loginEmail').value,
                    password: document.getElementById('loginPwd').value
                });
                setToken(res.data.token);
                setCurUser(res.data.user);
                if (res.data.user.status === 'pending') {
                    toast('您的商家账号正在审核中，请耐心等待');
                    Router.navigate('/pending');
                } else {
                    toast('登录成功！');
                    Router.navigate('/home');
                }
            } catch (err) {
                alertEl.textContent = err.message || '登录失败';
                alertEl.className = 'alert alert-error show';
                btn.disabled = false;
                btn.textContent = '登 录';
            }
        });
    }
});
