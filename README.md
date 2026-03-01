# MetaFin — Nexus Hub Financeiro

Hub central de inteligência financeira com design premium 3D, integração Open Finance e Advisor IA multimodelo.

## 🚀 Features

### 1. Sistema de Design Premium 3D

- **Interface Glassmorphism**: Uso extensivo de camadas translúcidas, sombras profundas e efeitos de profundidade.
- **Micro-animações**: Transições suaves e efeitos de "glow" em cards interativos.
- **Modo Dark Nativo**: Otimizado para alta legibilidade e estética futurista.

### 2. Integração Open Finance (Pluggy)

- **Conectividade Total**: Sincronização automática com bancos e corretoras brasileiras.
- **Dashboard Consolidado**: Visão única de saldo, transações e investimentos.
- **Webhooks**: Notificações em tempo real para eventos financeiros importantes.

### 3. Inteligência Artificial (Nexus IA)

- **Smart Categorization**: Novo botão em Transações para categorização automática inteligente via IA (MetaFin IA Engine).
- **Multi-modelo**: Suporte a GPT-4o, Gemini 1.5 Pro/Flash e Claude 3.5.
- **Análise Preditiva**: Insights automáticos sobre saúde financeira e tendências de gastos.
- **Wealth Lab**: Simuladores avançados de Independência Financeira (FIRE) e Aposentadoria.

## 🛠️ Correções e Auditoria (v2.6.0)

- **Deep Project Audit**: Concluída varredura profunda para remoção de arquivos desnecessários (+100 logs/logs de build removidos).
- **Feature (Investimentos)**: Corrigido erro crítico de importação e bug de design que impedia o acesso.
- **Fix (Style Bugs)**: Correção global de herança de CSS em tokens de design 3D (23 arquivos corrigidos).
- **Cleanup**: Remoção total de páginas redundantes e consolidação do backend `/server` para `/api` Serverless.

## 🔒 Segurança

- **XSS Prevention**: Implementada sanitização de inputs em Transações utilizando `DOMPurify` (descrição e notas).
- **RLS (Row Level Security)**: Habilitado em todas as tabelas do banco de dados para isolamento absoluto de tenant.
- **Backend Proxy**: Chamadas sensíveis (IA/Open Finance) agora passam por rotas de API autenticadas via JWT do Supabase.
- **Compliance**: Estruturado seguindo padrões SOC-2 e LGPD.

---
© 2026 METAFIN HOLDINGS. PRODUTO PREMIUM.
