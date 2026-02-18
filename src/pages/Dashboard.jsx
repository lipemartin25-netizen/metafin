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
    Sparkles,
    CreditCard,
    DollarSign,
    Activity,
    Calendar,
    ChevronRight,
    Target
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import categoriesData from '../data/data.json';
import { analytics } from '../hooks/useAnalytics';
import { useLanguage } from '../contexts/LanguageContext';
import ProGate from '../components/ProGate';

const categoryConfig = categoriesData.categories;

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Componente de Card de Resumo (Estilo Mobills)
function SummaryCard({ title, value, type, icon: Icon, trend }) {
    const isPositive = type === 'income' || type === 'balance';

    let gradient = "from-brand-500 to-brand-600";
    let iconColor = "text-brand-400";
    let bgColor = "bg-brand-500/10";

    if (type === 'expense') {
        gradient = "from-red-500 to-red-600";
        iconColor = "text-red-400";
        bgColor = "bg-red-500/10";
    } else if (type === 'balance') {
        gradient = "from-blue-500 to-blue-600";
        iconColor = "text-blue-400";
        bgColor = "bg-blue-500/10";
    }

    return (
        <div className="glass-card relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
            {/* Background Glow Effect */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${bgColor}`} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${bgColor} border border-white/5`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    {trend && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${trend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                            }`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                </div>

                <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-white tracking-tight">{fmt(value)}</p>

                {/* Mini Sparkline Visualization (CSS only for simplicity) */}
                <div className="mt-4 h-1.5 w-full bg-surface-700/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${gradient} opacity-80`}
                        style={{ width: '65%' }} // Placeholder width
                    />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { t } = useLanguage();
    const { transactions, loading, summary } = useTransactions();

    useEffect(() => { analytics.dashboardViewed(); }, []);

    // Preparar dados para o gráfico principal
    const dailyData = useMemo(() => {
        const g = {};
        // Ordenar transações por data
        const sorted = transactions.slice().sort((a, b) => a.date.localeCompare(b.date));

        // Agrupar por dia
        sorted.forEach((t) => {
            const dateObj = new Date(t.date + 'T12:00:00');
            const dayKey = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            if (!g[dayKey]) g[dayKey] = { day: dayKey, receita: 0, despesa: 0, saldo: 0 };

            if (t.type === 'income') g[dayKey].receita += Math.abs(t.amount);
            else g[dayKey].despesa += Math.abs(t.amount);
        });

        // Converter para array e limitar aos últimos 14 dias para melhor visualização
        return Object.values(g).slice(-14);
    }, [transactions]);

    const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                <p className="text-gray-400 animate-pulse">Carregando seus dados...</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-card !p-3 border border-white/10 !bg-surface-900/90 backdrop-blur-xl">
                    <p className="text-gray-400 text-xs mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-300 capitalize">{entry.name}:</span>
                            <span className="font-semibold text-white">{fmt(entry.value)}</span>
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
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Visão Geral
                    </h1>
                    <p className="text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Resumo financeiro do mês</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <ProGate feature="aiInsights">
                        <Link
                            to="/app/advisor"
                            className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all group"
                        >
                            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            Insights IA
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
                    trend={12} // Mock trend for premium feel
                />
                <SummaryCard
                    title={t('income')}
                    value={summary.totalIncome}
                    type="income"
                    icon={TrendingUp}
                    trend={8}
                />
                <SummaryCard
                    title={t('expenses')}
                    value={summary.totalExpenses}
                    type="expense"
                    icon={TrendingDown}
                    trend={-5}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart Section */}
                <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-brand-400" />
                                Fluxo de Caixa
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Receitas vs Despesas (Últimos 14 dias)</p>
                        </div>
                        <select className="bg-surface-800 text-xs text-gray-300 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-brand-500/50">
                            <option>Últimos 14 dias</option>
                            <option>Este Mês</option>
                        </select>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        {dailyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="day"
                                        stroke="#6b7280"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `R$${v / 1000}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="receita"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorIncome)"
                                        name={t('income')}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="despesa"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorExpense)"
                                        name={t('expenses')}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                                <Activity className="w-8 h-8 mb-2 opacity-50" />
                                <p>{t('no_transactions_yet')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Planning & Quick Actions */}
                <div className="space-y-6">
                    {/* Objetivos / Planejamento Rápido */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-400" />
                                Planejamento
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-300">Viagem de Férias</span>
                                    <span className="text-white font-medium">R$ 2.500 / 5.000</span>
                                </div>
                                <div className="h-2 w-full bg-surface-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-1/2 rounded-full" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-300">Reserva de Emergência</span>
                                    <span className="text-white font-medium">R$ 1.200 / 10.000</span>
                                </div>
                                <div className="h-2 w-full bg-surface-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-500 w-[12%] rounded-full" />
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-5 py-2.5 rounded-xl border border-dashed border-white/20 text-gray-400 text-sm hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                            + Novo Objetivo
                        </button>
                    </div>

                    {/* Quick Access List (Recent Transaction Mini) */}
                    <div className="glass-card p-0 overflow-hidden flex flex-col h-[200px]">
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-sm font-semibold text-white">Últimas Transações</h3>
                            <Link to="/app/transactions" className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </Link>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-2">
                            {recentTransactions.length > 0 ? (
                                <div className="space-y-1">
                                    {recentTransactions.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-brand-500/10 text-brand-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                </div>
                                                <div className="max-w-[100px] truncate">
                                                    <p className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">{t.description}</p>
                                                    <p className="text-[10px] text-gray-500">{categoryConfig[t.category]?.label || 'Geral'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-medium ${t.type === 'income' ? 'text-brand-400' : 'text-gray-300'}`}>
                                                {t.type === 'income' ? '+' : '-'}{fmt(Math.abs(t.amount))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-xs text-gray-500 mt-10">Nenhuma transação recente</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
