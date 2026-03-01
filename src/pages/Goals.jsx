import { tw } from '@/lib/theme';
import { useState, useEffect, useCallback } from 'react';
import { Target, Plus, Trash2, X, Loader2, RefreshCw, TrendingUp, Sparkles, LayoutGrid } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const GOAL_ICONS = ['🏖️', '🏠', '🚗', '💰', '📚', '🎮', '✈️', '💍', '🏥', '📱'];
const GOAL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Goals() {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', target: '', currentValue: '', icon: '🏖️', color: '#10b981', deadline: '' });

    const loadGoals = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('financial_goals').select('*').order('created_at', { ascending: false });
            if (data) setGoals(data.map(g => ({ ...g, saved: g.current_amount, target: g.target_amount, title: g.name, deadline: g.target_date })));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { loadGoals(); }, [user, loadGoals]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            const payload = {
                user_id: user.id,
                name: form.name,
                target_amount: parseFloat(form.target),
                current_amount: parseFloat(form.currentValue) || 0,
                icon: form.icon,
                color: form.color,
                target_date: form.deadline
            };
            if (editId) await supabase.from('financial_goals').update(payload).eq('id', editId);
            else await supabase.from('financial_goals').insert([payload]);
            await loadGoals();
            setShowAdd(false);
            setEditId(null);
            setForm({ name: '', target: '', currentValue: '', icon: '🏖️', color: '#10b981', deadline: '' });
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Excluir meta?')) return;
        await supabase.from('financial_goals').delete().eq('id', id);
        await loadGoals();
    };

    const totalSaved = goals.reduce((s, g) => s + Number(g.saved), 0);
    const totalTarget = goals.reduce((s, g) => s + Number(g.target), 0);
    const avgProgress = goals.length > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    return (
        <div className="py-6 space-y-8 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Target className="w-6 h-6 text-brand-primary" />
                        Metas Financeiras
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Transforme sonhos em planos concretos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadGoals} className="p-2.5 rounded-xl border border-[var(--border-subtle)]/40 hover:bg-gray-800/30 transition-colors text-gray-500">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => setShowAdd(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2 font-bold shadow-lg shadow-brand-500/20">
                        <Plus className="w-4 h-4" /> Nova Meta
                    </button>
                </div>
            </div>

            {/* Summary Block */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in">
                <div className="tech-card p-5 border-[var(--border-subtle)] bg-brand-primary/5">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-brand-primary" /> Total de Metas
                    </p>
                    <p className="text-3xl font-black text-brand-primary">{goals.length}</p>
                </div>
                <div className="tech-card p-5 border-[var(--border-subtle)]">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Valor Alvo
                    </p>
                    <p className="text-2xl font-black text-[var(--text-primary)]">{fmt(totalTarget)}</p>
                </div>
                <div className="pastel-card p-5 border-brand-primary/20 bg-brand-primary/5">
                    <p className="text-[10px] text-brand-primary uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Valor Guardado
                    </p>
                    <p className="text-2xl font-black text-brand-primary">{fmt(totalSaved)}</p>
                </div>
                <div className="tech-card p-5 border-indigo-500/20 bg-indigo-500/5">
                    <p className="text-[10px] text-indigo-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Progresso Médio
                    </p>
                    <p className="text-2xl font-black text-indigo-500">{avgProgress}%</p>
                </div>
            </div>

            {/* Render Goals */}
            {loading ? (
                <div className="flex justify-center py-20 text-brand-primary"><Loader2 className="w-10 h-10 animate-spin" /></div>
            ) : goals.length === 0 ? (
                <div className="tech-card text-center py-16 border-dashed border-2 border-[var(--border-subtle)]/40 bg-transparent cursor-pointer" onClick={() => setShowAdd(true)}>
                    <Target className="w-16 h-16 text-brand-500/30 mx-auto mb-4" />
                    <h4 className="text-[var(--text-primary)] font-black">Nenhuma meta ainda</h4>
                    <p className="text-gray-500 text-sm">Clique para planejar seu próximo grande passo.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {goals.map(goal => {
                        const pct = Math.round((goal.saved / goal.target) * 100) || 0;
                        return (
                            <div key={goal.id} className="tech-card p-6 border-[var(--border-subtle)] hover:border-brand-primary/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Target className="w-32 h-32" /></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-brand-primary/10 border border-brand-primary/20 shadow-inner">
                                            {goal.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[var(--text-primary)] text-lg tracking-tight uppercase">{goal.title}</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                                Vence em {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(goal.id)} className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-end text-xs font-black uppercase tracking-widest">
                                        <span className="text-gray-500">Progresso</span>
                                        <span className="text-[var(--text-primary)] text-sm">{pct}% <span className="text-[10px] text-gray-500 opacity-40">({fmt(goal.saved)})</span></span>
                                    </div>
                                    <div className="h-3 bg-gray-800/40 dark:bg-black/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] ${pct >= 100 ? 'bg-brand-primary' : 'bg-blue-500'}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
                    <div className="tech-card w-full max-w-md p-6 bg-gray-800/40 border border-white/5">
                        <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-500"><X className="w-5 h-5" /></button>
                        <h2 className="text-xl font-black text-[var(--text-primary)] mb-6">Nova Meta</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input required placeholder="Título da Meta" className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)]" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <input required type="number" placeholder="Valor Alvo" className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)]" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
                                <input required type="date" className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)]" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                            </div>
                            <button type="submit" disabled={saving} className="gradient-btn w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs">
                                {saving ? 'Salvando...' : 'Lançar Meta'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
