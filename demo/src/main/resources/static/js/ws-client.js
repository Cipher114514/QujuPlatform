// ====== 趣聚 WebSocket 客户端（STOMP over SockJS） ======
// 用法：WsClient.connect() → WsClient.subscribe(dest, callback) → WsClient.disconnect()
// 依赖：sockjs.min.js, stomp.min.js（通过 index.html 的 CDN 引入）

var WsClient = {
    _stompClient: null,
    _connected: false,
    _connecting: false,
    _subscriptions: {},
    _pendingSubs: [],      // connect 完成前暂存的订阅
    _heartbeatTimer: null,
    _reconnectTimer: null,
    _reconnectDelay: 3000,

    /** 连接到 WebSocket */
    connect: function () {
        var self = this;
        var token = getToken();
        if (!token) {
            console.log('[WsClient] 无 token，跳过连接');
            return;
        }
        if (self._connected || self._connecting) return;

        self._connecting = true;
        console.log('[WsClient] 连接中...');

        var socket = new SockJS('/ws?token=' + encodeURIComponent(token));
        self._stompClient = Stomp.over(socket);
        self._stompClient.debug = null; // 关闭 STOMP 调试日志

        self._stompClient.connect({},
            function () {
                self._connected = true;
                self._connecting = false;
                console.log('[WsClient] 已连接');

                // 处理 connect 前暂存的订阅
                for (var i = 0; i < self._pendingSubs.length; i++) {
                    var ps = self._pendingSubs[i];
                    self._doSubscribe(ps.dest, ps.cb);
                }
                self._pendingSubs = [];

                // 心跳
                if (self._heartbeatTimer) clearInterval(self._heartbeatTimer);
                self._heartbeatTimer = setInterval(function () {
                    if (self._connected) {
                        self._stompClient.send('/app/heartbeat', {}, '{}');
                    }
                }, 30000);
            },
            function (err) {
                self._connected = false;
                self._connecting = false;
                console.log('[WsClient] 连接断开，3秒后重连...');
                self._scheduleReconnect();
            }
        );
    },

    _doSubscribe: function (dest, cb) {
        var self = this;
        var sub = self._stompClient.subscribe(dest, function (msg) {
            try {
                var body = JSON.parse(msg.body);
                cb(body);
            } catch (e) {
                cb(msg.body);
            }
        });
        self._subscriptions[dest] = sub;
    },

    /** 订阅目标（连接中则暂存，已连接则立即订阅） */
    subscribe: function (dest, cb) {
        var self = this;
        if (self._connected) {
            self._doSubscribe(dest, cb);
        } else {
            self._pendingSubs.push({ dest: dest, cb: cb });
            if (!self._connecting) self.connect();
        }
    },

    /** 取消订阅 */
    unsubscribe: function (dest) {
        var sub = this._subscriptions[dest];
        if (sub) {
            sub.unsubscribe();
            delete this._subscriptions[dest];
        }
    },

    _scheduleReconnect: function () {
        var self = this;
        if (self._reconnectTimer) return;
        self._reconnectTimer = setTimeout(function () {
            self._reconnectTimer = null;
            self.connect();
        }, self._reconnectDelay);
    },

    /** 断开连接 */
    disconnect: function () {
        var self = this;
        if (self._heartbeatTimer) { clearInterval(self._heartbeatTimer); self._heartbeatTimer = null; }
        if (self._reconnectTimer) { clearTimeout(self._reconnectTimer); self._reconnectTimer = null; }
        self._connected = false;
        self._connecting = false;
        self._pendingSubs = [];
        self._subscriptions = {};
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
