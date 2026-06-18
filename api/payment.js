/* ÓTICAS RELUX — Asaas — cria pagamento (Pix, Boleto, Cartão de Crédito).
   Requer a variável de ambiente ASAAS_API_KEY (chave de produção ou sandbox).
   NUNCA exponha a chave no front-end. */
const rateLimit = require("./_ratelimit");

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function asaasBase() {
  return process.env.ASAAS_SANDBOX
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/v3";
}

async function asaasReq(path, method, body, key) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", access_token: key },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(asaasBase() + path, opts);
  const data = await r.json();
  if (!r.ok) {
    const msg = (data.errors && data.errors[0] && data.errors[0].description) || "Erro Asaas";
    const err = new Error(msg);
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function findOrCreateCustomer(payer, key) {
  const cpf = String(payer.cpf || "").replace(/\D/g, "");
  if (cpf.length >= 11) {
    const s = await asaasReq("/customers?cpfCnpj=" + encodeURIComponent(cpf) + "&limit=1", "GET", null, key);
    if (s.data && s.data.length > 0) return s.data[0].id;
  }
  const phone = String(payer.phone || "").replace(/\D/g, "").slice(0, 20);
  const c = await asaasReq("/customers", "POST", {
    name: payer.name || "Cliente Relux",
    email: payer.email || "cliente@oticasrelux.com.br",
    mobilePhone: phone || undefined,
    cpfCnpj: cpf.length >= 11 ? cpf : undefined,
    notificationDisabled: true,
  }, key);
  return c.id;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (!rateLimit(ip, 10, 60000)) {
    return res.status(429).json({ error: "Muitas tentativas de pagamento. Aguarde 1 minuto." });
  }

  const KEY = process.env.ASAAS_API_KEY;
  if (!KEY) return res.status(500).json({ error: "ASAAS_API_KEY não configurado no servidor." });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch (e) { return res.status(400).json({ error: "JSON inválido" }); }

  const { method, amount, description, payer, creditCard, installments } = body;
  const value = Math.round((Number(amount) || 0) * 100) / 100;
  if (!value || value <= 0) return res.status(400).json({ error: "Valor inválido" });

  const billingTypeMap = { pix: "PIX", boleto: "BOLETO", card: "CREDIT_CARD" };
  const billingType = billingTypeMap[method];
  if (!billingType) return res.status(400).json({ error: "Método de pagamento inválido" });

  try {
    const customerId = await findOrCreateCustomer(payer || {}, KEY);

    const due = new Date();
    due.setDate(due.getDate() + 1);
    const dueDate = due.toISOString().slice(0, 10);

    const charge = {
      customer: customerId,
      billingType,
      value,
      dueDate,
      description: description || "Pedido Óticas Relux",
    };

    if (billingType === "CREDIT_CARD") {
      if (!creditCard || !creditCard.number) {
        return res.status(400).json({ error: "Dados do cartão incompletos" });
      }
      const inst = Number(installments) || 1;
      if (inst > 1) {
        charge.installmentCount = inst;
        charge.installmentValue = Math.round((value / inst) * 100) / 100;
      }
      charge.creditCard = {
        holderName: creditCard.holderName || (payer && payer.name) || "N/A",
        number: String(creditCard.number).replace(/\s/g, ""),
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear && String(creditCard.expiryYear).length === 2
          ? "20" + creditCard.expiryYear : creditCard.expiryYear,
        ccv: creditCard.ccv,
      };
      const cpfRaw = String((payer && payer.cpf) || "").replace(/\D/g, "");
      charge.creditCardHolderInfo = {
        name: (payer && payer.name) || creditCard.holderName || "N/A",
        email: (payer && payer.email) || "cliente@oticasrelux.com.br",
        cpfCnpj: cpfRaw.length >= 11 ? cpfRaw : "00000000000",
        postalCode: String((payer && payer.cep) || "90500000").replace(/\D/g, "") || "90500000",
        addressNumber: (payer && payer.addressNumber) || "S/N",
        phone: String((payer && payer.phone) || "").replace(/\D/g, "") || "51000000000",
      };
    }

    const payment = await asaasReq("/payments", "POST", charge, KEY);

    let qr_code = null, qr_code_base64 = null, ticket_url = null;

    if (billingType === "PIX") {
      /* aguarda 1s — Asaas às vezes precisa de um momento para gerar o QR */
      await new Promise(function(r) { setTimeout(r, 1000); });
      try {
        const pix = await asaasReq("/payments/" + payment.id + "/pixQrCode", "GET", null, KEY);
        console.log("[payment] pixQrCode response:", JSON.stringify(pix));
        qr_code = pix.payload || null;
        qr_code_base64 = pix.encodedImage || null;
      } catch (pixErr) {
        console.error("[payment] pixQrCode error:", pixErr && (pixErr.message || pixErr));
      }
    }

    if (billingType === "BOLETO") {
      ticket_url = payment.bankSlipUrl || null;
    }

    const statusMap = {
      PENDING: "pending", AWAITING_RISK_ANALYSIS: "pending",
      CONFIRMED: "approved", RECEIVED: "approved",
      OVERDUE: "rejected", REFUNDED: "rejected",
      CHARGEBACK_REQUESTED: "rejected", CHARGEBACK_DISPUTE: "rejected",
    };

    return res.status(200).json({
      id: payment.id,
      status: statusMap[payment.status] || "pending",
      status_detail: payment.status,
      qr_code,
      qr_code_base64,
      ticket_url,
    });
  } catch (e) {
    if (e.data) {
      return res.status(e.status || 500).json({ error: e.message || "Erro no pagamento", detail: e.data });
    }
    return res.status(500).json({ error: "Falha ao comunicar com o Asaas" });
  }
};
