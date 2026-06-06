/* ÓTICAS RELUX — Admin: Cadastro em Massa de Produtos */
(function () {
  "use strict";

  var SENHA = "relux2024";
  var EXTRA_KEY = "relux-products-extra";

  function el(id) { return document.getElementById(id); }

  /* ── Auth ── */
  function checkAuth() {
    var ok = sessionStorage.getItem("relux-admin") === "1";
    if (!ok) {
      el("loginBox").style.display = "";
      el("adminContent").style.display = "none";
    } else {
      el("loginBox").style.display = "none";
      el("adminContent").style.display = "";
      render();
    }
  }

  el("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (el("adminPw").value === SENHA) {
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

  /* ── Extra products in localStorage ── */
  function getExtra() { try { return JSON.parse(localStorage.getItem(EXTRA_KEY)) || []; } catch (e) { return []; } }
  function saveExtra(list) { try { localStorage.setItem(EXTRA_KEY, JSON.stringify(list)); } catch (e) {} }
  function allProducts() { return (window.RELUX_PRODUCTS || []).concat(getExtra()); }

  /* ── Render tabela ── */
  function render() {
    var list = allProducts();
    el("totalCount").textContent = list.length + " produtos";
    var tbody = el("prodBody");
    tbody.innerHTML = list.map(function (p, i) {
      var isExtra = i >= (window.RELUX_PRODUCTS || []).length;
      return "<tr>" +
        "<td>" + p.brand + "</td>" +
        "<td>" + p.name + "</td>" +
        "<td>" + p.category + "</td>" +
        "<td>" + p.price + "</td>" +
        "<td>" + p.id + "</td>" +
        "<td>" + (isExtra ? '<button class="btn-rm" data-rm="' + p.id + '">Remover</button>' : '<span style="color:var(--muted);font-size:.8rem">Base</span>') + "</td>" +
        "</tr>";
    }).join("");

    tbody.querySelectorAll(".btn-rm").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-rm");
        if (!confirm("Remover produto " + id + "?")) return;
        var ex = getExtra().filter(function (p) { return p.id !== id; });
        saveExtra(ex);
        render();
      });
    });
  }

  /* ── Formulário individual ── */
  el("addForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (id) { return (el(id) && el(id).value || "").trim(); };
    var id = v("pId") || v("pName").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!id || !v("pName") || !v("pBrand") || !v("pCategory") || !v("pPrice")) {
      alert("Preencha ao menos: ID, Nome, Marca, Categoria e Preço."); return;
    }
    var extra = getExtra();
    if (allProducts().some(function (p) { return p.id === id; })) {
      alert("Já existe um produto com este ID: " + id); return;
    }
    var colors = v("pColors").split(",").map(function (c) { return c.trim(); }).filter(Boolean);
    var specs = v("pSpecs").split("\n").map(function (l) {
      var parts = l.split(":"); return parts.length >= 2 ? [parts[0].trim(), parts.slice(1).join(":").trim()] : null;
    }).filter(Boolean);

    extra.push({
      id: id, brand: v("pBrand"), name: v("pName"), category: v("pCategory"),
      img: v("pImg") || "", shape: v("pShape") || "g-sun", tone: v("pTone") || "a",
      price: v("pPrice"), oldPrice: v("pOldPrice"), badge: v("pBadge"),
      installment: v("pInstallment"), rating: v("pRating") || "4.8", reviews: 0,
      colors: colors.length ? colors : ["Único"],
      desc: v("pDesc"),
      specs: specs,
    });
    saveExtra(extra);
    el("addForm").reset();
    el("formMsg").textContent = "Produto adicionado: " + id;
    el("formMsg").hidden = false;
    setTimeout(function () { el("formMsg").hidden = true; }, 3000);
    render();
  });

  /* ── Importação via CSV ── */
  el("csvImport").addEventListener("click", function () {
    var raw = (el("csvArea").value || "").trim();
    if (!raw) { alert("Cole o CSV primeiro."); return; }
    var lines = raw.split("\n");
    var header = lines[0].split(",").map(function (h) { return h.trim().toLowerCase(); });
    var imported = 0, errors = [];
    var extra = getExtra();
    lines.slice(1).forEach(function (line, idx) {
      if (!line.trim()) return;
      var cols = parseCsvLine(line);
      var row = {};
      header.forEach(function (h, i) { row[h] = (cols[i] || "").trim(); });
      var id = row.id || (row.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (!id || !row.name || !row.brand || !row.category || !row.price) {
        errors.push("Linha " + (idx + 2) + ": campos obrigatórios faltando (id, name, brand, category, price).");
        return;
      }
      if (allProducts().some(function (p) { return p.id === id; }) || extra.some(function (p) { return p.id === id; })) {
        errors.push("Linha " + (idx + 2) + ": ID já existe (" + id + "), pulado."); return;
      }
      extra.push({
        id: id, brand: row.brand, name: row.name, category: row.category,
        img: row.img || "", shape: row.shape || "g-sun", tone: row.tone || "a",
        price: row.price, oldPrice: row.oldprice || "", badge: row.badge || "",
        installment: row.installment || "", rating: row.rating || "4.8", reviews: 0,
        colors: (row.colors || "Único").split("|").map(function (c) { return c.trim(); }),
        desc: row.desc || "",
        specs: [],
      });
      imported++;
    });
    saveExtra(extra);
    render();
    var msg = "Importados: " + imported + " produto(s).";
    if (errors.length) msg += "\n\nAvisos:\n" + errors.join("\n");
    alert(msg);
    el("csvArea").value = "";
  });

  function parseCsvLine(line) {
    var result = [], cur = "", inQ = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === "," && !inQ) { result.push(cur); cur = ""; continue; }
      cur += c;
    }
    result.push(cur);
    return result;
  }

  /* ── Export JSON ── */
  el("exportBtn").addEventListener("click", function () {
    var data = JSON.stringify(allProducts(), null, 2);
    var blob = new Blob([data], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "relux-produtos.json"; a.click();
    URL.revokeObjectURL(url);
  });

  /* ── Limpar extras ── */
  el("clearExtras").addEventListener("click", function () {
    if (!confirm("Remover todos os produtos adicionados via admin? (Os produtos-base permanecem.)")) return;
    saveExtra([]);
    render();
  });

  checkAuth();
})();
