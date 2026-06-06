/* ÓTICAS RELUX — Cálculo de frete via Melhor Envio
   Variável de ambiente obrigatória: ME_TOKEN (token de produção ou sandbox do Melhor Envio)
   Variável opcional: ME_CEP_ORIGEM (CEP da loja sem traço, padrão 01310100)
   Variável opcional: ME_SANDBOX (qualquer valor = usa sandbox) */

const ME_API_PROD    = "https://melhorenvio.com.br/api/v2/me/shipment/calculate";
const ME_API_SANDBOX = "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate";

/* Dimensões-padrão de uma embalagem de óculos/lentes (cm / kg).
   Ajuste conforme suas embalagens reais. */
const BOX = { height: 5, width: 17, length: 12, weight: 0.3 };

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const TOKEN = process.env.ME_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: "ME_TOKEN não configurado no servidor." });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch (e) { return res.status(400).json({ error: "JSON inválido" }); }

  const { cep_destino, qtd } = body;
  const cepDestino = String(cep_destino || "").replace(/\D/g, "");
  if (cepDestino.length !== 8) return res.status(400).json({ error: "CEP inválido" });

  const cepOrigem = String(process.env.ME_CEP_ORIGEM || "01310100").replace(/\D/g, "");
  const quantidade = Math.max(1, parseInt(qtd) || 1);

  /* Escala a embalagem proporcionalmente à quantidade de itens */
  const pkg = {
    height: BOX.height,
    width:  BOX.width,
    length: Math.min(BOX.length * quantidade, 60), // máx 60 cm
    weight: Math.min(parseFloat((BOX.weight * quantidade).toFixed(2)), 30), // máx 30 kg
  };

  const payload = {
    from:     { postal_code: cepOrigem },
    to:       { postal_code: cepDestino },
    package:  pkg,
    options:  { receipt: false, own_hand: false },
    services: "1,2", // 1 = PAC · 2 = SEDEX
  };

  const endpoint = process.env.ME_SANDBOX ? ME_API_SANDBOX : ME_API_PROD;

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Accept":        "application/json",
        "Authorization": "Bearer " + TOKEN,
        /* O Melhor Envio exige User-Agent com nome do app + e-mail — obrigatório */
        "User-Agent":    "Óticas Relux (contato@oticasrelux.com.br)",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "Erro no Melhor Envio", detail: data });
    }

    /* Filtra apenas serviços sem erro e mapeia para o formato do front-end */
    const opcoes = (Array.isArray(data) ? data : [])
      .filter(function (s) { return !s.error && s.price; })
      .map(function (s) {
        return {
          id:          s.id,
          nome:        s.name,                    // "PAC" | "SEDEX"
          empresa:     s.company && s.company.name, // "Correios"
          preco:       parseFloat(s.price),
          dias:        s.delivery_time,           // número de dias úteis
          currency:    s.currency || "R$",
        };
      });

    if (!opcoes.length) {
      return res.status(422).json({ error: "Nenhuma opção de frete disponível para este CEP." });
    }

    return res.status(200).json({ opcoes });
  } catch (e) {
    return res.status(500).json({ error: "Falha ao comunicar com o Melhor Envio" });
  }
};
