// ====== Email activation page ======
Router.register('/activate', {
    title: '账号激活',
    authOnly: true,

    render: function() {
        return `
        <div class="container">
            <div class="header">
                <div class="logo">🎆</div>
                <h1>账号激活</h1>
                <p>正在验证你的邮箱激活链接</p>
            </div>
            <div id="activateAlert" class="alert alert-info show">激活中，请稍候...</div>
            <div class="card" style="text-align:center;">
                <button class="btn btn-primary" id="activateLoginBtn" style="display:none;">去登录</button>
            </div>
        </div>`;
    },

    init: async function() {
        var alertEl = document.getElementById('activateAlert');
        var loginBtn = document.getElementById('activateLoginBtn');
        loginBtn.addEventListener('click', function() {
            Router.navigate('/login');
        });

        var token = Router.query && Router.query.token;
        if (!token) {
            alertEl.textContent = '激活链接缺少 token，请重新打开邮件中的链接';
            alertEl.className = 'alert alert-error show';
            loginBtn.style.display = 'inline-block';
            return;
        }

        try {
            await AuthAPI.activate(token);
            alertEl.textContent = '账号激活成功，现在可以登录';
            alertEl.className = 'alert alert-success show';
            loginBtn.style.display = 'inline-block';
        } catch (err) {
            alertEl.textContent = err.message || '激活失败，请确认链接是否过期';
            alertEl.className = 'alert alert-error show';
            loginBtn.style.display = 'inline-block';
        }
    }
});
