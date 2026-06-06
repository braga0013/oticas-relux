/* ÓTICAS RELUX — Página de Favoritos */
(function () {
  "use strict";

  var FAV_KEY = "relux-fav";

  function getFavIds() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  }

  function parseBRL(s) {
    if (typeof s !== "string") return 0;
    var n = parseFloat(s.replace(/[^\d,]/g, "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  }

  function sortProducts(products, mode) {
    var arr = products.slice();
    if (mode === "menor") arr.sort(function (a, b) { return parseBRL(a.price) - parseBRL(b.price); });
    else if (mode === "maior") arr.sort(function (a, b) { return parseBRL(b.price) - parseBRL(a.price); });
    else if (mode === "nome") arr.sort(function (a, b) { return a.name.localeCompare(b.name, "pt-BR"); });
    return arr;
  }

  function render() {
    var ids = getFavIds();
    var sortMode = (document.getElementById("favSort") || {}).value || "rel";

    var products = ids.map(function (id) {
      return window.RELUX && window.RELUX.findProduct ? window.RELUX.findProduct(id) : null;
    }).filter(Boolean);

    if (sortMode !== "rel") products = sortProducts(products, sortMode);

    var grid    = document.getElementById("favGrid");
    var empty   = document.getElementById("favEmpty");
    var countEl = document.getElementById("favPageCount");
    var clearBtn = document.getElementById("favClearAll");
    var toolbar  = document.getElementById("favToolbar");

    if (!grid) return;

    var n = products.length;
    if (countEl) countEl.textContent = n === 0 ? "Nenhum produto salvo" : n + (n === 1 ? " produto salvo" : " produtos salvos");

    if (n === 0) {
      grid.innerHTML = "";
      if (empty) empty.removeAttribute("hidden");
      if (clearBtn) clearBtn.setAttribute("hidden", "");
      if (toolbar) toolbar.style.display = "none";
    } else {
      if (empty) empty.setAttribute("hidden", "");
      if (clearBtn) clearBtn.removeAttribute("hidden");
      if (toolbar) toolbar.style.display = "";
      grid.innerHTML = products.map(function (p) {
        return window.RELUX.cardHTML ? window.RELUX.cardHTML(p) : "";
      }).join("");
      if (window.RELUX.refreshUI) window.RELUX.refreshUI();
    }
  }

  function confirmClear() {
    if (!confirm("Remover todos os favoritos?")) return;
    try { localStorage.setItem(FAV_KEY, JSON.stringify([])); } catch (e) {}
    if (window.RELUX && window.RELUX.refreshUI) window.RELUX.refreshUI();
    render();
  }

  function init() {
    var clearBtn = document.getElementById("favClearAll");
    if (clearBtn) clearBtn.addEventListener("click", confirmClear);

    var sortEl = document.getElementById("favSort");
    if (sortEl) sortEl.addEventListener("change", render);

    /* re-renderiza quando o store.js emite mudança de favoritos */
    document.addEventListener("relux:change", render);

    render();
    /* re-renderiza quando o catálogo do Supabase terminar de carregar */
    if (window.RELUX && window.RELUX.whenReady) window.RELUX.whenReady(render);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
