import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, X, TrendingUp, Calendar, Sparkles } from 'lucide-react';

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const GOAL_ICONS = ['🏖️', '🏠', '🚗', '💰', '📚', '🎮', '✈️', '💍', '🏥', '📱'];
const GOAL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', target: '', current: '', icon: '🏖️', color: '#10b981', deadline: '', monthlyContribution: '' });

    useEffect(() => {
        const s = localStorage.getItem('sf_goals');
        if (s) {
            try { setGoals(JSON.parse(s)); } catch { /* */ }
        }
    }, []);

    const save = (g) => { setGoals(g); localStorage.setItem('sf_goals', JSON.stringify(g)); };

    const handleSubmit = (e) => {
        e.preventDefault();
        const goal = {
            id: editId || Date.now().toString(),
            name: form.name || 'Minha Meta',
            target: parseFloat(form.target.replace(/\./g, '').replace(',', '.')) || 1000,
            current: parseFloat(form.current.replace(/\./g, '').replace(',', '.')) || 0,
            icon: form.icon,
            color: form.color,
            deadline: form.deadline || null,
            monthlyContribution: parseFloat(form.monthlyContribution.replace(/\./g, '').replace(',', '.')) || 0,
            createdAt: editId ? goals.find(g => g.id === editId)?.createdAt : new Date().toISOString()
        };

        if (editId) {
            save(goals.map(g => g.id === editId ? goal : g));
        } else {
            save([...goals, goal]);
        }
        resetForm();
    };

    const resetForm = () => {
        setForm({ name: '', target: '', current: '', icon: '🏖️', color: '#10b981', deadline: '', monthlyContribution: '' });
        setShowAdd(false);
        setEditId(null);
    };

    const handleEdit = (goal) => {
        setForm({
            name: goal.name,
            target: goal.target.toString(),
            current: goal.current.toString(),
            icon: goal.icon,
            color: goal.color,
            deadline: goal.deadline || '',
            monthlyContribution: (goal.monthlyContribution || 0).toString()
        });
        setEditId(goal.id);
        setShowAdd(true);
    };

    const handleDelete = (id) => {
        if (!confirm('Excluir esta meta?')) return;
        save(goals.filter(g => g.id !== id));
    };

    const addContribution = (id, amount) => {
        save(goals.map(g => g.id === id ? { ...g, current: Math.min(g.current + amount, g.target) } : g));
    };

    const getMonthsToGoal = (goal) => {
        if (!goal.monthlyContribution || goal.monthlyContribution <= 0) return null;
        const remaining = goal.target - goal.current;
        if (remaining <= 0) return 0;
        return Math.ceil(remaining / goal.monthlyContribution);
    };

    const totalSaved = goals.reduce((s, g) => s + g.current, 0);
    const totalTarget = goals.reduce((s, g) => s + g.target, 0);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="w-6 h-6 text-blue-500" />
                        Metas Financeiras
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Defina objetivos e acompanhe seu progresso.</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nova Meta
                </button>
            </div>

            {/* Summary */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="glass-card">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Guardado</p>
                    <p className="text-2xl font-bold text-emerald-500">{fmt(totalSaved)}</p>
                </div>
                <div className="glass-card">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Objetivo Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(totalTarget)}</p>
                </div>
                <div className="glass-card">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Progresso Geral</p>
                    <p className="text-2xl font-bold text-blue-500">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</p>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all" style={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }} />
                    </div>
                </div>
            </div>

            {/* Goals Grid */}
            {goals.length === 0 ? (
                <div className="glass-card text-center py-12 border-dashed border-2 border-gray-200 dark:border-white/10 bg-transparent">
                    <Target className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
                    <h4 className="text-gray-900 dark:text-white font-medium mb-1">Nenhuma meta criada</h4>
                    <p className="text-gray-500 text-sm mb-4">Crie suas metas financeiras e acompanhe seu progresso!</p>
                    <button onClick={() => setShowAdd(true)} className="gradient-btn px-6 py-2 text-sm">Criar Primeira Meta</button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map(goal => {
                        const pct = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
                        const months = getMonthsToGoal(goal);
                        const completed = pct >= 100;
                        const circumference = 2 * Math.PI * 45;
                        const offset = circumference - (pct / 100) * circumference;

                        return (
                            <div key={goal.id} className={`glass-card relative overflow-hidden ${completed ? 'border-emerald-500/30' : ''}`}>
                                {completed && (
                                    <div className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> CONCLUIDA!
                                    </div>
                                )}

                                <div className="flex items-start gap-4 mb-4">
                                    {/* Progress ring */}
                                    <div className="relative w-20 h-20 flex-shrink-0">
                                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" className="stroke-gray-200 dark:stroke-white/10" />
                                            <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" strokeLinecap="round" stroke={goal.color} strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl">{goal.icon}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{goal.name}</h4>
                                        <p className="text-lg font-bold mt-1" style={{ color: goal.color }}>{Math.round(pct)}%</p>
                                        <p className="text-[10px] text-gray-500">{fmt(goal.current)} de {fmt(goal.target)}</p>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="space-y-2 text-[10px] text-gray-500">
                                    {goal.monthlyContribution > 0 && (
                                        <div className="flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                                            Aporte mensal: {fmt(goal.monthlyContribution)}
                                        </div>
                                    )}
                                    {months !== null && months > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-blue-500" />
                                            Previsao: {months} mes(es)
                                        </div>
                                    )}
                                    {goal.deadline && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-purple-500" />
                                            Prazo: {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-4">
                                    {!completed && (
                                        <button onClick={() => addContribution(goal.id, goal.monthlyContribution || 100)} className="flex-1 py-2 text-[10px] font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                                            + Aportar
                                        </button>
                                    )}
                                    <button onClick={() => handleEdit(goal)} className="flex-1 py-2 text-[10px] font-bold rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 transition-all">
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(goal.id)} className="p-2 rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleSubmit} className="glass-card w-full max-w-md p-6 space-y-4 animate-slide-up relative">
                        <button type="button" onClick={resetForm} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-500" /> {editId ? 'Editar Meta' : 'Nova Meta'}
                        </h2>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Nome da Meta</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" placeholder="Ex: Viagem, Reserva de emergencia..." />
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Icone</label>
                            <div className="flex gap-2 mt-1 flex-wrap">
                                {GOAL_ICONS.map(icon => (
                                    <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === icon ? 'bg-blue-500/20 border-2 border-blue-500 scale-110' : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:scale-105'}`}>
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Cor</label>
                            <div className="flex gap-2 mt-1">
                                {GOAL_COLORS.map(color => (
                                    <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                                        className={`w-8 h-8 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: color, ringColor: color }} />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Objetivo (R$)</label>
                                <input value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" placeholder="10.000,00" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Ja Guardou (R$)</label>
                                <input value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" placeholder="0,00" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Aporte Mensal (R$)</label>
                                <input value={form.monthlyContribution} onChange={e => setForm({ ...form, monthlyContribution: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" placeholder="500,00" />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Prazo (opcional)</label>
                                <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" />
                            </div>
                        </div>

                        <button type="submit" className="gradient-btn w-full py-3 text-sm font-bold">{editId ? 'Salvar Alteracoes' : 'Criar Meta'}</button>
                    </form>
                </div>
            )}
        </div>
    );
}
