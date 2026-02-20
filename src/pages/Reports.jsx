import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { FileText, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import categoriesData from '../data/data.json';

const categoryConfig = categoriesData.categories;
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function Reports() {
    const { transactions } = useTransactions();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    const changeMonth = (offset) => {
        const [year, m] = month.split('-').map(Number);
        const d = new Date(year, m - 1 + offset, 1);
        setMonth(d.toISOString().slice(0, 7));
    };

    const monthLabel = useMemo(() => {
        const [year, m] = month.split('-').map(Number);
        return new Date(year, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }, [month]);

    const report = useMemo(() => {
        const txs = transactions.filter(t => t.date.startsWith(month));
        const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
        const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
        const balance = income - expenses;
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        // Category breakdown
        const catTotals = {};
        txs.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || 'outros';
            catTotals[cat] = (catTotals[cat] || 0) + Math.abs(t.amount);
        });

        const categories = Object.entries(catTotals)
            .map(([cat, total]) => ({
                cat,
                label: categoryConfig[cat]?.label || cat,
                icon: categoryConfig[cat]?.icon || '📦',
                total,
                pct: expenses > 0 ? (total / expenses) * 100 : 0
            }))
            .sort((a, b) => b.total - a.total);

        // Pie chart data
        const pieData = categories.slice(0, 7).map(c => ({ name: c.label, value: c.total }));
        if (categories.length > 7) {
            const othersTotal = categories.slice(7).reduce((s, c) => s + c.total, 0);
            pieData.push({ name: 'Outros', value: othersTotal });
        }

        // Previous month comparison
        const [year, m] = month.split('-').map(Number);
        const prevMonth = new Date(year, m - 2, 1).toISOString().slice(0, 7);
        const prevTxs = transactions.filter(t => t.date.startsWith(prevMonth));
        const prevIncome = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
        const prevExpenses = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
        const incomeChange = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
        const expenseChange = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

        // Top transactions
        const topExpenses = txs.filter(t => t.type === 'expense').sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 5);
        const topIncomes = txs.filter(t => t.type === 'income').sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 3);

        return { txCount: txs.length, income, expenses, balance, savingsRate, categories, pieData, incomeChange, expenseChange, topExpenses, topIncomes };
    }, [transactions, month]);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-orange-500" />
                        Relatorio Mensal
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Resumo completo das suas financas.</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-1 rounded-xl">
                    <button onClick={() => changeMonth(-1)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-4 text-sm font-bold text-gray-900 dark:text-white min-w-[160px] text-center capitalize">{monthLabel}</span>
                    <button onClick={() => changeMonth(1)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card bg-emerald-500/5 border-emerald-500/10">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Receitas</p>
                    <p className="text-xl font-bold text-emerald-500">{fmt(report.income)}</p>
                    {report.incomeChange !== 0 && (
                        <p className={`text-[10px] mt-1 flex items-center gap-0.5 ${report.incomeChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {report.incomeChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(report.incomeChange).toFixed(0)}% vs anterior
                        </p>
                    )}
                </div>
                <div className="glass-card bg-red-500/5 border-red-500/10">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Despesas</p>
                    <p className="text-xl font-bold text-red-500">{fmt(report.expenses)}</p>
                    {report.expenseChange !== 0 && (
                        <p className={`text-[10px] mt-1 flex items-center gap-0.5 ${report.expenseChange < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {report.expenseChange < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {Math.abs(report.expenseChange).toFixed(0)}% vs anterior
                        </p>
                    )}
                </div>
                <div className="glass-card">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Resultado</p>
                    <p className={`text-xl font-bold ${report.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{fmt(report.balance)}</p>
                </div>
                <div className="glass-card">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Taxa de Poupanca</p>
                    <p className={`text-xl font-bold ${report.savingsRate >= 20 ? 'text-emerald-500' : report.savingsRate >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>{report.savingsRate.toFixed(0)}%</p>
                </div>
            </div>

            {/* Spending by Category */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Gastos por Categoria</h3>
                    {report.pieData.length > 0 ? (
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={report.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                        {report.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={v => fmt(v)} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-12">Sem despesas neste mes</p>
                    )}
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Detalhamento</h3>
                    <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scrollbar">
                        {report.categories.map((cat, i) => (
                            <div key={cat.cat} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${COLORS[i % COLORS.length]}20` }}>
                                    {cat.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700 dark:text-gray-300 truncate">{cat.label}</span>
                                        <span className="font-bold text-gray-900 dark:text-white ml-2">{fmt(cat.total)}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${cat.pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-500 w-10 text-right">{cat.pct.toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Transactions */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" /> Maiores Despesas
                    </h3>
                    <div className="space-y-2">
                        {report.topExpenses.map((tx, i) => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 w-4">#{i + 1}</span>
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{tx.description}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-red-500">{fmt(Math.abs(tx.amount))}</span>
                            </div>
                        ))}
                        {report.topExpenses.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Sem despesas</p>}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Maiores Receitas
                    </h3>
                    <div className="space-y-2">
                        {report.topIncomes.map((tx, i) => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 w-4">#{i + 1}</span>
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{tx.description}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-emerald-500">{fmt(Math.abs(tx.amount))}</span>
                            </div>
                        ))}
                        {report.topIncomes.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Sem receitas</p>}
                    </div>
                </div>
            </div>

            {/* Footer stats */}
            <div className="text-center text-xs text-gray-500 py-4">
                {report.txCount} transacoes analisadas em {monthLabel}
            </div>
        </div>
    );
}
