# Security Policy

## Supported Versions

O Smart Finance Hub mantém ativamente os patches de segurança para as seguintes versões:

| Version | Supported          |
| ------- | ------------------ |
| v1.0.x  | :white_check_mark: |
| v0.9.x  | :x:                |

## Responsabilidade de Divulgação (Responsible Disclosure)

A segurança dos dados bancários e das informações de nossos usuários é a maior prioridade do **Smart Finance Hub**. Seguimos os rigorosos padrões estabelecidos pela LGPD e as normativas do Open Finance no Brasil.

Se você descobrir qualquer vulnerabilidade ou falha de segurança no nosso sistema, **por favor, não divulgue publicamente**. Em vez disso, pedimos que você nos reporte confidenciais.

### Como reportar uma vulnerabilidade (Bug Bounty Program)

Para reportar uma vulnerabilidade, envie um email para `security@smartfinancehub.app` contendo:
- A descrição detalhada do bug.
- Um passo a passo (Proof of Concept - PoC) para reproduzirmos a falha localmente.
- O impacto potencial que isso teria nos dados ou no serviço.

A nossa equipe técnica confirmará o recebimento do e-mail em até 48 horas.

### Escopo do Bug Bounty

**No escopo (Recompensados caso válidos):**
- Injeções de Banco de Dados ou manipulações de RLS no Supabase.
- Fugas de Autenticação (Bypass the JWT).
- Vazamento de Webhooks e falhas de criptografia HMAC.
- Cross-Site Scripting (XSS) em relatórios PDF ou Inputs.

**Fora do escopo:**
- Ataques de negação de serviço (DDoS) diretos contra a Vercel.
- Falhas em serviços de infraestrutura controlados exclusivamente pela Vercel, Stripe ou Supabase.
- Engenharia social contra nossos colaboradores ou usuários finais.

Agradecemos imensamente o seu empenho em manter o ecossistema financeiro livre de perigos cibernéticos!
