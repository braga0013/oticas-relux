/* ÓTICAS RELUX — consulta status de um pagamento Asaas (usado para confirmar o Pix) */
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const KEY = process.env.ASAAS_API_KEY;
  if (!KEY) return res.status(500).json({ error: "ASAAS_API_KEY não configurado." });

  const id = (req.query && req.query.id) || "";
  if (!id) return res.status(400).json({ error: "id ausente" });

  const base = process.env.ASAAS_SANDBOX
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/v3";

  try {
    const r = await fetch(base + "/payments/" + encodeURIComponent(id), {
      headers: { access_token: KEY },
    });
    const data = await r.json();
    if (!r.ok) {
      const msg = (data.errors && data.errors[0] && data.errors[0].description) || "Erro";
      return res.status(r.status).json({ error: msg });
    }
    const statusMap = {
      PENDING: "pending", AWAITING_RISK_ANALYSIS: "pending",
      CONFIRMED: "approved", RECEIVED: "approved",
      OVERDUE: "rejected", REFUNDED: "rejected",
      CHARGEBACK_REQUESTED: "rejected", CHARGEBACK_DISPUTE: "rejected",
    };
    return res.status(200).json({
      id: data.id,
      status: statusMap[data.status] || "pending",
      status_detail: data.status,
    });
  } catch (e) {
    return res.status(500).json({ error: "Falha ao consultar" });
  }
};
