/* ÓTICAS RELUX — Integração Mercado Pago (Checkout Transparente).
   Só ativa se window.RELUX_CONFIG.mpPublicKey estiver preenchido.
   Sem isso, o checkout segue no fluxo por WhatsApp (preview local). */
(function () {
  "use strict";
  var cfg = window.RELUX_CONFIG || {};
  var PUB = cfg.mpPublicKey || "";
  var API = (cfg.apiBase || "").replace(/\/$/, ""); // "" = mesma origem
  var mp = null;

  function post(path, payload) {
    return fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw d; return d; }); });
  }

  window.RELUX_PAY = {
    enabled: !!PUB,
    ready: false,
    init: function () {
      if (PUB && window.MercadoPago) { mp = new window.MercadoPago(PUB, { locale: "pt-BR" }); this.ready = true; }
      return this.ready;
    },
    /* detecta bandeira/parcelas a partir do BIN (6 primeiros dígitos) */
    detectCard: function (bin, amount) {
      if (!mp) return Promise.resolve(null);
      return mp.getPaymentMethods({ bin: bin }).then(function (pm) {
        var m = pm.results && pm.results[0];
        if (!m) return null;
        var out = { payment_method_id: m.id, issuer_id: null, installments: [] };
        var p1 = mp.getInstallments({ amount: String(amount), bin: bin, paymentTypeId: "credit_card" })
          .then(function (inst) {
            var first = inst && inst[0];
            if (first && first.payer_costs) out.installments = first.payer_costs;
            if (first && first.issuer) out.issuer_id = first.issuer.id;
          }).catch(function () {});
        return Promise.resolve(p1).then(function () { return out; });
      }).catch(function () { return null; });
    },
    tokenizeCard: function (data) {
      if (!mp) return Promise.reject({ error: "Mercado Pago não inicializado" });
      return mp.createCardToken({
        cardNumber: data.cardNumber,
        cardholderName: data.cardholderName,
        cardExpirationMonth: data.month,
        cardExpirationYear: data.year,
        securityCode: data.cvv,
        identificationType: "CPF",
        identificationNumber: data.cpf,
      });
    },
    pay: function (payload) { return post("/api/payment", payload); },
    status: function (id) { return fetch(API + "/api/status?id=" + encodeURIComponent(id)).then(function (r) { return r.json(); }); },
  };

  if (PUB) {
    if (window.MercadoPago) window.RELUX_PAY.init();
    else window.addEventListener("load", function () { window.RELUX_PAY.init(); });
  }
})();
