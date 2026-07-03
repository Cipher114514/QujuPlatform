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

    const text = await res.text();
    var data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        data = { code: res.status, message: text || '服务器无响应' };
    }
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

// ---------- 校验工具 ----------
var EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
function isEmail(str) {
    return EMAIL_REGEX.test(str);
}
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
    create: function(body) { return api('/activities', { method: 'POST', body: body }); },
    list:   function(params) {
        var qs = Object.keys(params).filter(function(k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; })
            .map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
        return api('/activities' + (qs ? '?' + qs : ''));
    }
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

// ===== 兴趣小队模块 (P5) =====
var TeamAPI = {
    create:        function(body) { return api('/teams', { method:'POST', body: body }); },
    list:          function(params) {
        var qs = Object.keys(params).filter(function(k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; })
            .map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
        return api('/teams' + (qs ? '?' + qs : ''));
    },
    detail:        function(id) { return api('/teams/' + id); },
    join:          function(id, message) { return api('/teams/' + id + '/join', { method:'POST', body:{ message: message } }); },
    leave:         function(id) { return api('/teams/' + id + '/leave', { method:'DELETE' }); },
    members:       function(id) { return api('/teams/' + id + '/members'); },
    pendingRequests: function(id) { return api('/teams/' + id + '/requests/pending'); },
    handleRequest: function(id, requestId, action) {
        return api('/teams/' + id + '/requests/' + requestId, { method:'POST', body:{ action: action } });
    },
    myTeams:       function() { return api('/teams/me/list'); },
    // 相册
    album:         function(id) { return api('/teams/' + id + '/album'); },
    uploadPhoto:   function(id, imageUrl, description) { return api('/teams/' + id + '/album', { method:'POST', body:{ imageUrl: imageUrl, description: description } }); },
    deletePhoto:   function(id, photoId) { return api('/teams/' + id + '/album/' + photoId, { method:'DELETE' }); },
    // 解散
    disband:       function(id) { return api('/teams/' + id + '/disband', { method:'POST' }); }
};

// ===== 活动评价与复盘模块 (P1) =====
var ReviewAPI = {
    create:   function(activityId, body) { return api('/activities/' + activityId + '/review', { method:'POST', body: body }); },
    list:     function(activityId, page, size) { return api('/activities/' + activityId + '/reviews?page=' + (page||0) + '&size=' + (size||10)); },
    avg:      function(activityId) { return api('/activities/' + activityId + '/review/avg'); },
    retrospect: function(activityId) { return api('/activities/' + activityId + '/retrospect'); },
    galleryList: function(activityId, page, size) { return api('/activities/' + activityId + '/retrospect/gallery?page=' + (page||0) + '&size=' + (size||12)); },
    galleryAdd:  function(activityId, body) { return api('/activities/' + activityId + '/retrospect/gallery', { method:'POST', body: body }); },
    galleryDel:  function(activityId, galleryId) { return api('/activities/' + activityId + '/retrospect/gallery/' + galleryId, { method:'DELETE' }); },
    retrospectDetails: function(activityId) { return api('/activities/' + activityId + '/retrospect/details'); }
};
