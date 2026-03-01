import { tw } from '@/lib/theme';
import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Plus, Trash2, X, Calendar, AlertTriangle, CheckCircle, Eye, EyeOff, Zap, Lock, Unlock, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const FLAGS = [
    { id: 'visa', name: 'Visa', color: '#1A1F71', logo: 'VISA' },
    { id: 'mastercard', name: 'Mastercard', color: '#EB001B', logo: 'mastercard' },
    { id: 'elo', name: 'Elo', color: '#00A4E0', logo: 'elo' },
];

export default function CreditCards() {
    const [cards, setCards] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', flag: 'visa', limit: '', due: '10', used: '', isVirtual: false });
    const [showNumbers, setShowNumbers] = useState({});

    useEffect(() => {
        const s = localStorage.getItem('sf_credit_cards');
        if (s) setCards(JSON.parse(s));
    }, []);

    const save = (c) => { setCards(c); localStorage.setItem('sf_credit_cards', JSON.stringify(c)); };

    const handleAdd = (e) => {
        e.preventDefault();
        const card = {
            id: Date.now().toString(),
            name: form.name || 'Meu Cartão',
            flag: form.flag,
            limit: parseFloat(form.limit.replace(/\./g, '').replace(',', '.')) || 5000,
            dueDay: parseInt(form.due) || 10,
            used: parseFloat(form.used.replace(/\./g, '').replace(',', '.')) || 0,
            isVirtual: form.isVirtual,
            isLocked: false,
            number: '**** **** **** ' + Math.floor(1000 + Math.random() * 9000),
            cvv: Math.floor(100 + Math.random() * 900),
            exp: `12/${new Date().getFullYear() + 4}`,
            createdAt: new Date().toISOString(),
        };
        save([...cards, card]);
        setForm({ name: '', flag: 'visa', limit: '', due: '10', used: '', isVirtual: false });
        setShowAdd(false);
    };

    const handleDelete = (id) => {
        if (!confirm('Excluir este cartão?')) return;
        save(cards.filter(c => c.id !== id));
    };

    const toggleLock = (id) => {
        save(cards.map(c => c.id === id ? { ...c, isLocked: !c.isLocked } : c));
    };

    const totals = useMemo(() => {
        const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
        const totalUsed = cards.reduce((s, c) => s + c.used, 0);
        const cashbackEstimativa = totalUsed * 0.015; // Ex: 1.5% fixed cashback
        return { totalLimit, totalUsed, available: totalLimit - totalUsed, cashbackEstimativa };
    }, [cards]);

    const getDueStatus = (dueDay) => {
        const today = new Date().getDate();
        const diff = dueDay - today;
        if (diff < 0) return { label: 'Vencida', color: 'text-red-400 bg-red-500/10', icon: AlertTriangle };
        if (diff <= 3) return { label: `Vence em ${diff}d`, color: 'text-yellow-400 bg-yellow-500/10', icon: Calendar };
        return { label: `Dia ${dueDay}`, color: 'text-gray-400 bg-gray-500/10', icon: CheckCircle };
    };

    return (
        <div className="py-6 space-y-8 animate-fade-in pb-20">
            {/* Header Redesigned */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-surface-primary from-brand-600/10 to-transparent p-6 rounded-3xl border border-brand-500/10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-500/20 rounded-2xl flex items-center justify-center p-3 text-brand-500 ">
                        <CreditCard className="w-full h-full" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-content-primary dark:text-content-primary tracking-tight">Meus Cartões</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 font-medium">Gerencie limites, faturas e cashback</p>
                    </div>
                </div>
                <button onClick={() => setShowAdd(true)} className="gradient-btn px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:-translate-y-px transition-transform transition-transform shadow-lg shadow-brand-500/20">
                    <Plus className="w-5 h-5" /> Emitir Novo Cartão
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid sm:grid-cols-4 gap-4 animate-in">
                <div className="tech-card p-6 border-[var(--border-subtle)]">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 uppercase font-black tracking-widest">Limite Total</p>
                    <p className="text-2xl font-black text-[var(--text-primary)]">{fmt(totals.totalLimit)}</p>
                </div>
                <div className="tech-card p-6 border-red-500/20 bg-red-500/5 group">
                    <p className="text-[10px] text-red-400 mb-2 uppercase font-black tracking-widest">Fatura Atual</p>
                    <p className="text-2xl font-black text-red-500 group-hover:scale-105 transition-transform origin-left">{fmt(totals.totalUsed)}</p>
                </div>
                <div className="pastel-card p-6 border-brand-primary/20 bg-brand-primary/5">
                    <p className="text-[10px] text-brand-primary dark:text-brand-glow mb-2 uppercase font-black tracking-widest">Disponível</p>
                    <p className="text-2xl font-black text-brand-primary dark:text-brand-glow">{fmt(totals.available)}</p>
                    {totals.totalLimit > 0 && (
                        <div className="mt-3 h-2 bg-gray-800/40 dark:bg-black/20 rounded-full overflow-hidden shadow-inner border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((totals.totalUsed / totals.totalLimit) * 100, 100)}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] ${(totals.totalUsed / totals.totalLimit) > 0.8 ? 'bg-red-500' : (totals.totalUsed / totals.totalLimit) > 0.5 ? 'bg-yellow-500' : 'bg-brand-primary'}`}
                            />
                        </div>
                    )}
                </div>
                <div className="tech-card p-6 border-[var(--border-subtle)]">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 uppercase font-black tracking-widest flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-brand-glow" /> Est. Cashback
                    </p>
                    <p className="text-2xl font-black text-brand-primary dark:text-blue-400">{fmt(totals.cashbackEstimativa)}</p>
                    <p className="text-[9px] text-gray-500 mt-2 font-bold uppercase tracking-wider italic">Rende 1.5% ao faturar</p>
                </div>
            </div>

            {/* Cards List */}
            {cards.length === 0 ? (
                <div className={`\${tw.card} text-center py-16 border-dashed border-2 border-[var(--border-subtle)]/40 dark:border-[var(--border)] bg-transparent flex flex-col items-center justify-center`}>
                    <div className="w-20 h-20 bg-gray-800/40 dark:bg-[var(--bg-surface)] rounded-full flex items-center justify-center mb-6">
                        <CreditCard className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-xl font-bold text-content-primary dark:text-content-primary mb-2">Carteira Vazia</h4>
                    <p className="text-gray-500 text-sm mb-6 max-w-sm">Você ainda não emitiu nenhum cartão. Crie seu primeiro cartão virtual e gerencie limites instantâneos.</p>
                    <button onClick={() => setShowAdd(true)} className="gradient-btn px-8 py-3 rounded-xl font-bold text-sm shadow-elevated shadow-brand-500/20">Criar Cartão</button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {cards.map((card, i) => {
                            const flag = FLAGS.find(f => f.id === card.flag) || FLAGS[0];
                            const pct = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
                            const due = getDueStatus(card.dueDay);
                            const DueIcon = due.icon;

                            return (
                                <motion.div
                                    key={card.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, delay: i * 0.1 }}
                                    className="relative group perspective"
                                >
                                    {/* Physical/Virtual Card Representation */}
                                    <div className={`relative h-56 rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-elevated transition-all duration-500 preserve-3d group-hover:rotate-y-12 ${card.isLocked ? 'grayscale opacity-75' : ''}`} style={{ background: `linear-gradient(135deg, ${flag.color}, ${flag.color}dd)` }}>
                                        {/* Chip & NF */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--bg-surface)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                        <div className="flex justify-between items-start relative z-10 w-full">
                                            <div className="w-12 h-8 rounded bg-yellow-400/30 border border-yellow-400/50 flex items-center justify-center overflow-hidden">
                                                <div className="w-full h-px bg-yellow-400/50 absolute" />
                                                <div className="h-full w-px bg-yellow-400/50 absolute" />
                                                <div className="w-8 h-4 border border-yellow-400/50 rounded-sm absolute" />
                                            </div>

                                            {card.isVirtual && (
                                                <div className="flex items-center gap-1.5 bg-gray-800/40/20 px-3 py-1 rounded-full text-content-primary text-[10px] font-bold tracking-wider">
                                                    <Smartphone className="w-3 h-3" /> VIRTUAL
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Brand */}
                                        <div className="absolute top-6 right-6 text-content-primary text-xl font-black italic tracking-tighter opacity-80">
                                            {flag.logo}
                                        </div>

                                        {/* Card Number & Info */}
                                        <div className="relative z-10 mt-auto pt-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <button onClick={() => setShowNumbers(prev => ({ ...prev, [card.id]: !prev[card.id] }))} className="text-content-primary/60 hover:text-content-primary transition-colors bg-gray-800/40/10 p-1.5 rounded-lg ">
                                                    {showNumbers[card.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            <p className="text-content-primary text-lg sm:text-xl font-mono tracking-[0.2em] mb-4 drop-shadow-lg shadow-black/10">
                                                {showNumbers[card.id] ? card.number : `**** **** **** ${card.number.slice(-4)}`}
                                            </p>

                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-content-primary/60 text-[8px] uppercase tracking-widest mb-0.5">Cardholder Name</p>
                                                    <p className="text-content-primary text-sm font-bold tracking-wider uppercase drop-shadow-lg shadow-black/10">{card.name}</p>
                                                </div>
                                                {showNumbers[card.id] && (
                                                    <div className="text-right flex gap-4">
                                                        <div>
                                                            <p className="text-content-primary/60 text-[8px] uppercase tracking-widest mb-0.5">Exp</p>
                                                            <p className="text-content-primary text-xs font-mono font-bold">{card.exp}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-content-primary/60 text-[8px] uppercase tracking-widest mb-0.5">CVV</p>
                                                            <p className="text-content-primary text-xs font-mono font-bold">{card.cvv}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="tech-card mt-[-20px] pt-8 pb-5 px-5 rounded-3xl border-t-0 rounded-t-none relative z-0 bg-[var(--bg-[var(--bg-elevated)])]/80 backdrop-blur-md">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => toggleLock(card.id)} className={`p-2.5 rounded-xl transition-all border shadow-sm ${card.isLocked ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-[var(--bg-surface)] text-gray-500 hover:text-[var(--text-primary)] border-[var(--border-subtle)]'}`}>
                                                    {card.isLocked ? <Lock className="w-4.5 h-4.5" /> : <Unlock className="w-4.5 h-4.5" />}
                                                </button>
                                                <button onClick={() => handleDelete(card.id)} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:scale-105 transition-all">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border ${due.color}`}>
                                                <DueIcon className="w-3.5 h-3.5" />
                                                {due.label}
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                                <span>Consumo</span>
                                                <span className="text-[var(--text-primary)]">{fmt(card.used)} <span className="opacity-40 font-normal">/ {fmt(card.limit)}</span></span>
                                            </div>
                                            <div className="h-2 bg-gray-800/40 dark:bg-black/30 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} className={`h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-brand-primary'}`} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lock Overlay */}
                                    {card.isLocked && (
                                        <div className="absolute inset-x-0 top-0 h-56 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl">
                                            <div className="bg-gray-800/40/10 border border-[var(--border)] px-6 py-3 rounded-2xl flex flex-col items-center gap-2 shadow-elevated">
                                                <Lock className="w-8 h-8 text-content-primary" />
                                                <span className="text-content-primary font-bold tracking-wider text-sm">CARTÃO BLOQUEADO</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Card Modal */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 ">
                        <motion.form
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            onSubmit={handleAdd}
                            className={`\${tw.card} w-full max-w-md p-8 relative rounded-3xl`}
                        >
                            <button type="button" onClick={() => setShowAdd(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-gray-800/40 dark:bg-[var(--bg-surface)] text-gray-500 hover:text-content-primary dark:hover:text-content-primary transition-colors"><X className="w-5 h-5" /></button>

                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-content-primary dark:text-content-primary tracking-tight leading-none mb-2">Emitir Cartão</h2>
                                <p className="text-gray-500 text-sm">Provisione um novo cartão físico ou virtual na sua conta.</p>
                            </div>

                            <div className="space-y-5">
                                {/* Tipo do Cartão Selecionador */}
                                <div className="flex bg-gray-800/40 dark:bg-[var(--bg-surface)] p-1 rounded-xl">
                                    <button type="button" onClick={() => setForm({ ...form, isVirtual: false })} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!form.isVirtual ? 'bg-gray-800/40 dark:bg-surface-800 shadow-lg shadow-black/10 text-content-primary dark:text-content-primary' : 'text-gray-500 hover:text-gray-300 dark:hover:text-gray-300'}`}>Físico</button>
                                    <button type="button" onClick={() => setForm({ ...form, isVirtual: true })} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all ${form.isVirtual ? 'bg-surface-primary from-brand-500 to-accent shadow-lg shadow-black/10 text-surface-950' : 'text-gray-500 hover:text-gray-300 dark:hover:text-gray-300'}`}>
                                        <Smartphone className="w-3.5 h-3.5" /> Virtual
                                    </button>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Nome no Cartão</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-800/30 dark:bg-surface-900 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl px-4 py-3 text-content-primary dark:text-content-primary text-sm outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 mt-1.5 transition-all shadow-lg shadow-black/10 dark:shadow-none" placeholder="Nome Impresso/Mnemonic" required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Bandeira</label>
                                        <select value={form.flag} onChange={e => setForm({ ...form, flag: e.target.value })} className="w-full bg-gray-800/30 dark:bg-surface-900 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl px-4 py-3 text-content-primary dark:text-content-primary text-sm outline-none mt-1.5 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all shadow-lg shadow-black/10 dark:shadow-none appearance-none">
                                            {FLAGS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Vencimento</label>
                                        <input type="number" min="1" max="31" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} className="w-full bg-gray-800/30 dark:bg-surface-900 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl px-4 py-3 text-content-primary dark:text-content-primary text-sm outline-none mt-1.5 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all shadow-lg shadow-black/10 dark:shadow-none" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Limite Aprovado</label>
                                        <input value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} className="w-full bg-gray-800/30 dark:bg-surface-900 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl px-4 py-3 text-content-primary dark:text-content-primary text-sm outline-none mt-1.5 shadow-lg shadow-black/10 dark:shadow-none font-mono" placeholder="5.000,00" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Fatura Atual (R$)</label>
                                        <input value={form.used} onChange={e => setForm({ ...form, used: e.target.value })} className="w-full bg-gray-800/30 dark:bg-surface-900 border border-[var(--border-subtle)]/40 dark:border-[var(--border)] rounded-xl px-4 py-3 text-content-primary dark:text-content-primary text-sm outline-none mt-1.5 shadow-lg shadow-black/10 dark:shadow-none font-mono" placeholder="0,00" />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button type="submit" className="w-full py-3.5 rounded-xl bg-surface-primary from-brand-600 via-brand-500 to-accent hover:from-brand-500 hover:to-accent text-surface-950 font-black tracking-wide shadow-card hover:shadow-card border border-brand-400/50 transition-all">
                                        Emitir e Provisionar Cartão
                                    </button>
                                </div>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
