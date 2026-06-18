/* ÓTICAS RELUX — Checkout */
(function () {
  "use strict";
  var R = window.RELUX || {};
  var WA = (window.RELUX_CONFIG && window.RELUX_CONFIG.whatsapp) || "5551995963008";
  var PIX_OFF = 0.05; // 5% no Pix
  function el(id) { return document.getElementById(id); }
  function parseBRL(s) { return R.parseBRL ? R.parseBRL(s) : parseFloat(String(s).replace(/[^\d,]/g, "").replace(",", ".")) || 0; }
  function fmt(n) { return R.fmtBRL ? R.fmtBRL(n) : "R$ " + n.toFixed(2); }
  function prod(id) { return R.findProduct ? R.findProduct(id) : null; }

  /* estado atual da forma de pagamento e entrega */
  function payMethod() { var r = document.querySelector('input[name="pagamento"]:checked'); return r ? r.value : "pix"; }
  function delivery() { var r = document.querySelector('input[name="entrega"]:checked'); return r ? r.value : "casa"; }

  /* ---------- resumo ---------- */
  function items() {
    var c = R.getCart ? R.getCart() : [];
    return c.map(function (i) { var p = prod(i.id); return p ? { p: p, qty: i.qty } : null; }).filter(Boolean);
  }
  function subtotal() { return items().reduce(function (s, it) { return s + parseBRL(it.p.price) * it.qty; }, 0); }

  function thumb(p) {
    return p.img ? '<img src="' + p.img + '" alt="" loading="lazy">' : '<svg viewBox="0 0 200 80"><use href="#' + p.shape + '"/></svg>';
  }

  function renderSummary() {
    var its = items();
    var box = el("sumItems");
    if (!its.length) {
      box.innerHTML = '<div class="drawer-empty" style="padding:20px 0"><h4>Sua sacola está vazia</h4><p>Adicione produtos para finalizar.</p><a class="btn btn-ghost" href="index.html#destaques">Ver produtos</a></div>';
      el("coSubmit").disabled = true; el("coSubmit").style.opacity = ".5"; el("coSubmit").style.pointerEvents = "none";
    } else {
      box.innerHTML = its.map(function (it) {
        var line = parseBRL(it.p.price) * it.qty;
        return '<div class="sum-item"><div class="sum-thumb">' + thumb(it.p) + "</div>" +
          '<div class="sum-info"><div class="sum-name">' + it.p.name + "</div><div class=\"sum-qty\">" + it.qty + " × " + it.p.price + "</div></div>" +
          '<div class="sum-line">' + fmt(line) + "</div></div>";
      }).join("");
    }
    var sub = subtotal();
    el("sumSubtotal").textContent = fmt(sub);
    var disc = payMethod() === "pix" ? sub * PIX_OFF : 0;
    var drow = el("sumDiscountRow");
    if (disc > 0) { drow.hidden = false; el("sumDiscount").textContent = "- " + fmt(disc); } else { drow.hidden = true; }
    var freteEl = el("sumFrete");
    if (freteEl) freteEl.textContent = freteAtual > 0 ? fmt(freteAtual) : "Grátis";
    el("sumTotal").textContent = fmt(sub - disc + freteAtual);
  }

  /* ---------- parcelas do cartão ---------- */
  function fillInstallments() {
    var sel = el("ccparc"); if (!sel) return;
    var total = subtotal();
    var html = "";
    for (var n = 1; n <= 10; n++) {
      html += '<option value="' + n + '">' + n + "x de " + fmt(total / n) + " sem juros</option>";
    }
    sel.innerHTML = html;
  }

  /* ---------- máscaras ---------- */
  function onlyDigits(s) { return s.replace(/\D/g, ""); }
  function mask(input, fn) { if (!input) return; input.addEventListener("input", function () { var p = input.selectionStart; input.value = fn(input.value); }); }
  function mTel(v) { v = onlyDigits(v).slice(0, 11); if (v.length <= 10) return v.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, function (_, a, b, c) { return (a ? "(" + a + ") " : "") + b + (c ? "-" + c : ""); }).trim(); return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3"); }
  function mCpf(v) { v = onlyDigits(v).slice(0, 11); return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); }
  function mCep(v) { v = onlyDigits(v).slice(0, 8); return v.replace(/(\d{5})(\d{1,3})/, "$1-$2"); }
  function mCard(v) { return onlyDigits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "); }
  function mVal(v) { v = onlyDigits(v).slice(0, 4); return v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v; }
  function mCvv(v) { return onlyDigits(v).slice(0, 4); }

  /* ---------- Cálculo de Frete ---------- */
  var freteAtual = 0;
  var FRETE_GRATIS_ACIMA = 300;

  /* Tabela de fallback (usada apenas se a API não estiver configurada) */
  var FRETE_FALLBACK = {
    SP: { pac: { preco: 12.90, dias: 6 }, sedex: { preco: 24.90, dias: 2 } },
    RJ: { pac: { preco: 15.90, dias: 7 }, sedex: { preco: 27.90, dias: 2 } },
    ES: { pac: { preco: 15.90, dias: 7 }, sedex: { preco: 27.90, dias: 3 } },
    MG: { pac: { preco: 15.90, dias: 7 }, sedex: { preco: 27.90, dias: 3 } },
    PR: { pac: { preco: 17.90, dias: 8 }, sedex: { preco: 29.90, dias: 3 } },
    SC: { pac: { preco: 17.90, dias: 8 }, sedex: { preco: 29.90, dias: 3 } },
    RS: { pac: { preco: 17.90, dias: 8 }, sedex: { preco: 32.90, dias: 3 } },
  };
  var FRETE_FALLBACK_PADRAO = { pac: { preco: 22.90, dias: 10 }, sedex: { preco: 38.90, dias: 4 } };

  function diasLabel(n) { return n + (n === 1 ? " dia útil" : " dias úteis"); }

  function optHTML(val, label, preco, dias, checked) {
    return '<label class="opt' + (checked ? " sel" : "") + '">' +
      '<input type="radio" name="frete_tipo" value="' + val + '"' + (checked ? " checked" : "") + '/>' +
      '<span class="o-ic"><svg viewBox="0 0 24 24"><path d="M3 7h13l5 5v5h-2M3 7v10h2M16 7v10M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z"/></svg></span>' +
      '<span class="o-main"><span class="o-title">' + label + ' — Correios</span><span class="o-sub">Prazo: ' + diasLabel(dias) + '</span></span>' +
      '<span class="o-tag">' + fmt(preco) + '</span></label>';
  }

  function bindFreteList(opcoes) {
    var list = el("freteList"); if (!list) return;
    list.addEventListener("change", function () {
      list.querySelectorAll(".opt").forEach(function (o) { o.classList.toggle("sel", o.querySelector("input").checked); });
      var sel = list.querySelector('input[name="frete_tipo"]:checked');
      if (sel) {
        var idx = parseInt(sel.getAttribute("data-idx"), 10);
        freteAtual = opcoes[idx] ? opcoes[idx].preco : 0;
      }
      renderSummary();
    });
  }

  function showFreteOpts(opcoes) {
    var box = el("freteOpts"); if (!box) return;
    box.innerHTML =
      '<h4 style="font-size:.85rem;font-weight:600;margin-bottom:8px;color:var(--muted)">Opções de envio</h4>' +
      '<div class="opt-list" id="freteList">' +
      opcoes.map(function (op, i) {
        return '<label class="opt' + (i === 0 ? " sel" : "") + '">' +
          '<input type="radio" name="frete_tipo" data-idx="' + i + '" value="op' + i + '"' + (i === 0 ? " checked" : "") + '/>' +
          '<span class="o-ic"><svg viewBox="0 0 24 24"><path d="M3 7h13l5 5v5h-2M3 7v10h2M16 7v10M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z"/></svg></span>' +
          '<span class="o-main"><span class="o-title">' + op.nome + ' — ' + (op.empresa || "Correios") + '</span>' +
          '<span class="o-sub">Prazo: ' + diasLabel(op.dias) + '</span></span>' +
          '<span class="o-tag">' + fmt(op.preco) + '</span></label>';
      }).join("") +
      '</div>';
    freteAtual = opcoes[0].preco;
    renderSummary();
    bindFreteList(opcoes);
  }

  function renderFreteOpts(cep, uf) {
    var box = el("freteOpts"); if (!box) return;

    if (subtotal() >= FRETE_GRATIS_ACIMA) {
      freteAtual = 0;
      box.innerHTML = '<div class="frete-gratis"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg> Frete grátis para compras acima de R$ 300!</div>';
      renderSummary(); return;
    }

    /* Spinner enquanto calcula */
    box.innerHTML = '<p style="color:var(--muted);font-size:.85rem">Calculando frete...</p>';

    var apiBase = (window.RELUX_CONFIG && window.RELUX_CONFIG.apiBase) || "";
    var qtd = items().reduce(function (s, it) { return s + it.qty; }, 0) || 1;

    fetch(apiBase + "/api/frete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep_destino: cep, qtd: qtd }),
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error || !data.opcoes || !data.opcoes.length) throw new Error(data.error || "sem opcoes");
      showFreteOpts(data.opcoes);
    })
    .catch(function () {
      /* Fallback: tabela estimada */
      var t = FRETE_FALLBACK[uf] || FRETE_FALLBACK_PADRAO;
      showFreteOpts([
        { nome: "PAC",   empresa: "Correios", preco: t.pac.preco,   dias: t.pac.dias },
        { nome: "SEDEX", empresa: "Correios", preco: t.sedex.preco, dias: t.sedex.dias },
      ]);
    });
  }

  function freteMethod() {
    var r = document.querySelector('input[name="frete_tipo"]:checked');
    if (!r) return "PAC";
    var label = r.closest(".opt") && r.closest(".opt").querySelector(".o-title");
    return label ? label.textContent.split(" — ")[0] : "PAC";
  }

  /* ---------- ViaCEP (autofill + frete) ---------- */
  function lookupCep() {
    var cep = onlyDigits((el("cep") || {}).value || "");
    if (cep.length !== 8) return;
    fetch("https://viacep.com.br/ws/" + cep + "/json/").then(function (r) { return r.json(); }).then(function (d) {
      if (d && !d.erro) {
        if (el("rua") && !el("rua").value) el("rua").value = d.logradouro || "";
        if (el("bairro") && !el("bairro").value) el("bairro").value = d.bairro || "";
        if (el("cidade")) el("cidade").value = d.localidade || "";
        var uf = (d.uf || "").toUpperCase();
        if (el("uf")) el("uf").value = uf;
        var num = el("numero"); if (num) num.focus();
        renderFreteOpts(cep, uf);
      }
    }).catch(function () {});
  }

  /* ---------- validação ---------- */
  function setErr(id, on) { var f = el(id); if (f) { var field = f.closest(".co-field"); if (field) field.classList.toggle("invalid", !!on); } }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function validate() {
    var ok = true, first = null;
    function req(id, cond) { var bad = !cond; setErr(id, bad); if (bad && !first) first = el(id); if (bad) ok = false; }
    var v = function (id) { return (el(id) && el(id).value || "").trim(); };

    req("nome", v("nome").length >= 2);
    req("tel", onlyDigits(v("tel")).length >= 10);
    if (v("email")) req("email", validEmail(v("email")));

    if (delivery() === "casa") {
      req("cep", onlyDigits(v("cep")).length === 8);
      req("rua", v("rua").length > 2);
      req("numero", v("numero").length >= 1);
      req("bairro", v("bairro").length >= 2);
      req("cidade", v("cidade").length >= 2);
      req("uf", v("uf").length === 2);
    }
    if (payMethod() === "cartao") {
      req("ccnum", onlyDigits(v("ccnum")).length >= 13);
      req("ccname", v("ccname").length >= 3);
      req("ccval", /^\d{2}\/\d{2}$/.test(v("ccval")));
      req("cccvv", onlyDigits(v("cccvv")).length >= 3);
    }
    if (!ok && first) first.scrollIntoView({ behavior: "smooth", block: "center" }), first.focus({ preventScroll: true });
    return ok;
  }

  /* ---------- montar pedido ---------- */
  function orderNumber() { var d = new Date(); return "RLX-" + String(d.getTime()).slice(-6); }
  function val(id) { return (el(id) && el(id).value || "").trim(); }

  function buildOrder() {
    var sub = subtotal();
    var pm = payMethod();
    var disc = pm === "pix" ? sub * PIX_OFF : 0;
    var frete = delivery() === "loja" ? 0 : freteAtual;
    var lines = items().map(function (it) { return "• " + it.qty + "x " + it.p.name + " (" + it.p.brand + ") — " + it.p.price; });
    var tipoFrete = freteMethod();
    var entregaTxt = delivery() === "loja" ? "Retirar na loja"
      : "Receber em casa (" + tipoFrete + ")\n" + val("rua") + ", " + val("numero") + (val("comp") ? " (" + val("comp") + ")" : "") + " - " + val("bairro") + ", " + val("cidade") + "/" + val("uf") + " - CEP " + val("cep");
    var pagTxt = pm === "pix" ? "Pix (5% à vista)" : pm === "cartao" ? "Cartão — " + (el("ccparc") ? el("ccparc").value + "x" : "1x") : "Boleto bancário";
    return { num: orderNumber(), sub: sub, disc: disc, frete: frete, total: sub - disc + frete, pm: pm, lines: lines, entregaTxt: entregaTxt, pagTxt: pagTxt };
  }
  function orderMessage(o) {
    return "Olá! Novo pedido na Óticas Relux\nPedido " + o.num + "\n\n" + o.lines.join("\n") + "\n\n" +
      "Subtotal: " + fmt(o.sub) + (o.disc ? "\nDesconto Pix: -" + fmt(o.disc) : "") +
      "\nFrete: " + (o.frete > 0 ? fmt(o.frete) : "Grátis") + "\nTOTAL: " + fmt(o.total) + "\n\n" +
      "Entrega: " + o.entregaTxt + "\nPagamento: " + o.pagTxt + "\n\n" +
      "Cliente: " + val("nome") + (val("cpf") ? " | CPF " + val("cpf") : "") + "\nContato: " + val("tel") + (val("email") ? " | " + val("email") : "");
  }
  function payerObj() {
    return {
      name: val("nome"),
      email: val("email") || "cliente@oticasrelux.com.br",
      phone: onlyDigits(val("tel")),
      cpf: onlyDigits(val("cpf")),
    };
  }
  function openSuccess() { el("coSuccess").classList.add("open"); el("coSuccess").setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
  function setProcessing(on, label) { var b = el("coSubmit"); if (!b) return; b.disabled = on; b.style.opacity = on ? ".6" : ""; b.textContent = on ? (label || "Processando...") : "Finalizar pedido"; }
  function showError(msg) { setProcessing(false); alert(msg || "Não foi possível processar o pagamento. Tente novamente."); }

  /* ---------- login obrigatório (async-safe) ---------- */
  function requireLogin(cb) {
    var A = window.RELUX_AUTH;
    if (A && A.onReady) {
      A.onReady(function(u) {
        if (!u) { location.replace("conta.html?next=checkout.html"); return; }
        cb();
      });
    } else {
      cb(); /* auth não disponível — deixa prosseguir */
    }
  }

  /* ---------- finalizar: roteia real (Mercado Pago) x WhatsApp ---------- */
  function finalize() {
    if (!items().length) return;
    if (!validate()) return;
    var o = buildOrder();
    if (window.RELUX_PAY && window.RELUX_PAY.enabled) finalizeReal(o);
    else finalizeWhatsApp(o);
  }

  function finalizeWhatsApp(o) {
    el("csOrder").textContent = "Nº " + o.num;
    el("csWhats").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(orderMessage(o));
    var pix = el("csPix");
    if (o.pm === "pix") { pix.hidden = false; pix.innerHTML = "<b>Pagamento via Pix</b><br>Total " + fmt(o.total) + " — envie o pedido pelo WhatsApp e a loja te manda o código Pix."; }
    else pix.hidden = true;
    el("csMsg").textContent = "Confirme seu pedido pelo WhatsApp — a loja finaliza o pagamento e combina a entrega.";
    saveOrder(o, "pendente");
    sendOrderEmail(o, "pendente");
    openSuccess();
    if (R.clearCart) R.clearCart();
  }

  function finalizeReal(o) {
    if (o.pm === "cartao") return payCard(o);
    setProcessing(true, "Gerando Pix...");
    window.RELUX_PAY.pay({ method: o.pm, amount: o.total, description: "Pedido " + o.num + " — Óticas Relux", payer: payerObj() })
      .then(function (res) {
        setProcessing(false);
        el("csOrder").textContent = "Nº " + o.num;
        el("csWhats").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(orderMessage(o));
        var pix = el("csPix"); pix.hidden = false;
        if (o.pm === "pix") {
          var pixCode = res.qr_code || "";
          pix.innerHTML = (res.qr_code_base64 ? '<img src="data:image/png;base64,' + res.qr_code_base64 + '" alt="QR Code Pix" style="width:180px;height:180px;margin:0 auto 12px;display:block">' : "") +
            "<b>Pix copia e cola</b>" +
            '<div style="word-break:break-all;font-size:.72rem;background:rgba(0,0,0,.06);border-radius:8px;padding:8px 12px;margin:8px 0 10px">' + pixCode + "</div>" +
            '<button id="pixCopyBtn" type="button" style="background:var(--gold,#c8920a);color:#000;border:none;padding:8px 20px;border-radius:8px;cursor:pointer;font-weight:600;font-size:.85rem;margin-bottom:10px">Copiar código Pix</button>' +
            "<br><b>Total: " + fmt(o.total) + "</b>";
          var copyBtn = el("pixCopyBtn");
          if (copyBtn) {
            copyBtn.addEventListener("click", function () {
              navigator.clipboard.writeText(pixCode).then(function () {
                copyBtn.textContent = "Copiado! ✓";
                copyBtn.style.background = "#22c55e";
              }, function () {});
            });
          }
          el("csMsg").textContent = "Escaneie o QR ou copie o código Pix no app do seu banco. A confirmação aparece aqui automaticamente.";
          document.querySelector(".cs-card h2").textContent = "Quase lá — pague o Pix";
          if (res.id) pollStatus(res.id);
        }
        saveOrder(o, "pendente", res.id);
        sendOrderEmail(o, "pendente");
        openSuccess();
        if (R.clearCart) R.clearCart();
      })
      .catch(function (err) {
        setProcessing(false);
        var msg = (err && err.error) || "";
        /* se a chave Asaas não está configurada, redireciona para WhatsApp */
        if (msg.indexOf("não configurado") !== -1 || msg.indexOf("ASAAS") !== -1) {
          return finalizeWhatsApp(o);
        }
        showError(msg);
      });
  }

  function pollStatus(id) {
    var tries = 0, max = 60;
    var t = setInterval(function () {
      tries++;
      window.RELUX_PAY.status(id).then(function (s) {
        if (s.status === "approved") {
          clearInterval(t);
          document.querySelector(".cs-card h2").textContent = "Pagamento aprovado! 🎉";
          el("csMsg").textContent = "Recebemos seu pagamento. Em breve falamos sobre a entrega.";
          var pix = el("csPix"); if (pix) pix.hidden = true;
        } else if (s.status === "rejected" || s.status === "cancelled") {
          clearInterval(t); el("csMsg").textContent = "O pagamento não foi concluído. Tente novamente.";
        }
        if (tries >= max) clearInterval(t);
      }).catch(function () { if (tries >= max) clearInterval(t); });
    }, 4000);
  }

  function payCard(o) {
    setProcessing(true, "Processando pagamento...");
    var exp = val("ccval").split("/");
    var payer = payerObj();
    payer.cep = onlyDigits(val("cep"));
    payer.addressNumber = val("numero");
    window.RELUX_PAY.pay({
      method: "card",
      amount: o.total,
      description: "Pedido " + o.num + " — Óticas Relux",
      installments: el("ccparc") ? parseInt(el("ccparc").value, 10) : 1,
      payer: payer,
      creditCard: {
        holderName: val("ccname"),
        number: onlyDigits(val("ccnum")),
        expiryMonth: exp[0],
        expiryYear: exp[1] || "",
        ccv: val("cccvv"),
      },
    }).then(function (res) {
      setProcessing(false);
      el("csOrder").textContent = "Nº " + o.num;
      el("csWhats").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(orderMessage(o));
      el("csPix").hidden = true;
      var h = document.querySelector(".cs-card h2");
      if (res.status === "approved") {
        h.textContent = "Pagamento aprovado! 🎉";
        el("csMsg").textContent = "Compra confirmada. Em breve falamos sobre a entrega.";
      } else if (res.status === "pending") {
        h.textContent = "Pagamento em análise";
        el("csMsg").textContent = "Seu pagamento está em processamento. Avisaremos quando aprovar.";
      } else {
        h.textContent = "Pagamento recusado";
        el("csMsg").textContent = "Não aprovado — verifique os dados ou tente outro cartão.";
      }
      var orderStatus = res.status === "approved" ? "aprovado" : "pendente";
      if (res.status !== "rejected") { saveOrder(o, orderStatus, res.id); sendOrderEmail(o, orderStatus); }
      openSuccess();
      if (res.status === "approved" && R.clearCart) R.clearCart();
    }).catch(function (err) {
      setProcessing(false);
      var msg = (err && err.error) || "";
      if (msg.indexOf("não configurado") !== -1 || msg.indexOf("ASAAS") !== -1) {
        return finalizeWhatsApp(o);
      }
      showError(msg || "Não foi possível processar o pagamento. Confira os dados e tente novamente.");
    });
  }

  /* ---------- bindings ---------- */
  function syncOptionUI(groupId) {
    var g = el(groupId); if (!g) return;
    g.querySelectorAll(".opt").forEach(function (o) { var inp = o.querySelector("input"); o.classList.toggle("sel", inp && inp.checked); });
  }

  function prefillFromAccount() {
    var u = window.RELUX_AUTH && window.RELUX_AUTH.current();
    if (!u) return;
    if (el("nome") && !el("nome").value) el("nome").value = u.name || "";
    if (el("email") && !el("email").value) el("email").value = u.email || "";
    if (el("tel") && !el("tel").value) el("tel").value = u.phone || "";
    if (el("cpf") && !el("cpf").value) el("cpf").value = u.cpf || "";
  }

  function sendOrderEmail(o, status) {
    try {
      var its = items().map(function (it) {
        return { name: it.p.name + (it.p.brand ? " — " + it.p.brand : ""), qty: it.qty, price: it.p.price };
      });
      var pm = o.pm;
      var parc = (el("ccparc") && parseInt(el("ccparc").value, 10)) || 1;
      var payload = {
        num: o.num,
        items: its,
        subtotal: o.sub,
        discount: o.disc,
        shipping: o.frete,
        shippingMethod: freteMethod(),
        total: o.total,
        payMethod: pm,
        installments: parc,
        delivery: delivery(),
        address: {
          rua: val("rua"), numero: val("numero"), comp: val("comp"),
          bairro: val("bairro"), cidade: val("cidade"), uf: val("uf"), cep: val("cep")
        },
        customer: { name: val("nome"), phone: val("tel"), email: val("email"), cpf: val("cpf") },
        status: status || "pendente"
      };
      var apiBase = (window.RELUX_CONFIG && window.RELUX_CONFIG.apiBase) || "";
      fetch(apiBase + "/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  }

  function saveOrder(o, status, paymentId) {
    var apiBase = (window.RELUX_CONFIG && window.RELUX_CONFIG.apiBase) || "";
    var its = items().map(function (it) {
      return { id: it.p.id, name: it.p.name, brand: it.p.brand || "", qty: it.qty, price: parseBRL(it.p.price) };
    });
    /* inclui user_id se cliente estiver logado */
    var userId = (window.RELUX_AUTH && window.RELUX_AUTH.current() && window.RELUX_AUTH.current().id) || null;
    fetch(apiBase + "/api/pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action:           "create",
        numero:           o.num,
        user_id:          userId,
        customer_name:    val("nome"),
        customer_email:   val("email") || null,
        customer_phone:   onlyDigits(val("tel")),
        customer_cpf:     onlyDigits(val("cpf")) || null,
        items:            its,
        subtotal:         o.sub,
        discount:         o.disc,
        total:            o.total,
        delivery_type:    delivery(),
        shipping_method:  freteMethod(),
        shipping_price:   o.frete,
        shipping_cep:     onlyDigits(val("cep")) || null,
        shipping_address: delivery() === "casa" ? {
          rua: val("rua"), numero: val("numero"), comp: val("comp"),
          bairro: val("bairro"), cidade: val("cidade"), uf: val("uf"), cep: val("cep")
        } : null,
        payment_method:   o.pm,
        payment_id:       paymentId || null,
        payment_status:   status === "aprovado" ? "approved" : "pending",
        status:           status === "aprovado" ? "pago" : "aguardando_pagamento",
      }),
    }).catch(function () {});

    /* mantém cópia local para dashboard.html */
    var u = window.RELUX_AUTH && window.RELUX_AUTH.current();
    var rec = { num: o.num, total: fmt(o.total), qtd: its.reduce(function (s, i) { return s + i.qty; }, 0), date: new Date().toLocaleDateString("pt-BR"), status: status || "pendente", email: u ? u.email : "guest" };
    var all; try { all = JSON.parse(localStorage.getItem("relux-orders")) || []; } catch (e) { all = []; }
    all.push(rec); try { localStorage.setItem("relux-orders", JSON.stringify(all)); } catch (e) {}
  }

  function init() {
    requireLogin(initCheckout);
  }

  function initCheckout() {
    renderSummary();
    fillInstallments();
    prefillFromAccount();

    // máscaras
    mask(el("tel"), mTel); mask(el("cpf"), mCpf); mask(el("cep"), mCep);
    mask(el("ccnum"), mCard); mask(el("ccval"), mVal); mask(el("cccvv"), mCvv);
    if (el("uf")) el("uf").addEventListener("input", function () { el("uf").value = el("uf").value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2); });
    if (el("cep")) el("cep").addEventListener("blur", lookupCep);

    // entrega
    el("deliveryOpts").addEventListener("change", function () {
      syncOptionUI("deliveryOpts");
      var isLoja = delivery() === "loja";
      el("addrFields").style.display = isLoja ? "none" : "";
      if (isLoja) { freteAtual = 0; var fo = el("freteOpts"); if (fo) fo.innerHTML = ""; renderSummary(); }
    });

    // pagamento
    el("payOpts").addEventListener("change", function () {
      syncOptionUI("payOpts");
      var pm = payMethod();
      document.querySelectorAll(".pay-panel").forEach(function (p) { p.hidden = p.getAttribute("data-pay") !== pm; });
      renderSummary();
    });

    // submit
    el("checkoutForm").addEventListener("submit", function (e) { e.preventDefault(); finalize(); });
    var btn = el("coSubmit"); if (btn) btn.addEventListener("click", function (e) { e.preventDefault(); finalize(); });

    // limpar campo inválido ao digitar
    document.querySelectorAll(".co-field input, .co-field select").forEach(function (inp) {
      inp.addEventListener("input", function () { var f = inp.closest(".co-field"); if (f) f.classList.remove("invalid"); });
    });

    // re-render se a sacola mudar (ex.: via drawer)
    document.addEventListener("relux:change", function () { renderSummary(); fillInstallments(); });

    // re-render quando o catálogo do Supabase carregar (itens podem ser lentes do banco)
    if (R.whenReady) R.whenReady(function () { renderSummary(); fillInstallments(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
