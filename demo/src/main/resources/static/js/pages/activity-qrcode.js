var ActivityQrPage = {
    timer: null,
    countdownTimer: null,
    expireAt: null,

    render: function() {
        return '\
        <div class="home-content">\
            <button class="btn btn-outline btn-sm" onclick="history.back()" style="width:auto;margin-bottom:12px;">返回</button>\
            <div class="welcome-card">\
                <h2>现场签到码</h2>\
                <p id="qrActivityTitle">用于活动现场给发起者核销</p>\
            </div>\
            <div class="card" style="text-align:center;">\
                <div id="qrStatus" style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">正在生成...</div>\
                <div id="qrBox" style="width:240px;height:240px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid var(--border);border-radius:8px;"></div>\
                <div style="height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-bottom:14px;">\
                    <div id="qrProgress" style="height:100%;width:100%;background:var(--primary);transition:width .2s linear;"></div>\
                </div>\
                <div style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">剩余 <span id="qrSeconds">30</span> 秒自动刷新</div>\
                <div style="padding:12px;border:1px dashed var(--border);border-radius:8px;background:#f8fafc;">\
                    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">摄像头不可用时，给发起者输入这个 6 位验证码</div>\
                    <div id="manualCode" style="font-size:30px;font-weight:800;letter-spacing:6px;color:var(--primary);">------</div>\
                </div>\
                <button id="refreshQrBtn" class="btn btn-outline btn-sm" style="width:auto;margin-top:14px;">立即刷新</button>\
            </div>\
            <div class="card">\
                <div class="field"><span class="key">当前状态</span><span class="val" id="checkinStatusText">查询中</span></div>\
            </div>\
        </div>';
    },

    init: function(params) {
        this.activityId = params.id;
        document.getElementById('refreshQrBtn').addEventListener('click', this.loadQr.bind(this));
        this.loadStatus();
        this.loadQr();
    },

    destroy: function() {
        if (this.timer) clearTimeout(this.timer);
        if (this.countdownTimer) clearInterval(this.countdownTimer);
    },

    loadStatus: async function() {
        try {
            var res = await api('/activities/' + this.activityId + '/checkin/status');
            var data = res.data || {};
            document.getElementById('checkinStatusText').textContent = data.checkedIn ? '已签到' : (data.registered ? '未签到' : '未报名');
        } catch (err) {
            document.getElementById('checkinStatusText').textContent = err.message || '查询失败';
        }
    },

    loadQr: async function() {
        if (this.timer) clearTimeout(this.timer);
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        var box = document.getElementById('qrBox');
        var status = document.getElementById('qrStatus');
        box.innerHTML = '';
        status.textContent = '正在生成...';
        try {
            var res = await api('/activities/' + this.activityId + '/qrcode');
            var data = res.data;
            this.expireAt = new Date(data.expireAt).getTime();
            document.getElementById('qrActivityTitle').textContent = data.activityTitle || '用于活动现场给发起者核销';
            document.getElementById('manualCode').textContent = data.manualCode || '------';
            if (window.QRCode) {
                new QRCode(box, { text: data.token, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
            } else {
                box.innerHTML = '<textarea class="form-input" style="height:190px;font-size:11px;">' + checkinEscapeHtml(data.token) + '</textarea>';
            }
            status.textContent = '请向活动发起者出示二维码';
            this.startCountdown();
            this.timer = setTimeout(this.loadQr.bind(this), 30000);
        } catch (err) {
            status.textContent = err.message || '生成失败';
            toast(err.message || '生成签到码失败', 'error');
        }
    },

    startCountdown: function() {
        var self = this;
        function tick() {
            var left = Math.max(0, Math.ceil((self.expireAt - Date.now()) / 1000));
            document.getElementById('qrSeconds').textContent = left;
            document.getElementById('qrProgress').style.width = Math.max(0, left / 30 * 100) + '%';
        }
        tick();
        this.countdownTimer = setInterval(tick, 250);
    }
};

Router.register('/activity/:id/qrcode', {
    title: '现场签到码',
    requireAuth: true,
    render: function() { return ActivityQrPage.render(); },
    init: function(params) { ActivityQrPage.init(params); },
    destroy: function() { ActivityQrPage.destroy(); }
});

function checkinEscapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
