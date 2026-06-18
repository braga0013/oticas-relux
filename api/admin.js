/* Óticas Relux — Admin API
   Autentica via X-Admin-User + X-Admin-Pass headers.
   Usa SUPABASE_SERVICE_KEY (env var no Vercel) para bypassar RLS. */
const rateLimit = require("./_ratelimit");

const ADMIN_USER = process.env.ADMIN_USER || "";
const ADMIN_PASS = process.env.ADMIN_PASS || "";
const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || "";

/* HTML-escape helper — prevents stored XSS in admin-generated emails */
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function checkAuth(req) {
  return (
    req.headers["x-admin-user"] === ADMIN_USER &&
    req.headers["x-admin-pass"] === ADMIN_PASS
  );
}

async function sb(path, method, body, extra) {
  const headers = Object.assign(
    { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" },
    extra || {}
  );
  const opts = { method: method || "GET", headers };
  if (body !== null && body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(SB_URL + path, opts);
  const text = await res.text();
  var data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  return { ok: res.ok, status: res.status, data };
}

export default async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "https://oticasrelux.com.br";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-User, X-Admin-Pass");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (!rateLimit(ip, 30, 60000)) {
    return res.status(429).json({ error: "Muitas requisições. Tente novamente em 1 minuto." });
  }

  if (!ADMIN_USER || !ADMIN_PASS) {
    return res.status(503).json({ error: "Credenciais de admin não configuradas no servidor. Configure ADMIN_USER e ADMIN_PASS nas variáveis de ambiente." });
  }
  if (!SB_URL) {
    return res.status(503).json({ error: "SUPABASE_URL não configurado no servidor." });
  }
  if (!SB_KEY) {
    return res.status(503).json({ error: "SUPABASE_SERVICE_KEY não configurado no Vercel." });
  }
  if (!checkAuth(req)) {
    return res.status(401).json({ error: "Credenciais de admin inválidas." });
  }

  const body = req.body || {};
  const action = body.action || req.query.action || "list";

  try {
    /* ── Ping (verificar autenticação) ── */
    if (action === "ping") {
      return res.json({ ok: true });
    }

    /* ── Listar todos (incluindo inativos) ── */
    if (action === "list") {
      const r = await sb("/rest/v1/produtos?select=*&order=sort.asc,created_at.asc", "GET");
      return res.json(r.data || []);
    }

    /* ── Criar produto ── */
    if (action === "create") {
      const r = await sb("/rest/v1/produtos", "POST", body.data, { Prefer: "return=representation" });
      if (!r.ok) return res.status(r.status).json(r.data);
      return res.json(Array.isArray(r.data) ? r.data[0] : r.data);
    }

    /* ── Atualizar produto ── */
    if (action === "update") {
      if (!body.id) return res.status(400).json({ error: "id é obrigatório." });
      const r = await sb(
        "/rest/v1/produtos?id=eq." + encodeURIComponent(body.id),
        "PATCH",
        body.data,
        { Prefer: "return=representation" }
      );
      if (!r.ok) return res.status(r.status).json(r.data);
      return res.json({ ok: true });
    }

    /* ── Excluir produto ── */
    if (action === "delete") {
      if (!body.id) return res.status(400).json({ error: "id é obrigatório." });
      const r = await sb("/rest/v1/produtos?id=eq." + encodeURIComponent(body.id), "DELETE");
      if (!r.ok) return res.status(r.status).json(r.data);
      return res.json({ ok: true });
    }

    /* ── Upload de imagem para Supabase Storage ── */
    if (action === "upload") {
      const { filename, base64, mime } = body;
      if (!filename || !base64) return res.status(400).json({ error: "filename e base64 são obrigatórios." });
      const buf = Buffer.from(base64, "base64");
      const safe = Date.now() + "-" + filename.replace(/[^a-z0-9._-]/gi, "_");
      const uploadRes = await fetch(SB_URL + "/storage/v1/object/produtos-img/" + safe, {
        method: "POST",
        headers: {
          apikey: SB_KEY,
          Authorization: "Bearer " + SB_KEY,
          "Content-Type": mime || "image/jpeg",
          "x-upsert": "true",
        },
        body: buf,
      });
      if (uploadRes.ok) {
        return res.json({ url: SB_URL + "/storage/v1/object/public/produtos-img/" + safe });
      }
      const err = await uploadRes.text();
      return res.status(uploadRes.status).json({ error: err });
    }

    /* ── Listar pedidos ── */
    if (action === "orders") {
      var since = body.since ? "&created_at=gte." + encodeURIComponent(body.since) : "";
      var statusFilter = body.status ? "&status=eq." + encodeURIComponent(body.status) : "";
      var r = await sb("/rest/v1/pedidos?select=*&order=created_at.desc&limit=200" + since + statusFilter, "GET");
      return res.json(r.data || []);
    }

    /* ── Atualizar pedido (status, notas, etc.) ── */
    if (action === "order-update") {
      if (!body.numero) return res.status(400).json({ error: "numero é obrigatório." });
      var r = await sb(
        "/rest/v1/pedidos?numero=eq." + encodeURIComponent(body.numero),
        "PATCH", body.data, { Prefer: "return=representation" }
      );
      if (!r.ok) return res.status(r.status).json(r.data);

      /* envia e-mail ao cliente conforme o novo status */
      var newStatus = body.data && body.data.status;
      var RESEND_KEY = process.env.RESEND_API_KEY;
      if (newStatus && RESEND_KEY) {
        /* busca dados do cliente + tipo de entrega */
        var pedR = await sb("/rest/v1/pedidos?numero=eq." + encodeURIComponent(body.numero) + "&select=customer_name,customer_email,total,delivery_type", "GET");
        var ped = pedR.data && pedR.data[0];
        var isLoja = ped && ped.delivery_type === "loja";
        var STATUS_EMAILS = {
          em_preparo: { emoji: "🔧", titulo: "Seu pedido está sendo preparado!", msg: "Estamos separando e conferindo cada item com cuidado." + (isLoja ? " Em breve estará pronto para retirada." : " Em breve será enviado.") },
          enviado:    isLoja
            ? { emoji: "🏪", titulo: "Seu pedido está pronto para retirada!", msg: "Seu pedido está pronto! Passe na nossa loja para retirar no horário de funcionamento.\n\nEndereço: Av. Assis Brasil, 2574 — Cristo Redentor, Porto Alegre/RS." }
            : { emoji: "📦", titulo: "Seu pedido foi enviado!", msg: "Seu pedido está a caminho. Assim que tivermos o código de rastreio, te avisamos." },
          entregue:   { emoji: "✅", titulo: isLoja ? "Retirada confirmada!" : "Pedido entregue!", msg: isLoja ? "Obrigado pela visita! Esperamos que você aproveite muito." : "Seu pedido foi entregue. Esperamos que você aproveite muito! Qualquer dúvida, estamos aqui." },
          cancelado:  { emoji: "❌", titulo: "Pedido cancelado", msg: "Seu pedido foi cancelado. Se tiver alguma dúvida ou quiser fazer um novo pedido, fale conosco." },
        };
        var emailCfg = STATUS_EMAILS[newStatus];
        if (emailCfg && ped && ped.customer_email) {
          var statusHtml =
            '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Atualização do pedido</title></head>' +
            '<body style="margin:0;padding:0;background:#f5f5f5;font-family:\'Helvetica Neue\',sans-serif">' +
            '<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0"><tr><td align="center">' +
            '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">' +
            '<tr><td style="background:#0a0a0a;border-radius:12px 12px 0 0;padding:24px 32px">' +
            '<span style="font-size:20px;font-weight:800;color:#fff">ÓTICAS RELUX</span></td></tr>' +
            '<tr><td style="background:#fff;padding:32px">' +
            '<p style="font-size:24px;margin:0 0 8px">' + emailCfg.emoji + '</p>' +
            '<p style="font-size:22px;font-weight:700;color:#0a0a0a;margin:0 0 8px">' + emailCfg.titulo + '</p>' +
            '<p style="color:#555;margin:0 0 24px">Olá, ' + esc(ped.customer_name || "cliente") + '! ' + emailCfg.msg + '</p>' +
            '<div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:16px 20px;margin-bottom:24px">' +
            '<p style="margin:0;font-size:13px;color:#888">Pedido <strong style="color:#0a0a0a">' + esc(body.numero) + '</strong></p>' +
            '</div>' +
            '<a href="https://oticasrelux.com.br/pedido.html?numero=' + encodeURIComponent(body.numero) + '" ' +
            'style="display:inline-block;background:#d97706;color:#000;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">Ver meu pedido →</a>' +
            '</td></tr>' +
            '<tr><td style="background:#0a0a0a;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center">' +
            '<p style="margin:0;font-size:12px;color:#888">Dúvidas? Entre em contato pelo WhatsApp.</p>' +
            '</td></tr></table></td></tr></table></body></html>';

          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + RESEND_KEY },
            body: JSON.stringify({
              from: "Óticas Relux <onboarding@resend.dev>",
              to: [ped.customer_email],
              subject: emailCfg.emoji + " Pedido " + body.numero + " — " + emailCfg.titulo,
              html: statusHtml,
            }),
          }).catch(function() {});
        }
      }

      return res.json({ ok: true });
    }

    /* ── Enviar rastreio ao cliente ── */
    if (action === "send-tracking") {
      if (!body.numero || !body.tracking_code) {
        return res.status(400).json({ error: "numero e tracking_code são obrigatórios." });
      }
      /* 1. Busca pedido */
      var pr = await sb("/rest/v1/pedidos?numero=eq." + encodeURIComponent(body.numero) + "&select=*", "GET");
      if (!pr.ok || !pr.data || !pr.data.length) return res.status(404).json({ error: "Pedido não encontrado." });
      var pedido = pr.data[0];

      /* 2. Atualiza no banco */
      await sb(
        "/rest/v1/pedidos?numero=eq." + encodeURIComponent(body.numero),
        "PATCH",
        { tracking_code: body.tracking_code, tracking_sent_at: new Date().toISOString(), status: "enviado" }
      );

      /* 3. Envia e-mail para o cliente */
      var RESEND_KEY = process.env.RESEND_API_KEY;
      if (RESEND_KEY && pedido.customer_email) {
        var correiosUrl = "https://rastreamento.correios.com.br/objeto/" + body.tracking_code;
        var trackHtml =
          '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pedido enviado</title></head>' +
          '<body style="margin:0;padding:0;background:#f5f5f5;font-family:\'Helvetica Neue\',sans-serif">' +
          '<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0"><tr><td align="center">' +
          '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">' +
          '<tr><td style="background:#0a0a0a;border-radius:12px 12px 0 0;padding:24px 32px">' +
          '<span style="font-size:20px;font-weight:800;color:#fff">ÓTICAS RELUX</span></td></tr>' +
          '<tr><td style="background:#fff;padding:32px">' +
          '<p style="font-size:22px;font-weight:700;color:#0a0a0a;margin:0 0 8px">Seu pedido foi enviado! 📦</p>' +
          '<p style="color:#555;margin:0 0 24px">Olá, ' + esc(pedido.customer_name || "cliente") + '! Seu pedido <strong>' + esc(body.numero) + '</strong> saiu para entrega.</p>' +
          '<div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:20px;margin-bottom:24px">' +
          '<p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px">Código de rastreio</p>' +
          '<p style="margin:0;font-size:22px;font-weight:700;color:#0a0a0a;letter-spacing:2px">' + esc(body.tracking_code) + '</p>' +
          '<p style="margin:8px 0 0;font-size:13px;color:#888">Modalidade: ' + esc(pedido.shipping_method || "PAC") + ' — Correios</p>' +
          '</div>' +
          '<a href="' + esc(correiosUrl) + '" style="display:inline-block;background:#d97706;color:#000;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;margin-bottom:24px">Rastrear meu pedido →</a>' +
          '<p style="color:#888;font-size:13px;margin:0">Ou acesse: <a href="' + esc(correiosUrl) + '" style="color:#d97706">' + esc(correiosUrl) + '</a></p>' +
          '</td></tr>' +
          '<tr><td style="background:#0a0a0a;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center">' +
          '<p style="margin:0;font-size:12px;color:#888">Dúvidas? Fale conosco pelo WhatsApp.</p>' +
          '</td></tr></table></td></tr></table></body></html>';

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + RESEND_KEY },
          body: JSON.stringify({
            from: "Óticas Relux <onboarding@resend.dev>",
            to: [pedido.customer_email],
            subject: "Seu pedido " + String(body.numero).replace(/[^\w\-]/g, "") + " foi enviado! 📦",
            html: trackHtml,
          }),
        });
      }

      return res.json({ ok: true, email_sent: !!(RESEND_KEY && pedido.customer_email) });
    }

    return res.status(400).json({ error: "Ação desconhecida: " + action });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
