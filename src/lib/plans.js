/**
 * MetaFin — Planos e Limites
 */

export const PLANS = {
 free: {
 id: 'free',
 name: 'Gratuito',
 price: 0,
 priceLabel: 'R$ 0',
 period: 'para sempre',
 icon: '🆓',
 color: 'gray',
 popular: false,
 limits: {
 transactionsPerMonth: 50,
 accounts: 1,
 csvImport: true,
 multiFormatImport: false,
 exportCsv: true,
 exportPdf: false,
 dashboard: true,
 charts: true,
 aiChat: false,
 aiCategorization: false,
 aiInsights: false,
 aiModels: [],
 aiMessagesPerDay: 0,
 },
 features: [
 'Dashboard básico',
 'Import CSV (50 tx/mês)',
 'Categorias automáticas (regex)',
 'Export CSV',
 '1 conta',
 ],
 cta: 'Começar Grátis',
 },

 pro: {
 id: 'pro',
 name: 'Pro',
 price: 29,
 priceLabel: 'R$ 29',
 period: '/mês',
 icon: '💎',
 color: 'emerald',
 popular: true,
 stripePriceId: 'price_XXXXXXXXX', // Substituir pelo ID real do Stripe
 limits: {
 transactionsPerMonth: Infinity,
 accounts: 5,
 csvImport: true,
 multiFormatImport: true,
 exportCsv: true,
 exportPdf: true,
 dashboard: true,
 charts: true,
 aiChat: true,
 aiCategorization: true,
 aiInsights: true,
 aiModels: ['gpt-5-nano', 'gpt-5', 'gemini-flash', 'claude-sonnet', 'deepseek', 'grok-fast', 'qwen'],
 aiMessagesPerDay: 100,
 },
 features: [
 'Tudo do Gratuito',
 'Import ilimitado (20+ formatos)',
 'AI Chat (7 modelos)',
 'AI Categorização inteligente',
 'AI Insights financeiros',
 'Relatórios PDF',
 '5 contas',
 'Suporte prioritário',
 ],
 cta: 'Assinar Pro',
 },

 enterprise: {
 id: 'enterprise',
 name: 'Enterprise',
 price: null,
 priceLabel: 'Custom',
 period: 'sob consulta',
 icon: '🏢',
 color: 'purple',
 popular: false,
 limits: {
 transactionsPerMonth: Infinity,
 accounts: Infinity,
 csvImport: true,
 multiFormatImport: true,
 exportCsv: true,
 exportPdf: true,
 dashboard: true,
 charts: true,
 aiChat: true,
 aiCategorization: true,
 aiInsights: true,
 aiModels: ['gpt-5-nano', 'gpt-5', 'gemini-flash', 'claude-sonnet', 'deepseek', 'grok-fast', 'qwen'],
 aiMessagesPerDay: Infinity,
 },
 features: [
 'Tudo do Pro',
 'API dedicada',
 'White-label',
 'SLA 99.9%',
 'Contas ilimitadas',
 'Suporte dedicado 24/7',
 ],
 cta: 'Falar com Vendas',
 },
};

// ========== HELPERS ==========
export function getPlan(planId) {
 return PLANS[planId] || PLANS.free;
}

export function canUseFeature(planId, feature) {
 const plan = getPlan(planId);
 return !!plan.limits[feature];
}

export function getTransactionLimit(planId) {
 return getPlan(planId).limits.transactionsPerMonth;
}

export function getAiModels(planId) {
 return getPlan(planId).limits.aiModels;
}

export function isProFeature(feature) {
 return !PLANS.free.limits[feature] && PLANS.pro.limits[feature];
}
