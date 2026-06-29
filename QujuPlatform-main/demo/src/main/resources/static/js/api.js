// ====== Quju API wrapper ======

const BASE = '';

function getToken()    { return localStorage.getItem('token'); }
function setToken(t)   { localStorage.setItem('token', t); }
function clearToken()  { localStorage.removeItem('token'); localStorage.removeItem('user'); }
function getCurUser()  { try { return JSON.parse(localStorage.getItem('user')); } catch(e) { return null; } }
function setCurUser(u) { localStorage.setItem('user', JSON.stringify(u)); }

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

function toast(msg, type) {
    type = type || 'success';
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }, 2500);
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
    upload: function(file, type) {
        var fd = new FormData();
        fd.append('file', file);
        fd.append('type', type);
        return api('/upload', { method:'POST', body: fd });
    }
};

var ActivityAPI = {
    list: function(params) {
        var query = new URLSearchParams();
        params = params || {};
        Object.keys(params).forEach(function(key) {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                query.append(key, params[key]);
            }
        });
        var qs = query.toString();
        return api('/activities' + (qs ? '?' + qs : ''));
    }
};
