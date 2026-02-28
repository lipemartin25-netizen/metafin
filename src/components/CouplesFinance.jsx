import { tw } from '@/lib/theme';
import { useState } from 'react';
import { Users, Sparkles, HeartPulse, CreditCard } from 'lucide-react';

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function CouplesFinance() {
    const [income1, setIncome1] = useState(5000);
    const [income2, setIncome2] = useState(3000);
    const [expenses, setExpenses] = useState(4000);

    const totalIncome = income1 + income2;
    const prop1 = totalIncome > 0 ? (income1 / totalIncome) : 0;
    const prop2 = totalIncome > 0 ? (income2 / totalIncome) : 0;

    const share5050 = expenses / 2;
    const shareProp1 = expenses * prop1;
    const shareProp2 = expenses * prop2;

    return (
        <div className="space-y-8 animate-fade-in text-white/90 pb-20">
            <div className={`\${tw.card} p-6 border-l-4 border-l-pink-500 relative overflow-hidden bg-black/40`}>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <HeartPulse className="w-32 h-32 text-pink-500" />
                </div>
                <h2 className="text-xl font-black text-white flex items-center gap-2 relative z-10 mb-2 uppercase tracking-widest">
                    <Users className="w-6 h-6 text-pink-500 animate-pulse" /> Gestão Compartilhada
                </h2>
                <p className="text-sm text-gray-300 relative z-10 max-w-2xl leading-relaxed">
                    Divisão Inteligente de Despesas. Mude de 50/50 para Proporcional e proteja o parceiro que ganha menos sem prejudicar o padrão de vida.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className={`\${tw.card} p-6 bg-black/20 border border-white/5 space-y-4`}>
                    <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400">Renda Pessoa 1</h3>
                    <input
                        type="number"
                        value={income1}
                        onChange={e => setIncome1(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-black outline-none focus:border-pink-500 transition-colors"
                    />
                </div>
                <div className={`\${tw.card} p-6 bg-black/20 border border-white/5 space-y-4`}>
                    <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400">Renda Pessoa 2</h3>
                    <input
                        type="number"
                        value={income2}
                        onChange={e => setIncome2(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-black outline-none focus:border-pink-500 transition-colors"
                    />
                </div>
                <div className={`\${tw.card} p-6 bg-black/20 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.1)] space-y-4`}>
                    <h3 className="font-bold uppercase tracking-widest text-xs text-pink-400 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Despesas do Casal
                    </h3>
                    <input
                        type="number"
                        value={expenses}
                        onChange={e => setExpenses(Number(e.target.value))}
                        className="w-full bg-black/40 border border-pink-500/50 rounded-xl px-4 py-3 text-pink-500 text-xl font-black outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-500 transition-colors"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* 50 / 50 */}
                <div className={`\${tw.card} p-8 bg-black/30 border border-gray-800 hover:border-white/20 transition-all flex flex-col justify-between`}>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-white mb-2">Divisão 50/50</h3>
                        <p className="text-xs text-gray-400 mb-6">Metade para cada um. Simples, porém pode pesar para quem tem menor renda líquida.</p>

                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between items-center bg-gray-800/40/5 p-4 rounded-xl">
                                <span className="font-medium text-gray-300">Pessoa 1 Paga:</span>
                                <span className="font-black text-white text-xl">{fmt(share5050)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-800/40/5 p-4 rounded-xl">
                                <span className="font-medium text-gray-300">Pessoa 2 Paga:</span>
                                <span className="font-black text-white text-xl">{fmt(share5050)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proporcional */}
                <div className={`\${tw.card} p-8 border border-accent/30 shadow-[0_0_30px_-5px_rgba(57,255,20,0.15)] relative overflow-hidden flex flex-col justify-between`}>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/20 rounded-full blur-[40px] pointer-events-none" />

                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest mb-4 border border-accent/20">
                            <Sparkles className="w-3 h-3" /> A Escolha Inteligente
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-white mb-2">Divisão Proporcional</h3>
                        <p className="text-xs text-gray-400 mb-6">Quem ganha mais, contribui mais. Mantém a equidade no relacionamento e sobras para investimentos individuais.</p>

                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between items-center bg-accent/5 p-4 rounded-xl border border-accent/10">
                                <span className="font-medium text-gray-300 flex items-center gap-2">
                                    Pessoa 1 Paga <span className="text-[10px] text-accent">{(prop1 * 100).toFixed(1)}%</span>
                                </span>
                                <span className="font-black text-accent text-xl">{fmt(shareProp1)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-accent/5 p-4 rounded-xl border border-accent/10">
                                <span className="font-medium text-gray-300 flex items-center gap-2">
                                    Pessoa 2 Paga <span className="text-[10px] text-accent">{(prop2 * 100).toFixed(1)}%</span>
                                </span>
                                <span className="font-black text-accent text-xl">{fmt(shareProp2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
