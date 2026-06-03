/* ÓTICAS RELUX — Sacola (carrinho) + Favoritos
   Persiste em localStorage. Sem cadastro. Checkout via WhatsApp. */
(function () {
  "use strict";
  var CART_KEY = "relux-cart"; // [{id, qty}]
  var FAV_KEY = "relux-fav";   // [id, id, ...]
  var WA = (window.RELUX_CONFIG && window.RELUX_CONFIG.whatsapp) || "5500000000000";
  window.RELUX = window.RELUX || {};

  /* ---------- storage ---------- */
  function read(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  var cart = read(CART_KEY);
  var fav = read(FAV_KEY);

  /* ---------- preços ---------- */
  function parseBRL(s) {
    if (typeof s !== "string") return 0;
    var n = parseFloat(s.replace(/[^\d,]/g, "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  }
  function fmtBRL(n) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function prod(id) { return window.RELUX.findProduct ? window.RELUX.findProduct(id) : null; }

  /* ---------- cart ops ---------- */
  function cartQty() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function favQty() { return fav.length; }
  function addToCart(id, qty) {
    qty = qty || 1;
    var line = cart.filter(function (i) { return i.id === id; })[0];
    if (line) line.qty += qty; else cart.push({ id: id, qty: qty });
    write(CART_KEY, cart); refreshUI();
  }
  function setQty(id, qty) {
    cart = cart.map(function (i) { return i.id === id ? { id: id, qty: qty } : i; }).filter(function (i) { return i.qty > 0; });
    write(CART_KEY, cart); refreshUI(); renderCart();
  }
  function removeFromCart(id) { cart = cart.filter(function (i) { return i.id !== id; }); write(CART_KEY, cart); refreshUI(); renderCart(); }
  function clearCart() { cart = []; write(CART_KEY, cart); refreshUI(); renderCart(); }
  function subtotal() { return cart.reduce(function (s, i) { var p = prod(i.id); return s + (p ? parseBRL(p.price) * i.qty : 0); }, 0); }

  /* API pública (usada pela página de checkout) */
  window.RELUX.getCart = function () { return cart.map(function (i) { return { id: i.id, qty: i.qty }; }); };
  window.RELUX.cartSubtotal = subtotal;
  window.RELUX.cartCount = cartQty;
  window.RELUX.parseBRL = parseBRL;
  window.RELUX.fmtBRL = fmtBRL;
  window.RELUX.setQty = setQty;
  window.RELUX.removeFromCart = removeFromCart;
  window.RELUX.clearCart = clearCart;
  window.RELUX.addToCart = addToCart;

  /* ---------- fav ops ---------- */
  function isFav(id) { return fav.indexOf(id) > -1; }
  function toggleFav(id) {
    if (isFav(id)) { fav = fav.filter(function (x) { return x !== id; }); toast("Removido dos favoritos"); }
    else { fav.push(id); toast("Adicionado aos favoritos ♥"); }
    write(FAV_KEY, fav); refreshUI(); renderFav();
  }
  function removeFav(id) { fav = fav.filter(function (x) { return x !== id; }); write(FAV_KEY, fav); refreshUI(); renderFav(); }

  /* ============================================================
     DOM — injeta drawers, backdrop e toast
     ============================================================ */
  function injectUI() {
    if (document.getElementById("reluxStore")) return;
    var wrap = document.createElement("div");
    wrap.id = "reluxStore";
    wrap.innerHTML =
      '<div class="drawer-backdrop" id="drawerBackdrop"></div>' +
      // CART
      '<aside class="drawer" id="cartDrawer" aria-hidden="true" aria-label="Sua sacola">' +
        '<header class="drawer-head"><h3>Sua sacola <span class="drawer-count" id="cartHeadCount"></span></h3>' +
          '<button class="drawer-close" type="button" data-close aria-label="Fechar">' + closeIco() + "</button></header>" +
        '<div class="drawer-body" id="cartBody"></div>' +
        '<footer class="drawer-foot" id="cartFoot">' +
          '<div class="drawer-subtotal"><span>Subtotal</span><strong id="cartSubtotal">R$ 0,00</strong></div>' +
          '<p class="drawer-note">Pague com Pix (5% off), cartão em até 10x ou na loja.</p>' +
          '<a class="btn btn-primary btn-block btn-lg" id="cartCheckout" href="checkout.html">Finalizar compra</a>' +
          '<button class="drawer-link" type="button" id="cartClear">Esvaziar sacola</button>' +
        "</footer>" +
      "</aside>" +
      // FAV
      '<aside class="drawer" id="favDrawer" aria-hidden="true" aria-label="Seus favoritos">' +
        '<header class="drawer-head"><h3>Favoritos <span class="drawer-count" id="favHeadCount"></span></h3>' +
          '<button class="drawer-close" type="button" data-close aria-label="Fechar">' + closeIco() + "</button></header>" +
        '<div class="drawer-body" id="favBody"></div>' +
      "</aside>" +
      '<div class="toast-wrap" id="toastWrap" aria-live="polite"></div>';
    document.body.appendChild(wrap);

    document.getElementById("drawerBackdrop").addEventListener("click", closeDrawers);
    wrap.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeDrawers); });
    var clear = document.getElementById("cartClear");
    if (clear) clear.addEventListener("click", clearCart);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawers(); });
  }
  function closeIco() { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'; }

  /* ---------- drawers open/close ---------- */
  function openDrawer(which) {
    var d = document.getElementById(which === "fav" ? "favDrawer" : "cartDrawer");
    var bd = document.getElementById("drawerBackdrop");
    if (!d || !bd) return;
    if (which === "fav") renderFav(); else renderCart();
    bd.classList.add("open");
    d.classList.add("open");
    d.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeDrawers() {
    document.querySelectorAll(".drawer").forEach(function (d) { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); });
    var bd = document.getElementById("drawerBackdrop");
    if (bd) bd.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg, actionLabel, actionFn) {
    var wrap = document.getElementById("toastWrap");
    if (!wrap) return;
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = '<span>' + msg + "</span>";
    if (actionLabel) {
      var a = document.createElement("button");
      a.className = "toast-action"; a.textContent = actionLabel;
      a.addEventListener("click", function () { actionFn && actionFn(); t.remove(); });
      t.appendChild(a);
    }
    wrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("in"); });
    setTimeout(function () { t.classList.remove("in"); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }

  /* ---------- render cart ---------- */
  function thumbHTML(p) {
    return p && p.img
      ? '<img src="' + p.img + '" alt="" loading="lazy">'
      : '<svg viewBox="0 0 200 80"><use href="#' + (p ? p.shape : "g-sun") + '"/></svg>';
  }
  function renderCart() {
    var body = document.getElementById("cartBody"); if (!body) return;
    var foot = document.getElementById("cartFoot");
    if (!cart.length) {
      body.innerHTML = emptyState("Sua sacola está vazia", "Explore nossas coleções e adicione seus favoritos.");
      if (foot) foot.style.display = "none";
    } else {
      if (foot) foot.style.display = "";
      body.innerHTML = cart.map(function (i) {
        var p = prod(i.id); if (!p) return "";
        return '<div class="cart-item" data-id="' + p.id + '">' +
          '<a class="ci-thumb" href="produto.html?id=' + p.id + '">' + thumbHTML(p) + "</a>" +
          '<div class="ci-info">' +
            '<span class="ci-brand">' + p.brand + "</span>" +
            '<a class="ci-name" href="produto.html?id=' + p.id + '">' + p.name + "</a>" +
            '<span class="ci-price">' + p.price + "</span>" +
            '<div class="qty"><button type="button" data-dec="' + p.id + '" aria-label="Diminuir">−</button>' +
              "<span>" + i.qty + "</span>" +
              '<button type="button" data-inc="' + p.id + '" aria-label="Aumentar">+</button></div>' +
          "</div>" +
          '<button class="ci-remove" type="button" data-rm="' + p.id + '" aria-label="Remover">' + closeIco() + "</button>" +
        "</div>";
      }).join("");
    }
    var sub = document.getElementById("cartSubtotal"); if (sub) sub.textContent = fmtBRL(subtotal());
    var hc = document.getElementById("cartHeadCount"); if (hc) hc.textContent = cartQty() ? "(" + cartQty() + ")" : "";
  }

  /* ---------- render fav ---------- */
  function renderFav() {
    var body = document.getElementById("favBody"); if (!body) return;
    if (!fav.length) { body.innerHTML = emptyState("Nenhum favorito ainda", "Toque no ♥ dos produtos para salvá-los aqui."); }
    else {
      body.innerHTML = fav.map(function (id) {
        var p = prod(id); if (!p) return "";
        return '<div class="cart-item" data-id="' + p.id + '">' +
          '<a class="ci-thumb" href="produto.html?id=' + p.id + '">' + thumbHTML(p) + "</a>" +
          '<div class="ci-info">' +
            '<span class="ci-brand">' + p.brand + "</span>" +
            '<a class="ci-name" href="produto.html?id=' + p.id + '">' + p.name + "</a>" +
            '<span class="ci-price">' + p.price + "</span>" +
            '<button class="btn btn-primary btn-sm" type="button" data-add="' + p.id + '">Adicionar à sacola</button>' +
          "</div>" +
          '<button class="ci-remove" type="button" data-unfav="' + p.id + '" aria-label="Remover">' + closeIco() + "</button>" +
        "</div>";
      }).join("");
    }
    var hc = document.getElementById("favHeadCount"); if (hc) hc.textContent = fav.length ? "(" + fav.length + ")" : "";
  }
  function emptyState(title, sub) {
    return '<div class="drawer-empty"><div class="de-ico">' +
      '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h13l5 5v5h-2M3 7v10h2M16 7v10M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z"/></svg>' +
      "</div><h4>" + title + "</h4><p>" + sub + "</p>" +
      '<a class="btn btn-ghost" href="index.html#destaques">Ver produtos</a></div>';
  }

  /* ---------- badges + estado dos corações ---------- */
  function refreshUI() {
    var cc = document.getElementById("cartCount"), fc = document.getElementById("favCount");
    if (cc) { var n = cartQty(); cc.textContent = n; cc.classList.toggle("show", n > 0); }
    if (fc) { var m = favQty(); fc.textContent = m; fc.classList.toggle("show", m > 0); }
    document.querySelectorAll("[data-fav]").forEach(function (b) {
      b.classList.toggle("is-fav", isFav(b.getAttribute("data-fav")));
    });
    try { document.dispatchEvent(new CustomEvent("relux:change")); } catch (e) {}
  }
  window.RELUX.refreshUI = refreshUI;

  /* ---------- delegação global de cliques ---------- */
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) { e.preventDefault(); var id = add.getAttribute("data-add"); addToCart(id, 1);
      var p = prod(id); toast((p ? p.name : "Produto") + " adicionado", "Ver sacola", function () { openDrawer("cart"); }); return; }

    var f = e.target.closest("[data-fav]");
    if (f) { e.preventDefault(); toggleFav(f.getAttribute("data-fav")); return; }

    var inc = e.target.closest("[data-inc]"); if (inc) { var i1 = inc.getAttribute("data-inc"); var l = cart.filter(function (x) { return x.id === i1; })[0]; setQty(i1, (l ? l.qty : 0) + 1); return; }
    var dec = e.target.closest("[data-dec]"); if (dec) { var i2 = dec.getAttribute("data-dec"); var l2 = cart.filter(function (x) { return x.id === i2; })[0]; setQty(i2, (l2 ? l2.qty : 0) - 1); return; }
    var rm = e.target.closest("[data-rm]"); if (rm) { removeFromCart(rm.getAttribute("data-rm")); return; }
    var uf = e.target.closest("[data-unfav]"); if (uf) { removeFav(uf.getAttribute("data-unfav")); return; }
  });

  /* ---------- init ---------- */
  function init() {
    injectUI();
    var cb = document.getElementById("cartBtn"); if (cb) cb.addEventListener("click", function () { openDrawer("cart"); });
    var fb = document.getElementById("favBtn"); if (fb) fb.addEventListener("click", function () { openDrawer("fav"); });
    refreshUI();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
