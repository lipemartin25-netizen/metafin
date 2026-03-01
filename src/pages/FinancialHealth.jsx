import { tw } from '@/lib/theme';
import { useMemo, useEffect, useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Heart, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Shield, Lightbulb, ArrowRight, Leaf, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import { calculateScore, calculateEcoImpact } from '../lib/scoreCalculator';
import { motion } from 'framer-motion';

const CO2_MULT = { carro: 0.8, transporte: 0.5, alimentacao: 0.3, supermercado: 0.3, casa: 0.2, lazer: 0.1, saude: 0.1, default: 0.15 };

function fmt(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }

function getScoreColor(score) {
    if (score >= 81) return '#10b981';
    if (score >= 61) return '#22c55e';
    if (score >= 31) return '#f59e0b';
    return '#ef4444';
}

export default function FinancialHealth() {
    const { user } = useAuth();
    const { transactions, summary } = useTransactions();
    const [budgetGoals, setBudgetGoals] = usePersistentState('category_budgets', {}, { secure: false });
    const [aiTips, setAiTips] = useState([]);
    const [loadingAi, setLoadingAi] = useState(false);

    useEffect(() => {
        if (!user) return;
        async function fetchBudgets() {
            try {
                const today = new Date();
                const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
                const { data } = await supabase.from('budgets').select('category, planned_amount').eq('user_id', user.id).eq('month_year', monthStart);
                if (data) {
                    const bMap = {};
                    data.forEach(b => bMap[b.category] = parseFloat(b.planned_amount));
                    setBudgetGoals(bMap);
                }
            } catch (e) { console.error(e); }
        }
        fetchBudgets();
    }, [user, setBudgetGoals]);

    const analysis = useMemo(() => {
        const income = summary.totalIncome || 0;
        const expenses = summary.totalExpenses || 0;
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
        const catTotals = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || 'outros';
            catTotals[cat] = (catTotals[cat] || 0) + Math.abs(t.amount);
        });
        const topCategories = Object.entries(catTotals).map(([cat, total]) => ({ cat, total, pct: (total / (expenses || 1)) * 100 })).sort((a, b) => b.total - a.total).slice(0, 5);
        const score = calculateScore(summary, transactions, topCategories);
        const totalCO2 = calculateEcoImpact(transactions, CO2_MULT);
        return { score, savingsRate, balance: summary.balance, income, expenses, topCategories, totalCO2 };
    }, [transactions, summary]);

    const scoreColor = getScoreColor(analysis.score);

    return (
        <div className="py-6 space-y-8 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Heart className="w-6 h-6 text-pink-500" />
                        Saúde Financeira
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Análise completa do seu perfil e hábitos.</p>
                </div>
            </div>

            {/* Main Score Premium Display */}
            <div className="pastel-card p-8 bg-[var(--bg-base)] border-[var(--border-subtle)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative w-40 h-40 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                            <circle cx="80" cy="80" r="70" fill="none" strokeWidth="12" className="stroke-white/5" />
                            <motion.circle cx="80" cy="80" r="70" fill="none" strokeWidth="12" strokeLinecap="round" stroke={scoreColor} strokeDasharray={2 * Math.PI * 70} initial={{ strokeDashoffset: 2 * Math.PI * 70 }} animate={{ strokeDashoffset: (2 * Math.PI * 70) - (analysis.score / 100) * (2 * Math.PI * 70) }} transition={{ duration: 1.5, ease: "easeOut" }} className="shadow-lg" style={{ filter: `drop-shadow(0 0 10px ${scoreColor}40)` }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-[var(--text-primary)]">{analysis.score}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Score Global</span>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-6 w-full">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Taxa de Poupança</p>
                            <p className={`text-2xl font-black ${analysis.savingsRate >= 20 ? 'text-brand-glow' : 'text-yellow-500'}`}>{analysis.savingsRate.toFixed(1)}%</p>
                            <div className="h-1.5 bg-gray-800/40 rounded-full mt-2 overflow-hidden"><div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: `${Math.min(analysis.savingsRate, 100)}%` }} /></div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Impacto Eco</p>
                            <p className="text-2xl font-black text-emerald-400">{analysis.totalCO2.toFixed(1)} <span className="text-xs opacity-50">KG CO₂</span></p>
                            <div className="h-1.5 bg-gray-800/40 rounded-full mt-2 overflow-hidden"><div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${Math.min(analysis.totalCO2 / 10, 100)}%` }} /></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Insights Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-primary" /> Insights de Gestão
                    </h3>
                    <div className="space-y-3">
                        {analysis.topCategories.map((cat, i) => (
                            <div key={i} className="tech-card p-4 flex items-center justify-between border-[var(--border-subtle)] hover:border-brand-primary/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-xs">{cat.cat.slice(0, 2).toUpperCase()}</div>
                                    <div>
                                        <p className="text-sm font-black text-[var(--text-primary)] capitalize">{cat.cat}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">{cat.pct.toFixed(1)}% das despesas</p>
                                    </div>
                                </div>
                                <p className="text-sm font-black text-[var(--text-primary)]">{fmt(cat.total)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Eco & Tips */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" /> Ações Sugeridas
                    </h3>
                    <div className="tech-card p-6 border-[var(--border-subtle)] bg-indigo-500/5 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg"><Lightbulb className="w-5 h-5 text-indigo-400" /></div>
                                <div>
                                    <p className="text-sm font-black text-[var(--text-primary)] mb-1">Otimize seus gastos</p>
                                    <p className="text-xs text-gray-400 leading-relaxed font-medium">Seus gastos em "{analysis.topCategories[0]?.cat || 'geral'}" representam uma parte significativa do seu orçamento. Tente reduzir 10% no próximo mês.</p>
                                </div>
                            </div>
                            <Link to="/app/budget" className="flex items-center justify-between p-3 rounded-xl bg-black/20 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-all">
                                Configurar Orçamentos <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    <div className="tech-card p-6 border-emerald-500/10 bg-emerald-500/5 relative overflow-hidden group">
                        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                            <Leaf className="w-3.5 h-3.5" /> Eco-Status
                        </h4>
                        <p className="text-sm font-black text-[var(--text-primary)] mb-1">Geração Consciente</p>
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">Sua pegada de carbono está {analysis.totalCO2 > 300 ? 'moderada' : 'excelente'}. Continue priorizando o consumo sustentável.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
