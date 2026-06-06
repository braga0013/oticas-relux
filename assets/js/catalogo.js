/* ÓTICAS RELUX — Catálogo: filtra por categoria (?cat=) e busca (?q=) */
(function () {
  "use strict";
  window.__reluxCatalog = true; // sinaliza ao main.js para não redirecionar a busca aqui
  var R = window.RELUX || {};
  function el(id) { return document.getElementById(id); }
  function param(n) { var m = new RegExp("[?&]" + n + "=([^&]*)").exec(location.search); return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : ""; }
  function parseBRL(s) { return R.parseBRL ? R.parseBRL(s) : parseFloat(String(s).replace(/[^\d,]/g, "").replace(",", ".")) || 0; }

  var state = { cat: param("cat"), q: param("q"), sort: "rel" };

  function applySort(list) {
    var a = list.slice();
    if (state.sort === "menor") a.sort(function (x, y) { return parseBRL(x.price) - parseBRL(y.price); });
    else if (state.sort === "maior") a.sort(function (x, y) { return parseBRL(y.price) - parseBRL(x.price); });
    else if (state.sort === "nome") a.sort(function (x, y) { return x.name.localeCompare(y.name, "pt-BR"); });
    return a;
  }

  function syncURL() {
    var qs = [];
    if (state.cat) qs.push("cat=" + encodeURIComponent(state.cat));
    if (state.q) qs.push("q=" + encodeURIComponent(state.q));
    history.replaceState(null, "", "catalogo.html" + (qs.length ? "?" + qs.join("&") : ""));
  }

  function render() {
    var list = R.search ? R.search(state.q, { category: state.cat || undefined }) : [];
    list = applySort(list);

    // título / crumb
    var title = state.cat || "Todos os produtos";
    if (state.q) title = 'Resultados para "' + state.q + '"';
    el("catTitle").textContent = title;
    el("catCrumb").textContent = state.cat ? state.cat : (state.q ? "Busca" : "Catálogo");
    el("catCount").textContent = list.length + (list.length === 1 ? " produto encontrado" : " produtos encontrados");

    // grid
    var grid = el("catGrid"), empty = el("catEmpty");
    if (!list.length) {
      grid.innerHTML = ""; empty.hidden = false;
    } else {
      empty.hidden = true;
      grid.innerHTML = list.map(R.cardHTML).join("");
    }

    // chips ativos
    document.querySelectorAll("#catChips .chip").forEach(function (c) {
      c.classList.toggle("active", (c.getAttribute("data-cat") || "") === (state.cat || ""));
    });

    // inputs refletindo a busca
    document.querySelectorAll(".js-search-input").forEach(function (i) { if (i.value !== state.q) i.value = state.q; });

    syncURL();
    if (R.refreshUI) R.refreshUI();
  }

  function init() {
    // chips
    el("catChips").addEventListener("click", function (e) {
      var c = e.target.closest(".chip"); if (!c) return;
      state.cat = c.getAttribute("data-cat") || "";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // ordenar
    el("catSort").addEventListener("change", function () { state.sort = el("catSort").value; render(); });

    // busca (input grande + qualquer .js-search-input desta página) — ao vivo, com debounce
    var tmr;
    document.querySelectorAll(".js-search-input").forEach(function (inp) {
      inp.addEventListener("input", function () {
        clearTimeout(tmr);
        var v = inp.value;
        tmr = setTimeout(function () { state.q = v.trim(); render(); }, 180);
      });
    });
    // impede que o submit dos forms recarregue a página (busca já é ao vivo)
    document.querySelectorAll(".js-search-form").forEach(function (f) {
      f.addEventListener("submit", function (e) { e.preventDefault(); var i = f.querySelector(".js-search-input"); state.q = (i.value || "").trim(); render(); });
    });

    var clear = el("catClear");
    if (clear) clear.addEventListener("click", function () { state.q = ""; state.cat = ""; render(); });

    render();
    /* re-renderiza quando o catálogo do Supabase terminar de carregar */
    if (R.whenReady) R.whenReady(render);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
