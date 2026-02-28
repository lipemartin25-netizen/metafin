// src/lib/taxPlanner.js
// ================================
// Planejador Tributário (IRPF)
// Versão automatizada do serviço tributário da W1
// ================================

/**
 * Tabela IRPF Mensal 2026 (estimativa atualizada)
 */
const IRPF_MONTHLY_TABLE = [
 { min: 0, max: 2259.20, rate: 0, deduction: 0, label: 'Isento' },
 { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44, label: '7,5%' },
 { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44, label: '15%' },
 { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77, label: '22,5%' },
 { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00, label: '27,5%' }
];

/**
 * Tabela progressiva do INSS 2026 (estimativa)
 */
const INSS_TABLE_2026 = [
 { min: 0, max: 1518.00, rate: 0.075 },
 { min: 1518.01, max: 2793.88, rate: 0.09 },
 { min: 2793.89, max: 4190.83, rate: 0.12 },
 { min: 4190.84, max: 8157.41, rate: 0.14 }
];

const DEPENDENT_DEDUCTION_MONTHLY = 189.59;
const EDUCATION_ANNUAL_LIMIT = 3561.50;
const SIMPLIFIED_ANNUAL_LIMIT = 16754.34;
const SIMPLIFIED_RATE = 0.20;

/**
 * Calcula contribuição INSS progressiva
 */
function calculateINSS(grossSalary) {
 let contribution = 0;
 let previousMax = 0;
 const details = [];

 for (const bracket of INSS_TABLE_2026) {
 const bracketBase = Math.min(grossSalary, bracket.max) - previousMax;
 if (bracketBase > 0) {
 const bracketContribution = bracketBase * bracket.rate;
 contribution += bracketContribution;
 details.push({
 range: `R$ ${previousMax.toFixed(2)} → R$ ${bracket.max.toFixed(2)}`,
 base: Math.round(bracketBase * 100) / 100,
 rate: `${(bracket.rate * 100).toFixed(1)}%`,
 value: Math.round(bracketContribution * 100) / 100
 });
 }
 previousMax = bracket.max;
 if (grossSalary <= bracket.max) break;
 }

 return {
 total: Math.round(contribution * 100) / 100,
 effectiveRate: Math.round((contribution / grossSalary) * 10000) / 100,
 details
 };
}

/**
 * Calcula IRPF mensal
 */
function calculateMonthlyIRPF(taxBase) {
 const bracket = IRPF_MONTHLY_TABLE.find(b => taxBase >= b.min && taxBase <= b.max)
 || IRPF_MONTHLY_TABLE[IRPF_MONTHLY_TABLE.length - 1];

 const tax = Math.max(0, (taxBase * bracket.rate) - bracket.deduction);

 return {
 tax: Math.round(tax * 100) / 100,
 bracket: bracket.label,
 rate: bracket.rate,
 deduction: bracket.deduction
 };
}

/**
 * Planejamento tributário completo
 */
export function calculateTaxPlan({
 monthlyGrossIncome,
 dependents = 0,
 hasPrivatePension = false,
 privatePensionMonthly = 0,
 healthExpensesAnnual = 0,
 educationExpensesAnnual = 0,
 alimonyMonthly = 0,
 otherDeductionsAnnual = 0,
 has13th = true,
 hasVacationBonus = true
}) {
 // === CÁLCULOS MENSAIS ===
 const inss = calculateINSS(monthlyGrossIncome);

 // Base de cálculo mensal
 let monthlyTaxBase = monthlyGrossIncome
 - inss.total
 - (dependents * DEPENDENT_DEDUCTION_MONTHLY)
 - alimonyMonthly;

 // PGBL (até 12% da renda bruta anual, aplicado mensalmente)
 let pgblDeductionMonthly = 0;
 if (hasPrivatePension && privatePensionMonthly > 0) {
 const maxPGBLMonthly = (monthlyGrossIncome * 12 * 0.12) / 12;
 pgblDeductionMonthly = Math.min(privatePensionMonthly, maxPGBLMonthly);
 monthlyTaxBase -= pgblDeductionMonthly;
 }

 monthlyTaxBase = Math.max(0, monthlyTaxBase);
 const monthlyIRPF = calculateMonthlyIRPF(monthlyTaxBase);

 // === CÁLCULOS ANUAIS ===
 const annualGross = monthlyGrossIncome * (12 + (has13th ? 1 : 0) + (hasVacationBonus ? 1 / 3 : 0));

 // Modelo COMPLETO (deduções reais)
 const deductions = {
 inss: {
 label: 'INSS',
 annual: Math.round(inss.total * 12 * 100) / 100,
 icon: '🏛️'
 },
 dependents: {
 label: `Dependentes (${dependents})`,
 annual: Math.round(dependents * DEPENDENT_DEDUCTION_MONTHLY * 12 * 100) / 100,
 icon: '👨👩👧👦'
 },
 health: {
 label: 'Saúde (sem limite)',
 annual: healthExpensesAnnual,
 icon: '🏥'
 },
 education: {
 label: `Educação (limite R$ ${EDUCATION_ANNUAL_LIMIT.toLocaleString('pt-BR')})`,
 annual: Math.min(educationExpensesAnnual, EDUCATION_ANNUAL_LIMIT),
 icon: '📚'
 },
 privatePension: {
 label: 'Previdência Privada (PGBL)',
 annual: Math.round(pgblDeductionMonthly * 12 * 100) / 100,
 icon: '💰'
 },
 alimony: {
 label: 'Pensão Alimentícia',
 annual: Math.round(alimonyMonthly * 12 * 100) / 100,
 icon: '⚖️'
 },
 other: {
 label: 'Outras deduções',
 annual: otherDeductionsAnnual,
 icon: '📋'
 }
 };

 const totalDeductionsComplete = Object.values(deductions).reduce((sum, d) => sum + d.annual, 0);

 // Modelo SIMPLIFICADO (20% com teto)
 const simplifiedDiscount = Math.min(annualGross * SIMPLIFIED_RATE, SIMPLIFIED_ANNUAL_LIMIT);

 // Qual é melhor?
 const bestModel = totalDeductionsComplete > simplifiedDiscount ? 'completo' : 'simplificado';
 const modelDifference = Math.abs(totalDeductionsComplete - simplifiedDiscount);

 // IR anual com modelo completo
 const annualTaxBaseComplete = Math.max(0, annualGross - totalDeductionsComplete);
 const annualTaxBaseSimplified = Math.max(0, annualGross - simplifiedDiscount);

 // Calcular IR anual (simplificado: aplica tabela mensal × 12)
 const irComplete = calculateMonthlyIRPF(annualTaxBaseComplete / 12);
 const irSimplified = calculateMonthlyIRPF(annualTaxBaseSimplified / 12);

 const annualIRComplete = Math.round(irComplete.tax * 12 * 100) / 100;
 const annualIRSimplified = Math.round(irSimplified.tax * 12 * 100) / 100;
 const annualIRBest = bestModel === 'completo' ? annualIRComplete : annualIRSimplified;

 const effectiveRate = Math.round((annualIRBest / annualGross) * 10000) / 100;

 // === SUGESTÕES DE ECONOMIA ===
 const suggestions = [];

 // PGBL
 if (!hasPrivatePension && monthlyGrossIncome > 3000) {
 const maxPGBL = annualGross * 0.12;
 const potentialSaving = maxPGBL * (monthlyIRPF.rate || 0.15);
 if (potentialSaving > 0) {
 suggestions.push({
 priority: 'alta',
 icon: '💰',
 title: 'Abrir PGBL',
 description: `Invista até R$ ${Math.round(maxPGBL / 12).toLocaleString('pt-BR')}/mês em PGBL e deduza até R$ ${Math.round(maxPGBL).toLocaleString('pt-BR')}/ano do IR.`,
 annualSaving: Math.round(potentialSaving),
 action: 'Procure um plano PGBL com taxa de administração abaixo de 1%.'
 });
 }
 }

 // Dependentes
 if (dependents === 0 && monthlyGrossIncome > 4000) {
 const potentialSaving = DEPENDENT_DEDUCTION_MONTHLY * 12 * (monthlyIRPF.rate || 0.15);
 suggestions.push({
 priority: 'média',
 icon: '👨👩👧',
 title: 'Declarar Dependentes',
 description: 'Cônjuge sem renda, filhos ou pais idosos podem ser dependentes.',
 annualSaving: Math.round(potentialSaving),
 action: 'Cada dependente deduz R$ 2.275,08/ano da base de cálculo.'
 });
 }

 // Saúde
 if (healthExpensesAnnual === 0 && monthlyGrossIncome > 3000) {
 suggestions.push({
 priority: 'média',
 icon: '🏥',
 title: 'Deduzir Gastos com Saúde',
 description: 'Consultas, exames, plano de saúde e dentista são dedutíveis SEM LIMITE.',
 annualSaving: null,
 action: 'Guarde todos os recibos médicos. Cada R$ 1.000 em saúde pode economizar até R$ 275 no IR.'
 });
 }

 // Educação
 if (educationExpensesAnnual === 0 && dependents > 0) {
 suggestions.push({
 priority: 'baixa',
 icon: '📚',
 title: 'Deduzir Educação',
 description: `Escola e faculdade são dedutíveis até R$ ${EDUCATION_ANNUAL_LIMIT.toLocaleString('pt-BR')}/pessoa/ano.`,
 annualSaving: Math.round(EDUCATION_ANNUAL_LIMIT * (monthlyIRPF.rate || 0.15)),
 action: 'Inclua mensalidades escolares e universitárias na declaração.'
 });
 }

 // Modelo de declaração
 if (bestModel === 'completo' && totalDeductionsComplete > simplifiedDiscount) {
 suggestions.push({
 priority: 'alta',
 icon: '📊',
 title: 'Use o Modelo Completo',
 description: `Suas deduções (R$ ${Math.round(totalDeductionsComplete).toLocaleString('pt-BR')}) superam o desconto simplificado (R$ ${Math.round(simplifiedDiscount).toLocaleString('pt-BR')}).`,
 annualSaving: Math.round(Math.abs(annualIRComplete - annualIRSimplified)),
 action: 'Na hora de declarar, selecione "Deduções Legais" ao invés de "Desconto Simplificado".'
 });
 }

 // Total de economia potencial
 const totalPotentialSavings = suggestions.reduce((sum, s) => sum + (s.annualSaving || 0), 0);

 return {
 // Mensal
 monthly: {
 grossIncome: monthlyGrossIncome,
 inssDeduction: inss.total,
 inssDetails: inss.details,
 taxBase: Math.round(monthlyTaxBase * 100) / 100,
 irpf: monthlyIRPF.tax,
 bracket: monthlyIRPF.bracket,
 netIncome: Math.round((monthlyGrossIncome - inss.total - monthlyIRPF.tax) * 100) / 100
 },

 // Anual
 annual: {
 grossIncome: Math.round(annualGross),
 bestModel,
 modelDifference: Math.round(modelDifference),
 deductions,
 totalDeductionsComplete: Math.round(totalDeductionsComplete),
 simplifiedDiscount: Math.round(simplifiedDiscount),
 irComplete: annualIRComplete,
 irSimplified: annualIRSimplified,
 irBest: annualIRBest,
 effectiveRate
 },

 // Sugestões
 suggestions,
 totalPotentialSavings,

 // Resumo visual
 summary: {
 youPay: Math.round(annualIRBest),
 youCouldPay: Math.round(annualIRBest - totalPotentialSavings),
 potentialSavings: totalPotentialSavings
 }
 };
}

export default calculateTaxPlan;
