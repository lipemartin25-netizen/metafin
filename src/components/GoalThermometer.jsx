import { tw } from '@/lib/theme';
import { useMemo } from 'react';
import { Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';

const GOAL_ICONS = {
 travel: '✈️', car: '🚗', house: '🏠', wedding: '💒',
 education: '📚', emergency_fund: '🛟', retirement: '👴',
 investment: '📈', other: '🎯'
};

export default function GoalThermometer({ goal }) {
 const pct = useMemo(() =>
 Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100),
 [goal]
 );

 const formatCurrency = (v) =>
 new Intl.NumberFormat('pt-BR', {
 style: 'currency', currency: 'BRL'
 }).format(v);

 const getColor = () => {
 if (pct >= 100) return 'from-brand-glow to-emerald-600';
 if (pct >= 60) return 'from-blue-400 to-blue-600';
 if (pct >= 30) return 'from-yellow-400 to-orange-500';
 return 'from-red-400 to-red-600';
 };

 return (
 <div className={`relative rounded-2xl border p-5 \${tw.card} shadow-lg shadow-black/10 hover:shadow-lg transition-all duration-300 group overflow-hidden`}>

 {pct >= 100 && (
 <div className="absolute -top-2 -right-2">
 <CheckCircle2 className="h-10 w-10 text-brand-primary animate-pulse drop-shadow-lg shadow-black/10" />
 </div>
 )}

 <div className="flex items-center gap-4 mb-4 relative z-10">
 <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gray-800/30/50 dark:bg-[var(--bg-surface)] border border-gray-100 dark:border-[var(--border)] group-hover:-translate-y-px transition-transform transition-transform">
 <span className="text-2xl drop-shadow-lg shadow-black/10">
 {GOAL_ICONS[goal.category] || goal.icon}
 </span>
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-bold text-lg text-[var(--text-primary)] dark:text-[var(--text-primary)] truncate">{goal.name}</h3>
 <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
 {goal.monthly_contribution
 ? `${formatCurrency(goal.monthly_contribution)}/mês`
 : 'Sem aporte definido'}
 </p>
 </div>
 </div>

 {/* Termômetro Visual */}
 <div className="relative h-6 w-full rounded-full bg-gray-800/50/50 dark:bg-gray-800/80 overflow-hidden mb-3 border border-[var(--border-subtle)]/50/30 dark:border-[var(--border-subtle)]/50 shadow-inner">
 <div
 className={`h-full rounded-full bg-[var(--bg-base)] ${getColor()} 
 transition-all duration-1000 ease-out flex items-center 
 justify-end pr-3 shadow-tech-card`}
 style={{ width: `${Math.max(pct, 5)}%` }}
 >
 {pct >= 15 && (
 <span className="text-[10px] font-black tracking-widest text-[var(--text-primary)] drop-shadow-lg shadow-black/10">{pct}%</span>
 )}
 </div>
 {pct < 15 && (
 <span className="absolute right-3 top-1/2 -translate-y-1/2 
 text-[10px] font-black tracking-widest text-gray-500 dark:text-gray-400">{pct}%</span>
 )}
 </div>

 {/* Valores */}
 <div className="flex justify-between items-end mb-4">
 <div>
 <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-0.5">Acumulado</span>
 <span className="font-bold text-gray-300 dark:text-gray-300">
 {formatCurrency(goal.current_amount)}
 </span>
 </div>
 <div className="text-right">
 <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-0.5">Meta</span>
 <span className="font-black text-[var(--text-primary)] dark:text-[var(--text-primary)] drop-shadow-lg shadow-black/10">
 {formatCurrency(goal.target_amount)}
 </span>
 </div>
 </div>

 {/* Footer com métricas */}
 <div className="pt-3 border-t border-gray-100 dark:border-[var(--border)] 
 flex flex-wrap gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 justify-between items-center relative z-10">
 {goal.months_remaining && (
 <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">
 <Calendar className="h-3.5 w-3.5" />
 {goal.months_remaining} meses
 </span>
 )}
 <span className="flex items-center gap-1.5 ml-auto text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-md">
 <TrendingUp className="h-3.5 w-3.5" />
 Falta {formatCurrency(goal.target_amount - goal.current_amount)}
 </span>
 </div>
 </div>
 );
}
