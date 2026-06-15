/* Óticas Relux — Admin API
   Autentica via X-Admin-User + X-Admin-Pass headers.
   Usa SUPABASE_SERVICE_KEY (env var no Vercel) para bypassar RLS. */

const ADMIN_USER = "RELUXADMIN";
const ADMIN_PASS = "DOMINGO12";
const SB_URL = (process.env.SUPABASE_URL || "https://joktfcfcssxhhyiuxwer.supabase.co").replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || "";

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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-User, X-Admin-Pass");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!SB_KEY) {
    return res.status(500).json({ error: "SUPABASE_SERVICE_KEY não configurado no Vercel. Acesse Project Settings → API → service_role no Supabase e adicione como variável de ambiente." });
  }
  if (!checkAuth(req)) {
    return res.status(401).json({ error: "Credenciais de admin inválidas." });
  }

  const body = req.body || {};
  const action = body.action || req.query.action || "list";

  try {
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

    return res.status(400).json({ error: "Ação desconhecida: " + action });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
