import { useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Shield, Lightbulb, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
}

function getScoreLabel(score) {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Boa';
    if (score >= 40) return 'Regular';
    return 'Precisa Melhorar';
}

export default function FinancialHealth() {
    const { transactions, summary } = useTransactions();

    const analysis = useMemo(() => {
        const income = summary.totalIncome || 1;
        const expenses = summary.totalExpenses || 0;
        const balance = summary.balance || 0;
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        // Category breakdown
        const catTotals = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || 'outros';
            catTotals[cat] = (catTotals[cat] || 0) + Math.abs(t.amount);
        });

        const topCategories = Object.entries(catTotals)
            .map(([cat, total]) => ({ cat, total, pct: (total / expenses) * 100 }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // Score calculation
        let score = 50;

        // Savings rate (0-30 points)
        if (savingsRate >= 30) score += 30;
        else if (savingsRate >= 20) score += 25;
        else if (savingsRate >= 10) score += 15;
        else if (savingsRate >= 0) score += 5;
        else score -= 10;

        // Balance positive (0-20 points)
        if (balance > income * 3) score += 20;
        else if (balance > income) score += 15;
        else if (balance > 0) score += 10;
        else score -= 10;

        // Diversification — not concentrated in 1 category (0-10 points)
        if (topCategories.length > 0 && topCategories[0].pct < 40) score += 10;
        else if (topCategories.length > 0 && topCategories[0].pct < 60) score += 5;

        // Number of transactions — active user (0-10 points)
        if (transactions.length > 30) score += 10;
        else if (transactions.length > 10) score += 5;

        score = Math.max(0, Math.min(100, Math.round(score)));

        // Generate tips
        const tips = [];
        if (savingsRate < 20) tips.push({ text: `Sua taxa de poupanca esta em ${savingsRate.toFixed(0)}%. O ideal e acima de 20%.`, type: 'warning' });
        else tips.push({ text: `Parabens! Voce esta poupando ${savingsRate.toFixed(0)}% da sua renda.`, type: 'success' });

        if (topCategories.length > 0 && topCategories[0].pct > 40) {
            tips.push({ text: `${topCategories[0].pct.toFixed(0)}% dos seus gastos esta concentrado em "${topCategories[0].cat}". Tente diversificar.`, type: 'warning' });
        }

        if (balance < 0) tips.push({ text: 'Seu saldo esta negativo. Priorize reduzir gastos e quitar dividas.', type: 'danger' });
        if (balance > income * 3) tips.push({ text: 'Voce tem uma boa reserva! Considere investir o excedente.', type: 'success' });

        // Goals check
        const goals = JSON.parse(localStorage.getItem('sf_goals') || '[]');
        if (goals.length === 0) tips.push({ text: 'Crie metas financeiras para manter o foco nos seus objetivos.', type: 'info', link: '/app/goals' });
        else {
            const completedGoals = goals.filter(g => g.current >= g.target).length;
            if (completedGoals > 0) tips.push({ text: `Voce ja completou ${completedGoals} meta(s)! Continue assim.`, type: 'success' });
        }

        // Credit cards check
        const cards = JSON.parse(localStorage.getItem('sf_credit_cards') || '[]');
        const totalCardUsed = cards.reduce((s, c) => s + c.used, 0);
        const totalCardLimit = cards.reduce((s, c) => s + c.limit, 0);
        if (totalCardLimit > 0 && (totalCardUsed / totalCardLimit) > 0.7) {
            tips.push({ text: `Voce esta usando ${Math.round((totalCardUsed / totalCardLimit) * 100)}% do limite dos cartoes. Tente manter abaixo de 30%.`, type: 'warning' });
        }

        return { score, savingsRate, balance, income, expenses, topCategories, tips };
    }, [transactions, summary]);

    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (analysis.score / 100) * circumference;
    const scoreColor = getScoreColor(analysis.score);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Heart className="w-6 h-6 text-pink-500" />
                    Saude Financeira
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Analise completa da sua situacao financeira.</p>
            </div>

            {/* Main Score */}
            <div className="glass-card flex flex-col sm:flex-row items-center gap-8 p-8">
                <div className="relative w-44 h-44 flex-shrink-0">
                    <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="70" fill="none" strokeWidth="8" className="stroke-gray-200 dark:stroke-white/10" />
                        <circle cx="80" cy="80" r="70" fill="none" strokeWidth="8" strokeLinecap="round" stroke={scoreColor} strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{analysis.score}</span>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: scoreColor }}>{getScoreLabel(analysis.score)}</span>
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Receita</p>
                            <p className="text-lg font-bold text-emerald-500 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {fmt(analysis.income)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Despesas</p>
                            <p className="text-lg font-bold text-red-500 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> {fmt(analysis.expenses)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Taxa de Poupanca</p>
                            <p className={`text-lg font-bold ${analysis.savingsRate >= 20 ? 'text-emerald-500' : 'text-yellow-500'}`}>{analysis.savingsRate.toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Saldo</p>
                            <p className={`text-lg font-bold ${analysis.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{fmt(analysis.balance)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tips & Recommendations */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" /> Dicas Personalizadas
                </h3>
                <div className="space-y-3">
                    {analysis.tips.map((tip, i) => {
                        const config = {
                            success: { icon: CheckCircle, bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
                            warning: { icon: AlertTriangle, bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400' },
                            danger: { icon: AlertTriangle, bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
                            info: { icon: Lightbulb, bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400' },
                        }[tip.type];
                        const TipIcon = config.icon;
                        return (
                            <div key={i} className={`${config.bg} border rounded-xl p-4 flex items-start gap-3`}>
                                <TipIcon className={`w-5 h-5 ${config.text} flex-shrink-0 mt-0.5`} />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{tip.text}</p>
                                    {tip.link && (
                                        <Link to={tip.link} className={`text-xs ${config.text} hover:underline flex items-center gap-1 mt-1`}>
                                            Ver mais <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Spending Categories */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" /> Maiores Gastos
                </h3>
                <div className="glass-card space-y-3">
                    {analysis.topCategories.map((cat, i) => (
                        <div key={cat.cat} className="flex items-center gap-3">
                            <span className="w-6 text-center text-xs font-bold text-gray-500">#{i + 1}</span>
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 dark:text-gray-300 capitalize">{cat.cat}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{fmt(cat.total)} <span className="text-[10px] text-gray-500">({cat.pct.toFixed(0)}%)</span></span>
                                </div>
                                <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${cat.pct > 40 ? 'bg-red-500' : cat.pct > 25 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${cat.pct}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                    {analysis.topCategories.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">Adicione transacoes para ver a analise de gastos.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
