/* Óticas Relux — Frete fixo por região (origem: Porto Alegre/RS)
   Valores com margem de segurança — loja nunca sai no prejuízo.
   Frete grátis automático para pedidos acima de R$ 300. */

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/* Mapeamento de faixas de CEP → região */
function cepToRegion(cep) {
  var n = parseInt(String(cep).replace(/\D/g, "").padStart(8, "0").slice(0, 5), 10);
  if (n >= 1000  && n <= 39999) return "sudeste";    // SP, RJ, ES, MG
  if (n >= 40000 && n <= 65999) return "nordeste";   // BA, SE, PE, AL, PB, RN, CE, PI, MA
  if (n >= 66000 && n <= 69999) return "norte";      // PA, AM, RR, AC, AP
  if (n >= 70000 && n <= 72999) return "centroeste"; // DF
  if (n >= 73000 && n <= 76999) return "centroeste"; // GO
  if (n >= 77000 && n <= 77999) return "norte";      // TO
  if (n >= 78000 && n <= 79999) return "centroeste"; // MT, MS
  if (n >= 80000 && n <= 99999) return "sul";        // PR, SC, RS
  return "sul";
}

/* Tabela de preços — margem ~40% acima do custo real dos Correios.
   Prazo em dias úteis a partir de Porto Alegre/RS. */
var TABELA = {
  sul:        { pac: { preco: 26.90, dias: 7  }, sedex: { preco: 44.90, dias: 2 } },
  sudeste:    { pac: { preco: 34.90, dias: 9  }, sedex: { preco: 59.90, dias: 3 } },
  centroeste: { pac: { preco: 39.90, dias: 11 }, sedex: { preco: 67.90, dias: 4 } },
  nordeste:   { pac: { preco: 44.90, dias: 13 }, sedex: { preco: 74.90, dias: 5 } },
  norte:      { pac: { preco: 49.90, dias: 16 }, sedex: { preco: 84.90, dias: 6 } },
};

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  var body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch (e) { return res.status(400).json({ error: "JSON inválido" }); }

  var cep = String(body.cep_destino || "").replace(/\D/g, "");
  if (cep.length !== 8) return res.status(400).json({ error: "CEP inválido" });

  var regiao = cepToRegion(cep);
  var t = TABELA[regiao] || TABELA.sul;

  return res.status(200).json({
    opcoes: [
      { id: "pac",   nome: "PAC",   empresa: "Correios", preco: t.pac.preco,   dias: t.pac.dias   },
      { id: "sedex", nome: "SEDEX", empresa: "Correios", preco: t.sedex.preco, dias: t.sedex.dias },
    ],
    regiao: regiao,
  });
};
