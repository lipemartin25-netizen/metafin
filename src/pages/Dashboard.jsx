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
import { secureStorage } from '../lib/secureStorage';
import { add, toCents, fromCents, formatBRL as fmt } from '../lib/financialMath';

const categoryConfig = categoriesData.categories;

// Componente de Card de Resumo (Estilo MetaFin Premium)
function SummaryCard({ title, value, type, icon: Icon, trend }) {
    let accentColor = 'from-emerald-400 to-cyan-500';
    let iconBg = 'bg-emerald-500/10 text-emerald-400';
    let glow = 'group-hover:shadow-emerald-500/20';

    if (type === 'expense') {
        accentColor = 'from-rose-500 to-pink-600';
        iconBg = 'bg-rose-500/10 text-rose-400';
        glow = 'group-hover:shadow-rose-500/20';
    } else if (type === 'balance') {
        accentColor = 'from-brand-400 to-brand-600';
        iconBg = 'bg-brand-500/10 text-brand-400';
        glow = 'group-hover:shadow-brand-500/20';
    }

    return (
        <div className={`meta-card group hover:translate-y-[-4px] transition-all duration-500 ${glow}`}>
            {/* Ambient Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${accentColor}`} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} border border-white/5 shadow-inner`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend !== null && trend !== undefined && (
                        <div className={`flex flex-col items-end`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest opacity-50 mb-1`}>Mensal</span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trend >= 0
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-rose-400 bg-rose-500/10'
                                }`}>
                                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                            </span>
                        </div>
                    )}
                </div>

                <h3 className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest mb-2">{title}</h3>
                <p className="text-3xl font-black text-white tracking-tighter mb-4">
                    {fmt(value)}
                </p>

                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${accentColor} transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
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
        const billsData = secureStorage.get('bills', []);
        setBills(billsData);

        // Check if X-Ray is needed (no score in secureStorage)
        const hasScore = secureStorage.get('xray_latest');
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

    // Metas dinâmicas (persistidas em secureStorage)
    const goals = useMemo(() => {
        const stored = secureStorage.get('goals');
        if (stored) return stored;

        const defaults = [
            { id: 1, name: t('vacation') || 'Viagem', target: 5000, current: 2500, color: 'bg-blue-500' },
            { id: 2, name: t('emergency_fund') || 'Segurança', target: 10000, current: 1200, color: 'bg-brand-500' },
        ];
        return defaults;
    }, [t]);

    // NetWorth Calculado (Puxando de accounts + invest + carts)
    const netWorth = useMemo(() => {
        const accounts = secureStorage.get('bank_accounts', []);
        const brokers = secureStorage.get('connected_brokers', []);
        const cards = secureStorage.get('credit_cards', []);

        const totalAccountsCents = accounts.reduce((s, a) => s + toCents(a.balance), 0);
        const totalInvestmentsCents = brokers.reduce((s, b) => s + toCents(b.totalValue), 0);
        const totalCardDebtCents = cards.reduce((s, c) => s + toCents(c.used), 0);

        const assets = add(fromCents(totalAccountsCents + totalInvestmentsCents), Math.max(summary.balance, 0));
        const liabilities = fromCents(totalCardDebtCents);
        return add(assets, -liabilities);
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
                    <h1 className="text-4xl font-black meta-gradient-text mb-2 py-1">
                        {t('overview')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 font-medium">
                        <Activity className="w-4 h-4 text-brand-500" />
                        <span>Sincronização de Dados • {new Date().toLocaleDateString()}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {secureStorage.get('xray_latest') && (
                        <button
                            onClick={() => setShowXRay(true)}
                            className="meta-glass !p-2 !rounded-2xl !bg-emerald-500/5 hover:!bg-emerald-500/10 text-emerald-400 flex items-center justify-center gap-2 group transition-all border-emerald-500/20"
                        >
                            <div className="text-right mr-1">
                                <p className="text-[10px] uppercase font-black text-emerald-500/50 leading-none">Health</p>
                                <p className="text-sm font-bold tracking-tight">
                                    {secureStorage.get('xray_latest').score}/100
                                </p>
                            </div>
                            <div className="p-2 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                <Activity className="w-4 h-4" />
                            </div>
                        </button>
                    )}

                    <Link
                        to="/app/networth"
                        className="meta-glass !p-2 !rounded-2xl !bg-brand-500/5 hover:!bg-brand-500/10 text-brand-400 flex items-center justify-center gap-2 group transition-all border-brand-500/20"
                    >
                        <div className="text-right mr-1">
                            <p className="text-[10px] uppercase font-black text-brand-500/50 leading-none">{t('net_worth') || 'Patrimônio'}</p>
                            <p className="text-sm font-bold tracking-tight">{fmt(netWorth)}</p>
                        </div>
                        <div className="p-2 bg-brand-500/20 rounded-xl group-hover:scale-110 transition-transform text-white">
                            <Landmark className="w-4 h-4" />
                        </div>
                    </Link>

                    <ProGate feature="aiInsights">
                        <Link
                            to="/app/advisor"
                            className="meta-btn-primary !px-5 !py-2.5 !rounded-2xl meta-glow-brand"
                        >
                            <Sparkles className="w-4 h-4 text-white animate-pulse" />
                            <span className="uppercase tracking-widest text-[10px] font-black">{t('ai_insights') || 'Insights IA'}</span>
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
                <div className="lg:col-span-2 meta-card p-6 flex flex-col h-[400px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                                {chartMode === 'history' ? <Activity className="w-5 h-5 text-emerald-400" /> : <LineChartIcon className="w-5 h-5 text-brand-400" />}
                                {chartMode === 'history' ? 'Fluxo de Caixa' : 'Projeção Patrimonial'}
                            </h3>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                                {chartMode === 'history' ? 'Últimos 14 dias de atividade' : 'Inteligência preditiva MetaFin'}
                            </p>
                        </div>
                        <div className="flex gap-1.5 bg-white/5 p-1 rounded-2xl w-min border border-white/5">
                            <button onClick={() => setChartMode('history')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${chartMode === 'history' ? 'bg-white text-surface-950 shadow-lg' : 'text-gray-500 hover:text-white'}`}>Passado</button>
                            <button onClick={() => setChartMode('forecast')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${chartMode === 'forecast' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-gray-500 hover:text-white'}`}>Futuro</button>
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
                    <div className="meta-card !p-0 overflow-hidden">
                        <SmartReconciliation />
                    </div>

                    {/* Objetivos / Planejamento Rápido */}
                    <div className="meta-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-brand-500" />
                                {t('planning') || 'Metas Proativas'}
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {goals.map((goal) => (
                                <div key={goal.id} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{goal.name}</span>
                                            <span className="text-sm font-bold text-white tracking-tight">{fmt(goal.current)}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                                            {Math.round((goal.current / goal.target) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div
                                            className={`h-full ${goal.color.replace('bg-', 'bg-gradient-to-r from-')} to-white/20 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                                            style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link to="/app/goals" className="w-full block mt-8 py-3 rounded-2xl border border-white/5 text-center bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 hover:border-white/10 transition-all">
                            Gerenciar Todas as Metas
                        </Link>
                    </div>

                    {/* Quick Access List (Recent Transactions Mini) */}
                    <div className="meta-card p-0 overflow-hidden flex flex-col h-[280px]">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('last_transactions')}</h3>
                            <Link to="/app/transactions" className="p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <ChevronRight className="w-4 h-4 text-brand-500" />
                            </Link>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-3">
                            {recentTransactions.length > 0 ? (
                                <div className="space-y-2">
                                    {recentTransactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                                    {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                                </div>
                                                <div className="max-w-[130px] truncate">
                                                    <p className="text-sm font-bold text-white truncate transition-colors">{tx.description}</p>
                                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black">{categoryConfig[tx.category]?.label || t('general')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                                    {tx.type === 'income' ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                                                </p>
                                                <p className="text-[9px] text-gray-600 font-bold">{new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                                    <Activity className="w-8 h-8 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{t('no_recent_transactions')}</p>
                                </div>
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
