/**
 * MetaFin Financial Health Score Calculator
 * Extracted logic for unit testing and consistency.
 */

export function calculateScore(summary, transactions, topCategories) {
 const income = summary.totalIncome || 1;
 const expenses = summary.totalExpenses || 0;
 const balance = summary.balance || 0;
 const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

 // Score base calculation (starting at 50)
 let score = 50;

 // 1. Savings rate (Max 30 points)
 if (savingsRate >= 30) score += 30;
 else if (savingsRate >= 20) score += 25;
 else if (savingsRate >= 10) score += 15;
 else if (savingsRate >= 0) score += 5;
 else score -= 10;

 // 2. Multiplier based on balance (Max 20 points)
 if (balance > income * 3) score += 20;
 else if (balance > income) score += 15;
 else if (balance > 0) score += 10;
 else score -= 10;

 // 3. Diversification — not concentrated in 1 category (Max 10 points)
 if (topCategories && topCategories.length > 0) {
 if (topCategories[0].pct < 40) score += 10;
 else if (topCategories[0].pct < 60) score += 5;
 }

 // 4. Activity — number of transactions (Max 10 points)
 if (transactions && transactions.length > 30) score += 10;
 else if (transactions && transactions.length > 10) score += 5;

 // Bound the final score between 0 and 100
 return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateEcoImpact(transactions, co2Multipliers) {
 let totalCO2 = 0;
 if (!transactions) return 0;

 transactions.filter(t => t.type === 'expense').forEach(t => {
 const cat = t.category || 'outros';
 const mult = co2Multipliers[cat] || co2Multipliers.default || 0.15;
 totalCO2 += Math.abs(t.amount) * mult;
 });

 return totalCO2;
}
