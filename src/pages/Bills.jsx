import { useState, useEffect, useMemo } from 'react';
import { detectSubscriptions } from '../lib/detectSubscriptions';
import { useTransactions } from '../hooks/useTransactions';
import { CalendarDays, Plus, Trash2, X, AlertTriangle, CheckCircle, Clock, RefreshCw, ArrowUpRight, ArrowDownRight, Bot, Sparkles } from 'lucide-react';

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const RECURRENCE_OPTIONS = [
    { id: 'none', label: 'Sem repeticao' },
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
        if (bill.paid) return { label: 'Pago', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle };
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
                        <p className="text-xs text-red-300/70">Total em atraso: {fmt(stats.totalOverdue)}</p>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Pendentes</p>
                </div>
                <div className="glass-card text-center">
                    <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Vencidas</p>
                </div>
                <div className="glass-card text-center hover:border-purple-500/30 transition-all cursor-pointer group" onClick={() => setFilter('subscriptions')}>
                    <p className={`text-2xl font-bold flex items-center justify-center gap-1 transition-colors ${filter === 'subscriptions' ? 'text-purple-500' : 'text-gray-900 dark:text-white group-hover:text-purple-500'}`}>
                        <Sparkles className={`w-5 h-5 ${filter === 'subscriptions' ? 'text-purple-500' : 'text-purple-500/50 group-hover:text-purple-500'} transition-colors`} />
                        {stats.subscriptions.length}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Assinaturas Info</p>
                </div>
                <div className="glass-card text-center">
                    <p className="text-2xl font-bold text-blue-500">{fmt(stats.totalPending)}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Total a Pagar</p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap pb-2">
                {[
                    { id: 'all', label: 'Todas' },
                    { id: 'pending', label: 'Pendentes' },
                    { id: 'overdue', label: 'Vencidas' },
                    { id: 'paid', label: 'Pagas' },
                    { id: 'subscriptions', label: 'Assinaturas Inteligentes ✨' },
                ].map(f => (
                    <button key={f.id} onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f.id ? (f.id === 'subscriptions' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30') : 'bg-gray-50 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 dark:hover:bg-white/10'}`}
                    >{f.label}</button>
                ))}
            </div>

            {/* List Views */}
            {filter === 'subscriptions' ? (
                <div className="space-y-4 animate-fade-in">
                    <div className="glass-card p-4 sm:p-5 border-l-4 border-l-purple-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Bot className="w-32 h-32" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 relative z-10">
                            <Bot className="w-5 h-5 text-purple-500" /> Insight do Assistente
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 relative z-10 max-w-2xl leading-relaxed">
                            A inteligência do Hub varreu suas transações e detectou <strong className="text-purple-600 dark:text-purple-400">{stats.subscriptions.length} assinaturas constantes</strong>.
                            Somadas, elas removem <strong className="text-red-500">{fmt(stats.totalYearlySubs)} do seu patrimônio por ano</strong>.
                            Revisá-las e cancelar as não-utilizadas é o {'"caminho fácil"'} para poupar dinheiro.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {stats.subscriptions.map((sub, i) => (
                            <div key={i} className="glass-card p-5 hover:border-purple-500/30 transition-all group hover:shadow-lg hover:shadow-purple-500/5 cursor-default relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 font-extrabold text-xl shadow-inner border border-purple-500/20">
                                            {sub.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white capitalize text-base">{sub.name}</p>
                                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 mt-0.5">
                                                <RefreshCw className="w-3 h-3" /> Cobrança {sub.frequency}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white text-lg">{fmt(sub.amount)}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">/ {sub.frequency === 'Mensal' ? 'mês' : 'ano'}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-5">
                                    <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100 dark:border-white/5">
                                        <span className="text-gray-500 font-medium tracking-wide">Previsão Renovação</span>
                                        <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5"><CalendarDays className="w-3 h-3 text-gray-400" /> {new Date(sub.nextRenewal).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs py-1">
                                        <span className="text-gray-500 font-medium tracking-wide">Impacto do Recurso</span>
                                        <span className="font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">{fmt(sub.annualCost)} / ano</span>
                                    </div>
                                </div>

                                <div className="text-[10px] text-gray-400 text-center font-medium bg-gray-50 dark:bg-white/5 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
                                    Convicção baseada em <strong className="text-gray-600 dark:text-gray-300">{sub.chargeCount}</strong> pagamentos repetidos.
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.length === 0 ? (
                        <div className="glass-card text-center py-12 border-dashed border-2 border-gray-200 dark:border-white/10 bg-transparent">
                            <CalendarDays className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
                            <p className="text-gray-500 text-sm">Nenhuma conta encontrada nesta categoria.</p>
                        </div>
                    ) : filtered.map(bill => {
                        const status = getStatus(bill);
                        const StatusIcon = status.icon;
                        return (
                            <div key={bill.id} className={`glass-card flex items-center gap-4 ${bill.paid ? 'opacity-60' : ''}`}>
                                <button onClick={() => togglePaid(bill.id)}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${bill.paid ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-gray-300 dark:border-white/20 hover:border-blue-500'}`}>
                                    {bill.paid && <CheckCircle className="w-4 h-4" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm font-bold ${bill.paid ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>{bill.description}</p>
                                        {bill.recurrence !== 'none' && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center gap-1">
                                                <RefreshCw className="w-2.5 h-2.5" /> {RECURRENCE_OPTIONS.find(r => r.id === bill.recurrence)?.label}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                                        <CalendarDays className="w-3 h-3 text-gray-400" /> {new Date(bill.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className={`text-sm font-bold flex items-center justify-end gap-1 ${bill.type === 'income' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                                            {bill.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                                            {fmt(bill.amount)}
                                        </p>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${status.color} inline-flex items-center gap-1 mt-1`}>
                                            <StatusIcon className="w-2.5 h-2.5" /> {status.label}
                                        </span>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200 dark:bg-white/10 mx-1"></div>
                                    <button onClick={() => handleDelete(bill.id)} className="p-2 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleAdd} className="glass-card w-full max-w-md p-6 space-y-4 animate-slide-up relative bg-white dark:bg-surface-900 border border-gray-200 dark:border-white/10">
                        <button type="button" onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6"><CalendarDays className="w-5 h-5 text-blue-500" /> Nova Conta / Receita</h2>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Descrição</label>
                            <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mt-1 transition-all" placeholder="Ex: Aluguel, Provedor Internet..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Valor (R$)</label>
                                <input required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mt-1 transition-all" placeholder="125,90" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Vencimento</label>
                                <input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mt-1 transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Tipo de Fluxo</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <button type="button" onClick={() => setForm({ ...form, type: 'expense' })}
                                        className={`w-full py-2.5 text-xs font-bold rounded-xl border transition-all ${form.type === 'expense' ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                                        SAÍDA
                                    </button>
                                    <button type="button" onClick={() => setForm({ ...form, type: 'income' })}
                                        className={`w-full py-2.5 text-xs font-bold rounded-xl border transition-all ${form.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                                        ENTRADA
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Recorrência Automática</label>
                                <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mt-1 transition-all">
                                    {RECURRENCE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="gradient-btn w-full py-3.5 mt-4 text-sm font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 rounded-xl transition-shadow">Registrar</button>
                    </form>
                </div>
            )}
        </div>
    );
}
