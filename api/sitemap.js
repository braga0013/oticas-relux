/* Óticas Relux — sitemap.xml dinâmico
   Serve as páginas estáticas + uma URL por produto ativo do Supabase.

   Por que dinâmico: o catálogo e as PDPs são renderizados no cliente, então o
   HTML servido não tem nenhum <a href="/produto?id=..."> para o Googlebot
   seguir. Sem estas URLs no sitemap o Google não descobre produto nenhum.
   Gerar um arquivo estático exigiria regerar na mão a cada cadastro no admin. */

const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SB_ANON = process.env.SUPABASE_ANON_KEY || "";
const SITE = "https://www.oticasrelux.com.br";

/* mesma lista de api/.. e products.js: produtos que a loja pediu p/ esconder */
const EXCLUDED = [
  "optogel", "century", "medisoft", "permeafluor", "rgp-asfericas", "planex",
  "bifocal", "magic-top", "magic top", "torica", "dupla-face", "dupla face",
  "optycolor", "familia-oxy", "family oxy",
];

function isExcluded(r) {
  const s = ((r.id || "") + " " + (r.name || "")).toLowerCase();
  return EXCLUDED.some((kw) => s.indexOf(kw) > -1);
}

function xmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/* sem <lastmod> de propósito: a tabela só tem created_at, que não muda quando
   o produto é editado. lastmod errado faz o Google descartar o sinal. */
function urlTag(loc, changefreq, priority) {
  return "  <url>\n" +
    "    <loc>" + xmlEscape(loc) + "</loc>\n" +
    "    <changefreq>" + changefreq + "</changefreq>\n" +
    "    <priority>" + priority + "</priority>\n" +
    "  </url>";
}

module.exports = async function handler(req, res) {
  const urls = [
    urlTag(SITE + "/", "weekly", "1.0"),
    urlTag(SITE + "/catalogo", "weekly", "0.9"),
    urlTag(SITE + "/sobre", "monthly", "0.7"),
  ];

  /* produtos: se o Supabase falhar, ainda devolvemos as páginas estáticas em
     vez de um 500 — um sitemap parcial é melhor que nenhum. */
  if (SB_URL && SB_ANON) {
    try {
      const r = await fetch(
        SB_URL + "/rest/v1/produtos?select=id,name&active=eq.true&order=sort.asc",
        { headers: { apikey: SB_ANON, Authorization: "Bearer " + SB_ANON } }
      );
      if (r.ok) {
        const rows = await r.json();
        (rows || []).forEach((row) => {
          if (!row.id || isExcluded(row)) return;
          urls.push(urlTag(
            SITE + "/produto?id=" + encodeURIComponent(row.id), "weekly", "0.8"
          ));
        });
      }
    } catch (e) { /* mantém só as estáticas */ }
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join("\n") + "\n</urlset>\n";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).send(xml);
};
