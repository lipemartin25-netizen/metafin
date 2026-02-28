// e2e/fixtures/test-data.js
// Dados de teste reutilizáveis em toda a suite

export const TEST_USER = {
    email: process.env.TEST_USER_EMAIL || 'teste-e2e@metafin.app',
    password: process.env.TEST_USER_PASSWORD || 'TestE2E@MetaFin2026!',
    name: 'Usuário Teste E2E',
};

export const SAMPLE_TRANSACTIONS = {
    expense: {
        description: 'Supermercado Teste E2E',
        amount: '150.00',
        category: 'alimentacao',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
    },
    income: {
        description: 'Salário Teste E2E',
        amount: '5000.00',
        category: 'salario',
        type: 'income',
        date: new Date().toISOString().split('T')[0],
    },
    large: {
        description: 'Aluguel Teste E2E',
        amount: '2500.00',
        category: 'moradia',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
    },
};

export const SAMPLE_GOAL = {
    name: 'Viagem Teste E2E',
    targetAmount: '10000.00',
    currentAmount: '2500.00',
    deadline: '2026-12-31',
    category: 'viagem',
};

export const SAMPLE_BUDGET = {
    category: 'alimentacao',
    limit: '1500.00',
    period: 'monthly',
};

export const SAMPLE_WEBHOOK = {
    name: 'Webhook Teste E2E',
    url: 'https://webhook.site/test-metafin-e2e',
    events: ['transaction.created', 'goal.reached'],
};

export const PAGES = {
    login: '/',
    register: '/register',
    dashboard: '/app/dashboard',
    transactions: '/app/transactions',
    goals: '/app/goals',
    budgets: '/app/budgets',
    health: '/app/health',
    bankAccounts: '/app/bank-accounts',
    assistant: '/app/assistant',
    webhooks: '/app/webhooks',
    settings: '/app/settings',
    reports: '/app/reports',
};
