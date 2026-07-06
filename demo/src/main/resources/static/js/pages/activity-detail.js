// ====== 活动详情页 (P4 - US-015/016) ======
// 路由 #/activity/:id
// 负责：展示活动完整信息 + 报名功能
// 不写取消报名和等待队列逻辑，只做跳转链接

var USE_MOCK = false;

Router.register('/activity/:id', {
    title: '活动详情',
    requireAuth: true,

    render: function() {
        return `
        <div class="home-content">
            <div id="detailContainer">
                <p style="text-align:center;padding:60px 20px;color:var(--text-secondary);">
                    <span class="spinner" style="border-color:rgba(0,0,0,.15);border-top-color:var(--primary);display:inline-block;width:24px;height:24px;"></span>
                    <br><span style="font-size:14px;">加载中...</span>
                </p>
            </div>
        </div>`;
    },

    init: function() {
        var hash = window.location.hash;
        var parts = hash.split('/');
        var activityId = parts[parts.length - 1];
        this.loadDetail(activityId);
    },

    loadDetail: async function(activityId) {
        var container = document.getElementById('detailContainer');
        var self = this;
        var curUser = getCurUser();

        try {
            var data;
            if (USE_MOCK) {
                data = MOCK_ACTIVITY_DETAIL;
                // 模拟：如果 activityId 是1，展示已报名状态
                if (activityId === '2') {
                    data.myRegistration = null;
                }
            } else {
                var res = await api('/activities/' + activityId);
                data = res.data;
            }

            var isCreator = curUser && Number(curUser.id) === Number(data.creatorId);
            var isRegistered = data.myRegistration && (data.myRegistration.status === 'CONFIRMED' || data.myRegistration.status === 'CHECKED_IN');
            var isPending = data.myRegistration && data.myRegistration.status === 'PENDING';
            var isFull = data.currentParticipants >= data.maxParticipants;
            var statusInfo = getStatusInfo(data);

            container.innerHTML = self.renderDetail(data, isCreator, isRegistered, isPending, isFull, statusInfo);

            // 绑定报名按钮事件
            var registerBtn = document.getElementById('registerBtn');
            if (registerBtn) {
                registerBtn.addEventListener('click', function() {
                    self.handleRegister(activityId, data);
                });
            }

            // 加载留言
            self.loadComments(activityId);
            self.bindCommentEvents(activityId);

            // 创建者：加载报名人清单及签到状态
            if (isCreator) {
                self.loadCreatorParticipantList(activityId);
                // 绑定 Tab 切换（事件委托）
                var pCard = document.getElementById('creatorParticipantCard');
                if (pCard) {
                    pCard.addEventListener('click', function(e) {
                        var tabBtn = e.target.closest('.tab-btn');
                        if (!tabBtn) return;
                        var btns = pCard.querySelectorAll('.tab-btn');
                        btns.forEach(function(b) { b.classList.remove('active'); });
                        tabBtn.classList.add('active');
                        if (self._creatorParticipants) {
                            self._creatorParticipants.activeTab = tabBtn.dataset.ptab;
                            self._renderCreatorParticipantList();
                        }
                    });
                }
                // 如果开启了审核，加载待审核列表
                if (data.requireApproval) {
                    self.loadPendingRegistrations(activityId);
                }
            }
        } catch (err) {
            container.innerHTML = `
                <div class="card" style="text-align:center;padding:60px 20px;">
                    <p style="font-size:40px;margin-bottom:12px;">😵</p>
                    <p style="color:var(--danger);margin-bottom:16px;">加载失败: ${escapeHtml(err.message)}</p>
                    <button class="btn btn-outline btn-sm" onclick="history.back()" style="width:auto;">返回</button>
                </div>`;
        }
    },

    renderDetail: function(data, isCreator, isRegistered, isPending, isFull, statusInfo) {
        var tagsHtml = '';
        if (data.tags && data.tags.length) {
            tagsHtml = data.tags.map(function(t) {
                return '<span class="category-tag">' + escapeHtml(t) + '</span>';
            }).join(' ');
        }

        var imagesHtml = '';
        if (data.coverImage) {
            imagesHtml = '<img src="' + escapeHtml(data.coverImage) +
                '" alt="活动封面" style="width:100%;max-height:300px;object-fit:cover;border-radius:var(--radius);margin-bottom:16px;">';
        }

        var creatorAvatarHtml = data.creator && data.creator.avatar
            ? '<img src="' + escapeHtml(data.creator.avatar) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">'
            : '<div style="width:32px;height:32px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;">' +
              (data.creator && data.creator.nickname ? data.creator.nickname.charAt(0) : '?') + '</div>';

        // 按钮区域
        var actionHtml = this.renderActionButton(isCreator, isRegistered, isPending, isFull, data);

        return `
        <button class="btn btn-outline btn-sm" onclick="history.back()" style="width:auto;margin-bottom:12px;">← 返回</button>

        ${imagesHtml}

        <div class="welcome-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <h2>${escapeHtml(data.title)}</h2>
                <span class="status-badge status-${statusInfo.cls}">${statusInfo.label}</span>
            </div>
            <div style="margin-top:8px;display:flex;align-items:center;gap:8px;font-size:13px;opacity:.9;">
                ${creatorAvatarHtml}
                <span>${escapeHtml(data.creator ? data.creator.nickname : '未知')}</span>
            </div>
        </div>

        <div class="card">
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">${tagsHtml}</div>

            <div class="field"><span class="key">活动分类</span><span class="val">${getCategoryName(data.category)}</span></div>
            <div class="field"><span class="key">开始时间</span><span class="val">${formatTime(data.startTime)}</span></div>
            <div class="field"><span class="key">结束时间</span><span class="val">${formatTime(data.endTime)}</span></div>
            <div class="field"><span class="key">活动地点</span><span class="val">${escapeHtml(data.location)}</span></div>
            <div class="field"><span class="key">报名人数</span><span class="val">${data.currentParticipants} / ${data.maxParticipants}</span></div>
            <div class="field"><span class="key">活动费用</span><span class="val">${Number(data.fee) === 0 ? '免费' : '¥' + data.fee}</span></div>
            ${data.registrationDeadline ? '<div class="field"><span class="key">报名截止</span><span class="val">' + formatTime(data.registrationDeadline) + '</span></div>' : ''}
        </div>

        <div class="card">
            <h3 style="font-size:15px;margin-bottom:12px;">活动简介</h3>
            <p style="font-size:14px;line-height:1.7;color:var(--text-secondary);white-space:pre-wrap;">${escapeHtml(data.description)}</p>
        </div>

        ${actionHtml}

        <div class="card" id="creatorParticipantCard" style="display:none;margin-top:16px;">
            <h3 style="font-size:15px;margin-bottom:12px;">报名人清单</h3>
            <div id="creatorParticipantStats" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;"></div>
            <div class="tabs" style="margin-bottom:12px;">
                <button class="tab-btn active" data-ptab="unchecked">未签到</button>
                <button class="tab-btn" data-ptab="checked">已签到</button>
            </div>
            <div id="creatorParticipantList">加载中...</div>
        </div>

        <div class="card" id="pendingApprovalCard" style="display:none;margin-top:16px;">
            <h3 style="font-size:15px;margin-bottom:12px;">待审核报名 <span id="pendingCount" style="font-size:13px;color:var(--warning);"></span></h3>
            <div id="pendingApprovalList">加载中...</div>
        </div>

        <div class="card" style="margin-top:16px;">
            <h3 style="font-size:15px;margin-bottom:12px;">留言板</h3>
            <div id="commentList"><p style="color:var(--text-secondary);font-size:13px;">加载中...</p></div>
            <div id="commentInput" style="margin-top:12px;display:flex;gap:8px;">
                <input type="text" id="commentContent" placeholder="发表留言（200字以内）" maxlength="200" style="flex:1;" class="form-input">
                <button id="btnPostComment" class="btn btn-primary btn-sm" style="width:auto;white-space:nowrap;">发布</button>
            </div>
        </div>
        `;
    },

    renderActionButton: function(isCreator, isRegistered, isPending, isFull, data) {
        var statusInfo = getStatusInfo(data);
        var isEnded = statusInfo.cls === 'ended';
        var isCancelled = statusInfo.cls === 'cancelled';

        // 评分展示（无论什么角色都能看到）
        var ratingHtml = '';
        if (data.avgRating !== undefined && data.avgRating !== null && data.avgRating > 0) {
            var stars = '';
            for (var i = 0; i < 5; i++) { stars += i < Math.round(data.avgRating) ? '★' : '☆'; }
            ratingHtml = '<div style="font-size:13px;color:#f5a623;margin-top:8px;">' + stars + ' <span style="color:var(--text-secondary);">' + (data.avgRating || 0).toFixed(1) + ' · ' + (data.reviewCount || 0) + '条评价</span></div>';
        }

        // 已结束活动入口（取消的活动不显示复盘/评价入口）
        var endedHtml = '';
        if (isEnded && !isCancelled) {
            endedHtml = '<div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">';
            if (isCreator) {
                endedHtml += '<a href="#/activity/' + data.id + '/retrospect" class="btn btn-primary btn-sm" style="width:auto;text-decoration:none;">📊 活动复盘</a>';
            }
            var regStatus = data.myRegistration && data.myRegistration.status;
            if (regStatus === 'CHECKED_IN' || isCreator) {
                endedHtml += '<a href="#/activity/' + data.id + '/review" class="btn btn-outline btn-sm" style="width:auto;text-decoration:none;">⭐ 评价活动</a>';
            }
            endedHtml += '</div>';
        }

        // 已结束/已取消的活动
        if (isEnded || isCancelled) {
            return '<div class="card" style="text-align:center;">' +
                '<p style="color:var(--text-secondary);font-size:14px;margin-bottom:12px;">' + statusInfo.label + '</p>' +
                ratingHtml + endedHtml +
                '</div>';
        }

        if (isCreator) {
            return '<div class="card" style="text-align:center;">' +
                '<p style="color:var(--text-secondary);font-size:14px;margin-bottom:12px;">这是你发布的活动</p>' +
                '<a href="#/activity/' + data.id + '/checkin" class="btn btn-primary btn-sm" style="width:auto;text-decoration:none;">签到核销</a>' +
                ratingHtml +
                '</div>';
        }

        if (isRegistered) {
            return `
            <div class="card" style="text-align:center;">
                <p style="color:var(--success);font-size:15px;font-weight:600;margin-bottom:12px;">✅ 您已报名</p>
                <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                    <a href="#/activity/${data.id}/qrcode" class="btn btn-primary btn-sm" style="width:auto;text-decoration:none;">出示签到码</a>
                    <a href="#/my-registrations" class="btn btn-outline btn-sm" style="width:auto;text-decoration:none;">查看我的报名</a>
                </div>
                ${ratingHtml}
            </div>`;
        }

        if (isPending) {
            return `
            <div class="card" style="text-align:center;">
                <p style="color:var(--warning);font-size:15px;font-weight:600;margin-bottom:12px;">⏳ 报名审核中</p>
                <p style="color:var(--text-secondary);font-size:13px;margin-bottom:12px;">活动创建人正在审核你的报名，请耐心等待</p>
                ${ratingHtml}
            </div>`;
        }

        if (isFull) {
            return `
            <div class="card" style="text-align:center;">
                <p style="color:var(--danger);font-size:15px;font-weight:600;margin-bottom:12px;">🔥 活动已满员</p>
                <a href="#/activity/${data.id}/waitlist" class="btn btn-outline btn-sm" style="width:auto;text-decoration:none;">加入等待队列</a>
                ${ratingHtml}
            </div>`;
        }

        // 检查是否已过报名截止时间
        if (data.registrationDeadline) {
            var now = new Date();
            if (now > new Date(data.registrationDeadline)) {
                return '<div class="card" style="text-align:center;"><p style="color:var(--text-secondary);font-size:14px;">报名已截止</p>' + ratingHtml + '</div>';
            }
        }

        return `
        <div class="card" style="text-align:center;">
            <button class="btn btn-primary" id="registerBtn" style="width:auto;padding:14px 48px;font-size:16px;">立即报名</button>
            ${ratingHtml}
        </div>`;
    },

    handleRegister: async function(activityId, data) {
        var self = this;

        // 安全须知弹窗
        var confirmed = confirm(
            '【安全须知】\n\n' +
            '1. 请在活动开始前确认活动真实性，注意人身和财产安全。\n' +
            '2. 如遇虚假活动或违规行为，请及时向平台举报。\n' +
            '3. 报名即表示您已阅读并同意以上须知。\n\n' +
            '点击"确定"确认报名'
        );

        if (!confirmed) return;

        var btn = document.getElementById('registerBtn');
        btn.disabled = true;
        btn.textContent = '报名中...';

        try {
            if (USE_MOCK) {
                // 模拟成功
                await sleep(500);
                data.myRegistration = { id: Date.now(), status: 'CONFIRMED' };
                data.currentParticipants += 1;
                toast('报名成功！');
            } else {
                var regRes = await api('/activities/' + activityId + '/register', { method: 'POST' });
                if (regRes.data && regRes.data.status === 'PENDING') {
                    toast('报名已提交，等待审核');
                } else {
                    toast('报名成功！');
                }
                // 刷新页面数据
                var res = await api('/activities/' + activityId);
                data = res.data;
            }

            // 重新渲染
            var container = document.getElementById('detailContainer');
            var curUser = getCurUser();
            var isCreator = curUser && Number(curUser.id) === Number(data.creatorId);
            var isRegistered = data.myRegistration && (data.myRegistration.status === 'CONFIRMED' || data.myRegistration.status === 'CHECKED_IN');
            var isPending = data.myRegistration && data.myRegistration.status === 'PENDING';
            var isFull = data.currentParticipants >= data.maxParticipants;
            var statusInfo = getStatusInfo(data);
            container.innerHTML = this.renderDetail(data, isCreator, isRegistered, isPending, isFull, statusInfo);

        } catch (err) {
            if (err.code === 409) {
                // 满员冲突
                data.currentParticipants = data.maxParticipants;
                var container = document.getElementById('detailContainer');
                var curUser = getCurUser();
                var statusInfo = getStatusInfo(data);
                container.innerHTML = this.renderDetail(data, false, false, false, true, statusInfo);
                toast('手慢了一步，活动已满员', 'error');
            } else {
                btn.disabled = false;
                btn.textContent = '立即报名';
                toast(err.message, 'error');
            }
        }
    },

    // ====== 创建者：报名人清单及签到状态 ======
    loadCreatorParticipantList: async function(activityId) {
        var self = this;
        try {
            var res = await api('/activities/' + activityId + '/checkin/list');
            var data = res.data || {};
            self._creatorParticipants = { activeTab: 'unchecked', data: data };
            self._renderCreatorParticipantList();
        } catch (err) {
            document.getElementById('creatorParticipantList').innerHTML =
                '<p style="color:var(--text-secondary);font-size:13px;">加载报名人清单失败</p>';
        }
    },

    _renderCreatorParticipantList: function() {
        var d = this._creatorParticipants;
        if (!d) return;

        var card = document.getElementById('creatorParticipantCard');
        if (card) card.style.display = 'block';

        // 统计
        var stats = document.getElementById('creatorParticipantStats');
        if (stats) {
            stats.innerHTML =
                '<span class="status-badge status-active">总报名 ' + (d.data.total || 0) + '</span>' +
                '<span class="status-badge status-open">已签到 ' + (d.data.checkedInCount || 0) + '</span>' +
                '<span class="status-badge status-closed">未签到 ' + (d.data.uncheckedCount || 0) + '</span>';
        }

        // 列表
        var items = d.activeTab === 'checked' ? (d.data.checkedInUsers || []) : (d.data.uncheckedUsers || []);
        var box = document.getElementById('creatorParticipantList');
        if (!box) return;

        if (!items.length) {
            box.innerHTML = '<div class="empty-state">暂无人员</div>';
            return;
        }

        box.innerHTML = items.map(function(item) {
            var avatar = item.avatar
                ? '<img src="' + escapeHtml(item.avatar) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">'
                : '<div style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">' + (item.nickname || '?').charAt(0) + '</div>';
            var checkedBadge = item.checkedInAt
                ? '<span style="color:#16a34a;font-weight:600;font-size:12px;">&#10003; 已签到 ' + formatTime(item.checkedInAt) + '</span>'
                : '<span style="color:#dc2626;font-weight:600;font-size:12px;">&#10007; 未签到</span>';
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">' +
                avatar +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:14px;font-weight:700;">' + escapeHtml(item.nickname || '未知用户') + '</div>' +
                    '<div style="font-size:12px;color:var(--text-secondary);">报名：' + formatTime(item.registeredAt) + ' · ' + checkedBadge + '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    },

    // ====== 创建者：待审核报名 ======
    loadPendingRegistrations: async function(activityId) {
        var self = this;
        try {
            var res = await api('/activities/' + activityId + '/registrations/pending');
            var list = res.data || [];
            self._pendingList = list;
            self._renderPendingList(activityId);
        } catch (err) {
            document.getElementById('pendingApprovalList').innerHTML =
                '<p style="color:var(--text-secondary);font-size:13px;">加载失败</p>';
        }
    },

    _renderPendingList: function(activityId) {
        var card = document.getElementById('pendingApprovalCard');
        var list = this._pendingList || [];
        if (card) card.style.display = 'block';

        var countEl = document.getElementById('pendingCount');
        if (countEl) countEl.textContent = '(' + list.length + '人)';

        var box = document.getElementById('pendingApprovalList');
        if (!box) return;

        if (!list.length) {
            box.innerHTML = '<div class="empty-state">暂无待审核报名</div>';
            return;
        }

        var self = this;
        box.innerHTML = list.map(function(item) {
            var avatar = item.avatar
                ? '<img src="' + escapeHtml(item.avatar) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">'
                : '<div style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">' + (item.nickname || '?').charAt(0) + '</div>';
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">' +
                avatar +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:14px;font-weight:700;">' + escapeHtml(item.nickname || '未知用户') + '</div>' +
                    '<div style="font-size:12px;color:var(--text-secondary);">报名时间：' + formatTime(item.registeredAt) + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:6px;">' +
                    '<button class="btn btn-sm btn-primary btn-approve" data-regid="' + item.id + '" style="width:auto;font-size:12px;padding:4px 12px;">通过</button>' +
                    '<button class="btn btn-sm btn-outline btn-reject" data-regid="' + item.id + '" style="width:auto;font-size:12px;padding:4px 12px;color:var(--danger);">拒绝</button>' +
                '</div>' +
            '</div>';
        }).join('');

        // 绑定事件
        var cardEl = document.getElementById('pendingApprovalCard');
        if (cardEl && !cardEl._boundPending) {
            cardEl._boundPending = true;
            cardEl.addEventListener('click', function(e) {
                var btnApprove = e.target.closest('.btn-approve');
                var btnReject = e.target.closest('.btn-reject');
                if (btnApprove) {
                    var regId = parseInt(btnApprove.dataset.regid);
                    self._handleApprove(activityId, regId);
                }
                if (btnReject) {
                    var regId = parseInt(btnReject.dataset.regid);
                    self._handleReject(activityId, regId);
                }
            });
        }
    },

    _handleApprove: async function(activityId, regId) {
        var self = this;
        try {
            await api('/activities/' + activityId + '/registrations/' + regId + '/approve', { method: 'POST' });
            toast('已通过');
            self.loadPendingRegistrations(activityId);
            self.loadCreatorParticipantList(activityId);
        } catch (err) {
            toast(err.message || '操作失败', 'error');
        }
    },

    _handleReject: async function(activityId, regId) {
        var self = this;
        try {
            await api('/activities/' + activityId + '/registrations/' + regId + '/reject', { method: 'POST' });
            toast('已拒绝');
            self.loadPendingRegistrations(activityId);
        } catch (err) {
            toast(err.message || '操作失败', 'error');
        }
    },

    // ====== US-043/044 留言板 ======
    loadComments: async function(activityId) {
        try {
            var res = await api('/activities/' + activityId + '/comments');
            this.renderComments(res.data);
        } catch (err) {
            document.getElementById('commentList').innerHTML =
                '<p style="color:var(--text-secondary);font-size:13px;">留言加载失败</p>';
        }
    },

    renderComments: function(comments) {
        var el = document.getElementById('commentList');
        if (!comments || comments.length === 0) {
            el.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;">暂无留言，快来发表第一条吧</p>';
            return;
        }
        var html = '';
        for (var i = 0; i < comments.length; i++) {
            html += renderCommentItem(comments[i]);
        }
        el.innerHTML = html;
    },

    bindCommentEvents: function(activityId) {
        var self = this;
        document.getElementById('btnPostComment').addEventListener('click', function() {
            self.doPostComment(activityId, null);
        });
        document.getElementById('commentContent').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') self.doPostComment(activityId, null);
        });
        document.getElementById('commentList').addEventListener('click', function(e) {
            var btn = e.target.closest('button');
            if (!btn) return;
            var id = parseInt(btn.dataset.id);
            if (btn.classList.contains('btn-reply')) {
                var replyInput = document.getElementById('replyInput-' + id);
                var content = replyInput ? replyInput.value.trim() : '';
                if (!content) { toast('请输入回复内容', 'error'); return; }
                self.doPostComment(activityId, id, content);
            }
            if (btn.classList.contains('btn-report')) {
                self.doReportComment(activityId, id);
            }
        });
    },

    doPostComment: async function(activityId, parentId, replyContent) {
        if (this._submittingComment) return;
        var content = replyContent || document.getElementById('commentContent').value.trim();
        if (!content) { toast('请输入留言内容', 'error'); return; }
        if (content.length > 200) { toast('留言不能超过200字', 'error'); return; }

        this._submittingComment = true;
        var btn = document.getElementById('btnPostComment');
        var origText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '发布中...';

        var body = { content: content };
        if (parentId) body.parentId = parentId;

        try {
            await api('/activities/' + activityId + '/comments', { method: 'POST', body: body });
            if (!parentId) {
                var cc = document.getElementById('commentContent');
                if (cc) cc.value = '';
            }
            this.loadComments(activityId);
        } catch (err) {
            toast(err.message || '留言失败', 'error');
        } finally {
            this._submittingComment = false;
            btn.disabled = false;
            btn.textContent = origText;
        }
    },

    doReportComment: async function(activityId, commentId) {
        var reason = prompt('请选择举报原因：\n1. 垃圾广告\n2. 人身攻击\n3. 色情低俗\n4. 违法违规\n5. 其他\n\n输入序号：');
        var reasons = ['垃圾广告', '人身攻击', '色情低俗', '违法违规', '其他'];
        var idx = parseInt(reason) - 1;
        if (isNaN(idx) || idx < 0 || idx >= reasons.length) { toast('已取消举报'); return; }
        try {
            await api('/activities/' + activityId + '/comments/' + commentId + '/report',
                { method: 'PUT', body: { reason: reasons[idx] } });
            toast('举报成功，我们将尽快处理');
            this.loadComments(activityId);
        } catch (err) {
            toast(err.message || '举报失败', 'error');
        }
    }
});

// ====== 辅助函数 ======

function getStatusInfo(data) {
    var now = new Date();
    if (data.status === 'CANCELLED') return { label: '已取消', cls: 'cancelled' };
    if (data.endTime && now > new Date(data.endTime)) return { label: '已结束', cls: 'ended' };
    if (data.startTime && now > new Date(data.startTime)) return { label: '进行中', cls: 'active' };
    if (data.registrationDeadline && now > new Date(data.registrationDeadline)) return { label: '报名截止', cls: 'closed' };
    if (data.status === 'ACTIVE') return { label: '报名中', cls: 'open' };
    return { label: data.status, cls: 'default' };
}

function getCategoryName(cat) {
    var map = {
        'sports': '运动健身', 'outdoor': '户外徒步', 'boardgame': '桌游聚会',
        'study': '学习交流', 'charity': '公益活动', 'citywalk': '城市探索',
        '运动健身': '运动健身', '户外徒步': '户外徒步', '桌游聚会': '桌游聚会',
        '学习交流': '学习交流', '公益活动': '公益活动', '城市探索': '城市探索'
    };
    return map[cat] || cat || '其他';
}

function formatTime(t) {
    if (!t) return '';
    // 简单格式化，兼容 ISO 字符串
    return t.replace('T', ' ').substring(0, 16);
}

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// ====== US-043/044 留言渲染 ======
function renderCommentItem(c) {
    var user = c.user || {};
    var nickname = escapeHtml(user.nickname || '匿名');
    var time = formatTime(c.createdAt);
    var isReported = c.reportStatus === 'REPORTED';
    var content = escapeHtml(c.content || '');

    var html = '\
    <div class="comment-item" style="padding:10px 0;border-bottom:1px solid var(--border);">\
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">\
            <span style="font-weight:600;font-size:13px;">' + nickname + '</span>\
            <span style="font-size:11px;color:var(--text-secondary);">' + time + '</span>\
            ' + (isReported ? '<span style="font-size:11px;color:var(--warning);">[该留言正在审核中]</span>' : '') + '\
        </div>\
        <p style="font-size:14px;margin:4px 0;' + (isReported ? 'color:var(--text-secondary);font-style:italic;' : '') + 'word-wrap:break-word;word-break:break-word;overflow-wrap:break-word;">' + content + '</p>\
        <div style="display:flex;gap:8px;">\
            <button class="btn-reply btn btn-outline btn-sm" data-id="' + c.id + '" style="font-size:11px;width:auto;padding:2px 10px;">回复</button>\
            ' + (!isReported ? '<button class="btn-report btn btn-outline btn-sm" data-id="' + c.id + '" style="font-size:11px;width:auto;padding:2px 10px;color:var(--danger);">举报</button>' : '') + '\
        </div>\
        <div id="replyBox-' + c.id + '" style="display:none;margin-top:6px;">\
            <div style="display:flex;gap:6px;">\
                <input type="text" id="replyInput-' + c.id + '" placeholder="回复 ' + nickname + '" maxlength="200" class="form-input" style="font-size:12px;">\
            </div>\
        </div>';

    // 渲染回复
    if (c.replies && c.replies.length) {
        html += '<div style="margin-left:20px;padding-left:12px;border-left:2px solid var(--border);">';
        for (var r = 0; r < c.replies.length; r++) {
            var reply = c.replies[r];
            var ruser = reply.user || {};
            var rnick = escapeHtml(ruser.nickname || '匿名');
            var rtime = formatTime(reply.createdAt);
            var risReported = reply.reportStatus === 'REPORTED';
            html += '\
            <div style="padding:6px 0;' + (r > 0 ? 'border-top:1px solid var(--border);' : '') + '">\
                <span style="font-weight:600;font-size:12px;">' + rnick + '</span>\
                <span style="font-size:10px;color:var(--text-secondary);margin-left:6px;">' + rtime + '</span>\
                ' + (risReported ? '<span style="font-size:10px;color:var(--warning);margin-left:6px;">[审核中]</span>' : '') + '\
                <p style="font-size:13px;margin:2px 0;word-wrap:break-word;word-break:break-word;overflow-wrap:break-word;">' + escapeHtml(reply.content || '') + '</p>\
            </div>';
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

// 展开回复输入框（通过事件委托处理）
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-reply')) {
        var id = e.target.dataset.id;
        var box = document.getElementById('replyBox-' + id);
        if (box) {
            box.style.display = box.style.display === 'none' ? 'block' : 'none';
            var input = document.getElementById('replyInput-' + id);
            if (input && box.style.display === 'block') {
                input.focus();
                input.addEventListener('keypress', function(ev) {
                    if (ev.key === 'Enter') {
                        var detailPage = Router.routes['/activity/:id'];
                        if (!detailPage) return;
                        // 找到当前activityId并提交回复
                        var content = input.value.trim();
                        if (!content) return;
                        var hash = window.location.hash;
                        var parts = hash.split('/');
                        var activityId = parts[parts.length - 1];
                        detailPage.config.doPostComment(activityId, parseInt(id), content);
                    }
                });
            }
        }
    }
});

// ====== Mock 数据 ======
var MOCK_ACTIVITY_DETAIL = {
    id: 1,
    title: '周末篮球局',
    description: '周末一起打篮球！不限水平，新手老手都欢迎。我们会分组打半场，每组4-5人，轮流上场。场地已经预订好了，只需要带着好心情来就行。\n\n注意事项：\n1. 请自备水和毛巾\n2. 穿运动鞋\n3. 提前10分钟到场热身',
    category: 'sports',
    startTime: '2026-07-05T14:00:00',
    endTime: '2026-07-05T17:00:00',
    location: '朝阳公园篮球场',
    maxParticipants: 20,
    currentParticipants: 8,
    fee: 0,
    status: 'ACTIVE',
    tags: ['篮球', '运动', '周末'],
    images: [],
    coverImage: '',
    creatorId: 2,
    registrationDeadline: '2026-07-04T18:00:00',
    createdAt: '2026-06-29T10:00:00',
    creator: {
        id: 2,
        nickname: '运动达人张三',
        avatar: ''
    },
    myRegistration: {
        id: 1,
        status: 'CONFIRMED'
    }
};
