import { tw } from '@/lib/theme';
import { useState, useEffect, useMemo } from 'react';
import { detectSubscriptions } from '../lib/detectSubscriptions';
import { useTransactions } from '../hooks/useTransactions';
import { CalendarDays, Plus, Trash2, X, AlertTriangle, CheckCircle, Clock, RefreshCw, ArrowUpRight, ArrowDownRight, Bot, Sparkles } from 'lucide-react';

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const RECURRENCE_OPTIONS = [
    { id: 'none', label: 'Sem repetição' },
    { id: 'monthly', label: 'Mensal' },
    { id: 'weekly', label: 'Semanal' },
    { id: 'yearly', label: 'Anual' },
];

export default function Bills() {
    const { transactions } = useTransactions();
    const [bills, setBills] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, paid, overdue, subscriptions
    const [form, setForm] = useState({
        description: '', amount: '', dueDate: '', type: 'expense', recurrence: 'none', category: 'geral'
    });

    useEffect(() => {
        const s = localStorage.getItem('sf_bills');
        if (s) setBills(JSON.parse(s));
    }, []);

    const save = (b) => { setBills(b); localStorage.setItem('sf_bills', JSON.stringify(b)); };

    const handleAdd = (e) => {
        e.preventDefault();
        const bill = {
            id: Date.now().toString(),
            description: form.description || 'Conta',
            amount: parseFloat(form.amount.replace(/\./g, '').replace(',', '.')) || 0,
            dueDate: form.dueDate || new Date().toISOString().split('T')[0],
            type: form.type,
            recurrence: form.recurrence,
            category: form.category,
            paid: false,
            createdAt: new Date().toISOString()
        };
        save([...bills, bill]);
        setForm({ description: '', amount: '', dueDate: '', type: 'expense', recurrence: 'none', category: 'geral' });
        setShowAdd(false);
    };

    const togglePaid = (id) => {
        save(bills.map(b => b.id === id ? { ...b, paid: !b.paid, paidAt: !b.paid ? new Date().toISOString() : null } : b));
    };

    const handleDelete = (id) => {
        save(bills.filter(b => b.id !== id));
    };

    const getStatus = (bill) => {
        if (bill.paid) return { label: 'Pago', color: 'text-brand-glow bg-brand-primary/10 border-brand-primary/20', icon: CheckCircle };
        const today = new Date().toISOString().split('T')[0];
        if (bill.dueDate < today) return { label: 'Vencida', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: AlertTriangle };
        const diff = Math.ceil((new Date(bill.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (diff <= 3) return { label: `Vence em ${diff}d`, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: Clock };
        return { label: 'Pendente', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Clock };
    };

    const filtered = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        let list = [...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        if (filter === 'pending') list = list.filter(b => !b.paid && b.dueDate >= today);
        if (filter === 'paid') list = list.filter(b => b.paid);
        if (filter === 'overdue') list = list.filter(b => !b.paid && b.dueDate < today);
        return list;
    }, [bills, filter]);

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const pending = bills.filter(b => !b.paid);
        const overdue = pending.filter(b => b.dueDate < today);
        const totalPending = pending.reduce((s, b) => s + b.amount, 0);
        const totalOverdue = overdue.reduce((s, b) => s + b.amount, 0);
        const upcoming = pending.filter(b => {
            const diff = Math.ceil((new Date(b.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            return diff >= 0 && diff <= 7;
        });

        const subscriptions = detectSubscriptions(transactions);
        const totalYearlySubs = subscriptions.reduce((s, b) => s + b.annualCost, 0);

        return { pending: pending.length, overdue: overdue.length, totalPending, totalOverdue, upcoming: upcoming.length, subscriptions, totalYearlySubs };
    }, [bills, transactions]);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2">
                        <CalendarDays className="w-6 h-6 text-blue-500" />
                        Contas e Recorrências
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie suas faturas, dívidas e monitore assinaturas ativas.</p>
                </div>
                {filter !== 'subscriptions' && (
                    <button onClick={() => setShowAdd(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nova Conta
                    </button>
                )}
            </div>

            {/* Alert banners */}
            {stats.overdue > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-red-400">{stats.overdue} conta(s) vencida(s)!</p>
                        <p className="text-xs text-red-300/70">Atraso acumulado: {fmt(stats.totalOverdue)}</p>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in">
                <div className="tech-card p-5 text-center border-[var(--border-subtle)]">
                    <p className="text-2xl font-black text-[var(--text-primary)]">{stats.pending}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Pendentes</p>
                </div>
                <div className="tech-card p-5 text-center border-red-500/20 bg-red-500/5">
                    <p className="text-2xl font-black text-red-500">{stats.overdue}</p>
                    <p className="text-[10px] text-red-500/60 uppercase font-black tracking-widest mt-1">Vencidas</p>
                </div>
                <div className="pastel-card p-5 text-center border-brand-primary/20 bg-brand-primary/5 hover:scale-105 transition-transform cursor-pointer group" onClick={() => setFilter('subscriptions')}>
                    <p className={`text-2xl font-black flex items-center justify-center gap-1.5 transition-colors ${filter === 'subscriptions' ? 'text-brand-primary' : 'text-[var(--text-primary)] group-hover:text-brand-primary'}`}>
                        <Sparkles className={`w-5 h-5 ${filter === 'subscriptions' ? 'text-brand-primary' : 'text-brand-primary/50 group-hover:text-brand-primary'}`} />
                        {stats.subscriptions.length}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Assinaturas</p>
                </div>
                <div className="tech-card p-5 text-center border-blue-500/20 bg-blue-500/5">
                    <p className="text-2xl font-black text-blue-500">{fmt(stats.totalPending)}</p>
                    <p className="text-[10px] text-blue-500/60 uppercase font-black tracking-widest mt-1">A Pagar</p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap pb-2">
                {[
                    { id: 'all', label: 'Todas' },
                    { id: 'pending', label: 'Pendentes' },
                    { id: 'overdue', label: 'Vencidas' },
                    { id: 'paid', label: 'Pagas' },
                    { id: 'subscriptions', label: '🛡️ Kill-Switch' },
                ].map(f => (
                    <button key={f.id} onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f.id ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' : 'bg-gray-800/30 dark:bg-[var(--bg-surface)] text-gray-500 border border-[var(--border-subtle)]/40 hover:border-blue-500/30'}`}
                    >{f.label}</button>
                ))}
            </div>

            {/* List Views */}
            {filter === 'subscriptions' ? (
                <div className="space-y-6 animate-in">
                    <div className="pastel-card p-6 border-l-4 border-l-red-500 relative overflow-hidden bg-black/40">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Bot className="w-48 h-48 text-red-500" />
                        </div>
                        <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2 relative z-10 mb-2 uppercase tracking-widest">
                            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" /> Sub-Tracker Ativado
                        </h2>
                        <p className="text-sm text-gray-300 relative z-10 max-w-2xl leading-relaxed">
                            Detectamos <strong className="text-red-400 font-bold">{stats.subscriptions.length} assinaturas recorrentes</strong>.
                            Gasto anual estimado: <strong className="text-red-500 font-bold bg-red-500/20 px-2 py-0.5 rounded">{fmt(stats.totalYearlySubs)}</strong>.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 animate-in">
                        {stats.subscriptions.map((sub, i) => (
                            <div key={i} className={`tech-card p-6 transition-all group cursor-default relative overflow-hidden ${sub.hasIncreasedPrice ? 'border-red-500/50' : 'border-[var(--border-subtle)]'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-inner">
                                            {sub.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-[var(--text-primary)] capitalize text-lg tracking-tight">{sub.name}</p>
                                            <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1">
                                                <RefreshCw className="w-3 h-3 text-brand-primary" /> {sub.frequency}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-[var(--text-primary)] text-2xl">{fmt(sub.amount)}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">/ {sub.frequency === 'Mensal' ? 'mês' : 'ano'}</p>
                                    </div>
                                </div>
                                <button className="w-full py-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-500 font-black text-sm uppercase tracking-widest transition-all">
                                    Derrubar Assinatura
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <div className="tech-card text-center py-12 border-dashed border-2 border-[var(--border-subtle)]/40 bg-transparent">
                            <CalendarDays className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
                            <p className="text-gray-500 text-sm">Nenhuma conta encontrada nesta categoria.</p>
                        </div>
                    ) : (
                        filtered.map(bill => {
                            const status = getStatus(bill);
                            const StatusIcon = status.icon;
                            return (
                                <div key={bill.id} className="tech-card p-4 flex items-center gap-4 hover:border-blue-500/30 transition-all group">
                                    <button onClick={() => togglePaid(bill.id)}
                                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all shadow-inner ${bill.paid ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] group-hover:border-blue-500'}`}>
                                        {bill.paid ? <CheckCircle className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] group-hover:bg-blue-500 transition-colors" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-black tracking-tight ${bill.paid ? 'line-through text-gray-500' : 'text-[var(--text-primary)]'}`}>{bill.description}</p>
                                            {bill.recurrence !== 'none' && (
                                                <span className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center gap-1">
                                                    <RefreshCw className="w-2.5 h-2.5" /> {RECURRENCE_OPTIONS.find(r => r.id === bill.recurrence)?.label}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1 font-bold uppercase tracking-wider">
                                            <CalendarDays className="w-3.5 h-3.5 opacity-50" /> {new Date(bill.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className={`text-base font-black flex items-center justify-end gap-1.5 ${bill.type === 'income' ? 'text-brand-primary' : 'text-[var(--text-primary)]'}`}>
                                                {bill.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                                                {fmt(bill.amount)}
                                            </p>
                                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border shadow-sm ${status.color} inline-flex items-center gap-1 mt-1`}>
                                                <StatusIcon className="w-2.5 h-2.5" /> {status.label}
                                            </span>
                                        </div>
                                        <div className="w-px h-10 bg-[var(--border-subtle)] mx-1"></div>
                                        <button onClick={() => handleDelete(bill.id)} className="p-2.5 rounded-xl text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Add Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 animate-fade-in">
                    <form onSubmit={handleAdd} className="tech-card w-full max-w-md p-6 space-y-4 animate-slide-up relative bg-gray-800/40 dark:bg-surface-900 border border-[var(--border-subtle)]/40">
                        <button type="button" onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-500 hover:text-[var(--text-primary)] transition-colors"><X className="w-5 h-5" /></button>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 mb-6"><CalendarDays className="w-5 h-5 text-blue-500" /> Nova Conta / Receita</h2>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Descrição</label>
                            <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-gray-800/30 dark:bg-black/20 border border-[var(--border-subtle)]/40 rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mt-1 transition-all" placeholder="Ex: Aluguel, Provedor Internet..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Valor (R$)</label>
                                <input required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full bg-gray-800/30 dark:bg-black/20 border border-[var(--border-subtle)]/40 rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mt-1 transition-all" placeholder="125,90" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Vencimento</label>
                                <input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full bg-gray-800/30 dark:bg-black/20 border border-[var(--border-subtle)]/40 rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mt-1 transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Tipo de Fluxo</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <button type="button" onClick={() => setForm({ ...form, type: 'expense' })}
                                        className={`w-full py-2.5 text-xs font-bold rounded-xl border transition-all ${form.type === 'expense' ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-tech-card' : 'bg-gray-800/30 dark:bg-[var(--bg-surface)] border-[var(--border-subtle)]/40 text-gray-500 hover:bg-gray-800/40'}`}>
                                        SAÍDA
                                    </button>
                                    <button type="button" onClick={() => setForm({ ...form, type: 'income' })}
                                        className={`w-full py-2.5 text-xs font-bold rounded-xl border transition-all ${form.type === 'income' ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-tech-card' : 'bg-gray-800/30 dark:bg-[var(--bg-surface)] border-[var(--border-subtle)]/40 text-gray-500 hover:bg-gray-800/40'}`}>
                                        ENTRADA
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Recorrência</label>
                                <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })} className="w-full bg-gray-800/30 dark:bg-black/20 border border-[var(--border-subtle)]/40 rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mt-1 transition-all">
                                    {RECURRENCE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="gradient-btn w-full py-3.5 mt-4 text-sm font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 rounded-xl">Registrar</button>
                    </form>
                </div>
            )}
        </div>
    );
}
