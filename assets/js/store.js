/* ÓTICAS RELUX — Sacola + Favoritos + Modal de Lentes */
(function () {
  "use strict";
  var CART_KEY = "relux-cart";
  var FAV_KEY  = "relux-fav";
  var WA = (window.RELUX_CONFIG && window.RELUX_CONFIG.whatsapp) || "5551995963008";
  window.RELUX = window.RELUX || {};

  /* ---------- preços das lentes ---------- */
  var LENS_BASE = {
    "so-armacao":          0,
    "sem-grau-filtro-azul": 150,
    "grau-leve":           200,
    "grau-moderado":       280,
    "grau-alto":           380,
  };
  var EXTRA_PRICE = { "antirreflexo": 80, "fotossensivel": 150, "filtro-azul-extra": 80 };
  var LENS_LABEL  = {
    "so-armacao": "Só a armação", "sem-grau-filtro-azul": "Sem grau + Filtro Azul",
    "grau-leve": "Grau Leve", "grau-moderado": "Grau Moderado", "grau-alto": "Grau Alto",
  };
  var EXTRA_LABEL = { "antirreflexo": "Antirreflexo", "fotossensivel": "Fotossensível", "filtro-azul-extra": "Filtro Azul" };

  /* ---------- estado do modal ---------- */
  var LM = {
    productId: null, step: 1, lensType: null, grau: null, extras: [],
    faceFile: null, receitaFile: null,
    price: function () {
      var base = LM.lensType === "com-grau"
        ? (LENS_BASE[LM.grau] || 0)
        : (LENS_BASE[LM.lensType] || 0);
      return base + LM.extras.reduce(function (s, e) { return s + (EXTRA_PRICE[e] || 0); }, 0);
    }
  };

  /* ---------- storage ---------- */
  function read(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var cart = read(CART_KEY);
  var fav  = read(FAV_KEY);

  /* ---------- helpers de preço ---------- */
  function parseBRL(s) {
    if (typeof s !== "string") return 0;
    var n = parseFloat(s.replace(/[^\d,]/g, "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  }
  function fmtBRL(n) { return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function prod(id) { return window.RELUX && window.RELUX.findProduct ? window.RELUX.findProduct(id) : null; }

  /* ---------- cart ops ---------- */
  function cartQty() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function favQty()  { return fav.length; }

  function addToCart(id, qty, lens) {
    qty = qty || 1;
    if (lens) {
      cart.push({ id: id, qty: qty, lens: lens });
    } else {
      var line = cart.filter(function (i) { return i.id === id && !i.lens; })[0];
      if (line) line.qty += qty; else cart.push({ id: id, qty: qty });
    }
    write(CART_KEY, cart); refreshUI();
  }
  function setQty(id, qty) {
    cart = cart.map(function (i) {
      return i.id === id ? { id: id, qty: qty, lens: i.lens } : i;
    }).filter(function (i) { return i.qty > 0; });
    write(CART_KEY, cart); refreshUI(); renderCart();
  }
  function removeFromCart(id) {
    var found = false;
    cart = cart.filter(function (i) {
      if (!found && i.id === id) { found = true; return false; }
      return true;
    });
    write(CART_KEY, cart); refreshUI(); renderCart();
  }
  function clearCart() { cart = []; write(CART_KEY, cart); refreshUI(); renderCart(); }
  function subtotal() {
    return cart.reduce(function (s, i) {
      var p = prod(i.id);
      var frame = p ? parseBRL(p.price) * i.qty : 0;
      var lens  = i.lens ? (i.lens.lensPrice || 0) * i.qty : 0;
      return s + frame + lens;
    }, 0);
  }

  /* API pública */
  window.RELUX.getCart        = function () { return cart.map(function (i) { return { id: i.id, qty: i.qty, lens: i.lens }; }); };
  window.RELUX.cartSubtotal   = subtotal;
  window.RELUX.cartCount      = cartQty;
  window.RELUX.parseBRL       = parseBRL;
  window.RELUX.fmtBRL         = fmtBRL;
  window.RELUX.setQty         = setQty;
  window.RELUX.removeFromCart = removeFromCart;
  window.RELUX.clearCart      = clearCart;
  window.RELUX.addToCart      = addToCart;

  /* ---------- fav ops ---------- */
  function isFav(id) { return fav.indexOf(id) > -1; }
  function toggleFav(id) {
    if (isFav(id)) { fav = fav.filter(function (x) { return x !== id; }); toast("Removido dos favoritos"); }
    else { fav.push(id); toast("Adicionado aos favoritos ♥"); }
    write(FAV_KEY, fav); refreshUI(); renderFav();
  }
  function removeFav(id) { fav = fav.filter(function (x) { return x !== id; }); write(FAV_KEY, fav); refreshUI(); renderFav(); }

  /* ============================================================
     DOM — drawers, backdrop, toast e modal de lentes
     ============================================================ */
  function closeIco() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  }

  function buildLensModalHTML() {
    function optBtn(val, name, badge, desc, accentBadge) {
      return '<button class="lens-opt" type="button" data-opt="' + val + '">' +
        '<div class="lo-head"><span class="lo-name">' + name + '</span>' +
        '<span class="lo-badge' + (accentBadge ? ' accent' : '') + '">' + badge + '</span></div>' +
        '<span class="lo-desc">' + desc + '</span></button>';
    }
    function toggleBtn(val, name, badge, desc) {
      return '<button class="lens-opt lens-toggle" type="button" data-opt="' + val + '">' +
        '<div class="lo-check"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12l5 5L19 7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
        '<div class="lo-body"><div class="lo-head"><span class="lo-name">' + name + '</span><span class="lo-badge accent">' + badge + '</span></div>' +
        '<span class="lo-desc">' + desc + '</span></div></button>';
    }

    return '<div class="lens-modal" id="lensModal" role="dialog" aria-modal="true" aria-label="Escolher tipo de lente">' +
      '<div class="lens-modal-card">' +
        '<button class="lens-modal-close" id="lensModalClose" type="button" aria-label="Fechar">' + closeIco() + '</button>' +

        /* step bar */
        '<div class="lens-steps-bar" id="lensStepsBar">' +
          '<span class="lsb-dot active" data-s="1">1 · Lente</span>' +
          '<span class="lsb-sep"></span>' +
          '<span class="lsb-dot" data-s="2">2 · Grau</span>' +
          '<span class="lsb-sep"></span>' +
          '<span class="lsb-dot" data-s="3">3 · Extras</span>' +
          '<span class="lsb-sep"></span>' +
          '<span class="lsb-dot" data-s="4">4 · Documentos</span>' +
        '</div>' +

        /* product bar */
        '<div class="lens-product-bar" id="lensProductBar"></div>' +

        /* panels */
        '<div class="lens-steps-wrap">' +

          /* step 1 */
          '<div class="lens-panel active" data-panel="1">' +
            '<h3 class="lens-panel-title">Como deseja as lentes?</h3>' +
            '<div class="lens-opts">' +
              optBtn("so-armacao", "Só a armação", "+ R$ 0", "Sem lentes — você providencia as suas") +
              optBtn("sem-grau-filtro-azul", "Sem grau + Filtro Azul", "+ R$ 150", "Proteção contra luz azul das telas digitais", true) +
              optBtn("com-grau", "Com Grau", "a partir de R$ 200", "Lentes de correção visual com receita médica") +
            '</div>' +
          '</div>' +

          /* step 2 */
          '<div class="lens-panel" data-panel="2">' +
            '<h3 class="lens-panel-title">Qual o nível do grau?</h3>' +
            '<div class="lens-opts">' +
              optBtn("grau-leve", "Grau Leve", "+ R$ 200", "Até -2,00 ou +2,00 (esférico)") +
              optBtn("grau-moderado", "Grau Moderado", "+ R$ 280", "De -2,25 a -4,00") +
              optBtn("grau-alto", "Grau Alto", "+ R$ 380", "Acima de -4,00 ou astigmatismo elevado") +
            '</div>' +
          '</div>' +

          /* step 3 */
          '<div class="lens-panel" data-panel="3">' +
            '<h3 class="lens-panel-title">Tratamentos adicionais</h3>' +
            '<p class="lens-panel-sub">Opcional — selecione um ou mais</p>' +
            '<div class="lens-opts">' +
              toggleBtn("antirreflexo", "Antirreflexo", "+ R$ 80", "Reduz reflexos e cansaço visual") +
              toggleBtn("fotossensivel", "Fotossensível", "+ R$ 150", "Escurece ao sol, clareia na sombra") +
              toggleBtn("filtro-azul-extra", "Filtro de Luz Azul", "+ R$ 80", "Proteção para telas e ambientes digitais") +
            '</div>' +
          '</div>' +

          /* step 4 */
          '<div class="lens-panel" data-panel="4">' +
            '<h3 class="lens-panel-title">Documentos obrigatórios</h3>' +
            '<p class="lens-panel-sub">Necessários para fabricar as lentes com grau</p>' +
            '<div class="lens-uploads">' +
              '<div class="upload-box" id="ubFace">' +
                '<label for="uploadFace" class="ub-label">' +
                  '<svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>' +
                  '<span>Foto do rosto</span><small>JPG ou PNG</small>' +
                '</label>' +
                '<input type="file" id="uploadFace" accept="image/*" style="display:none"/>' +
                '<div class="ub-status" id="faceStatus"></div>' +
              '</div>' +
              '<div class="upload-box" id="ubReceita">' +
                '<label for="uploadReceita" class="ub-label">' +
                  '<svg viewBox="0 0 24 24" width="28" height="28"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>' +
                  '<span>Receita médica</span><small>JPG, PNG ou PDF</small>' +
                '</label>' +
                '<input type="file" id="uploadReceita" accept="image/*,.pdf" style="display:none"/>' +
                '<div class="ub-status" id="receitaStatus"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

        '</div>' + /* .lens-steps-wrap */

        /* footer */
        '<div class="lens-modal-foot">' +
          '<div class="lens-total-wrap"><span>Total estimado</span><strong id="lensTotalDisplay">—</strong></div>' +
          '<div class="lens-foot-actions">' +
            '<button class="btn btn-ghost" id="lensBtnBack" type="button" style="display:none">Voltar</button>' +
            '<button class="btn btn-primary" id="lensBtnNext" type="button">Continuar</button>' +
          '</div>' +
        '</div>' +

      '</div>' + /* .lens-modal-card */
    '</div>'; /* .lens-modal */
  }

  function injectUI() {
    if (document.getElementById("reluxStore")) return;
    var wrap = document.createElement("div");
    wrap.id = "reluxStore";
    wrap.innerHTML =
      '<div class="drawer-backdrop" id="drawerBackdrop"></div>' +
      /* CART */
      '<aside class="drawer" id="cartDrawer" aria-hidden="true" aria-label="Sua sacola">' +
        '<header class="drawer-head"><h3>Sua sacola <span class="drawer-count" id="cartHeadCount"></span></h3>' +
          '<button class="drawer-close" type="button" data-close aria-label="Fechar">' + closeIco() + '</button></header>' +
        '<div class="drawer-body" id="cartBody"></div>' +
        '<footer class="drawer-foot" id="cartFoot">' +
          '<div class="drawer-subtotal"><span>Subtotal</span><strong id="cartSubtotal">R$ 0,00</strong></div>' +
          '<p class="drawer-note">Pague com Pix (5% off), cartão em até 10x ou na loja.</p>' +
          '<a class="btn btn-primary btn-block btn-lg" id="cartCheckout" href="checkout.html">Finalizar compra</a>' +
          '<button class="drawer-link" type="button" id="cartClear">Esvaziar sacola</button>' +
        '</footer>' +
      '</aside>' +
      /* FAV */
      '<aside class="drawer" id="favDrawer" aria-hidden="true" aria-label="Seus favoritos">' +
        '<header class="drawer-head"><h3>Favoritos <span class="drawer-count" id="favHeadCount"></span></h3>' +
          '<a class="drawer-link" href="favoritos.html" style="margin-right:auto;font-size:.8rem;">Ver todos</a>' +
          '<button class="drawer-close" type="button" data-close aria-label="Fechar">' + closeIco() + '</button></header>' +
        '<div class="drawer-body" id="favBody"></div>' +
      '</aside>' +
      '<div class="toast-wrap" id="toastWrap" aria-live="polite"></div>' +
      buildLensModalHTML();
    document.body.appendChild(wrap);

    document.getElementById("drawerBackdrop").addEventListener("click", closeDrawers);
    wrap.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeDrawers); });
    var cl = document.getElementById("cartClear");
    if (cl) cl.addEventListener("click", clearCart);

    /* Exige login antes de ir para o checkout (mantém dados do cliente corretos) */
    var co = document.getElementById("cartCheckout");
    if (co) co.addEventListener("click", function (e) {
      var u = window.RELUX_AUTH && window.RELUX_AUTH.current();
      if (!u) {
        e.preventDefault();
        toast("Entre na sua conta para finalizar a compra");
        location.href = "conta.html?next=checkout.html";
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeDrawers(); hideLensModal(); }
    });

    initLensModal();
  }

  /* ============================================================
     Modal de lentes — lógica
     ============================================================ */
  function initLensModal() {
    var modal = document.getElementById("lensModal");
    if (!modal) return;

    document.getElementById("lensModalClose").addEventListener("click", hideLensModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) hideLensModal(); });
    document.getElementById("lensBtnNext").addEventListener("click", lensNext);
    document.getElementById("lensBtnBack").addEventListener("click", lensPrev);

    /* step 1 — seleção única */
    modal.querySelectorAll('[data-panel="1"] .lens-opt').forEach(function (btn) {
      btn.addEventListener("click", function () {
        modal.querySelectorAll('[data-panel="1"] .lens-opt').forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        LM.lensType = btn.getAttribute("data-opt");
        var next = document.getElementById("lensBtnNext");
        if (LM.lensType === "so-armacao" || LM.lensType === "sem-grau-filtro-azul") {
          if (next) next.textContent = "Adicionar à sacola";
        } else {
          if (next) next.textContent = "Continuar";
        }
        updateLensTotal();
      });
    });

    /* step 2 — seleção única */
    modal.querySelectorAll('[data-panel="2"] .lens-opt').forEach(function (btn) {
      btn.addEventListener("click", function () {
        modal.querySelectorAll('[data-panel="2"] .lens-opt').forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        LM.grau = btn.getAttribute("data-opt");
        updateLensTotal();
      });
    });

    /* step 3 — multi-select */
    modal.querySelectorAll('[data-panel="3"] .lens-toggle').forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.classList.toggle("active");
        var opt = btn.getAttribute("data-opt");
        var idx = LM.extras.indexOf(opt);
        if (idx > -1) LM.extras.splice(idx, 1); else LM.extras.push(opt);
        updateLensTotal();
      });
    });

    /* uploads */
    document.getElementById("uploadFace").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      LM.faceFile = f;
      document.getElementById("faceStatus").innerHTML = '<span class="ub-ok">✓ ' + f.name + '</span>';
      document.getElementById("ubFace").classList.add("done");
    });
    document.getElementById("uploadReceita").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      LM.receitaFile = f;
      document.getElementById("receitaStatus").innerHTML = '<span class="ub-ok">✓ ' + f.name + '</span>';
      document.getElementById("ubReceita").classList.add("done");
    });
  }

  function showLensModal(id) {
    var modal = document.getElementById("lensModal");
    if (!modal) return;

    /* reset */
    LM.productId = id; LM.step = 1; LM.lensType = null; LM.grau = null;
    LM.extras = []; LM.faceFile = null; LM.receitaFile = null;

    modal.querySelectorAll(".lens-opt").forEach(function (b) { b.classList.remove("active"); });
    modal.querySelectorAll(".lens-panel").forEach(function (p) { p.classList.remove("active"); });
    modal.querySelector('[data-panel="1"]').classList.add("active");
    modal.querySelectorAll(".lsb-dot").forEach(function (d) { d.classList.remove("active", "done"); });
    modal.querySelector('[data-s="1"]').classList.add("active");

    var btnBack = document.getElementById("lensBtnBack");
    var btnNext = document.getElementById("lensBtnNext");
    if (btnBack) btnBack.style.display = "none";
    if (btnNext) btnNext.textContent = "Continuar";

    document.getElementById("faceStatus").innerHTML = "";
    document.getElementById("receitaStatus").innerHTML = "";
    document.getElementById("ubFace").classList.remove("done");
    document.getElementById("ubReceita").classList.remove("done");
    try { document.getElementById("uploadFace").value = ""; document.getElementById("uploadReceita").value = ""; } catch (e) {}

    var p = prod(id);
    var bar = document.getElementById("lensProductBar");
    if (bar && p) {
      bar.innerHTML = '<div class="lpb-name"><span>' + p.brand + '</span>' + p.name + '</div>' +
        '<div class="lpb-price">Armação: <strong>' + p.price + '</strong></div>';
    }

    updateLensTotal();
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function hideLensModal() {
    var modal = document.getElementById("lensModal");
    if (modal) modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function updateLensTotal() {
    var p = prod(LM.productId);
    var frame = p ? parseBRL(p.price) : 0;
    var lp = LM.price();
    var el = document.getElementById("lensTotalDisplay");
    if (el) el.textContent = lp > 0 ? fmtBRL(frame + lp) : (p ? p.price : "—");
  }

  function setLensStep(step) {
    LM.step = step;
    var modal = document.getElementById("lensModal");
    if (!modal) return;

    modal.querySelectorAll(".lens-panel").forEach(function (p) { p.classList.remove("active"); });
    var panel = modal.querySelector('[data-panel="' + step + '"]');
    if (panel) panel.classList.add("active");

    modal.querySelectorAll(".lsb-dot").forEach(function (d) {
      var s = parseInt(d.getAttribute("data-s"), 10);
      d.classList.toggle("active", s === step);
      d.classList.toggle("done", s < step);
    });

    var btnBack = document.getElementById("lensBtnBack");
    var btnNext = document.getElementById("lensBtnNext");
    if (btnBack) btnBack.style.display = step > 1 ? "" : "none";
    if (btnNext) btnNext.textContent = step === 4 ? "Adicionar à sacola" : "Continuar";
  }

  function lensNext() {
    var step = LM.step;

    if (step === 1) {
      if (!LM.lensType) { toast("Selecione um tipo de lente para continuar"); return; }
      /* direto ao carrinho */
      if (LM.lensType === "so-armacao" || LM.lensType === "sem-grau-filtro-azul") {
        addToCart(LM.productId, 1, { type: LM.lensType, grau: null, extras: [], lensPrice: LM.price() });
        hideLensModal();
        var p = prod(LM.productId);
        toast((p ? p.name : "Produto") + " adicionado", "Ver sacola", function () { openDrawer("cart"); });
        return;
      }
      setLensStep(2);

    } else if (step === 2) {
      if (!LM.grau) { toast("Selecione o nível do grau para continuar"); return; }
      setLensStep(3);

    } else if (step === 3) {
      setLensStep(4);

    } else if (step === 4) {
      if (!LM.faceFile)    { toast("Envie a foto do rosto para continuar"); return; }
      if (!LM.receitaFile) { toast("Envie a receita médica para continuar"); return; }
      addToCart(LM.productId, 1, {
        type: "com-grau", grau: LM.grau, extras: LM.extras.slice(),
        lensPrice: LM.price(),
        faceName: LM.faceFile.name, receitaName: LM.receitaFile.name,
      });
      hideLensModal();
      var p2 = prod(LM.productId);
      toast((p2 ? p2.name : "Produto") + " adicionado", "Ver sacola", function () { openDrawer("cart"); });
    }
  }

  function lensPrev() { if (LM.step > 1) setLensStep(LM.step - 1); }

  /* ---------- drawers ---------- */
  function openDrawer(which) {
    var d  = document.getElementById(which === "fav" ? "favDrawer" : "cartDrawer");
    var bd = document.getElementById("drawerBackdrop");
    if (!d || !bd) return;
    if (which === "fav") renderFav(); else renderCart();
    bd.classList.add("open"); d.classList.add("open");
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
  function toast(msg, actionLabel, actionFn) {
    var wrap = document.getElementById("toastWrap"); if (!wrap) return;
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = "<span>" + msg + "</span>";
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

  /* ---------- lensTag (etiqueta do item na sacola) ---------- */
  function lensTag(lens) {
    if (!lens || !lens.type) return "";
    var parts = [];
    if (lens.type === "com-grau") { parts.push(LENS_LABEL[lens.grau] || lens.grau); }
    else { parts.push(LENS_LABEL[lens.type] || lens.type); }
    (lens.extras || []).forEach(function (e) { parts.push(EXTRA_LABEL[e] || e); });
    if (lens.faceName) parts.push("📎 Docs");
    return '<span class="ci-lens-tag">' + parts.join(" · ") + "</span>";
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
        var hasLens = i.lens && i.lens.lensPrice > 0;
        var frame = parseBRL(p.price);
        var priceDisplay = hasLens ? fmtBRL((frame + i.lens.lensPrice) * i.qty) : p.price;
        return '<div class="cart-item" data-id="' + p.id + '">' +
          '<a class="ci-thumb" href="produto.html?id=' + p.id + '">' + thumbHTML(p) + "</a>" +
          '<div class="ci-info">' +
            '<span class="ci-brand">' + p.brand + "</span>" +
            '<a class="ci-name" href="produto.html?id=' + p.id + '">' + p.name + "</a>" +
            lensTag(i.lens) +
            '<span class="ci-price">' + priceDisplay + "</span>" +
            '<div class="qty">' +
              '<button type="button" data-dec="' + p.id + '" aria-label="Diminuir">−</button>' +
              "<span>" + i.qty + "</span>" +
              '<button type="button" data-inc="' + p.id + '" aria-label="Aumentar">+</button>' +
            "</div>" +
          "</div>" +
          '<button class="ci-remove" type="button" data-rm="' + p.id + '" aria-label="Remover">' + closeIco() + "</button>" +
        "</div>";
      }).join("");
    }
    var sub = document.getElementById("cartSubtotal"); if (sub) sub.textContent = fmtBRL(subtotal());
    var hc  = document.getElementById("cartHeadCount"); if (hc) hc.textContent = cartQty() ? "(" + cartQty() + ")" : "";
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

  /* ---------- badges + corações ---------- */
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
    /* Adicionar à sacola */
    var add = e.target.closest("[data-add]");
    if (add) {
      e.preventDefault();
      var id = add.getAttribute("data-add");
      var p  = prod(id);
      /* óculos e armações → modal de lentes; lentes de contato → direto */
      if (p && p.category !== "Lentes de Contato") {
        showLensModal(id);
      } else {
        addToCart(id, 1);
        toast((p ? p.name : "Produto") + " adicionado", "Ver sacola", function () { openDrawer("cart"); });
      }
      return;
    }

    var f = e.target.closest("[data-fav]");
    if (f) { e.preventDefault(); toggleFav(f.getAttribute("data-fav")); return; }

    var inc = e.target.closest("[data-inc]");
    if (inc) { var i1 = inc.getAttribute("data-inc"); var l1 = cart.filter(function (x) { return x.id === i1; })[0]; setQty(i1, (l1 ? l1.qty : 0) + 1); return; }
    var dec = e.target.closest("[data-dec]");
    if (dec) { var i2 = dec.getAttribute("data-dec"); var l2 = cart.filter(function (x) { return x.id === i2; })[0]; setQty(i2, (l2 ? l2.qty : 0) - 1); return; }
    var rm  = e.target.closest("[data-rm]");
    if (rm)  { removeFromCart(rm.getAttribute("data-rm")); return; }
    var uf  = e.target.closest("[data-unfav]");
    if (uf)  { removeFav(uf.getAttribute("data-unfav")); return; }
  });

  /* ---------- init ---------- */
  function init() {
    injectUI();
    var cb = document.getElementById("cartBtn"); if (cb) cb.addEventListener("click", function () { openDrawer("cart"); });
    var fb = document.getElementById("favBtn");  if (fb) fb.addEventListener("click", function () { openDrawer("fav"); });
    refreshUI();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
