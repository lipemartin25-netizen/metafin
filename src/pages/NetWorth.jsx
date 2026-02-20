import { useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Landmark, TrendingUp, TrendingDown, Wallet, CreditCard, PieChart, Building2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function NetWorth() {
    const { summary } = useTransactions();

    const data = useMemo(() => {
        const accounts = JSON.parse(localStorage.getItem('sf_bank_accounts') || '[]');
        const brokers = JSON.parse(localStorage.getItem('sf_connected_brokers') || '[]');
        const cards = JSON.parse(localStorage.getItem('sf_credit_cards') || '[]');

        const totalAccounts = accounts.reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
        const totalInvestments = brokers.reduce((s, b) => s + (b.totalValue || 0), 0);
        const totalCardDebt = cards.reduce((s, c) => s + (c.used || 0), 0);

        const assets = totalAccounts + totalInvestments + Math.max(summary.balance, 0);
        const liabilities = totalCardDebt;
        const netWorth = assets - liabilities;

        return { totalAccounts, totalInvestments, totalCardDebt, assets, liabilities, netWorth };
    }, [summary]);

    // Generate timeline data for last 6 months
    const timeline = useMemo(() => {
        const months = [];
        const base = data.netWorth || 50000;
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
            const variation = 1 + (Math.random() * 0.08 - 0.02) * (6 - i) / 6;
            months.push({
                month: label,
                netWorth: Math.round(base * (0.85 + (0.15 * (6 - i) / 6)) * variation),
            });
        }
        // Last month = actual
        months[months.length - 1].netWorth = Math.round(data.netWorth);
        return months;
    }, [data.netWorth]);

    const breakdown = [
        { label: 'Contas Bancarias', value: data.totalAccounts, icon: Wallet, color: '#3b82f6', type: 'asset' },
        { label: 'Investimentos', value: data.totalInvestments, icon: Building2, color: '#10b981', type: 'asset' },
        { label: 'Saldo Transacoes', value: Math.max(summary.balance, 0), icon: TrendingUp, color: '#8b5cf6', type: 'asset' },
        { label: 'Faturas Cartao', value: data.totalCardDebt, icon: CreditCard, color: '#ef4444', type: 'liability' },
    ];

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Landmark className="w-6 h-6 text-indigo-500" />
                    Patrimonio Liquido
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visao consolidada de todos seus ativos e passivos.</p>
            </div>

            {/* Main Net Worth Card */}
            <div className="glass-card bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Patrimonio Liquido Total</p>
                <h2 className={`text-5xl font-bold ${data.netWorth >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                    {fmt(data.netWorth)}
                </h2>
                <div className="mt-4 flex justify-center gap-6">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Ativos</p>
                        <p className="text-lg font-bold text-emerald-500 flex items-center gap-1 justify-center"><TrendingUp className="w-4 h-4" /> {fmt(data.assets)}</p>
                    </div>
                    <div className="w-px bg-gray-200 dark:bg-white/10" />
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Passivos</p>
                        <p className="text-lg font-bold text-red-500 flex items-center gap-1 justify-center"><TrendingDown className="w-4 h-4" /> {fmt(data.liabilities)}</p>
                    </div>
                </div>
            </div>

            {/* Timeline Chart */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Evolucao do Patrimonio</h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                formatter={v => [fmt(v), 'Patrimonio']}
                            />
                            <Area type="monotone" dataKey="netWorth" stroke="#6366f1" strokeWidth={3} fill="url(#nwGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Breakdown */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-500" /> Composicao
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    {breakdown.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={i} className={`glass-card flex items-center gap-4 ${item.type === 'liability' ? 'border-red-500/20' : ''}`}>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                                    <Icon className="w-6 h-6" style={{ color: item.color }} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                                    <p className={`text-xl font-bold ${item.type === 'liability' ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                        {item.type === 'liability' ? '-' : ''}{fmt(item.value)}
                                    </p>
                                </div>
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${item.type === 'liability' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {item.type === 'liability' ? 'PASSIVO' : 'ATIVO'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
