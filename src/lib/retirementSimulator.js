// src/lib/retirementSimulator.js
// ================================
// Simulador de Aposentadoria
// Inspirado no planejamento previdenciário da W1
// ================================

/**
 * Tabela progressiva do INSS 2026 (estimativa)
 */
const INSS_TABLE = [
    { min: 0, max: 1518.00, rate: 0.075 },
    { min: 1518.01, max: 2793.88, rate: 0.09 },
    { min: 2793.89, max: 4190.83, rate: 0.12 },
    { min: 4190.84, max: 8157.41, rate: 0.14 }
];

function calculateINSSContribution(salary) {
    let contribution = 0;
    let previousMax = 0;

    for (const bracket of INSS_TABLE) {
        const applicable = Math.min(salary, bracket.max) - previousMax;
        if (applicable > 0) {
            contribution += applicable * bracket.rate;
        }
        previousMax = bracket.max;
        if (salary <= bracket.max) break;
    }

    return Math.round(contribution * 100) / 100;
}

/**
 * Estimar benefício do INSS (simplificado)
 * Na prática o cálculo é muito mais complexo (média dos 80% maiores salários etc)
 */
function estimateINSSBenefit(currentSalary, yearsContributing) {
    const ceiling = 8157.41; // Teto INSS 2026 estimado
    const averageSalary = Math.min(currentSalary, ceiling);

    // Regra pós-reforma: 60% + 2% por ano acima de 20 anos (homem) ou 15 anos (mulher)
    const basePercent = 0.60;
    const extraYears = Math.max(0, yearsContributing - 20);
    const percent = Math.min(basePercent + (extraYears * 0.02), 1.0);

    return Math.round(averageSalary * percent * 100) / 100;
}

/**
 * Simula a aposentadoria completa
 */
export function simulateRetirement({
    currentAge,
    retirementAge = 65,
    lifeExpectancy = 85,
    monthlyGrossIncome = 0,
    desiredRetirementIncome,
    currentInvestments = 0,
    monthlyInvestment = 0,
    yearsContributingINSS = 0,
    hasPrivatePension = false,
    privatePensionBalance = 0,
    privatePensionMonthly = 0,
    annualReturn = 0.10,
    inflationRate = 0.045
}) {
    // Validações
    if (currentAge >= retirementAge) {
        return { error: true, message: 'Idade atual deve ser menor que idade de aposentadoria' };
    }
    if (retirementAge >= lifeExpectancy) {
        return { error: true, message: 'Idade de aposentadoria deve ser menor que expectativa de vida' };
    }

    const yearsToRetirement = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retirementAge;
    const monthsToRetirement = yearsToRetirement * 12;

    // INSS
    const totalINSSYears = yearsContributingINSS + yearsToRetirement;
    const estimatedINSSBenefit = estimateINSSBenefit(monthlyGrossIncome, totalINSSYears);
    const currentINSSContribution = calculateINSSContribution(monthlyGrossIncome);

    // Previdência Privada (PGBL/VGBL)
    let privatePensionAtRetirement = privatePensionBalance;
    const realReturn = (1 + annualReturn) / (1 + inflationRate) - 1;
    const monthlyRealReturn = Math.pow(1 + realReturn, 1 / 12) - 1;

    if (hasPrivatePension && privatePensionMonthly > 0) {
        for (let m = 0; m < monthsToRetirement; m++) {
            privatePensionAtRetirement = privatePensionAtRetirement * (1 + monthlyRealReturn) + privatePensionMonthly;
        }
    }

    // Renda mensal da previdência privada (regra dos 4% / 12)
    const privatePensionMonthlyIncome = Math.round((privatePensionAtRetirement * 0.04) / 12);

    // Gap mensal (quanto falta)
    const totalGuaranteedIncome = estimatedINSSBenefit + privatePensionMonthlyIncome;
    const monthlyGap = Math.max(0, desiredRetirementIncome - totalGuaranteedIncome);
    const annualGap = monthlyGap * 12;

    // Patrimônio necessário (para cobrir o gap)
    const requiredPortfolio = annualGap > 0 ? annualGap / 0.04 : 0;

    // Patrimônio projetado na aposentadoria (investimentos livres)
    let projectedPortfolio = currentInvestments;
    for (let m = 0; m < monthsToRetirement; m++) {
        projectedPortfolio = projectedPortfolio * (1 + monthlyRealReturn) + monthlyInvestment;
    }
    projectedPortfolio = Math.round(projectedPortfolio);

    // Sobra ou falta?
    const portfolioSurplus = projectedPortfolio - requiredPortfolio;
    const isOnTrack = portfolioSurplus >= 0;

    // Quanto deveria investir por mês para atingir a meta
    let requiredMonthlyInvestment = 0;
    if (!isOnTrack && monthsToRetirement > 0) {
        const fvCurrent = currentInvestments * Math.pow(1 + monthlyRealReturn, monthsToRetirement);
        const remainingNeeded = Math.max(0, requiredPortfolio - fvCurrent);
        if (monthlyRealReturn > 0) {
            requiredMonthlyInvestment = Math.round(
                remainingNeeded * monthlyRealReturn /
                (Math.pow(1 + monthlyRealReturn, monthsToRetirement) - 1)
            );
        } else {
            requiredMonthlyInvestment = Math.round(remainingNeeded / monthsToRetirement);
        }
    }

    // Projeção ano a ano (fase acumulação + fase distribuição)
    const projection = [];
    let balance = currentInvestments;
    let ppBalance = privatePensionBalance;

    for (let year = 0; year <= yearsToRetirement + yearsInRetirement; year++) {
        const age = currentAge + year;
        const isRetired = age >= retirementAge;
        const calendarYear = new Date().getFullYear() + year;

        if (!isRetired) {
            for (let m = 0; m < 12; m++) {
                balance = balance * (1 + monthlyRealReturn) + monthlyInvestment;
                if (hasPrivatePension) {
                    ppBalance = ppBalance * (1 + monthlyRealReturn) + privatePensionMonthly;
                }
            }
        } else {
            // Fase de distribuição
            const annualWithdrawal = annualGap;
            balance = balance * (1 + monthlyRealReturn * 12) - annualWithdrawal;
            // PP também vai sendo consumida
            if (hasPrivatePension) {
                ppBalance = ppBalance * (1 + monthlyRealReturn * 12) - (privatePensionMonthlyIncome * 12);
            }
        }

        projection.push({
            age,
            year: calendarYear,
            phase: isRetired ? 'retirement' : 'accumulation',
            investmentBalance: Math.max(0, Math.round(balance)),
            privatePensionBalance: Math.max(0, Math.round(ppBalance)),
            totalBalance: Math.max(0, Math.round(balance + ppBalance)),
            monthlyIncome: isRetired ? {
                inss: estimatedINSSBenefit,
                privatePension: privatePensionMonthlyIncome,
                investments: Math.round(Math.max(0, balance) * 0.04 / 12),
                total: Math.round(
                    estimatedINSSBenefit + privatePensionMonthlyIncome +
                    Math.max(0, balance) * 0.04 / 12
                )
            } : null
        });
    }

    // Sustentabilidade: em que idade o dinheiro acaba?
    const bankruptAge = projection.find(
        p => p.phase === 'retirement' && p.totalBalance <= 0
    );

    const sustainableYears = bankruptAge
        ? bankruptAge.age - retirementAge
        : yearsInRetirement;

    const isSustainable = !bankruptAge || bankruptAge.age >= lifeExpectancy;

    // Score de saúde previdenciária (0-100)
    const healthScore = Math.min(100, Math.round(
        (isOnTrack ? 40 : (projectedPortfolio / requiredPortfolio) * 40) +
        (estimatedINSSBenefit >= desiredRetirementIncome * 0.3 ? 20 : (estimatedINSSBenefit / (desiredRetirementIncome * 0.3)) * 20) +
        (hasPrivatePension ? 20 : 0) +
        (isSustainable ? 20 : (sustainableYears / yearsInRetirement) * 20)
    ));

    return {
        error: false,

        // Inputs processados
        currentAge,
        retirementAge,
        lifeExpectancy,
        yearsToRetirement,
        yearsInRetirement,

        // INSS
        estimatedINSSBenefit: Math.round(estimatedINSSBenefit),
        currentINSSContribution,
        totalINSSYears,

        // Previdência Privada
        privatePensionAtRetirement: Math.round(privatePensionAtRetirement),
        privatePensionMonthlyIncome,

        // Gap & Patrimônio
        desiredRetirementIncome,
        totalGuaranteedIncome: Math.round(totalGuaranteedIncome),
        monthlyGap: Math.round(monthlyGap),
        requiredPortfolio: Math.round(requiredPortfolio),
        projectedPortfolio,
        portfolioSurplus: Math.round(portfolioSurplus),
        isOnTrack,
        requiredMonthlyInvestment,

        // Análise
        projection,
        sustainableYears,
        isSustainable,
        bankruptAge: bankruptAge?.age || null,
        healthScore,

        // Diagnóstico em texto
        diagnosis: generateDiagnosis({
            isOnTrack,
            isSustainable,
            monthlyGap,
            requiredMonthlyInvestment,
            monthlyInvestment,
            healthScore,
            retirementAge,
            bankruptAge: bankruptAge?.age,
            estimatedINSSBenefit,
            desiredRetirementIncome
        })
    };
}

function generateDiagnosis(data) {
    const items = [];

    if (data.healthScore >= 80) {
        items.push({
            type: 'success',
            icon: '✅',
            text: `Excelente! Seu plano de aposentadoria está sólido (Score: ${data.healthScore}/100).`
        });
    } else if (data.healthScore >= 50) {
        items.push({
            type: 'warning',
            icon: '⚠️',
            text: `Seu plano precisa de ajustes (Score: ${data.healthScore}/100). Veja as recomendações abaixo.`
        });
    } else {
        items.push({
            type: 'danger',
            icon: '🚨',
            text: `Atenção! Seu plano de aposentadoria tem riscos sérios (Score: ${data.healthScore}/100).`
        });
    }

    if (!data.isOnTrack) {
        items.push({
            type: 'action',
            icon: '💡',
            text: `Aumente seus investimentos para R$ ${data.requiredMonthlyInvestment.toLocaleString('pt-BR')}/mês (atualmente R$ ${data.monthlyInvestment.toLocaleString('pt-BR')}/mês).`
        });
    }

    if (data.monthlyGap > 0) {
        items.push({
            type: 'info',
            icon: '📊',
            text: `O INSS cobrirá R$ ${data.estimatedINSSBenefit.toLocaleString('pt-BR')} dos R$ ${data.desiredRetirementIncome.toLocaleString('pt-BR')} desejados. Gap de R$ ${data.monthlyGap.toLocaleString('pt-BR')}/mês.`
        });
    }

    if (!data.isSustainable && data.bankruptAge) {
        items.push({
            type: 'danger',
            icon: '⏰',
            text: `Alerta: com o plano atual, seus recursos acabariam aos ${data.bankruptAge} anos.`
        });
    }

    return items;
}

export default simulateRetirement;
