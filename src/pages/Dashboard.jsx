import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { calculateCashflow } from '../lib/cashflowForecast';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Sparkles,
    Calendar,
    ChevronRight,
    Target,
    Landmark,
    Activity,
    LineChart as LineChartIcon
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import categoriesData from '../data/data.json';
import { analytics } from '../hooks/useAnalytics';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import ProGate from '../components/ProGate';
import XRayDiagnosis from '../components/XRayDiagnosis';
import SmartReconciliation from '../components/SmartReconciliation';

const categoryConfig = categoriesData.categories;

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Componente de Card de Resumo (Estilo Mobills)
function SummaryCard({ title, value, type, icon: Icon, trend }) {
    let iconColor = 'text-accent dark:text-accent border-accent/20';
    let bgColor = 'bg-accent/10';
    let gradient = 'from-green-400 to-accent';
    let shadow = 'group-hover:shadow-[0_0_20px_rgba(57,255,20,0.2)]';

    if (type === 'expense') {
        iconColor = 'text-pink-600 dark:text-pink-400 border-pink-500/20';
        bgColor = 'bg-pink-500/10';
        gradient = 'from-pink-500 to-fuchsia-600';
        shadow = 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.2)]';
    } else if (type === 'balance') {
        iconColor = 'text-brand-600 dark:text-brand-400 border-brand-500/20';
        bgColor = 'bg-brand-500/10';
        gradient = 'from-brand-400 to-brand-600';
        shadow = 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]';
    }

    return (
        <div className={`glass-card relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300 border border-transparent hover:border-white/10 ${shadow}`}>
            {/* Background Blob */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-30 ${bgColor}`} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${bgColor} border border-transparent dark:border-white/5`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    {trend !== null && trend !== undefined && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${trend >= 0
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10'
                            : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/10'
                            }`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                </div>

                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{fmt(value)}</p>

                <div className="mt-4 h-1.5 w-full bg-gray-200 dark:bg-surface-700/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${gradient} opacity-80 transition-all duration-700`}
                        style={{ width: `${Math.min(Math.max(Math.abs(trend || 50), 10), 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { t } = useLanguage();
    const { transactions, loading, summary } = useTransactions();
    const { theme } = useTheme();

    const [chartMode, setChartMode] = useState('history'); // history, forecast
    const [bills, setBills] = useState([]);
    const [showXRay, setShowXRay] = useState(false);

    useEffect(() => {
        analytics.dashboardViewed();
        const s = localStorage.getItem('sf_bills');
        if (s) setBills(JSON.parse(s));

        // Check if X-Ray is needed (no score in localStorage)
        const hasScore = localStorage.getItem('sf_xray_latest');
        if (!hasScore) {
            setShowXRay(true);
        }
    }, []);

    // Calcular trends reais comparando com mês anterior
    const trends = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth < 0) { prevMonth = 11; prevYear--; }

        let curIncome = 0, curExpense = 0;
        let prevIncome = 0, prevExpense = 0;

        transactions.forEach((tx) => {
            const d = new Date(tx.date + 'T12:00:00');
            const m = d.getMonth();
            const y = d.getFullYear();
            const amt = Math.abs(tx.amount);

            if (m === currentMonth && y === currentYear) {
                if (tx.type === 'income') curIncome += amt;
                else curExpense += amt;
            } else if (m === prevMonth && y === prevYear) {
                if (tx.type === 'income') prevIncome += amt;
                else prevExpense += amt;
            }
        });

        const pct = (cur, prev) => {
            if (prev === 0) return cur > 0 ? 100 : 0;
            return Math.round(((cur - prev) / prev) * 100);
        };

        const incomeTrend = pct(curIncome, prevIncome);
        const expenseTrend = pct(curExpense, prevExpense);
        const curBalance = curIncome - curExpense;
        const prevBalance = prevIncome - prevExpense;
        const balanceTrend = prevBalance === 0
            ? (curBalance > 0 ? 100 : curBalance < 0 ? -100 : 0)
            : Math.round(((curBalance - prevBalance) / Math.abs(prevBalance)) * 100);

        return { incomeTrend, expenseTrend, balanceTrend };
    }, [transactions]);

    // Metas dinâmicas (persistidas em localStorage)
    const goals = useMemo(() => {
        const stored = localStorage.getItem('sf_goals');
        if (stored) {
            try { return JSON.parse(stored); } catch { /* ignore */ }
        }
        const defaults = [
            { id: 1, name: t('vacation') || 'Viagem', target: 5000, current: 2500, color: 'bg-blue-500' },
            { id: 2, name: t('emergency_fund') || 'Segurança', target: 10000, current: 1200, color: 'bg-brand-500' },
        ];
        return defaults;
    }, [t]);

    // NetWorth Calculado (Puxando de accounts + invest + carts)
    const netWorth = useMemo(() => {
        const accounts = JSON.parse(localStorage.getItem('sf_bank_accounts') || '[]');
        const brokers = JSON.parse(localStorage.getItem('sf_connected_brokers') || '[]');
        const cards = JSON.parse(localStorage.getItem('sf_credit_cards') || '[]');

        const totalAccounts = accounts.reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
        const totalInvestments = brokers.reduce((s, b) => s + (b.totalValue || 0), 0);
        const totalCardDebt = cards.reduce((s, c) => s + (c.used || 0), 0);

        const assets = totalAccounts + totalInvestments + Math.max(summary.balance, 0);
        const liabilities = totalCardDebt;
        return assets - liabilities;
    }, [summary]);

    // Preparar dados para o gráfico principal histórico
    const dailyData = useMemo(() => {
        const g = {};
        const sorted = transactions.slice().sort((a, b) => a.date.localeCompare(b.date));

        sorted.forEach((tx) => {
            const dateObj = new Date(tx.date + 'T12:00:00');
            const dayKey = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            if (!g[dayKey]) g[dayKey] = { day: dayKey, receita: 0, despesa: 0, balance: 0 };

            if (tx.type === 'income') g[dayKey].receita += Math.abs(tx.amount);
            else g[dayKey].despesa += Math.abs(tx.amount);
        });

        // Running balance for historical view
        let runBal = 0;
        const vals = Object.values(g);
        vals.forEach(v => {
            runBal = runBal + v.receita - v.despesa;
            v.balance = runBal;
        });

        return vals.slice(-14);
    }, [transactions]);

    // Previsão Calculada
    const forecastData = useMemo(() => {
        if (!transactions.length) return [];
        return calculateCashflow(transactions, bills, summary.balance, 90);
    }, [transactions, bills, summary.balance]);

    const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                <p className="text-gray-400 animate-pulse">{t('loading_data')}</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-card !p-3 border border-gray-200 dark:border-white/10 !bg-white dark:!bg-surface-900/90 backdrop-blur-xl shadow-xl">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-2 font-bold">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-600 dark:text-gray-300 capitalize">{entry.name}:</span>
                            <span className="font-bold text-gray-900 dark:text-white">{fmt(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="py-8 space-y-8 animate-fade-in pb-24">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('overview')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Resumo Financeiro e Projeções</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {localStorage.getItem('sf_xray_latest') && (
                        <button
                            onClick={() => setShowXRay(true)}
                            className="glass-card !p-2 !rounded-xl !border-transparent !bg-emerald-500/10 hover:!bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 group transition-all"
                        >
                            <div className="text-right mr-1">
                                <p className="text-[10px] uppercase font-bold text-emerald-500/70">Health Score</p>
                                <p className="text-sm font-bold tracking-tight">
                                    {JSON.parse(localStorage.getItem('sf_xray_latest')).score}/100
                                </p>
                            </div>
                            <div className="p-1.5 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                                <Activity className="w-4 h-4" />
                            </div>
                        </button>
                    )}

                    <Link
                        to="/app/networth"
                        className="glass-card !p-2 !rounded-xl !border-transparent !bg-indigo-500/10 hover:!bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 group transition-all"
                    >
                        <div className="text-right mr-1">
                            <p className="text-[10px] uppercase font-bold text-indigo-500/70">{t('net_worth') || 'Patrimônio'}</p>
                            <p className="text-sm font-bold tracking-tight">{fmt(netWorth)}</p>
                        </div>
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                            <Landmark className="w-4 h-4" />
                        </div>
                    </Link>

                    <ProGate feature="aiInsights">
                        <Link
                            to="/app/advisor"
                            className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30 hover:border-brand-400 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all group shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                        >
                            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                            <span className="uppercase tracking-widest text-xs font-black">{t('ai_insights') || 'Insights de IA'}</span>
                        </Link>
                    </ProGate>
                </div>
            </div>

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <SummaryCard
                    title={t('total_balance')}
                    value={summary.balance}
                    type="balance"
                    icon={Wallet}
                    trend={trends.balanceTrend}
                />
                <SummaryCard
                    title="Receitas Mensais"
                    value={summary.totalIncome}
                    type="income"
                    icon={TrendingUp}
                    trend={trends.incomeTrend}
                />
                <SummaryCard
                    title="Despesas Mensais"
                    value={summary.totalExpenses}
                    type="expense"
                    icon={TrendingDown}
                    trend={trends.expenseTrend}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Dynamic Chart Section */}
                <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[400px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                {chartMode === 'history' ? <Activity className="w-5 h-5 text-brand-500" /> : <LineChartIcon className="w-5 h-5 text-indigo-500" />}
                                {chartMode === 'history' ? 'Fluxo Histórico (14d)' : 'Previsão de Saldo Mínimo (90d)'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {chartMode === 'history' ? t('income_vs_expenses') : 'Inteligência conectada a Contas, Assinaturas e Velocidade de Gastos'}
                            </p>
                        </div>
                        <div className="flex gap-1.5 bg-gray-100 dark:bg-black/20 p-1 rounded-xl w-min">
                            <button onClick={() => setChartMode('history')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${chartMode === 'history' ? 'bg-white dark:bg-surface-800 shadow shadow-black/5 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Passado</button>
                            <button onClick={() => setChartMode('forecast')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${chartMode === 'forecast' ? 'bg-indigo-500/20 text-indigo-500 shadow-[0_0_10px_-3px_rgba(99,102,241,0.2)]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Previsão</button>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0 animate-fade-in">
                        {chartMode === 'history' && dailyData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#39ff14" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                                    <XAxis dataKey="day" stroke={theme === 'dark' ? "#6b7280" : "#9ca3af"} fontSize={11} tickLine={false} axisLine={false} dy={10} minTickGap={10} />
                                    <YAxis stroke={theme === 'dark' ? "#6b7280" : "#9ca3af"} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="receita" stroke="#39ff14" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name={t('income')} />
                                    <Area type="monotone" dataKey="despesa" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name={t('expenses')} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}

                        {chartMode === 'forecast' && forecastData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                                    <XAxis dataKey="label" stroke={theme === 'dark' ? "#6b7280" : "#9ca3af"} fontSize={11} tickLine={false} axisLine={false} dy={10} minTickGap={30} />
                                    <YAxis stroke={theme === 'dark' ? "#6b7280" : "#9ca3af"} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorForecast)" name="Previsão de Saldo" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}

                        {(chartMode === 'history' && dailyData.length === 0) && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/[0.02]">
                                <Activity className="w-8 h-8 mb-2 opacity-50" />
                                <p>{t('no_transactions_yet')}</p>
                            </div>
                        )}

                        {(chartMode === 'forecast' && forecastData.length === 0) && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/[0.02]">
                                <LineChartIcon className="w-8 h-8 mb-2 opacity-50" />
                                <p>Previsão Indisponível (Histórico Insuficiente)</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Planning & Quick Actions */}
                <div className="space-y-6">
                    {/* Widget de Conciliação Inteligente */}
                    <SmartReconciliation />

                    {/* Objetivos / Planejamento Rápido */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-500" />
                                {t('planning') || 'Metas e Alvos'}
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {goals.map((goal) => (
                                <div key={goal.id} className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500 dark:text-gray-300 font-medium">{goal.name}</span>
                                        <span className="text-gray-900 dark:text-white font-bold">{fmt(goal.current)} / {fmt(goal.target)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-200 dark:bg-surface-700/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${goal.color} rounded-full transition-all duration-700 shadow-inner`}
                                            style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link to="/app/financial-health" className="w-full block mt-5 py-2.5 rounded-xl border border-dashed text-center border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 text-sm font-bold hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all">
                            Adequar Orçamentos
                        </Link>
                    </div>

                    {/* Quick Access List (Recent Transactions Mini) */}
                    <div className="glass-card p-0 overflow-hidden flex flex-col h-[200px]">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('last_transactions')}</h3>
                            <Link to="/app/transactions" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </Link>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-2">
                            {recentTransactions.length > 0 ? (
                                <div className="space-y-1">
                                    {recentTransactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-brand-100 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                                    {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                </div>
                                                <div className="max-w-[120px] truncate">
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{tx.description}</p>
                                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{categoryConfig[tx.category]?.label || t('general')}</p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-800 dark:text-gray-300'}`}>
                                                {tx.type === 'income' ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-xs text-gray-500 mt-10">{t('no_recent_transactions')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showXRay && (
                <XRayDiagnosis
                    onClose={() => setShowXRay(false)}
                    onComplete={() => setShowXRay(false)}
                />
            )}
        </div>
    );
}
