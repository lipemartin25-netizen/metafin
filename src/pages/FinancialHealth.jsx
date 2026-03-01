import { tw } from '@/lib/theme';
import { useMemo, useEffect, useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Shield, Lightbulb, ArrowRight, Leaf, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import { calculateScore, calculateEcoImpact } from '../lib/scoreCalculator';

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
    if (score >= 81) return '#10b981'; // 💚 Excelente
    if (score >= 61) return '#22c55e'; // 🟢 Bom
    if (score >= 31) return '#f59e0b'; // 🟡 Atenção
    return '#ef4444'; // 🔴 Crítico
}

function getScoreLabel(score) {
    if (score >= 81) return 'Excelente';
    if (score >= 61) return 'Bom';
    if (score >= 31) return 'Atenção';
    return 'Crítico';
}

function getScoreIcon(score) {
    if (score >= 81) return '💚';
    if (score >= 61) return '🟢';
    if (score >= 31) return '🟡';
    return '🔴';
}

export default function FinancialHealth() {
    const { user } = useAuth();
    const { transactions, summary } = useTransactions();

    // Configuração flexível de orçamento por categoria (Híbrida: Supabase + LocalStorage)
    const [budgetGoals, setBudgetGoals] = usePersistentState('category_budgets', {}, { secure: false });

    // AI Insights State
    const [aiTips, setAiTips] = useState([]);
    const [loadingAi, setLoadingAi] = useState(false);

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
                }
            } catch (e) { console.error('Error fetching budgets:', e); }
        }
        fetchBudgets();
    }, [user, setBudgetGoals]);

    const updateBudget = async (cat, amount) => {
        const newBudgets = { ...budgetGoals, [cat]: amount };
        if (amount <= 0 || isNaN(amount)) delete newBudgets[cat];

        setBudgetGoals(newBudgets);

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

        const score = calculateScore(summary, transactions, topCategories);
        const totalCO2 = calculateEcoImpact(transactions, CO2_MULT);

        // Generate tips
        const tips = [];
        if (savingsRate < 20) tips.push({ text: `Sua taxa de poupança está em ${savingsRate.toFixed(0)}%. O ideal é acima de 20%.`, type: 'warning' });
        else tips.push({ text: `Parabéns! Você está poupando ${savingsRate.toFixed(0)}% da sua renda.`, type: 'success' });

        if (topCategories.length > 0 && topCategories[0].pct > 40) {
            tips.push({ text: `${topCategories[0].pct.toFixed(0)}% dos seus gastos estão concentrados em "${topCategories[0].cat}". Tente diversificar.`, type: 'warning' });
        }

        if (balance < 0) tips.push({ text: 'Seu saldo está negativo. Priorize reduzir gastos e quitar dívidas.', type: 'danger' });
        if (balance > income * 3) tips.push({ text: 'Você tem uma boa reserva! Considere investir o excedente.', type: 'success' });

        // Goals check
        const goals = JSON.parse(localStorage.getItem('sf_goals') || '[]');
        if (goals.length === 0) tips.push({ text: 'Crie metas financeiras para manter o foco nos seus objetivos.', type: 'info', link: '/app/goals' });
        else {
            const completedGoals = goals.filter(g => g.current >= g.target).length;
            if (completedGoals > 0) tips.push({ text: `Você já completou ${completedGoals} meta(s)! Continue assim.`, type: 'success' });
        }

        const ecoScore = expenses > 0 ? (totalCO2 / expenses) : 0;
        if (ecoScore > 0.4) tips.push({ text: 'Sua pegada de carbono está alta (muitos gastos em transporte/carro). Considere modais alternativos!', type: 'warning' });
        else if (totalCO2 > 0) tips.push({ text: 'Boa! Seus hábitos de consumo estão mantendo uma pegada ecológica baixa neste mês.', type: 'success' });

        return { score, savingsRate, balance, income, expenses, topCategories, tips, totalCO2 };
    }, [transactions, summary]);

    // Fetch AI Insights effect
    useEffect(() => {
        let isMounted = true;
        async function fetchAiInsights() {
            if (analysis.income === 0 && analysis.expenses === 0) return;

            // Verifica o token JWT para enviar na requisição
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            setLoadingAi(true);
            try {
                const response = await fetch('/api/health-insights', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        financialData: {
                            income: analysis.income.toFixed(2),
                            expenses: analysis.expenses.toFixed(2),
                            balance: analysis.balance.toFixed(2),
                            savingsRate: analysis.savingsRate.toFixed(1),
                            topCategories: analysis.topCategories.map(c => c.cat)
                        }
                    })
                });

                if (response.ok && isMounted) {
                    const data = await response.json();
                    if (data && data.tips && Array.isArray(data.tips)) {
                        setAiTips(data.tips);
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar AI insights:", err);
            } finally {
                if (isMounted) setLoadingAi(false);
            }
        }

        // Wait a small delay to avoid spamming the API on rapid re-renders
        const timeout = setTimeout(() => {
            fetchAiInsights();
        }, 1000);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
        };
    }, [analysis.income, analysis.expenses, analysis.balance]);

    const displayTips = aiTips.length > 0 ? aiTips : analysis.tips;
    const scoreColor = getScoreColor(analysis.score);

    return (
        <div className="py-8 space-y-8 animate-fade-in pb-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2 mb-2">
                        <Heart className="w-8 h-8 text-pink-500" />
                        Saúde Financeira
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Análise completa do seu perfil financeiro (Ganhos, Gastos e Hábitos).</p>
                </div>
            </div>

            {/* Main Score Premium Display — Redesenhado v2 (3D Depth) */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-divider)] shadow-2xl bg-[var(--bg-elevated)]">
                {/* Animated Background Glows */}
                <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full blur-[90px] opacity-20 bg-[var(--brand-soft)] pointer-events-none" />
                <div className="absolute -left-24 -bottom-24 w-72 h-72 rounded-full blur-[90px] opacity-10 bg-indigo-500 pointer-events-none" />

                {/* Badge de status no topo */}
                <div className="relative z-10 px-6 pt-5 pb-0 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]/30">Score de Saúde</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border)]">
                        <span className="text-xs">{getScoreIcon(analysis.score)}</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">{getScoreLabel(analysis.score)}</span>
                    </div>
                </div>

                {/* Layout Principal: Score (esquerda) + Métricas (direita) */}
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-6 pt-4">

                    {/* Score Circular — Compacto e centralizado */}
                    <div className="flex flex-col items-center gap-3 sm:w-40 flex-shrink-0">
                        <div className="relative w-32 h-32">
                            {/* Anel de fundo */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r="68" fill="none" strokeWidth="10" className="stroke-white/5" />
                                {/* Anel de progresso colorido */}
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="68"
                                    fill="none"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    stroke={scoreColor}
                                    strokeDasharray={2 * Math.PI * 68}
                                    strokeDashoffset={(2 * Math.PI * 68) - (analysis.score / 100) * (2 * Math.PI * 68)}
                                    className="transition-all duration-[2000ms] ease-out"
                                    style={{ filter: `drop-shadow(0 0 8px ${scoreColor}80)` }}
                                />
                            </svg>
                            {/* Número central */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-[var(--text-primary)] drop-shadow-lg leading-none">{analysis.score}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">/100</span>
                            </div>
                        </div>
                    </div>

                    {/* Divisor vertical (apenas desktop) */}
                    <div className="hidden sm:block w-px self-stretch bg-[var(--bg-surface)] flex-shrink-0" />

                    {/* Métricas — Direita (ou baixo no mobile) */}
                    <div className="flex-1 w-full space-y-3.5">
                        {[
                            { label: 'Receitas', val: analysis.income, color: 'emerald-400', icon: TrendingUp, max: analysis.income > analysis.expenses ? analysis.income : analysis.expenses * 1.2 },
                            { label: 'Despesas', val: analysis.expenses, color: 'rose-400', icon: TrendingDown, max: analysis.income > analysis.expenses ? analysis.income : analysis.expenses * 1.2 },
                            { label: 'Poupança', val: `${analysis.savingsRate.toFixed(1)}%`, color: analysis.savingsRate >= 20 ? 'emerald-400' : 'amber-400', icon: CheckCircle, pct: analysis.savingsRate },
                            { label: 'Saldo', val: analysis.balance, color: analysis.balance >= 0 ? 'cyan-400' : 'rose-400', icon: Shield, max: analysis.income }
                        ].map((item, idx) => {
                            const valNum = typeof item.val === 'number' ? item.val : parseFloat(item.val);
                            const displayVal = typeof item.val === 'string' ? item.val : fmt(item.val);
                            const pct = item.pct !== undefined ? Math.max(0, Math.min(item.pct, 100)) : (item.max ? (Math.max(0, valNum) / item.max) * 100 : 0);

                            return (
                                <div key={idx}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`flex items-center gap-1.5 text-xs font-semibold text-gray-400`}>
                                            <item.icon className={`w-3.5 h-3.5 text-${item.color}`} />
                                            {item.label}
                                        </div>
                                        <span className={`text-sm font-black text-${item.color}`}>{displayVal}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800/40/[0.06] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-${item.color} rounded-full transition-all duration-1000 ease-out`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {/* Top Categories compactas */}
                        {analysis.topCategories.length > 0 && (
                            <div className="pt-3 mt-1 border-t border-[var(--border)]">
                                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Maiores Gastos</p>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {analysis.topCategories.slice(0, 4).map((cat, i) => (
                                        <div key={i} className="flex-shrink-0 bg-[var(--bg-surface)] border border-[var(--border)] px-2.5 py-1.5 rounded-lg flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold capitalize">{cat.cat}</span>
                                                <span className="text-[11px] text-[var(--text-primary)] font-black">{fmt(cat.total)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* Divisão: Dicas e Metas - Ajustado Spacing (16px gap) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 animate-fade-in">
                {/* Tips & Recommendations */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2">
                        {aiTips.length > 0 ? (
                            <><Sparkles className="w-5 h-5 text-brand-glow" /> MetaFin AI Insights</>
                        ) : (
                            <><Lightbulb className="w-5 h-5 text-yellow-500" /> Recomendações</>
                        )}
                        {loadingAi && <RefreshCw className="w-4 h-4 text-gray-500 animate-spin ml-2" />}
                    </h3>
                    <div className="space-y-3">
                        {displayTips.map((tip, i) => {
                            const config = {
                                success: { icon: CheckCircle, bg: 'bg-brand-primary/10 border-brand-primary/20', text: 'text-brand-primary dark:text-brand-glow', ring: 'ring-emerald-500/20' },
                                warning: { icon: AlertTriangle, bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-500/20' },
                                danger: { icon: AlertTriangle, bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/20' },
                                info: { icon: Lightbulb, bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-500/20' },
                            }[tip.type];
                            const TipIcon = config.icon;
                            return (
                                <div key={i} className={`${config.bg} tech-card border rounded-2xl p-5 flex items-start gap-4 transition-all hover:scale-[1.02] shadow-sm`}>

                                    <div className="p-2 bg-[var(--bg-surface)]0 dark:bg-black/20 rounded-xl">
                                        <TipIcon className={`w-6 h-6 ${config.text}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-100 dark:text-gray-200 leading-relaxed font-medium">{tip.text}</p>
                                        {tip.link && (
                                            <Link to={tip.link} className={`text-xs ${config.text} font-bold hover:underline flex items-center gap-1 mt-2 w-max px-2 py-1 bg-[var(--bg-surface)]0 dark:bg-black/20 rounded-lg`}>
                                                Explorar <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Eco-Finance Gamification Widget */}
                    <div className={`\${tw.card} mt-6 p-6 border-l-4 border-l-emerald-500 relative overflow-hidden bg-black/40 group`}>
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-brand-primary/10 rounded-full blur-[40px] group-hover:bg-brand-primary/20 transition-all" />
                        <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2 mb-2 uppercase tracking-widest relative z-10">
                            <Leaf className="w-5 h-5 text-brand-primary" /> Eco-Finance Tracker
                        </h3>
                        <div className="flex items-end justify-between relative z-10">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Pegada de Carbono (Mensal)</p>
                                <p className="text-3xl font-black text-brand-glow drop-shadow-tech-card">
                                    {(analysis.totalCO2).toFixed(1)} <span className="text-sm text-brand-primary/60 uppercase">KG CO₂</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <Zap className={`w-8 h-8 ${analysis.totalCO2 > 500 ? 'text-red-500 animate-pulse' : 'text-brand-primary'}`} />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border)] relative z-10">
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
                    <h3 className="text-lg font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2">
                        <Shield className="w-5 h-5 text-brand-primary" /> Limites de Gastos (MoM)
                    </h3>
                    <div className="tech-card space-y-6 p-6">

                        <p className="text-sm text-gray-500 dark:text-gray-400">Defina e monitore tetos de gastos inteligentes para suas categorias de alto impacto (Mês-a-Mês).</p>

                        {analysis.topCategories.map((cat) => {
                            const currentGoal = budgetGoals[cat.cat] || 0;
                            const hasGoal = currentGoal > 0;
                            const pctOfGoal = hasGoal ? Math.min((cat.total / currentGoal) * 100, 100) : 0;
                            const isOverBudget = hasGoal && cat.total > currentGoal;
                            const barColor = isOverBudget ? 'bg-red-500 shadow-tech-card' : (pctOfGoal > 80 ? 'bg-yellow-500 shadow-tech-card' : 'bg-brand-primary shadow-tech-card');

                            return (
                                <div key={cat.cat} className="space-y-3 group bg-gray-800/30/50 dark:bg-gray-800/40/[0.02] p-4 rounded-xl border border-transparent hover:border-brand-primary/20 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold uppercase text-[10px] tracking-wider">
                                                {cat.cat.substring(0, 2)}
                                            </div>
                                            <span className="text-[var(--text-primary)] dark:text-[var(--text-primary)] capitalize font-bold">{cat.cat}</span>
                                            {hasGoal && isOverBudget && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-800/40 dark:bg-surface-800 p-1 rounded-lg border border-[var(--border-subtle)]/40 dark:border-[var(--border)] shadow-lg shadow-black/10">
                                            <span className={`font-bold px-2 ${isOverBudget ? 'text-red-500' : 'text-[var(--text-primary)] dark:text-[var(--text-primary)]'}`}>
                                                {fmt(cat.total)}
                                            </span>
                                            <div className="text-gray-300 dark:text-gray-600 text-lg font-light">/</div>
                                            <input
                                                type="number"
                                                placeholder="Definir..."
                                                className="w-24 px-2 py-1.5 text-xs font-bold bg-transparent text-[var(--text-primary)] dark:text-[var(--text-primary)] outline-none text-right focus:text-brand-primary placeholder-gray-400 transition-colors"
                                                value={currentGoal || ''}
                                                onChange={(e) => updateBudget(cat.cat, parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="relative pt-1">
                                        <div className="h-2.5 bg-gray-800/50 dark:bg-surface-700/50 rounded-full overflow-hidden shadow-inner">
                                            {hasGoal ? (
                                                <div className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${pctOfGoal}%` }} />
                                            ) : (
                                                <div className="h-full rounded-full bg-gray-700/50 dark:bg-gray-600 w-full opacity-20" />
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
                            <div className="text-center py-10 border border-dashed border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-2xl">
                                <p className="text-sm text-gray-500">Adicione suas despesas para começar a definir inteligentemente metas de gastos.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
