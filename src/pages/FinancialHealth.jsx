import { useMemo, useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Shield, Lightbulb, ArrowRight, Leaf, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

/* Eco-Finance Mappings: KG de CO2 emitidos por R$ gasto (estimativa abstrata para gamificação) */
const CO2_MULT = {
    carro: 0.8,
    transporte: 0.5,
    alimentacao: 0.3,
    supermercado: 0.3,
    casa: 0.2,
    lazer: 0.1,
    saude: 0.1,
    default: 0.15
};

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
    const { user } = useAuth();
    const { transactions, summary } = useTransactions();

    // Configuração flexível de orçamento por categoria (Híbrida: Supabase + LocalStorage)
    const [budgetGoals, setBudgetGoals] = useState(() => {
        try { return JSON.parse(localStorage.getItem('sf_category_budgets') || '{}'); } catch { return {}; }
    });

    useEffect(() => {
        if (!user) return;
        async function fetchBudgets() {
            try {
                const today = new Date();
                const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

                const { data, error } = await supabase
                    .from('budgets')
                    .select('category, planned_amount')
                    .eq('user_id', user.id)
                    .eq('month_year', monthStart);

                if (data && !error && data.length > 0) {
                    const bMap = {};
                    data.forEach(b => bMap[b.category] = parseFloat(b.planned_amount));
                    setBudgetGoals(bMap);
                    localStorage.setItem('sf_category_budgets', JSON.stringify(bMap));
                }
            } catch (e) { console.error('Error fetching budgets:', e); }
        }
        fetchBudgets();
    }, [user]);

    const updateBudget = async (cat, amount) => {
        const newBudgets = { ...budgetGoals, [cat]: amount };
        if (amount <= 0 || isNaN(amount)) delete newBudgets[cat];

        setBudgetGoals(newBudgets);
        localStorage.setItem('sf_category_budgets', JSON.stringify(newBudgets));

        if (!user) return;
        try {
            const today = new Date();
            const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

            if (amount <= 0 || isNaN(amount)) {
                await supabase
                    .from('budgets')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('category', cat)
                    .eq('month_year', monthStart);
            } else {
                await supabase
                    .from('budgets')
                    .upsert({
                        user_id: user.id,
                        category: cat,
                        month_year: monthStart,
                        planned_amount: amount,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id, category, month_year' });
            }
        } catch (e) { console.error('Error updating budget:', e); }
    };

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

        // Eco-Finance Calculation
        let totalCO2 = 0;
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || 'outros';
            const mult = CO2_MULT[cat] || CO2_MULT.default;
            totalCO2 += Math.abs(t.amount) * mult;
        });

        const ecoScore = expenses > 0 ? (totalCO2 / expenses) : 0; // Avg CO2 per real
        if (ecoScore > 0.4) tips.push({ text: 'Sua pegada de carbono está alta (muitos gastos em transporte/carro). Considere modais alternativos!', type: 'warning' });
        else if (totalCO2 > 0) tips.push({ text: 'Boa! Seus hábitos de consumo estão mantendo uma pegada ecológica baixa neste mês.', type: 'success' });

        return { score, savingsRate, balance, income, expenses, topCategories, tips, totalCO2 };
    }, [transactions, summary]);

    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (analysis.score / 100) * circumference;
    const scoreColor = getScoreColor(analysis.score);

    return (
        <div className="py-8 space-y-8 animate-fade-in pb-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                        <Heart className="w-8 h-8 text-pink-500" />
                        Saúde Financeira
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Análise completa do seu perfil financeiro (Ganhos, Gastos e Hábitos).</p>
                </div>
            </div>

            {/* Main Score Premium Display */}
            <div className="glass-card flex flex-col sm:flex-row items-center gap-10 p-10 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-10 bg-pink-500 transition-opacity group-hover:opacity-20" />

                <div className="relative w-48 h-48 flex-shrink-0">
                    <svg className="w-48 h-48 transform -rotate-90 drop-shadow-xl" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="70" fill="none" strokeWidth="10" className="stroke-gray-100 dark:stroke-white/5" />
                        <circle cx="80" cy="80" r="70" fill="none" strokeWidth="10" strokeLinecap="round" stroke={scoreColor} strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-[1500ms] ease-out drop-shadow-md" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-gray-900 dark:text-white drop-shadow-sm">{analysis.score}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: scoreColor }}>{getScoreLabel(analysis.score)}</span>
                    </div>
                </div>

                <div className="flex-1 w-full space-y-6 z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 transition-all">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">Receita</p>
                            <p className="text-xl font-bold text-emerald-500 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {fmt(analysis.income)}</p>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-red-500/30 transition-all">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">Despesas</p>
                            <p className="text-xl font-bold text-red-500 flex items-center gap-1"><TrendingDown className="w-4 h-4" /> {fmt(analysis.expenses)}</p>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-blue-500/30 transition-all">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">Taxa Poupança</p>
                            <p className={`text-xl font-bold ${analysis.savingsRate >= 20 ? 'text-emerald-500' : 'text-yellow-500'}`}>{analysis.savingsRate.toFixed(1)}%</p>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-indigo-500/30 transition-all">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">Saldo Líquido</p>
                            <p className={`text-xl font-bold ${analysis.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{fmt(analysis.balance)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divisão: Dicas e Metas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tips & Recommendations */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" /> Recomendações do Assistente
                    </h3>
                    <div className="space-y-3">
                        {analysis.tips.map((tip, i) => {
                            const config = {
                                success: { icon: CheckCircle, bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
                                warning: { icon: AlertTriangle, bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-500/20' },
                                danger: { icon: AlertTriangle, bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/20' },
                                info: { icon: Lightbulb, bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
                            }[tip.type];
                            const TipIcon = config.icon;
                            return (
                                <div key={i} className={`${config.bg} border rounded-2xl p-5 flex items-start gap-4 transition-all hover:ring-2 ${config.ring}`}>
                                    <div className="p-2 bg-white/50 dark:bg-black/20 rounded-xl">
                                        <TipIcon className={`w-6 h-6 ${config.text}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{tip.text}</p>
                                        {tip.link && (
                                            <Link to={tip.link} className={`text-xs ${config.text} font-bold hover:underline flex items-center gap-1 mt-2 w-max px-2 py-1 bg-white/50 dark:bg-black/20 rounded-lg`}>
                                                Explorar <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Eco-Finance Gamification Widget */}
                    <div className="glass-card mt-6 p-6 border-l-4 border-l-emerald-500 relative overflow-hidden bg-black/40 group">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-all" />
                        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2 uppercase tracking-widest relative z-10">
                            <Leaf className="w-5 h-5 text-emerald-500" /> Eco-Finance Tracker
                        </h3>
                        <div className="flex items-end justify-between relative z-10">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Pegada de Carbono (Mensal)</p>
                                <p className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                                    {(analysis.totalCO2).toFixed(1)} <span className="text-sm text-emerald-500/60 uppercase">KG CO₂</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <Zap className={`w-8 h-8 ${analysis.totalCO2 > 500 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                            <p className="text-xs text-gray-500 font-bold">
                                {analysis.totalCO2 > 500
                                    ? "⚠️ ALERTA: Seu padrão de consumo está agressivo ao meio ambiente."
                                    : "🌱 Geração Alpha: Seu impacto está controlado. Mantenha os gastos locais."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Metas de Orçamento por Categoria */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-500" /> Limites de Gastos (MoM)
                    </h3>
                    <div className="glass-card space-y-6 p-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Defina e monitore tetos de gastos inteligentes para suas categorias de alto impacto (Mês-a-Mês).</p>

                        {analysis.topCategories.map((cat) => {
                            const currentGoal = budgetGoals[cat.cat] || 0;
                            const hasGoal = currentGoal > 0;
                            const pctOfGoal = hasGoal ? Math.min((cat.total / currentGoal) * 100, 100) : 0;
                            const isOverBudget = hasGoal && cat.total > currentGoal;
                            const barColor = isOverBudget ? 'bg-red-500 shadow-[0_0_10px_-2px_rgba(239,68,68,0.5)]' : (pctOfGoal > 80 ? 'bg-yellow-500 shadow-[0_0_10px_-2px_rgba(234,179,8,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]');

                            return (
                                <div key={cat.cat} className="space-y-3 group bg-gray-50/50 dark:bg-white/[0.02] p-4 rounded-xl border border-transparent hover:border-purple-500/20 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold uppercase text-[10px] tracking-wider">
                                                {cat.cat.substring(0, 2)}
                                            </div>
                                            <span className="text-gray-900 dark:text-white capitalize font-bold">{cat.cat}</span>
                                            {hasGoal && isOverBudget && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                                        </div>
                                        <div className="flex items-center gap-2 bg-white dark:bg-surface-800 p-1 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm">
                                            <span className={`font-bold px-2 ${isOverBudget ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                                {fmt(cat.total)}
                                            </span>
                                            <div className="text-gray-300 dark:text-gray-600 text-lg font-light">/</div>
                                            <input
                                                type="number"
                                                placeholder="Definir..."
                                                className="w-24 px-2 py-1.5 text-xs font-bold bg-transparent text-gray-900 dark:text-white outline-none text-right focus:text-purple-500 placeholder-gray-400 transition-colors"
                                                value={currentGoal || ''}
                                                onChange={(e) => updateBudget(cat.cat, parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="relative pt-1">
                                        <div className="h-2.5 bg-gray-200 dark:bg-surface-700/50 rounded-full overflow-hidden shadow-inner">
                                            {hasGoal ? (
                                                <div className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${pctOfGoal}%` }} />
                                            ) : (
                                                <div className="h-full rounded-full bg-gray-300 dark:bg-gray-600 w-full opacity-20" />
                                            )}
                                        </div>
                                        {hasGoal && (
                                            <div className="absolute right-0 -bottom-5 text-[10px] font-bold text-gray-400">
                                                {pctOfGoal.toFixed(1)}% do orçamento
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {analysis.topCategories.length === 0 && (
                            <div className="text-center py-10 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                                <p className="text-sm text-gray-500">Adicione suas despesas para começar a definir inteligentemente metas de gastos.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
