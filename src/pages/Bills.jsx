import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Plus, Trash2, X, AlertTriangle, CheckCircle, Clock, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
    const [bills, setBills] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, paid, overdue
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
        return { pending: pending.length, overdue: overdue.length, totalPending, totalOverdue, upcoming: upcoming.length };
    }, [bills]);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarDays className="w-6 h-6 text-blue-500" />
                        Contas e Recorrencias
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie suas contas a pagar e receber.</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nova Conta
                </button>
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
                <div className="glass-card text-center">
                    <p className="text-2xl font-bold text-yellow-500">{stats.upcoming}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Prox. 7 dias</p>
                </div>
                <div className="glass-card text-center">
                    <p className="text-2xl font-bold text-blue-500">{fmt(stats.totalPending)}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Total a Pagar</p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {[
                    { id: 'all', label: 'Todas' },
                    { id: 'pending', label: 'Pendentes' },
                    { id: 'overdue', label: 'Vencidas' },
                    { id: 'paid', label: 'Pagas' },
                ].map(f => (
                    <button key={f.id} onClick={() => setFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.id ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-50 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10 hover:border-blue-500/30'}`}
                    >{f.label}</button>
                ))}
            </div>

            {/* Bills list */}
            <div className="space-y-2">
                {filtered.length === 0 ? (
                    <div className="glass-card text-center py-12 border-dashed border-2 border-gray-200 dark:border-white/10 bg-transparent">
                        <CalendarDays className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-500 text-sm">Nenhuma conta encontrada.</p>
                    </div>
                ) : filtered.map(bill => {
                    const status = getStatus(bill);
                    const StatusIcon = status.icon;
                    return (
                        <div key={bill.id} className={`glass-card flex items-center gap-4 ${bill.paid ? 'opacity-60' : ''}`}>
                            <button onClick={() => togglePaid(bill.id)}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${bill.paid ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-gray-300 dark:border-white/20 hover:border-blue-500'}`}>
                                {bill.paid && <CheckCircle className="w-4 h-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm font-medium ${bill.paid ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{bill.description}</p>
                                    {bill.recurrence !== 'none' && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 flex items-center gap-0.5">
                                            <RefreshCw className="w-2.5 h-2.5" /> {RECURRENCE_OPTIONS.find(r => r.id === bill.recurrence)?.label}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                    <CalendarDays className="w-2.5 h-2.5" /> {new Date(bill.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className={`text-sm font-bold flex items-center gap-1 ${bill.type === 'income' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                                        {bill.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                                        {fmt(bill.amount)}
                                    </p>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${status.color} inline-flex items-center gap-0.5`}>
                                        <StatusIcon className="w-2.5 h-2.5" /> {status.label}
                                    </span>
                                </div>
                                <button onClick={() => handleDelete(bill.id)} className="p-1.5 rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleAdd} className="glass-card w-full max-w-md p-6 space-y-4 animate-slide-up relative">
                        <button type="button" onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 text-blue-500" /> Nova Conta</h2>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Descricao</label>
                            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500/50 mt-1" placeholder="Ex: Aluguel, Netflix, Luz..." />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Valor (R$)</label>
                                <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" placeholder="0,00" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Vencimento</label>
                                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Tipo</label>
                                <div className="flex gap-2 mt-1">
                                    <button type="button" onClick={() => setForm({ ...form, type: 'expense' })}
                                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${form.type === 'expense' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'}`}>
                                        A PAGAR
                                    </button>
                                    <button type="button" onClick={() => setForm({ ...form, type: 'income' })}
                                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${form.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'}`}>
                                        A RECEBER
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Repeticao</label>
                                <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1">
                                    {RECURRENCE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="gradient-btn w-full py-3 text-sm font-bold">Adicionar Conta</button>
                    </form>
                </div>
            )}
        </div>
    );
}
