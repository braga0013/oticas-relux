/* ÓTICAS RELUX — página Minha Conta (login / cadastro / painel) */
(function () {
  "use strict";
  var A = window.RELUX_AUTH;
  function el(id) { return document.getElementById(id); }
  function v(id) { return (el(id) && el(id).value || "").trim(); }
  function onlyDigits(s) { return (s || "").replace(/\D/g, ""); }

  function showError(msg) { var e = el("authError"); if (!e) return; e.textContent = msg || ""; e.classList.toggle("show", !!msg); }

  /* destino após login (ex.: ?next=checkout.html) — só caminhos internos */
  function nextUrl() {
    var m = /[?&]next=([^&]+)/.exec(location.search);
    var nx = m ? decodeURIComponent(m[1]) : "";
    return /^[\w.\-]+\.html(\?[\w%=&.\-]*)?$/.test(nx) ? nx : "";
  }
  function goNext() { var nx = nextUrl(); if (nx) { location.href = nx; return true; } return false; }

  function maskTel(input) {
    if (!input) return;
    input.addEventListener("input", function () {
      var d = onlyDigits(input.value).slice(0, 11);
      input.value = d.length <= 10
        ? d.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, function (_, a, b, c) { return (a ? "(" + a + ") " : "") + b + (c ? "-" + c : ""); }).trim()
        : d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    });
  }
  function maskCpf(input) {
    if (!input) return;
    input.addEventListener("input", function () {
      input.value = onlyDigits(input.value).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    });
  }

  /* ---------- pedidos ---------- */
  function ordersOf(email) {
    var all; try { all = JSON.parse(localStorage.getItem("relux-orders")) || []; } catch (e) { all = []; }
    return all.filter(function (o) { return o.email === email; }).reverse();
  }
  function renderOrders(email) {
    var box = el("acctOrders"); if (!box) return;
    var list = ordersOf(email);
    if (!list.length) { box.innerHTML = '<p class="acct-empty">Você ainda não fez pedidos. <a href="catalogo.html">Comece agora →</a></p>'; return; }
    box.innerHTML = list.map(function (o) {
      var st = { aprovado: "Aprovado", pendente: "Pendente", enviado: "Enviado" }[o.status] || o.status || "Recebido";
      return '<div class="order-row"><div><strong>' + o.num + "</strong><span>" + (o.date || "") + " · " + (o.qtd || 0) + " item(ns)</span></div>" +
        '<div class="order-right"><span class="order-status">' + st + "</span><b>" + (o.total || "") + "</b></div></div>";
    }).join("");
  }

  /* ---------- views ---------- */
  function showAccount(u) {
    el("authView").hidden = true;
    el("accountView").hidden = false;
    el("acctAvatar").textContent = (u.name || "R").charAt(0).toUpperCase();
    el("acctGreeting").textContent = "Olá, " + (u.name.split(" ")[0]) + "!";
    el("acctEmail").textContent = u.email;
    el("pName").value = u.name || "";
    el("pPhone").value = u.phone || "";
    el("pCpf").value = u.cpf || "";
    renderOrders(u.email);
  }
  function showAuth() { el("authView").hidden = false; el("accountView").hidden = true; }

  function init() {
    var cur = A && A.current();
    if (cur) { if (goNext()) return; showAccount(cur); } else showAuth();

    // contexto: veio do checkout precisando logar
    if (nextUrl() && el("authSubtitle")) {
      el("authSubtitle").textContent = "Entre ou crie sua conta para finalizar a compra com seus dados corretos.";
    }

    // tabs
    el("tabLogin").addEventListener("click", function () { swap("login"); });
    el("tabRegister").addEventListener("click", function () { swap("register"); });
    function swap(which) {
      var login = which === "login";
      el("tabLogin").classList.toggle("active", login);
      el("tabRegister").classList.toggle("active", !login);
      el("loginForm").hidden = !login;
      el("registerForm").hidden = login;
      document.querySelector(".auth-title").textContent = login ? "Bem-vindo(a) de volta" : "Crie sua conta";
      showError("");
    }

    maskTel(el("rPhone")); maskTel(el("pPhone")); maskCpf(el("pCpf"));

    // login
    el("loginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var r = A.login(v("lEmail"), v("lPass"));
      if (!r.ok) return showError(r.error);
      if (goNext()) return;
      showAccount(r.user);
    });
    // cadastro
    el("registerForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var r = A.register({ name: v("rName"), email: v("rEmail"), phone: v("rPhone"), pass: v("rPass") });
      if (!r.ok) return showError(r.error);
      if (goNext()) return;
      showAccount(r.user);
    });
    // perfil
    el("profileForm").addEventListener("submit", function (e) {
      e.preventDefault();
      A.update({ name: v("pName"), phone: v("pPhone"), cpf: v("pCpf") });
      var s = el("acctSaved"); s.classList.add("show"); setTimeout(function () { s.classList.remove("show"); }, 1800);
    });
    // sair
    el("logoutBtn").addEventListener("click", function () { A.logout(); showAuth(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
