/* Configuração geral.
   - whatsapp: número da loja (apenas dígitos, com DDI 55).
   - apiBase: deixe "" se a API estiver na mesma URL do site (Vercel). */
window.RELUX_CONFIG = {
  whatsapp: "5551995963008",
  apiBase: "",
  /* Supabase — catálogo dinâmico (as lentes vêm de lá).
     supabaseUrl: URL do projeto (https://<ref>.supabase.co)
     supabaseKey: chave PÚBLICA/anon (somente leitura via RLS). */
  supabaseUrl: "https://joktfcfcssxhhyiuxwer.supabase.co",
  supabaseKey: "sb_publishable_vxUtkkhNJ8Z_U_4EkuTutg_HY-pB-Gj",
};

/* Produtos carregados dinamicamente via Supabase — array começa vazio. */
window.RELUX_PRODUCTS = [];

/* ---------- helpers ---------- */
window.RELUX = window.RELUX || {};

/* Carrega produtos extras cadastrados via admin */
(function () {
  try {
    var extra = JSON.parse(localStorage.getItem("relux-products-extra")) || [];
    if (extra.length) window.RELUX_PRODUCTS = window.RELUX_PRODUCTS.concat(extra);
  } catch (e) {}
})();

/* ============================================================
   Catálogo dinâmico via Supabase (ex.: lentes Oftalsul).
   Busca a tabela "produtos" e injeta em RELUX_PRODUCTS.
   Expõe RELUX.productsReady (Promise) e RELUX.whenReady(cb)
   para as páginas renderizarem só depois que os dados chegarem.
   ============================================================ */
(function () {
  function fmtPrice(v) {
    var n = Number(v);
    if (!isFinite(n) || n <= 0) return "";
    return "R$ " + n.toFixed(2).replace(".", ",");
  }
  /* converte uma linha do banco no formato de produto do site */
  function mapRow(r) {
    return {
      id: r.id,
      brand: r.brand || "Oftalsul",
      name: r.name || r.id,
      category: r.category || "Lentes de Contato",
      img: r.img || "",
      shape: r.shape || "g-lens",
      tone: r.tone || "c",
      price: fmtPrice(r.price),
      oldPrice: r.old_price ? fmtPrice(r.old_price) : "",
      badge: r.badge || "",
      installment: r.installment || "",
      rating: "",
      reviews: "",
      colors: Array.isArray(r.colors) ? r.colors : [],
      desc: r.descricao || "",
      specs: Array.isArray(r.specs) ? r.specs : [],
      _source: "supabase",
    };
  }

  /* produtos removidos a pedido da loja (não aparecem mesmo que estejam no banco) */
  var EXCLUDED_KEYWORDS = [
    "optogel", "century", "medisoft", "medisoft", "permeafluor",
    "rgp-asfericas", "planex", "bifocal", "magic-top", "magic top",
    "torica", "dupla-face", "dupla face", "optycolor", "familia-oxy", "family oxy"
  ];
  function isExcluded(r) {
    var str = ((r.id || "") + " " + (r.name || "")).toLowerCase();
    return EXCLUDED_KEYWORDS.some(function (kw) { return str.indexOf(kw) > -1; });
  }

  var cfg = window.RELUX_CONFIG || {};
  var ready;
  if (!cfg.supabaseUrl || !cfg.supabaseKey) {
    ready = Promise.resolve(); // sem config = só produtos locais
  } else {
    var url = cfg.supabaseUrl.replace(/\/+$/, "") +
      "/rest/v1/produtos?select=*&active=eq.true&order=sort.asc";
    ready = fetch(url, {
      headers: { apikey: cfg.supabaseKey, Authorization: "Bearer " + cfg.supabaseKey },
    })
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (rows) {
        var have = {};
        window.RELUX_PRODUCTS.forEach(function (p) { have[p.id] = true; });
        (rows || []).forEach(function (r) {
          if (!have[r.id] && !isExcluded(r)) window.RELUX_PRODUCTS.push(mapRow(r));
        });
      })
      .catch(function () { /* offline/erro: mantém produtos locais */ });
  }

  window.RELUX.productsReady = ready;
  /* chama cb quando DOM + produtos do Supabase estiverem prontos */
  window.RELUX.whenReady = function (cb) {
    function go() { ready.then(function () { try { cb(); } catch (e) {} }); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
    else go();
  };
})();

window.RELUX.findProduct = function (id) {
  return (window.RELUX_PRODUCTS || []).filter(function (p) { return p.id === id; })[0] || null;
};

/* monta a "moldura" da mídia: foto (se houver) + SVG de fallback */
window.RELUX.mediaInner = function (p, extra) {
  var img = p.img
    ? '<img class="frame-photo" src="' + p.img + '" alt="' + p.name +
      '" loading="lazy" onerror="this.closest(\'[data-tone]\').classList.remove(\'has-photo\'); this.remove();">'
    : "";
  return (extra || "") + img + '<svg viewBox="0 0 200 80" aria-hidden="true"><use href="#' + p.shape + '"/></svg>';
};

/* ícone de coração (favoritar) reutilizável */
window.RELUX.heartSVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.3C.7 9 1.6 5.7 4.7 4.8 6.8 4.2 9 5 12 8c3-3 5.2-3.8 7.3-3.2 3.1.9 4 4.2 2.7 6.9C19.5 16.4 12 21 12 21Z"/></svg>';

/* Build a product card: link p/ a página + coração (favoritos) + adicionar à sacola */
window.RELUX.cardHTML = function (p) {
  var badge = p.badge ? '<span class="badge">' + p.badge + "</span>" : "";
  var old = p.oldPrice ? '<span class="old">' + p.oldPrice + "</span>" : "";
  var cls = "product-media" + (p.img ? " has-photo" : "");
  return (
    '<div class="product" data-id="' + p.id + '">' +
      '<button class="fav-btn" type="button" data-fav="' + p.id + '" aria-label="Adicionar aos favoritos">' + window.RELUX.heartSVG + "</button>" +
      '<a class="product-link" href="produto.html?id=' + p.id + '">' +
        '<div class="' + cls + '" data-tone="' + p.tone + '">' +
          window.RELUX.mediaInner(p, badge) +
        "</div>" +
        '<div class="product-body">' +
          '<span class="product-brand">' + p.brand + "</span>" +
          '<h3 class="product-name">' + p.name + "</h3>" +
          '<div class="product-price">' + old + '<span class="now">' + p.price + "</span></div>" +
          '<span class="installment">' + p.installment + "</span>" +
        "</div>" +
      "</a>" +
      '<div class="product-foot">' +
        '<button class="btn btn-primary btn-block add-btn" type="button" data-add="' + p.id + '">Adicionar à sacola</button>' +
      "</div>" +
    "</div>"
  );
};

/* normaliza texto p/ busca (minúsculo, sem acento) */
window.RELUX.normalize = function (s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
};
/* texto pesquisável de um produto (nome, marca, categoria, descrição, specs, cores) */
window.RELUX.searchText = function (p) {
  var parts = [p.name, p.brand, p.category, p.desc].concat(p.colors || []);
  (p.specs || []).forEach(function (s) { parts.push(s[0], s[1]); });
  return window.RELUX.normalize(parts.join(" "));
};
/* busca estilo Mercado Livre: todos os termos precisam aparecer (AND) */
window.RELUX.search = function (query, opts) {
  opts = opts || {};
  var list = window.RELUX_PRODUCTS || [];
  if (opts.category) list = list.filter(function (p) { return p.category === opts.category; });
  var q = window.RELUX.normalize(query).trim();
  if (!q) return list.slice();
  var terms = q.split(/\s+/);
  return list.filter(function (p) {
    var txt = window.RELUX.searchText(p);
    return terms.every(function (t) { return txt.indexOf(t) > -1; });
  });
};

/* Auto-render the homepage featured grid if present (apenas destaques) */
window.RELUX.whenReady(function () {
  var grid = document.getElementById("productGrid");
  if (grid && !grid.getAttribute("data-rendered")) {
    var FEAT = ["rb-3025", "rb-2140-black", "rb-4171", "rb-3016", "rb-5397", "rb-7330", "rb-8901", "rb-9060s"];
    var featured = window.RELUX_PRODUCTS.filter(function (p) { return FEAT.indexOf(p.id) > -1; });
    if (!featured.length) featured = window.RELUX_PRODUCTS.slice(0, 8);
    grid.innerHTML = featured.map(window.RELUX.cardHTML).join("");
    grid.setAttribute("data-rendered", "1");
  }
});
