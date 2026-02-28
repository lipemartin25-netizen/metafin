# 🧪 Testes E2E — MetaFin

## Setup

### 1. Criar usuário de teste no Supabase
Acesse o Supabase Dashboard → Authentication → Users → Create User:
- Email: `teste-e2e@metafin.app`
- Password: `TestE2E@MetaFin2026!`

### 2. Configurar variáveis de ambiente
```bash
cp e2e/.env.test .env.test
# Editar com credenciais reais se diferentes
```

### 3. Instalar browsers
```bash
npx playwright install
```

## Executar

```bash
# Todos os testes
npm run test:e2e

# Com interface visual
npm run test:e2e:ui

# Apenas Chrome desktop
npm run test:e2e:chrome

# Apenas mobile
npm run test:e2e:mobile

# Debug mode (step-by-step)
npm run test:e2e:debug

# Ver relatório HTML
npm run test:e2e:report
```

## Estrutura
- `auth.setup.js` — Login automático (roda antes dos testes)
- `01` a `12` — Suites de teste por funcionalidade
- `fixtures/` — Dados de teste reutilizáveis
- `helpers/` — Funções auxiliares

## CI/CD
Os testes rodam automaticamente no GitHub Actions em push/PR para `main` e `develop`.
