# Diretrizes de Conformidade SOC 2 Type II 🔒

Este documento descreve os controles implementados no **Smart Finance Hub** que cobrem os princípios do SOC 2 (Security, Availability, Processing Integrity, Confidentiality e Privacy). 

Pode ser fornecido diretamente aos seus auditores ou clientes de nível *Enterprise*.

## 1. Segurança (Security)
* **Auth Identity Provider (IdP):** Toda a autenticação é gerida externamente através da criptografia do Supabase Auth / GoTrue e Google OAuth. O sistema central não detém senhas brutas.
* **Row-Level Security (RLS):** Bancos de dados de acesso ao cliente (`bank_accounts`, `bank_transactions`, `profiles`, `payments`) executam bloqueio dinâmico no nível TSQL, impedindo `SELECT/INSERT/UPDATE/DELETE` fora do escopo UUID (`auth.uid()`) de quem está requisitando.
* **Network & Transit:** Nenhuma conexão é feita via HTTP inseguro. Vercel, Supabase e Pluggy asseguram `TLS 1.2+ / HTTPS` fim-a-fim. As conexões de Webhook usam `HMAC Signatures` obrigatórias para checagem anti-falsificação.

## 2. Disponibilidade (Availability)
* **Infraestrutura Serverless:** A aplicação Frontend e Backend roda inteiramente em roteamento Edge e Serverless Functions escalonadas automaticamente.
* **Proteções anti-DDoS:** Rate limiting a nível global para IP (100req/min) para mitigar stress-tests voluntários antes de atingir as lógicas de servidor do Vercel e o Banco de Dados. E mitigação robusta de ataques Layer 7 pelo proxy reverso próprio da Vercel.

## 3. Integridade de Processamento (Processing Integrity)
* **Replay Protection:** O Webhook da API (Serverless) recusa Nonces processados por mais de um hash idêntico em 1 minuto, garantindo que eventos da Open Finance sejam estritamente *Idempotentes*. Mudanças de saldo só afetam cálculos uma vez.
* **Testes Automatizados de Penetração:** A esteira de código possui integração no GitHub Action para varreduras SAST/DAST da OWASP (ZAP).
* **Auditoria de Node:** Processos de deploy estritos validam dependências (NPM audit 0 vulnerabilities) de bibliotecas de produção.

## 4. Confidencialidade (Confidentiality)
* Aplicação rigorosa nas regras ambientais. Service Keys e tokens de acesso são expostos somente em `process.env` isolados. Apenas chaves `anon` públicas (seguras contra engenharia reversa do JWT) são exportadas para a build do React.

## 5. Privacidade (Privacy)
* O Smart Finance Hub não processa em servidores próprios (Bare Metal) credenciais interativas reais bancárias do cliente (Senhas Bancárias são operadas estritamente em iFrame tokenizado pela Pluggy). 

> Este documento é mantido e revisado em tandem com a versão e release do sistema principal.
