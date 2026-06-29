const USE_MOCK_REG = true;

window._myRegPage = {
    currentStatus: '',

    render: function() {
        return `
        <div class="home-content">
            <div class="welcome-card">
                <h2>我的报名</h2>
                <p>查看和管理您的活动报名</p>
            </div>

            <div style="margin-bottom:16px;">
                <div class="filter-tabs">
                    <button class="filter-tab active" data-status="">全部</button>
                    <button class="filter-tab" data-status="CONFIRMED">已确认</button>
                    <button class="filter-tab" data-status="CANCELLED">已取消</button>
                    <button class="filter-tab" data-status="WAITING">等待中</button>
                </div>
            </div>

            <div id="registrationsContainer">
                <p style="text-align:center;padding:40px;color:var(--text-secondary);">加载中...</p>
            </div>
        </div>`;
    },

    init: function() {
        var self = this;
        self.currentStatus = '';

        document.querySelectorAll('.filter-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.filter-tab').forEach(function(t) {
                    t.classList.remove('active');
                });
                this.classList.add('active');
                self.currentStatus = this.getAttribute('data-status');
                self.loadRegistrations();
            });
        });

        self.loadRegistrations();
    },

    loadRegistrations: async function() {
        var container = document.getElementById('registrationsContainer');
        container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-secondary);">加载中...</p>';

        try {
            var data;
            if (USE_MOCK_REG) {
                data = this.getMockData();
            } else {
                var params = '';
                if (this.currentStatus) {
                    params = '?status=' + this.currentStatus;
                }
                var res = await api('/users/me/registrations' + params);
                data = res.data;
            }

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div class="card" style="text-align:center;padding:40px;color:var(--text-secondary);">
                        <p style="font-size:40px;margin-bottom:12px;">📭</p>
                        <p>暂无报名记录</p>
                    </div>`;
                return;
            }

            container.innerHTML = '';
            var self = this;

            data.forEach(function(item) {
                var statusLabel = self.getStatusLabel(item.status);
                var card = document.createElement('div');
                card.className = 'card';
                card.style.marginBottom = '12px';
                card.style.padding = '16px';

                var actionBtnHtml = '';
                if (item.status === 'CONFIRMED') {
                    actionBtnHtml = `<button class="btn btn-danger btn-sm" data-action="cancel" data-activity-id="${item.activityId}">取消报名</button>`;
                }

                card.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                        <div style="flex:1;">
                            <h3 style="font-size:15px;font-weight:700;margin-bottom:4px;color:var(--text-primary);">${escapeHtml(item.activityTitle || '未知活动')}</h3>
                            <p style="font-size:13px;color:var(--text-secondary);">📍 ${escapeHtml(item.activityLocation || '')}</p>
                            <p style="font-size:13px;color:var(--text-secondary);">📅 ${escapeHtml(item.activityStartTime || '')}</p>
                        </div>
                        ${statusLabel}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
                        <span style="font-size:13px;color:var(--text-secondary);">报名时间：${escapeHtml(item.registeredAt || '')}</span>
                        <div style="display:flex;gap:8px;">
                            ${actionBtnHtml}
                            <button class="btn btn-outline btn-sm" data-action="detail" data-activity-id="${item.activityId}">查看详情</button>
                        </div>
                    </div>`;

                card.querySelectorAll('button').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        var action = this.getAttribute('data-action');
                        var activityId = this.getAttribute('data-activity-id');
                        if (action === 'cancel') {
                            self.cancelRegistration(activityId);
                        } else if (action === 'detail') {
                            Router.navigate('/activity/' + activityId);
                        }
                    });
                });

                container.appendChild(card);
            });

        } catch (err) {
            container.innerHTML = `<p style="text-align:center;color:var(--danger);padding:40px;">加载失败: ${err.message}</p>`;
        }
    },

    cancelRegistration: async function(activityId) {
        if (!confirm('确定要取消报名吗？取消后名额将释放给等待队列中的用户。')) {
            return;
        }

        try {
            if (USE_MOCK_REG) {
                toast('取消报名成功');
                this.loadRegistrations();
            } else {
                await api('/activities/' + activityId + '/register', { method: 'DELETE' });
                toast('取消报名成功');
                this.loadRegistrations();
            }
        } catch (err) {
            toast(err.message, 'error');
        }
    },

    getStatusLabel: function(status) {
        var colors = {
            'CONFIRMED': 'background:var(--success);color:white',
            'CANCELLED': 'background:var(--text-secondary);color:white',
            'WAITING': 'background:var(--warning);color:white'
        };
        var labels = {
            'CONFIRMED': '已确认',
            'CANCELLED': '已取消',
            'WAITING': '等待中'
        };
        var color = colors[status] || 'background:var(--border);color:var(--text-secondary)';
        var label = labels[status] || status;
        return `<span class="status-badge" style="${color};padding:4px 8px;border-radius:4px;font-size:12px;font-weight:500;">${label}</span>`;
    },

    getMockData: function() {
        var allData = [
            { id: 1, activityId: 1, activityTitle: '周末篮球局', activityLocation: '朝阳公园篮球场', activityStartTime: '2026-07-05T14:00:00', status: 'CONFIRMED', participants: 1, registeredAt: '2026-06-29T10:00:00' },
            { id: 2, activityId: 2, activityTitle: '桌游聚会', activityLocation: '三里屯桌游吧', activityStartTime: '2026-07-06T19:00:00', status: 'CONFIRMED', participants: 1, registeredAt: '2026-06-29T11:30:00' },
            { id: 3, activityId: 3, activityTitle: '户外徒步', activityLocation: '香山公园', activityStartTime: '2026-07-07T08:00:00', status: 'CANCELLED', participants: 1, registeredAt: '2026-06-28T09:00:00', cancelledAt: '2026-06-29T08:00:00' },
            { id: 4, activityId: 4, activityTitle: '城市漫步', activityLocation: '上海外滩', activityStartTime: '2026-07-08T10:00:00', status: 'WAITING', participants: 1, registeredAt: '2026-06-29T14:00:00' }
        ];

        if (!this.currentStatus) {
            return allData;
        }
        return allData.filter(function(item) {
            return item.status === this.currentStatus;
        }.bind(this));
    }
};

Router.register('/my-registrations', {
    title: '我的报名',
    requireAuth: true,
    render: function() { return window._myRegPage.render(); },
    init: function() { window._myRegPage.init(); }
});

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}