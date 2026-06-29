const USE_MOCK = true;

window._waitlistPage = {
    activityId: null,

    render: function() {
        return `
        <div class="home-content">
            <div class="welcome-card">
                <h2>🔄 等待队列</h2>
                <p>活动已满员，加入队列等待名额释放</p>
            </div>

            <div id="waitlistContainer">
                <p style="text-align:center;padding:40px;color:var(--text-secondary);">
                    <span class="spinner" style="border-color:rgba(0,0,0,.15);border-top-color:var(--primary);display:inline-block;width:20px;height:20px;"></span> 加载中...
                </p>
            </div>

            <div style="margin-top:16px;text-align:center;">
                <button class="btn btn-outline" id="backBtn">返回活动详情</button>
            </div>
        </div>`;
    },

    init: function() {
        var params = Router.getParams();
        this.activityId = params.id;

        document.getElementById('backBtn').addEventListener('click', function() {
            Router.navigate('/activity/' + window._waitlistPage.activityId);
        });

        this.loadWaitlistStatus();
    },

    loadWaitlistStatus: async function() {
        var container = document.getElementById('waitlistContainer');

        try {
            var data;
            if (USE_MOCK) {
                data = this.getMockWaitlistData();
            } else {
                var res = await api('/activities/' + this.activityId + '/waitlist');
                data = res.data;
            }

            if (data.inQueue) {
                container.innerHTML = this.renderInQueue(data);
            } else {
                container.innerHTML = this.renderNotInQueue(data);
            }

            this.bindActions();
        } catch (err) {
            container.innerHTML = `<p style="text-align:center;color:var(--danger);padding:40px;">加载失败: ${err.message}</p>`;
        }
    },

    bindActions: function() {
        var self = this;
        var joinBtn = document.getElementById('joinWaitlistBtn');
        var leaveBtn = document.getElementById('leaveWaitlistBtn');

        if (joinBtn) {
            joinBtn.addEventListener('click', function() {
                self.joinWaitlist();
            });
        }

        if (leaveBtn) {
            leaveBtn.addEventListener('click', function() {
                self.leaveWaitlist();
            });
        }
    },

    renderInQueue: function(data) {
        var progressPercent = data.totalCount > 0 ? ((data.totalCount - data.aheadCount) / data.totalCount) * 100 : 0;

        return `
        <div class="card" style="text-align:center;padding:32px;">
            <div style="font-size:48px;margin-bottom:16px;">🎟️</div>
            <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;">您已在等待队列中</h3>

            <div style="margin:24px 0;">
                <div style="font-size:36px;font-weight:700;color:var(--primary);">${data.queuePosition}</div>
                <div style="font-size:14px;color:var(--text-secondary);margin-top:4px;">当前排队位置</div>
            </div>

            <div style="margin-bottom:24px;">
                <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);margin-bottom:8px;">
                    <span>队列进度</span>
                    <span>前方还有 ${data.aheadCount} 人</span>
                </div>
                <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;background:linear-gradient(90deg,var(--primary),var(--primary-light));width:${progressPercent}%;border-radius:4px;"></div>
                </div>
            </div>

            ${data.notified ? `
            <div class="alert alert-success show" style="margin-bottom:16px;">
                🎉 恭喜！有新名额释放，请尽快确认报名！
            </div>` : ''}

            <button class="btn btn-danger" id="leaveWaitlistBtn">退出等待队列</button>
        </div>`;
    },

    renderNotInQueue: function(data) {
        return `
        <div class="card" style="text-align:center;padding:32px;">
            <div style="font-size:48px;margin-bottom:16px;">📝</div>
            <h3 style="font-size:18px;font-weight:700;margin-bottom:8px;">加入等待队列</h3>
            <p style="color:var(--text-secondary);margin-bottom:16px;">
                当前等待队列中有 ${data.totalCount} 人在排队。<br>
                当有用户取消报名时，队列中的用户将按顺序获得名额。
            </p>

            <button class="btn btn-primary" id="joinWaitlistBtn">加入等待队列</button>
        </div>`;
    },

    joinWaitlist: async function() {
        try {
            if (USE_MOCK) {
                toast('已加入等待队列');
                this.loadWaitlistStatus();
            } else {
                await api('/activities/' + this.activityId + '/waitlist', { method: 'POST' });
                toast('已加入等待队列');
                this.loadWaitlistStatus();
            }
        } catch (err) {
            toast(err.message, 'error');
        }
    },

    leaveWaitlist: async function() {
        if (!confirm('确定要退出等待队列吗？退出后需要重新排队。')) {
            return;
        }

        try {
            if (USE_MOCK) {
                toast('已退出等待队列');
                this.loadWaitlistStatus();
            } else {
                await api('/activities/' + this.activityId + '/waitlist', { method: 'DELETE' });
                toast('已退出等待队列');
                this.loadWaitlistStatus();
            }
        } catch (err) {
            toast(err.message, 'error');
        }
    },

    getMockWaitlistData: function() {
        var inQueue = Math.random() > 0.4;
        if (inQueue) {
            return {
                inQueue: true,
                queuePosition: Math.floor(Math.random() * 5) + 1,
                totalCount: 10,
                aheadCount: Math.floor(Math.random() * 4),
                status: 'WAITING',
                notified: Math.random() > 0.8
            };
        } else {
            return {
                inQueue: false,
                queuePosition: -1,
                totalCount: 10,
                aheadCount: 0,
                status: null,
                notified: false
            };
        }
    }
};

Router.register('/activity/:id/waitlist', {
    title: '等待队列',
    requireAuth: true,
    render: function() { return window._waitlistPage.render(); },
    init: function() { window._waitlistPage.init(); }
});