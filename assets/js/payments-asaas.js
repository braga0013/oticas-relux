/* ÓTICAS RELUX — wrapper de pagamento para o Asaas.
   Sem SDK externo; todas as chamadas passam pelas funções serverless
   /api/payment (criar cobrança) e /api/status (consultar status). */
(function () {
  "use strict";
  var API = ((window.RELUX_CONFIG && window.RELUX_CONFIG.apiBase) || "").replace(/\/$/, "");

  function post(path, payload) {
    return fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (r) {
      return r.json().then(function (d) { if (!r.ok) throw d; return d; });
    });
  }

  window.RELUX_PAY = {
    enabled: true,
    ready: true,
    init: function () { return true; },
    pay: function (payload) { return post("/api/payment", payload); },
    status: function (id) {
      return fetch(API + "/api/status?id=" + encodeURIComponent(id) + "&_=" + Date.now())
        .then(function (r) { return r.json(); });
    },
  };
})();
