/* Óticas Relux — Webhook do Asaas
   Recebe notificações de pagamento e atualiza o status do pedido no Supabase.
   Configurar em: Asaas → Minha Conta → Configurações → Integrações → Webhook
   URL: https://oticasrelux.com.br/api/webhook-asaas */

const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SB_SVC  = process.env.SUPABASE_SERVICE_KEY || "";
const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || "";

async function sbFetch(path, method, body) {
  var headers = {
    apikey: SB_SVC,
    Authorization: "Bearer " + SB_SVC,
    "Content-Type": "application/json",
    Prefer: method === "PATCH" ? "return=minimal" : "return=representation",
  };
  var opts = { method: method || "GET", headers };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(SB_URL + path, opts);
  var text = await res.text();
  try { return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null }; }
  catch (e) { return { ok: res.ok, status: res.status, data: text }; }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  /* valida token do webhook se configurado */
  if (ASAAS_WEBHOOK_TOKEN) {
    var token = req.headers["asaas-access-token"] || req.headers["access-token"] || "";
    if (token !== ASAAS_WEBHOOK_TOKEN) return res.status(401).json({ error: "Token inválido" });
  }

  var body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch (e) { return res.status(400).json({ error: "JSON inválido" }); }

  var event   = body.event || "";
  var payment = body.payment || {};
  var payId   = payment.id || "";
  var descricao = payment.description || "";

  /* extrai número do pedido da descrição: "Pedido RLX-XXXXXX — Óticas Relux" */
  var match = descricao.match(/RLX-\d+/);
  if (!match) return res.status(200).json({ ok: true, skipped: "sem numero de pedido" });
  var numero = match[0];

  if (!SB_URL || !SB_SVC) return res.status(503).json({ error: "Supabase não configurado" });

  /* mapeia evento Asaas → status interno */
  var statusMap = {
    PAYMENT_RECEIVED:  { status: "pago",                 payment_status: "approved" },
    PAYMENT_CONFIRMED: { status: "pago",                 payment_status: "approved" },
    PAYMENT_OVERDUE:   { status: "aguardando_pagamento", payment_status: "pending"  },
    PAYMENT_DELETED:   { status: "cancelado",            payment_status: "cancelled" },
    PAYMENT_REFUNDED:  { status: "cancelado",            payment_status: "cancelled" },
  };

  var mapped = statusMap[event];
  if (!mapped) return res.status(200).json({ ok: true, skipped: "evento ignorado: " + event });

  /* atualiza o pedido no Supabase */
  var patch = { status: mapped.status, payment_status: mapped.payment_status };
  if (payId) patch.payment_id = payId;

  var r = await sbFetch(
    "/rest/v1/pedidos?numero=eq." + encodeURIComponent(numero),
    "PATCH", patch
  );

  if (!r.ok) {
    console.error("[webhook-asaas] erro ao atualizar pedido", numero, r.data);
    return res.status(500).json({ error: "Erro ao atualizar pedido" });
  }

  console.log("[webhook-asaas] pedido", numero, "→", mapped.status);
  return res.status(200).json({ ok: true, numero, status: mapped.status });
};
