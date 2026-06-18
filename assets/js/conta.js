/* ÓTICAS RELUX — Minha Conta (Supabase Auth) */
(function () {
  "use strict";
  var A = window.RELUX_AUTH;
  function el(id) { return document.getElementById(id); }
  function v(id)  { return (el(id) && el(id).value || "").trim(); }
  function onlyDigits(s) { return (s || "").replace(/\D/g, ""); }

  function showError(msg) {
    var e = el("authError"); if (!e) return;
    e.textContent = msg || ""; e.classList.toggle("show", !!msg);
  }
  function showSuccess(msg) {
    var e = el("authSuccess"); if (!e) return;
    e.textContent = msg || ""; e.classList.toggle("show", !!msg);
    if (msg) setTimeout(function() { e.classList.remove("show"); }, 3000);
  }

  /* destino após login */
  function nextUrl() {
    var m = /[?&]next=([^&]+)/.exec(location.search);
    var nx = m ? decodeURIComponent(m[1]) : "";
    return /^[\w.\-]+\.html(\?[\w%=&.\-]*)?$/.test(nx) ? nx : "";
  }
  function goNext() { var nx = nextUrl(); if (nx) { location.href = nx; return true; } return false; }

  /* máscaras */
  function maskTel(input) {
    if (!input) return;
    input.addEventListener("input", function() {
      var d = onlyDigits(input.value).slice(0, 11);
      input.value = d.length <= 10
        ? d.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, function(_, a, b, c) { return (a ? "(" + a + ") " : "") + b + (c ? "-" + c : ""); }).trim()
        : d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    });
  }
  function maskCpf(input) {
    if (!input) return;
    input.addEventListener("input", function() {
      input.value = onlyDigits(input.value).slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    });
  }

  /* status label */
  var STATUS_LABEL = {
    aguardando_pagamento: "Ag. pagamento",
    pago:     "Pago",
    em_preparo: "Em preparação",
    enviado:  "Enviado",
    entregue: "Entregue",
    cancelado: "Cancelado",
    pendente:  "Pendente",
  };
  var STATUS_CLS = {
    pago: "ok", enviado: "ok", entregue: "ok",
    aguardando_pagamento: "pend", pendente: "pend",
    cancelado: "err",
  };

  function fmtDate(d) {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function fmtBRL(n) {
    return "R$ " + Number(n || 0).toFixed(2).replace(".", ",");
  }

  /* ── renderizar pedidos ── */
  function renderOrders() {
    var box = el("acctOrders"); if (!box) return;
    box.innerHTML = '<p style="color:var(--muted);font-size:.85rem">Carregando pedidos…</p>';
    A.getOrders().then(function(orders) {
      if (!orders.length) {
        box.innerHTML = '<p class="acct-empty">Você ainda não fez pedidos. <a href="catalogo.html">Comece agora →</a></p>';
        return;
      }
      box.innerHTML = orders.map(function(o) {
        var st  = STATUS_LABEL[o.status] || o.status || "Recebido";
        var cls = STATUS_CLS[o.status] || "pend";
        var its = Array.isArray(o.items) ? o.items.length : 0;
        var isPending = o.status === "aguardando_pagamento" || o.status === "pendente";
        var cancelBtn = isPending
          ? '<button class="order-cancel-btn" data-num="' + o.numero + '" ' +
              'style="font-size:.73rem;color:#ef4444;background:none;border:none;cursor:pointer;padding:0;margin-top:2px">Cancelar pedido</button>'
          : '';
        return '<div class="order-row">' +
          '<div>' +
            '<strong>' + o.numero + '</strong>' +
            '<span>' + fmtDate(o.created_at) + ' · ' + its + ' item(ns)' +
              (o.tracking_code ? ' · 🚚 ' + o.tracking_code : '') +
            '</span>' +
            cancelBtn +
          '</div>' +
          '<div class="order-right">' +
            '<span class="order-status ' + cls + '">' + st + '</span>' +
            '<b>' + fmtBRL(o.total) + '</b>' +
            '<a href="pedido.html?numero=' + encodeURIComponent(o.numero) + '" ' +
               'style="font-size:.78rem;color:var(--gold-deep);text-decoration:none">Rastrear →</a>' +
          '</div>' +
        '</div>';
      }).join("");

      /* delegação: cancelar pedido */
      box.addEventListener("click", function(e) {
        var btn = e.target.closest(".order-cancel-btn");
        if (!btn) return;
        var num = btn.getAttribute("data-num");
        if (!confirm("Cancelar o pedido " + num + "?")) return;
        btn.disabled = true; btn.textContent = "Cancelando…";
        fetch("/api/pedido", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numero: num, status: "cancelado" })
        }).then(function() { renderOrders(); })
          .catch(function() { btn.disabled = false; btn.textContent = "Cancelar pedido"; });
      });
    });
  }

  /* ── views ── */
  function showAccount(u) {
    el("authView").hidden    = true;
    el("accountView").hidden = false;
    el("acctAvatar").textContent = (u.name || u.email || "R").charAt(0).toUpperCase();
    el("acctGreeting").textContent = "Olá, " + (u.name ? u.name.split(" ")[0] : u.email.split("@")[0]) + "!";
    el("acctEmail").textContent = u.email;
    if (el("pName"))  el("pName").value  = u.name  || "";
    if (el("pPhone")) el("pPhone").value = u.phone || "";
    if (el("pCpf"))   el("pCpf").value   = u.cpf   || "";
    renderOrders();
  }
  function showAuth() { el("authView").hidden = false; el("accountView").hidden = true; }

  /* ── setando botões disabled durante req ── */
  function setBusy(formEl, busy) {
    var btn = formEl && formEl.querySelector("button[type=submit]");
    if (btn) btn.disabled = busy;
  }

  /* ── init ── */
  function init() {
    if (!A) { console.error("RELUX_AUTH não carregado"); return; }

    A.onReady(function(u) {
      if (u) { if (goNext()) return; showAccount(u); } else showAuth();
    });

    /* aviso de checkout */
    if (nextUrl() && el("authSubtitle")) {
      el("authSubtitle").textContent = "Entre ou crie sua conta para finalizar a compra.";
    }

    /* tabs */
    if (el("tabLogin"))    el("tabLogin").addEventListener("click",    function() { swap("login"); });
    if (el("tabRegister")) el("tabRegister").addEventListener("click", function() { swap("register"); });
    function swap(which) {
      var isLogin = which === "login";
      el("tabLogin").classList.toggle("active", isLogin);
      el("tabRegister").classList.toggle("active", !isLogin);
      el("loginForm").hidden    = !isLogin;
      el("registerForm").hidden = isLogin;
      var title = document.querySelector(".auth-title");
      if (title) title.textContent = isLogin ? "Bem-vindo(a) de volta" : "Crie sua conta";
      showError("");
    }

    maskTel(el("rPhone")); maskTel(el("pPhone")); maskCpf(el("pCpf"));

    /* login */
    el("loginForm") && el("loginForm").addEventListener("submit", function(e) {
      e.preventDefault(); showError("");
      setBusy(this, true);
      A.login(v("lEmail"), v("lPass")).then(function(r) {
        setBusy(el("loginForm"), false);
        if (!r.ok) return showError(r.error);
        if (goNext()) return;
        showAccount(r.user);
      }).catch(function() { setBusy(el("loginForm"), false); showError("Erro de conexão."); });
    });

    /* cadastro */
    el("registerForm") && el("registerForm").addEventListener("submit", function(e) {
      e.preventDefault(); showError("");
      setBusy(this, true);
      A.register({ name: v("rName"), email: v("rEmail"), phone: v("rPhone"), pass: v("rPass") }).then(function(r) {
        setBusy(el("registerForm"), false);
        if (!r.ok) return showError(r.error);
        if (r.confirm) {
          showError(""); showSuccess("Conta criada! Verifique seu e-mail para ativar.");
          return;
        }
        if (goNext()) return;
        showAccount(r.user);
      }).catch(function() { setBusy(el("registerForm"), false); showError("Erro de conexão."); });
    });

    /* perfil */
    el("profileForm") && el("profileForm").addEventListener("submit", function(e) {
      e.preventDefault();
      A.update({ name: v("pName"), phone: v("pPhone"), cpf: v("pCpf") }).then(function(r) {
        if (r.ok) {
          var s = el("acctSaved"); if (s) { s.classList.add("show"); setTimeout(function() { s.classList.remove("show"); }, 2000); }
        }
      });
    });

    /* sair */
    el("logoutBtn") && el("logoutBtn").addEventListener("click", function() {
      A.logout().then(function() { showAuth(); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
