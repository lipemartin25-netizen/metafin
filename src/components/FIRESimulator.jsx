// src/components/FIRESimulator.jsx

import { useState, useMemo } from 'react';
import { calculateFIRE } from '../lib/fireCalculator';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
    Flame, Target, TrendingUp, Zap,
    DollarSign, Calendar
} from 'lucide-react';

const formatCurrency = (v) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL', maximumFractionDigits: 0
    }).format(v);

export default function FIRESimulator({ financialData }) {
    const [params, setParams] = useState({
        monthlyIncome: financialData?.income || 8000,
        monthlyExpenses: Math.abs(financialData?.expenses) || 5200,
        currentInvestments: financialData?.investments || 50000,
        annualReturn: 10,
        inflationRate: 4.5,
        withdrawalRate: 4
    });

    const result = useMemo(() => {
        try {
            return calculateFIRE({
                ...params,
                annualReturn: params.annualReturn / 100,
                inflationRate: params.inflationRate / 100,
                withdrawalRate: params.withdrawalRate / 100
            });
        } catch (e) {
            return { error: true, message: e.message };
        }
    }, [params]);

    const handleChange = (field, value) => {
        setParams(prev => ({ ...prev, [field]: Number(value) || 0 }));
    };

    if (result.error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 
        dark:border-red-800 dark:bg-red-950/30 p-6">
                <p className="text-red-600 dark:text-red-400">{result.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Inputs */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 
        bg-gray-50/50 dark:bg-black/20 p-6 glass-card">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <DollarSign className="h-5 w-5 text-orange-500" /> Seus Dados Financeiros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { key: 'monthlyIncome', label: 'Renda Mensal', icon: '💰', prefix: 'R$' },
                        { key: 'monthlyExpenses', label: 'Despesas Mensais', icon: '💸', prefix: 'R$' },
                        { key: 'currentInvestments', label: 'Patrimônio Investido', icon: '📈', prefix: 'R$' },
                        { key: 'annualReturn', label: 'Rentabilidade (a.a.)', icon: '📊', suffix: '%' },
                        { key: 'inflationRate', label: 'Inflação (IPCA)', icon: '🔥', suffix: '%' },
                        { key: 'withdrawalRate', label: 'Taxa de Retirada', icon: '🏖️', suffix: '%' }
                    ].map(field => (
                        <div key={field.key}>
                            <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 
                mb-1 flex items-center gap-1">
                                <span className="text-sm">{field.icon}</span> {field.label}
                            </label>
                            <div className="relative">
                                {field.prefix && (
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 
                    text-sm text-gray-400 font-bold">{field.prefix}</span>
                                )}
                                <input
                                    type="number"
                                    value={params[field.key]}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className={`w-full rounded-xl border border-gray-200 dark:border-white/10 
                    bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white p-2.5 text-sm font-bold outline-none
                    focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm
                    ${field.prefix ? 'pl-9' : ''} ${field.suffix ? 'pr-8' : ''}`}
                                />
                                {field.suffix && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 
                    text-sm text-gray-400 font-bold">{field.suffix}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hero Card - Resultado Principal 3D Premium */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br 
        from-orange-500 via-red-500 to-pink-600 p-8 md:p-12 text-white shadow-[0_20px_50px_-15px_rgba(249,115,22,0.4)] group border border-white/10 perspective-1000">
                {/* Efeitos 3D Internos */}
                <div className="absolute inset-x-0 -bottom-20 h-64 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full mix-blend-overlay filter blur-[40px] opacity-60 group-hover:scale-125 transition-transform duration-1000 ease-out" />
                <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-400/20 rounded-full mix-blend-color-dodge filter blur-[40px] opacity-60 group-hover:-translate-y-10 transition-transform duration-1000 ease-out delay-100" />
                <Flame className="absolute -right-8 top-0 h-64 w-64 opacity-20 filter blur-2xl group-hover:hidden transition-all duration-1000" />

                <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 mb-8 relative z-10 tracking-tight">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-inner">
                        <Flame className="h-6 w-6 text-yellow-300 animate-pulse" />
                    </div>
                    Sua Independência Financeira
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10 relative z-10">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-inner group-hover:-translate-y-1 transition-transform duration-300">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-2">Meta FIRE</p>
                        <p className="text-xl md:text-3xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] tracking-tight">
                            {formatCurrency(result.fireNumber)}
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-inner group-hover:-translate-y-1 transition-transform duration-300 delay-75">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-2">Progresso</p>
                        <p className="text-xl md:text-3xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] tracking-tight">{result.progress}%</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-inner group-hover:-translate-y-1 transition-transform duration-300 delay-100">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-2">Tempo Restante</p>
                        <p className="text-xl md:text-3xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] tracking-tight">
                            {result.totalYears}a <span className="text-lg md:text-xl text-white/80">{result.totalMonthsRemainder}m</span>
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-inner group-hover:-translate-y-1 transition-transform duration-300 delay-150 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent mix-blend-overlay" />
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-2 relative z-10">Previsão Realidade</p>
                        <p className="text-lg md:text-2xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] capitalize truncate relative z-10">
                            {result.targetDateFormatted}
                        </p>
                    </div>
                </div>

                {/* Barra de progresso Master */}
                <div className="mb-6 relative z-10">
                    <div className="flex justify-between text-[11px] font-black opacity-90 mb-3 uppercase tracking-widest text-white/90">
                        <span>Hoje: <span className="text-white">{formatCurrency(result.currentInvestments)}</span></span>
                        <span>Meta FIRE: <span className="text-white">{formatCurrency(result.fireNumber)}</span></span>
                    </div>
                    <div className="h-6 w-full rounded-full bg-black/40 overflow-hidden shadow-inner border border-white/20 relative p-1">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-300 to-white transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(253,224,71,0.5)]"
                            style={{ width: `${Math.min(result.progress, 100)}%` }}
                        >
                            {/* Reflexo animado simulando vidro */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent rounded-full" />
                            <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-white/80 to-transparent rounded-full animate-[wiggle_2s_ease-in-out_infinite]" />
                        </div>
                    </div>
                </div>

                {/* Renda Passiva */}
                <div className="mt-8 flex items-center gap-4 text-sm font-medium bg-black/20 p-5 rounded-2xl border border-white/20 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] relative z-10 transform-gpu hover:scale-[1.01] transition-transform">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg border border-white/30">
                        <DollarSign className="h-6 w-6 text-white drop-shadow-md" />
                    </div>
                    <span className="leading-relaxed text-indigo-50/90 text-left text-base">
                        Sua renda passiva perpétua será: <strong className="text-xl mx-1 text-white drop-shadow-md">{formatCurrency(result.summary.passive_income_monthly)}/mês</strong>. Isso cobrirá exatamente {result.summary.years_of_freedom} anos de suas atuais despesas se você nunca mais trabalhar na vida!
                    </span>
                </div>
            </div>

            {/* Gráfico de Projeção */}
            <div className="rounded-3xl border border-gray-200 dark:border-white/10 glass-card p-6 shadow-sm">
                <h3 className="font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                    <TrendingUp className="h-5 w-5 text-orange-500" /> Projeção Patrimonial
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={result.projection} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis
                            dataKey="yearLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                            tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                            dx={-10}
                        />
                        <Tooltip
                            formatter={(v) => formatCurrency(v)}
                            labelFormatter={(v) => `Ano ${v}`}
                            contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                color: '#fff',
                                fontWeight: 600,
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ fontWeight: 700 }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 600 }} />
                        <ReferenceLine
                            y={result.fireNumber}
                            stroke="#f59e0b"
                            strokeDasharray="6 6"
                            strokeWidth={3}
                            label={{
                                value: `🔥 META: ${formatCurrency(result.fireNumber)}`,
                                fill: '#f59e0b',
                                fontSize: 14,
                                fontWeight: 900,
                                position: 'insideTopLeft'
                            }}
                        />
                        <Area
                            name="Total Investido"
                            type="monotone"
                            dataKey="investedTotal"
                            stroke="#6366f1"
                            fill="url(#colorInvested)"
                            strokeWidth={3}
                            activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Area
                            name="Patrimônio Projetado"
                            type="monotone"
                            dataKey="balance"
                            stroke="#f97316"
                            fill="url(#colorBalance)"
                            strokeWidth={4}
                            activeDot={{ r: 8, fill: '#f97316', stroke: '#fff', strokeWidth: 3 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cenários */}
                <div className="rounded-3xl border border-gray-200 dark:border-white/10 glass-card p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                        <Target className="h-5 w-5 text-blue-500" /> Cenários Estressados (a.a.)
                    </h3>
                    <div className="flex flex-col gap-3">
                        {result.scenarios.map(scenario => (
                            <div
                                key={scenario.name}
                                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] p-4 
                    hover:shadow-md transition-all flex items-center justify-between group"
                                style={{ borderLeftColor: scenario.color, borderLeftWidth: '5px' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gray-100 dark:bg-white/5 group-hover:scale-110 transition-transform">{scenario.emoji}</div>
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-white block">{scenario.name} <span className="text-xs font-normal text-gray-400">({Math.round(scenario.rate * 100)}%)</span></span>
                                        {scenario.reachable && (
                                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                                {scenario.targetDateFormatted}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-lg font-black" style={{ color: scenario.color }}>
                                        {scenario.reachable
                                            ? `${scenario.years}a ${scenario.monthsRemainder}m`
                                            : 'Inválido'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Milestones */}
                <div className="rounded-3xl border border-gray-200 dark:border-white/10 glass-card p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                        <Calendar className="h-5 w-5 text-emerald-500" /> Marcos do Caminho
                    </h3>
                    <div className="space-y-3">
                        {result.milestones.map(milestone => (
                            <div key={milestone.percentage}
                                className="flex items-center justify-between p-3 px-4 rounded-2xl 
                    bg-gray-100/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-full flex items-center 
                    justify-center text-sm font-black shadow-inner ${result.progress >= milestone.percentage
                                            ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-emerald-500/30'
                                            : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700'
                                        }`}>
                                        {milestone.percentage}%
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(milestone.targetBalance)}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                                            {milestone.dateFormatted}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
                                    {milestone.yearsToReach}a {milestone.monthsRemainder}m
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Impacto de poupar mais */}
            <div className="rounded-3xl border border-gray-200 dark:border-white/10 glass-card p-6 shadow-sm">
                <h3 className="font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Zap className="h-5 w-5 text-yellow-500" /> Turbo FIRE: E se Você Poupasse Mais?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.impactAnalysis.map(impact => (
                        <div
                            key={impact.extraPercentage}
                            className="relative overflow-hidden flex flex-col p-4 rounded-2xl 
                bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 hover:border-orange-500/50 hover:shadow-lg transition-all group"
                        >
                            <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-white/10 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                                        +{impact.extraPercentage}%
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                        Renda Extra
                                    </span>
                                </div>
                                <span className="font-black text-gray-900 dark:text-white text-lg">
                                    +{formatCurrency(impact.extraAmount)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Novo tempo estimado:</span>
                                <span className="font-black text-gray-700 dark:text-gray-300 text-xl">
                                    {impact.reachable
                                        ? `${impact.years}a ${impact.monthsRemainder}m`
                                        : 'N/A'}
                                </span>
                                {impact.yearsSaved > 0 && (
                                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md self-start">
                                        <Zap className="w-3 h-3" /> {impact.yearsSaved}a {impact.monthsSavedRemainder}m mais rápido!
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
