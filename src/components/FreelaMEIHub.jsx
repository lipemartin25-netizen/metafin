import { tw } from '@/lib/theme';
import { useState } from 'react';
import { Briefcase, Percent, Receipt, ShieldCheck } from 'lucide-react';

function fmt(v) {
 return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function FreelaMEIHub() {
 const [revenue, setRevenue] = useState(10000);
 const [expenses, setExpenses] = useState(2500);

 // Cálculos MEI simplificados
 const profit = revenue - expenses;
 const das = 75.60; // Fixo aproximado

 // Sugestão de Pro-labore (Reserva)
 const proLaboreIdea = profit * 0.40; // O empreendedor tira 40% pra vida pessoal
 const businessReserve = profit - proLaboreIdea - das; // 60% fica na empresa

 return (
 <div className="space-y-8 animate-fade-in text-[var(--text-primary)]/90 pb-20">
 <div className={`\${tw.card} p-6 border-l-4 border-l-cyan-500 relative overflow-hidden bg-black/40`}>
 <div className="absolute top-0 right-0 p-8 opacity-10">
 <Briefcase className="w-32 h-32 text-cyan-500" />
 </div>
 <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2 relative z-10 mb-2 uppercase tracking-widest">
 <Briefcase className="w-6 h-6 text-cyan-500 animate-pulse" /> Toolkit do MEI / Freela
 </h2>
 <p className="text-sm text-gray-300 relative z-10 max-w-2xl leading-relaxed">
 Separe automaticamente suas finanças de CPF e CNPJ. Descubra qual deve ser o seu Pró-labore saudável e gerencie a reserva tributária.
 </p>
 </div>

 <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
 <div className={`\${tw.card} p-6 bg-black/20 border border-[var(--border)] space-y-4`}>
 <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400">Faturamento Mensal (CNPJ)</h3>
 <input
 type="number"
 value={revenue}
 onChange={e => setRevenue(Number(e.target.value))}
 className="w-full bg-black/40 border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-xl font-black outline-none focus:border-cyan-500 transition-colors"
 />
 </div>
 <div className={`\${tw.card} p-6 bg-black/20 border border-[var(--border)] space-y-4`}>
 <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400">Custos da Operação</h3>
 <input
 type="number"
 value={expenses}
 onChange={e => setExpenses(Number(e.target.value))}
 className="w-full bg-black/40 border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-xl font-black outline-none focus:border-cyan-500 transition-colors"
 />
 </div>
 </div>

 <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
 {/* DAS / Imposto */}
 <div className={`\${tw.card} flex flex-col gap-4 p-6 border border-gray-800`}>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
 <Receipt className="w-5 h-5 text-orange-400" />
 </div>
 <div>
 <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Reserva DAS/Trib</p>
 <p className="text-xl font-black text-[var(--text-primary)]">{fmt(das)}</p>
 </div>
 </div>
 <div className="text-xs text-gray-400 bg-black/30 p-2 rounded-lg border border-[var(--border)]">
 *Valor fixo MEI do INSS+ISS mensal. Separar dia 20.
 </div>
 </div>

 {/* ProLabore Suggestion */}
 <div className={`\${tw.card} flex flex-col gap-4 p-6 border border-cyan-500/30 shadow-glass-card relative overflow-hidden`}>
 <div className="absolute top-0 right-0 bg-cyan-500 text-[var(--text-primary)] text-[9px] font-black tracking-widest px-2 py-0.5 rounded-bl-lg uppercase">
 Pró-Labore
 </div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
 <ShieldCheck className="w-5 h-5 text-cyan-400" />
 </div>
 <div>
 <p className="text-[10px] uppercase font-bold text-cyan-500 tracking-widest">Salário (Transf. p/ CPF)</p>
 <p className="text-xl font-black text-[var(--text-primary)]">{fmt(proLaboreIdea)}</p>
 </div>
 </div>
 <div className="text-xs text-gray-400 bg-black/30 p-2 rounded-lg border border-[var(--border)]">
 Sugerimos sacar apenas 40% do lucro para manter a empresa saudável e financiar crescimento.
 </div>
 </div>

 {/* Caixa da Empresa */}
 <div className={`\${tw.card} flex flex-col gap-4 p-6 border border-accent/20`}>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
 <Percent className="w-5 h-5 text-accent" />
 </div>
 <div>
 <p className="text-[10px] uppercase font-bold text-accent tracking-widest">Caixa Sobrante CNPJ</p>
 <p className="text-xl font-black text-[var(--text-primary)]">{fmt(businessReserve)}</p>
 </div>
 </div>
 <div className="text-xs text-gray-400 bg-black/30 p-2 rounded-lg border border-[var(--border)]">
 Lucro acumulado no caixa CNPJ. Use para reinvestir no negócio, marketing ou fundo de reserva.
 </div>
 </div>
 </div>

 <div className={`text-center mt-10 p-6 \${tw.card} bg-black/20 border-dashed border-2 border-[var(--border)] uppercase font-black tracking-widest text-sm text-gray-500`}>
 Módulo MEI / Integração de Emissão de Nota Fiscal em Breve
 </div>
 </div>
 );
}
