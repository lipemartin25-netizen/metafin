// src/lib/investmentSimulator.js
// ================================
// Simulador de Rendimentos de Investimentos
// Compara 6+ tipos de investimento lado a lado
// ================================

const INVESTMENT_TYPES = {
 poupanca: {
 name: 'Poupança',
 icon: '🏦',
 description: 'Regra atual (Selic > 8.5%): 0.5% a.m. + TR (~7.12% a.a.)',
 annualRate: 0.0712,
 taxType: 'exempt',
 hasIOF: false,
 riskLevel: 'Muito Baixo',
 riskColor: '#22c55e',
 liquidity: 'D+0 (após aniversário)',
 minAmount: 0
 },
 cdb_100: {
 name: 'CDB 100% CDI',
 icon: '📄',
 description: 'Certificado de Depósito Bancário rendendo 100% do CDI',
 annualRate: 0.1365,
 taxType: 'regressive',
 hasIOF: true,
 riskLevel: 'Baixo',
 riskColor: '#84cc16',
 liquidity: 'D+0 a D+1 (CDB Liquidez)',
 minAmount: 100
 },
 cdb_120: {
 name: 'CDB 120% CDI',
 icon: '📄',
 description: 'CDB com rendimento premium de 120% CDI',
 annualRate: 0.1365 * 1.20,
 taxType: 'regressive',
 hasIOF: true,
 riskLevel: 'Baixo',
 riskColor: '#84cc16',
 liquidity: 'D+1 a D+2 (geralmente sem liquidez diária)',
 minAmount: 1000
 },
 tesouro_selic: {
 name: 'Tesouro Selic',
 icon: '🇧🇷',
 description: 'Título público indexado à taxa Selic',
 annualRate: 0.1365,
 taxType: 'regressive',
 hasIOF: true,
 custodyFee: 0.002,
 riskLevel: 'Muito Baixo',
 riskColor: '#22c55e',
 liquidity: 'D+1 (dias úteis)',
 minAmount: 30
 },
 tesouro_ipca: {
 name: 'Tesouro IPCA+ 6.5%',
 icon: '🇧🇷',
 description: 'Título público: IPCA + taxa prefixada (proteção real)',
 annualRate: 0.045 + 0.065,
 taxType: 'regressive',
 hasIOF: true,
 custodyFee: 0.002,
 riskLevel: 'Baixo (se levar ao vencimento)',
 riskColor: '#84cc16',
 liquidity: 'D+1 (com marcação a mercado)',
 minAmount: 30
 },
 lci_lca: {
 name: 'LCI/LCA 90% CDI',
 icon: '🏠',
 description: 'Letra de Crédito Imobiliário/Agronegócio - Isenta de IR',
 annualRate: 0.1365 * 0.90,
 taxType: 'exempt',
 hasIOF: false,
 riskLevel: 'Baixo',
 riskColor: '#84cc16',
 liquidity: 'Carência de 90 dias (mínimo)',
 minAmount: 500
 },
 fundo_di: {
 name: 'Fundo DI (taxa 0.5%)',
 icon: '💼',
 description: 'Fundo de investimento referenciado DI, taxa admin 0.5%',
 annualRate: 0.1365 - 0.005,
 taxType: 'regressive_come_cotas',
 hasIOF: true,
 riskLevel: 'Baixo',
 riskColor: '#84cc16',
 liquidity: 'D+0 a D+1',
 minAmount: 100
 }
};

/**
 * Tabela regressiva de IR (renda fixa)
 */
function getIRRate(days) {
 if (days <= 180) return 0.225;
 if (days <= 360) return 0.200;
 if (days <= 720) return 0.175;
 return 0.15;
}

/**
 * IOF regressivo (primeiro 30 dias)
 */
function getIOFRate(days) {
 if (days >= 30) return 0;
 const table = [96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3, 0];
 return (table[days] || 0) / 100;
}

/**
 * Simula investimento individual
 */
export function simulateInvestment({
 initialAmount = 1000,
 monthlyContribution = 500,
 months = 12,
 investmentType = 'cdb_100',
 cdi = 0.1365,
 ipca = 0.045
}) {
 const config = { ...INVESTMENT_TYPES[investmentType] };
 if (!config) throw new Error(`Tipo de investimento inválido: ${investmentType}`);

 // Adjust annualRate based on market data
 if (investmentType === 'cdb_100') config.annualRate = cdi;
 else if (investmentType === 'cdb_120') config.annualRate = cdi * 1.20;
 else if (investmentType === 'tesouro_selic') config.annualRate = cdi;
 else if (investmentType === 'tesouro_ipca') config.annualRate = ipca + 0.065;
 else if (investmentType === 'lci_lca') config.annualRate = cdi * 0.90;
 else if (investmentType === 'fundo_di') config.annualRate = cdi - 0.005;

 const monthlyRate = Math.pow(1 + config.annualRate, 1 / 12) - 1;
 const projection = [];
 let grossBalance = initialAmount;
 let totalInvested = initialAmount;

 for (let m = 1; m <= months; m++) {
 grossBalance = grossBalance * (1 + monthlyRate) + monthlyContribution;
 totalInvested += monthlyContribution;

 const grossProfit = grossBalance - totalInvested;
 const days = m * 30;

 // IR (Cálculo aproximado ponderando o prazo médio do dinheiro)
 let irRate = 0;
 let irAmount = 0;
 if (config.taxType === 'regressive' || config.taxType === 'regressive_come_cotas') {
 const initialWeight = initialAmount / totalInvested;
 const contribWeight = 1 - initialWeight;
 const avgDays = (m * 30 * initialWeight) + ((m * 30) / 2 * contribWeight);
 irRate = getIRRate(avgDays);
 irAmount = grossProfit > 0 ? grossProfit * irRate : 0;
 }

 // IOF (Sempre será 0 nos saques exatos de 30 em 30 dias da simulação mensal, exceto para frações, mas mantemos por coerência)
 let iofAmount = 0;
 if (config.hasIOF && days < 30) {
 iofAmount = grossProfit > 0 ? grossProfit * getIOFRate(days) : 0;
 }

 // Custódia B3 (Tesouro direto - 0.20% a.a.)
 let custodyAmount = 0;
 if (config.custodyFee) {
 const averageBalance = (initialAmount + grossBalance) / 2;
 custodyAmount = averageBalance * (config.custodyFee / 12) * m;
 }

 const totalTaxes = irAmount + iofAmount + custodyAmount;
 const netBalance = grossBalance - totalTaxes;
 const netProfit = netBalance - totalInvested;
 const netMonthlyRate = totalInvested > 0
 ? Math.pow((netBalance / totalInvested), 1 / m) - 1
 : 0;

 // Intervalo de amostragem para projeção
 const shouldSample = months <= 12 || m % (months <= 36 ? 3 : months <= 60 ? 6 : 12) === 0 || m === months;

 if (shouldSample) {
 projection.push({
 month: m,
 totalInvested: Math.round(totalInvested * 100) / 100,
 grossBalance: Math.round(grossBalance * 100) / 100,
 grossProfit: Math.round(grossProfit * 100) / 100,
 irRate: Math.round(irRate * 1000) / 10,
 irAmount: Math.round(irAmount * 100) / 100,
 iofAmount: Math.round(iofAmount * 100) / 100,
 custodyAmount: Math.round(custodyAmount * 100) / 100,
 totalTaxes: Math.round(totalTaxes * 100) / 100,
 netBalance: Math.round(netBalance * 100) / 100,
 netProfit: Math.round(netProfit * 100) / 100,
 netAnnualReturn: Math.round(
 (Math.pow(1 + netMonthlyRate, 12) - 1) * 10000
 ) / 100
 });
 }
 }

 const finalPoint = projection[projection.length - 1];

 return {
 type: investmentType,
 name: config.name,
 icon: config.icon,
 description: config.description,
 riskLevel: config.riskLevel,
 riskColor: config.riskColor,
 liquidity: config.liquidity,
 initialAmount,
 monthlyContribution,
 months,
 ...finalPoint,
 projection
 };
}

/**
 * Compara todos os investimentos lado a lado
 */
export function compareAllInvestments({ initialAmount, monthlyContribution, months, cdi, ipca }) {
 return Object.keys(INVESTMENT_TYPES)
 .map(type => {
 try {
 return simulateInvestment({ initialAmount, monthlyContribution, months, investmentType: type, cdi, ipca });
 } catch {
 return null;
 }
 })
 .filter(Boolean)
 .sort((a, b) => b.netBalance - a.netBalance);
}

/**
 * Retorna os tipos de investimento disponíveis
 */
export function getInvestmentTypes() {
 return Object.entries(INVESTMENT_TYPES).map(([key, config]) => ({
 id: key,
 ...config
 }));
}

export default { simulateInvestment, compareAllInvestments, getInvestmentTypes };
