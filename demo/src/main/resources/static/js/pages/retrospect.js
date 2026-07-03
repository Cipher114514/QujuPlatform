// ====== 活动复盘页 (US-021) ======
// 路由 #/activity/:id/retrospect

Router.register('/activity/:id/retrospect', {
    title: '活动复盘',
    requireAuth: true,

    render: function() {
        return `
        <div class="home-content">
            <button class="btn btn-outline btn-sm" onclick="Router.navigate('/activity/' + getRetrospectActivityId())" style="width:auto;margin-bottom:12px;">← 返回活动</button>
            <div class="welcome-card"><h2>活动复盘</h2></div>
            <div id="retroStats" style="margin-bottom:16px;">
                <p style="text-align:center;padding:20px;color:var(--text-secondary);">加载中...</p>
            </div>
            <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
                <h3 style="font-size:15px;">活动花絮</h3>
                <div id="galleryUploadBtn" style="display:none;">
                    <button class="btn btn-outline btn-sm" onclick="toggleGalleryForm()" style="width:auto;">+ 上传花絮</button>
                </div>
            </div>
            <div id="galleryForm" style="display:none;margin-bottom:12px;">
                <div class="card">
                    <!-- 拖拽上传区域 -->
                    <div id="dropZone" style="border:2px dashed var(--border);border-radius:var(--radius);padding:30px;text-align:center;cursor:pointer;transition:all .2s;margin-bottom:12px;">
                        <div style="font-size:36px;margin-bottom:8px;">📁</div>
                        <p style="font-size:14px;color:var(--text-secondary);margin-bottom:4px;">拖拽图片到此处，或点击选择文件</p>
                        <p style="font-size:12px;color:var(--text-secondary);">支持 JPG/PNG/GIF/WebP，单文件不超过5MB</p>
                        <input type="file" id="galleryFileInput" accept="image/*" style="display:none;">
                        <div id="uploadPreview" style="display:none;margin-top:12px;"></div>
                    </div>
                    <div style="text-align:center;color:var(--text-secondary);font-size:13px;margin-bottom:8px;">— 或者输入图片URL —</div>
                    <div style="display:flex;gap:8px;">
                        <input type="url" id="galleryUrl" placeholder="输入花絮图片URL" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:var(--radius);font-size:14px;">
                        <button class="btn btn-primary btn-sm" id="uploadUrlBtn" onclick="uploadGalleryUrl()" style="width:auto;">上传</button>
                    </div>
                </div>
            </div>
            <div id="galleryContainer" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
                <p style="text-align:center;padding:20px;color:var(--text-secondary);grid-column:1/-1;">加载中...</p>
            </div>
            <div id="galleryPagination" style="text-align:center;margin-top:16px;"></div>
        </div>`;
    },

    init: function() {
        var activityId = getRetrospectActivityId();
        loadRetrospect(activityId);
        loadGallery(activityId, 0);
        setTimeout(function() { initDropZone(); }, 200);
    }
});

function getRetrospectActivityId() {
    var hash = window.location.hash;
    var parts = hash.split('/');
    return parts[parts.length - 2];
}

var _galleryPage = 0;

// ==================== SVG 动画扇形图 ====================

function renderDonutChart(percentage, colorHex) {
    var r = 54, c = 2 * Math.PI * r;
    return `
    <svg width="140" height="140" viewBox="0 0 140 140" style="display:inline-block;">
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="#eee" stroke-width="12"/>
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="${colorHex}" stroke-width="12"
            stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}"
            transform="rotate(-90 70 70)" id="donutArc"/>
    </svg>
    <div style="position:absolute;top:16px;left:16px;width:108px;height:108px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;pointer-events:none;">
        <span style="font-size:28px;font-weight:700;color:${colorHex};" id="donutPercent">0%</span>
        <span style="font-size:11px;color:var(--text-secondary);">签到率</span>
    </div>`;
}

function animateDonut(targetPercent, colorHex) {
    var c = 2 * Math.PI * 54;
    var targetOffset = c - (targetPercent / 100) * c;
    var start = null;
    var percentEl = document.getElementById('donutPercent');
    var arc = document.getElementById('donutArc');

    function step(ts) {
        if (!start) start = ts;
        var elapsed = ts - start;
        var duration = 800;
        var progress = Math.min(elapsed / duration, 1);
        // easeOutCubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var currentOffset = c - (c - targetOffset) * eased;
        arc.setAttribute('stroke-dashoffset', currentOffset);
        var displayPercent = Math.round(eased * targetPercent);
        percentEl.textContent = displayPercent + '%';
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}

// ==================== 悬停 Tooltip ====================

function renderStatItem(value, color, label, dataKey) {
    return '<div class="stat-item" data-key="' + dataKey + '" style="cursor:default;position:relative;">' +
        '<div style="font-size:22px;font-weight:700;' + (color ? 'color:' + color + ';' : '') + '">' + value + '</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);">' + label + '</div>' +
        '</div>';
}

var _tooltipDetails = null;

function showTooltip(el, users) {
    if (!users || users.length === 0) return;
    var html = '';
    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        var avatarHtml = u.avatar
            ? '<img src="' + u.avatar + '" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">'
            : '<div style="width:20px;height:20px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">' + (u.nickname ? u.nickname.charAt(0) : '?') + '</div>';
        html += '<div style="display:flex;align-items:center;gap:6px;padding:3px 0;">' + avatarHtml + '<span style="font-size:13px;">' + u.nickname + '</span></div>';
    }
    var tip = document.createElement('div');
    tip.className = 'retro-tooltip';
    tip.innerHTML = html;
    tip.style.cssText = 'position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:8px 12px;border-radius:8px;font-size:12px;white-space:nowrap;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,.2);max-height:200px;overflow-y:auto;';
    tip.id = 'retroTooltip';
    el.appendChild(tip);
}

function hideTooltip(el) {
    var tip = document.getElementById('retroTooltip');
    if (tip) tip.remove();
}

// ==================== 加载复盘数据 ====================

async function loadRetrospect(activityId) {
    try {
        var res = await ReviewAPI.retrospect(activityId);
        var d = res.data;
        var percentage = Math.round(d.checkInRate || 0);
        var colorHex = percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f5a623' : '#ef4444';

        document.getElementById('retroStats').innerHTML = `
        <div class="card" style="text-align:center;">
            <div style="display:inline-block;position:relative;width:140px;height:140px;margin-bottom:16px;">
                ${renderDonutChart(percentage, colorHex)}
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;" id="statGrid">
                ${renderStatItem(d.totalRegistrations, null, '总报名', 'all')}
                ${renderStatItem(d.checkedInCount, 'var(--success)', '已签到', 'checkedIn')}
                ${renderStatItem(d.confirmedCount, 'var(--text-secondary)', '未签到', 'confirmed')}
                ${renderStatItem(d.cancelledCount, 'var(--danger)', '已取消', 'cancelled')}
            </div>
        </div>`;

        // 执行动画
        setTimeout(function() { animateDonut(percentage, colorHex); }, 100);

        // 加载参与者详情用于tooltip
        loadRetrospectDetails(activityId);

        // 只有发起人可以上传花絮
        var curUser = getCurUser();
        fetch('/activities/' + activityId, {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        }).then(function(r) { return r.json(); }).then(function(res) {
            if (res.data && curUser && Number(curUser.id) === Number(res.data.creatorId)) {
                document.getElementById('galleryUploadBtn').style.display = 'block';
            }
        }).catch(function() {});
    } catch (err) {
        document.getElementById('retroStats').innerHTML =
            '<div class="card" style="text-align:center;padding:20px;color:var(--danger);">加载失败: ' + (err.message || '未知错误') + '</div>';
    }
}

async function loadRetrospectDetails(activityId) {
    try {
        var res = await ReviewAPI.retrospectDetails(activityId);
        _tooltipDetails = res.data;

        // 绑定tooltip事件
        var statGrid = document.getElementById('statGrid');
        statGrid.addEventListener('mouseenter', function(e) {
            var item = e.target.closest('.stat-item');
            if (!item || !_tooltipDetails) return;
            var key = item.getAttribute('data-key');
            var users;
            if (key === 'all') {
                users = [].concat(_tooltipDetails.checkedInUsers || [], _tooltipDetails.confirmedUsers || [], _tooltipDetails.cancelledUsers || []);
            } else if (key === 'checkedIn') {
                users = _tooltipDetails.checkedInUsers;
            } else if (key === 'confirmed') {
                users = _tooltipDetails.confirmedUsers;
            } else if (key === 'cancelled') {
                users = _tooltipDetails.cancelledUsers;
            }
            if (users && users.length > 0) {
                showTooltip(item, users);
            }
        }, true);

        statGrid.addEventListener('mouseleave', function(e) {
            var item = e.target.closest('.stat-item');
            if (item) hideTooltip(item);
        }, true);
    } catch (err) {
        // 静默失败，不影响主功能
    }
}

// ==================== 花絮上传（拖拽+文件选择） ====================

function toggleGalleryForm() {
    var form = document.getElementById('galleryForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function initDropZone() {
    var zone = document.getElementById('dropZone');
    var input = document.getElementById('galleryFileInput');

    if (!zone || !input) return;

    // 点击触发文件选择
    zone.addEventListener('click', function() {
        input.click();
    });

    // 文件选择
    input.addEventListener('change', function() {
        if (input.files && input.files[0]) {
            handleFileUpload(input.files[0]);
        }
    });

    // 拖拽事件
    zone.addEventListener('dragover', function(e) {
        e.preventDefault();
        zone.style.borderColor = 'var(--primary)';
        zone.style.background = 'rgba(99,102,241,.05)';
    });

    zone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        zone.style.borderColor = 'var(--border)';
        zone.style.background = '';
    });

    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        zone.style.borderColor = 'var(--border)';
        zone.style.background = '';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
}

async function handleFileUpload(file) {
    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
        toast('仅支持 JPG/PNG/GIF/WebP 格式', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        toast('文件大小不能超过5MB', 'error');
        return;
    }

    // 显示预览
    var preview = document.getElementById('uploadPreview');
    preview.style.display = 'block';
    preview.innerHTML = '<div style="display:flex;align-items:center;gap:8px;justify-content:center;">' +
        '<img src="' + URL.createObjectURL(file) + '" style="width:60px;height:60px;object-fit:cover;border-radius:4px;">' +
        '<span style="font-size:13px;color:var(--primary);">上传中...</span></div>';

    try {
        var fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'gallery');
        var uploadRes = await UploadAPI.upload(file, 'gallery');
        var url = uploadRes.data.url;

        await ReviewAPI.galleryAdd(getRetrospectActivityId(), { imageUrl: url });
        toast('上传成功！');
        preview.style.display = 'none';
        document.getElementById('galleryFileInput').value = '';
        _galleryPage = 0;
        loadGallery(getRetrospectActivityId(), 0);
    } catch (err) {
        toast(err.message || '上传失败', 'error');
        preview.style.display = 'none';
    }
}

async function uploadGalleryUrl() {
    var url = document.getElementById('galleryUrl').value.trim();
    if (!url) { toast('请输入图片URL', 'error'); return; }

    var btn = document.getElementById('uploadUrlBtn');
    btn.disabled = true;
    btn.textContent = '上传中...';

    try {
        await ReviewAPI.galleryAdd(getRetrospectActivityId(), { imageUrl: url });
        toast('上传成功！');
        document.getElementById('galleryUrl').value = '';
        _galleryPage = 0;
        loadGallery(getRetrospectActivityId(), 0);
    } catch (err) {
        toast(err.message || '上传失败', 'error');
    }
    btn.disabled = false;
    btn.textContent = '上传';
}

// ==================== 花絮列表 ====================

async function loadGallery(activityId, page) {
    _galleryPage = page;
    try {
        var res = await ReviewAPI.galleryList(activityId, page);
        var pg = res.data;
        var container = document.getElementById('galleryContainer');

        if (!pg.content || pg.content.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);grid-column:1/-1;">暂无花絮</p>';
            document.getElementById('galleryPagination').innerHTML = '';
            return;
        }

        var html = '';
        for (var i = 0; i < pg.content.length; i++) {
            var item = pg.content[i];
            html += '<div style="border-radius:var(--radius);overflow:hidden;background:#f0f0f0;aspect-ratio:1;">' +
                '<img src="' + item.imageUrl + '" alt="花絮" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">' +
                '</div>';
        }
        container.innerHTML = html;

        var pagHtml = '';
        if (pg.totalPages > 1) {
            pagHtml += '<button class="btn btn-outline btn-sm" ' + (_galleryPage === 0 ? 'disabled' : '') +
                ' onclick="loadGallery(getRetrospectActivityId(), ' + (_galleryPage - 1) + ')" style="width:auto;">上一页</button> ';
            pagHtml += '<span style="font-size:13px;color:var(--text-secondary);">第' + (_galleryPage + 1) + '/' + pg.totalPages + '页</span> ';
            pagHtml += '<button class="btn btn-outline btn-sm" ' + (_galleryPage >= pg.totalPages - 1 ? 'disabled' : '') +
                ' onclick="loadGallery(getRetrospectActivityId(), ' + (_galleryPage + 1) + ')" style="width:auto;">下一页</button>';
        }
        document.getElementById('galleryPagination').innerHTML = pagHtml;
    } catch (err) {
        document.getElementById('galleryContainer').innerHTML =
            '<p style="text-align:center;padding:20px;color:var(--danger);grid-column:1/-1;">加载失败: ' + (err.message || '未知错误') + '</p>';
        document.getElementById('galleryPagination').innerHTML = '';
    }
}
