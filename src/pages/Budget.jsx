import { tw } from '@/lib/theme';
import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PiggyBank, Plus, X, AlertTriangle, CheckCircle, Edit3, Trash2, Loader2, TrendingUp, TrendingDown, Target } from 'lucide-react';
import categoriesData from '../data/data.json';
import { CurrencyInput } from '../components/CurrencyInput';
import { motion } from 'framer-motion';

const categoryConfig = categoriesData.categories;

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function Budget() {
    const { user } = useAuth();
    const { transactions } = useTransactions();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ category: '', limit: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;
        async function fetchBudgets() {
            setLoading(true);
            try {
                const { data } = await supabase.from('budgets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
                if (data) setBudgets(data.map(b => ({ id: b.id, category: b.category, limit: b.amount })));
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        }
        fetchBudgets();
    }, [user]);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const spending = useMemo(() => {
        const result = {};
        transactions.filter(t => t.type === 'expense' && t.date?.startsWith(currentMonth)).forEach(t => {
            const cat = t.category || 'outros';
            result[cat] = (result[cat] || 0) + Math.abs(t.amount);
        });
        return result;
    }, [transactions, currentMonth]);

    const budgetStats = useMemo(() => {
        return budgets.map(b => {
            const spent = spending[b.category] || 0;
            const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
            return { ...b, spent, pct, remaining: b.limit - spent };
        });
    }, [budgets, spending]);

    const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = budgets.reduce((s, b) => s + (spending[b.category] || 0), 0);
    const remainingTotal = totalBudget - totalSpent;
    const usagePct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const limitVal = typeof form.limit === 'string' ? parseFloat(form.limit.replace(/\./g, '').replace(',', '.')) : form.limit;
            const payload = { user_id: user.id, category: form.category, amount: limitVal, name: form.category };
            if (editId) await supabase.from('budgets').update(payload).eq('id', editId);
            else await supabase.from('budgets').insert([payload]);
            window.location.reload();
        } catch (err) { console.error(err); }
        setSaving(false);
    };

    const handleEdit = (b) => {
        setEditId(b.id);
        setForm({ category: b.category, limit: b.limit.toString() });
        setShowAdd(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Excluir orçamento?')) {
            await supabase.from('budgets').delete().eq('id', id);
            setBudgets(budgets.filter(b => b.id !== id));
        }
    };

    const availableCategories = Object.keys(categoryConfig).filter(c => !budgets.some(b => b.category === c) || (editId && budgets.find(b => b.id === editId)?.category === c));

    return (
        <div className="py-6 space-y-8 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <PiggyBank className="w-6 h-6 text-pink-500" />
                        Orçamento Mensal
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Controle seus gastos por categoria.</p>
                </div>
                <button onClick={() => { setEditId(null); setShowAdd(true); }} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Novo Limite
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in">
                <div className="tech-card p-5 border-[var(--border-subtle)] bg-brand-primary/5">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-brand-primary" /> Sugerido
                    </p>
                    <p className="text-2xl font-black text-brand-primary">{fmt(totalBudget)}</p>
                </div>
                <div className="tech-card p-5 border-red-500/10 bg-red-500/5">
                    <p className="text-[10px] text-red-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Gasto Atual
                    </p>
                    <p className="text-2xl font-black text-red-500">{fmt(totalSpent)}</p>
                </div>
                <div className="pastel-card p-5 border-brand-primary/20 bg-brand-primary/5">
                    <p className="text-[10px] text-brand-primary uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" /> Disponível
                    </p>
                    <p className={`text-2xl font-black ${remainingTotal >= 0 ? 'text-brand-glow' : 'text-red-400'}`}>{fmt(remainingTotal)}</p>
                </div>
                <div className="tech-card p-5 border-indigo-500/20 bg-indigo-500/5">
                    <p className="text-[10px] text-indigo-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Utilização
                    </p>
                    <p className="text-2xl font-black text-indigo-500">{usagePct}%</p>
                </div>
            </div>

            {/* Budget Items */}
            {loading ? (
                <div className="flex justify-center py-20 text-brand-primary"><Loader2 className="w-10 h-10 animate-spin" /></div>
            ) : budgets.length === 0 ? (
                <div className="tech-card text-center py-16 border-dashed border-2 border-[var(--border-subtle)]/40 bg-transparent cursor-pointer" onClick={() => setShowAdd(true)}>
                    <PiggyBank className="w-12 h-12 text-pink-500/30 mx-auto mb-4" />
                    <h4 className="text-[var(--text-primary)] font-black">Nenhum orçamento ainda</h4>
                    <p className="text-gray-500 text-sm">Defina limites para não perder o controle.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {budgetStats.map(b => {
                        const cat = categoryConfig[b.category] || { label: b.category, icon: '📦' };
                        return (
                            <div key={b.id} className="tech-card p-5 border-[var(--border-subtle)] hover:border-brand-primary/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5"><div className="text-4xl">{cat.icon}</div></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-inner">{cat.icon}</div>
                                        <div>
                                            <h3 className="font-black text-[var(--text-primary)] text-base tracking-tight uppercase">{cat.label}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Limite: {fmt(b.limit)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button onClick={() => handleEdit(b)} className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-gray-500 hover:text-brand-primary transition-all"><Edit3 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(b.id)} className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-end text-xs font-black uppercase tracking-widest">
                                        <span className="text-gray-500">Gasto: {fmt(b.spent)}</span>
                                        <span className={`text-[10px] ${b.remaining >= 0 ? 'text-brand-glow' : 'text-red-400'}`}>
                                            {b.remaining >= 0 ? `Sobra ${fmt(b.remaining)}` : `Falta ${fmt(Math.abs(b.remaining))}`}
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-gray-800/40 dark:bg-black/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(b.pct, 100)}%` }} className={`h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] ${b.pct > 100 ? 'bg-red-500' : b.pct > 80 ? 'bg-yellow-500' : 'bg-brand-primary'}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
                    <div className="tech-card w-full max-w-md p-6 bg-gray-800/40 border border-white/5 shadow-2xl">
                        <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-500"><X className="w-5 h-5" /></button>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">{editId ? 'Editar Limite' : 'Novo Orçamento'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)]">
                                <option value="">Selecione Categoria</option>
                                {availableCategories.map(c => <option key={c} value={c}>{categoryConfig[c]?.label || c}</option>)}
                            </select>
                            <CurrencyInput value={form.limit} onChange={val => setForm({ ...form, limit: val })} placeholder="Limite (R$)" />
                            <button type="submit" disabled={saving} className="gradient-btn w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">
                                {saving ? 'Salvando...' : 'Salvar Orçamento'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
