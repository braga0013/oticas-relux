/* ÓTICAS RELUX — renderiza a página de produto a partir de ?id= */
(function () {
  "use strict";
  function qs(name) {
    var m = new RegExp("[?&]" + name + "=([^&]+)").exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function el(id) { return document.getElementById(id); }
  function set(id, txt) { var e = el(id); if (e) e.textContent = txt; }

  function run() {
  var WA = (window.RELUX_CONFIG && window.RELUX_CONFIG.whatsapp) || "5551995963008";
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
  if (catLink) catLink.href = "/#colecoes";

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
    img.onload = function () { window.RELUX.fitPhoto(this); };
    media.insertBefore(img, media.querySelector("svg"));
  }

  /* preço */
  var oldEl = el("pdpOld");
  if (oldEl) { if (p.oldPrice) { oldEl.textContent = p.oldPrice; oldEl.style.display = ""; } else { oldEl.style.display = "none"; } }
  set("pdpNow", p.price);
  set("pdpInstallment", p.installment);

  /* rating (oculta quando o produto não tem avaliações, ex.: lentes do catálogo) */
  if (p.reviews) set("pdpRating", p.rating + " · " + p.reviews + " avaliações");
  else { var rtEl = el("pdpRating"); if (rtEl) rtEl.style.display = "none"; }

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
  var buy = el("pdpBuy");
  if (buy) {
    buy.removeAttribute("href");
    buy.setAttribute("data-add", p.id);
  }

  /* relacionados */
  var rel = el("relatedGrid");
  if (rel && window.RELUX) {
    var others = list.filter(function (x) { return x.id !== p.id; }).slice(0, 4);
    rel.innerHTML = others.map(window.RELUX.cardHTML).join("");
  }

  /* sincroniza corações + contadores (já com PDP e relacionados no DOM) */
  if (window.RELUX && window.RELUX.refreshUI) window.RELUX.refreshUI();

  /* ── Schema.org (Google Shopping) ── */
  /* p.img pode ser caminho relativo (lentes locais) OU URL completa do Supabase
     Storage (fotos cadastradas no admin). Concatenar origin sempre gerava
     ".../https://..." nas fotos do Storage e o Google descarta o produto, já que
     "image" é obrigatório. */
  function absUrl(src) {
    if (!src) return "";
    return /^https?:\/\//.test(src) ? src : window.location.origin + "/" + src.replace(/^\/+/, "");
  }
  var priceNum = p.price.replace(/[^\d,]/g, "").replace(",", ".");
  var schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "description": p.desc || "",
    "sku": p.id,
    "brand": { "@type": "Brand", "name": p.brand },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "BRL",
      "price": priceNum,
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };
  if (p.img) schemaData.image = absUrl(p.img);
  var schemaScript = document.createElement("script");
  schemaScript.type = "application/ld+json";
  schemaScript.textContent = JSON.stringify(schemaData);
  document.head.appendChild(schemaScript);

  /* ── Open Graph dinâmico ── */
  function setMeta(prop, content, isName) {
    var attr = isName ? "name" : "property";
    var el = document.querySelector('meta[' + attr + '="' + prop + '"]');
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, prop); document.head.appendChild(el); }
    el.setAttribute("content", content);
  }
  setMeta("og:title", p.name + " — Óticas Relux");
  setMeta("og:description", p.desc || "");
  setMeta("og:type", "og:product");
  setMeta("og:price:amount", priceNum);
  setMeta("og:price:currency", "BRL");
  setMeta("product:availability", "in stock");
  setMeta("product:condition", "new");
  if (p.img) setMeta("og:image", absUrl(p.img));
  setMeta("description", (p.desc || "").replace(/\s+/g, " ").trim().slice(0, 155), true);
  document.title = p.name + " — Óticas Relux";

  /* canonical por produto (evita URLs duplicadas no Google) */
  var canon = document.querySelector('link[rel="canonical"]');
  if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
  canon.href = window.location.origin + "/produto?id=" + encodeURIComponent(p.id);
  setMeta("og:url", canon.href);
  }

  /* espera DOM + catálogo do Supabase antes de renderizar */
  if (window.RELUX && window.RELUX.whenReady) window.RELUX.whenReady(run);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
