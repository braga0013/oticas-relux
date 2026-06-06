/* ÓTICAS RELUX — interactions */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------- Theme: persist + respect system, default dark ---------- */
  var STORE = "relux-theme";
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    var tog = document.getElementById("themeToggle");
    if (tog) tog.setAttribute("aria-pressed", String(t === "light"));
  }
  // Light is the default (set in <html data-theme="light">). Only a saved
  // choice overrides it, so the visitor's last preference is respected.
  try {
    var saved = localStorage.getItem(STORE);
    if (saved === "dark" || saved === "light") applyTheme(saved);
  } catch (e) { /* storage blocked — keep default light */ }

  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem(STORE, next); } catch (e) {}
    });
  }

  /* ---------- Nav: shadow on scroll ---------- */
  var navWrap = document.getElementById("navWrap");
  function onScroll() {
    if (!navWrap) return;
    navWrap.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("hamburger");
  var menu = document.getElementById("mobileMenu");
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.classList.toggle("open", open);
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (burger) burger.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  if (menu) {
    menu.querySelectorAll("[data-link]").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ---------- Scroll reveal (staggered) ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var d = parseInt(en.target.getAttribute("data-delay") || "0", 10);
          setTimeout(function () { en.target.classList.add("in"); }, d);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Busca da navbar → vai para o catálogo (exceto na própria página de catálogo) ---------- */
  document.querySelectorAll(".js-search-form").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      if (window.__reluxCatalog) return; // no catálogo a busca é ao vivo (catalogo.js cuida)
      e.preventDefault();
      var inp = f.querySelector(".js-search-input");
      var q = (inp && inp.value || "").trim();
      window.location.href = "catalogo.html" + (q ? "?q=" + encodeURIComponent(q) : "");
    });
  });

  /* ---------- Footer year ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Rastreio de visitas ---------- */
  try {
    var visKey = "relux-visits";
    var vis = JSON.parse(localStorage.getItem(visKey)) || { total: 0, hoje: 0, diaAtual: "" };
    var hoje = new Date().toISOString().slice(0, 10);
    if (vis.diaAtual !== hoje) { vis.hoje = 0; vis.diaAtual = hoje; }
    vis.total += 1; vis.hoje += 1;
    localStorage.setItem(visKey, JSON.stringify(vis));
  } catch (e) {}
})();
