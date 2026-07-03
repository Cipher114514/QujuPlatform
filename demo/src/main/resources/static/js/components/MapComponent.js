// ====== 地图组件 ======
// US-014: 地图模式查看活动分布
// 使用高德地图JS SDK 2.0

var MapComponent = {
    mapInstance: null,
    markers: [],
    infoWindow: null,
    
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
        
        // TODO: 从配置文件获取高德Key
        var amapKey = 'YOUR_AMAP_KEY'; // 需要从后端或配置文件获取
        
        // 检查是否已加载高德地图SDK
        if (typeof AMap === 'undefined') {
            // 加载高德地图JS SDK 2.0
            this.loadAmapScript(amapKey, function() {
                self.createMap(containerId, options);
            });
        } else {
            this.createMap(containerId, options);
        }
    },
    
    /**
     * 加载高德地图SDK
     */
    loadAmapScript: function(key, callback) {
        // TODO: 确保高德JS SDK 2.0使用最新版本
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://webapi.amap.com/maps?v=2.0&key=' + key + '&plugin=AMap.MarkerClusterer';
        script.onload = function() {
            if (typeof AMap !== 'undefined') {
                callback();
            }
        };
        script.onerror = function() {
            console.error('高德地图SDK加载失败');
            // TODO: 显示友好的错误提示
            toast('地图加载失败，请检查网络连接', 'error');
        };
        document.head.appendChild(script);
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
        
        // TODO: 尝试获取用户位置
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    mapOptions.center = [lng, lat];
                    self.mapInstance = new AMap.Map(containerId, mapOptions);
                    self.loadActivities();
                },
                function(error) {
                    console.warn('获取位置失败，使用默认位置', error);
                    self.mapInstance = new AMap.Map(containerId, mapOptions);
                    self.loadActivities();
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            // 浏览器不支持定位
            this.mapInstance = new AMap.Map(containerId, mapOptions);
            this.loadActivities();
        }
        
        // 绑定地图事件
        this.mapInstance.on('complete', function() {
            console.log('地图加载完成');
        });
    },
    
    /**
     * 加载活动数据并在地图上标记
     */
    loadActivities: function() {
        var self = this;
        
        // TODO: 从后端API获取活动数据
        api('/map/activities', { method: 'GET' })
            .then(function(res) {
                var activities = res.data || [];
                self.renderMarkers(activities);
            })
            .catch(function(err) {
                console.error('加载活动数据失败:', err);
                // TODO: 显示错误提示
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
            // TODO: 显示暂无活动的提示
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
                // TODO: 自定义标记样式，根据活动类型或状态
                icon: new AMap.Icon({
                    size: new AMap.Size(30, 30),
                    image: 'https://webapi.amap.com/theme/v1.3/markers/b/mark_bs.png',
                    imageSize: new AMap.Size(30, 30)
                }),
                // 存储活动数据
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
    },
    
    /**
     * 显示信息窗口（活动摘要卡片）
     */
    showInfoWindow: function(activity, position) {
        var self = this;
        
        // 构建信息窗口内容
        var content = this.buildInfoContent(activity);
        
        // 创建或更新信息窗口
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
        
        // 打开信息窗口
        this.infoWindow.open(this.mapInstance, position);
        
        // 绑定信息窗口内的按钮事件（需要延迟执行，等待DOM渲染）
        setTimeout(function() {
            var detailBtn = document.querySelector('.info-window-detail-btn');
            if (detailBtn) {
                detailBtn.addEventListener('click', function() {
                    var activityId = parseInt(this.dataset.id);
                    Router.navigate('/activities/' + activityId);
                    self.infoWindow.close();
                });
            }
        }, 100);
    },
    
    /**
     * 构建信息窗口HTML
     */
    buildInfoContent: function(activity) {
        // TODO: 美化信息窗口样式
        var startTime = activity.startTime ? new Date(activity.startTime).toLocaleString('zh-CN') : '待定';
        var participants = activity.currentParticipants || 0;
        var maxParticipants = activity.maxParticipants || '不限';
        
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
            <div style="font-size:13px;color:#666;margin-bottom:8px;">
                👥 ${participants}${maxParticipants !== '不限' ? '/' + maxParticipants : ''}人
            </div>
            ${activity.description ? `<div style="font-size:13px;color:#888;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(activity.description)}</div>` : ''}
            <button class="btn btn-primary btn-sm info-window-detail-btn" 
                    data-id="${activity.id}" 
                    style="width:100%;padding:6px 12px;font-size:13px;">
                查看详情 →
            </button>
        </div>
        `;
    },
    
    /**
     * 根据分类筛选活动
     */
    filterByCategory: function(category) {
        // TODO: 实现按分类筛选
        console.log('筛选分类:', category);
    },
    
    /**
     * 根据距离筛选活动
     */
    filterByDistance: function(distance) {
        // TODO: 实现按距离筛选
        console.log('筛选距离:', distance);
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
    }
};