// ====== 地图组件 ======
// US-014: 地图模式查看活动分布
// 使用高德地图JS SDK 2.0
// 注意：高德JS API Key和安全密钥已在 index.html 中配置

var MapComponent = {
    mapInstance: null,
    markers: [],
    infoWindow: null,
    isInitialized: false,
    
    /**
     * 初始化地图
     * @param {string} containerId - 地图容器元素ID
     * @param {Object} options - 配置选项
     */
    init: function(containerId, options) {
        var self = this;
        var container = document.getElementById(containerId);
        if (!container) {
            console.error('地图容器不存在:', containerId);
            return;
        }
        
        // 检查高德SDK是否已加载
        if (typeof AMap === 'undefined') {
            console.error('高德地图SDK未加载，请检查 index.html 中的配置');
            toast('地图SDK加载失败，请刷新页面重试', 'error');
            return;
        }
        
        // 创建地图
        this.createMap(containerId, options);
    },
    
    /**
     * 创建地图实例
     */
    createMap: function(containerId, options) {
        var self = this;
        var container = document.getElementById(containerId);
        
        // 设置默认选项
        var mapOptions = {
            zoom: options.zoom || 13,
            center: options.center || [116.397428, 39.90923], // 默认北京
            mapStyle: 'amap://styles/light',
            viewMode: '2D',
            pitch: 0,
            features: ['bg', 'road', 'building', 'point']
        };
        
        // 尝试获取用户位置
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    mapOptions.center = [lng, lat];
                    self.mapInstance = new AMap.Map(containerId, mapOptions);
                    self.mapInstance.on('complete', function() {
                        self.isInitialized = true;
                        console.log('地图加载完成');
                    });
                    self.loadActivities();
                },
                function(error) {
                    console.warn('获取位置失败，使用默认位置', error);
                    self.mapInstance = new AMap.Map(containerId, mapOptions);
                    self.mapInstance.on('complete', function() {
                        self.isInitialized = true;
                        console.log('地图加载完成');
                    });
                    self.loadActivities();
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            // 浏览器不支持定位
            this.mapInstance = new AMap.Map(containerId, mapOptions);
            this.mapInstance.on('complete', function() {
                self.isInitialized = true;
                console.log('地图加载完成');
            });
            this.loadActivities();
        }
    },
    
    /**
     * 加载活动数据并在地图上标记
     */
    loadActivities: function() {
        var self = this;
        
        api('/map/activities', { method: 'GET' })
            .then(function(res) {
                var activities = res.data || [];
                self.renderMarkers(activities);
            })
            .catch(function(err) {
                console.error('加载活动数据失败:', err);
                toast('加载活动数据失败: ' + err.message, 'error');
            });
    },
    
    /**
     * 渲染标记点
     */
    renderMarkers: function(activities) {
        var self = this;
        
        // 清除已有标记
        if (this.markers.length > 0) {
            this.mapInstance.remove(this.markers);
            this.markers = [];
        }
        
        if (!activities || activities.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // 创建标记点
        activities.forEach(function(activity) {
            // 检查坐标是否有效
            if (!activity.lat || !activity.lng) {
                console.warn('活动缺少坐标信息:', activity.id, activity.title);
                return;
            }
            
            var marker = new AMap.Marker({
                position: [activity.lng, activity.lat],
                title: activity.title,
                icon: self.getMarkerIcon(activity.category),
                extData: activity
            });
            
            // 点击标记显示信息窗口
            marker.on('click', function(e) {
                var data = e.target.getExtData();
                self.showInfoWindow(data, e.target.getPosition());
            });
            
            self.mapInstance.add(marker);
            self.markers.push(marker);
        });
        
        // 自动调整视野以显示所有标记
        if (this.markers.length > 0) {
            this.mapInstance.setFitView(this.markers);
        }
        
        // 更新统计信息
        this.updateStats();
    },
    
    /**
     * 获取分类对应的标记图标和颜色
     */
    getMarkerIcon: function(category) {
        // 分类与颜色的映射（与 create-activity.js 保持一致）
        var categoryConfig = {
            '运动健身': { color: '#4ECDC4', icon: '🏃' },
            '户外徒步': { color: '#00CEC9', icon: '🥾' },
            '桌游聚会': { color: '#6C5CE7', icon: '🎲' },
            '学习交流': { color: '#A29BFE', icon: '📚' },
            '公益活动': { color: '#00B894', icon: '🤝' },
            '城市探索': { color: '#FFD93D', icon: '🗺️' }
        };
        
        var config = categoryConfig[category] || { color: '#636E72', icon: '📌' };
        
        // 使用高德默认标记，设置不同颜色
        // 注意：高德默认标记不支持直接改颜色，这里使用不同样式的标记
        return new AMap.Icon({
            size: new AMap.Size(30, 30),
            image: 'https://webapi.amap.com/theme/v1.3/markers/b/mark_b.png',
            imageSize: new AMap.Size(30, 30)
        });
    },
    
    /**
     * 显示空状态
     */
    showEmptyState: function() {
        if (!this.infoWindow) {
            this.infoWindow = new AMap.InfoWindow({
                content: `
                    <div style="padding:20px;text-align:center;color:var(--text-secondary);">
                        <div style="font-size:48px;margin-bottom:12px;">📍</div>
                        <div style="font-size:16px;font-weight:500;">暂无附近活动</div>
                        <div style="font-size:13px;margin-top:4px;">换个地点或稍后再来看看吧</div>
                    </div>
                `,
                offset: new AMap.Pixel(0, -30),
                autoMove: false,
                closeWhenClickMap: true
            });
        }
        this.infoWindow.open(this.mapInstance, this.mapInstance.getCenter());
    },
    
    /**
     * 显示信息窗口（活动摘要卡片）
     */
    showInfoWindow: function(activity, position) {
        var self = this;
        
        var content = this.buildInfoContent(activity);
        
        if (!this.infoWindow) {
            this.infoWindow = new AMap.InfoWindow({
                content: content,
                offset: new AMap.Pixel(0, -30),
                autoMove: true,
                closeWhenClickMap: true
            });
        } else {
            this.infoWindow.setContent(content);
        }
        
        this.infoWindow.open(this.mapInstance, position);
        
        // 绑定信息窗口内的按钮事件
        setTimeout(function() {
            var detailBtn = document.querySelector('.info-window-detail-btn');
            if (detailBtn) {
                detailBtn.addEventListener('click', function() {
                    var activityId = parseInt(this.dataset.id);
                    if (typeof Router !== 'undefined') {
                        Router.navigate('/activities/' + activityId);
                    } else {
                        window.location.href = '#/activities/' + activityId;
                    }
                    self.infoWindow.close();
                });
            }
        }, 100);
    },
    
    /**
     * 构建信息窗口HTML
     */
    buildInfoContent: function(activity) {
        var startTime = activity.startTime ? new Date(activity.startTime).toLocaleString('zh-CN') : '待定';
        var participants = activity.currentParticipants || 0;
        var maxParticipants = activity.maxParticipants || '不限';
        
        // 获取分类图标
        var categoryIcons = {
            '运动健身': '🏃',
            '户外徒步': '🥾',
            '桌游聚会': '🎲',
            '学习交流': '📚',
            '公益活动': '🤝',
            '城市探索': '🗺️'
        };
        var categoryIcon = categoryIcons[activity.category] || '📌';
        
        return `
        <div style="padding:12px;min-width:220px;max-width:280px;">
            <div style="font-weight:600;font-size:16px;margin-bottom:6px;color:#333;">
                ${escapeHtml(activity.title)}
            </div>
            ${activity.coverImage ? `<img src="${escapeHtml(activity.coverImage)}" style="width:100%;height:120px;object-fit:cover;border-radius:4px;margin-bottom:6px;">` : ''}
            <div style="font-size:13px;color:#666;margin-bottom:4px;">
                📍 ${escapeHtml(activity.location || '位置待定')}
            </div>
            <div style="font-size:13px;color:#666;margin-bottom:4px;">
                🕐 ${startTime}
            </div>
            <div style="font-size:13px;color:#666;margin-bottom:4px;">
                ${categoryIcon} ${escapeHtml(activity.category || '未分类')}
            </div>
            <div style="font-size:13px;color:#666;margin-bottom:8px;">
                👥 ${participants}${maxParticipants !== '不限' ? '/' + maxParticipants : ''}人
            </div>
            ${activity.description ? `<div style="font-size:13px;color:#888;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(activity.description)}</div>` : ''}
            <button class="btn btn-primary btn-sm info-window-detail-btn" 
                    data-id="${activity.id}" 
                    style="width:100%;padding:6px 12px;font-size:13px;cursor:pointer;border:none;border-radius:4px;">
                查看详情 →
            </button>
        </div>
        `;
    },
    
    /**
     * 更新统计信息
     */
    updateStats: function() {
        var statsEl = document.getElementById('mapStats');
        if (statsEl) {
            var count = this.markers ? this.markers.length : 0;
            statsEl.textContent = count > 0 ? `共 ${count} 个活动` : '暂无活动可显示';
        }
    },
    
    /**
     * 刷新地图数据
     */
    refresh: function() {
        this.loadActivities();
    },
    
    /**
     * 销毁地图实例
     */
    destroy: function() {
        if (this.mapInstance) {
            this.mapInstance.destroy();
            this.mapInstance = null;
        }
        this.markers = [];
        this.infoWindow = null;
        this.isInitialized = false;
    }
};