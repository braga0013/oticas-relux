/* ÓTICAS RELUX — Checkout */
(function () {
  "use strict";
  var R = window.RELUX || {};
  var WA = (window.RELUX_CONFIG && window.RELUX_CONFIG.whatsapp) || "5500000000000";
  var PIX_OFF = 0.05; // 5% no Pix
  var cardInfo = { payment_method_id: null, issuer_id: null }; // detectado pelo BIN

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
    el("sumTotal").textContent = fmt(sub - disc);
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

  /* ---------- ViaCEP (autofill, opcional) ---------- */
  function lookupCep() {
    var cep = onlyDigits((el("cep") || {}).value || "");
    if (cep.length !== 8) return;
    fetch("https://viacep.com.br/ws/" + cep + "/json/").then(function (r) { return r.json(); }).then(function (d) {
      if (d && !d.erro) {
        if (el("rua") && !el("rua").value) el("rua").value = d.logradouro || "";
        if (el("bairro") && !el("bairro").value) el("bairro").value = d.bairro || "";
        if (el("cidade")) el("cidade").value = d.localidade || "";
        if (el("uf")) el("uf").value = (d.uf || "").toUpperCase();
        var num = el("numero"); if (num) num.focus();
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
    var lines = items().map(function (it) { return "• " + it.qty + "x " + it.p.name + " (" + it.p.brand + ") — " + it.p.price; });
    var entregaTxt = delivery() === "loja" ? "Retirar na loja"
      : "Receber em casa\n" + val("rua") + ", " + val("numero") + (val("comp") ? " (" + val("comp") + ")" : "") + " - " + val("bairro") + ", " + val("cidade") + "/" + val("uf") + " - CEP " + val("cep");
    var pagTxt = pm === "pix" ? "Pix (5% à vista)" : pm === "cartao" ? "Cartão — " + (el("ccparc") ? el("ccparc").value + "x" : "1x") : "Boleto bancário";
    return { num: orderNumber(), sub: sub, disc: disc, total: sub - disc, pm: pm, lines: lines, entregaTxt: entregaTxt, pagTxt: pagTxt };
  }
  function orderMessage(o) {
    return "Olá! Novo pedido na Óticas Relux\nPedido " + o.num + "\n\n" + o.lines.join("\n") + "\n\n" +
      "Subtotal: " + fmt(o.sub) + (o.disc ? "\nDesconto Pix: -" + fmt(o.disc) : "") + "\nFrete: Grátis\nTOTAL: " + fmt(o.total) + "\n\n" +
      "Entrega: " + o.entregaTxt + "\nPagamento: " + o.pagTxt + "\n\n" +
      "Cliente: " + val("nome") + (val("cpf") ? " | CPF " + val("cpf") : "") + "\nContato: " + val("tel") + (val("email") ? " | " + val("email") : "");
  }
  function payerObj() {
    var nome = val("nome").split(" ");
    return { email: val("email") || "cliente@oticasrelux.com.br", first_name: nome[0], last_name: nome.slice(1).join(" "), cpf: onlyDigits(val("cpf")) };
  }
  function openSuccess() { el("coSuccess").classList.add("open"); el("coSuccess").setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
  function setProcessing(on, label) { var b = el("coSubmit"); if (!b) return; b.disabled = on; b.style.opacity = on ? ".6" : ""; b.textContent = on ? (label || "Processando...") : "Finalizar pedido"; }
  function showError(msg) { setProcessing(false); alert(msg || "Não foi possível processar o pagamento. Tente novamente."); }

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
    openSuccess();
    if (R.clearCart) R.clearCart();
  }

  function finalizeReal(o) {
    if (o.pm === "cartao") return payCard(o);
    setProcessing(true, o.pm === "pix" ? "Gerando Pix..." : "Gerando boleto...");
    window.RELUX_PAY.pay({ method: o.pm, amount: o.total, description: "Pedido " + o.num + " — Óticas Relux", payer: payerObj() })
      .then(function (res) {
        setProcessing(false);
        el("csOrder").textContent = "Nº " + o.num;
        el("csWhats").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(orderMessage(o));
        var pix = el("csPix"); pix.hidden = false;
        if (o.pm === "pix") {
          pix.innerHTML = (res.qr_code_base64 ? '<img src="data:image/png;base64,' + res.qr_code_base64 + '" alt="QR Code Pix" style="width:180px;height:180px;margin:0 auto 12px;display:block">' : "") +
            "<b>Pix copia e cola</b><br>" + (res.qr_code || "") + "<br><br><b>Total: " + fmt(o.total) + "</b>";
          el("csMsg").textContent = "Escaneie o QR ou copie o código no app do seu banco. A confirmação aparece aqui automaticamente.";
          document.querySelector(".cs-card h2").textContent = "Quase lá — pague o Pix";
          if (res.id) pollStatus(res.id);
        } else {
          pix.innerHTML = "<b>Boleto gerado</b><br>" + (res.ticket_url ? '<a href="' + res.ticket_url + '" target="_blank" rel="noopener">Abrir / imprimir boleto</a>' : "Link indisponível") + "<br><br><b>Total: " + fmt(o.total) + "</b>";
          el("csMsg").textContent = "Pague o boleto para confirmar (compensa em até 2 dias úteis).";
        }
        saveOrder(o, "pendente");
        openSuccess();
        if (R.clearCart) R.clearCart();
      })
      .catch(function (err) { showError(err && err.error); });
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
    window.RELUX_PAY.tokenizeCard({
      cardNumber: onlyDigits(val("ccnum")), cardholderName: val("ccname"),
      month: exp[0], year: (exp[1] && exp[1].length === 2 ? "20" + exp[1] : exp[1]),
      cvv: val("cccvv"), cpf: onlyDigits(val("cpf")),
    }).then(function (tk) {
      return window.RELUX_PAY.pay({
        method: "card", amount: o.total, description: "Pedido " + o.num + " — Óticas Relux",
        token: tk.id, installments: (el("ccparc") ? parseInt(el("ccparc").value, 10) : 1),
        payment_method_id: cardInfo.payment_method_id, issuer_id: cardInfo.issuer_id, payer: payerObj(),
      });
    }).then(function (res) {
      setProcessing(false);
      el("csOrder").textContent = "Nº " + o.num;
      el("csWhats").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(orderMessage(o));
      el("csPix").hidden = true;
      var h = document.querySelector(".cs-card h2");
      if (res.status === "approved") { h.textContent = "Pagamento aprovado! 🎉"; el("csMsg").textContent = "Compra confirmada. Em breve falamos sobre a entrega."; }
      else if (res.status === "in_process" || res.status === "pending") { h.textContent = "Pagamento em análise"; el("csMsg").textContent = "Seu pagamento está em processamento. Avisaremos quando aprovar."; }
      else { h.textContent = "Pagamento recusado"; el("csMsg").textContent = "Não aprovado (" + (res.status_detail || "tente outro cartão") + ")."; }
      if (res.status !== "rejected") saveOrder(o, res.status === "approved" ? "aprovado" : "pendente");
      openSuccess();
      if (res.status === "approved" && R.clearCart) R.clearCart();
    }).catch(function (err) {
      showError((err && (err.error || (err.cause && err.cause[0] && err.cause[0].description))) || "Não foi possível validar o cartão. Confira os dados.");
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

  function saveOrder(o, status) {
    var u = window.RELUX_AUTH && window.RELUX_AUTH.current();
    var rec = { num: o.num, total: fmt(o.total), qtd: items().reduce(function (s, it) { return s + it.qty; }, 0), date: new Date().toLocaleDateString("pt-BR"), status: status || "pendente", email: u ? u.email : "guest" };
    var all; try { all = JSON.parse(localStorage.getItem("relux-orders")) || []; } catch (e) { all = []; }
    all.push(rec); try { localStorage.setItem("relux-orders", JSON.stringify(all)); } catch (e) {}
  }

  function init() {
    renderSummary();
    fillInstallments();
    prefillFromAccount();

    // máscaras
    mask(el("tel"), mTel); mask(el("cpf"), mCpf); mask(el("cep"), mCep);
    mask(el("ccnum"), mCard); mask(el("ccval"), mVal); mask(el("cccvv"), mCvv);
    if (el("uf")) el("uf").addEventListener("input", function () { el("uf").value = el("uf").value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2); });
    if (el("cep")) el("cep").addEventListener("blur", lookupCep);

    // cartão: detecta bandeira + parcelas reais pelo BIN (só no modo Mercado Pago)
    var ccnum = el("ccnum");
    if (ccnum && window.RELUX_PAY && window.RELUX_PAY.enabled) {
      ccnum.addEventListener("input", function () {
        var bin = onlyDigits(ccnum.value).slice(0, 6);
        if (bin.length < 6) return;
        window.RELUX_PAY.detectCard(bin, subtotal()).then(function (info) {
          if (!info) return;
          cardInfo.payment_method_id = info.payment_method_id;
          cardInfo.issuer_id = info.issuer_id;
          if (info.installments && info.installments.length) {
            el("ccparc").innerHTML = info.installments.map(function (pc) {
              return '<option value="' + pc.installments + '">' + pc.recommended_message + "</option>";
            }).join("");
          }
        });
      });
    }

    // entrega
    el("deliveryOpts").addEventListener("change", function () {
      syncOptionUI("deliveryOpts");
      el("addrFields").style.display = delivery() === "loja" ? "none" : "";
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
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
