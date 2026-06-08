/* ÓTICAS RELUX — função serverless (Vercel) — envia e-mail de novo pedido.
   Requer a variável de ambiente RESEND_API_KEY (https://resend.com — gratuito até 3 000 e-mails/mês).
   O e-mail de destino (loja) é STORE_EMAIL; padrão: processos@elevato.com.br */

const RESEND_API = "https://api.resend.com/emails";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function fmt(n) {
  return "R$ " + Number(n).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function buildHtml(o) {
  var itemRows = (o.items || []).map(function (it) {
    return (
      '<tr>' +
      '<td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111">' + it.name + '</td>' +
      '<td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#555;text-align:center">' + it.qty + '</td>' +
      '<td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111;text-align:right">' + it.price + '</td>' +
      '</tr>'
    );
  }).join("");

  var discRow = o.discount > 0
    ? '<tr><td colspan="2" style="padding:6px 16px;font-size:13px;color:#666">Desconto Pix (5%)</td><td style="padding:6px 16px;font-size:13px;color:#16a34a;text-align:right">− ' + fmt(o.discount) + '</td></tr>'
    : "";

  var freteRow = o.shipping > 0
    ? '<tr><td colspan="2" style="padding:6px 16px;font-size:13px;color:#666">Frete (' + (o.shippingMethod || "") + ')</td><td style="padding:6px 16px;font-size:13px;color:#111;text-align:right">' + fmt(o.shipping) + '</td></tr>'
    : '<tr><td colspan="2" style="padding:6px 16px;font-size:13px;color:#666">Frete</td><td style="padding:6px 16px;font-size:13px;color:#16a34a;text-align:right">Grátis</td></tr>';

  var badgeColor = { pix: "#16a34a", cartao: "#2563eb", boleto: "#92400e" }[o.payMethod] || "#555";
  var badgeLabel = { pix: "PIX", cartao: "Cartão de crédito", boleto: "Boleto bancário" }[o.payMethod] || o.payMethod;

  var enderecoBlock = o.delivery === "loja"
    ? '<p style="margin:0;font-size:14px;color:#555"><strong>Retirar na loja</strong></p>'
    : '<p style="margin:0;font-size:14px;color:#555">' +
        o.address.rua + ', ' + o.address.numero +
        (o.address.comp ? ' (' + o.address.comp + ')' : '') +
        ' — ' + o.address.bairro + ', ' + o.address.cidade + '/' + o.address.uf +
        ' — CEP ' + o.address.cep +
      '</p>';

  return (
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Novo pedido — Óticas Relux</title></head>' +
    '<body style="margin:0;padding:0;background:#f5f5f5;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">' +
    '<tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">' +

    /* header */
    '<tr><td style="background:#0a0a0a;border-radius:12px 12px 0 0;padding:28px 32px">' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td><span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:.5px">ÓTICAS RELUX</span></td>' +
    '<td align="right"><span style="background:#f0f0f0;color:#0a0a0a;font-size:12px;font-weight:700;padding:5px 12px;border-radius:99px">NOVO PEDIDO</span></td>' +
    '</tr></table></td></tr>' +

    /* hero */
    '<tr><td style="background:#fff;padding:28px 32px 20px">' +
    '<p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0a0a0a">Pedido <span style="color:#d97706">' + o.num + '</span></p>' +
    '<p style="margin:0;font-size:13px;color:#888">' + new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) + '</p>' +
    '</td></tr>' +

    /* dados do cliente */
    '<tr><td style="background:#fff;padding:0 32px 20px">' +
    '<div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:16px 20px">' +
    '<p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase">Cliente</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td style="font-size:14px;font-weight:600;color:#111;padding-bottom:4px">' + o.customer.name + '</td></tr>' +
    '<tr><td style="font-size:13px;color:#555;padding-bottom:2px">📞 ' + o.customer.phone + '</td></tr>' +
    (o.customer.email ? '<tr><td style="font-size:13px;color:#555;padding-bottom:2px">✉️ ' + o.customer.email + '</td></tr>' : '') +
    (o.customer.cpf ? '<tr><td style="font-size:13px;color:#555">CPF ' + o.customer.cpf + '</td></tr>' : '') +
    '</table></div></td></tr>' +

    /* produtos */
    '<tr><td style="background:#fff;padding:0 32px 20px">' +
    '<p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase">Produtos</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden">' +
    '<thead><tr style="background:#fafafa">' +
    '<th style="padding:10px 16px;font-size:11px;font-weight:700;color:#888;text-align:left;text-transform:uppercase;letter-spacing:.5px">Produto</th>' +
    '<th style="padding:10px 16px;font-size:11px;font-weight:700;color:#888;text-align:center;text-transform:uppercase;letter-spacing:.5px">Qtd</th>' +
    '<th style="padding:10px 16px;font-size:11px;font-weight:700;color:#888;text-align:right;text-transform:uppercase;letter-spacing:.5px">Valor</th>' +
    '</tr></thead>' +
    '<tbody>' + itemRows + '</tbody>' +
    '<tfoot>' +
    discRow +
    freteRow +
    '<tr style="background:#fafafa"><td colspan="2" style="padding:12px 16px;font-size:15px;font-weight:700;color:#0a0a0a;border-top:2px solid #e5e7eb">Total</td>' +
    '<td style="padding:12px 16px;font-size:15px;font-weight:700;color:#0a0a0a;text-align:right;border-top:2px solid #e5e7eb">' + fmt(o.total) + '</td></tr>' +
    '</tfoot></table></td></tr>' +

    /* pagamento + entrega */
    '<tr><td style="background:#fff;padding:0 32px 28px">' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td width="48%" style="vertical-align:top">' +
    '<div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:16px 20px">' +
    '<p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase">Pagamento</p>' +
    '<span style="display:inline-block;background:' + badgeColor + ';color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px">' + badgeLabel + '</span>' +
    (o.installments > 1 ? '<p style="margin:8px 0 0;font-size:13px;color:#555">' + o.installments + 'x sem juros</p>' : '') +
    '</div></td>' +
    '<td width="4%"></td>' +
    '<td width="48%" style="vertical-align:top">' +
    '<div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:16px 20px">' +
    '<p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase">Entrega</p>' +
    enderecoBlock +
    '</div></td>' +
    '</tr></table></td></tr>' +

    /* footer */
    '<tr><td style="background:#0a0a0a;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center">' +
    '<p style="margin:0;font-size:12px;color:#888">Este e-mail foi gerado automaticamente pelo sistema da <strong style="color:#ccc">Óticas Relux</strong>.</p>' +
    '</td></tr>' +

    '</table></td></tr></table>' +
    '</body></html>'
  );
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) return res.status(500).json({ error: "RESEND_API_KEY não configurada." });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch (e) { return res.status(400).json({ error: "JSON inválido" }); }

  const storeEmail = process.env.STORE_EMAIL || "bpedrozomoralesbraga@gmail.com";
  const html = buildHtml(body);
  const subject = "🛍️ Novo pedido " + (body.num || "") + " — Óticas Relux";

  try {
    const r = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + KEY,
      },
      body: JSON.stringify({
        from: "Óticas Relux <onboarding@resend.dev>",
        to: [storeEmail],
        subject,
        html,
      }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message || "Erro ao enviar e-mail", detail: data });
    return res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    return res.status(500).json({ error: "Falha ao comunicar com o serviço de e-mail" });
  }
};
