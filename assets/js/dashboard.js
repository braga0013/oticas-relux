/* ÓTICAS RELUX — Dashboard Admin */
(function () {
  "use strict";

  var SENHA = "relux2024"; // altere para sua senha

  function el(id) { return document.getElementById(id); }
  function fmt(n) { return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

  /* ── Auth ── */
  function checkAuth() {
    var ok = sessionStorage.getItem("relux-admin") === "1";
    if (!ok) {
      el("loginBox").style.display = "";
      el("dashContent").style.display = "none";
    } else {
      el("loginBox").style.display = "none";
      el("dashContent").style.display = "";
      loadDash();
      /* recarrega os números quando o catálogo do Supabase chegar */
      if (window.RELUX && window.RELUX.whenReady) window.RELUX.whenReady(loadDash);
    }
  }

  el("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var pw = el("adminPw").value;
    if (pw === SENHA) {
      sessionStorage.setItem("relux-admin", "1");
      el("loginError").hidden = true;
      checkAuth();
    } else {
      el("loginError").hidden = false;
    }
  });

  el("logoutBtn").addEventListener("click", function () {
    sessionStorage.removeItem("relux-admin");
    checkAuth();
  });

  /* ── Dados ── */
  function getOrders() { try { return JSON.parse(localStorage.getItem("relux-orders")) || []; } catch (e) { return []; } }
  function getCart() { try { return JSON.parse(localStorage.getItem("relux-cart")) || []; } catch (e) { return []; } }
  function getVisits() { try { return JSON.parse(localStorage.getItem("relux-visits")) || { total: 0, hoje: 0 }; } catch (e) { return { total: 0, hoje: 0 }; } }

  function parseBRL(s) {
    if (typeof s !== "string") return 0;
    var n = parseFloat(s.replace(/[^\d,]/g, "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  }

  /* ── Renderiza ── */
  function loadDash() {
    var orders = getOrders();
    var cart = getCart();
    var visits = getVisits();
    var products = window.RELUX_PRODUCTS || [];

    var totalOrders = orders.length;
    var aprovados = orders.filter(function (o) { return o.status === "aprovado"; });
    var pendentes = orders.filter(function (o) { return o.status === "pendente"; });
    var receita = aprovados.reduce(function (s, o) { return s + parseBRL(o.total); }, 0);
    var receitaPendente = pendentes.reduce(function (s, o) { return s + parseBRL(o.total); }, 0);
    var cartItems = cart.reduce(function (s, i) { return s + i.qty; }, 0);

    /* Cards */
    setText("statVisitsTotal", visits.total);
    setText("statVisitsHoje", visits.hoje);
    setText("statOrders", totalOrders);
    setText("statReceita", fmt(receita));
    setText("statPendente", pendentes.length);
    setText("statReceitaPend", fmt(receitaPendente));
    setText("statCart", cartItems > 0 ? cartItems + " item(s)" : "Vazio");
    setText("statProducts", products.length);

    /* Tabela de pedidos */
    var tbody = el("ordersBody");
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">Nenhum pedido registrado ainda.</td></tr>';
    } else {
      var sorted = orders.slice().reverse();
      tbody.innerHTML = sorted.map(function (o) {
        var badge = o.status === "aprovado"
          ? '<span class="dash-badge ok">Aprovado</span>'
          : '<span class="dash-badge pend">Pendente</span>';
        return "<tr>" +
          "<td>" + o.num + "</td>" +
          "<td>" + (o.date || "—") + "</td>" +
          "<td>" + o.total + "</td>" +
          "<td>" + badge + "</td>" +
          "<td style='color:var(--muted);font-size:.8rem'>" + (o.email || "—") + "</td>" +
          "</tr>";
      }).join("");
    }

    /* Carrinho pendente */
    var cartDiv = el("cartPendente");
    if (!cartItems) {
      cartDiv.innerHTML = '<p style="color:var(--muted)">Nenhum item no carrinho no momento.</p>';
    } else {
      cartDiv.innerHTML = cart.map(function (i) {
        var p = window.RELUX && window.RELUX.findProduct ? window.RELUX.findProduct(i.id) : null;
        return '<div class="dash-cart-item">' +
          '<span>' + (p ? p.brand + " · " + p.name : i.id) + '</span>' +
          '<span class="dash-qty">' + i.qty + 'x ' + (p ? p.price : "") + '</span>' +
          '</div>';
      }).join("");
    }
  }

  function setText(id, v) { var e = el(id); if (e) e.textContent = v; }

  /* ── Limpar pedidos ── */
  el("clearOrders").addEventListener("click", function () {
    if (!confirm("Apagar todos os pedidos do histórico local?")) return;
    localStorage.removeItem("relux-orders");
    loadDash();
  });

  checkAuth();
})();
