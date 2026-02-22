// src/lib/fireCalculator.js
// ===========================
// Calculadora FIRE (Financial Independence, Retire Early)
// Inspirada no método Goal-Based da W1 Consultoria
// ===========================

/**
 * Calcula o plano de independência financeira (FIRE)
 * @param {Object} params - Parâmetros do cálculo
 * @returns {Object} Resultado com projeção, cenários e impacto
 */
export function calculateFIRE({
    monthlyIncome = 8000,
    monthlyExpenses = 5200,
    currentInvestments = 0,
    annualReturn = 0.10,
    inflationRate = 0.045,
    withdrawalRate = 0.04,
    additionalMonthlyInvestment = 0
}) {
    // Validações
    if (monthlyIncome <= 0) throw new Error('Renda mensal deve ser positiva');
    if (monthlyExpenses < 0) throw new Error('Despesas não podem ser negativas');
    if (monthlyExpenses >= monthlyIncome && additionalMonthlyInvestment <= 0) {
        return {
            error: true,
            message: 'Suas despesas são iguais ou maiores que sua renda. É necessário reduzir gastos ou encontrar renda extra.',
            fireNumber: 0,
            totalYears: Infinity
        };
    }

    const monthlySavings = monthlyIncome - monthlyExpenses + additionalMonthlyInvestment;
    const savingsRate = monthlySavings / monthlyIncome;

    // Patrimônio necessário para FIRE
    const annualExpenses = monthlyExpenses * 12;
    const fireNumber = annualExpenses / withdrawalRate;

    // Taxa real (descontando inflação)
    const realReturn = (1 + annualReturn) / (1 + inflationRate) - 1;
    const monthlyRealReturn = Math.pow(1 + realReturn, 1 / 12) - 1;

    // Projeção mês a mês
    const projection = [];
    let balance = currentInvestments;
    let months = 0;
    const maxMonths = 50 * 12;

    while (balance < fireNumber && months < maxMonths) {
        balance = balance * (1 + monthlyRealReturn) + monthlySavings;
        months++;

        if (months % 12 === 0 || balance >= fireNumber) {
            const currentDate = new Date();
            currentDate.setMonth(currentDate.getMonth() + months);

            projection.push({
                month: months,
                year: Math.floor(months / 12),
                yearLabel: `${currentDate.getFullYear()}`,
                balance: Math.round(balance),
                percentComplete: Math.min(
                    Math.round((balance / fireNumber) * 1000) / 10,
                    100
                ),
                investedTotal: Math.round(currentInvestments + monthlySavings * months),
                gains: Math.round(balance - (currentInvestments + monthlySavings * months))
            });
        }
    }

    // 3 cenários (conservador, base, otimista)
    const scenarios = [
        { name: 'Conservador', rate: annualReturn - 0.02, color: '#ef4444', emoji: '🐢' },
        { name: 'Base', rate: annualReturn, color: '#3b82f6', emoji: '📊' },
        { name: 'Otimista', rate: annualReturn + 0.02, color: '#22c55e', emoji: '🚀' }
    ].map(scenario => {
        const result = calculateTimeToFIRE(
            currentInvestments, monthlySavings, fireNumber,
            scenario.rate, inflationRate
        );
        return { ...scenario, ...result };
    });

    // Análise de impacto: "e se eu poupar mais?"
    const impactAnalysis = [5, 10, 15, 20, 30].map(extraPercent => {
        const extraAmount = monthlyIncome * (extraPercent / 100);
        const newMonthly = monthlySavings + extraAmount;
        const result = calculateTimeToFIRE(
            currentInvestments, newMonthly, fireNumber, annualReturn, inflationRate
        );
        const baseMonths = months;
        const savedMonths = baseMonths - result.months;

        return {
            extraPercentage: extraPercent,
            extraAmount: Math.round(extraAmount),
            newMonthlySavings: Math.round(newMonthly),
            newSavingsRate: Math.round(((newMonthly) / monthlyIncome) * 100),
            ...result,
            monthsSaved: savedMonths,
            yearsSaved: Math.floor(savedMonths / 12),
            monthsSavedRemainder: savedMonths % 12
        };
    });

    // Marcos do caminho (milestones)
    const milestones = [10, 25, 50, 75, 100].map(pct => {
        const targetBalance = fireNumber * (pct / 100);
        let bal = currentInvestments;
        let m = 0;
        while (bal < targetBalance && m < maxMonths) {
            bal = bal * (1 + monthlyRealReturn) + monthlySavings;
            m++;
        }
        const date = new Date();
        date.setMonth(date.getMonth() + m);
        return {
            percentage: pct,
            targetBalance: Math.round(targetBalance),
            monthsToReach: m,
            yearsToReach: Math.floor(m / 12),
            monthsRemainder: m % 12,
            date: date.toISOString().split('T')[0],
            dateFormatted: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        };
    });

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);

    return {
        error: false,
        fireNumber: Math.round(fireNumber),
        currentInvestments,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings: Math.round(monthlySavings),
        savingsRate: Math.round(savingsRate * 100),
        progress: Math.round((currentInvestments / fireNumber) * 1000) / 10,
        totalMonths: months,
        totalYears: Math.floor(months / 12),
        totalMonthsRemainder: months % 12,
        targetDate: targetDate.toISOString().split('T')[0],
        targetDateFormatted: targetDate.toLocaleDateString('pt-BR', {
            month: 'long', year: 'numeric'
        }),
        projection,
        scenarios,
        impactAnalysis,
        milestones,
        summary: {
            passive_income_monthly: Math.round(fireNumber * (realReturn > 0 ? realReturn : annualReturn) / 12),
            years_of_freedom: Math.round((fireNumber / annualExpenses) * 10) / 10
        }
    };
}

function calculateTimeToFIRE(currentBalance, monthlySavings, target, annualReturn, inflation) {
    const realReturn = (1 + annualReturn) / (1 + inflation) - 1;
    const monthlyRate = Math.pow(1 + realReturn, 1 / 12) - 1;
    let balance = currentBalance;
    let months = 0;
    const maxMonths = 600;

    while (balance < target && months < maxMonths) {
        balance = balance * (1 + monthlyRate) + monthlySavings;
        months++;
    }

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + months);

    return {
        months,
        years: Math.floor(months / 12),
        monthsRemainder: months % 12,
        targetDate: targetDate.toISOString().split('T')[0],
        targetDateFormatted: targetDate.toLocaleDateString('pt-BR', {
            month: 'short', year: 'numeric'
        }),
        reachable: months < maxMonths
    };
}

export default calculateFIRE;
