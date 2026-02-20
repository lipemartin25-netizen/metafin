import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Plus, Trash2, X, Calendar, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const FLAGS = [
    { id: 'visa', name: 'Visa', color: '#1A1F71' },
    { id: 'mastercard', name: 'Mastercard', color: '#EB001B' },
    { id: 'elo', name: 'Elo', color: '#00A4E0' },
    { id: 'amex', name: 'American Express', color: '#006FCF' },
    { id: 'hipercard', name: 'Hipercard', color: '#822124' },
];

export default function CreditCards() {
    const [cards, setCards] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', flag: 'visa', limit: '', due: '10', used: '' });

    useEffect(() => {
        const s = localStorage.getItem('sf_credit_cards');
        if (s) setCards(JSON.parse(s));
    }, []);

    const save = (c) => { setCards(c); localStorage.setItem('sf_credit_cards', JSON.stringify(c)); };

    const handleAdd = (e) => {
        e.preventDefault();
        const card = {
            id: Date.now().toString(),
            name: form.name || 'Meu Cartao',
            flag: form.flag,
            limit: parseFloat(form.limit.replace(/\./g, '').replace(',', '.')) || 5000,
            dueDay: parseInt(form.due) || 10,
            used: parseFloat(form.used.replace(/\./g, '').replace(',', '.')) || 0,
            createdAt: new Date().toISOString(),
            invoices: []
        };
        save([...cards, card]);
        setForm({ name: '', flag: 'visa', limit: '', due: '10', used: '' });
        setShowAdd(false);
    };

    const handleDelete = (id) => {
        if (!confirm('Excluir este cartao?')) return;
        save(cards.filter(c => c.id !== id));
    };

    const totals = useMemo(() => {
        const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
        const totalUsed = cards.reduce((s, c) => s + c.used, 0);
        return { totalLimit, totalUsed, available: totalLimit - totalUsed };
    }, [cards]);

    const getDueStatus = (dueDay) => {
        const today = new Date().getDate();
        const diff = dueDay - today;
        if (diff < 0) return { label: 'Vencida', color: 'text-red-400 bg-red-500/10', icon: AlertTriangle };
        if (diff <= 3) return { label: `Vence em ${diff}d`, color: 'text-yellow-400 bg-yellow-500/10', icon: Calendar };
        return { label: `Dia ${dueDay}`, color: 'text-gray-400 bg-gray-500/10', icon: CheckCircle };
    };

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-purple-500" />
                        Cartoes de Credito
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Controle seus cartoes e faturas.</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Adicionar Cartao
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="glass-card">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Limite Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(totals.totalLimit)}</p>
                </div>
                <div className="glass-card">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fatura Atual</p>
                    <p className="text-2xl font-bold text-red-500">{fmt(totals.totalUsed)}</p>
                </div>
                <div className="glass-card">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Disponivel</p>
                    <p className="text-2xl font-bold text-emerald-500">{fmt(totals.available)}</p>
                    {totals.totalLimit > 0 && (
                        <div className="mt-2 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${(totals.totalUsed / totals.totalLimit) > 0.8 ? 'bg-red-500' : (totals.totalUsed / totals.totalLimit) > 0.5 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min((totals.totalUsed / totals.totalLimit) * 100, 100)}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Cards List */}
            {cards.length === 0 ? (
                <div className="glass-card text-center py-12 border-dashed border-2 border-gray-200 dark:border-white/10 bg-transparent">
                    <CreditCard className="w-12 h-12 text-purple-500 mx-auto mb-4 opacity-50" />
                    <h4 className="text-gray-900 dark:text-white font-medium mb-1">Nenhum cartao cadastrado</h4>
                    <p className="text-gray-500 text-sm mb-4">Adicione seus cartoes para controlar faturas e limites.</p>
                    <button onClick={() => setShowAdd(true)} className="gradient-btn px-6 py-2 text-sm">Adicionar Cartao</button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map(card => {
                        const flag = FLAGS.find(f => f.id === card.flag) || FLAGS[0];
                        const pct = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
                        const due = getDueStatus(card.dueDay);
                        const DueIcon = due.icon;

                        return (
                            <div key={card.id} className="glass-card relative overflow-hidden group">
                                {/* Card visual header */}
                                <div className="h-28 rounded-xl mb-4 p-4 flex flex-col justify-between relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${flag.color}, ${flag.color}cc)` }}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="flex justify-between items-start relative z-10">
                                        <span className="text-white/80 text-xs font-bold uppercase tracking-wider">{flag.name}</span>
                                        <button onClick={() => handleDelete(card.id)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-white font-bold text-lg">{card.name}</p>
                                        <p className="text-white/60 text-[10px] font-mono tracking-widest">**** **** **** {card.id.slice(-4)}</p>
                                    </div>
                                </div>

                                {/* Usage */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Fatura atual</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{fmt(card.used)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500">
                                        <span>{Math.round(pct)}% usado</span>
                                        <span>Limite: {fmt(card.limit)}</span>
                                    </div>

                                    <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${due.color}`}>
                                        <DueIcon className="w-3.5 h-3.5" />
                                        Vencimento: {due.label}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Card Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleAdd} className="glass-card w-full max-w-md p-6 space-y-4 animate-slide-up relative">
                        <button type="button" onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-purple-500" /> Novo Cartao</h2>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Nome do Cartao</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none focus:border-purple-500/50 mt-1" placeholder="Ex: Nubank Roxinho" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Bandeira</label>
                                <select value={form.flag} onChange={e => setForm({ ...form, flag: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1">
                                    {FLAGS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Dia Vencimento</label>
                                <input type="number" min="1" max="31" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Limite (R$)</label>
                                <input value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" placeholder="5.000,00" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Fatura Atual (R$)</label>
                                <input value={form.used} onChange={e => setForm({ ...form, used: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" placeholder="0,00" />
                            </div>
                        </div>

                        <button type="submit" className="gradient-btn w-full py-3 text-sm font-bold">Adicionar Cartao</button>
                    </form>
                </div>
            )}
        </div>
    );
}
