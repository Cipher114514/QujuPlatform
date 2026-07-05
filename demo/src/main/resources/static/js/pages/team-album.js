// ====== 小队相册页（US-031） ======
// 功能：相册网格墙、上传照片(本地文件+URL)、放大预览、删除照片、解散小队
// 负责人：P7

Router.register('/team/:id/album', {
    title: '小队相册',
    requireAuth: true,

    render: function(params) {
        return `
        <div class="team-album-page">
            <!-- 小队信息区 -->
            <div id="albumTeamInfo" class="team-info-section">
                <div class="loading">加载中...</div>
            </div>

            <!-- 上传区域 -->
            <div id="uploadArea" class="album-upload-section" style="display:none;">
                <h3>上传照片</h3>
                <!-- 上传方式切换 -->
                <div class="upload-tabs">
                    <button class="upload-tab active" data-mode="file">本地上传</button>
                    <button class="upload-tab" data-mode="url">URL上传</button>
                </div>
                <!-- 本地上传 -->
                <div id="uploadFileMode" class="upload-mode">
                    <label class="file-upload-label" id="fileUploadLabel">
                        <span id="filePlaceholder">点击选择图片（支持 JPG/PNG/GIF，≤10MB）</span>
                        <input type="file" id="photoFile" accept="image/*" style="display:none;" />
                    </label>
                    <img id="filePreview" src="" style="display:none;max-width:100%;max-height:200px;border-radius:8px;margin-top:8px;" />
                </div>
                <!-- URL上传 -->
                <div id="uploadUrlMode" class="upload-mode" style="display:none;">
                    <div class="form-group">
                        <label>图片URL</label>
                        <input type="text" id="photoUrl" placeholder="输入图片链接" maxlength="500" />
                    </div>
                </div>
                <div class="form-group">
                    <label>照片描述（选填）</label>
                    <input type="text" id="photoDesc" placeholder="描述这张照片" maxlength="200" />
                </div>
                <div id="uploadError" class="error-msg" style="margin-bottom:8px;"></div>
                <button class="btn btn-primary" id="btnUpload">上传</button>
            </div>

            <!-- 照片网格 -->
            <h3 style="margin:20px 0 12px;">相册</h3>
            <div id="photoGrid" class="album-grid">
                <div class="loading">加载中...</div>
            </div>
        </div>

        <!-- 照片预览模态框 -->
        <div id="photoPreview" class="modal" style="display:none;">
            <div class="modal-backdrop" id="closePreview"></div>
            <div class="modal-content preview-content">
                <button class="modal-close" id="closePreviewBtn">&times;</button>
                <img id="previewImg" src="" alt="照片预览" style="max-width:100%;max-height:70vh;border-radius:8px;" />
                <div id="previewInfo" style="margin-top:12px;text-align:center;"></div>
                <div style="text-align:center;margin-top:12px;">
                    <button class="btn btn-danger btn-sm" id="btnDeletePhoto" style="display:none;">删除照片</button>
                </div>
            </div>
        </div>
        `;
    },

    init: function(params) {
        var teamId = parseInt(params.id);
        var teamData = null;
        var photos = [];
        var currentPreviewPhoto = null;
        var uploadMode = 'file'; // 'file' | 'url'
        var selectedFile = null;

        // 加载小队信息
        async function loadTeamInfo() {
            try {
                var res = await TeamAPI.detail(teamId);
                teamData = res.data;
                renderTeamInfo();
                loadPhotos();
            } catch (e) {
                document.getElementById('albumTeamInfo').innerHTML =
                    '<div class="error">加载失败：' + (e.message || '网络错误') + '</div>';
            }
        }

        function renderTeamInfo() {
            if (!teamData) return;
            var t = teamData;

            document.getElementById('albumTeamInfo').innerHTML = `
                <div class="team-header">
                    <div class="team-avatar"><span style="font-size:48px;">👥</span></div>
                    <div class="team-meta-info">
                        <h1 class="team-title">${t.name} 的相册</h1>
                        <p class="team-description">${t.description || ''}</p>
                        <div class="team-stats">
                            <span>👤 队长: ${t.leaderNickname || '未知'}</span>
                            <span>👥 成员: ${t.memberCount || 0}人</span>
                        </div>
                    </div>
                </div>
                <div class="team-actions">
                    <a href="#/team/${teamId}" class="btn btn-outline">返回小队</a>
                    ${t.userRole === 'member' || t.userRole === 'leader' || t.userRole === 'admin'
                        ? '<button class="btn btn-primary" id="btnShowUpload">上传照片</button>'
                        : ''}
                </div>
            `;

            if (t.userRole === 'member' || t.userRole === 'leader' || t.userRole === 'admin') {
                document.getElementById('uploadArea').style.display = 'block';
            }

            var btnShowUpload = document.getElementById('btnShowUpload');
            if (btnShowUpload) {
                btnShowUpload.addEventListener('click', function() {
                    var area = document.getElementById('uploadArea');
                    area.style.display = area.style.display === 'none' ? 'block' : 'none';
                });
            }
        }

        // 加载照片列表
        async function loadPhotos() {
            try {
                var res = await TeamAPI.album(teamId);
                photos = res.data || [];
                renderPhotos();
            } catch (e) {
                document.getElementById('photoGrid').innerHTML =
                    '<div class="error">加载失败：' + (e.message || '网络错误') + '</div>';
            }
        }

        function renderPhotos() {
            var grid = document.getElementById('photoGrid');

            if (photos.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state" style="grid-column:1/-1;padding:60px 20px;">
                        <div style="font-size:48px;margin-bottom:12px;">📷</div>
                        <p>暂无照片，上传第一张吧</p>
                    </div>`;
                return;
            }

            grid.innerHTML = photos.map(function(p) {
                return `
                <div class="album-photo-card" data-photo-id="${p.id}">
                    <img src="${escAttr(p.imageUrl)}"
                         alt="${escHtmlAlbum(p.description || '照片')}"
                         loading="lazy"
                         onerror="this.style.display='none';this.parentElement.querySelector('.photo-placeholder').style.display='flex';" />
                    <div class="photo-placeholder" style="display:none;width:100%;height:180px;align-items:center;justify-content:center;background:#f1f5f9;color:#94a3b8;font-size:13px;">图片加载失败</div>
                    ${p.description ? '<p class="photo-desc">' + escHtmlAlbum(p.description) + '</p>' : ''}
                </div>`;
            }).join('');

            grid.querySelectorAll('.album-photo-card').forEach(function(card) {
                card.addEventListener('click', function() {
                    var photoId = parseInt(card.dataset.photoId);
                    var photo = photos.find(function(p) { return p.id === photoId; });
                    if (photo) showPreview(photo);
                });
            });
        }

        // 照片预览
        function showPreview(photo) {
            currentPreviewPhoto = photo;
            document.getElementById('previewImg').src = photo.imageUrl;
            document.getElementById('previewInfo').innerHTML = `
                ${photo.description ? '<p style="margin-bottom:4px;">' + escHtmlAlbum(photo.description) + '</p>' : ''}
                <p style="color:var(--text-secondary);font-size:13px;">
                    上传者：${photo.nickname || '未知'} · ${formatAlbumTime(photo.createdAt)}
                </p>`;
            document.getElementById('btnDeletePhoto').style.display = photo.canDelete ? '' : 'none';
            document.getElementById('photoPreview').style.display = 'flex';
        }

        function closePreview() {
            document.getElementById('photoPreview').style.display = 'none';
            currentPreviewPhoto = null;
        }

        document.getElementById('closePreview').addEventListener('click', closePreview);
        document.getElementById('closePreviewBtn').addEventListener('click', closePreview);

        // ===== 上传方式切换 =====
        document.querySelectorAll('.upload-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                uploadMode = this.dataset.mode;
                document.querySelectorAll('.upload-tab').forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                document.getElementById('uploadFileMode').style.display = uploadMode === 'file' ? '' : 'none';
                document.getElementById('uploadUrlMode').style.display = uploadMode === 'url' ? '' : 'none';
                clearUploadError();
            });
        });

        // ===== 文件选择 =====
        document.getElementById('photoFile').addEventListener('change', function() {
            clearUploadError();
            selectedFile = null;
            var file = this.files[0];
            if (!file) return;

            // 大小校验 (≤10MB)
            if (file.size > 10 * 1024 * 1024) {
                showUploadError('图片大小不能超过 10MB');
                this.value = '';
                return;
            }

            // 类型校验
            if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
                showUploadError('仅支持 JPG、PNG、GIF、WebP 格式');
                this.value = '';
                return;
            }

            selectedFile = file;
            document.getElementById('filePlaceholder').textContent = file.name + ' (' + formatFileSize(file.size) + ')';

            // 本地预览
            var reader = new FileReader();
            reader.onload = function(e) {
                var preview = document.getElementById('filePreview');
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });

        // ===== 上传 =====
        document.getElementById('btnUpload').addEventListener('click', async function() {
            var descEl = document.getElementById('photoDesc');
            var desc = descEl.value.trim();
            var btn = this;
            var errorEl = document.getElementById('uploadError');

            clearUploadError();

            if (uploadMode === 'file') {
                if (!selectedFile) {
                    showUploadError('请先选择图片文件');
                    return;
                }

                btn.disabled = true;
                btn.textContent = '上传中...';

                try {
                    // 1. 先上传文件到服务器
                    var uploadRes = await UploadAPI.upload(selectedFile, 'album');
                    var imageUrl = uploadRes.data.url;

                    // 2. 再创建相册记录
                    await TeamAPI.uploadPhoto(teamId, imageUrl, desc || undefined);
                    toast('上传成功');
                    resetUploadForm();
                    loadPhotos();
                } catch (e) {
                    showUploadError(e.message || '上传失败');
                } finally {
                    btn.disabled = false;
                    btn.textContent = '上传';
                }
            } else {
                var urlEl = document.getElementById('photoUrl');
                var url = urlEl.value.trim();

                if (!url) {
                    showUploadError('请输入图片URL');
                    return;
                }

                btn.disabled = true;
                btn.textContent = '上传中...';

                try {
                    await TeamAPI.uploadPhoto(teamId, url, desc || undefined);
                    toast('上传成功');
                    resetUploadForm();
                    loadPhotos();
                } catch (e) {
                    showUploadError(e.message || '上传失败');
                } finally {
                    btn.disabled = false;
                    btn.textContent = '上传';
                }
            }
        });

        function resetUploadForm() {
            document.getElementById('photoDesc').value = '';
            document.getElementById('photoUrl').value = '';
            document.getElementById('photoFile').value = '';
            selectedFile = null;
            document.getElementById('filePlaceholder').textContent = '点击选择图片（支持 JPG/PNG/GIF，≤10MB）';
            document.getElementById('filePreview').style.display = 'none';
            clearUploadError();
        }

        function showUploadError(msg) {
            var el = document.getElementById('uploadError');
            el.textContent = msg;
            el.classList.add('show');
        }

        function clearUploadError() {
            var el = document.getElementById('uploadError');
            el.textContent = '';
            el.classList.remove('show');
        }

        // ===== 删除照片 =====
        document.getElementById('btnDeletePhoto').addEventListener('click', async function() {
            if (!currentPreviewPhoto) return;
            if (!confirm('确定要删除此照片吗？')) return;

            try {
                await TeamAPI.deletePhoto(teamId, currentPreviewPhoto.id);
                toast('照片已删除');
                closePreview();
                loadPhotos();
            } catch (e) {
                toast('删除失败：' + (e.message || '网络错误'), 'error');
            }
        });

        // ===== 工具函数 =====
        function escHtmlAlbum(str) {
            if (!str) return '';
            return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        function escAttr(str) {
            if (!str) return '';
            return str.replace(/"/g,'&quot;');
        }

        function formatAlbumTime(dateStr) {
            if (!dateStr) return '';
            var d = new Date(dateStr);
            var now = new Date();
            var diff = now - d;
            if (diff < 60000) return '刚刚';
            if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
            if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
            return d.getFullYear() + '-' +
                   String(d.getMonth() + 1).padStart(2, '0') + '-' +
                   String(d.getDate()).padStart(2, '0');
        }

        function formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / 1048576).toFixed(1) + ' MB';
        }

        // 初始加载
        loadTeamInfo();
    }
});
