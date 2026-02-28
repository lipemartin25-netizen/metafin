import { tw } from '@/lib/theme';
// src/pages/Budget.jsx
import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PiggyBank, Plus, X, AlertTriangle, CheckCircle, Edit3, Trash2, Loader2 } from 'lucide-react';
import categoriesData from '../data/data.json';
import { CurrencyInput } from '../components/CurrencyInput';

const categoryConfig = categoriesData.categories;

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function Budget() {
    const { user } = useAuth();
    const { transactions } = useTransactions();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ category: '', limit: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchBudgets() {
            try {
                setLoading(true);
                setError(null);

                const { data, error: dbError } = await supabase
                    .from('budgets')
                    .select('*')
                    .eq('user_id', user?.id)
                    .order('created_at', { ascending: false });

                if (dbError) {
                    console.error('[Budgets] Supabase error:', dbError);
                    if (dbError.code === '42P01') {
                        console.warn('[Budgets] Tabela budgets não existe. Mostrando vazio.');
                        setBudgets([]);
                    } else {
                        setError(dbError.message);
                    }
                } else {
                    const mapped = (data || []).map(b => ({
                        id: b.id,
                        category: b.category,
                        limit: b.amount, // Numeric default for db float
                        savedAt: new Date(b.created_at).getTime()
                    }));
                    setBudgets(mapped);
                }
            } catch (err) {
                console.error('[Budgets] Unexpected error:', err);
                setError('Erro ao carregar orçamentos');
            } finally {
                setLoading(false);
            }
        }

        if (user?.id) {
            fetchBudgets();
        } else {
            setLoading(false);
        }
    }, [user?.id]);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const spending = useMemo(() => {
        const result = {};
        transactions.filter(t => t.type === 'expense' && t.date?.startsWith(currentMonth)).forEach(t => {
            const cat = t.category || 'outros';
            result[cat] = (result[cat] || 0) + Math.abs(t.amount);
        });
        return result;
    }, [transactions, currentMonth]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            const limitValue = typeof form.limit === 'string'
                ? parseFloat(form.limit.replace(/\./g, '').replace(',', '.'))
                : parseFloat(form.limit) || 0;

            if (editId) {
                const { error: dbError } = await supabase
                    .from('budgets')
                    .update({ category: form.category, amount: limitValue })
                    .eq('id', editId);

                if (dbError) throw dbError;

                setBudgets(budgets.map(b => b.id === editId ? { ...b, category: form.category, limit: limitValue } : b));
            } else {
                if (budgets.some(b => b.category === form.category)) {
                    alert('Já existe um orçamento para esta categoria!');
                    return;
                }

                const payload = {
                    user_id: user.id,
                    name: form.category,
                    category: form.category,
                    amount: limitValue,
                    period: 'monthly'
                };

                const { data, error: dbError } = await supabase
                    .from('budgets')
                    .insert(payload)
                    .select()
                    .single();

                if (dbError) throw dbError;

                setBudgets([...budgets, { id: data.id, category: data.category, limit: data.amount, savedAt: Date.now() }]);
            }
            setForm({ category: '', limit: '' });
            setShowAdd(false);
            setEditId(null);
        } catch (err) {
            console.error('Error saving budget', err);
            alert('Não foi possível salvar o orçamento. Verifique se a tabela foi criada no Supabase e tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (budget) => {
        const strVal = budget.limit.toFixed(2).replace('.', ',');
        setForm({ category: budget.category, limit: strVal });
        setEditId(budget.id);
        setShowAdd(true);
    };

    const handleDelete = async (id) => {
        const confirmMsg = confirm("Tem certeza que deseja excluir esse orçamento?");
        if (!confirmMsg) return;

        try {
            const { error: dbError } = await supabase
                .from('budgets')
                .delete()
                .eq('id', id);
            if (dbError) throw dbError;
            setBudgets(budgets.filter(b => b.id !== id));
        } catch (err) {
            console.error('Error deleting budget', err);
            alert('Erro ao excluir orçamento.');
        }
    };

    const availableCategories = Object.keys(categoryConfig).filter(
        c => !budgets.some(b => b.category === c) || (editId && budgets.find(b => b.id === editId)?.category === c)
    );

    const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = budgets.reduce((s, b) => s + (spending[b.category] || 0), 0);
    const overBudget = budgets.filter(b => (spending[b.category] || 0) > b.limit);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-brand-glow animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 animate-fade-in">
                <AlertTriangle className="w-12 h-12 text-red-500/70 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="gradient-btn px-4 py-2 rounded-lg">
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white dark:text-white flex items-center gap-2">
                        <PiggyBank className="w-6 h-6 text-pink-500" />
                        Orçamento Mensal
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Defina limites por categoria e controle seus gastos.</p>
                </div>
                <button onClick={() => { setEditId(null); setForm({ category: availableCategories[0] || '', limit: '' }); setShowAdd(true); }} className="gradient-btn px-4 py-2 h-[42px] text-sm flex items-center gap-2 rounded-xl transition-all">
                    <Plus className="w-4 h-4" /> Adicionar Limite
                </button>
            </div>

            {/* Alerts */}
            {overBudget.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-red-400">{overBudget.length} categoria(s) acima do orçamento!</p>
                        <p className="text-xs text-red-300/70">{overBudget.map(b => categoryConfig[b.category]?.label || b.category).join(', ')}</p>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className={`\${tw.card}`}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Orçamento Total</p>
                    <p className="text-2xl font-bold text-white dark:text-white">{fmt(totalBudget)}</p>
                </div>
                <div className={`\${tw.card}`}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gasto Este Mês</p>
                    <p className="text-2xl font-bold text-red-500">{fmt(totalSpent)}</p>
                </div>
                <div className={`\${tw.card}`}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Disponível</p>
                    <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-brand-primary' : 'text-red-500'}`}>{fmt(totalBudget - totalSpent)}</p>
                    {totalBudget > 0 && (
                        <div className="mt-2 h-2 bg-gray-800/50 dark:bg-gray-800/40/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${(totalSpent / totalBudget) > 0.9 ? 'bg-red-500' : (totalSpent / totalBudget) > 0.7 ? 'bg-yellow-500' : 'bg-brand-primary'}`}
                                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Budget Items */}
            {budgets.length === 0 ? (
                <div className={`\${tw.card} text-center py-12 border-dashed border-2 border-gray-700/40 dark:border-white/10 bg-transparent relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-pink-500/5 pointer-events-none" />
                    <PiggyBank className="w-12 h-12 text-pink-500 mx-auto mb-4 opacity-50 relative z-10" />
                    <h4 className="text-white dark:text-white font-medium mb-1 relative z-10">Nenhum orçamento definido</h4>
                    <p className="text-gray-500 text-sm mb-4 relative z-10">Defina limites de gastos por categoria para controlar suas finanças.</p>
                    <button onClick={() => { setForm({ category: availableCategories[0] || '', limit: '' }); setShowAdd(true); }} className="gradient-btn px-6 py-2.5 text-sm rounded-xl relative z-10 flex items-center gap-2 mx-auto">
                        <Plus className="w-4 h-4" /> Criar Orçamento
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {budgets.map(budget => {
                        const cat = categoryConfig[budget.category];
                        const spent = spending[budget.category] || 0;
                        const pct = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
                        const over = spent > budget.limit;
                        const remaining = budget.limit - spent;

                        return (
                            <div key={budget.id} className={`${tw.card} ${over ? 'border-red-500/30 bg-red-500/5' : ''}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${cat?.color || '#6b7280'}15` }}>
                                            {cat?.icon || '📦'}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white dark:text-white text-sm">{cat?.label || budget.category}</h4>
                                            <p className="text-[10px] text-gray-500">Limite: {fmt(budget.limit)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${over ? 'text-red-500' : 'text-white dark:text-white'}`}>{fmt(spent)}</p>
                                            <p className={`text-[10px] ${over ? 'text-red-400' : 'text-gray-500'}`}>
                                                {over ? (
                                                    <span className="flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Excedeu {fmt(Math.abs(remaining))}</span>
                                                ) : (
                                                    <span className="flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5 text-brand-primary" /> Sobra {fmt(remaining)}</span>
                                                )}
                                            </p>
                                        </div>
                                        <button onClick={() => handleEdit(budget)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDelete(budget.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="h-3 bg-gray-800/50 dark:bg-gray-800/40/10 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-brand-primary'}`}
                                        style={{ width: `${pct}%` }} />
                                </div>
                                <div className="flex justify-between mt-1.5 text-[10px] text-gray-500 flex-wrap">
                                    <span>{Math.round(pct)}% usado</span>
                                    <span>{fmt(budget.limit - spent > 0 ? budget.limit - spent : 0)} restante</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Adicionar/Editar */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-[#0d1424] border border-white/15 w-full max-w-sm rounded-[24px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.9)] animate-slide-up">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white tracking-tight">{editId ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
                                <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-gray-800/40/10 transition-all"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Categoria</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        required
                                        className="w-full bg-gray-800/40/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-brand-glow/50 focus:ring-1 focus:ring-brand-glow/50 outline-none transition-all appearance-none"
                                    >
                                        <option value="" disabled className="bg-[#0d1424] text-slate-500">Selecione uma categoria...</option>
                                        {availableCategories.map(c => (
                                            <option key={c} value={c} className="bg-[#0d1424] text-white">
                                                {categoryConfig[c]?.icon} {categoryConfig[c]?.label || c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Limite (R$)</label>
                                    <CurrencyInput
                                        value={form.limit}
                                        onChange={(e) => setForm({ ...form, limit: e.target.value })}
                                        required
                                        placeholder="0,00"
                                        className="w-full bg-gray-800/40/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:border-brand-glow/50 focus:ring-1 focus:ring-brand-glow/50 outline-none transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full gradient-btn py-4 rounded-xl font-bold text-white mt-4 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editId ? 'Salvar Alterações' : 'Criar Orçamento')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
