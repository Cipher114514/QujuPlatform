// ====== 地图组件 ======
// US-014: 地图模式查看活动分布
// 使用高德地图JS SDK 2.0
// 动态从后端获取高德配置并加载SDK

var MapComponent = {
    mapInstance: null,
    markers: [],
    infoWindow: null,
    isInitialized: false,
    allActivities: [],
    currentFilters: { category: '', distance: 0 },
    isSDKLoaded: false,
    isLoading: false,
    userMarker: null,
    isLocated: false,
    manualCity: null,    // 用户手动选择的城市名
    _keepView: false,    // 标记：跳过 renderMarkers 中的 setFitView
    
    /**
     * 从后端获取高德配置并加载SDK
     */
    loadAmapSDK: function() {
        var self = this;
        
        return new Promise(function(resolve, reject) {
            // 如果SDK已加载，直接返回
            if (typeof AMap !== 'undefined') {
                self.isSDKLoaded = true;
                resolve();
                return;
            }
            
            // 如果正在加载中，等待加载完成
            if (self.isLoading) {
                var checkInterval = setInterval(function() {
                    if (typeof AMap !== 'undefined') {
                        clearInterval(checkInterval);
                        self.isSDKLoaded = true;
                        resolve();
                    }
                }, 100);
                return;
            }
            
            self.isLoading = true;
            
            // 从后端获取配置
            api('/config/map', { method: 'GET' })
                .then(function(res) {
                    var config = res.data;
                    if (!config || !config.jsApiKey) {
                        self.isLoading = false;
                        reject(new Error('未获取到高德地图配置'));
                        return;
                    }
                    
                    console.log('获取高德配置成功');
                    
                    // 设置安全密钥
                    if (config.securityCode) {
                        window._AMapSecurityConfig = {
                            securityJsCode: config.securityCode
                        };
                        console.log('高德安全密钥已配置');
                    }
                    
                    // 动态加载高德SDK
                    var script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.src = 'https://webapi.amap.com/maps?v=' + (config.jsVersion || '2.0') + 
                                '&key=' + config.jsApiKey + 
                                '&plugin=AMap.MarkerClusterer,AMap.Geolocation';
                    script.onload = function() {
                        self.isLoading = false;
                        if (typeof AMap !== 'undefined') {
                            self.isSDKLoaded = true;
                            console.log('✅ 高德地图SDK加载成功，版本:', AMap.version);
                            resolve();
                        } else {
                            reject(new Error('高德SDK加载失败'));
                        }
                    };
                    script.onerror = function() {
                        self.isLoading = false;
                        reject(new Error('高德SDK加载失败，请检查网络连接'));
                    };
                    document.head.appendChild(script);
                })
                .catch(function(err) {
                    self.isLoading = false;
                    reject(err);
                });
        });
    },
    
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
        
        // 先加载SDK，再创建地图
        this.loadAmapSDK()
            .then(function() {
                self.createMap(containerId, options);
            })
            .catch(function(err) {
                console.error('加载高德SDK失败:', err);
                container.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);">
                        <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
                        <div style="font-size:16px;font-weight:500;color:var(--danger);">地图加载失败</div>
                        <div style="font-size:13px;margin-top:4px;">${escapeHtml(err.message)}</div>
                        <button class="btn btn-primary btn-sm" onclick="location.reload()" style="margin-top:12px;">重试</button>
                    </div>
                `;
            });
    },
    
    /**
     * 创建地图实例
     */
    createMap: function(containerId, options) {
        var self = this;
        
        // 移除加载提示
        var loading = document.getElementById('mapLoading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // 设置默认选项
        var mapOptions = {
            zoom: options.zoom || 13,
            center: options.center || [116.397428, 39.90923], // 默认北京
            mapStyle: 'amap://styles/light',
            viewMode: '2D',
            pitch: 0,
            features: ['bg', 'road', 'building', 'point']
        };
        
        // 创建地图实例
        this.mapInstance = new AMap.Map(containerId, mapOptions);
        this.mapInstance.on('complete', function() {
            self.isInitialized = true;
            console.log('地图加载完成');
        });
        
        // 加载活动数据
        this.loadActivities();
        
        // 如果没有保存的城市，尝试 IP 定位
        if (!this.manualCity) {
            this.locateUser();
        }
    },
    
    /**
     * 定位用户并显示位置图标
     */
    locateUser: function() {
        var self = this;

        if (!this.mapInstance) {
            toast('地图尚未加载完成', 'error');
            return;
        }

        // 如果用户已手动选择城市，跳过 IP 定位
        if (this.manualCity) {
            toast('当前城市：' + this.manualCity);
            return;
        }

        // 先用 IP 快速定位
        this._fallbackIpLocate();

        // GPS 精确定位在后台尝试
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(pos) {
                    self.isLocated = true;
                    var lat = pos.coords.latitude;
                    var lng = pos.coords.longitude;
                    self.createUserMarker(lat, lng);
                    self.mapInstance.setZoomAndCenter(15, [lng, lat]);
                    toast('GPS 已精确定位');
                },
                function(err) {
                    console.log('GPS 不可用 (' + err.code + ')，使用 IP 定位');
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
            );
        }
    },

    /**
     * IP 定位兜底（不需要 HTTPS，通过高德 IP 定位）
     */
    _fallbackIpLocate: function() {
        var self = this;
        console.log('尝试 IP 定位...');

        // 从 ConfigController 已有配置中获取 key（通过已加载的 SDK 脚本参数反推）
        // 直接用高德 IP 定位 REST API，不需要额外插件
        var key = (typeof AMap !== 'undefined' && AMap._cfg && AMap._cfg.key) ? AMap._cfg.key : '';
        if (!key) {
            // 尝试从 SDK script src 中提取
            var scripts = document.querySelectorAll('script[src*="webapi.amap.com"]');
            if (scripts.length > 0) {
                var match = scripts[0].src.match(/key=([^&]+)/);
                if (match) key = match[1];
            }
        }

        if (!key) {
            console.error('无法获取高德 Key');
            toast('定位失败，请手动选择城市', 'error');
            return;
        }

        // 调用高德 IP 定位 REST API
        var url = 'https://restapi.amap.com/v3/ip?key=' + key;
        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                console.log('IP 定位结果:', data);
                if (data.status === '1' && data.rectangle) {
                    var parts = data.rectangle.split(';');
                    if (parts.length === 2) {
                        var sw = parts[0].split(',');
                        var ne = parts[1].split(',');
                        if (sw.length === 2 && ne.length === 2) {
                            var lng = (parseFloat(sw[0]) + parseFloat(ne[0])) / 2;
                            var lat = (parseFloat(sw[1]) + parseFloat(ne[1])) / 2;
                            self.mapInstance.setZoomAndCenter(14, [lng, lat]);
                            var city = data.city || data.province || '当前位置';
                            // 弹窗确认
                            if (confirm('检测到您在 ' + city + '，是否正确？\n\n点击「取消」可手动选择城市。')) {
                                toast('已定位到 ' + city);
                                self._updateCitySelector(city);
                                // 首次 IP 定位成功也记住
                                if (!localStorage.getItem('map_city')) {
                                    self._updateCitySelector(city);
                                }
                            } else {
                                toast('请在顶部工具栏选择城市', '');
                            }
                            return;
                        }
                    }
                }
                console.warn('IP 定位解析失败:', data);
                toast('IP 定位失败，请手动选择城市', 'error');
            })
            .catch(function(e) {
                console.error('IP 定位请求失败:', e);
                toast('定位失败，请手动选择城市', 'error');
            });
    },
    
    _updateCitySelector: function(city) {
        var sel = document.getElementById('citySelector');
        if (!sel || !city) return;
        // 先精确匹配
        for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].text === city) {
                sel.value = i;
                localStorage.setItem('map_city', i);
                return;
            }
        }
        // 模糊匹配（如"北京市"包含"北京"，或"杭州"被"杭州市"包含）
        for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].text.indexOf(city) !== -1 || city.indexOf(sel.options[i].text) !== -1) {
                sel.value = i;
                localStorage.setItem('map_city', i);
                return;
            }
        }
    },

    /**
     * 创建用户位置标记
     */
    createUserMarker: function(lat, lng) {
        // 如果已有用户标记，先移除
        if (this.userMarker) {
            this.mapInstance.remove(this.userMarker);
            this.userMarker = null;
        }
        
        // 创建自定义用户位置标记（使用高德API）
        this.userMarker = new AMap.Marker({
            position: new AMap.LngLat(lng, lat),
            title: '我的位置',
            // 使用高德提供的用户位置图标
            icon: new AMap.Icon({
                size: new AMap.Size(24, 34),
                image: 'https://webapi.amap.com/theme/v1.3/markers/b/mark_bs.png',
                imageSize: new AMap.Size(24, 34)
            }),
            // 或者使用高德内置样式
            // 也可以自定义样式，这里使用高德默认的位置标记
            offset: new AMap.Pixel(-12, -34),
            animation: 'AMAP_ANIMATION_BOUNCE'  // 添加弹跳动画
        });
        
        // 添加到地图
        this.mapInstance.add(this.userMarker);
        
        // 设置地图中心到用户位置
        this.mapInstance.setCenter([lng, lat]);
        
        console.log('用户位置标记已创建: ', lat, lng);
    },

    /**
     * 切换地图中心到指定城市
     */
    centerTo: function(lat, lng, zoom) {
        if (!this.mapInstance) return;
        this.mapInstance.setZoomAndCenter(zoom || 16, [lng, lat]);
        // 标记跳过 setFitView，保留手动设置的 zoom
        this._keepView = true;
        // 重新加载该区域活动
        this.loadActivities();
    },
    
    /**
     * 加载活动数据并在地图上标记
     */
    loadActivities: function() {
        var self = this;
        
        api('/map/activities', { method: 'GET' })
            .then(function(res) {
                self.allActivities = res.data || [];
                console.log('加载活动数据成功，共', self.allActivities.length, '个活动');
                self.applyFilters();
            })
            .catch(function(err) {
                console.error('加载活动数据失败:', err);
                toast('加载活动数据失败: ' + err.message, 'error');
            });
    },
    
    /**
     * 应用筛选条件并渲染
     */
    applyFilters: function() {
        var filtered = this.allActivities.filter(function(activity) {
            // 分类筛选
            if (this.currentFilters.category && activity.category !== this.currentFilters.category) {
                return false;
            }
            return true;
        }, this);
        
        this.renderMarkers(filtered);
    },
    
    /**
     * 筛选活动
     * @param {string} category - 分类
     * @param {number} distance - 距离（米）
     */
    filterActivities: function(category, distance) {
        this.currentFilters.category = category || '';
        this.currentFilters.distance = distance || 0;
        this.applyFilters();
        
        var count = this.markers ? this.markers.length : 0;
        toast(`已筛选，共 ${count} 个活动`);
    },
    
    /**
     * 渲染标记点
     */
    renderMarkers: function(activities) {
        var self = this;
        
        // 清除已有活动标记
        if (this.markers.length > 0) {
            this.mapInstance.remove(this.markers);
            this.markers = [];
        }
        
        if (!activities || activities.length === 0) {
            this.showEmptyState();
            this.updateStats(0);
            return;
        }
        
        // 创建标记点
        activities.forEach(function(activity) {
            // 检查坐标是否有效
            if (!activity.lat || !activity.lng) {
                console.warn('活动缺少坐标信息:', activity.id, activity.title);
                return;
            }
            
            // 创建自定义活动标记
            var marker = new AMap.Marker({
                position: new AMap.LngLat(activity.lng, activity.lat),
                title: activity.title,
                // 使用高德提供的标记图标，根据分类不同颜色
                icon: self.getMarkerIcon(activity.category),
                extData: activity,
                // 添加动画效果
                animation: 'AMAP_ANIMATION_DROP'
            });
            
            // 点击标记显示信息窗口
            marker.on('click', function(e) {
                var data = e.target.getExtData();
                self.showInfoWindow(data, e.target.getPosition());
            });
            
            // 鼠标悬停显示标题
            marker.on('mouseover', function(e) {
                // 可以添加悬停效果
            });
            
            self.mapInstance.add(marker);
            self.markers.push(marker);
        });
        
        console.log('渲染标记完成，共', this.markers.length, '个标记');
        
        // 如果有标记且非手动切换城市，自动调整视野
        if (!this._keepView && this.markers.length > 0) {
            // 如果已定位，同时显示用户位置和所有活动标记
            if (this.isLocated && this.userMarker) {
                // 构建视野包含所有标记和用户位置
                var allPositions = this.markers.map(function(m) {
                    return m.getPosition();
                });
                allPositions.push(this.userMarker.getPosition());
                this.mapInstance.setFitView(allPositions);
            } else {
                this.mapInstance.setFitView(this.markers);
            }
        }
        // 重置标记
        this._keepView = false;
        
        // 更新统计信息
        this.updateStats(this.markers.length);
    },
    
    /**
     * 获取分类对应的标记图标
     */
    getMarkerIcon: function(category) {
        // 分类颜色配置
        var categoryColors = {
            '运动健身': '#4ECDC4',
            '户外徒步': '#00CEC9',
            '桌游聚会': '#6C5CE7',
            '学习交流': '#A29BFE',
            '公益活动': '#00B894',
            '城市探索': '#FFD93D'
        };
        
        var color = categoryColors[category] || '#636E72';
        
        // 使用高德提供的自定义标记
        // 高德支持使用 SVG 或图片作为标记图标
        // 这里使用高德默认的标记样式，通过不同颜色区分
        return new AMap.Icon({
            size: new AMap.Size(30, 30),
            // 使用高德提供的标记图片，不同颜色可以通过不同的图片URL实现
            // 或者使用 SVG 生成带颜色的标记
            image: 'https://webapi.amap.com/theme/v1.3/markers/b/mark_b.png',
            imageSize: new AMap.Size(30, 30),
            // 如果需要自定义颜色，可以使用 SVG
            // 这里使用高德提供的标记图片，通过颜色参数区分
            // 实际上高德不支持直接修改图片颜色，但我们可以使用不同的图片
            // 或者使用 AMap.Marker 的 label 属性显示分类图标
        });
    },
    
    /**
     * 显示空状态
     */
    showEmptyState: function() {
        // 清除已有的信息窗口
        if (this.infoWindow) {
            this.infoWindow.close();
        }
        // 不显示额外的空状态窗口，因为地图本身是空的
        this.updateStats(0);
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
                        Router.navigate('/activity/' + activityId);
                    } else {
                        window.location.href = '#/activity/' + activityId;
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
                    style="width:100%;padding:6px 12px;font-size:13px;cursor:pointer;border:none;border-radius:4px;background:var(--primary);color:#fff;">
                查看详情 →
            </button>
        </div>
        `;
    },
    
    /**
     * 更新统计信息
     */
    updateStats: function(count) {
        var statsEl = document.getElementById('mapStats');
        if (statsEl) {
            var total = this.allActivities ? this.allActivities.length : 0;
            var shown = count !== undefined ? count : (this.markers ? this.markers.length : 0);
            var locationStatus = this.isLocated ? '📍 已定位' : '📍 未定位';
            if (total > 0 && shown < total) {
                statsEl.textContent = `${locationStatus} | 共 ${total} 个活动，当前显示 ${shown} 个`;
            } else if (shown > 0) {
                statsEl.textContent = `${locationStatus} | 共 ${shown} 个活动`;
            } else {
                statsEl.textContent = `${locationStatus} | 暂无活动可显示`;
            }
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
        this.userMarker = null;
        this.infoWindow = null;
        this.isInitialized = false;
        this.isLocated = false;
        this._keepView = false;
        this.allActivities = [];
        this.isSDKLoaded = false;
        this.isLoading = false;
        this.currentFilters = {
            category: '',
            distance: 0
        };
    }
};