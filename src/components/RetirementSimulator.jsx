import { tw } from '@/lib/theme';
import { useState, useMemo } from 'react';
import { simulateRetirement } from '../lib/retirementSimulator';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { Calendar, Umbrella, Coins, HeartPulse } from 'lucide-react';

export default function RetirementSimulator({ financialData }) {
    const [params, setParams] = useState({
        currentAge: 30,
        retiredAge: 65,
        lifeExpectancy: 85,
        monthlyIncome: financialData?.income || 8000,
        desiredRetirementIncome: 10000,
        currentInvestments: financialData?.investments || 85000,
        inssContribution: true,
        inssBenefit: 3500,
        annualReturn: 0.10,
        inflationRate: 0.045
    });

    const result = useMemo(() => {
        const sim = simulateRetirement({
            currentAge: params.currentAge,
            retirementAge: params.retiredAge,
            lifeExpectancy: params.lifeExpectancy,
            monthlyGrossIncome: params.monthlyIncome,
            desiredRetirementIncome: params.desiredRetirementIncome,
            currentInvestments: params.currentInvestments,
            annualReturn: params.annualReturn,
            inflationRate: params.inflationRate,
            monthlyInvestment: params.monthlyInvestment || 0
        });
        return {
            requiredPortfolio: sim.requiredPortfolio,
            monthlyContribution: sim.requiredMonthlyInvestment,
            isSustainable: sim.isSustainable,
            sustainableYears: sim.sustainableYears,
            projection: sim.projection,
            diagnosis: Array.isArray(sim.diagnosis) ? sim.diagnosis.map(d => d.text).join(' ') : sim.diagnosis
        };
    }, [params]);

    const formatCurrency = (v) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency', currency: 'BRL',
            maximumFractionDigits: 0
        }).format(v);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-fuchsia-700 p-8 md:p-12 text-white shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] group border border-white/20 perspective-1000">
                {/* Efeitos 3D Internos */}
                <div className="absolute inset-x-0 -bottom-20 h-64 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-gray-800/40/10 rounded-full mix-blend-overlay filter blur-[40px] opacity-60 group-hover:scale-125 transition-transform duration-1000 ease-out" />
                <div className="absolute top-10 right-10 w-40 h-40 bg-cyan-400/20 rounded-full mix-blend-color-dodge filter blur-[40px] opacity-60 group-hover:-translate-y-10 transition-transform duration-1000 ease-out delay-100" />
                <Umbrella className="absolute -right-10 -top-10 h-64 w-64 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-1000 blur-xl" />

                <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3 relative z-10 mb-8 tracking-tight">
                    <div className="p-2 bg-gray-800/40/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-inner group-hover:rotate-12 transition-transform duration-300">
                        <Calendar className="h-7 w-7 text-indigo-200 drop-shadow-lg shadow-black/10" />
                    </div>
                    Simulador de Aposentadoria Segura
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 relative z-10">
                    <div className="bg-gray-800/40/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-inner group-hover:-translate-y-1 transition-transform duration-300">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-2">Reserva Desejada</p>
                        <p className="text-xl md:text-3xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] tracking-tight">
                            {formatCurrency(result.requiredPortfolio)}
                        </p>
                    </div>
                    <div className="bg-gray-800/40/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-inner group-hover:-translate-y-1 transition-transform duration-300 delay-75">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-2">Aporte Necessário</p>
                        <p className="text-xl md:text-3xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] text-yellow-300 tracking-tight">
                            {formatCurrency(result.monthlyContribution)}
                            <span className="text-xs md:text-sm font-medium ml-1 text-white/70">/mês</span>
                        </p>
                    </div>
                    <div className="bg-gray-800/40/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-inner group-hover:-translate-y-1 transition-transform duration-300 delay-100">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-2">Renda Vitalícia</p>
                        <p className="text-xl md:text-3xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] tracking-tight">
                            {formatCurrency(params.desiredRetirementIncome)}
                        </p>
                    </div>
                    <div className="lg:col-span-2 bg-black/20 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.2)] group-hover:-translate-y-1 transition-transform duration-300 delay-150">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mb-2 text-indigo-200">Status do Plano</p>
                        <p className={`text-lg md:text-xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] mt-1 flex items-center gap-2 ${result.isSustainable ? 'text-purple-300' : 'text-red-300'}`}>
                            {result.isSustainable ? (
                                <>
                                    <span className="h-3 w-3 rounded-full bg-brand-glow animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                    Seguro e Sustentável
                                </>
                            ) : (
                                <>
                                    <span className="h-3 w-3 rounded-full bg-red-400 animate-pulse shadow-[0_0_10px_rgba(248,113,113,0.8)]" />
                                    Insuficiente (Dura apenas {result.sustainableYears} anos)
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`\${tw.card} p-5 space-y-4`}>
                    <h3 className="font-bold text-white dark:text-white flex items-center gap-2 mb-4">
                        Configurações Base
                    </h3>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Idade Atual</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-800/30 dark:bg-black/20 border border-gray-700/40 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-white dark:text-white outline-none focus:border-indigo-500"
                                    value={params.currentAge}
                                    onChange={(e) => setParams({ ...params, currentAge: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Idade Aposento</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-800/30 dark:bg-black/20 border border-gray-700/40 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-white dark:text-white outline-none focus:border-indigo-500"
                                    value={params.retiredAge}
                                    onChange={(e) => setParams({ ...params, retiredAge: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Renda Passiva Desejada</label>
                            <input
                                type="number"
                                className="w-full bg-gray-800/30 dark:bg-black/20 border border-gray-700/40 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-white dark:text-white outline-none focus:border-brand-primary"
                                value={params.desiredRetirementIncome}
                                onChange={(e) => setParams({ ...params, desiredRetirementIncome: Number(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm text-gray-300 dark:text-gray-300 font-bold mb-2">
                                <input
                                    type="checkbox"
                                    checked={params.inssContribution}
                                    onChange={(e) => setParams({ ...params, inssContribution: e.target.checked })}
                                    className="rounded text-indigo-500 focus:ring-indigo-500"
                                />
                                Incluir Teto Benefício INSS (R$ 3.500 est.)
                            </label>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className={`\${tw.card} p-5`}>
                        <h3 className="font-bold text-white dark:text-white mb-4 flex items-center gap-2">
                            <HeartPulse className="h-5 w-5 text-indigo-500" /> Trajetória de Longevidade
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={result.projection} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.2)" />
                                    <XAxis
                                        dataKey="age"
                                        stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} dy={10} minTickGap={10}
                                    />
                                    <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip
                                        formatter={(v) => formatCurrency(v)}
                                        labelFormatter={(v) => `Idade ${v} anos`}
                                        contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: '12px', border: 'none', color: '#fff' }}
                                    />
                                    <ReferenceLine
                                        x={params.retiredAge}
                                        stroke="#8b5cf6"
                                        strokeDasharray="5 5"
                                        label={{ value: 'APOSENTADORIA', fill: '#8b5cf6', fontSize: 10, fontWeight: 'bold' }}
                                    />
                                    <Line
                                        name="Patrimônio Teto" dataKey="balance"
                                        stroke="#6366f1" strokeWidth={3} dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        {!result.isSustainable && (
                            <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex gap-3">
                                <Coins className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                                    {result.diagnosis} O fundo zera antes do tempo estimado de vida ({params.lifeExpectancy} anos).
                                    Você precisará adicionar capital ou reduzir a retirada planejada.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
