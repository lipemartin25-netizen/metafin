import { addDays, isSameDay, differenceInDays } from 'date-fns';

export function calculateCashflow(transactions, bills, currentBalance, daysToSimulate = 90) {
 if (!transactions) return [];

 // Analyze historical data to find average daily variable spending
 const now = new Date();
 const ninetyDaysAgo = new Date();
 ninetyDaysAgo.setDate(now.getDate() - 90);

 // Ignore large anomalous transactions (e.g. buying a car), just filter normal daily expenses
 const variableExpenses = transactions.filter(t =>
 t.type === 'expense' &&
 new Date(t.date) >= ninetyDaysAgo &&
 Math.abs(t.amount) < 5000 // Cut off outliers for average
 );

 // Filter out transactions that might already be recurring bills to avoid double-counting
 // (In a perfect app, transactions would have a bill_id, but here we just take the raw average)
 const totalVariableSpending = variableExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);
 const dailyVariableAverage = totalVariableSpending / 90;

 // Build active bills array map
 const activeBills = bills ? bills.filter(b => !b.paid) : [];

 const forecast = [];
 let runningBalance = currentBalance || 0;

 for (let i = 1; i <= daysToSimulate; i++) {
 const currentDate = addDays(now, i);
 let dailyExpenses = dailyVariableAverage;
 let dailyIncome = 0;

 // Add fixed bills falling on this specific projection day
 activeBills.forEach(bill => {
 if (!bill.dueDate) return;
 // Padronize bill date time to 12:00:00 to avoid timezone shifts
 const bDate = new Date(`${bill.dueDate}T12:00:00`);
 const targetDate = new Date(currentDate);
 targetDate.setHours(12, 0, 0, 0);

 let isMatch = isSameDay(targetDate, bDate);

 // Handle recurrence projection
 if (!isMatch && bill.recurrence === 'monthly') {
 if (targetDate > bDate && targetDate.getDate() === bDate.getDate()) {
 isMatch = true;
 }
 } else if (!isMatch && bill.recurrence === 'weekly') {
 if (targetDate > bDate && differenceInDays(targetDate, bDate) % 7 === 0) {
 isMatch = true;
 }
 } else if (!isMatch && bill.recurrence === 'yearly') {
 if (targetDate > bDate && targetDate.getMonth() === bDate.getMonth() && targetDate.getDate() === bDate.getDate()) {
 isMatch = true;
 }
 }

 if (isMatch) {
 if (bill.type === 'income') dailyIncome += Math.abs(bill.amount);
 else dailyExpenses += Math.abs(bill.amount);
 }
 });

 // Apply daily delta to running balance
 runningBalance = runningBalance + dailyIncome - dailyExpenses;

 forecast.push({
 date: currentDate.toISOString(),
 label: currentDate.toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' }),
 balance: runningBalance,
 dailyIncome,
 dailyExpenses
 });
 }

 return forecast;
}
