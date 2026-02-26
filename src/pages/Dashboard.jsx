import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import categoriesData from '../data/data.json';
import { analytics } from '../hooks/useAnalytics';
import { useLanguage } from '../contexts/LanguageContext';
import ProGate from '../components/ProGate';
import { Sparkles } from 'lucide-react';

const categoryConfig = categoriesData.categories;

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Dashboard() {
    const { t } = useLanguage();
    const { transactions, loading } = useTransactions();

    useEffect(() => { analytics.dashboardViewed(); }, []);

    // ========== VALORES ZERADOS ==========
    const summary = {
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0,
    };

    const dailyData = [];
    const categoryData = [];
    const recentTransactions = [];
    // =====================================

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;

    const ttStyle = { backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' };

    return (
        <div className="py-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1><p className="text-gray-400 text-sm">{t('dashboard_overview')}</p></div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
                <div className="glass-card relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10">
                        <div><p className="text-gray-400 text-sm font-medium mb-1">{t('total_balance')}</p><h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{fmt(summary.balance)}</h2></div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"><Wallet className="w-6 h-6 text-white" /></div>
                    </div>
                </div>

                <div className="glass-card relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10">
                        <div><p className="text-gray-400 text-sm font-medium mb-1">{t('income')}</p><h2 className="text-2xl font-bold text-emerald-400">{fmt(summary.totalIncome)}</h2></div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
                    </div>
                </div>

                <div className="glass-card relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10">
                        <div><p className="text-gray-400 text-sm font-medium mb-1">{t('expenses')}</p><h2 className="text-2xl font-bold text-rose-400">{fmt(summary.totalExpenses)}</h2></div>
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors"><TrendingDown className="w-5 h-5 text-rose-400" /></div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="glass-card lg:col-span-2 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> {t('cash_flow')}</h3>
                    <div className="h-[260px] flex items-center justify-center text-gray-600">{t('import_transactions_to_see_chart')}</div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">{t('expenses_by_category')}</h3>
                    <div className="h-[180px] flex items-center justify-center text-gray-600">{t('no_expenses')}</div>
                </div>
            </div>

            {/* AI Insights Section */}
            <ProGate feature="aiInsights">
                <div className="glass-card border border-emerald-500/10 p-6 flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-lg font-semibold text-white">Insights com IA</h3>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                PRO
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                            Use o chat de IA (botão ✨ no canto inferior) para obter análises
                            personalizadas, previsões e dicas de economia baseadas nos seus dados reais.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
                        {[
                            { icon: '📊', label: 'Análise Completa', desc: 'Resumo inteligente', prompt: 'Me dê um resumo financeiro completo' },
                            { icon: '💰', label: 'Dicas de Economia', desc: 'Onde cortar gastos', prompt: 'Me dê dicas de como economizar' },
                            { icon: '📈', label: 'Previsão Mensal', desc: 'Tendências futuras', prompt: 'Qual a minha previsão financeira para os próximos meses?' },
                            { icon: '📋', label: 'Plano 50/30/20', desc: 'Orçamento ideal', prompt: 'Como ficaria meu plano 50/30/20 com base nos meus gastos?' },
                            { icon: '🏷️', label: 'Auto-Categorizar', desc: 'IA classifica', prompt: 'Você pode me ajudar a categorizar minhas despesas?' },
                            { icon: '🧾', label: 'Dicas de IR', desc: 'Imposto de Renda', prompt: 'O que eu preciso saber para declarar meu imposto de renda com base nos meus dados?' },
                        ].map((item) => (
                            <Link
                                key={item.label}
                                to={`/app/advisor?q=${encodeURIComponent(item.prompt)}`}
                                className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center hover:bg-white/[0.08] hover:border-emerald-500/20 transition-all cursor-pointer group/card"
                            >
                                <span className="text-2xl block mb-2 transition-transform group-hover/card:scale-110">{item.icon}</span>
                                <p className="text-xs font-medium text-gray-300 mb-0.5 group-hover/card:text-emerald-400">{item.label}</p>
                                <p className="text-[10px] text-gray-600 group-hover/card:text-gray-500">{item.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </ProGate>

            <div className="glass-card p-0 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{t('recent_transactions')}</h3>
                    <a href="/app/transactions" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">{t('see_all')}</a>
                </div>
                <div className="p-8 text-center text-gray-500 text-sm">{t('no_recent_transactions')}</div>
            </div>
        </div>
    );
}
