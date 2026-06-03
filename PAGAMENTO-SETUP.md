# Pagamento real — Mercado Pago + Vercel

Este checkout já está pronto para pagamento real (Pix, cartão e boleto) via **Mercado Pago Checkout Transparente**.
Enquanto a chave pública não for preenchida, o checkout finaliza pelo **WhatsApp** (modo demonstração) — então o preview local continua funcionando.

## 1. Conta no Mercado Pago
1. Crie/entre em uma conta em https://www.mercadopago.com.br
2. Acesse **Seus negócios → Configurações → Gestão e administração → Suas integrações** e crie uma aplicação (Checkout Transparente).
3. Pegue as credenciais em **Credenciais**:
   - **Public Key** (começa com `APP_USR-...`) → vai no front-end.
   - **Access Token** (começa com `APP_USR-...`) → fica **só no servidor** (segredo!).
   - Há um par de **TESTE** e um de **PRODUÇÃO**. Comece com os de **TESTE**.

## 2. Configurar o site
- Em [assets/js/products.js](assets/js/products.js), no `RELUX_CONFIG`, cole a **Public Key**:
  ```js
  window.RELUX_CONFIG = {
    whatsapp: "5511999999999",
    mpPublicKey: "APP_USR-xxxxxxxx-xxxx-xxxx", // <- sua Public Key
    apiBase: ""  // deixe vazio (API na mesma URL, na Vercel)
  };
  ```

## 3. Deploy na Vercel
1. Suba o projeto para um repositório no GitHub.
2. Em https://vercel.com → **New Project** → importe o repositório.
3. Framework Preset: **Other** (é site estático + funções). Root: a raiz do projeto.
4. Em **Settings → Environment Variables**, adicione:
   - `MP_ACCESS_TOKEN` = seu **Access Token** (de teste primeiro).
5. **Deploy**. A Vercel publica o site e transforma a pasta `api/` em funções:
   - `https://SEU-SITE.vercel.app/api/payment`
   - `https://SEU-SITE.vercel.app/api/status`

> A pasta `api/` é detectada automaticamente pela Vercel — não precisa configurar nada além da variável de ambiente.

## 4. Testar (cartões de teste do Mercado Pago)
Com as credenciais de **TESTE**, use cartões de teste (não cobram de verdade):
- **Aprovado:** Mastercard `5031 4332 1540 6351` · CVV `123` · validade `11/30`
- Nome do titular: `APRO` (aprova) ou `OTHE` (recusa) — veja a doc oficial.
- CPF de teste: `12345678909`
- **Pix de teste:** gera o QR; aprove pelo painel de testes do Mercado Pago.

Doc oficial de cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

## 5. Ir para produção
1. Troque as credenciais de TESTE pelas de **PRODUÇÃO** (Public Key no `products.js`, Access Token na Vercel).
2. Conclua o cadastro/validação da conta Mercado Pago para receber de verdade.

## (Opcional) Webhook de confirmação
Para confirmar pagamentos de forma robusta (em vez de só pelo polling do front), configure um Webhook no Mercado Pago apontando para uma função `api/webhook` — posso criar isso quando quiser.

## Netlify (alternativa à Vercel)
Funciona igual, mas as funções ficam em `netlify/functions/` em vez de `api/`. Se preferir Netlify, me avise que eu adapto os caminhos.

---

### Arquivos da integração
- [api/payment.js](api/payment.js) — cria o pagamento (Pix/cartão/boleto)
- [api/status.js](api/status.js) — consulta status (confirma o Pix)
- [assets/js/payments-mp.js](assets/js/payments-mp.js) — Mercado Pago no front (tokeniza o cartão)
- [assets/js/checkout.js](assets/js/checkout.js) — fluxo de finalização
- Config: `RELUX_CONFIG` em [assets/js/products.js](assets/js/products.js)

### Segurança
- O **Access Token** fica só na Vercel (variável de ambiente), nunca no navegador.
- O número do cartão é **tokenizado no navegador** pelo Mercado Pago — seu servidor nunca recebe os dados do cartão.
