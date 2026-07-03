// ====== 地图页面 ======
// US-014: 地图模式查看活动分布

Router.register('/map', {
    title: '活动地图',
    requireAuth: true,
    
    render: function() {
        return `
        <div class="map-page" style="height:100vh;display:flex;flex-direction:column;">
            <!-- 顶部工具栏 -->
            <div style="padding:12px 16px;background:var(--bg);border-bottom:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <h2 style="margin:0;font-size:18px;">🗺️ 附近活动</h2>
                <div style="flex:1;"></div>
                <button class="btn btn-outline btn-sm" id="refreshMapBtn">🔄 刷新</button>
                <button class="btn btn-outline btn-sm" id="locateBtn">📍 定位</button>
                <select id="categoryFilter" style="padding:4px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg);color:var(--text);">
                    <option value="">全部</option>
                    <option value="音乐">🎵 音乐</option>
                    <option value="运动">🏃 运动</option>
                    <option value="美食">🍜 美食</option>
                    <option value="艺术">🎨 艺术</option>
                    <option value="社交">👥 社交</option>
                    <option value="其他">📌 其他</option>
                </select>
                <select id="distanceFilter" style="padding:4px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;background:var(--bg);color:var(--text);">
                    <option value="5000">5km内</option>
                    <option value="10000">10km内</option>
                    <option value="20000">20km内</option>
                    <option value="0">不限</option>
                </select>
            </div>
            
            <!-- 地图容器 -->
            <div id="mapContainer" style="flex:1;position:relative;">
                <!-- 加载提示 -->
                <div id="mapLoading" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:var(--text-secondary);">
                    <div style="font-size:48px;margin-bottom:12px;">🗺️</div>
                    <div style="font-size:16px;font-weight:500;">地图加载中...</div>
                    <div style="font-size:13px;margin-top:4px;">请稍候</div>
                    <div class="spinner" style="margin:12px auto;border-color:rgba(0,0,0,.15);border-top-color:var(--primary);"></div>
                </div>
            </div>
            
            <!-- 底部统计 -->
            <div id="mapStats" style="padding:8px 16px;background:var(--bg);border-top:1px solid var(--border);font-size:13px;color:var(--text-secondary);text-align:center;">
                加载中...
            </div>
        </div>
        `;
    },
    
    init: function() {
        var self = this;
        
        // 初始化地图组件
        this.initMap();
        
        // 绑定事件
        document.getElementById('refreshMapBtn').addEventListener('click', function() {
            self.refreshMap();
        });
        
        document.getElementById('locateBtn').addEventListener('click', function() {
            self.locateUser();
        });
        
        document.getElementById('categoryFilter').addEventListener('change', function() {
            self.filterMap();
        });
        
        document.getElementById('distanceFilter').addEventListener('change', function() {
            self.filterMap();
        });
    },
    
    initMap: function() {
        // TODO: 从后端获取高德Key（安全考虑，应由后端提供）
        // 当前使用前端配置，后续应改为后端接口获取
        var amapKey = 'YOUR_AMAP_KEY'; // 需要替换为实际Key
        
        // 检查容器是否存在
        var container = document.getElementById('mapContainer');
        if (!container) {
            console.error('地图容器不存在');
            return;
        }
        
        // 移除加载提示
        var loading = document.getElementById('mapLoading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // 初始化地图
        if (typeof MapComponent !== 'undefined') {
            MapComponent.init('mapContainer', {
                zoom: 14,
                center: null // 自动定位
            });
            
            // 更新统计信息
            this.updateStats();
        } else {
            console.error('MapComponent未加载');
            toast('地图组件加载失败', 'error');
        }
    },
    
    refreshMap: function() {
        if (typeof MapComponent !== 'undefined' && MapComponent.refresh) {
            MapComponent.refresh();
            toast('地图已刷新');
            this.updateStats();
        }
    },
    
    locateUser: function() {
        // TODO: 定位到用户当前位置
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    if (typeof MapComponent !== 'undefined' && MapComponent.mapInstance) {
                        MapComponent.mapInstance.setCenter([lng, lat]);
                        MapComponent.mapInstance.setZoom(15);
                        toast('已定位到您的位置');
                    }
                },
                function(error) {
                    toast('定位失败: ' + error.message, 'error');
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            toast('您的浏览器不支持定位', 'error');
        }
    },
    
    filterMap: function() {
        // TODO: 实现筛选功能
        var category = document.getElementById('categoryFilter').value;
        var distance = document.getElementById('distanceFilter').value;
        console.log('筛选条件:', { category, distance });
        toast('筛选功能开发中...');
    },
    
    updateStats: function() {
        // TODO: 更新底部统计信息
        var statsEl = document.getElementById('mapStats');
        if (statsEl) {
            // 从地图组件获取标记数量
            var count = 0;
            if (typeof MapComponent !== 'undefined' && MapComponent.markers) {
                count = MapComponent.markers.length;
            }
            statsEl.textContent = count > 0 ? `共 ${count} 个活动` : '暂无活动可显示';
        }
    },
    
    destroy: function() {
        if (typeof MapComponent !== 'undefined' && MapComponent.destroy) {
            MapComponent.destroy();
        }
    }
});