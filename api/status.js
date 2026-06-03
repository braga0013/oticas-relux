/* ÓTICAS RELUX — consulta status de um pagamento (usado para confirmar o Pix) */
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado." });

  const id = (req.query && req.query.id) || "";
  if (!id) return res.status(400).json({ error: "id ausente" });

  try {
    const r = await fetch("https://api.mercadopago.com/v1/payments/" + encodeURIComponent(id), {
      headers: { Authorization: "Bearer " + TOKEN },
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message || "Erro" });
    return res.status(200).json({ id: data.id, status: data.status, status_detail: data.status_detail });
  } catch (e) {
    return res.status(500).json({ error: "Falha ao consultar" });
  }
};
