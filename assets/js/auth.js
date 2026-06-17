/* ÓTICAS RELUX — Autenticação via Supabase Auth (sem SDK externo) */
(function () {
  "use strict";

  var SB_URL  = "https://joktfcfcssxhhyiuxwer.supabase.co";
  var SB_ANON = "sb_publishable_vxUtkkhNJ8Z_U_4EkuTutg_HY-pB-Gj";
  var SESSION_KEY = "relux-sb-session";

  var _session = null; // { access_token, refresh_token, user }
  var _profile  = null;
  var _ready    = false;
  var _readyCbs = [];

  /* ── storage ── */
  function readSession()    { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e) { return null; } }
  function saveSession(s)   { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch(e) {} }
  function clearSession()   { try { localStorage.removeItem(SESSION_KEY); } catch(e) {} }

  /* ── fetch helper ── */
  function sbFetch(path, method, body, token) {
    var headers = { "Content-Type": "application/json", apikey: SB_ANON };
    if (token) headers["Authorization"] = "Bearer " + token;
    var opts = { method: method || "GET", headers: headers };
    if (body) opts.body = JSON.stringify(body);
    return fetch(SB_URL + path, opts).then(function(r) {
      return r.text().then(function(t) {
        var d; try { d = JSON.parse(t); } catch(e) { d = t; }
        return { ok: r.ok, status: r.status, data: d };
      });
    });
  }

  /* ── perfil público ── */
  function pub(u, p) {
    if (!u) return null;
    var meta = u.user_metadata || {};
    return {
      id:    u.id,
      email: u.email,
      name:  (p && p.name)  || meta.name  || "",
      phone: (p && p.phone) || meta.phone || "",
      cpf:   (p && p.cpf)   || "",
    };
  }

  /* ── carregar perfil da tabela profiles ── */
  function loadProfile(token, userId) {
    return sbFetch("/rest/v1/profiles?id=eq." + userId + "&select=*", "GET", null, token)
      .then(function(r) {
        _profile = (r.ok && Array.isArray(r.data) && r.data[0]) || null;
        return _profile;
      }).catch(function() { _profile = null; });
  }

  /* ── garantir que o perfil existe ── */
  function ensureProfile(token, user) {
    if (!token || !user) return Promise.resolve();
    return loadProfile(token, user.id).then(function(p) {
      if (!p) {
        var meta = user.user_metadata || {};
        return sbFetch("/rest/v1/profiles", "POST",
          { id: user.id, name: meta.name || "", phone: meta.phone || "" }, token);
      }
    });
  }

  /* ── setReady: dispara callbacks e renderiza navbar ── */
  function setReady() {
    _ready = true;
    var u = pub(_session && _session.user, _profile);
    _readyCbs.forEach(function(fn) { try { fn(u); } catch(e) {} });
    _readyCbs = [];
    render();
    /* notifica store.js para sincronizar favoritos/carrinho */
    try { document.dispatchEvent(new CustomEvent("relux:auth", { detail: u })); } catch(e) {}
  }

  /* ── render navbar ── */
  function render() {
    var btn = document.getElementById("accountBtn"); if (!btn) return;
    var u   = pub(_session && _session.user, _profile);
    var nameEl = document.getElementById("acctName");
    btn.classList.toggle("logged", !!u);
    if (nameEl) nameEl.textContent = u ? (u.name.split(" ")[0] || u.email.split("@")[0]) : "";
    btn.setAttribute("aria-label", u ? "Minha conta — " + (u.name || u.email) : "Entrar ou criar conta");
  }

  /* ── inicialização: valida sessão salva ── */
  function init() {
    var saved = readSession();
    if (!saved || !saved.access_token) { setReady(); return; }

    sbFetch("/auth/v1/user", "GET", null, saved.access_token).then(function(r) {
      if (r.ok) {
        _session = Object.assign({}, saved, { user: r.data });
        saveSession(_session);
        ensureProfile(saved.access_token, r.data).then(setReady);
      } else if (saved.refresh_token) {
        /* token expirado — tenta renovar */
        sbFetch("/auth/v1/token?grant_type=refresh_token", "POST",
          { refresh_token: saved.refresh_token }).then(function(rr) {
          if (rr.ok && rr.data.access_token) {
            _session = rr.data; saveSession(_session);
            ensureProfile(rr.data.access_token, rr.data.user).then(setReady);
          } else { clearSession(); setReady(); }
        }).catch(function() { clearSession(); setReady(); });
      } else { clearSession(); setReady(); }
    }).catch(function() { clearSession(); setReady(); });
  }

  /* ═══════════════════════════════════════════
     API PÚBLICA — window.RELUX_AUTH
  ═══════════════════════════════════════════ */
  window.RELUX_AUTH = {

    current: function() { return pub(_session && _session.user, _profile); },

    token: function() { return _session ? _session.access_token : null; },

    onReady: function(fn) {
      if (_ready) { try { fn(pub(_session && _session.user, _profile)); } catch(e) {} }
      else _readyCbs.push(fn);
    },

    /* ── Cadastro ── */
    register: function(d) {
      if (!d.name || !d.email || !d.pass) return Promise.resolve({ ok: false, error: "Preencha todos os campos." });
      if (d.pass.length < 6) return Promise.resolve({ ok: false, error: "A senha precisa de ao menos 6 caracteres." });
      return sbFetch("/auth/v1/signup", "POST", {
        email: d.email.trim().toLowerCase(),
        password: d.pass,
        data: { name: d.name.trim(), phone: d.phone || "" },
      }).then(function(r) {
        if (!r.ok) {
          var msg = (r.data && (r.data.msg || r.data.message || r.data.error)) || "Erro ao criar conta.";
          if (/already/i.test(msg)) msg = "Já existe uma conta com esse e-mail.";
          return { ok: false, error: msg };
        }
        /* Supabase pode exigir confirmação de e-mail — tenta login direto */
        return window.RELUX_AUTH.login(d.email, d.pass).then(function(res) {
          if (!res.ok) return { ok: true, confirm: true }; /* cadastrado mas precisa confirmar e-mail */
          return res;
        });
      });
    },

    /* ── Login ── */
    login: function(email, pass) {
      return sbFetch("/auth/v1/token?grant_type=password", "POST",
        { email: (email || "").trim().toLowerCase(), password: pass }
      ).then(function(r) {
        if (!r.ok) return { ok: false, error: "E-mail ou senha incorretos." };
        _session = r.data; saveSession(_session);
        return ensureProfile(_session.access_token, _session.user).then(function() {
          render();
          try { document.dispatchEvent(new CustomEvent("relux:auth", { detail: pub(_session.user, _profile) })); } catch(e) {}
          return { ok: true, user: pub(_session.user, _profile) };
        });
      });
    },

    /* ── Logout ── */
    logout: function() {
      var token = _session && _session.access_token;
      _session = null; _profile = null; clearSession();
      render();
      try { document.dispatchEvent(new CustomEvent("relux:auth", { detail: null })); } catch(e) {}
      if (token) sbFetch("/auth/v1/logout", "POST", {}, token).catch(function(){});
      return Promise.resolve({ ok: true });
    },

    /* ── Atualizar perfil ── */
    update: function(d) {
      if (!_session) return Promise.resolve({ ok: false, error: "Não autenticado." });
      var updates = { updated_at: new Date().toISOString() };
      if (d.name  !== undefined) updates.name  = d.name;
      if (d.phone !== undefined) updates.phone = d.phone;
      if (d.cpf   !== undefined) updates.cpf   = d.cpf;
      return sbFetch("/rest/v1/profiles?id=eq." + _session.user.id, "PATCH",
        updates, _session.access_token
      ).then(function(r) {
        if (r.ok) { _profile = Object.assign(_profile || {}, updates); render(); return { ok: true }; }
        return { ok: false, error: "Erro ao salvar." };
      });
    },

    /* ── Buscar pedidos do usuário ── */
    getOrders: function() {
      if (!_session) return Promise.resolve([]);
      return sbFetch(
        "/rest/v1/pedidos?user_id=eq." + _session.user.id +
        "&select=numero,status,created_at,total,items,shipping_method,tracking_code&order=created_at.desc&limit=50",
        "GET", null, _session.access_token
      ).then(function(r) { return (r.ok && Array.isArray(r.data)) ? r.data : []; })
       .catch(function() { return []; });
    },

    /* ── Favoritos: carregar do Supabase ── */
    getFavoritos: function() {
      if (!_session) return Promise.resolve([]);
      return sbFetch(
        "/rest/v1/favoritos?user_id=eq." + _session.user.id + "&select=product_id",
        "GET", null, _session.access_token
      ).then(function(r) {
        return (r.ok && Array.isArray(r.data)) ? r.data.map(function(f) { return f.product_id; }) : [];
      }).catch(function() { return []; });
    },

    /* ── Favoritos: adicionar ── */
    addFavorito: function(productId) {
      if (!_session) return Promise.resolve();
      return sbFetch("/rest/v1/favoritos", "POST",
        { user_id: _session.user.id, product_id: productId },
        _session.access_token
      ).catch(function(){});
    },

    /* ── Favoritos: remover ── */
    removeFavorito: function(productId) {
      if (!_session) return Promise.resolve();
      return sbFetch(
        "/rest/v1/favoritos?user_id=eq." + _session.user.id + "&product_id=eq." + encodeURIComponent(productId),
        "DELETE", null, _session.access_token
      ).catch(function(){});
    },

    render: render,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
