import { useState, useEffect, useCallback } from 'react';
import { Target, Plus, Trash2, X, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import GoalThermometer from '../components/GoalThermometer';

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
    const [form, setForm] = useState({ name: '', target: '', current: '', icon: '🏖️', color: '#10b981', category: 'travel', deadline: '', monthlyContribution: '' });

    const loadGoals = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('financial_goals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error && error.code !== '42P01') {
                console.error("Erro ao carregar metas:", error);
            }
            if (data) {
                setGoals(data);
            }
        } catch (err) {
            console.error("Exceção ao carregar:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadGoals();
    }, [user, loadGoals]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            const payload = {
                user_id: user.id,
                name: form.name || 'Nova Meta',
                target_amount: parseFloat(form.target.replace(/\./g, '').replace(',', '.')) || 1000,
                current_amount: parseFloat(form.current.replace(/\./g, '').replace(',', '.')) || 0,
                icon: form.icon,
                color: form.color,
                category: form.category,
                target_date: form.deadline || null,
                monthly_contribution: parseFloat(form.monthlyContribution.replace(/\./g, '').replace(',', '.')) || 0,
            };

            if (editId) {
                await supabase.from('financial_goals').update(payload).eq('id', editId);
            } else {
                await supabase.from('financial_goals').insert([payload]);
            }

            await loadGoals();
            resetForm();
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar meta. Você rodou a migration `create_goals_schema.sql`?");
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', target: '', current: '', icon: '🏖️', color: '#10b981', category: 'other', deadline: '', monthlyContribution: '' });
        setShowAdd(false);
        setEditId(null);
    };

    const handleEdit = (goal) => {
        setForm({
            name: goal.name,
            target: goal.target_amount.toString(),
            current: goal.current_amount.toString(),
            icon: goal.icon,
            color: goal.color,
            category: goal.category,
            deadline: goal.target_date || '',
            monthlyContribution: (goal.monthly_contribution || 0).toString()
        });
        setEditId(goal.id);
        setShowAdd(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Excluir esta meta permanentemente?')) return;
        setSaving(true);
        try {
            await supabase.from('financial_goals').delete().eq('id', id);
            await loadGoals();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const addContribution = async (id, currentAmount, amountToAdd) => {
        try {
            const newAmount = currentAmount + amountToAdd;
            await supabase.from('financial_goals').update({ current_amount: newAmount }).eq('id', id);
            await supabase.from('goal_contributions').insert([{
                user_id: user.id, goal_id: id, amount: amountToAdd, source: 'manual'
            }]);
            await loadGoals();
        } catch (e) {
            console.error("Erro ao aportar:", e);
        }
    };

    // Derived logic for local fallback UI
    const getMonthsToGoal = (g) => {
        if (!g.monthly_contribution || g.monthly_contribution <= 0) return null;
        const remaining = g.target_amount - g.current_amount;
        if (remaining <= 0) return 0;
        return Math.ceil(remaining / g.monthly_contribution);
    };

    const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
    const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div className="relative overflow-hidden flex flex-col sm:flex-row items-center justify-between rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-teal-600 to-cyan-700 p-8 md:p-10 text-white shadow-[0_20px_50px_-15px_rgba(20,184,166,0.4)] border border-white/20 group perspective-1000">
                {/* Efeitos 3D Internos */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PG1hdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')] opacity-30" />
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-white/10 rounded-full mix-blend-overlay filter blur-[40px] opacity-60 group-hover:scale-125 transition-transform duration-1000 ease-out" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full mix-blend-color-dodge filter blur-[40px] opacity-60 group-hover:-translate-x-10 transition-transform duration-1000 ease-out delay-100" />

                <div className="relative z-10 flex-1 flex gap-5 items-center">
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md shadow-inner border border-white/20 group-hover:-translate-y-2 group-hover:rotate-6 transition-transform duration-500">
                        <Target className="w-12 h-12 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight drop-shadow-lg flex items-center gap-2">
                            Planejador de Metas
                        </h1>
                        <p className="text-brand-50 text-sm md:text-base font-medium max-w-xl leading-relaxed backdrop-blur-sm">
                            Use o modelo de <strong className="text-white drop-shadow-md">Goal-Based Wealth</strong> e alinhe aportes aos seus grandes sonhos.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadGoals} className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-500">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => setShowAdd(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2 font-bold shadow-lg shadow-brand-500/20">
                        <Plus className="w-4 h-4" /> Nova Meta
                    </button>
                </div>
            </div>

            {/* Summary Block */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="glass-card relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-500/10 rounded-full blur-xl group-hover:bg-brand-500/20 transition-all"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-brand-500" /> Total em Metas</p>
                    <p className="text-3xl font-black text-brand-600 dark:text-brand-400 drop-shadow-sm">{fmt(totalSaved)}</p>
                </div>
                <div className="glass-card relative">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Atingimento Alvo</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white drop-shadow-sm">{fmt(totalTarget)}</p>
                </div>
                <div className="glass-card relative">
                    <p className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">
                        <span>Eficiência</span>
                        <span className="text-blue-500">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</span>
                    </p>
                    <div className="mt-3 h-3 bg-gray-100 dark:bg-black/20 rounded-full overflow-hidden shadow-inner border border-gray-200 dark:border-white/5">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]" style={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }} />
                    </div>
                </div>
            </div>

            {/* Render Goals */}
            {loading ? (
                <div className="flex justify-center flex-col items-center py-20 text-brand-500">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p className="text-sm font-medium animate-pulse text-gray-500">Calculando trajetórias...</p>
                </div>
            ) : goals.length === 0 ? (
                <div className="glass-card text-center py-16 border-dashed border-2 border-gray-200 dark:border-white/10 bg-transparent hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => setShowAdd(true)}>
                    <Target className="w-16 h-16 text-brand-500/50 mx-auto mb-4 group-hover:scale-110 group-hover:text-brand-500 transition-all" />
                    <h4 className="text-lg text-gray-900 dark:text-white font-bold mb-2">Seu portfólio de metas está vazio</h4>
                    <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Use a inteligência baseada em objetivos para focar nas grandes faturas: viagens, carros, casas, ou sua liberdade.</p>
                    <button onClick={(e) => { e.stopPropagation(); setShowAdd(true); }} className="gradient-btn px-6 py-2.5 text-sm font-bold shadow-lg shadow-brand-500/30">Criar Primeira Meta</button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => (
                        <div key={goal.id} className="flex flex-col gap-3 group">
                            <GoalThermometer goal={{
                                ...goal,
                                months_remaining: getMonthsToGoal(goal)
                            }} />

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {goal.current_amount < goal.target_amount && (
                                    <button
                                        disabled={saving}
                                        onClick={() => addContribution(goal.id, Number(goal.current_amount), goal.monthly_contribution || 100)}
                                        className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                                        + Aportar
                                    </button>
                                )}
                                <button onClick={() => handleEdit(goal)} className="flex-1 py-2 text-xs font-bold rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 transition-all">
                                    Editar
                                </button>
                                <button disabled={saving} onClick={() => handleDelete(goal.id)} className="p-2 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleSubmit} className="glass-card w-full max-w-md p-6 space-y-4 animate-slide-up relative z-10 border border-white/10 shadow-2xl">
                        <button type="button" onClick={resetForm} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 p-1 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                            <Target className="w-6 h-6 text-brand-500" /> {editId ? 'Configurar Meta' : 'Plano de Atingimento'}
                        </h2>

                        <div>
                            <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">Motivador Principal (Nome)</label>
                            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" placeholder="Ex: Viagem Europa, Independência..." />
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">Ícone</label>
                            <div className="flex gap-2 flex-wrap">
                                {GOAL_ICONS.map(icon => (
                                    <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === icon ? 'bg-brand-500/20 border-2 border-brand-500 scale-110 shadow-sm' : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1 mt-2">Cor Tema</label>
                            <div className="flex gap-3">
                                {GOAL_COLORS.map(color => (
                                    <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                                        className={`w-6 h-6 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-125' : 'hover:scale-110 border border-white/20'}`}
                                        style={{ backgroundColor: color, ringColor: color }} />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">Alvo (R$)</label>
                                <input required value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="10.000,00" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">Já Guardou (R$)</label>
                                <input value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="0,00" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">Aporte Mensal (R$)</label>
                                <input required value={form.monthlyContribution} onChange={e => setForm({ ...form, monthlyContribution: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="500,00" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">Prazo (opcional)</label>
                                <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                            </div>
                        </div>

                        <button disabled={saving} type="submit" className="gradient-btn w-full py-3.5 text-sm font-bold shadow-lg shadow-brand-500/30 mt-4 outline-none disabled:opacity-75 disabled:cursor-not-allowed">
                            {saving ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : (editId ? 'Salvar Configuração' : 'Lançar Meta')}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
