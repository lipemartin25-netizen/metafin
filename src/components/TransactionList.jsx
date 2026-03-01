import { tw } from '@/lib/theme';
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Utensils, Zap, TrendingUp, Car, Coffee, Eye, EyeOff } from "lucide-react";
import { useVisibility } from "../hooks/useVisibility";

const transactions = [
 { icon: ShoppingCart, label: "Mercado Livre", category: "Compras", amount: -289.90, date: "Hoje, 14:32", color: "text-orange-400", bg: "bg-orange-500/10" },
 { icon: TrendingUp, label: "Dividendos ITSA4", category: "Investimentos", amount: +420.00, date: "Hoje, 09:15", color: "text-brand-glow", bg: "bg-brand-primary/10" },
 { icon: Utensils, label: "iFood", category: "Alimentação", amount: -67.50, date: "Ontem, 20:08", color: "text-red-400", bg: "bg-red-500/10" },
 { icon: Zap, label: "CPFL Energia", category: "Contas", amount: -184.30, date: "23 Fev", color: "text-yellow-400", bg: "bg-yellow-500/10" },
 { icon: Car, label: "Posto Shell", category: "Transporte", amount: -120.00, date: "22 Fev", color: "text-blue-400", bg: "bg-blue-500/10" },
 { icon: Coffee, label: "Starbucks", category: "Alimentação", amount: -32.00, date: "21 Fev", color: "text-amber-400", bg: "bg-[var(--bg-base)]mber-500/10" },
];

export default function TransactionList() {
 const navigate = useNavigate();
 const { isVisible, toggleVisibility } = useVisibility();

 return (
 <div className="rounded-2xl bg-[#0d0d15] border border-[var(--border)] p-6 group">
 <div className="flex items-center justify-between mb-5">
 <div>
 <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
 Transações Recentes
 <button
 onClick={() => toggleVisibility()}
 className="p-1 rounded-lg bg-[var(--bg-surface)] opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-800/40/10"
 >
 {isVisible ? <EyeOff size={12} className="text-[var(--text-primary)]/40" /> : <Eye size={12} className="text-[var(--text-primary)]/40" />}
 </button>
 </h3>
 <p className="text-[var(--text-primary)]/30 text-xs mt-0.5">Fevereiro 2026</p>
 </div>
 <button
 onClick={() => navigate('/app/transactions')}
 className="text-xs text-violet-400 hover:text-violet-300 transition-colors border border-violet-500/20 px-3 py-1.5 rounded-lg hover:bg-violet-500/10"
 >
 Ver todas
 </button>
 </div>

 <div className="space-y-1">
 {transactions.map(({ icon: Icon, label, category, amount, date, color, bg }) => (
 <div
 key={label + date}
 className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800/40/3 transition-colors cursor-pointer group/item"
 >
 <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
 <Icon size={17} className={color} />
 </div>

 <div className="flex-1 min-w-0">
 <p className="text-[var(--text-primary)]/80 text-sm font-medium group-hover/item:text-[var(--text-primary)] transition-colors truncate">{label}</p>
 <p className="text-[var(--text-primary)]/30 text-xs">{category}</p>
 </div>

 <div className="text-right flex-shrink-0">
 <p className={`text-sm font-semibold ${amount > 0 ? "text-brand-glow" : "text-[var(--text-primary)]/70"}`}>
 {isVisible ? (
 <>
 {amount > 0 ? "+" : ""}
 {amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
 </>
 ) : "R$ ••••"}
 </p>
 <p className="text-[var(--text-primary)]/25 text-xs">{date}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
