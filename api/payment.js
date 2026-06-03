/* ÓTICAS RELUX — função serverless (Vercel) — cria pagamento no Mercado Pago.
   Requer a variável de ambiente MP_ACCESS_TOKEN (Access Token de PRODUÇÃO ou TESTE).
   NUNCA exponha o Access Token no front-end. */
const MP_API = "https://api.mercadopago.com/v1/payments";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado no servidor." });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch (e) { return res.status(400).json({ error: "JSON inválido" }); }

  const { method, amount, description, payer, token, installments, payment_method_id, issuer_id } = body;
  const value = Math.round((Number(amount) || 0) * 100) / 100;
  if (!value || value <= 0) return res.status(400).json({ error: "Valor inválido" });

  // monta o corpo conforme o método
  const payment = {
    transaction_amount: value,
    description: description || "Pedido Óticas Relux",
    payer: {
      email: (payer && payer.email) || "cliente@oticasrelux.com.br",
      first_name: (payer && payer.first_name) || undefined,
      last_name: (payer && payer.last_name) || undefined,
    },
  };
  if (payer && payer.cpf) {
    payment.payer.identification = { type: "CPF", number: String(payer.cpf).replace(/\D/g, "") };
  }

  if (method === "pix") {
    payment.payment_method_id = "pix";
  } else if (method === "boleto") {
    payment.payment_method_id = "bolbradesco";
    // boleto exige nome e CPF do pagador
  } else if (method === "card") {
    if (!token || !payment_method_id) return res.status(400).json({ error: "Dados do cartão incompletos" });
    payment.token = token;
    payment.installments = Number(installments) || 1;
    payment.payment_method_id = payment_method_id;
    if (issuer_id) payment.issuer_id = issuer_id;
  } else {
    return res.status(400).json({ error: "Método de pagamento inválido" });
  }

  try {
    const r = await fetch(MP_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + TOKEN,
        "X-Idempotency-Key": (Date.now() + "-" + Math.random().toString(36).slice(2)),
      },
      body: JSON.stringify(payment),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.message || "Erro no pagamento", detail: data });
    }
    const tx = data.point_of_interaction && data.point_of_interaction.transaction_data;
    return res.status(200).json({
      id: data.id,
      status: data.status,            // approved | pending | in_process | rejected
      status_detail: data.status_detail,
      qr_code: tx ? tx.qr_code : null,
      qr_code_base64: tx ? tx.qr_code_base64 : null,
      ticket_url: tx ? tx.ticket_url : (data.transaction_details && data.transaction_details.external_resource_url) || null,
    });
  } catch (e) {
    return res.status(500).json({ error: "Falha ao comunicar com o Mercado Pago" });
  }
};
