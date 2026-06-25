# CLAUDE.md — Óticas Relux

> Leia este arquivo INTEIRO antes de executar qualquer ação no projeto.
> Ele contém o histórico de bugs resolvidos, arquitetura, variáveis de ambiente e regras de operação.

---

## 1. Visão Geral do Projeto

E-commerce de óculos. Stack:
- **Frontend:** HTML/CSS/JS puro (sem framework)
- **Backend:** Serverless Functions (Vercel) em Node.js — pasta `api/`
- **Banco de dados:** Supabase (PostgreSQL)
- **Pagamentos:** Asaas (cartão de crédito + Pix)
- **Email:** Resend (domínio verificado: `oticasrelux.com.br`)
- **Deploy:** Vercel — produção em `https://oticasrelux.com.br`

---

## 2. Estrutura de Arquivos Críticos

```
api/
  admin.js          → CRUD de produtos (requer auth X-Admin-User/Pass)
  email.js          → Envio de emails via Resend (novo pedido + atualização de status)
  pedido.js         → Criar/consultar/atualizar pedidos (público)
  payment.js        → Integração Asaas (criar cobrança Pix/cartão)
  webhook-asaas.js  → Recebe eventos do Asaas e atualiza pedidos no banco

assets/js/
  checkout.js       → Fluxo completo de checkout + saveOrder + sendOrderEmail
  store.js          → Catálogo, carrinho, modal de lentes
  admin-produtos.js → Upload/edição de produtos (com compressão de imagem)

admin-pedidos.html  → Painel de gerenciamento de pedidos
```

---

## 3. Variáveis de Ambiente (Vercel)

Todas configuradas em Vercel → Settings → Environment Variables:

| Variável | Uso |
|----------|-----|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Chave service_role do Supabase (admin) |
| `SUPABASE_ANON_KEY` | Chave anon do Supabase — **usada pelo api/pedido.js para salvar pedidos** |
| `RESEND_API_KEY` | Chave da API do Resend para envio de emails |
| `STORE_EMAIL` | Email que recebe notificações de pedidos (`oticasreluxecommerce@gmail.com`) |
| `EMAIL_FROM` | Remetente dos emails (`noreply@oticasrelux.com.br`) |
| `ADMIN_USER` | Usuário do painel admin |
| `ADMIN_PASS` | Senha do painel admin |
| `ASAAS_API_KEY` | Chave da API do Asaas |
| `ASAAS_WEBHOOK_TOKEN` | Token de autenticação do webhook Asaas |
| `ALLOWED_ORIGIN` | CORS origin permitida (`https://oticasrelux.com.br`) |

**CRÍTICO:** Se qualquer uma dessas variáveis estiver faltando, a funcionalidade associada falha silenciosamente. Sempre verificar todas antes de investigar bugs.

---

## 4. Schema do Banco de Dados (Supabase)

### Tabela `pedidos`
```sql
numero          TEXT PRIMARY KEY    -- ex: RLX-166458
customer_name   TEXT
customer_email  TEXT
customer_phone  TEXT
customer_cpf    TEXT
user_id         UUID (nullable)
items           JSONB               -- array de { id, name, brand, qty, price, lens }
subtotal        NUMERIC
discount        NUMERIC
total           NUMERIC
delivery_type   TEXT                -- 'entrega' | 'loja' | 'casa'
shipping_method TEXT
shipping_price  NUMERIC
shipping_cep    TEXT
shipping_address JSONB              -- { rua, numero, comp, bairro, cidade, uf, cep }
payment_method  TEXT                -- 'pix' | 'cartao'
payment_id      TEXT                -- ID da cobrança no Asaas
payment_status  TEXT                -- 'pending' | 'approved' | 'cancelled' | 'rejected'
status          TEXT                -- 'aguardando_pagamento' | 'pago' | 'em_preparo' | 'enviado' | 'entregue' | 'cancelado'
tracking_code   TEXT (nullable)
tracking_sent_at TIMESTAMP (nullable)
created_at      TIMESTAMP
```

### Tabela `produtos`
```sql
id              TEXT PRIMARY KEY
name            TEXT
brand           TEXT
category        TEXT
price           TEXT                -- ex: "R$ 399,00"
oldPrice        TEXT (nullable)
installment     TEXT
img             TEXT (nullable)     -- URL da imagem
badge           TEXT (nullable)
tone            TEXT
shape           TEXT
colors          JSONB
desc            TEXT
specs           JSONB
gallery         JSONB
active          BOOLEAN
sort            INTEGER
```

### Estrutura do campo `lens` dentro de `items`:
```json
{
  "type": "sem-grau-filtro-azul" | "com-grau" | "so-armacao",
  "grau": null | "grau-leve" | "grau-moderado" | "grau-alto",
  "extras": ["antirreflexo", "fotossensivel", "filtro-azul-extra"]
}
```

---

## 5. Fluxo de Pagamento (Asaas)

### Fluxo Cartão de Crédito:
1. Cliente preenche checkout → `payCard()` em `checkout.js`
2. `RELUX_PAY.pay()` chama `api/payment.js` → cria cobrança no Asaas
3. Asaas retorna `{ status, id }`
4. Se aprovado: `saveOrder()` salva no Supabase + `sendOrderEmail()` envia email
5. **Backup:** webhook `api/webhook-asaas.js` também atualiza o pedido quando Asaas confirma

### Fluxo Pix:
1. `RELUX_PAY.pay()` cria cobrança Pix no Asaas
2. Retorna QR code → exibido para o cliente
3. `pollStatus()` verifica a cada ~10s se o Pix foi pago
4. Ao confirmar: atualiza tela + webhook também dispara

### Webhook Asaas:
- URL: `https://oticasrelux.com.br/api/webhook-asaas`
- Eventos: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`
- Autentica via header `asaas-access-token` comparado com `ASAAS_WEBHOOK_TOKEN`
- Extrai número do pedido da descrição: regex `/RLX-\d+/`

---

## 6. Sistema de Email (Resend)

- **Domínio verificado:** `oticasrelux.com.br` (verificado no Resend em 22/06/2026)
- **Remetente:** `noreply@oticasrelux.com.br` (via `EMAIL_FROM` env var)
- **Destino loja:** `oticasreluxecommerce@gmail.com` (via `STORE_EMAIL` env var)

### Tipos de email em `api/email.js`:
1. **Novo pedido** (`type` ausente): enviado para a loja + cliente ao finalizar compra
2. **Atualização de status** (`type: "status-update"`): enviado para o cliente quando admin muda status

### Quando email de status é disparado:
- Admin muda status em `admin-pedidos.html` → `saveStatusBtn` click
- Dispara para `p.customer_email` se existir
- Não dispara para `aguardando_pagamento`

---

## 7. Bugs Resolvidos — Histórico Crítico

### BUG 1: Pedidos não salvavam no banco (CRÍTICO — resolvido 22/06/2026)
**Causa raiz:** `SUPABASE_ANON_KEY` não estava configurada no Vercel. O `api/pedido.js` retornava 503, mas o `checkout.js` tinha `.catch(function(){})` silencioso — o usuário via "pagamento aprovado" mas o pedido nunca era salvo.

**Sintoma:** Pagamento aparece no Asaas como "Confirmado" mas pedido não existe no Supabase.

**Solução aplicada:**
1. Adicionada `SUPABASE_ANON_KEY` no Vercel
2. Removido o `.catch` silencioso em `saveOrder()` — agora loga o erro
3. Criado `api/webhook-asaas.js` como backup server-side

**Como verificar:** Se pedido some, checar primeiro se `SUPABASE_ANON_KEY` está no Vercel.

### BUG 2: Preço errado no checkout (resolvido)
**Causa:** `items()` não incluía `i.lens`, então `lensPrice` era ignorado no subtotal.

**Solução:** Adicionada função `itemPrice(it)` que soma `parseBRL(it.p.price) + (it.lens ? it.lens.lensPrice : 0)`. Usada em todo o fluxo de checkout.

### BUG 3: Upload de imagem falhava no admin (resolvido)
**Causa:** Vercel tem limite de 1MB no body das serverless functions. Imagens em base64 ultrapassavam.

**Solução:** Compressão client-side com Canvas API antes do upload (`compressImage()` em `admin-produtos.js` — max 1200px, JPEG 82%).

### BUG 4: Emails não chegavam (resolvido 22/06/2026)
**Causa:** `from` estava como `onboarding@resend.dev` (domínio de teste). Com esse remetente, Resend só envia para o email cadastrado na conta Resend.

**Solução:** Verificado domínio `oticasrelux.com.br` no Resend + configurado `EMAIL_FROM=noreply@oticasrelux.com.br`.

### BUG 5: "Filtro Azul" duplicado no admin (resolvido)
**Causa:** Label do tipo `sem-grau-filtro-azul` era "Filtro Azul" E o extra `filtro-azul-extra` também era "Filtro Azul".

**Solução:** Tipo `sem-grau-filtro-azul` agora exibe "Sem Grau".

---

## 8. Preços das Lentes

```
LENS_BASE:
  sem-grau-filtro-azul: R$ 100
  grau-leve:            R$ 100
  grau-moderado:        R$ 150
  grau-alto:            R$ 200

EXTRA_PRICE:
  antirreflexo:         R$ 20
  fotossensivel:        R$ 50
  filtro-azul-extra:    R$ 50

REGRA: fotossensivel não disponível para grau-moderado e grau-alto
```

---

## 9. Deploy

```bash
# Deploy para produção
npx vercel deploy --prod

# Após adicionar variável de ambiente no Vercel, sempre fazer redeploy
```

Repositório GitHub: `https://github.com/braga0013/oticas-relux`

---

## 10. Regras de Operação

1. **Antes de investigar qualquer bug:** verificar se todas as env vars do item 3 estão no Vercel
2. **Pedido não aparece no banco:** checar `SUPABASE_ANON_KEY` primeiro
3. **Email não chega:** checar `RESEND_API_KEY`, `STORE_EMAIL` e `EMAIL_FROM` no Vercel
4. **Após qualquer mudança de env var:** fazer redeploy (`npx vercel deploy --prod`)
5. **Upload de imagem falha:** provavelmente imagem > 1MB — a compressão via Canvas deve resolver
6. **Pagamento confirmado no Asaas mas não no banco:** webhook em `api/webhook-asaas.js` deve ter corrigido; verificar logs do Vercel
7. **Nunca remover** `SUPABASE_ANON_KEY` do Vercel — causa perda silenciosa de todos os pedidos

---

## 11. Pedido Manual (emergência)

Se um pedido foi pago no Asaas mas não apareceu no banco, inserir manualmente via Supabase SQL:

```sql
INSERT INTO pedidos (
  numero, customer_name, customer_email, customer_phone, customer_cpf,
  total, payment_method, payment_status, status, items, delivery_type,
  shipping_address, created_at
) VALUES (
  'RLX-XXXXXX', 'Nome Cliente', 'email@exemplo.com', '51999999999', '00000000000',
  399.00, 'cartao', 'approved', 'pago',
  '[{"id":"prod_id","name":"Nome Produto","qty":1,"price":399}]',
  'casa',
  '{"rua":"Rua X","numero":"123","cidade":"Porto Alegre","uf":"RS","cep":"90000000"}'::jsonb,
  NOW()
);
```

---

## 12. Contatos e Acessos

- **Loja:** `oticasrelux.com.br`
- **Email loja:** `oticasreluxecommerce@gmail.com`
- **Supabase project:** `joktfcfcssxhhyiuxwer`
- **Vercel project:** `braga0013s-projects/oticas-relux`
- **GitHub:** `braga0013/oticas-relux`
