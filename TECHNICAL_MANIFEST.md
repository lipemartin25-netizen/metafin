# 📜 Manifesto Técnico — Meta Finance Hub

Este documento descreve as decisões arquiteturais e os padrões de design utilizados no **Meta Finance Hub**, servindo como guia para desenvolvedores e auditoria técnica.

## 🏗️ Arquitetura Geral

O Meta Finance Hub é construído sobre uma arquitetura **BaaS-first** (Backend as a Service), utilizando o Supabase para persistência e autenticação, permitindo uma interface de usuário altamente reativa.

### Core Stack
- **Frontend:** React 18 + Vite (ESM)
- **Estilização:** Tailwind CSS (Design System customizado)
- **Backend:** Vercel Serverless Functions (Node.js 20)
- **Banco de Dados:** PostgreSQL (Supabase) com RLS ativado
- **Open Finance:** Pluggy SDK integration

---

## 🔐 Segurança e Privacidade

A segurança é o pilar central do projeto. Seguimos princípios de **Least Privilege** e **Defense in Depth**.

1.  **Row Level Security (RLS):** Toda query ao banco de dados é filtrada pelo `user_id` autenticado via JWT do Supabase. Mesmo um vazamento acidental da Service Key não expõe dados de usuários a menos que o contexto de auth seja simulado.
2.  **Webhooks Seguros:** A comunicação com o Pluggy é protegida por segredos HMAC validados no `api/pluggy/webhook.js`.
3.  **Local Obfuscation:** Dados persistidos para modo offline utilizam `secureStorage` com encoding Base64 para evitar visualização acidental em ferramentas de desenvolvedor.

---

## 🔄 Fluxo de Dados de Sincronização

O motor de sincronização (`api/pluggy/_sync.js`) é o cérebro da importação de dados bancários.

1.  **Ingestão:** Ocorre via Webhook ou Trigger Manual.
2.  **Normalização:** O Pluggy retorna dados brutos que são normalizados para o schema interno de `transactions`.
3.  **Higiene de Dados:** PIX são processados via Regex para extrair nomes de contrapartes, transformando descrições sujas em nomes amigáveis.
4.  **Categorização Semântica:** Um algoritmo de mapeamento de palavras-chave classifica as transações em categorias financeiras padrão (Alimentação, Transporte, etc.).

---

## ⚡ Performance e Escalabilidade

1.  **Code Splitting:** Rotas pesadas (Simuladores, Relatórios) são carregadas via `React.lazy`.
2.  **Manual Chunking:** Bibliotecas grandes (Recharts, jsPDF) são isoladas em chunks separados para otimizar o cache do navegador.
3.  **Static Headers:** O arquivo `vercel.json` garante que assets estáticos tenham TTL de 1 ano com `immutable`.

---

## 🧪 Estratégia de Testes

- **Unidade:** Focado em lógica matemática financeira (`src/lib/financialMath.js`).
- **Ambiente:** Vitest + Happy DOM para simulação de browser leve.
- **Integração:** Validação de fluxos de API e Mocking de respostas do Supabase.
