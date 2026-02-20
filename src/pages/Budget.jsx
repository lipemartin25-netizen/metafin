import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { PiggyBank, Plus, X, AlertTriangle, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import categoriesData from '../data/data.json';

const categoryConfig = categoriesData.categories;

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function Budget() {
    const { transactions } = useTransactions();
    const [budgets, setBudgets] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ category: '', limit: '' });

    useEffect(() => {
        const s = localStorage.getItem('sf_budgets');
        if (s) setBudgets(JSON.parse(s));
    }, []);

    const save = (b) => { setBudgets(b); localStorage.setItem('sf_budgets', JSON.stringify(b)); };

    // Current month spending by category
    const currentMonth = new Date().toISOString().slice(0, 7);
    const spending = useMemo(() => {
        const result = {};
        transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).forEach(t => {
            const cat = t.category || 'outros';
            result[cat] = (result[cat] || 0) + Math.abs(t.amount);
        });
        return result;
    }, [transactions, currentMonth]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const budget = {
            id: editId || Date.now().toString(),
            category: form.category,
            limit: parseFloat(form.limit.replace(/\./g, '').replace(',', '.')) || 500,
        };

        if (editId) {
            save(budgets.map(b => b.id === editId ? budget : b));
        } else {
            if (budgets.some(b => b.category === form.category)) {
                alert('Ja existe um orcamento para esta categoria!');
                return;
            }
            save([...budgets, budget]);
        }
        setForm({ category: '', limit: '' });
        setShowAdd(false);
        setEditId(null);
    };

    const handleEdit = (budget) => {
        setForm({ category: budget.category, limit: budget.limit.toString() });
        setEditId(budget.id);
        setShowAdd(true);
    };

    const handleDelete = (id) => {
        save(budgets.filter(b => b.id !== id));
    };

    // Available categories (not yet budgeted)
    const availableCategories = Object.keys(categoryConfig).filter(
        c => !budgets.some(b => b.category === c)
    );

    // Summary
    const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = budgets.reduce((s, b) => s + (spending[b.category] || 0), 0);
    const overBudget = budgets.filter(b => (spending[b.category] || 0) > b.limit);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <PiggyBank className="w-6 h-6 text-pink-500" />
                        Orcamento Mensal
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Defina limites por categoria e controle seus gastos.</p>
                </div>
                <button onClick={() => { setEditId(null); setForm({ category: availableCategories[0] || '', limit: '' }); setShowAdd(true); }} className="gradient-btn px-4 py-2 text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Adicionar Limite
                </button>
            </div>

            {/* Alerts */}
            {overBudget.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-red-400">{overBudget.length} categoria(s) acima do orcamento!</p>
                        <p className="text-xs text-red-300/70">{overBudget.map(b => categoryConfig[b.category]?.label || b.category).join(', ')}</p>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="glass-card">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Orcamento Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(totalBudget)}</p>
                </div>
                <div className="glass-card">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gasto Este Mes</p>
                    <p className="text-2xl font-bold text-red-500">{fmt(totalSpent)}</p>
                </div>
                <div className="glass-card">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Disponivel</p>
                    <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmt(totalBudget - totalSpent)}</p>
                    {totalBudget > 0 && (
                        <div className="mt-2 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${(totalSpent / totalBudget) > 0.9 ? 'bg-red-500' : (totalSpent / totalBudget) > 0.7 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Budget Items */}
            {budgets.length === 0 ? (
                <div className="glass-card text-center py-12 border-dashed border-2 border-gray-200 dark:border-white/10 bg-transparent">
                    <PiggyBank className="w-12 h-12 text-pink-500 mx-auto mb-4 opacity-50" />
                    <h4 className="text-gray-900 dark:text-white font-medium mb-1">Nenhum orcamento definido</h4>
                    <p className="text-gray-500 text-sm mb-4">Defina limites de gastos por categoria para controlar suas financas.</p>
                    <button onClick={() => { setForm({ category: availableCategories[0] || '', limit: '' }); setShowAdd(true); }} className="gradient-btn px-6 py-2 text-sm">Criar Orcamento</button>
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
                            <div key={budget.id} className={`glass-card ${over ? 'border-red-500/30' : ''}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${cat?.color || '#6b7280'}15` }}>
                                            {cat?.icon || '📦'}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{cat?.label || budget.category}</h4>
                                            <p className="text-[10px] text-gray-500">Limite: {fmt(budget.limit)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${over ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{fmt(spent)}</p>
                                            <p className={`text-[10px] ${over ? 'text-red-400' : 'text-gray-500'}`}>
                                                {over ? (
                                                    <span className="flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Excedeu {fmt(Math.abs(remaining))}</span>
                                                ) : (
                                                    <span className="flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5 text-emerald-500" /> Sobra {fmt(remaining)}</span>
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

                                <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${pct}%` }} />
                                </div>
                                <div className="flex justify-between mt-1.5 text-[10px] text-gray-500">
                                    <span>{Math.round(pct)}% usado</span>
                                    <span>{fmt(budget.limit - spent > 0 ? budget.limit - spent : 0)} restante</span>
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
                        <button type="button" onClick={() => { setShowAdd(false); setEditId(null); }} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><PiggyBank className="w-5 h-5 text-pink-500" /> {editId ? 'Editar Orcamento' : 'Novo Orcamento'}</h2>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Categoria</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" disabled={!!editId}>
                                {(editId ? Object.keys(categoryConfig) : availableCategories).map(c => (
                                    <option key={c} value={c}>{categoryConfig[c]?.icon} {categoryConfig[c]?.label || c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Limite Mensal (R$)</label>
                            <input value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm outline-none mt-1" placeholder="500,00" />
                        </div>

                        {form.category && spending[form.category] > 0 && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-400">
                                Gasto atual neste mes em {categoryConfig[form.category]?.label}: <strong>{fmt(spending[form.category])}</strong>
                            </div>
                        )}

                        <button type="submit" className="gradient-btn w-full py-3 text-sm font-bold">{editId ? 'Salvar' : 'Criar Orcamento'}</button>
                    </form>
                </div>
            )}
        </div>
    );
}
