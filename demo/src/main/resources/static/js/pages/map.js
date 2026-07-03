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
                    <option value="运动健身">🏃 运动健身</option>
                    <option value="户外徒步">🥾 户外徒步</option>
                    <option value="桌游聚会">🎲 桌游聚会</option>
                    <option value="学习交流">📚 学习交流</option>
                    <option value="公益活动">🤝 公益活动</option>
                    <option value="城市探索">🗺️ 城市探索</option>
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
        
        // 初始化地图组件（会动态加载SDK）
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
        var container = document.getElementById('mapContainer');
        if (!container) {
            console.error('地图容器不存在');
            return;
        }
        
        // 初始化地图（MapComponent内部会动态加载SDK并定位）
        if (typeof MapComponent !== 'undefined') {
            MapComponent.init('mapContainer', {
                zoom: 14,
                center: null
            });
        } else {
            console.error('MapComponent未加载');
            toast('地图组件加载失败', 'error');
        }
    },
    
    refreshMap: function() {
        if (typeof MapComponent !== 'undefined' && MapComponent.refresh) {
            MapComponent.refresh();
            toast('地图已刷新');
        }
    },
    
    locateUser: function() {
        // 调用 MapComponent 的定位方法
        if (typeof MapComponent !== 'undefined' && MapComponent.locateUser) {
            MapComponent.locateUser();
        } else {
            toast('定位功能不可用', 'error');
        }
    },
    
    filterMap: function() {
        var category = document.getElementById('categoryFilter').value;
        var distance = parseInt(document.getElementById('distanceFilter').value);
        console.log('筛选条件:', { category, distance });
        
        // 调用MapComponent的筛选方法
        if (typeof MapComponent !== 'undefined' && MapComponent.filterActivities) {
            MapComponent.filterActivities(category, distance);
        } else {
            toast('筛选功能开发中...');
        }
    },
    
    destroy: function() {
        if (typeof MapComponent !== 'undefined' && MapComponent.destroy) {
            MapComponent.destroy();
        }
    }
});