// ====== 地图页面 ======
// US-014: 地图模式查看活动分布

// 主要城市坐标（市政府所在地，供城市选择器使用）
var MAP_CITIES = [
    { name: '自动定位', lat: null, lng: null },
    { name: '北京', lat: 39.9037, lng: 116.3974 },   // 北京市政府（正义路）
    { name: '上海', lat: 31.2304, lng: 121.4737 },   // 上海市政府（人民大道）
    { name: '广州', lat: 23.1291, lng: 113.2644 },   // 广州市政府（府前路）
    { name: '深圳', lat: 22.5470, lng: 114.0577 },   // 深圳市民中心
    { name: '杭州', lat: 30.2460, lng: 120.2116 },   // 杭州市民中心
    { name: '成都', lat: 30.5728, lng: 104.0668 },   // 成都市政府
    { name: '武汉', lat: 30.5928, lng: 114.3055 },   // 武汉市政府
    { name: '南京', lat: 32.0617, lng: 118.7916 },   // 南京市政府（北京东路）
    { name: '重庆', lat: 29.5630, lng: 106.5516 },   // 重庆市政府（渝中区）
    { name: '西安', lat: 34.2658, lng: 108.9401 },   // 西安市政府（未央区）
    { name: '长沙', lat: 28.2282, lng: 112.9388 },   // 长沙市政府（岳麓区）
    { name: '天津', lat: 39.1170, lng: 117.2027 },   // 天津市政府（河西区）
    { name: '苏州', lat: 31.2990, lng: 120.5853 },   // 苏州市政府
    { name: '厦门', lat: 24.4825, lng: 118.0895 },   // 厦门市政府
    { name: '青岛', lat: 36.0671, lng: 120.3826 },   // 青岛市政府
    { name: '郑州', lat: 34.7587, lng: 113.6533 },   // 郑州市政府（中原区）
    { name: '大连', lat: 38.9140, lng: 121.6147 },   // 大连市政府
    { name: '昆明', lat: 25.0389, lng: 102.7183 },   // 昆明市政府
    { name: '合肥', lat: 31.8206, lng: 117.2272 },   // 合肥市政府
];

Router.register('/map', {
    title: '活动地图',
    requireAuth: true,
    
    render: function() {
        var cityOptions = MAP_CITIES.map(function(c, i) {
            return '<option value="' + i + '">' + c.name + '</option>';
        }).join('');

        return '\
        <div class="map-page" style="height:100vh;display:flex;flex-direction:column;">\
            <!-- 顶部工具栏 -->\
            <div style="padding:10px 16px;background:var(--bg);border-bottom:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;align-items:center;">\
                <h2 style="margin:0;font-size:18px;">🗺️ 附近活动</h2>\
                <div style="flex:1;"></div>\
                <select id="citySelector" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;background:var(--card);color:var(--text);max-width:110px;">' +
                    cityOptions +
                '</select>\
                <select id="categoryFilter" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;background:var(--card);color:var(--text);">\
                    <option value="">全部分类</option>\
                    <option value="sports">⚽ 运动</option>\
                    <option value="outdoor">🏔️ 户外</option>\
                    <option value="boardgame">🎲 桌游</option>\
                    <option value="study">📚 学习</option>\
                    <option value="charity">🤝 公益</option>\
                    <option value="citywalk">🚶 城市探索</option>\
                </select>\
                <select id="distanceFilter" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;background:var(--card);color:var(--text);">\
                    <option value="5000">5km内</option>\
                    <option value="10000">10km内</option>\
                    <option value="20000">20km内</option>\
                    <option value="0">不限距离</option>\
                </select>\
                <button class="btn btn-outline btn-sm" id="locateBtn">📍</button>\
                <button class="btn btn-outline btn-sm" id="refreshMapBtn">🔄</button>\
            </div>\
            \
            <!-- 地图容器 -->\
            <div id="mapContainer" style="flex:1;position:relative;">\
                <div id="mapLoading" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:var(--text-secondary);">\
                    <div style="font-size:48px;margin-bottom:12px;">🗺️</div>\
                    <div style="font-size:16px;font-weight:500;">地图加载中...</div>\
                </div>\
            </div>\
            \
            <!-- 底部统计 -->\
            <div id="mapStats" style="padding:8px 16px;background:var(--bg);border-top:1px solid var(--border);font-size:13px;color:var(--text-secondary);text-align:center;">\
                加载中...\
            </div>\
        </div>';
    },
    
    init: function() {
        var self = this;
        var savedCityIdx = localStorage.getItem('map_city');
        var restoredCity = null;

        // 恢复上次选择的城市：先把坐标传给 initMap，地图创建时直接用
        if (savedCityIdx) {
            var city = MAP_CITIES[parseInt(savedCityIdx)];
            if (city && city.lat && city.lng) {
                restoredCity = city;
                MapComponent.manualCity = city.name;
            }
        }
        
        this.initMap(restoredCity);

        // 恢复下拉框选中项
        if (restoredCity) {
            var sel = document.getElementById('citySelector');
            if (sel) sel.value = savedCityIdx;
        }
        
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

        document.getElementById('citySelector').addEventListener('change', function() {
            localStorage.setItem('map_city', this.value);
            self.switchCity(parseInt(this.value));
        });
    },

    switchCity: function(index) {
        var city = MAP_CITIES[index];
        if (!city) return;

        if (city.lat && city.lng) {
            if (typeof MapComponent !== 'undefined' && MapComponent.centerTo) {
                MapComponent.manualCity = city.name;
                MapComponent.centerTo(city.lat, city.lng, 16);
                // centerTo 内部调用了 loadActivities，不需要再 filterMap
            }
        } else {
            MapComponent.manualCity = null;
            this.locateUser();
        }
    },
    
    initMap: function(restoredCity) {
        var container = document.getElementById('mapContainer');
        if (!container) return;

        if (typeof MapComponent !== 'undefined') {
            var center = restoredCity ? [restoredCity.lng, restoredCity.lat] : null;
            MapComponent.init('mapContainer', { zoom: 16, center: center });
        }
    },
    
    refreshMap: function() {
        if (typeof MapComponent !== 'undefined' && MapComponent.refresh) {
            MapComponent.refresh();
            toast('地图已刷新');
        }
    },
    
    locateUser: function() {
        if (typeof MapComponent !== 'undefined' && MapComponent.locateUser) {
            // 如果用户已手动选择了城市，提示先选择"自动定位"
            if (MapComponent.manualCity) {
                toast('当前城市：「' + MapComponent.manualCity + '」，如需自动定位请选择"自动定位"');
                return;
            }
            MapComponent.locateUser();
            var sel = document.getElementById('citySelector');
            if (sel) sel.value = '0';
        } else {
            toast('定位功能不可用', 'error');
        }
    },
    
    filterMap: function() {
        var category = document.getElementById('categoryFilter').value;
        var distance = parseInt(document.getElementById('distanceFilter').value);
        
        if (typeof MapComponent !== 'undefined' && MapComponent.filterActivities) {
            MapComponent.filterActivities(category, distance);
        }
    },
    
    destroy: function() {
        if (typeof MapComponent !== 'undefined' && MapComponent.destroy) {
            MapComponent.destroy();
        }
    }
});