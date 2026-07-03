var ActivityCheckinPage = {
    stream: null,
    scanning: false,
    scanLocked: false,

    render: function() {
        return '\
        <div class="home-content">\
            <button class="btn btn-outline btn-sm" onclick="history.back()" style="width:auto;margin-bottom:12px;">返回</button>\
            <div class="welcome-card">\
                <h2>签到核销</h2>\
                <p>扫码或输入 6 位验证码完成现场签到</p>\
            </div>\
            <div id="checkinError"></div>\
            <div class="card">\
                <h3 style="font-size:15px;margin-bottom:12px;">扫码核销</h3>\
                <div id="scannerPanel" style="position:relative;background:#0f172a;border-radius:8px;overflow:hidden;min-height:260px;display:flex;align-items:center;justify-content:center;color:#fff;">\
                    <video id="scanVideo" playsinline style="width:100%;max-height:320px;display:none;"></video>\
                    <div id="scanHint" style="font-size:14px;color:#cbd5e1;">正在打开摄像头...</div>\
                </div>\
                <canvas id="scanCanvas" style="display:none;"></canvas>\
                <p style="font-size:12px;color:var(--text-secondary);margin-top:8px;">摄像头权限被拒绝时，可使用下方手动验证码。</p>\
            </div>\
            <div class="card">\
                <h3 style="font-size:15px;margin-bottom:12px;">手动核销</h3>\
                <div style="display:flex;gap:8px;">\
                    <input id="manualCheckinCode" class="form-input" inputmode="numeric" maxlength="6" placeholder="输入 6 位验证码" style="font-size:18px;letter-spacing:3px;">\
                    <button id="manualCheckinBtn" class="btn btn-primary btn-sm" style="width:auto;white-space:nowrap;">核销</button>\
                </div>\
            </div>\
            <div class="card">\
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;">\
                    <h3 style="font-size:15px;">签到名单</h3>\
                    <button id="refreshListBtn" class="btn btn-outline btn-sm" style="width:auto;">刷新</button>\
                </div>\
                <div id="checkinStats" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;"></div>\
                <div class="tabs" style="margin-bottom:12px;">\
                    <button class="tab-btn active" data-tab="unchecked">未签到</button>\
                    <button class="tab-btn" data-tab="checked">已签到</button>\
                </div>\
                <div id="checkinList">加载中...</div>\
            </div>\
        </div>';
    },

    init: function(params) {
        this.activityId = params.id;
        this.activeTab = 'unchecked';
        this.bindEvents();
        this.loadList();
        this.startScanner();
    },

    destroy: function() {
        this.scanning = false;
        if (this.stream) {
            this.stream.getTracks().forEach(function(track) { track.stop(); });
            this.stream = null;
        }
    },

    bindEvents: function() {
        var self = this;
        document.getElementById('manualCheckinBtn').addEventListener('click', function() {
            self.submitCheckin(document.getElementById('manualCheckinCode').value.trim());
        });
        document.getElementById('manualCheckinCode').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') self.submitCheckin(e.target.value.trim());
        });
        document.getElementById('refreshListBtn').addEventListener('click', function() { self.loadList(); });
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                self.activeTab = btn.dataset.tab;
                self.renderList();
            });
        });
    },

    startScanner: async function() {
        var video = document.getElementById('scanVideo');
        var hint = document.getElementById('scanHint');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.jsQR) {
            hint.textContent = '当前浏览器不支持扫码，请使用手动验证码';
            return;
        }
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = this.stream;
            await video.play();
            video.style.display = 'block';
            hint.style.display = 'none';
            this.scanning = true;
            this.scanFrame();
        } catch (err) {
            hint.textContent = '摄像头权限被拒绝，请使用手动验证码';
        }
    },

    scanFrame: function() {
        if (!this.scanning || this.scanLocked) {
            if (this.scanning) requestAnimationFrame(this.scanFrame.bind(this));
            return;
        }
        var video = document.getElementById('scanVideo');
        var canvas = document.getElementById('scanCanvas');
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code && code.data) {
                this.submitCheckin(code.data);
            }
        }
        requestAnimationFrame(this.scanFrame.bind(this));
    },

    submitCheckin: async function(token) {
        if (!token) {
            toast('请输入验证码或扫描二维码', 'error');
            return;
        }
        if (this.scanLocked) return;
        this.scanLocked = true;
        try {
            var res = await api('/activities/' + this.activityId + '/checkin', {
                method: 'POST',
                body: { token: token }
            });
            toast(res.message || '签到成功');
            document.getElementById('manualCheckinCode').value = '';
            await this.loadList();
        } catch (err) {
            toast(err.message || '核销失败', 'error');
        } finally {
            var self = this;
            setTimeout(function() { self.scanLocked = false; }, 1200);
        }
    },

    loadList: async function() {
        try {
            var res = await api('/activities/' + this.activityId + '/checkin/list');
            this.listData = res.data || {};
            this.renderStats();
            this.renderList();
        } catch (err) {
            document.getElementById('checkinError').innerHTML = '<div class="alert alert-error show">' + checkinEscapeHtml(err.message || '仅活动发起者可核销') + '</div>';
            document.getElementById('checkinList').innerHTML = '';
        }
    },

    renderStats: function() {
        var data = this.listData || {};
        document.getElementById('checkinStats').innerHTML =
            '<span class="status-badge status-active">总报名 ' + (data.total || 0) + '</span>' +
            '<span class="status-badge status-open">已签到 ' + (data.checkedInCount || 0) + '</span>' +
            '<span class="status-badge status-closed">未签到 ' + (data.uncheckedCount || 0) + '</span>';
    },

    renderList: function() {
        var data = this.listData || {};
        var items = this.activeTab === 'checked' ? (data.checkedInUsers || []) : (data.uncheckedUsers || []);
        var box = document.getElementById('checkinList');
        if (!items.length) {
            box.innerHTML = '<div class="empty-state">暂无人员</div>';
            return;
        }
        box.innerHTML = items.map(function(item) {
            var avatar = item.avatar
                ? '<img src="' + checkinEscapeHtml(item.avatar) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">'
                : '<div style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">' + checkinEscapeHtml((item.nickname || '?').charAt(0)) + '</div>';
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">' +
                avatar +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:14px;font-weight:700;">' + checkinEscapeHtml(item.nickname || '未知用户') + '</div>' +
                    '<div style="font-size:12px;color:var(--text-secondary);">报名：' + formatCheckinTime(item.registeredAt) + (item.checkedInAt ? ' · 签到：' + formatCheckinTime(item.checkedInAt) : '') + '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    }
};

Router.register('/activity/:id/checkin', {
    title: '签到核销',
    requireAuth: true,
    render: function() { return ActivityCheckinPage.render(); },
    init: function(params) { ActivityCheckinPage.init(params); },
    destroy: function() { ActivityCheckinPage.destroy(); }
});

function formatCheckinTime(t) {
    return t ? t.replace('T', ' ').substring(0, 16) : '-';
}
