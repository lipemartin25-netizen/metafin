import { tw } from '@/lib/theme';
import { useState, useMemo, useRef } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { FileText, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, Loader2, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import categoriesData from '../data/data.json';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { analytics } from '../hooks/useAnalytics';
import { useVisibility } from '../hooks/useVisibility';

const categoryConfig = categoriesData.categories;
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function fmt(v, isVisible = true) {
    if (!isVisible) return 'R$ ••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}

export default function Reports() {
    const { isVisible } = useVisibility();
    const { transactions } = useTransactions();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef(null);

    const changeMonth = (offset) => {
        const [year, m] = month.split('-').map(Number);
        const d = new Date(year, m - 1 + offset, 1);
        setMonth(d.toISOString().slice(0, 7));
    };

    const monthLabel = useMemo(() => {
        const [year, m] = month.split('-').map(Number);
        return new Date(year, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }, [month]);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0a0a0a'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`relatorio_metafin_${month}.pdf`);
            analytics.featureUsed('pdf_export');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Não foi possível gerar o relatório em PDF agora.');
        } finally {
            setIsExporting(false);
        }
    };

    const report = useMemo(() => {
        const txs = transactions.filter(t => t.date.startsWith(month));
        const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
        const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
        const balance = income - expenses;
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

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

        const pieData = categories.slice(0, 7).map(c => ({ name: c.label, value: c.total }));
        if (categories.length > 7) {
            const othersTotal = categories.slice(7).reduce((s, c) => s + c.total, 0);
            pieData.push({ name: 'Outros', value: othersTotal });
        }

        const [year, m] = month.split('-').map(Number);
        const prevMonth = new Date(year, m - 2, 1).toISOString().slice(0, 7);
        const prevTxs = transactions.filter(t => t.date.startsWith(prevMonth));
        const prevIncome = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
        const prevExpenses = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
        const incomeChange = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
        const expenseChange = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

        const topExpenses = txs.filter(t => t.type === 'expense').sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 5);
        const topIncomes = txs.filter(t => t.type === 'income').sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 3);

        return { txCount: txs.length, income, expenses, balance, savingsRate, categories, pieData, incomeChange, expenseChange, topExpenses, topIncomes };
    }, [transactions, month]);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <FileText className="w-6 h-6 text-orange-500" />
                        Relatório Mensal
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Resumo completo das suas finanças.</p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] text-gray-300 hover:bg-[var(--bg-surface)] transition flex items-center gap-2"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span className="hidden sm:inline">Exportar PDF</span>
                    </button>
                    <div className="flex items-center gap-2 bg-gray-800/30 dark:bg-[var(--bg-surface)] p-1 rounded-xl">
                        <button onClick={() => changeMonth(-1)} className="p-2 text-gray-400 hover:text-[var(--text-primary)] transition-all"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="px-4 text-sm font-bold text-[var(--text-primary)] min-w-[160px] text-center capitalize">{monthLabel}</span>
                        <button onClick={() => changeMonth(1)} className="p-2 text-gray-400 hover:text-[var(--text-primary)] transition-all"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <div ref={reportRef} className="space-y-6 px-1 py-2">
                {/* Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in">
                    <div className="tech-card p-5 border-[var(--border-subtle)] bg-brand-primary/5">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Receitas</p>
                        <p className="text-xl font-black text-brand-primary">{fmt(report.income, isVisible)}</p>
                        {report.incomeChange !== 0 && (
                            <p className={`text-[9px] mt-1.5 flex items-center gap-0.5 font-bold ${report.incomeChange > 0 ? 'text-brand-glow' : 'text-red-400'}`}>
                                {report.incomeChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(report.incomeChange).toFixed(0)}% vs anterior
                            </p>
                        )}
                    </div>
                    <div className="tech-card p-5 border-red-500/10 bg-red-500/5">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Despesas</p>
                        <p className="text-xl font-black text-red-500">{fmt(report.expenses, isVisible)}</p>
                        {report.expenseChange !== 0 && (
                            <p className={`text-[9px] mt-1.5 flex items-center gap-0.5 font-bold ${report.expenseChange < 0 ? 'text-brand-glow' : 'text-red-400'}`}>
                                {report.expenseChange < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                {Math.abs(report.expenseChange).toFixed(0)}% vs anterior
                            </p>
                        )}
                    </div>
                    <div className="pastel-card p-5 border-[var(--border-subtle)]">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Resultado</p>
                        <p className={`text-xl font-black ${report.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{fmt(report.balance, isVisible)}</p>
                    </div>
                    <div className="tech-card p-5 border-[var(--border-subtle)]">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Taxa de Poupança</p>
                        <p className={`text-xl font-black ${report.savingsRate >= 20 ? 'text-brand-primary' : report.savingsRate >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>{report.savingsRate.toFixed(0)}%</p>
                    </div>
                </div>

                {/* Spending by Category / Breakdown */}
                <div className="grid lg:grid-cols-2 gap-6 animate-in">
                    <div className="tech-card p-6 border-[var(--border-subtle)]">
                        <h3 className="text-sm font-black text-[var(--text-primary)] mb-6 uppercase tracking-widest flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-brand-primary" /> Gastos por Categoria
                        </h3>
                        {report.pieData.length > 0 ? (
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={report.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                            {report.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={v => fmt(v, isVisible)} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-12">Sem despesas neste mês</p>
                        )}
                    </div>

                    <div className="tech-card p-6 border-[var(--border-subtle)]">
                        <h3 className="text-sm font-black text-[var(--text-primary)] mb-6 uppercase tracking-widest">Detalhamento</h3>
                        <div className="space-y-4 max-h-[260px] overflow-y-auto custom-scrollbar pr-2">
                            {report.categories.map((cat, i) => (
                                <div key={cat.cat} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-inner" style={{ backgroundColor: `${COLORS[i % COLORS.length]}20` }}>
                                        {cat.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-gray-400 font-bold tracking-tight truncate">{cat.label}</span>
                                            <span className="font-black text-[var(--text-primary)] ml-2">{fmt(cat.total, isVisible)}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-800/40 dark:bg-black/20 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full rounded-full transition-all shadow-sm" style={{ width: `${cat.pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 w-10 text-right font-black">{cat.pct.toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Transactions */}
                <div className="grid lg:grid-cols-2 gap-6 animate-in">
                    <div className="tech-card p-6">
                        <h3 className="text-sm font-black text-[var(--text-primary)] mb-4 flex items-center gap-2 uppercase tracking-widest">
                            <TrendingDown className="w-4 h-4 text-red-500" /> Maiores Despesas
                        </h3>
                        <div className="space-y-2">
                            {report.topExpenses.map((tx, i) => (
                                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[var(--border)] last:border-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 w-4">#{i + 1}</span>
                                        <div>
                                            <p className="text-sm text-gray-300">{tx.description}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-red-500">{fmt(Math.abs(tx.amount), isVisible)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="tech-card p-6">
                        <h3 className="text-sm font-black text-[var(--text-primary)] mb-4 flex items-center gap-2 uppercase tracking-widest">
                            <TrendingUp className="w-4 h-4 text-brand-primary" /> Maiores Receitas
                        </h3>
                        <div className="space-y-2">
                            {report.topIncomes.map((tx, i) => (
                                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[var(--border)] last:border-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 w-4">#{i + 1}</span>
                                        <div>
                                            <p className="text-sm text-gray-300">{tx.description}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-brand-primary">{fmt(Math.abs(tx.amount), isVisible)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-gray-500 py-4">
                {report.txCount} transações analisadas em {monthLabel}
            </div>
        </div>
    );
}
