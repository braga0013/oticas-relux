/* ÓTICAS RELUX — Conta do cliente (demonstração, client-side).
   ⚠️ Não é seguro para produção: dados ficam no navegador (localStorage).
   Para login real, troque por um serviço de autenticação + backend. */
window.RELUX_AUTH = (function () {
  "use strict";
  var UKEY = "relux-users", SKEY = "relux-session";

  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function users() { return read(UKEY) || []; }
  function saveUsers(u) { try { localStorage.setItem(UKEY, JSON.stringify(u)); } catch (e) {} }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "h" + h; }
  function pub(u) { return u ? { name: u.name, email: u.email, phone: u.phone || "", cpf: u.cpf || "" } : null; }
  function find(email) { email = (email || "").toLowerCase().trim(); return users().filter(function (u) { return u.email === email; })[0]; }

  function register(d) {
    if (!d.name || !d.email || !d.pass) return { ok: false, error: "Preencha nome, e-mail e senha." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return { ok: false, error: "E-mail inválido." };
    if (d.pass.length < 6) return { ok: false, error: "A senha precisa de ao menos 6 caracteres." };
    if (find(d.email)) return { ok: false, error: "Já existe uma conta com esse e-mail." };
    var u = { name: d.name.trim(), email: d.email.toLowerCase().trim(), phone: d.phone || "", cpf: d.cpf || "", pass: hash(d.pass) };
    var all = users(); all.push(u); saveUsers(all);
    try { localStorage.setItem(SKEY, u.email); } catch (e) {}
    render(); return { ok: true, user: pub(u) };
  }
  function login(email, pass) {
    var u = find(email);
    if (!u || u.pass !== hash(pass)) return { ok: false, error: "E-mail ou senha incorretos." };
    try { localStorage.setItem(SKEY, u.email); } catch (e) {}
    render(); return { ok: true, user: pub(u) };
  }
  function logout() { try { localStorage.removeItem(SKEY); } catch (e) {} render(); }
  function current() { var e = read(SKEY) || localStorage.getItem(SKEY); var u = e ? find(e) : null; return pub(u); }
  function update(d) {
    var cur = current(); if (!cur) return;
    var all = users().map(function (u) {
      if (u.email === cur.email) { if (d.name) u.name = d.name; if (d.phone != null) u.phone = d.phone; if (d.cpf != null) u.cpf = d.cpf; }
      return u;
    });
    saveUsers(all); render();
  }

  function render() {
    var btn = document.getElementById("accountBtn"); if (!btn) return;
    var u = current();
    var nameEl = document.getElementById("acctName");
    btn.classList.toggle("logged", !!u);
    if (nameEl) nameEl.textContent = u ? (u.name.split(" ")[0]) : "";
    btn.setAttribute("aria-label", u ? ("Minha conta — " + u.name) : "Entrar ou criar conta");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();

  return { register: register, login: login, logout: logout, current: current, update: update, render: render };
})();
