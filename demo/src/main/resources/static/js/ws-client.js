// ====== 趣聚 WebSocket 客户端（STOMP over SockJS） ======
// 用法：WsClient.connect() → WsClient.subscribe(dest, callback)
// 依赖：sockjs.min.js, stomp.umd.min.js（index.html CDN 引入）

var WsClient = {
    _stompClient: null,
    _connected: false,
    _connecting: false,
    _subscriptions: {},
    _pendingSubs: [],
    _reconnectTimer: null,
    _reconnectDelay: 3000,
    _maxReconnectDelay: 30000,
    _onStatusChange: null,  // callback(connected)

    /** 获取 STOMP 库引用（兼容 v5/v7） */
    _getStomp: function () {
        if (typeof Stomp !== 'undefined') return Stomp;
        if (typeof StompJs !== 'undefined' && StompJs.Stomp) return StompJs.Stomp;
        console.error('[WsClient] STOMP 库未加载，请检查 CDN');
        return null;
    },

    connect: function () {
        var self = this;
        var token = getToken();
        if (!token) return;
        if (self._connected || self._connecting) return;

        var StompLib = self._getStomp();
        if (!StompLib) return;

        self._connecting = true;
        console.log('[WsClient] 连接中...');

        try {
            var socket = new SockJS('/ws?token=' + encodeURIComponent(token));
            self._stompClient = StompLib.over(socket);
            self._stompClient.debug = null;

            self._stompClient.connect({},
                function () {
                    self._connected = true;
                    self._connecting = false;
                    self._reconnectDelay = 3000;
                    console.log('[WsClient] 已连接');

                    for (var i = 0; i < self._pendingSubs.length; i++) {
                        var ps = self._pendingSubs[i];
                        self._doSubscribe(ps.dest, ps.cb);
                    }
                    self._pendingSubs = [];

                    if (self._onStatusChange) self._onStatusChange(true);
                },
                function (err) {
                    self._connected = false;
                    self._connecting = false;
                    console.log('[WsClient] 断开: ' + (err || '连接失败'));
                    if (self._onStatusChange) self._onStatusChange(false);
                    self._scheduleReconnect();
                }
            );
        } catch (e) {
            self._connecting = false;
            console.error('[WsClient] 连接异常:', e);
            self._scheduleReconnect();
        }
    },

    _doSubscribe: function (dest, cb) {
        var self = this;
        try {
            var sub = self._stompClient.subscribe(dest, function (msg) {
                try {
                    var body = JSON.parse(msg.body);
                    cb(body);
                } catch (e) {
                    cb(msg.body);
                }
            });
            self._subscriptions[dest] = sub;
        } catch (e) {
            console.error('[WsClient] 订阅失败: ' + dest, e);
        }
    },

    subscribe: function (dest, cb) {
        var self = this;
        if (self._connected) {
            self._doSubscribe(dest, cb);
        } else {
            self._pendingSubs.push({ dest: dest, cb: cb });
            if (!self._connecting) self.connect();
        }
    },

    unsubscribe: function (dest) {
        var sub = this._subscriptions[dest];
        if (sub) {
            try { sub.unsubscribe(); } catch (e) {}
            delete this._subscriptions[dest];
        }
    },

    _scheduleReconnect: function () {
        var self = this;
        if (self._reconnectTimer) return;
        self._reconnectTimer = setTimeout(function () {
            self._reconnectTimer = null;
            self.connect();
            self._reconnectDelay = Math.min(self._reconnectDelay * 2, self._maxReconnectDelay);
        }, self._reconnectDelay);
    },

    disconnect: function () {
        var self = this;
        if (self._reconnectTimer) { clearTimeout(self._reconnectTimer); self._reconnectTimer = null; }
        self._connected = false;
        self._connecting = false;
        self._pendingSubs = [];
        self._subscriptions = {};
        if (self._onStatusChange) self._onStatusChange(false);
        if (self._stompClient) {
            try { self._stompClient.disconnect(); } catch (e) {}
            self._stompClient = null;
        }
        console.log('[WsClient] 已断开');
    },

    isConnected: function () {
        return this._connected;
    }
};
