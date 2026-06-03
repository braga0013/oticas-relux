/* ÓTICAS RELUX — renderiza a página de produto a partir de ?id= */
(function () {
  "use strict";
  function qs(name) {
    var m = new RegExp("[?&]" + name + "=([^&]+)").exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function el(id) { return document.getElementById(id); }
  function set(id, txt) { var e = el(id); if (e) e.textContent = txt; }

  var WA = (window.RELUX_CONFIG && window.RELUX_CONFIG.whatsapp) || "5500000000000";
  var list = window.RELUX_PRODUCTS || [];
  var id = qs("id");
  var p = (window.RELUX && window.RELUX.findProduct(id)) || list[0];
  if (!p) return;

  /* título + breadcrumb */
  document.title = p.name + " — Óticas Relux";
  set("pdpName", p.name);
  set("pdpName2", p.name);
  set("pdpBrand", p.brand);
  set("pdpCat", p.category);
  var catLink = el("pdpCatLink");
  if (catLink) catLink.href = "index.html#colecoes";

  /* badge */
  var badge = el("pdpBadge");
  if (badge) { if (p.badge) { badge.textContent = p.badge; badge.style.display = ""; } else { badge.style.display = "none"; } }

  /* imagem principal + tom */
  var media = el("pdpMedia");
  if (media) media.setAttribute("data-tone", p.tone);
  var use = el("pdpUse");
  if (use) use.setAttribute("href", "#" + p.shape);

  /* foto real (com fallback automático para o SVG) */
  if (media && p.img) {
    media.classList.add("has-photo");
    var img = document.createElement("img");
    img.className = "frame-photo";
    img.src = p.img;
    img.alt = p.name;
    img.onerror = function () { media.classList.remove("has-photo"); this.remove(); };
    media.insertBefore(img, media.querySelector("svg"));
  }

  /* preço */
  var oldEl = el("pdpOld");
  if (oldEl) { if (p.oldPrice) { oldEl.textContent = p.oldPrice; oldEl.style.display = ""; } else { oldEl.style.display = "none"; } }
  set("pdpNow", p.price);
  set("pdpInstallment", p.installment);

  /* rating */
  set("pdpRating", p.rating + " · " + p.reviews + " avaliações");

  /* cores → chips */
  var colors = el("pdpColors");
  if (colors && p.colors) {
    colors.innerHTML =
      '<span class="label">Cor</span><div class="chips">' +
      p.colors.map(function (c, i) {
        return '<button type="button" class="chip' + (i === 0 ? " active" : "") + '">' + c + "</button>";
      }).join("") +
      "</div>";
    colors.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        colors.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
      });
    });
  }

  /* descrição + specs */
  set("pdpDesc", p.desc);
  var specs = el("pdpSpecs");
  if (specs && p.specs) {
    specs.innerHTML = p.specs.map(function (row) {
      return "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td></tr>";
    }).join("");
  }

  /* miniaturas — quadrados brancos no mesmo estilo da imagem principal.
     Usa p.gallery se houver; senão repete a foto para manter as 3 miniaturas. */
  var thumbs = el("pdpThumbs");
  if (thumbs) {
    var gallery;
    if (p.gallery && p.gallery.length) gallery = p.gallery;
    else if (p.img) gallery = [p.img, p.img, p.img];
    else gallery = [];

    if (gallery.length) {
      thumbs.innerHTML = gallery.map(function (src, i) {
        return '<button type="button" class="thumb' + (i === 0 ? " active" : "") + '" aria-label="Vista ' + (i + 1) + '">' +
          '<img src="' + src + '" alt="" loading="lazy"></button>';
      }).join("");
    } else {
      thumbs.innerHTML = [0, 1, 2].map(function (i) {
        return '<button type="button" class="thumb is-svg' + (i === 0 ? " active" : "") + '" aria-label="Vista ' + (i + 1) + '">' +
          '<svg viewBox="0 0 200 80" aria-hidden="true"><use href="#' + p.shape + '"/></svg></button>';
      }).join("");
    }
    thumbs.querySelectorAll(".thumb").forEach(function (t, i) {
      t.addEventListener("click", function () {
        thumbs.querySelectorAll(".thumb").forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        if (img && gallery[i]) img.src = gallery[i];
      });
    });
  }

  /* botões: adicionar à sacola, favoritar, comprar agora */
  var add = el("pdpAdd"); if (add) add.setAttribute("data-add", p.id);
  var favBtn = el("pdpFav"); if (favBtn) favBtn.setAttribute("data-fav", p.id);
  var buyMsg = "Olá! Quero comprar o " + p.name + " (" + p.brand + ") — " + p.price + ".";
  var buy = el("pdpBuy");
  if (buy) buy.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(buyMsg);

  /* relacionados */
  var rel = el("relatedGrid");
  if (rel && window.RELUX) {
    var others = list.filter(function (x) { return x.id !== p.id; }).slice(0, 4);
    rel.innerHTML = others.map(window.RELUX.cardHTML).join("");
  }

  /* sincroniza corações + contadores (já com PDP e relacionados no DOM) */
  if (window.RELUX && window.RELUX.refreshUI) window.RELUX.refreshUI();
})();
