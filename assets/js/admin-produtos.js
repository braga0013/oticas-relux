/* Óticas Relux — Admin Produtos (Supabase via /api/admin) */
(function () {
  "use strict";

  var API = "/api/admin";

  /* ── helpers DOM ── */
  function el(id) { return document.getElementById(id); }
  function val(id) { return (el(id) && el(id).value || "").trim(); }
  function setVal(id, v) { if (el(id)) el(id).value = v == null ? "" : v; }

  /* ── toast ── */
  var toastTimer;
  function toast(msg, err) {
    var t = el("toast");
    t.textContent = msg;
    t.className = "toast show" + (err ? " err" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, 3200);
  }

  /* ── auth ── */
  function getAuth() { try { return JSON.parse(sessionStorage.getItem("relux-adm")) || null; } catch (e) { return null; } }
  function setAuth(u, p) { sessionStorage.setItem("relux-adm", JSON.stringify({ u: u, p: p })); }
  function clearAuth() { sessionStorage.removeItem("relux-adm"); }

  function checkLogin() {
    var a = getAuth();
    if (a && a.u && a.p) {
      showAdmin();
    } else {
      el("loginWrap").style.display = "";
      el("admApp").classList.remove("visible");
    }
  }

  function showAdmin() {
    el("loginWrap").style.display = "none";
    el("admApp").classList.add("visible");
    loadProducts();
  }

  el("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var u = val("loginUser"), p = val("loginPass");
    if (!u || !p) { el("loginErr").style.display = ""; return; }
    var btn = el("loginForm").querySelector("button[type=submit]");
    if (btn) btn.disabled = true;
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-User": u, "X-Admin-Pass": p },
      body: JSON.stringify({ action: "ping" })
    }).then(function (r) {
      if (btn) btn.disabled = false;
      if (r.ok) {
        setAuth(u, p);
        el("loginErr").style.display = "none";
        showAdmin();
      } else {
        el("loginErr").style.display = "";
      }
    }).catch(function () {
      if (btn) btn.disabled = false;
      el("loginErr").style.display = "";
    });
  });

  el("logoutBtn").addEventListener("click", function () {
    clearAuth();
    checkLogin();
  });

  /* ── API call ── */
  function api(body) {
    var a = getAuth() || {};
    return fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-User": a.u || "",
        "X-Admin-Pass": a.p || "",
      },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error(d.error || "Erro " + r.status);
        return d;
      });
    });
  }

  /* ── State ── */
  var allProducts = [];
  var editId = null; // null = novo produto
  var colorsList = [];
  var gallery = [];

  /* ── Load produtos ── */
  function loadProducts() {
    el("prodTbody").innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted)">Carregando...</td></tr>';
    api({ action: "list" })
      .then(function (data) {
        allProducts = data || [];
        renderStats();
        renderTable();
      })
      .catch(function (e) {
        el("prodTbody").innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#ef4444">' + e.message + '</td></tr>';
        if (e.message && e.message.indexOf("SUPABASE_SERVICE_KEY") > -1) {
          toast("Configure SUPABASE_SERVICE_KEY no Vercel!", true);
        }
      });
  }

  /* ── Stats ── */
  function renderStats() {
    var total = allProducts.length;
    var ativos = allProducts.filter(function (p) { return p.active; }).length;
    var sol = allProducts.filter(function (p) { return p.category === "Óculos de Sol"; }).length;
    var grau = allProducts.filter(function (p) { return p.category === "Óculos de Grau"; }).length;
    el("statsBar").innerHTML = [
      ["Total", total],
      ["Ativos", ativos],
      ["Sol", sol],
      ["Grau", grau],
    ].map(function (s) {
      return '<div class="stat"><div class="stat-n">' + s[1] + '</div><div class="stat-l">' + s[0] + '</div></div>';
    }).join("");
  }

  /* ── Filtros ── */
  function getFiltered() {
    var q = (el("searchQ") && el("searchQ").value || "").toLowerCase().trim();
    var cat = val("filterCat");
    var status = val("filterStatus");
    return allProducts.filter(function (p) {
      if (cat && p.category !== cat) return false;
      if (status === "1" && !p.active) return false;
      if (status === "0" && p.active) return false;
      if (q) {
        var txt = [(p.name || ""), (p.brand || ""), (p.id || ""), (p.category || "")].join(" ").toLowerCase();
        if (txt.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  el("searchQ").addEventListener("input", renderTable);
  el("filterCat").addEventListener("change", renderTable);
  el("filterStatus").addEventListener("change", renderTable);

  /* ── Render tabela ── */
  function renderTable() {
    var list = getFiltered();
    if (!list.length) {
      el("prodTbody").innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted)">Nenhum produto encontrado.</td></tr>';
      return;
    }
    el("prodTbody").innerHTML = list.map(function (p) {
      var thumb = p.img
        ? '<img class="thumb" src="' + p.img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
        : '<div class="thumb-ph">sem foto</div>';
      var priceStr = p.price != null ? "R$ " + Number(p.price).toFixed(2).replace(".", ",") : "—";
      return '<tr data-id="' + p.id + '">' +
        '<td>' + thumb + '</td>' +
        '<td><strong>' + (p.name || "") + '</strong><br><span style="font-size:.75rem;color:var(--muted)">' + (p.id || "") + '</span></td>' +
        '<td>' + (p.brand || "") + '</td>' +
        '<td><span class="badge-cat">' + (p.category || "") + '</span></td>' +
        '<td>' + priceStr + '</td>' +
        '<td><label class="toggle"><input type="checkbox" ' + (p.active ? "checked" : "") + ' data-toggle="' + p.id + '" /><span class="toggle-slider"></span></label></td>' +
        '<td><div class="row-actions"><button class="btn-edit" data-edit="' + p.id + '">Editar</button><button class="btn-del" data-del="' + p.id + '">Excluir</button></div></td>' +
        '</tr>';
    }).join("");

    /* toggle active */
    el("prodTbody").querySelectorAll("[data-toggle]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var id = cb.getAttribute("data-toggle");
        api({ action: "update", id: id, data: { active: cb.checked } })
          .then(function () {
            var p = allProducts.find(function (x) { return x.id === id; });
            if (p) p.active = cb.checked;
            renderStats();
            toast(cb.checked ? "Produto ativado." : "Produto desativado.");
          })
          .catch(function (e) { toast(e.message, true); cb.checked = !cb.checked; });
      });
    });

    /* edit */
    el("prodTbody").querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var p = allProducts.find(function (x) { return x.id === btn.getAttribute("data-edit"); });
        if (p) openDrawer(p);
      });
    });

    /* delete */
    el("prodTbody").querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-del");
        var p = allProducts.find(function (x) { return x.id === id; });
        if (!confirm('Excluir "' + (p ? p.name : id) + '"? Esta ação não pode ser desfeita.')) return;
        api({ action: "delete", id: id })
          .then(function () {
            allProducts = allProducts.filter(function (x) { return x.id !== id; });
            renderStats();
            renderTable();
            toast("Produto excluído.");
          })
          .catch(function (e) { toast(e.message, true); });
      });
    });
  }

  /* ── Drawer ── */
  function openDrawer(p) {
    editId = p ? p.id : null;
    el("drawerTitle").textContent = p ? "Editar Produto" : "Novo Produto";
    el("saveMsg").textContent = "";

    /* preenche campos */
    setVal("fId", p ? p.id : "");
    el("fId").disabled = !!p; /* ID não pode mudar depois de criado */
    setVal("fBrand", p ? p.brand : "Ray-Ban");
    setVal("fName", p ? p.name : "");
    setVal("fCat", p ? p.category : "");
    setVal("fSort", p ? p.sort : 100);
    setVal("fPrice", p ? p.price : "");
    setVal("fOldPrice", p ? p.old_price : "");
    setVal("fBadge", p ? p.badge : "");
    setVal("fInstallment", p ? p.installment : "");
    setVal("fShape", p ? (p.shape || "g-sun") : "g-sun");
    setVal("fTone", p ? (p.tone || "a") : "a");
    setVal("fDesc", p ? p.descricao : "");
    el("fActive").checked = p ? !!p.active : true;

    /* imagem principal */
    setVal("fImg", p ? (p.img || "") : "");
    el("mainImgPreview").style.display = p && p.img ? "block" : "none";
    if (p && p.img) el("mainImgPreview").src = p.img;
    el("mainImgHint").style.display = p && p.img ? "none" : "";

    /* galeria */
    gallery = p && Array.isArray(p.gallery) ? p.gallery.slice() : [];
    renderGallery();

    /* cores */
    colorsList = [];
    var rawColors = p ? (p.colors || []) : [];
    rawColors.forEach(function (c) { if (c) colorsList.push(typeof c === "string" ? c : (c.name || "")); });
    renderTags();

    /* specs */
    var specs = p && Array.isArray(p.specs) ? p.specs : [];
    el("specsRows").innerHTML = "";
    specs.forEach(function (s) { addSpecRow(s[0] || "", s[1] || ""); });

    el("drawerOverlay").classList.add("open");
    el("drawer").classList.add("open");
    el("drawer").querySelector("input:not([disabled])").focus();
  }

  function closeDrawer() {
    el("drawerOverlay").classList.remove("open");
    el("drawer").classList.remove("open");
    editId = null;
  }

  el("newBtn").addEventListener("click", function () { openDrawer(null); });
  el("drawerClose").addEventListener("click", closeDrawer);
  el("drawerCancelBtn").addEventListener("click", closeDrawer);
  el("drawerOverlay").addEventListener("click", closeDrawer);

  /* ── Image upload (main) ── */
  el("mainImgFile").addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    el("mainUploadProg").style.display = "";
    el("mainImgHint").style.display = "none";
    uploadFile(file, function (url) {
      el("mainUploadProg").style.display = "none";
      setVal("fImg", url);
      el("mainImgPreview").src = url;
      el("mainImgPreview").style.display = "block";
    }, function (err) {
      el("mainUploadProg").style.display = "none";
      el("mainImgHint").style.display = "";
      toast(err, true);
    });
  });

  el("fImg").addEventListener("input", function () {
    var url = this.value.trim();
    if (url) { el("mainImgPreview").src = url; el("mainImgPreview").style.display = "block"; el("mainImgHint").style.display = "none"; }
    else { el("mainImgPreview").style.display = "none"; el("mainImgHint").style.display = ""; }
  });

  /* ── Gallery ── */
  el("galleryFile").addEventListener("change", function () {
    var file = this.files[0];
    if (!file) return;
    this.disabled = true;
    uploadFile(file, function (url) {
      el("galleryFile").disabled = false;
      el("galleryFile").value = "";
      gallery.push(url);
      renderGallery();
      toast("Foto adicionada à galeria.");
    }, function (err) {
      el("galleryFile").disabled = false;
      el("galleryFile").value = "";
      toast(err, true);
    });
  });

  function renderGallery() {
    var grid = el("galleryGrid");
    grid.innerHTML = gallery.map(function (url, i) {
      return '<div class="gallery-item">' +
        '<img src="' + url + '" alt="" loading="lazy">' +
        '<button class="gallery-rm" data-gi="' + i + '" title="Remover">✕</button>' +
        '</div>';
    }).join("");
    grid.querySelectorAll(".gallery-rm").forEach(function (btn) {
      btn.addEventListener("click", function () {
        gallery.splice(Number(btn.getAttribute("data-gi")), 1);
        renderGallery();
      });
    });
  }

  /* ── Cores / Tags ── */
  function addTag(name) {
    name = name.trim();
    if (!name || colorsList.indexOf(name) > -1) return;
    colorsList.push(name);
    renderTags();
  }

  function renderTags() {
    var wrap = el("colorsTags");
    wrap.querySelectorAll(".tag").forEach(function (t) { t.remove(); });
    var input = el("colorsInput");
    colorsList.forEach(function (c) {
      var tag = document.createElement("span");
      tag.className = "tag";
      tag.innerHTML = c + '<button class="tag-rm" data-tag="' + c + '" title="Remover">✕</button>';
      tag.querySelector(".tag-rm").addEventListener("click", function () {
        colorsList = colorsList.filter(function (x) { return x !== c; });
        renderTags();
      });
      wrap.insertBefore(tag, input);
    });
  }

  el("colorsInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(this.value.replace(/,$/, ""));
      this.value = "";
    }
    if (e.key === "Backspace" && !this.value && colorsList.length) {
      colorsList.pop();
      renderTags();
    }
  });
  el("colorsInput").addEventListener("blur", function () {
    if (this.value.trim()) { addTag(this.value); this.value = ""; }
  });
  el("colorsTags").addEventListener("click", function () { el("colorsInput").focus(); });

  /* ── Specs ── */
  function addSpecRow(k, v) {
    var row = document.createElement("div");
    row.className = "spec-row";
    row.innerHTML =
      '<input placeholder="Característica (ex: Material)" value="' + (k || "") + '" />' +
      '<input placeholder="Valor (ex: Acetato)" value="' + (v || "") + '" />' +
      '<button class="spec-rm" title="Remover">✕</button>';
    row.querySelector(".spec-rm").addEventListener("click", function () { row.remove(); });
    el("specsRows").appendChild(row);
  }
  el("addSpecBtn").addEventListener("click", function () { addSpecRow("", ""); });

  /* ── Upload helper (com compressão para respeitar limite 1MB do Vercel) ──
     Não recortamos a foto aqui: o enquadramento é resolvido no CSS
     (.frame-photo.is-tall em styles.css), que preenche a moldura sem depender
     de detectar o fundo — as fotos da loja têm fundo em degradê e qualquer
     heurística de pixel erra nelas. */
  function compressImage(file, callback) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      var MAX = 1200; /* px no lado maior */
      var scale = Math.min(1, MAX / Math.max(img.width, img.height));
      var w = Math.round(img.width * scale);
      var h = Math.round(img.height * scale);
      var canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL("image/jpeg", 0.82).split(",")[1], "image/jpeg");
    };
    img.onerror = function () { callback(null, null); };
    img.src = url;
  }

  function uploadFile(file, onSuccess, onError) {
    var a = getAuth() || {};
    compressImage(file, function (base64, mime) {
      if (!base64) { onError("Não foi possível processar a imagem."); return; }
      fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-User": a.u || "",
          "X-Admin-Pass": a.p || "",
        },
        body: JSON.stringify({ action: "upload", filename: file.name.replace(/\.[^.]+$/, ".jpg"), base64: base64, mime: mime }),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.url) onSuccess(d.url);
          else onError(d.error || "Erro no upload.");
        })
        .catch(function (e) { onError(e.message); });
    });
  }

  /* ── Salvar ── */
  el("saveBtn").addEventListener("click", function () {
    var id = val("fId");
    if (!id) { toast("ID é obrigatório.", true); return; }
    if (!val("fName")) { toast("Nome é obrigatório.", true); return; }
    if (!val("fBrand")) { toast("Marca é obrigatória.", true); return; }
    if (!val("fCat")) { toast("Categoria é obrigatória.", true); return; }
    if (!val("fPrice")) { toast("Preço é obrigatório.", true); return; }

    /* specs */
    var specs = [];
    el("specsRows").querySelectorAll(".spec-row").forEach(function (row) {
      var inputs = row.querySelectorAll("input");
      var k = (inputs[0] && inputs[0].value || "").trim();
      var v = (inputs[1] && inputs[1].value || "").trim();
      if (k && v) specs.push([k, v]);
    });

    var data = {
      brand: val("fBrand"),
      name: val("fName"),
      category: val("fCat"),
      sort: parseInt(val("fSort") || "100", 10) || 100,
      img: val("fImg") || null,
      gallery: gallery.slice(),
      shape: val("fShape") || "g-sun",
      tone: val("fTone") || "a",
      price: parseFloat(val("fPrice")) || 0,
      old_price: val("fOldPrice") ? parseFloat(val("fOldPrice")) : null,
      badge: val("fBadge") || "",
      installment: val("fInstallment") || "",
      colors: colorsList.slice(),
      descricao: val("fDesc") || "",
      specs: specs,
      active: el("fActive").checked,
    };
    if (!editId) data.id = id; /* só no create */

    el("saveBtn").disabled = true;
    el("saveMsg").textContent = "Salvando...";

    var action = editId ? "update" : "create";
    var payload = editId ? { action: action, id: editId, data: data } : { action: action, data: data };

    api(payload)
      .then(function (result) {
        el("saveBtn").disabled = false;
        el("saveMsg").textContent = "";
        toast(editId ? "Produto atualizado!" : "Produto cadastrado!");
        /* atualiza lista local */
        if (editId) {
          var idx = allProducts.findIndex(function (p) { return p.id === editId; });
          if (idx > -1) allProducts[idx] = Object.assign(allProducts[idx], data);
        } else {
          allProducts.push(Object.assign({ id: id, created_at: new Date().toISOString() }, data));
        }
        renderStats();
        renderTable();
        closeDrawer();
      })
      .catch(function (e) {
        el("saveBtn").disabled = false;
        el("saveMsg").textContent = "";
        toast(e.message || "Erro ao salvar.", true);
      });
  });

  /* ── Init ── */
  checkLogin();
})();
