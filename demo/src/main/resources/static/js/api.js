// ====== 趣聚 API 封装层 ======
// 本文件为全局基础库，所有页面模块都会用到
// 每个业务模块可以在此文件末尾追加自己的API快捷方法

const BASE = '';

// ---------- Token 管理 ----------
function getToken()    { return localStorage.getItem('token'); }
function setToken(t)   { localStorage.setItem('token', t); }
function clearToken()  { localStorage.removeItem('token'); localStorage.removeItem('user'); }
function getCurUser()  { try { return JSON.parse(localStorage.getItem('user')); } catch(e) { return null; } }
function setCurUser(u) { localStorage.setItem('user', JSON.stringify(u)); }

// ---------- HTTP 请求 ----------
async function api(path, options = {}) {
    const token = getToken();
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(BASE + path, {
        ...options,
        headers,
        body: options.body instanceof FormData ? options.body
             : options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await res.json();
    if (!res.ok && data.code !== 200) {
        if (data.code === 401) { clearToken(); Router.navigate('/login'); }
        throw { code: data.code || res.status, message: data.message || '请求失败' };
    }
    return data;
}

// ---------- Toast ----------
function toast(msg, type) {
    type = type || 'success';
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }, 2500);
}

// ---------- 快捷API（业务方可在此区域追加） ----------
var AuthAPI = {
    login:    function(body) { return api('/auth/login',    { method:'POST', body: body }); },
    register: function(body) { return api('/auth/register', { method:'POST', body: body }); }
};

var UserAPI = {
    profile:  function()     { return api('/users/me'); },
    update:   function(body) { return api('/users/me', { method:'PUT', body: body }); }
};

var UploadAPI = {
    upload:   function(file, type) {
        var fd = new FormData();
        fd.append('file', file);
        fd.append('type', type);
        return api('/upload', { method:'POST', body: fd });
    }
};

// ===== 以下由各模块开发者按需追加 =====
var ActivityAPI = {
    create: function(body) { return api('/activities', { method: 'POST', body: body }); }
};
// var FriendAPI   = { ... };

// ===== 即时通讯模块 (P7) =====
var MessageAPI = {
    conversations: function () {
        return api('/messages/conversations');
    },
    messages: function (conversationId, page, size) {
        var params = '?page=' + (page || 1) + '&size=' + (size || 20);
        return api('/messages/conversations/' + conversationId + params);
    },
    send: function (targetUserId, content) {
        return api('/messages', {
            method: 'POST',
            body: { targetUserId: targetUserId, content: content }
        });
    },
    markRead: function (conversationId) {
        return api('/messages/conversations/' + conversationId + '/read', {
            method: 'PUT'
        });
    },
    newMessages: function (conversationId, since) {
        return api('/messages/conversations/' + conversationId + '/new?since=' + encodeURIComponent(since));
    }
};

// ===== 关注与发现模块 (P9) =====
var FollowAPI = {
    follow:      function(userId) { return api('/follow', { method:'POST', body:{ userId: userId } }); },
    unfollow:    function(userId) { return api('/follow/' + userId, { method:'DELETE' }); },
    following:   function()       { return api('/follow/following'); },
    followers:   function()       { return api('/follow/followers'); },
    search:      function(nickname) { return api('/users/search?nickname=' + encodeURIComponent(nickname)); },
    recommended: function(limit)  { return api('/users/recommended?limit=' + (limit || 10)); }
};
