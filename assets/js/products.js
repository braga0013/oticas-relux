/* Configuração geral.
   - whatsapp: número da loja (apenas dígitos, com DDI 55).
   - mpPublicKey: chave PÚBLICA do Mercado Pago (começa com APP_USR-... ou TEST-...).
       Vazio = checkout finaliza por WhatsApp (modo demonstração/local).
       Preenchido = pagamento real (Pix/cartão/boleto) via /api (precisa deploy).
   - apiBase: deixe "" se a API estiver na mesma URL do site (Vercel). */
window.RELUX_CONFIG = {
  whatsapp: "5500000000000",
  mpPublicKey: "",
  apiBase: "",
  /* Supabase — catálogo dinâmico (as lentes vêm de lá).
     supabaseUrl: URL do projeto (https://<ref>.supabase.co)
     supabaseKey: chave PÚBLICA/anon (somente leitura via RLS). */
  supabaseUrl: "https://joktfcfcssxhhyiuxwer.supabase.co",
  supabaseKey: "sb_publishable_vxUtkkhNJ8Z_U_4EkuTutg_HY-pB-Gj",
};

/* ÓTICAS RELUX — base de produtos (compartilhada entre home e página de produto)
   Para trocar/adicionar produtos, edite este arquivo.
   Campo "img": caminho da foto (sem fundo). Se o arquivo não existir,
   o site usa automaticamente o desenho (SVG) definido em "shape".
   Campo opcional "gallery": lista de fotos (ex.: ["a.png","b.png"]). Com 2+
   fotos, aparece a tira de miniaturas na página do produto e clicar troca a
   imagem principal. Com 1 foto só, a tira fica oculta. */
window.RELUX_PRODUCTS = [
  {
    id: "aviador-classic-gold",
    brand: "Ray-Ban",
    name: "Aviador Classic Gold",
    category: "Óculos de Sol",
    img: "assets/img/produtos/sol.png",
    shape: "g-sun",
    tone: "a",
    price: "R$ 599",
    oldPrice: "R$ 749",
    badge: "-20%",
    installment: "ou 10x de R$ 59,90 sem juros",
    rating: "4.9",
    reviews: 128,
    colors: ["Dourado", "Grafite", "Prata"],
    desc:
      "Um ícone atemporal. Armação aviador em metal leve com acabamento dourado e lentes degradê, entregando proteção UV400 total sem abrir mão do estilo. Vai bem do dia a dia ao look mais sofisticado.",
    specs: [
      ["Material da armação", "Metal leve"],
      ["Proteção", "UV400 · 100% UVA/UVB"],
      ["Formato", "Aviador"],
      ["Lente", "Degradê polarizável"],
      ["Gênero", "Unissex"],
    ],
  },
  {
    id: "aviador-rx-gold",
    brand: "Ray-Ban",
    name: "Aviador RX Gold",
    category: "Óculos de Grau",
    img: "assets/img/produtos/grau.png",
    shape: "g-optic",
    tone: "b",
    price: "R$ 690",
    oldPrice: "",
    badge: "",
    installment: "ou 10x de R$ 69,00 sem juros",
    rating: "5.0",
    reviews: 73,
    colors: ["Dourado", "Tartaruga", "Prata"],
    desc:
      "O charme do aviador agora em versão para grau. Armação metálica leve com hastes em acetato Havana, compatível com lentes multifocais e antirreflexo. Elegância clássica para usar o dia inteiro.",
    specs: [
      ["Material da armação", "Metal + acetato"],
      ["Formato", "Aviador"],
      ["Compatível", "Lentes multifocais e antirreflexo"],
      ["Hastes", "Acetato Havana"],
      ["Gênero", "Unissex"],
    ],
  },
  {
    id: "lente-premium-mensal",
    brand: "Relux Vision",
    name: "Lentes Premium Mensais",
    category: "Lentes de Contato",
    img: "assets/img/produtos/lente.png",
    shape: "g-lens",
    tone: "c",
    price: "R$ 149",
    oldPrice: "",
    badge: "Novo",
    installment: "ou 3x de R$ 49,67 sem juros",
    rating: "4.8",
    reviews: 52,
    colors: ["Incolor", "Com grau"],
    desc:
      "Conforto que dura o mês inteiro. Lentes de alta hidratação com proteção UV, ideais para uso diário prolongado. Acompanha orientação completa de uso e adaptação com nossos especialistas.",
    specs: [
      ["Tipo", "Descartável mensal"],
      ["Material", "Hidrogel de silicone"],
      ["Proteção", "Filtro UV"],
      ["Conteúdo", "Caixa com 2 lentes"],
      ["Indicação", "Uso diário"],
    ],
  },
  {
    id: "relux-kids-flex",
    brand: "Relux Kids",
    name: "Kids Flex Color",
    category: "Linha Infantil",
    img: "assets/img/produtos/infantil.png",
    shape: "g-round",
    tone: "d",
    price: "R$ 320",
    oldPrice: "R$ 390",
    badge: "-18%",
    installment: "ou 6x de R$ 53,33 sem juros",
    rating: "4.9",
    reviews: 88,
    colors: ["Azul/Verde", "Rosa/Roxo", "Preto"],
    desc:
      "Feita para a rotina das crianças: armação ultraflexível e resistente a impactos, leve e confortável, com cores vibrantes. Material hipoalergênico e seguro, compatível com lentes de grau.",
    specs: [
      ["Material da armação", "TR-90 flexível"],
      ["Formato", "Arredondado"],
      ["Resistência", "Antiimpacto e antialérgico"],
      ["Faixa etária", "4 a 12 anos"],
      ["Compatível", "Lentes de grau"],
    ],
  },

  /* ===== mais ÓCULOS DE SOL ===== */
  { id: "rayban-wayfarer", brand: "Ray-Ban", name: "Wayfarer Black", category: "Óculos de Sol", img: "assets/img/produtos/sol.png", shape: "g-sun", tone: "a", price: "R$ 690", oldPrice: "R$ 769", badge: "-10%", installment: "ou 10x de R$ 69,00 sem juros", rating: "4.9", reviews: 210, colors: ["Preto", "Tartaruga"], desc: "O wayfarer mais icônico do mundo, em acetato premium com proteção UV400. Atemporal e versátil.", specs: [["Material", "Acetato"], ["Proteção", "UV400"], ["Formato", "Quadrado"]] },
  { id: "oakley-holbrook", brand: "Oakley", name: "Holbrook Prizm", category: "Óculos de Sol", img: "assets/img/produtos/sol.png", shape: "g-sport", tone: "d", price: "R$ 820", oldPrice: "", badge: "", installment: "ou 10x de R$ 82,00 sem juros", rating: "4.8", reviews: 154, colors: ["Preto fosco", "Azul"], desc: "Estilo lifestyle com lentes Prizm de alto contraste. Conforto e resistência para o dia a dia.", specs: [["Material", "O-Matter"], ["Lente", "Prizm"], ["Proteção", "UV400"]] },
  { id: "prada-sol-square", brand: "Prada", name: "Sol Square Noir", category: "Óculos de Sol", img: "assets/img/produtos/sol.png", shape: "g-optic", tone: "b", price: "R$ 1.350", oldPrice: "", badge: "", installment: "ou 10x de R$ 135,00 sem juros", rating: "5.0", reviews: 45, colors: ["Preto", "Havana"], desc: "Luxo italiano em acetato com hastes assinadas. Uma peça statement para o olhar.", specs: [["Material", "Acetato italiano"], ["Formato", "Quadrado"], ["Proteção", "UV400"]] },
  { id: "carrera-sol-sport", brand: "Carrera", name: "Sport Matte", category: "Óculos de Sol", img: "assets/img/produtos/sol.png", shape: "g-sport", tone: "d", price: "R$ 540", oldPrice: "R$ 640", badge: "-16%", installment: "ou 10x de R$ 54,00 sem juros", rating: "4.7", reviews: 98, colors: ["Preto", "Cinza"], desc: "Esportivo e leve, com pegada urbana. Excelente custo-benefício com proteção total.", specs: [["Material", "Polímero"], ["Formato", "Esportivo"], ["Proteção", "UV400"]] },
  { id: "vogue-sol-cat", brand: "Vogue", name: "Cat-Eye Gold", category: "Óculos de Sol", img: "assets/img/produtos/sol.png", shape: "g-round", tone: "a", price: "R$ 480", oldPrice: "", badge: "Novo", installment: "ou 8x de R$ 60,00 sem juros", rating: "4.8", reviews: 76, colors: ["Dourado", "Nude"], desc: "Formato gatinho elegante com acabamento dourado. Feminino e sofisticado.", specs: [["Material", "Metal"], ["Formato", "Gatinho"], ["Proteção", "UV400"]] },

  /* ===== mais ÓCULOS DE GRAU ===== */
  { id: "rayban-rx-clubmaster", brand: "Ray-Ban", name: "RX Clubmaster", category: "Óculos de Grau", img: "assets/img/produtos/grau.png", shape: "g-optic", tone: "b", price: "R$ 760", oldPrice: "", badge: "", installment: "ou 10x de R$ 76,00 sem juros", rating: "4.9", reviews: 132, colors: ["Havana", "Preto"], desc: "Clássico clubmaster com browline marcante. Compatível com qualquer grau.", specs: [["Material", "Acetato + metal"], ["Formato", "Browline"], ["Compatível", "Multifocal"]] },
  { id: "prada-rx-square", brand: "Prada", name: "RX Square", category: "Óculos de Grau", img: "assets/img/produtos/grau.png", shape: "g-optic", tone: "b", price: "R$ 1.190", oldPrice: "", badge: "", installment: "ou 10x de R$ 119,00 sem juros", rating: "5.0", reviews: 58, colors: ["Preto", "Cristal"], desc: "Design quadrado sofisticado em acetato italiano. Elegância para usar todo dia.", specs: [["Material", "Acetato italiano"], ["Formato", "Quadrado"], ["Compatível", "Antirreflexo"]] },
  { id: "oakley-rx-sport", brand: "Oakley", name: "RX Sport Steel", category: "Óculos de Grau", img: "assets/img/produtos/grau.png", shape: "g-optic", tone: "b", price: "R$ 720", oldPrice: "", badge: "", installment: "ou 10x de R$ 72,00 sem juros", rating: "4.8", reviews: 64, colors: ["Grafite", "Prata"], desc: "Armação metálica leve e resistente, ideal para rotina ativa.", specs: [["Material", "Aço leve"], ["Formato", "Retangular"], ["Compatível", "Multifocal"]] },
  { id: "vogue-rx-round", brand: "Vogue", name: "RX Round", category: "Óculos de Grau", img: "assets/img/produtos/grau.png", shape: "g-round", tone: "b", price: "R$ 450", oldPrice: "R$ 520", badge: "-13%", installment: "ou 8x de R$ 56,25 sem juros", rating: "4.7", reviews: 89, colors: ["Dourado", "Rosé"], desc: "Redondo delicado e moderno. Leve e confortável para o dia a dia.", specs: [["Material", "Metal"], ["Formato", "Redondo"], ["Compatível", "Antirreflexo"]] },
  { id: "carrera-rx-metal", brand: "Carrera", name: "RX Metal", category: "Óculos de Grau", img: "assets/img/produtos/grau.png", shape: "g-optic", tone: "b", price: "R$ 580", oldPrice: "", badge: "", installment: "ou 10x de R$ 58,00 sem juros", rating: "4.8", reviews: 51, colors: ["Prata", "Azul"], desc: "Metal moderno com hastes flexíveis. Resistente e estiloso.", specs: [["Material", "Metal"], ["Formato", "Retangular"], ["Compatível", "Multifocal"]] },

  /* ===== mais LENTES DE CONTATO ===== */
  { id: "lente-diaria", brand: "Relux Vision", name: "Lentes Diárias (30un)", category: "Lentes de Contato", img: "assets/img/produtos/lente.png", shape: "g-lens", tone: "c", price: "R$ 120", oldPrice: "", badge: "", installment: "ou 3x de R$ 40,00 sem juros", rating: "4.8", reviews: 77, colors: ["Incolor"], desc: "Praticidade máxima: usa e descarta. Caixa com 30 lentes de alta hidratação.", specs: [["Tipo", "Descartável diária"], ["Conteúdo", "30 lentes"], ["Proteção", "Filtro UV"]] },
  { id: "lente-colorida", brand: "Relux Color", name: "Lentes Coloridas", category: "Lentes de Contato", img: "assets/img/produtos/lente.png", shape: "g-lens", tone: "c", price: "R$ 180", oldPrice: "", badge: "Novo", installment: "ou 4x de R$ 45,00 sem juros", rating: "4.7", reviews: 63, colors: ["Mel", "Verde", "Azul", "Cinza"], desc: "Mude o visual com naturalidade. Disponível com ou sem grau.", specs: [["Tipo", "Mensal colorida"], ["Cores", "4 opções"], ["Grau", "Com ou sem"]] },
  { id: "lente-astig", brand: "Relux Vision", name: "Lentes p/ Astigmatismo", category: "Lentes de Contato", img: "assets/img/produtos/lente.png", shape: "g-lens", tone: "c", price: "R$ 210", oldPrice: "", badge: "", installment: "ou 4x de R$ 52,50 sem juros", rating: "4.9", reviews: 40, colors: ["Incolor"], desc: "Lentes tóricas para correção de astigmatismo com visão nítida e estável.", specs: [["Tipo", "Tórica mensal"], ["Indicação", "Astigmatismo"], ["Proteção", "Filtro UV"]] },
  { id: "lente-anual", brand: "Relux Vision", name: "Kit Anual", category: "Lentes de Contato", img: "assets/img/produtos/lente.png", shape: "g-lens", tone: "c", price: "R$ 690", oldPrice: "R$ 790", badge: "-13%", installment: "ou 10x de R$ 69,00 sem juros", rating: "4.9", reviews: 120, colors: ["Incolor"], desc: "Economia para o ano todo. Kit completo com solução inclusa.", specs: [["Tipo", "Mensal (12 meses)"], ["Conteúdo", "Kit anual + solução"], ["Proteção", "Filtro UV"]] },

  /* ===== mais LINHA INFANTIL ===== */
  { id: "kids-sol-uv", brand: "Relux Kids", name: "Kids Sol UV", category: "Linha Infantil", img: "assets/img/produtos/infantil.png", shape: "g-round", tone: "d", price: "R$ 240", oldPrice: "", badge: "", installment: "ou 4x de R$ 60,00 sem juros", rating: "4.9", reviews: 55, colors: ["Azul", "Rosa"], desc: "Óculos de sol infantil com proteção UV400 e armação flexível super resistente.", specs: [["Material", "TR-90"], ["Proteção", "UV400"], ["Faixa etária", "3 a 10 anos"]] },
  { id: "kids-flex-rosa", brand: "Relux Kids", name: "Kids Flex Rosa", category: "Linha Infantil", img: "assets/img/produtos/infantil.png", shape: "g-round", tone: "d", price: "R$ 320", oldPrice: "", badge: "", installment: "ou 6x de R$ 53,33 sem juros", rating: "4.9", reviews: 48, colors: ["Rosa/Roxo"], desc: "Armação flexível e colorida, pensada para o conforto e a segurança das crianças.", specs: [["Material", "TR-90 flexível"], ["Formato", "Arredondado"], ["Faixa etária", "4 a 12 anos"]] },
  { id: "kids-grau-azul", brand: "Relux Kids", name: "Kids Grau Azul", category: "Linha Infantil", img: "assets/img/produtos/infantil.png", shape: "g-round", tone: "d", price: "R$ 290", oldPrice: "", badge: "", installment: "ou 6x de R$ 48,33 sem juros", rating: "4.8", reviews: 37, colors: ["Azul/Verde"], desc: "Armação de grau infantil leve e durável, ideal para a escola e o dia a dia.", specs: [["Material", "TR-90 flexível"], ["Formato", "Arredondado"], ["Compatível", "Lentes de grau"]] },
  { id: "kids-sport", brand: "Relux Kids", name: "Kids Sport", category: "Linha Infantil", img: "assets/img/produtos/infantil.png", shape: "g-round", tone: "d", price: "R$ 350", oldPrice: "", badge: "Novo", installment: "ou 6x de R$ 58,33 sem juros", rating: "4.8", reviews: 29, colors: ["Verde", "Laranja"], desc: "Para os pequenos esportistas: resistente a impactos e com alça de segurança.", specs: [["Material", "TR-90"], ["Proteção", "UV400"], ["Faixa etária", "4 a 12 anos"]] },
];

/* ---------- helpers ---------- */
window.RELUX = window.RELUX || {};

/* Carrega produtos extras cadastrados via admin */
(function () {
  try {
    var extra = JSON.parse(localStorage.getItem("relux-products-extra")) || [];
    if (extra.length) window.RELUX_PRODUCTS = window.RELUX_PRODUCTS.concat(extra);
  } catch (e) {}
})();

/* ============================================================
   Catálogo dinâmico via Supabase (ex.: lentes Oftalsul).
   Busca a tabela "produtos" e injeta em RELUX_PRODUCTS.
   Expõe RELUX.productsReady (Promise) e RELUX.whenReady(cb)
   para as páginas renderizarem só depois que os dados chegarem.
   ============================================================ */
(function () {
  function fmtPrice(v) {
    var n = Number(v);
    if (!isFinite(n) || n <= 0) return "";
    return "R$ " + n.toFixed(2).replace(".", ",");
  }
  /* converte uma linha do banco no formato de produto do site */
  function mapRow(r) {
    return {
      id: r.id,
      brand: r.brand || "Oftalsul",
      name: r.name || r.id,
      category: r.category || "Lentes de Contato",
      img: r.img || "",
      shape: r.shape || "g-lens",
      tone: r.tone || "c",
      price: fmtPrice(r.price),
      oldPrice: r.old_price ? fmtPrice(r.old_price) : "",
      badge: r.badge || "",
      installment: r.installment || "",
      rating: "",
      reviews: "",
      colors: Array.isArray(r.colors) ? r.colors : [],
      desc: r.descricao || "",
      specs: Array.isArray(r.specs) ? r.specs : [],
      _source: "supabase",
    };
  }

  /* produtos removidos a pedido da loja (não aparecem mesmo que estejam no banco) */
  var EXCLUDED_KEYWORDS = [
    "optogel", "century", "medisoft", "medisoft", "permeafluor",
    "rgp-asfericas", "planex", "bifocal", "magic-top", "magic top",
    "torica", "dupla-face", "dupla face", "optycolor", "familia-oxy", "family oxy"
  ];
  function isExcluded(r) {
    var str = ((r.id || "") + " " + (r.name || "")).toLowerCase();
    return EXCLUDED_KEYWORDS.some(function (kw) { return str.indexOf(kw) > -1; });
  }

  var cfg = window.RELUX_CONFIG || {};
  var ready;
  if (!cfg.supabaseUrl || !cfg.supabaseKey) {
    ready = Promise.resolve(); // sem config = só produtos locais
  } else {
    var url = cfg.supabaseUrl.replace(/\/+$/, "") +
      "/rest/v1/produtos?select=*&active=eq.true&order=sort.asc";
    ready = fetch(url, {
      headers: { apikey: cfg.supabaseKey, Authorization: "Bearer " + cfg.supabaseKey },
    })
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (rows) {
        var have = {};
        window.RELUX_PRODUCTS.forEach(function (p) { have[p.id] = true; });
        (rows || []).forEach(function (r) {
          if (!have[r.id] && !isExcluded(r)) window.RELUX_PRODUCTS.push(mapRow(r));
        });
      })
      .catch(function () { /* offline/erro: mantém produtos locais */ });
  }

  window.RELUX.productsReady = ready;
  /* chama cb quando DOM + produtos do Supabase estiverem prontos */
  window.RELUX.whenReady = function (cb) {
    function go() { ready.then(function () { try { cb(); } catch (e) {} }); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
    else go();
  };
})();

window.RELUX.findProduct = function (id) {
  return (window.RELUX_PRODUCTS || []).filter(function (p) { return p.id === id; })[0] || null;
};

/* monta a "moldura" da mídia: foto (se houver) + SVG de fallback */
window.RELUX.mediaInner = function (p, extra) {
  var img = p.img
    ? '<img class="frame-photo" src="' + p.img + '" alt="' + p.name +
      '" loading="lazy" onerror="this.closest(\'[data-tone]\').classList.remove(\'has-photo\'); this.remove();">'
    : "";
  return (extra || "") + img + '<svg viewBox="0 0 200 80" aria-hidden="true"><use href="#' + p.shape + '"/></svg>';
};

/* ícone de coração (favoritar) reutilizável */
window.RELUX.heartSVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.3C.7 9 1.6 5.7 4.7 4.8 6.8 4.2 9 5 12 8c3-3 5.2-3.8 7.3-3.2 3.1.9 4 4.2 2.7 6.9C19.5 16.4 12 21 12 21Z"/></svg>';

/* Build a product card: link p/ a página + coração (favoritos) + adicionar à sacola */
window.RELUX.cardHTML = function (p) {
  var badge = p.badge ? '<span class="badge">' + p.badge + "</span>" : "";
  var old = p.oldPrice ? '<span class="old">' + p.oldPrice + "</span>" : "";
  var cls = "product-media" + (p.img ? " has-photo" : "");
  return (
    '<div class="product" data-id="' + p.id + '">' +
      '<button class="fav-btn" type="button" data-fav="' + p.id + '" aria-label="Adicionar aos favoritos">' + window.RELUX.heartSVG + "</button>" +
      '<a class="product-link" href="produto.html?id=' + p.id + '">' +
        '<div class="' + cls + '" data-tone="' + p.tone + '">' +
          window.RELUX.mediaInner(p, badge) +
        "</div>" +
        '<div class="product-body">' +
          '<span class="product-brand">' + p.brand + "</span>" +
          '<h3 class="product-name">' + p.name + "</h3>" +
          '<div class="product-price">' + old + '<span class="now">' + p.price + "</span></div>" +
          '<span class="installment">' + p.installment + "</span>" +
        "</div>" +
      "</a>" +
      '<div class="product-foot">' +
        '<button class="btn btn-primary btn-block add-btn" type="button" data-add="' + p.id + '">Adicionar à sacola</button>' +
      "</div>" +
    "</div>"
  );
};

/* normaliza texto p/ busca (minúsculo, sem acento) */
window.RELUX.normalize = function (s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
};
/* texto pesquisável de um produto (nome, marca, categoria, descrição, specs, cores) */
window.RELUX.searchText = function (p) {
  var parts = [p.name, p.brand, p.category, p.desc].concat(p.colors || []);
  (p.specs || []).forEach(function (s) { parts.push(s[0], s[1]); });
  return window.RELUX.normalize(parts.join(" "));
};
/* busca estilo Mercado Livre: todos os termos precisam aparecer (AND) */
window.RELUX.search = function (query, opts) {
  opts = opts || {};
  var list = window.RELUX_PRODUCTS || [];
  if (opts.category) list = list.filter(function (p) { return p.category === opts.category; });
  var q = window.RELUX.normalize(query).trim();
  if (!q) return list.slice();
  var terms = q.split(/\s+/);
  return list.filter(function (p) {
    var txt = window.RELUX.searchText(p);
    return terms.every(function (t) { return txt.indexOf(t) > -1; });
  });
};

/* Auto-render the homepage featured grid if present (apenas destaques) */
document.addEventListener("DOMContentLoaded", function () {
  var grid = document.getElementById("productGrid");
  if (grid && !grid.getAttribute("data-rendered")) {
    var FEAT = ["aviador-classic-gold", "aviador-rx-gold", "lente-premium-mensal", "relux-kids-flex", "rayban-wayfarer", "prada-sol-square", "rayban-rx-clubmaster", "kids-sol-uv"];
    var featured = window.RELUX_PRODUCTS.filter(function (p) { return FEAT.indexOf(p.id) > -1; });
    if (!featured.length) featured = window.RELUX_PRODUCTS.slice(0, 8);
    grid.innerHTML = featured.map(window.RELUX.cardHTML).join("");
    grid.setAttribute("data-rendered", "1");
  }
});
