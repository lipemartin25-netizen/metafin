// src/components/InvestmentSimulator.jsx

import { useState, useMemo, useEffect } from 'react';
import { compareAllInvestments } from '../lib/investmentSimulator';
import { getAnnualRates } from '../lib/marketData';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, Trophy, AlertTriangle, DollarSign, Clock, Coins } from 'lucide-react';

const formatCurrency = (v) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL', maximumFractionDigits: 2
    }).format(v);

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function InvestmentSimulator({ financialData }) {
    const [params, setParams] = useState({
        initialAmount: financialData?.investments || 5000,
        monthlyContribution: 1000,
        months: 24,
        cdi: 0.1065,
        ipca: 0.045
    });

    useEffect(() => {
        const loadRates = async () => {
            const rates = await getAnnualRates();
            setParams(p => ({ ...p, cdi: rates.cdi, ipca: rates.ipca }));
        };
        loadRates();
    }, []);

    const results = useMemo(() => {
        try {
            return compareAllInvestments(params);
        } catch {
            return [];
        }
    }, [params]);

    const handleChange = (field, value) => {
        setParams(prev => ({ ...prev, [field]: Number(value) || 0 }));
    };

    const bestResult = results[0];
    const worstResult = results[results.length - 1];
    const difference = bestResult && worstResult
        ? bestResult.netBalance - worstResult.netBalance
        : 0;

    // Dados para gráfico de barras (comparativo)
    const barData = results.map((r, i) => ({
        name: r.name,
        netProfit: r.netProfit,
        irAmount: r.totalTaxes,
        netBalance: r.netBalance,
        color: COLORS[i % COLORS.length]
    }));

    // Dados para gráfico de linhas (evolução)
    const lineData = [];
    if (results.length > 0) {
        const maxProjection = results.reduce(
            (max, r) => Math.max(max, r.projection.length), 0
        );
        for (let i = 0; i < maxProjection; i++) {
            // Find the index of the first projection point
            const monthPoint = results[0]?.projection[i]?.month;
            if (monthPoint !== undefined) {
                const point = { month: monthPoint };
                results.forEach(r => {
                    if (r.projection[i]) {
                        point[r.name] = r.projection[i].netBalance;
                    }
                });
                lineData.push(point);
            }
        }
    }

    const periodOptions = [
        { label: '6 meses', value: 6 },
        { label: '1 ano', value: 12 },
        { label: '2 anos', value: 24 },
        { label: '3 anos', value: 36 },
        { label: '5 anos', value: 60 },
        { label: '10 anos', value: 120 },
        { label: '20 anos', value: 240 }
    ];

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden flex flex-col items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-brand-primary via-teal-600 to-fuchsia-700 p-10 md:p-14 text-white shadow-[0_20px_50px_-15px_rgba(16,185,129,0.4)] border border-white/20 text-center group perspective-1000">
                {/* Efeitos 3D Internos */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PG1hdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')] opacity-30" />
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-gray-800/40/10 rounded-full mix-blend-overlay filter blur-[40px] opacity-60 group-hover:scale-125 transition-transform duration-1000 ease-out" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full mix-blend-color-dodge filter blur-[40px] opacity-60 group-hover:-translate-x-10 transition-transform duration-1000 ease-out delay-100" />

                <div className="relative z-10 p-5 bg-gray-800/40/10 rounded-[2rem] backdrop-blur-md shadow-inner border border-white/20 mb-6 group-hover:-translate-y-2 group-hover:rotate-3 transition-transform duration-500">
                    <Coins className="w-16 h-16 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)] animate-bounce-slow" />
                </div>

                <h2 className="text-4xl md:text-5xl font-black mb-4 relative z-10 tracking-tight drop-shadow-lg scale-100 group-hover:scale-[1.02] transition-transform duration-500">
                    O Teste Ácido dos Investimentos
                </h2>
                <p className="text-purple-50 text-base md:text-lg font-medium max-w-2xl relative z-10 leading-relaxed backdrop-blur-sm px-4">
                    Compare como o seu dinheiro realmente rende na Poupança vs. Tesouros vs. CDBs. <br />
                    <strong className="text-white">Imposto de Renda, IOF e taxas B3 da realidade descontados ao vivo.</strong>
                </p>

                {/* Laser scan line decorative effect */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent top-0 opacity-0 group-hover:opacity-100 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(103,232,249,0.8)]" />
            </div>

            {/* Inputs */}
            <div className={`rounded - 3xl border border - gray - 700 / 40 dark: border - white / 10 \${ tw.card } p - 6 shadow - lg shadow - black / 10`}>
                <h3 className="font-bold mb-6 flex items-center gap-2 text-white dark:text-white">
                    <DollarSign className="h-5 w-5 text-brand-primary" /> Parâmetros da Simulação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 
               block mb-2">
                            Valor Inicial
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 
                text-sm text-gray-400 font-bold">R$</span>
                            <input
                                type="number"
                                value={params.initialAmount}
                                onChange={e => handleChange('initialAmount', e.target.value)}
                                className="w-full rounded-2xl border border-gray-700/40 dark:border-white/10 
                  bg-gray-800/40 dark:bg-black/20 text-white dark:text-white p-3 pl-10 text-sm font-bold shadow-lg shadow-black/10 outline-none
                  focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 
               block mb-2">
                            Aporte Mensal
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 
                text-sm text-gray-400 font-bold">R$</span>
                            <input
                                type="number"
                                value={params.monthlyContribution}
                                onChange={e => handleChange('monthlyContribution', e.target.value)}
                                className="w-full rounded-2xl border border-gray-700/40 dark:border-white/10 
                  bg-gray-800/40 dark:bg-black/20 text-white dark:text-white p-3 pl-10 text-sm font-bold shadow-lg shadow-black/10 outline-none
                  focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 
               block mb-2">
                            Período
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {periodOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleChange('months', opt.value)}
                                    className={`px - 4 py - 2 rounded - xl text - xs font - bold uppercase tracking - wider
transition - all border ${params.months === opt.value
                                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 border-brand-primary scale-105'
                                            : 'bg-gray-800/40 dark:bg-gray-800/40/5 text-gray-600 dark:text-gray-300 border-gray-700/40 dark:border-white/10 hover:border-brand-primary/50 hover:text-brand-primary'
                                        } `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner do melhor investimento */}
            {bestResult && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br 
          from-brand-primary to-teal-700 p-8 text-white shadow-xl shadow-brand-primary/20 group">
                    <Trophy className="absolute -right-8 -top-8 h-48 w-48 opacity-10 group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-2xl" />
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-3 bg-gray-800/40/20 rounded-2xl backdrop-blur-md shadow-inner">
                            <Trophy className="h-6 w-6 text-yellow-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Melhor Opção</h3>
                            <p className="text-sm font-medium text-purple-100">{bestResult.name}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 relative z-10">
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Saldo Final</p>
                            <p className="text-lg md:text-xl font-black">{formatCurrency(bestResult.netBalance)}</p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Lucro Líquido</p>
                            <p className="text-lg md:text-xl font-black text-purple-300">+{formatCurrency(bestResult.netProfit)}</p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Rentab. Líquida</p>
                            <p className="text-lg md:text-xl font-black">{bestResult.netAnnualReturn}% a.a.</p>
                        </div>
                        <div className="bg-gray-800/40/90 text-brand-dark backdrop-blur-md rounded-2xl p-4 border border-purple-200">
                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Diferença vs Pior</p>
                            <p className="text-lg md:text-xl font-black">+{formatCurrency(difference)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Gráfico comparativo (barras) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`rounded - 3xl border border - gray - 700 / 40 dark: border - white / 10 \${ tw.card } p - 6 shadow - lg shadow - black / 10`}>
                    <h3 className="font-bold mb-6 flex items-center gap-2 text-white dark:text-white">
                        <TrendingUp className="h-5 w-5 text-brand-primary" /> Lucro Líquido por Investimento
                    </h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ left: -15 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                                <XAxis
                                    type="number"
                                    tickFormatter={v => `R$ ${(v / 1000).toFixed(0)} k`}
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={130}
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(v) => formatCurrency(v)}
                                    contentStyle={{
                                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        color: '#fff',
                                        fontWeight: 600,
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                    }}
                                    itemStyle={{ fontWeight: 700 }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="netProfit" name="Lucro Líquido" radius={[0, 8, 8, 0]}>
                                    {barData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de evolução (linhas) */}
                <div className={`rounded - 3xl border border - gray - 700 / 40 dark: border - white / 10 \${ tw.card } p - 6 shadow - lg shadow - black / 10`}>
                    <h3 className="font-bold mb-6 flex items-center gap-2 text-white dark:text-white">
                        <Clock className="h-5 w-5 text-blue-500" /> Evolução ao Longo do Tempo
                    </h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ left: -15, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={v => `${v} m`}
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tickFormatter={v => `R$ ${(v / 1000).toFixed(0)} k`}
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    formatter={(v) => formatCurrency(v)}
                                    labelFormatter={(v) => `Mês ${v} `}
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
                                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '15px' }} />
                                {results.map((r, i) => (
                                    <Line
                                        key={r.name}
                                        name={r.name}
                                        dataKey={r.name}
                                        stroke={COLORS[i % COLORS.length]}
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Tabela detalhada */}
            <div className={`rounded - 3xl border border - gray - 700 / 40 dark: border - white / 10 \${ tw.card } p - 6 shadow - lg shadow - black / 10 overflow - hidden`}>
                <h3 className="font-bold mb-6 flex items-center gap-2 text-white dark:text-white">
                    <AlertTriangle className="h-5 w-5 text-brand-primary" /> Comparativo Detalhado (Risco vs Retorno)
                </h3>
                <div className="overflow-x-auto custom-scrollbar pb-2">
                    <table className="w-full text-sm table-premium">
                        <thead>
                            <tr className="border-b border-gray-700/40 dark:border-white/10">
                                <th className="text-left py-3 px-3 uppercase text-[10px] tracking-widest text-gray-500 font-bold">Investimento</th>
                                <th className="text-right py-3 px-3 uppercase text-[10px] tracking-widest text-gray-500 font-bold">Investido</th>
                                <th className="text-right py-3 px-3 uppercase text-[10px] tracking-widest text-gray-500 font-bold">Bruto</th>
                                <th className="text-right py-3 px-3 uppercase text-[10px] tracking-widest text-red-500/80 font-bold hover:text-red-500 cursor-help" title="Imposto de Renda + IOF + Taxa B3">IR + Custos</th>
                                <th className="text-right py-3 px-3 uppercase text-[10px] tracking-widest text-gray-500 font-bold">Líquido Final</th>
                                <th className="text-right py-3 px-3 uppercase text-[10px] tracking-widest text-brand-primary/80 font-bold">Lucro Líquido</th>
                                <th className="text-right py-3 px-3 uppercase text-[10px] tracking-widest text-gray-500 font-bold">Rent. a.a.</th>
                                <th className="text-center py-3 px-3 uppercase text-[10px] tracking-widest text-gray-500 font-bold">Risco</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={r.type}
                                    className={`border - b border - gray - 100 dark: border - white / 5 transition - colors hover: bg - gray - 800 / 30 / 50 dark: hover: bg - gray - 800 / 40 / [0.02]
                    ${i === 0 ? 'bg-purple-50/50 dark:bg-brand-primary/10' : ''} `}>
                                    <td className="py-4 px-3 dark:text-white font-bold flex items-center gap-2 whitespace-nowrap">
                                        <span className="text-xl">{r.icon}</span> {r.name}
                                        {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-brand-dark dark:bg-brand-primary/30 dark:text-purple-300 ml-2">🏆 #1</span>}
                                    </td>
                                    <td className="text-right py-4 px-3 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                                        {formatCurrency(r.totalInvested)}
                                    </td>
                                    <td className="text-right py-4 px-3 dark:text-gray-300 font-medium whitespace-nowrap">
                                        {formatCurrency(r.grossBalance)}
                                    </td>
                                    <td className="text-right py-4 px-3 text-red-500 font-bold bg-red-50/30 dark:bg-red-500/5 whitespace-nowrap">
                                        -{formatCurrency(r.totalTaxes)}
                                    </td>
                                    <td className="text-right py-4 px-3 font-black dark:text-white whitespace-nowrap">
                                        {formatCurrency(r.netBalance)}
                                    </td>
                                    <td className="text-right py-4 px-3 font-black text-brand-primary dark:text-brand-glow bg-purple-50/30 dark:bg-brand-primary/5 whitespace-nowrap">
                                        +{formatCurrency(r.netProfit)}
                                    </td>
                                    <td className="text-right py-4 px-3 font-bold text-gray-300 dark:text-gray-300 whitespace-nowrap">
                                        {r.netAnnualReturn}%
                                    </td>
                                    <td className="text-center py-4 px-3 whitespace-nowrap">
                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border"
                                            style={{
                                                backgroundColor: `${r.riskColor} 20`,
                                                color: r.riskColor,
                                                borderColor: `${r.riskColor} 50`
                                            }}>
                                            {r.riskLevel}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
