import { tw } from '@/lib/theme';
import { TrendingUp, Eye, EyeOff, Minus } from "lucide-react";
import { useMemo } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { useVisibility } from "../hooks/useVisibility";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

function fmt(v) {
 return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}

// Mock data for background visualization
const bgTrend = [
 { v: 10 }, { v: 15 }, { v: 12 }, { v: 20 }, { v: 18 }, { v: 25 }, { v: 30 }
];

export default function BalanceCard() {
 const { isVisible, toggleVisibility } = useVisibility();
 const { transactions } = useTransactions();

 const { saldo, receitas, despesas, investido, pct } = useMemo(() => {
 const now = new Date();

 const thisMonth = transactions.filter(t => {
 const d = new Date(t.date);
 return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
 });
 const prevMonth = transactions.filter(t => {
 const d = new Date(t.date);
 const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
 return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
 });

 const receitas = thisMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
 const despesas = thisMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
 const investido = transactions.filter(t =>
 t.category?.toLowerCase().includes("invest")
 ).reduce((s, t) => s + (t.type === "income" ? t.amount : 0), 0);

 const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
 const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
 const saldo = totalIncome - totalExpense;

 const prevReceitas = prevMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
 const pct = prevReceitas > 0 ? ((receitas - prevReceitas) / prevReceitas) * 100 : null;

 return { saldo, receitas, despesas, investido, pct };
 }, [transactions]);

 const hasData = transactions.length > 0;

 return (
 <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-base)] from-violet-600 via-indigo-600 to-brand-dark p-6 h-full min-h-[180px] group">
 {/* Background Sparkline */}
 <div className="absolute inset-0 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={bgTrend}>
 <defs>
 <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#fff" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#fff" stopOpacity={0} />
 </linearGradient>
 </defs>
 <Area
 type="monotone"
 dataKey="v"
 stroke="#fff"
 strokeWidth={3}
 fill="url(#balanceGrad)"
 dot={false}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>

 <div className="absolute -top-8 -right-8 w-40 h-40 bg-gray-800/40/10 rounded-full blur-3xl" />
 <div className="absolute -bottom-10 -left-5 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
 <div className="absolute inset-0 opacity-10"
 style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "28px 28px" }}
 />

 <div className="relative z-10 flex flex-col h-full justify-between">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-[var(--text-primary)]/60 text-xs font-bold tracking-widest uppercase">Saldo Total</p>
 <div className="flex items-center gap-3 mt-2">
 <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
 {!hasData
 ? <span className="text-[var(--text-primary)]/30 select-none">R$ —</span>
 : isVisible ? fmt(saldo) : "R$ ••••••"
 }
 </h2>
 {hasData && (
 <button
 onClick={() => toggleVisibility()}
 className="text-[var(--text-primary)]/40 hover:text-[var(--text-primary)] transition-all transform hover:-translate-y-px transition-transform"
 >
 {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
 </button>
 )}
 </div>
 </div>

 <div className="flex items-center gap-1.5 bg-gray-800/40/20 px-3 py-1.5 rounded-full text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] shadow-lg">
 {pct === null ? (
 <><Minus size={13} />&nbsp;—</>
 ) : pct >= 0 ? (
 <><TrendingUp size={13} />&nbsp;+{pct.toFixed(1)}%</>
 ) : (
 <><TrendingUp size={13} className="rotate-180" />&nbsp;{pct.toFixed(1)}%</>
 )}
 </div>
 </div>

 <div className="flex items-center gap-6 mt-6">
 <div>
 <p className="text-[var(--text-primary)]/50 text-[10px] uppercase font-bold tracking-wider">Receitas</p>
 <p className="text-[var(--text-primary)] font-bold text-sm mt-0.5">
 {hasData ? (isVisible ? fmt(receitas) : "••••") : <span className="text-[var(--text-primary)]/30">—</span>}
 </p>
 </div>
 <div className="w-px h-8 bg-gray-800/40/20" />
 <div>
 <p className="text-[var(--text-primary)]/50 text-[10px] uppercase font-bold tracking-wider">Despesas</p>
 <p className="text-[var(--text-primary)] font-bold text-sm mt-0.5">
 {hasData ? (isVisible ? fmt(despesas) : "••••") : <span className="text-[var(--text-primary)]/30">—</span>}
 </p>
 </div>
 <div className="w-px h-8 bg-gray-800/40/20" />
 <div>
 <p className="text-[var(--text-primary)]/50 text-[10px] uppercase font-bold tracking-wider">Investido</p>
 <p className="text-[var(--text-primary)] font-bold text-sm mt-0.5">
 {hasData ? (isVisible ? fmt(investido) : "••••") : <span className="text-[var(--text-primary)]/30">—</span>}
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}

