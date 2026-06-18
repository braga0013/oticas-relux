/* Óticas Relux — API pública de pedidos
   POST {action:"create", ...dados} → salva pedido no Supabase
   GET  ?numero=RLX-... → retorna status + rastreio para o cliente */

const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SB_ANON = process.env.SUPABASE_ANON_KEY || "";
const SB_SVC  = process.env.SUPABASE_SERVICE_KEY || "";

/* Sanitize a string — strips HTML tags and limits length */
function sanitize(val, maxLen) {
  if (val === null || val === undefined) return null;
  return String(val).replace(/<[^>]*>/g, "").trim().slice(0, maxLen || 500);
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

async function sbFetch(path, method, body, useService) {
  var key = useService ? SB_SVC : SB_ANON;
  var headers = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
  if (method === "POST") headers["Prefer"] = "return=representation";
  if (method === "PATCH") headers["Prefer"] = "return=minimal";
  var opts = { method: method || "GET", headers: headers };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(SB_URL + path, opts);
  var text = await res.text();
  try { return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null }; }
  catch (e) { return { ok: res.ok, status: res.status, data: text }; }
}

var STATUS_LABEL = {
  aguardando_pagamento: "Aguardando pagamento",
  pago:                 "Pagamento confirmado",
  em_preparo:           "Em preparação",
  enviado:              "Enviado",
  entregue:             "Entregue",
  cancelado:            "Cancelado",
};

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!SB_URL) return res.status(503).json({ error: "SUPABASE_URL não configurado no servidor." });
  if (!SB_ANON) return res.status(503).json({ error: "SUPABASE_ANON_KEY não configurado no servidor." });

  /* ── PATCH: atualiza status do pedido (confirmação de pagamento / cancelamento) ── */
  if (req.method === "PATCH") {
    var pb;
    try { pb = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
    catch (e) { return res.status(400).json({ error: "JSON inválido" }); }
    var allowed = ["pago", "em_preparo", "enviado", "entregue", "cancelado", "aguardando_pagamento"];
    if (!pb.numero || !allowed.includes(pb.status)) return res.status(400).json({ error: "numero/status inválidos" });
    var patch = { status: pb.status };
    if (pb.status === "pago") patch.payment_status = "approved";
    if (pb.status === "cancelado") patch.payment_status = "cancelled";

    /* se cancelando, busca payment_id para cancelar no Asaas também */
    if (pb.status === "cancelado") {
      var pedidoR = await sbFetch(
        "/rest/v1/pedidos?numero=eq." + encodeURIComponent(pb.numero) + "&select=payment_id",
        "GET", null, true
      );
      var paymentId = pedidoR.data && pedidoR.data[0] && pedidoR.data[0].payment_id;
      if (paymentId) {
        var asaasKey = process.env.ASAAS_API_KEY;
        var asaasBase = process.env.ASAAS_SANDBOX
          ? "https://sandbox.asaas.com/api/v3"
          : "https://api.asaas.com/v3";
        try {
          await fetch(asaasBase + "/payments/" + paymentId + "/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json", access_token: asaasKey },
          });
        } catch (_) { /* ignora erro no Asaas — cancela no Supabase de qualquer forma */ }
      }
    }

    var pr = await sbFetch("/rest/v1/pedidos?numero=eq." + encodeURIComponent(pb.numero), "PATCH", patch, true);
    if (!pr.ok) return res.status(pr.status).json({ error: "Erro ao atualizar pedido", detail: pr.data });
    return res.json({ ok: true });
  }

  /* ── GET: consulta pública de pedido pelo número ── */
  if (req.method === "GET") {
    var numero = (req.query.numero || "").trim();
    if (!numero) return res.status(400).json({ error: "Informe o número do pedido." });

    var r = await sbFetch(
      "/rest/v1/pedidos?numero=eq." + encodeURIComponent(numero) +
      "&select=numero,status,created_at,customer_name,items,total,shipping_method,shipping_price,delivery_type,shipping_address,payment_method,tracking_code,tracking_sent_at",
      "GET", null, false
    );
    if (!r.ok || !r.data || !r.data.length) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    var p = r.data[0];
    return res.json({
      numero:         p.numero,
      status:         p.status,
      status_label:   STATUS_LABEL[p.status] || p.status,
      created_at:     p.created_at,
      customer_name:  p.customer_name,
      items:          p.items,
      total:          p.total,
      shipping_method:p.shipping_method,
      shipping_price: p.shipping_price,
      delivery_type:  p.delivery_type,
      shipping_address: p.shipping_address,
      payment_method: p.payment_method,
      tracking_code:  p.tracking_code,
      tracking_sent_at: p.tracking_sent_at,
    });
  }

  /* ── POST: criar pedido (checkout) ── */
  if (req.method === "POST") {
    var body;
    try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
    catch (e) { return res.status(400).json({ error: "JSON inválido" }); }

    if (body.action !== "create") return res.status(400).json({ error: "Ação inválida." });
    if (!body.numero) return res.status(400).json({ error: "numero é obrigatório." });

    /* Validate amount fields are non-negative numbers */
    var total = Number(body.total) || 0;
    if (total < 0) return res.status(400).json({ error: "Valor de total inválido." });

    /* Validate email format if provided */
    var rawEmail = body.customer_email || null;
    if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return res.status(400).json({ error: "E-mail do cliente inválido." });
    }

    /* Allowed values for enum fields */
    var allowedDelivery = ["entrega", "loja", "casa"];
    var allowedPayMethod = ["pix", "cartao", "card", "boleto", "credit_card", "PIX", "CREDIT_CARD", "BOLETO"];
    var allowedStatus = ["aguardando_pagamento", "pago", "em_preparo", "enviado", "entregue", "cancelado", "pendente"];
    var allowedPayStatus = ["pending", "approved", "cancelled", "rejected"];

    var data = {
      numero:          sanitize(body.numero, 30),
      user_id:         body.user_id         || null,
      customer_name:   sanitize(body.customer_name, 120),
      customer_email:  rawEmail,
      customer_phone:  sanitize(body.customer_phone, 20),
      customer_cpf:    sanitize(body.customer_cpf, 20),
      items:           body.items          || [],
      subtotal:        Number(body.subtotal)      || 0,
      discount:        Number(body.discount)      || 0,
      total:           total,
      delivery_type:   allowedDelivery.includes(body.delivery_type) ? body.delivery_type : "entrega",
      shipping_method: sanitize(body.shipping_method, 30),
      shipping_price:  Number(body.shipping_price) || 0,
      shipping_cep:    sanitize(body.shipping_cep, 10),
      shipping_address:body.shipping_address || null,
      payment_method:  allowedPayMethod.includes(body.payment_method) ? body.payment_method : null,
      payment_id:      sanitize(body.payment_id, 100),
      payment_status:  allowedPayStatus.includes(body.payment_status) ? body.payment_status : "pending",
      status:          allowedStatus.includes(body.status) ? body.status : "aguardando_pagamento",
    };

    /* usa anon key — a RLS policy permite INSERT público */
    var r = await sbFetch("/rest/v1/pedidos", "POST", data, false);
    if (!r.ok) return res.status(r.status).json({ error: "Erro ao salvar pedido.", detail: r.data });
    var created = Array.isArray(r.data) ? r.data[0] : r.data;
    return res.status(201).json({ ok: true, id: created && created.id, numero: body.numero });
  }

  return res.status(405).json({ error: "Método não permitido" });
};
