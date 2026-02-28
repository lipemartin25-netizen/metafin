import { tw } from '@/lib/theme';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles, AlertCircle, Building2 } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';

// Transações Fake Pendentes (Edge Integration Mock)
const MOCK_PENDING_TX = [
 {
 id: 'pend-1',
 description: 'Uber *Trip',
 amount: -25.90,
 suggestedCategory: 'Transporte',
 bank: 'Nubank',
 date: new Date().toISOString().split('T')[0],
 type: 'expense'
 },
 {
 id: 'pend-2',
 description: 'Pix Recebido - João Santos',
 amount: 150.00,
 suggestedCategory: 'Rendimento',
 bank: 'Itaú',
 date: new Date().toISOString().split('T')[0],
 type: 'income'
 },
 {
 id: 'pend-3',
 description: 'Netflix.com',
 amount: -39.90,
 suggestedCategory: 'Assinaturas',
 bank: 'Nubank',
 date: new Date().toISOString().split('T')[0],
 type: 'expense'
 }
];

export default function SmartReconciliation() {
 const { addTransaction } = useTransactions();
 const [pendingQs, setPendingQs] = useState([]);

 useEffect(() => {
 // Simulando load de provider BaaS
 const timer = setTimeout(() => {
 setPendingQs(MOCK_PENDING_TX);
 }, 1500);
 return () => clearTimeout(timer);
 }, []);

 const handleAction = async (tx, action) => {
 if (action === 'approve') {
 await addTransaction({
 description: tx.description,
 amount: tx.amount,
 type: tx.type,
 category: tx.suggestedCategory.toLowerCase() === 'transporte' ? 'transport' :
 tx.suggestedCategory.toLowerCase() === 'rendimento' ? 'salary' : 'entertainment',
 date: tx.date,
 notes: `Auto-reconciliado via ${tx.bank}`
 });
 }

 // Remove from pending queue
 setPendingQs(prev => prev.filter(p => p.id !== tx.id));
 };

 if (pendingQs.length === 0) return null;

 return (
 <div className={`\${tw.card} bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/5 mb-6 overflow-hidden relative group p-1`}>
 {/* Glow logic */}
 <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow" />

 <div className="px-5 pt-5 pb-3 flex items-center justify-between relative z-10">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-indigo-500/20 rounded-xl">
 <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
 </div>
 <div>
 <h3 className="text-base font-bold text-content-primary dark:text-content-primary flex items-center gap-2">
 Radar de Conciliação
 <span className="bg-indigo-600 text-content-primary text-[10px] px-2 py-0.5 rounded-full font-black tracking-widest leading-tight">
 {pendingQs.length} PENDÊNCIAS
 </span>
 </h3>
 <p className="text-xs text-gray-500 dark:text-gray-400">Encontramos transações nos seus bancos não registradas.</p>
 </div>
 </div>
 </div>

 <div className="px-4 pb-4">
 <div className="relative h-[85px] w-full">
 <AnimatePresence mode="popLayout">
 {pendingQs.slice(0, 1).map((tx) => (
 <motion.div
 key={tx.id}
 layout
 initial={{ opacity: 0, x: 50, scale: 0.95 }}
 animate={{ opacity: 1, x: 0, scale: 1 }}
 exit={{ opacity: 0, x: -50, scale: 0.95 }}
 transition={{ type: "spring", stiffness: 300, damping: 25 }}
 className="absolute inset-0 w-full"
 >
 <div className="bg-gray-800/40 dark:bg-surface-800 border border-gray-700/40 dark:border-[var(--border)] rounded-xl p-3 shadow-lg shadow-black/10 flex items-center justify-between gap-4 w-full group/card hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors h-full">
 <div className="flex items-center gap-4 flex-1 min-w-0">
 <div className="w-10 h-10 rounded-full bg-gray-800/40 dark:bg-surface-900 overflow-hidden flex items-center justify-center shrink-0 border border-gray-700/40 dark:border-[var(--border)]">
 {tx.bank === 'Nubank' ? (
 <div className="w-full h-full bg-[#8A05BE] flex items-center justify-center text-content-primary font-bold text-xs">NU</div>
 ) : tx.bank === 'Itaú' ? (
 <div className="w-full h-full bg-[#EC7000] flex items-center justify-center text-content-primary font-bold text-xs">IT</div>
 ) : (
 <Building2 className="w-5 h-5 text-gray-400" />
 )}
 </div>
 <div className="truncate flex-1">
 <div className="flex items-center gap-2 mb-0.5">
 <p className="text-sm font-bold text-content-primary dark:text-content-primary truncate" title={tx.description}>
 {tx.description}
 </p>
 <span className={`text-xs font-black shrink-0 ${tx.type === 'income' ? 'text-brand-primary' : 'text-gray-600 dark:text-gray-300'}`}>
 {tx.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(tx.amount))}
 </span>
 </div>
 <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
 <AlertCircle className="w-3 h-3 text-indigo-500" />
 <span>Sugerido: <strong className="text-indigo-600 dark:text-indigo-400">{tx.suggestedCategory}</strong></span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={() => handleAction(tx, 'reject')}
 className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-content-primary flex items-center justify-center transition-colors group/btn shrink-0"
 title="Ignorar"
 >
 <X className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
 </button>
 <button
 onClick={() => handleAction(tx, 'approve')}
 className="w-10 h-10 rounded-full bg-purple-50 dark:bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-content-primary flex items-center justify-center transition-colors shadow-lg shadow-black/10 group/btn shrink-0"
 title="Aprovar Match"
 >
 <Check className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
 </button>
 </div>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 </div>
 </div>
 );
}
