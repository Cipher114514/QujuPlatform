// ====== 登录页 ======
Router.register('/login', {
    title: '登录',
    authOnly: true,

    render: function() {
        return `
        <div class="login-page-wrapper">

            <!-- 左侧：CareerCompass 风格几何角色 -->
            <div class="login-mascot-area">
                <div class="characters-stage" id="charactersStage">
                    <!-- 紫色角色 — 后排高矩形 -->
                    <div class="char char-purple" id="charPurple">
                        <div class="char-eyes">
                            <div class="char-eye" data-eye>
                                <div class="char-pupil"></div>
                            </div>
                            <div class="char-eye" data-eye>
                                <div class="char-pupil"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 黑色角色 — 中排矩形 -->
                    <div class="char char-black" id="charBlack">
                        <div class="char-eyes">
                            <div class="char-eye char-eye-sm" data-eye>
                                <div class="char-pupil"></div>
                            </div>
                            <div class="char-eye char-eye-sm" data-eye>
                                <div class="char-pupil"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 橙色角色 — 前排左侧半圆 -->
                    <div class="char char-orange" id="charOrange">
                        <div class="char-eyes">
                            <div class="char-pupil char-pupil-bare"></div>
                            <div class="char-pupil char-pupil-bare"></div>
                        </div>
                    </div>

                    <!-- 黄色角色 — 前排右侧半圆 -->
                    <div class="char char-yellow" id="charYellow">
                        <div class="char-eyes">
                            <div class="char-pupil char-pupil-bare"></div>
                            <div class="char-pupil char-pupil-bare"></div>
                        </div>
                        <div class="char-mouth"></div>
                    </div>
                </div>
            </div>

            <!-- 右侧：登录表单 -->
            <div class="login-form-area">
                <div class="container">
                    <div class="header">
                        <div class="logo">&#x1f3af;</div>
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
                        <p style="font-size:13px;color:#64748b;margin-bottom:8px;">测试账号（点击快速填充）：</p>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                            <button class="btn btn-outline btn-sm" style="text-align:left;font-size:12px;"
                                onclick="document.getElementById('loginEmail').value='admin@platform.com';document.getElementById('loginPwd').value='test1234'">
                                ⭐ admin@platform.com
                            </button>
                            <button class="btn btn-outline btn-sm" style="text-align:left;font-size:12px;"
                                onclick="document.getElementById('loginEmail').value='zhangsan@test.com';document.getElementById('loginPwd').value='test1234'">
                                👤 张三
                            </button>
                            <button class="btn btn-outline btn-sm" style="text-align:left;font-size:12px;"
                                onclick="document.getElementById('loginEmail').value='lisi@test.com';document.getElementById('loginPwd').value='test1234'">
                                👤 李四
                            </button>
                            <button class="btn btn-outline btn-sm" style="text-align:left;font-size:12px;"
                                onclick="document.getElementById('loginEmail').value='wangwu@test.com';document.getElementById('loginPwd').value='test1234'">
                                👤 王五
                            </button>
                            <button class="btn btn-outline btn-sm" style="text-align:left;font-size:12px;"
                                onclick="document.getElementById('loginEmail').value='zhouba@test.com';document.getElementById('loginPwd').value='test1234'">
                                🏪 周八的运动馆
                            </button>
                            <button class="btn btn-outline btn-sm" style="text-align:left;font-size:12px;"
                                onclick="document.getElementById('loginEmail').value='zhengshi@test.com';document.getElementById('loginPwd').value='test1234'">
                                🏪 郑十的桌游吧
                            </button>
                        </div>
                        <p style="font-size:11px;color:#94a3b8;margin-top:6px;">所有测试账号密码: test1234</p>
                    </div>
                </div>
            </div>
        </div>`;
    },

    init: function() {
        document.body.classList.add('login-page');

        // ===== 角色元素引用 =====
        var stage = document.getElementById('charactersStage');
        var charPurple = document.getElementById('charPurple');
        var charBlack = document.getElementById('charBlack');
        var charOrange = document.getElementById('charOrange');
        var charYellow = document.getElementById('charYellow');
        var emailInput = document.getElementById('loginEmail');
        var pwdInput = document.getElementById('loginPwd');

        // 所有瞳孔
        var allPupils = stage.querySelectorAll('.char-pupil');

        // ===== 状态变量 =====
        var mouseX = -1000, mouseY = -1000;
        var isTyping = false;
        var isTypingTimer = null;
        var isPurpleBlinking = false;
        var isBlackBlinking = false;
        var isLookingAtEachOther = false;
        var isPurplePeeking = false;
        var typingTimeout = null;

        // ===== 获取角色中心坐标 =====
        function getCharCenter(el) {
            var rect = el.getBoundingClientRect();
            var stageRect = stage.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2 - stageRect.left,
                y: rect.top + rect.height / 3 - stageRect.top
            };
        }

        // ===== 计算瞳孔偏移 =====
        function calcPupilOffset(eyeRect, mouseCX, mouseCY, maxDist, forceX, forceY) {
            if (forceX !== undefined && forceY !== undefined) {
                return { x: forceX, y: forceY };
            }
            var eyeCX = eyeRect.left + eyeRect.width / 2;
            var eyeCY = eyeRect.top + eyeRect.height / 2;
            var dx = mouseX - eyeCX;
            var dy = mouseY - eyeCY;
            var dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
            if (dist < 0.01) return { x: 0, y: 0 };
            var angle = Math.atan2(dy, dx);
            return {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist
            };
        }

        // ===== 计算身体倾斜 =====
        function calcBodySkew(el, stageRect) {
            var rect = el.getBoundingClientRect();
            var cx = rect.left + rect.width / 2;
            var cy = rect.top + rect.height / 3;
            var dx = mouseX - cx;
            var skew = Math.max(-6, Math.min(6, -dx / 120));
            var faceX = Math.max(-15, Math.min(15, dx / 20));
            var faceY = Math.max(-10, Math.min(10, (mouseY - cy) / 30));
            return { skew: skew, faceX: faceX, faceY: faceY };
        }

        // ===== 主更新循环 =====
        function updateCharacters() {
            var stageRect = stage.getBoundingClientRect();

            // --- 紫色角色 ---
            var purplePupils = charPurple.querySelectorAll('.char-pupil');
            var purpleEyes = charPurple.querySelectorAll('[data-eye]');
            var purplePos = calcBodySkew(charPurple, stageRect);

            // 密码隐蔽时变高+倾斜；密码可见时探头偷看
            var pwdLen = pwdInput.value.length;
            var pwdVisible = pwdInput.type === 'text';
            var isHidingPwd = pwdLen > 0 && !pwdVisible;

            charPurple.style.height = (isTyping || isHidingPwd) ? '440px' : '400px';
            if (pwdLen > 0 && pwdVisible) {
                charPurple.style.transform = 'skewX(0deg)';
            } else if (isTyping || isHidingPwd) {
                charPurple.style.transform = 'skewX(' + ((purplePos.skew || 0) - 12) + 'deg) translateX(40px)';
            } else {
                charPurple.style.transform = 'skewX(' + (purplePos.skew || 0) + 'deg)';
            }

            // 紫色眼睛位置
            var eyesContainer = charPurple.querySelector('.char-eyes');
            var eyeLeft, eyeTop;
            if (pwdLen > 0 && pwdVisible) {
                eyeLeft = 20; eyeTop = 35;
            } else if (isLookingAtEachOther) {
                eyeLeft = 55; eyeTop = 65;
            } else {
                eyeLeft = 45 + (purplePos.faceX || 0);
                eyeTop = 40 + (purplePos.faceY || 0);
            }
            eyesContainer.style.left = eyeLeft + 'px';
            eyesContainer.style.top = eyeTop + 'px';

            // 紫色瞳孔：密码可见时探头偷看
            purplePupils.forEach(function(pupil, i) {
                var eyeRect = purpleEyes[i].getBoundingClientRect();
                var forceX, forceY;
                if (pwdLen > 0 && pwdVisible) {
                    forceX = isPurplePeeking ? 4 : -4;
                    forceY = isPurplePeeking ? 5 : -4;
                } else if (isLookingAtEachOther) {
                    forceX = 3; forceY = 4;
                }
                var off = calcPupilOffset(eyeRect, 0, 0, 5, forceX, forceY);
                pupil.style.transform = 'translate(' + off.x + 'px, ' + off.y + 'px)';
            });

            // --- 黑色角色 ---
            var blackPupils = charBlack.querySelectorAll('.char-pupil');
            var blackEyes = charBlack.querySelectorAll('[data-eye]');
            var blackPos = calcBodySkew(charBlack, stageRect);

            charBlack.style.height = '310px';
            if (pwdLen > 0 && pwdVisible) {
                charBlack.style.transform = 'skewX(0deg)';
            } else if (isLookingAtEachOther) {
                charBlack.style.transform = 'skewX(' + ((blackPos.skew || 0) * 1.5 + 10) + 'deg) translateX(20px)';
            } else if (isTyping || isHidingPwd) {
                charBlack.style.transform = 'skewX(' + ((blackPos.skew || 0) * 1.5) + 'deg)';
            } else {
                charBlack.style.transform = 'skewX(' + (blackPos.skew || 0) + 'deg)';
            }

            var bEyesCont = charBlack.querySelector('.char-eyes');
            var bLeft, bTop;
            if (pwdLen > 0 && pwdVisible) {
                bLeft = 10; bTop = 28;
            } else if (isLookingAtEachOther) {
                bLeft = 32; bTop = 12;
            } else {
                bLeft = 26 + (blackPos.faceX || 0);
                bTop = 32 + (blackPos.faceY || 0);
            }
            bEyesCont.style.left = bLeft + 'px';
            bEyesCont.style.top = bTop + 'px';

            blackPupils.forEach(function(pupil, i) {
                var eyeRect = blackEyes[i].getBoundingClientRect();
                var forceX, forceY;
                if (pwdLen > 0 && pwdVisible) {
                    forceX = -4; forceY = -4;
                } else if (isLookingAtEachOther) {
                    forceX = 0; forceY = -4;
                }
                var off = calcPupilOffset(eyeRect, 0, 0, 4, forceX, forceY);
                pupil.style.transform = 'translate(' + off.x + 'px, ' + off.y + 'px)';
            });

            // --- 橙色角色 ---
            var orangePupils = charOrange.querySelectorAll('.char-pupil');
            var orangePos = calcBodySkew(charOrange, stageRect);
            if (pwdLen > 0 && pwdVisible) {
                charOrange.style.transform = 'skewX(0deg)';
            } else {
                charOrange.style.transform = 'skewX(' + (orangePos.skew || 0) + 'deg)';
            }
            var oEyesCont = charOrange.querySelector('.char-eyes');
            var oLeft = pwdLen > 0 && pwdVisible ? 50 : 82 + (orangePos.faceX || 0);
            var oTop = pwdLen > 0 && pwdVisible ? 85 : 90 + (orangePos.faceY || 0);
            oEyesCont.style.left = oLeft + 'px';
            oEyesCont.style.top = oTop + 'px';
            orangePupils.forEach(function(pupil) {
                var er = pupil.getBoundingClientRect();
                var forceX, forceY;
                if (pwdLen > 0 && pwdVisible) { forceX = -5; forceY = -4; }
                var off = calcPupilOffset(er, 0, 0, 5, forceX, forceY);
                pupil.style.transform = 'translate(' + off.x + 'px, ' + off.y + 'px)';
            });

            // --- 黄色角色 ---
            var yellowPupils = charYellow.querySelectorAll('.char-pupil');
            var yellowPos = calcBodySkew(charYellow, stageRect);
            if (pwdLen > 0 && pwdVisible) {
                charYellow.style.transform = 'skewX(0deg)';
            } else {
                charYellow.style.transform = 'skewX(' + (yellowPos.skew || 0) + 'deg)';
            }
            var yEyesCont = charYellow.querySelector('.char-eyes');
            var yLeft = pwdLen > 0 && pwdVisible ? 20 : 52 + (yellowPos.faceX || 0);
            var yTop = pwdLen > 0 && pwdVisible ? 35 : 40 + (yellowPos.faceY || 0);
            yEyesCont.style.left = yLeft + 'px';
            yEyesCont.style.top = yTop + 'px';
            yellowPupils.forEach(function(pupil) {
                var er = pupil.getBoundingClientRect();
                var forceX, forceY;
                if (pwdLen > 0 && pwdVisible) { forceX = -5; forceY = -4; }
                var off = calcPupilOffset(er, 0, 0, 5, forceX, forceY);
                pupil.style.transform = 'translate(' + off.x + 'px, ' + off.y + 'px)';
            });

            // 黄色嘴巴
            var mouth = charYellow.querySelector('.char-mouth');
            if (mouth) {
                mouth.style.left = (pwdLen > 0 && pwdVisible ? 10 : 40 + (yellowPos.faceX || 0)) + 'px';
                mouth.style.top = (pwdLen > 0 && pwdVisible ? 88 : 88 + (yellowPos.faceY || 0)) + 'px';
            }

            animFrameId = requestAnimationFrame(updateCharacters);
        }

        // ===== 鼠标事件 =====
        function onMouseMove(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
        function onTouchMove(e) {
            if (e.touches.length > 0) {
                mouseX = e.touches[0].clientX;
                mouseY = e.touches[0].clientY;
            }
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: true });

        // ===== 输入框检测 =====
        function onInputFocus() {
            isTyping = true;
            isLookingAtEachOther = true;
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(function() {
                isLookingAtEachOther = false;
            }, 800);
        }
        function onInputBlur() {
            isTyping = false;
            isLookingAtEachOther = false;
        }
        emailInput.addEventListener('focus', onInputFocus);
        emailInput.addEventListener('blur', onInputBlur);
        pwdInput.addEventListener('focus', onInputFocus);
        pwdInput.addEventListener('blur', onInputBlur);

        // 密码输入时触发探头偷看
        pwdInput.addEventListener('input', function() {
            if (pwdInput.value.length > 0) {
                isLookingAtEachOther = true;
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(function() {
                    isLookingAtEachOther = false;
                }, 800);
            }
        });

        // ===== 随机眨眼 =====
        function schedulePurpleBlink() {
            var delay = 3000 + Math.random() * 4000;
            setTimeout(function() {
                charPurple.classList.add('blinking');
                setTimeout(function() {
                    charPurple.classList.remove('blinking');
                    schedulePurpleBlink();
                }, 150);
            }, delay);
        }
        function scheduleBlackBlink() {
            var delay = 3000 + Math.random() * 4000;
            setTimeout(function() {
                charBlack.classList.add('blinking');
                setTimeout(function() {
                    charBlack.classList.remove('blinking');
                    scheduleBlackBlink();
                }, 150);
            }, delay);
        }
        schedulePurpleBlink();
        scheduleBlackBlink();

        // ===== 紫色探头偷看（密码可见时） =====
        var peekTimer;
        function schedulePeek() {
            peekTimer = setTimeout(function() {
                if (pwdInput.value.length > 0 && pwdInput.type === 'text') {
                    isPurplePeeking = true;
                    setTimeout(function() {
                        isPurplePeeking = false;
                        schedulePeek();
                    }, 800);
                } else {
                    schedulePeek();
                }
            }, 2000 + Math.random() * 3000);
        }
        schedulePeek();

        // ===== 启动动画循环 =====
        var animFrameId = requestAnimationFrame(updateCharacters);

        // ===== 读取 URL 参数 =====
        var hash = window.location.hash.slice(1);
        var m = hash.match(/[?&]email=([^&]*)/);
        if (m) {
            emailInput.value = decodeURIComponent(m[1]);
            pwdInput.focus();
        }

        // ===== 登录表单提交 =====
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            var alertEl = document.getElementById('loginAlert');
            var btn = document.getElementById('loginBtn');
            alertEl.classList.remove('show');
            var email = emailInput.value;
            if (!isEmail(email)) { alertEl.textContent='请输入正确的邮箱地址'; alertEl.className='alert alert-error show'; return; }
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> 登录中...';

            try {
                var res = await AuthAPI.login({
                    email: emailInput.value,
                    password: pwdInput.value
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

        // 保存清理引用
        this._onMouseMove = onMouseMove;
        this._onTouchMove = onTouchMove;
        this._animFrameId = animFrameId;
        this._peekTimer = peekTimer;
    },

    destroy: function() {
        document.body.classList.remove('login-page');

        if (this._onMouseMove) document.removeEventListener('mousemove', this._onMouseMove);
        if (this._onTouchMove) document.removeEventListener('touchmove', this._onTouchMove);
        if (this._animFrameId) cancelAnimationFrame(this._animFrameId);
        if (this._peekTimer) clearTimeout(this._peekTimer);
    }
});
