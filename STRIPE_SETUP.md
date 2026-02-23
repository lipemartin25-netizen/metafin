# 💳 MetaFin — Guia de Setup do Stripe

> Guia completo para configurar pagamentos reais com Stripe + Supabase Edge Functions.
> Tempo estimado: ~30 minutos.

---

## 📋 Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Criar Conta Stripe](#2-criar-conta-stripe)
3. [Instalar CLIs](#3-instalar-clis)
4. [Criar Produtos e Preços](#4-criar-produtos-e-preços)
5. [Configurar Variáveis de Ambiente](#5-configurar-variáveis-de-ambiente)
6. [Executar Schema SQL](#6-executar-schema-sql)
7. [Deploy Edge Functions](#7-deploy-edge-functions)
8. [Configurar Webhooks](#8-configurar-webhooks)
9. [Testar Localmente](#9-testar-localmente)
10. [Ir para Produção](#10-ir-para-produção)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Pré-requisitos

| Ferramenta     | Verificar            | Instalar                                                        |
| -------------- | -------------------- | --------------------------------------------------------------- |
| Node.js ≥ 18   | `node --version`     | [nodejs.org](https://nodejs.org)                                |
| Docker Desktop | `docker --version`   | [docker.com](https://docker.com/products/docker-desktop)        |
| Git            | `git --version`      | [git-scm.com](https://git-scm.com)                             |

---

## 2. Criar Conta Stripe

1. Acesse [dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crie sua conta (pode usar dados brasileiros para BRL)
3. **NÃO** ative o modo live ainda — trabalhe em **Test Mode**
4. Verifique que o toggle **"Test mode"** está **ativo** (topo direito)

---

## 3. Instalar CLIs

### 3.1 Supabase CLI

```bash
npm install -g supabase
supabase --version
```

### 3.2 Stripe CLI
**Windows (Scoop):**
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux (apt):**
```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public \
  | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" \
  | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe
```

**Verificar:**
```bash
stripe --version
```

### 3.3 Login em ambos
```bash
# Stripe — abre o browser para autorizar
stripe login

# Supabase — abre o browser para autorizar
supabase login

# Vincular ao seu projeto Supabase (trocar pelo seu ID real)
supabase link --project-ref SEU_PROJECT_ID
```
💡 O PROJECT_ID está na URL do dashboard: `https://supabase.com/dashboard/project/SEU_PROJECT_ID`

---

## 4. Criar Produtos e Preços

### Opção A: Via Dashboard (visual)
1. **Product Catalog** → **+ Add product**
2. Name: **SmartFinance Pro**
3. Description: **IA Financeira + Import ilimitado + 7 modelos IA**
4. Adicionar preço:
   - R$ 24,90 / mês (Recurring → Monthly → BRL)
   - R$ 199,00 / ano (Recurring → Yearly → BRL) (opcional)
5. Copie os **Price IDs** (price_XXXXX)

### Opção B: Via CLI (rápido)
```bash
# 1. Criar produto
stripe products create \
  --name="SmartFinance Pro" \
  --description="IA Financeira + Import ilimitado + 7 modelos IA"
# → Copie o prod_XXXXX do output

# 2. Preço mensal (2490 centavos = R$ 24,90)
stripe prices create \
  --product="prod_XXXXX" \
  --unit-amount=2490 \
  --currency=brl \
  "-d" "recurring[interval]=month"
# → Copie o price_XXXXX

# 3. Preço anual (19900 centavos = R$ 199,00) — opcional
stripe prices create \
  --product="prod_XXXXX" \
  --unit-amount=19900 \
  --currency=brl \
  "-d" "recurring[interval]=year"
# → Copie o price_YYYYY
```

### 4.1 Cupons e Testes (3 Meses Grátis)
Para oferecer 3 meses gratuitos para usuários selecionados:
1. No Stripe Dashboard → **Product Catalog** → **Coupons** → **+ New**.
2. Nome: `TESTE_3_MESES`.
3. Discount: `100%`.
4. Duration: `Multiple months` → `3 months`.
5. Ative **Promotion Codes** para gerar um link/código que os usuários possam inserir no checkout.

### 4.2 Acesso Vitalício (Bypass)
Para liberar acesso total para sempre para um usuário específico:
1. Vá ao **Supabase Dashboard** → **Table Editor** → **profiles**.
2. Localize o usuário e marque a coluna `is_internal` como `true`.
3. O app desbloqueará todas as funções Pro instantaneamente, sem precisar de assinatura no Stripe.

### 4.3 Configurar Customer Portal
⚠️ **Obrigatório** — sem isso o botão "Gerenciar Assinatura" não funciona.

1. Stripe Dashboard → **Settings** → **Billing** → **Customer portal**
2. Ative:
   - ✅ Customers can update payment methods
   - ✅ Customers can view invoice history
   - ✅ Customers can cancel subscriptions
   - ✅ Customers can switch plans (se tiver múltiplos preços)
3. **Save**

---

## 5. Configurar Variáveis de Ambiente

### 5a. Frontend — .env.local
```bash
cp .env.example .env.local
```
Edite `.env.local`:
```env
# Supabase
VITE_SUPABASE_URL=https://SEU_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Google Analytics (opcional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Stripe (chaves de TESTE)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX
VITE_STRIPE_PRICE_PRO_MONTHLY=price_XXXXX
VITE_STRIPE_PRICE_PRO_YEARLY=price_YYYYY
```
⚠️ `.env.local` está no `.gitignore` — nunca commite secrets!

### 5b. Supabase Secrets (para Edge Functions)
```bash
# Secret key do Stripe (Dashboard → Developers → API keys)
supabase secrets set STRIPE_SECRET_KEY=sk_test_XXXXX

# Webhook secret (placeholder — será atualizado no passo 8)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_placeholder

# Verificar:
supabase secrets list
```

---

## 6. Executar Schema SQL

1. Abra **Supabase Dashboard** → **SQL Editor** → **New query**
2. Cole o conteúdo de `supabase/schema_stripe.sql`
3. Clique **Run**

**Verificar campos criados:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name LIKE '%stripe%'
ORDER BY column_name;
```
Esperado: `stripe_customer_id`, `stripe_subscription_id`, `subscription_current_period_end`, `subscription_price_id`, `subscription_status`.

---

## 7. Deploy Edge Functions

Comando rápido:
```bash
npm run sb:deploy
```
Ou individual:
```bash
npm run sb:deploy:checkout
npm run sb:deploy:webhook
npm run sb:deploy:portal
```

**Verificar:**
```bash
npm run sb:list
```

---

## 8. Configurar Webhooks

### 8a. Desenvolvimento Local (Stripe CLI)
Abra um terminal separado:
```bash
npm run stripe:listen
```
Output: `> Ready! Your webhook signing secret is whsec_XXXXXXXXXXXXXXX (^C to quit)`

Copie o `whsec_` e atualize:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXX
```
⚠️ *Cada vez que reinicia stripe listen, um novo whsec_ é gerado. Sempre atualize o secret e redeploy: npm run sb:deploy:webhook*

### 8b. Produção (Webhook permanente)
1. Stripe Dashboard → **Developers** → **Webhooks** → **+ Add endpoint**
2. Endpoint URL: `https://SEU_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
3. Events to listen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copie o **Signing secret** → configure:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_LIVE_XXXXX
   ```

---

## 9. Testar Localmente

### 9a. Abrir 3 Terminais
| Terminal | Comando | Função |
| --- | --- | --- |
| 1 | `npm run stripe:listen` | Escutar webhooks Stripe |
| 2 | `npm run dev` | App React em localhost:5173 |
| 3 | `npm run sb:logs` | Logs das Edge Functions (opcional) |

### 9b. Fluxo de Teste
1. Acesse `http://localhost:5173`
2. Crie uma conta ou faça login
3. Navegue para `/app/upgrade`
4. Clique **"Começar 7 dias grátis"**
5. Na página do Stripe Checkout, use:
   - Cartão: `4242 4242 4242 4242`
   - Data: `12/29` (qualquer futura)
   - CVC: `123`
   - CEP: `01001-000`
6. Após pagamento, volte ao app:
   - ✅ Badge 💎 Pro no navbar
   - ✅ Chat IA desbloqueado
   - ✅ Import multi-formato habilitado

### 9c. Verificar no Terminal 1 (Stripe CLI)
```text
--> checkout.session.completed [evt_XXX]
<-- [200] POST https://xxx.supabase.co/functions/v1/stripe-webhook ✅
```

### 9d. Verificar no Supabase SQL Editor
```sql
SELECT full_name, plan, subscription_status, stripe_customer_id
FROM public.profiles
ORDER BY updated_at DESC
LIMIT 1;
```
Esperado: `plan = 'pro'`, `subscription_status = 'trialing'`

---

## 10. Ir para Produção

| Etapa | Ação |
| --- | --- |
| 1 | Stripe Dashboard → Desativar **Test mode** |
| 2 | Criar produtos/preços no modo Live |
| 3 | Atualizar `.env.local` com `pk_live_` e novos `price_` IDs |
| 4 | `supabase secrets set STRIPE_SECRET_KEY=sk_live_XXXXX` |
| 5 | Criar webhook de produção (seção 8b) |
| 6 | `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_LIVE_XXXXX` |
| 7 | `npm run sb:deploy` |
| 8 | `npm run build && npx vercel --prod` |
| 9 | Testar com um cartão real (valor baixo) |

---

## 11. Troubleshooting

- **webhook signing secret is invalid:**
  Recopie o `whsec_` do `stripe listen` e atualize:
  ```bash
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_NOVO_VALOR
  npm run sb:deploy:webhook
  ```
- **Edge Function retorna 500:**
  Rode `npm run sb:logs` para ver mensagens detalhadas.
- **profiles.plan não atualiza:**
  Verifique se o trigger `sync_plan_trigger` existe no Supabase.

📞 **Links Úteis:** [docs.stripe.com](https://docs.stripe.com) | [supabase.com/docs](https://supabase.com/docs)
