// ============================================================
// MetaFin Financial Agent
// Agente com "tools" que executam queries reais nas transações
// ============================================================

import categoriesData from '../data/data.json';
const categoryConfig = categoriesData.categories;

// ─────────────────────────────────────────────
// UTILITÁRIOS DE DATA
// ─────────────────────────────────────────────
export function getDateRange(period) {
 const now = new Date();
 const today = now.toISOString().slice(0, 10);

 switch (period) {
 case 'today':
 return { start: today, end: today, label: 'hoje' };

 case 'week': {
 const d = new Date(now);
 d.setDate(d.getDate() - d.getDay());
 return { start: d.toISOString().slice(0, 10), end: today, label: 'essa semana' };
 }
 case 'last_week': {
 const end = new Date(now);
 end.setDate(end.getDate() - end.getDay() - 1); // sábado passado
 const start = new Date(end);
 start.setDate(start.getDate() - 6);
 return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), label: 'semana passada' };
 }
 case 'month': {
 const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
 return { start, end: today, label: 'esse mês' };
 }
 case 'last_month': {
 const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
 const endD = new Date(now.getFullYear(), now.getMonth(), 0);
 return { start: d.toISOString().slice(0, 10), end: endD.toISOString().slice(0, 10), label: 'mês passado' };
 }
 case 'year':
 return { start: `${now.getFullYear()}-01-01`, end: today, label: 'esse ano' };

 case '7d': {
 const d = new Date(now);
 d.setDate(d.getDate() - 7);
 return { start: d.toISOString().slice(0, 10), end: today, label: 'últimos 7 dias' };
 }
 case '30d': {
 const d = new Date(now);
 d.setDate(d.getDate() - 30);
 return { start: d.toISOString().slice(0, 10), end: today, label: 'últimos 30 dias' };
 }
 case '90d': {
 const d = new Date(now);
 d.setDate(d.getDate() - 90);
 return { start: d.toISOString().slice(0, 10), end: today, label: 'últimos 90 dias' };
 }
 default:
 return { start: `${now.getFullYear()}-01-01`, end: today, label: 'esse ano' };
 }
}

export function fmt(v) {
 return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export function fmtDate(dateStr) {
 return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

// ─────────────────────────────────────────────
// MAPEAMENTO DE CATEGORIAS
// ─────────────────────────────────────────────
export function findCategoryKeys(text) {
 const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 const map = {
 alimentacao: ['alimenta', 'comida', 'mercado', 'supermercado', 'restaurante', 'refeicao', 'lanche', 'ifood', 'rappi', 'uber eats', 'padaria', 'pizza', 'hamburguer'],
 transporte: ['transporte', 'uber', 'taxi', 'onibus', 'metro', 'combustivel', 'gasolina', 'passagem', 'carro', '99pop', '99taxi'],
 moradia: ['moradia', 'aluguel', 'condominio', 'agua', 'luz', 'energia', 'internet', 'casa', 'apartamento', 'cpfl', 'enel'],
 saude: ['saude', 'saúde', 'farmacia', 'remedio', 'medico', 'consulta', 'hospital', 'plano de saude', 'droga', 'ultrafarma', 'drogasil', 'drogaraia', 'exame', 'clinica'],
 educacao: ['educacao', 'educação', 'escola', 'faculdade', 'curso', 'livro', 'udemy', 'alura', 'mensalidade'],
 entretenimento: ['entretenimento', 'netflix', 'spotify', 'disney', 'cinema', 'show', 'lazer', 'jogo', 'steam', 'amazon prime', 'hbo'],
 investimentos: ['investimento', 'poupanca', 'renda fixa', 'acao', 'fundo', 'tesouro', 'cdb', 'rendimento'],
 renda: ['salario', 'renda', 'freelance', 'receita', 'pagamento recebido'],
 outros: ['outros', 'outro'],
 };

 const matches = [];
 for (const [key, keywords] of Object.entries(map)) {
 if (keywords.some(kw => t.includes(kw))) matches.push(key);
 }
 return matches;
}

// ─────────────────────────────────────────────
// TOOLS
// ─────────────────────────────────────────────
const TOOLS = {

 searchByKeyword({ transactions, keyword, period, type }) {
 const range = period ? getDateRange(period) : null;
 const kw = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

 const results = transactions.filter(tx => {
 const desc = tx.description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 const matchKw = desc.includes(kw);
 const matchType = type ? tx.type === type : true;
 const matchDate = range ? tx.date >= range.start && tx.date <= range.end : true;
 return matchKw && matchType && matchDate;
 });

 const total = results.reduce((s, tx) => s + Math.abs(tx.amount), 0);
 const rangeLabel = range?.label || 'todo o período';

 if (results.length === 0) {
 return {
 found: false,
 text: `🔍 Não encontrei nenhuma transação com **"${keyword}"** em ${rangeLabel}.\n\nDica: verifique se o nome está correto ou tente um período maior.`,
 data: [],
 };
 }

 const lines = results
 .sort((a, b) => b.date.localeCompare(a.date))
 .map(tx => `• ${fmtDate(tx.date)} — ${tx.description} — **${fmt(Math.abs(tx.amount))}**`)
 .join('\n');

 return {
 found: true,
 text:
 `🔍 **"${keyword}"** em ${rangeLabel}\n` +
 `${results.length} transação(ões) encontrada(s)\n\n` +
 `${lines}\n\n` +
 `💰 **Total: ${fmt(total)}**`,
 data: results,
 total,
 };
 },

 searchByCategory({ transactions, category, period, type }) {
 const range = period ? getDateRange(period) : null;
 const catKeys = findCategoryKeys(category);
 const defaultType = type || 'expense';

 const results = transactions.filter(tx => {
 const matchCat = catKeys.length > 0 ? catKeys.includes(tx.category) : true;
 const matchType = tx.type === defaultType;
 const matchDate = range ? tx.date >= range.start && tx.date <= range.end : true;
 return matchCat && matchType && matchDate;
 });

 const total = results.reduce((s, tx) => s + Math.abs(tx.amount), 0);
 const catLabel = catKeys.map(k => categoryConfig[k]?.label || k).join(' + ') || category;
 const rangeLabel = range?.label || 'todo o período';

 if (results.length === 0) {
 return {
 found: false,
 text: `🔍 Nenhum gasto em **${catLabel}** em ${rangeLabel}.`,
 data: [],
 };
 }

 const lines = results
 .sort((a, b) => b.date.localeCompare(a.date))
 .map(tx => {
 const cat = categoryConfig[tx.category];
 return `• ${fmtDate(tx.date)} — ${tx.description} ${cat?.icon || ''} — **${fmt(Math.abs(tx.amount))}**`;
 })
 .join('\n');

 return {
 found: true,
 text:
 `📂 **${catLabel}** em ${rangeLabel}\n` +
 `${results.length} transação(ões)\n\n` +
 `${lines}\n\n` +
 `💰 **Total: ${fmt(total)}**`,
 data: results,
 total,
 };
 },

 topExpenses({ transactions, period, limit = 5 }) {
 const range = period ? getDateRange(period) : null;
 const rangeLabel = range?.label || 'todo o período';

 const results = transactions
 .filter(tx => {
 const matchType = tx.type === 'expense';
 const matchDate = range ? tx.date >= range.start && tx.date <= range.end : true;
 return matchType && matchDate;
 })
 .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
 .slice(0, limit);

 if (results.length === 0) {
 return { found: false, text: `Nenhuma despesa encontrada em ${rangeLabel}.`, data: [] };
 }

 const lines = results.map((tx, i) => {
 const cat = categoryConfig[tx.category];
 return `${i + 1}. ${cat?.icon || '💸'} **${tx.description}** — ${fmt(Math.abs(tx.amount))} _(${fmtDate(tx.date)})_`;
 }).join('\n');

 const total = results.reduce((s, tx) => s + Math.abs(tx.amount), 0);

 return {
 found: true,
 text:
 `🏆 **Top ${results.length} maiores gastos** em ${rangeLabel}\n\n` +
 `${lines}\n\n` +
 `💰 **Subtotal: ${fmt(total)}**`,
 data: results,
 };
 },

 summary({ transactions, period }) {
 const range = period ? getDateRange(period) : null;
 const rangeLabel = range?.label || 'todo o período';

 const filtered = transactions.filter(tx =>
 range ? tx.date >= range.start && tx.date <= range.end : true
 );

 if (filtered.length === 0) {
 return { found: false, text: `Nenhuma transação encontrada em ${rangeLabel}.`, data: [] };
 }

 const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
 const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
 const balance = income - expense;
 const savingsRate = income > 0 ? ((income - expense) / income * 100) : 0;

 const catTotals = {};
 filtered.filter(t => t.type === 'expense').forEach(t => {
 if (!catTotals[t.category]) catTotals[t.category] = 0;
 catTotals[t.category] += Math.abs(t.amount);
 });

 const topCats = Object.entries(catTotals)
 .sort((a, b) => b[1] - a[1])
 .slice(0, 3)
 .map(([k, v]) => ` ${categoryConfig[k]?.icon || '📦'} ${categoryConfig[k]?.label || k}: **${fmt(v)}**`)
 .join('\n');

 const emoji = balance >= 0 ? '✅' : '🚨';
 const srEmoji = savingsRate >= 20 ? '🟢' : savingsRate >= 10 ? '🟡' : '🔴';

 return {
 found: true,
 text:
 `${emoji} **Resumo Financeiro — ${rangeLabel}**\n\n` +
 `💰 Receitas: **${fmt(income)}**\n` +
 `💸 Despesas: **${fmt(expense)}**\n` +
 `📊 Saldo: **${fmt(balance)}**\n` +
 `${srEmoji} Taxa de poupança: **${savingsRate.toFixed(1)}%**\n` +
 `📋 Transações: **${filtered.length}**\n\n` +
 (topCats ? `**Top categorias de gasto:**\n${topCats}` : ''),
 data: filtered,
 total: balance,
 };
 },

 compare({ transactions, period1, period2 }) {
 const r1 = getDateRange(period1);
 const r2 = getDateRange(period2);

 const getMetrics = (range) => {
 const filtered = transactions.filter(tx => tx.date >= range.start && tx.date <= range.end);
 const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
 const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
 return { income, expense, balance: income - expense, count: filtered.length };
 };

 const m1 = getMetrics(r1);
 const m2 = getMetrics(r2);

 const expDiff = m2.expense - m1.expense;
 const expDiffPct = m1.expense > 0 ? ((expDiff / m1.expense) * 100).toFixed(1) : '—';
 const incDiff = m2.income - m1.income;

 return {
 found: true,
 text:
 `📊 **Comparativo: ${r1.label} vs ${r2.label}**\n\n` +
 `💰 Receita: ${fmt(m1.income)} → ${fmt(m2.income)} ${incDiff >= 0 ? '📈' : '📉'}\n` +
 `💸 Despesa: ${fmt(m1.expense)} → ${fmt(m2.expense)} ${expDiff > 0 ? '📈🔴' : '📉🟢'}\n` +
 `📊 Saldo: ${fmt(m1.balance)} → ${fmt(m2.balance)}\n\n` +
 `${expDiff > 0 ? '⚠️' : '✅'} Despesas ${expDiff > 0 ? 'aumentaram' : 'diminuíram'} **${Math.abs(expDiffPct)}%** entre os períodos.`,
 data: [],
 };
 },

 recurring({ transactions, period }) {
 const range = period ? getDateRange(period) : null;

 const filtered = transactions.filter(tx => {
 const matchType = tx.type === 'expense';
 const matchDate = range ? tx.date >= range.start && tx.date <= range.end : true;
 return matchType && matchDate;
 });

 const groups = {};
 filtered.forEach(tx => {
 const key = tx.description.toLowerCase().trim();
 if (!groups[key]) groups[key] = { desc: tx.description, count: 0, total: 0 };
 groups[key].count++;
 groups[key].total += Math.abs(tx.amount);
 });

 const recurring = Object.values(groups)
 .filter(g => g.count >= 2)
 .sort((a, b) => b.total - a.total);

 if (recurring.length === 0) {
 return {
 found: false,
 text: '🔄 Nenhum gasto recorrente identificado.\n\nPreciso de pelo menos 2 ocorrências da mesma descrição para identificar recorrência.',
 data: [],
 };
 }

 const lines = recurring.map((r, i) =>
 `${i + 1}. **${r.desc}**: ${fmt(r.total / r.count)}/vez × ${r.count} vezes = **${fmt(r.total)}**`
 ).join('\n');

 const totalRec = recurring.reduce((s, r) => s + r.total, 0);

 return {
 found: true,
 text:
 `🔄 **Gastos Recorrentes Identificados**\n\n` +
 `${lines}\n\n` +
 `💰 **Total recorrente: ${fmt(totalRec)}**`,
 data: recurring,
 total: totalRec,
 };
 },

 pending({ transactions }) {
 const results = transactions.filter(tx => tx.status === 'pending');

 if (results.length === 0) {
 return { found: true, text: '✅ Nenhuma transação pendente de categorização! Tudo em dia.', data: [] };
 }

 const lines = results.map(tx =>
 `• ${fmtDate(tx.date)} — **${tx.description}** — ${fmt(Math.abs(tx.amount))}`
 ).join('\n');

 return {
 found: true,
 text:
 `⏳ **${results.length} transação(ões) pendente(s) de categorização**\n\n` +
 `${lines}\n\n` +
 `💡 Acesse a página **Transações** para categorizá-las.`,
 data: results,
 };
 },
};

// ─────────────────────────────────────────────
// INTENT PARSER
// ─────────────────────────────────────────────
function parsePeriod(text) {
 const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 if (t.match(/\bhoje\b/)) return 'today';
 if (t.match(/essa semana|esta semana/)) return 'week';
 if (t.match(/semana passada/)) return 'last_week';
 if (t.match(/esse mes|este mes|no mes|esse mês/)) return 'month';
 if (t.match(/mes passado|mês passado/)) return 'last_month';
 if (t.match(/esse ano|este ano/)) return 'year';
 if (t.match(/ultimos?\s*7\s*dias?/)) return '7d';
 if (t.match(/ultimos?\s*30\s*dias?/)) return '30d';
 if (t.match(/ultimos?\s*90\s*dias?/)) return '90d';
 return null;
}

function parseIntent(userMessage) {
 const t = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 const period = parsePeriod(t);

 // ── COMPARAÇÃO ──
 if (t.match(/compar|versus|\bvs\b/)) {
 return { tool: 'compare', params: { period1: 'last_month', period2: 'month' }, confidence: 0.9 };
 }

 // ── RECORRENTES ──
 if (t.match(/recorrente|assinatura|fixos|mensalidade|subscription/)) {
 return { tool: 'recurring', params: { period }, confidence: 0.95 };
 }

 // ── PENDENTES ──
 if (t.match(/pendente|nao categoriz|sem categoria/)) {
 return { tool: 'pending', params: {}, confidence: 0.98 };
 }

 // ── MAIORES GASTOS ──
 if (t.match(/maior gasto|mais caro|top gasto|maior despesa|onde mais gast/)) {
 const limitMatch = t.match(/top\s*(\d+)/);
 return {
 tool: 'topExpenses',
 params: { period, limit: limitMatch ? parseInt(limitMatch[1]) : 5 },
 confidence: 0.92,
 };
 }

 // ── BUSCA POR MARCA/ESTABELECIMENTO ──
 const brands = [
 'ifood', 'rappi', 'uber eats', 'uber', '99',
 'netflix', 'spotify', 'amazon', 'disney', 'hbo', 'youtube',
 'drogasil', 'drogaraia', 'ultrafarma', 'panvel',
 'carrefour', 'extra', 'atacadao', 'pao de acucar',
 'nubank', 'inter', 'itau', 'bradesco', 'santander',
 'steam', 'airbnb',
 ];

 for (const brand of brands) {
 const normalized = brand.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 if (t.includes(normalized)) {
 return {
 tool: 'searchByKeyword',
 params: { keyword: brand, period, type: 'expense' },
 confidence: 0.97,
 };
 }
 }

 // ── RESUMO / SALDO ──
 if (t.match(/resumo|saldo|balanc|quanto tenho|situacao|panorama|visao geral|quanto sobrou|como estou/)) {
 return { tool: 'summary', params: { period: period || 'month' }, confidence: 0.88 };
 }

 // ── BUSCA POR CATEGORIA ──
 const catKeys = findCategoryKeys(t);
 if (catKeys.length > 0) {
 // Verifica se há keyword específica dentro da categoria
 const specific = extractSpecificKeyword(t);
 if (specific) {
 return {
 tool: 'searchByKeyword',
 params: { keyword: specific, period, type: 'expense' },
 confidence: 0.9,
 };
 }
 return {
 tool: 'searchByCategory',
 params: { category: t, period },
 confidence: 0.88,
 };
 }

 // ── BUSCA GENÉRICA POR KEYWORD ──
 const kwMatch = t.match(
 /(?:gastos?|despesas?|compras?|transacoes?|pagamentos?)\s+(?:com|de|no|na|do|da|em)\s+([a-z\u00c0-\u024f\s]+?)(?:\s+(?:nessa|essa|neste|este|no|na|do|da|semana|mes|ano|hoje|ultimos)|$)/i
 );
 if (kwMatch) {
 const keyword = kwMatch[1].trim();
 return {
 tool: 'searchByKeyword',
 params: { keyword, period, type: 'expense' },
 confidence: 0.80,
 };
 }

 // ── FALLBACK: Resumo do mês ──
 return {
 tool: 'summary',
 params: { period: period || 'month' },
 confidence: 0.40,
 };
}

function extractSpecificKeyword(text) {
 const specifics = [
 'drogasil', 'drogaraia', 'ultrafarma', 'panvel',
 'ifood', 'rappi', 'uber eats',
 'extra', 'carrefour', 'atacadao',
 'netflix', 'spotify', 'disney', 'steam',
 ];
 const t = text.toLowerCase();
 return specifics.find(s => t.includes(s)) || null;
}

// ─────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────
export function runAgent(userMessage, transactions) {
 if (!transactions || transactions.length === 0) {
 return {
 text: '📭 Você ainda não tem transações. Importe um extrato na página **Transações** para eu poder analisar!',
 tool: null,
 data: [],
 };
 }

 const intent = parseIntent(userMessage);
 const tool = TOOLS[intent.tool];

 if (!tool) {
 return {
 text:
 '🤔 Não entendi. Exemplos do que posso responder:\n\n' +
 '• _"Quanto gastei no iFood essa semana?"_\n' +
 '• _"Gastos com saúde mês passado"_\n' +
 '• _"Maiores gastos do mês"_\n' +
 '• _"Compare esse mês com o mês passado"_\n' +
 '• _"Quais são meus gastos recorrentes?"_',
 tool: null,
 data: [],
 };
 }

 const result = tool({ transactions, ...intent.params });

 return {
 ...result,
 tool: intent.tool,
 confidence: intent.confidence,
 };
}
