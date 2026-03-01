import { tw } from '@/lib/theme';
import { useState, useMemo } from 'react';
import { calculateTaxPlan } from '../lib/taxPlanner';
import { Shield, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TaxPlanner({ financialData }) {
 const [params, setParams] = useState({
 monthlyGrossIncome: financialData?.income || 10000,
 dependents: 0,
 hasPrivatePension: false,
 privatePensionMonthly: 0,
 healthExpensesAnnual: 0,
 educationExpensesAnnual: 0,
 alimonyMonthly: 0
 });

 const result = useMemo(() => {
 const plan = calculateTaxPlan(params);
 return {
 bestModel: plan.annual.bestModel,
 irSimplificada: plan.annual.irSimplified,
 irCompleta: plan.annual.irComplete,
 totalDeductionsSum: plan.annual.totalDeductionsComplete,
 bestModelSaving: plan.annual.modelDifference,
 suggestions: plan.suggestions || []
 };
 }, [params]);

 const formatCurrency = (v) =>
 new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="relative overflow-hidden flex flex-col items-center justify-center rounded-[2.5rem] bg-[var(--bg-base)] from-blue-600 via-indigo-600 to-brand-dark p-10 md:p-14 text-[var(--text-primary)] shadow-tech-card border border-[var(--border)] text-center group perspective-1000">
 {/* Efeitos 3D Internos */}
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PG1hdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')] opacity-30" />
 <div className="absolute -left-20 -top-20 w-80 h-80 bg-gray-800/40/10 rounded-full mix-blend-overlay filter blur-[40px] opacity-60 group-hover:-translate-y-px transition-transform transition-transform duration-1000 ease-out" />
 <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400/20 rounded-full mix-blend-color-dodge filter blur-[40px] opacity-60 group-hover:-translate-x-10 transition-transform duration-1000 ease-out delay-100" />
 <Shield className="absolute -right-10 -bottom-10 h-72 w-72 opacity-10 group-hover:-translate-y-px transition-transform group-hover:opacity-20 transition-all duration-1000 blur-xl text-blue-300" />

 <div className="relative z-10 p-5 bg-gray-800/40/10 rounded-[2rem] shadow-inner border border-[var(--border)] mb-6 group-hover:-translate-y-px group-hover:rotate-3 transition-transform duration-500">
 <Shield className="w-16 h-16 text-blue-200 drop-shadow-tech-card animate-bounce-slow" />
 </div>

 <h2 className="text-4xl md:text-5xl font-black mb-4 relative z-10 tracking-tight drop-shadow-lg scale-100 group-hover:scale-[1.02] transition-transform duration-500">
 Otimizador Tributário IRPF
 </h2>
 <p className="text-blue-100 text-base md:text-lg font-medium max-w-2xl relative z-10 leading-relaxed px-4">
 Pare de deixar dinheiro na mesa. Nossa <strong className="text-[var(--text-primary)] drop-shadow-lg shadow-black/10">Inteligência Estratégica</strong> cruza suas deduções
 (PGBL, Saúde, Escola) e escaneia a rota matemática exata para você pagar o mínimo legal de imposto de renda.
 </p>

 {/* Decorative border highlight */}
 <div className="absolute inset-x-0 h-1 bg-[var(--bg-base)] from-transparent via-blue-300 to-transparent bottom-0 opacity-0 group-hover:opacity-100 animate-[scan_2s_ease-in-out_infinite_reverse] shadow-tech-card" />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
 {/* Sidebar Configurações */}
 <div className={`\${tw.card} p-5 space-y-4`}>
 <h3 className="font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2 mb-4">
 Receitas e Deduções
 </h3>

 <div className="space-y-3">
 <div>
 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Renda Bruta Mensal (CLT/Pró-Labore)</label>
 <input
 type="number"
 className="w-full bg-gray-800/30 dark:bg-black/20 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)] outline-none focus:border-blue-500"
 value={params.monthlyGrossIncome}
 onChange={(e) => setParams({ ...params, monthlyGrossIncome: Number(e.target.value) })}
 />
 </div>
 <div>
 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Número de Dependentes</label>
 <input
 type="number"
 className="w-full bg-gray-800/30 dark:bg-black/20 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)] outline-none focus:border-blue-500"
 value={params.dependents}
 onChange={(e) => setParams({ ...params, dependents: Number(e.target.value) })}
 />
 </div>
 <div className="grid grid-cols-2 gap-3 animate-fade-in">
 <div>
 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1 text-truncate">Saúde Anual (R$)</label>
 <input
 type="number"
 className="w-full bg-gray-800/30 dark:bg-black/20 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)] outline-none focus:border-blue-500"
 value={params.healthExpensesAnnual}
 onChange={(e) => setParams({ ...params, healthExpensesAnnual: Number(e.target.value) })}
 />
 </div>
 <div>
 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Escola Anual (R$)</label>
 <input
 type="number"
 className="w-full bg-gray-800/30 dark:bg-black/20 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)] outline-none focus:border-blue-500"
 value={params.educationExpensesAnnual}
 onChange={(e) => setParams({ ...params, educationExpensesAnnual: Number(e.target.value) })}
 />
 </div>
 </div>
 <div className="pt-2">
 <label className="flex items-center gap-2 text-sm text-gray-300 dark:text-gray-300 font-bold mb-2">
 <input
 type="checkbox"
 checked={params.hasPrivatePension}
 onChange={(e) => setParams({ ...params, hasPrivatePension: e.target.checked })}
 className="rounded text-blue-500 focus:ring-blue-500"
 />
 Tenho Previdência PGBL
 </label>
 {params.hasPrivatePension && (
 <input
 type="number"
 placeholder="Aporte mensal R$"
 className="w-full bg-gray-800/30 dark:bg-black/20 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)] outline-none focus:border-blue-500 mt-1"
 value={params.privatePensionMonthly}
 onChange={(e) => setParams({ ...params, privatePensionMonthly: Number(e.target.value) })}
 />
 )}
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="lg:col-span-2 space-y-6">

 {/* Comparativo de Modelos */}
 <div className={`\${tw.card} p-6`}>
 <h3 className="font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2 mb-6">
 Comparativo Anual <ArrowRight className="w-4 h-4 text-gray-500" />
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
 <div className={`p-5 rounded-2xl border transition-all ${result.bestModel === 'simplificado' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 shadow-lg shadow-black/10 ring-2 ring-blue-500/50' : 'bg-gray-800/30 dark:bg-gray-800/40/[0.02] border-[var(--border-subtle)]/40 dark:border-[var(--border)] opacity-70'}`}>
 {result.bestModel === 'simplificado' && <CheckCircle2 className="w-6 h-6 text-blue-500 mb-2" />}
 <h4 className="font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] text-lg">Modelo Simplificado</h4>
 <p className="text-xs text-gray-500 mt-1 mb-4 h-8">Usa um desconto padrão de 20% limitado ao teto, ignorando recibos.</p>
 <div className="pt-4 border-t border-[var(--border-subtle)]/40 dark:border-[var(--border)]">
 <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Imposto Total Devido</p>
 <p className={`text-2xl font-black ${result.bestModel === 'simplificado' ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-primary)] dark:text-[var(--text-primary)]'}`}>{formatCurrency(result.irSimplificada)}</p>
 </div>
 </div>

 <div className={`p-5 rounded-2xl border transition-all ${result.bestModel === 'completo' ? 'bg-purple-50 dark:bg-brand-primary/10 border-brand-primary shadow-lg shadow-black/10 ring-2 ring-emerald-500/50' : 'bg-gray-800/30 dark:bg-gray-800/40/[0.02] border-[var(--border-subtle)]/40 dark:border-[var(--border)] opacity-70'}`}>
 {result.bestModel === 'completo' && <CheckCircle2 className="w-6 h-6 text-brand-primary mb-2" />}
 <h4 className="font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] text-lg">Modelo Completo</h4>
 <p className="text-xs text-gray-500 mt-1 mb-4 h-8">Leva em conta PGBL, dependentes, saúde e educação. Você tem {formatCurrency(result.totalDeductionsSum)} em deduções.</p>
 <div className="pt-4 border-t border-[var(--border-subtle)]/40 dark:border-[var(--border)]">
 <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Imposto Total Devido</p>
 <p className={`text-2xl font-black ${result.bestModel === 'completo' ? 'text-brand-primary dark:text-brand-glow' : 'text-[var(--text-primary)] dark:text-[var(--text-primary)]'}`}>{formatCurrency(result.irCompleta)}</p>
 </div>
 </div>
 </div>

 <div className="mt-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20">
 <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
 💡 Economia gerada pela escolha certa: {formatCurrency(result.bestModelSaving)}
 </p>
 </div>
 </div>

 {/* Dicas de IA */}
 <div className={`\${tw.card} p-6`}>
 <h3 className="font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2 mb-4">
 Recomendações Práticas
 </h3>
 <div className="space-y-3">
 {result.suggestions.map((sug, i) => (
 <div key={i} className="flex gap-4 p-4 rounded-xl bg-gray-800/30/50 dark:bg-gray-800/40/[0.02] border border-gray-100 dark:border-[var(--border)]">
 <AlertCircle className={`w-6 h-6 flex-shrink-0 ${sug.priority === 'alta' ? 'text-red-500' : sug.priority === 'média' ? 'text-yellow-500' : 'text-blue-500'}`} />
 <div>
 <h4 className="font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] text-sm">{sug.action}</h4>
 <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{sug.description}</p>
 {sug.annualSaving > 0 && (
 <p className="text-xs font-bold text-brand-primary dark:text-brand-glow mt-2">
 Economia estimada: até {formatCurrency(sug.annualSaving)}
 </p>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>

 </div>
 </div>
 </div>
 );
}
