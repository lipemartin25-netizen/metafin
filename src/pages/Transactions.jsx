import { useState, useMemo, useRef } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import StatusChip from '../components/StatusChip';
import { Search, Filter, Upload, Plus, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Trash2, Download, BarChart2, List } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Papa from 'papaparse';
import { analytics } from '../hooks/useAnalytics';
import { parseFile, ACCEPTED_EXTENSIONS, SUPPORTED_FORMATS } from '../lib/fileParser';
import categoriesData from '../data/data.json';

const categoryConfig = categoriesData.categories;
const allCategories = Object.keys(categoryConfig);

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Transactions() {
    const { transactions, loading, addTransaction, addBulkTransactions, deleteTransaction } = useTransactions();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importing, setImporting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const fileInputRef = useRef(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'analysis'
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [newTx, setNewTx] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: '', category: 'outros', type: 'expense', notes: '' });

    const changeMonth = (offset) => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const d = new Date(year, month - 1 + offset, 1);
        setSelectedMonth(d.toISOString().slice(0, 7));
    };

    const monthLabel = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }, [selectedMonth]);

    const monthlyData = useMemo(() => {
        const months = {};
        // Pegar últimos 12 meses
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mKey = d.toISOString().slice(0, 7);
            const mLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
            months[mKey] = { label: mLabel, total: 0, count: 0 };
        }

        transactions.forEach(t => {
            if (t.type === 'expense') {
                const mk = t.date.slice(0, 7);
                if (months[mk]) {
                    months[mk].total += Math.abs(t.amount);
                    months[mk].count += 1;
                }
            }
        });

        return Object.values(months).reverse();
    }, [transactions]);

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        const amount = parseFloat(newTx.amount);
        await addTransaction({ ...newTx, amount: newTx.type === 'expense' ? -Math.abs(amount) : Math.abs(amount), status: 'categorized' });
        analytics.transactionCreated(newTx.type, newTx.category);
        setShowAddModal(false);
        setNewTx({ date: new Date().toISOString().split('T')[0], description: '', amount: '', category: 'outros', type: 'expense', notes: '' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;

        console.log('Excluindo transação:', id);
        setDeletingId(id);
        try {
            const success = await deleteTransaction(id);
            if (success) {
                analytics.transactionDeleted();
            } else {
                alert('Erro ao excluir transação. Tente novamente.');
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleFileImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportResult(null);
        const ext = file.name.split('.').pop().toLowerCase();
        analytics.csvImportStarted(0);
        try {
            const parsed = await parseFile(file);
            if (parsed.length === 0) {
                setImportResult({ success: false, message: 'Nenhuma transação válida encontrada. Verifique se o arquivo contém colunas: data, descricao, valor' });
                setImporting(false);
                return;
            }
            await addBulkTransactions(parsed);
            const cat = parsed.filter((t) => t.status === 'categorized').length;
            const formatLabel = SUPPORTED_FORMATS[ext]?.label || ext.toUpperCase();
            analytics.csvImportCompleted(parsed.length, cat);
            setImportResult({ success: true, message: `${parsed.length} transações importadas via ${formatLabel}! (${cat} categorizadas, ${parsed.length - cat} pendentes)` });
        } catch (err) {
            analytics.csvImportError(err.message);
            setImportResult({ success: false, message: err.message });
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleExport = () => {
        const csvData = filteredTransactions.map((t) => ({ data: t.date, descricao: t.description, valor: t.amount, categoria: categoryConfig[t.category]?.label || t.category, tipo: t.type === 'income' ? 'Receita' : 'Despesa', status: t.status }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `smartfinance_export_${new Date().toISOString().split('T')[0]}.csv`; a.click();
        URL.revokeObjectURL(url);
        analytics.featureUsed('csv_export');
    };

    const downloadSampleCsv = () => {
        const s = `data,descricao,valor,categoria\n2026-02-01,Salário Mensal,8500.00,renda\n2026-02-02,Supermercado Extra,-452.30,alimentacao\n2026-02-03,Uber Casa-Trabalho,-28.50,transporte\n2026-02-04,Netflix,-55.90,entretenimento\n2026-02-05,Aluguel,-2200.00,moradia\n2026-02-06,Farmácia,-87.60,saude\n2026-02-07,Freelance Design,2500.00,renda`;
        const blob = new Blob(['\uFEFF' + s], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'sample_import.csv'; a.click(); URL.revokeObjectURL(url);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter((t) => {
            const ms = searchQuery === '' || t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase());
            const mc = filterCategory === 'all' || t.category === filterCategory;
            const mt = filterType === 'all' || t.type === filterType;
            const monthMatch = t.date.startsWith(selectedMonth);
            return ms && mc && mt && monthMatch;
        });
    }, [transactions, searchQuery, filterCategory, filterType, selectedMonth]);

    const monthSummary = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            if (t.type === 'income') acc.income += Math.abs(t.amount);
            else acc.expense += Math.abs(t.amount);
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredTransactions]);

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;

    return (
        <div className="py-6 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-white">Transações</h1><p className="text-gray-400 text-sm">{filteredTransactions.length} transações em {monthLabel}</p></div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white/5 p-1 rounded-xl items-center mr-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 text-gray-400 hover:text-white transition-all">←</button>
                        <span className="px-3 text-sm font-bold text-white min-w-[140px] text-center capitalize">{monthLabel}</span>
                        <button onClick={() => changeMonth(1)} className="p-2 text-gray-400 hover:text-white transition-all">→</button>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl mr-2">
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'text-gray-500 hover:text-gray-300'}`} title="Lista">
                            <List className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode('analysis')} className={`p-2 rounded-lg transition-all ${viewMode === 'analysis' ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'text-gray-500 hover:text-gray-300'}`} title="Análise Mensal">
                            <BarChart2 className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={handleExport} className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-sm flex items-center gap-2"><Download className="w-4 h-4" /><span className="hidden sm:inline">Exportar</span></button>
                    <button onClick={() => setShowAddModal(true)} className="gradient-btn text-sm flex items-center gap-2"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Adicionar</span></button>
                </div>
            </div>

            {/* Monthly Statement Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4 bg-emerald-500/5 border-emerald-500/10">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-500/60 mb-1">Receitas do Mês</p>
                    <h5 className="text-xl font-bold text-emerald-400">{fmt(monthSummary.income)}</h5>
                </div>
                <div className="glass-card p-4 bg-rose-500/5 border-rose-500/10">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-rose-500/60 mb-1">Despesas do Mês</p>
                    <h5 className="text-xl font-bold text-rose-400">-{fmt(monthSummary.expense)}</h5>
                </div>
                <div className="glass-card p-4 bg-white/5">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Resultado (Fluxo de Caixa)</p>
                    <h5 className={`text-xl font-bold ${monthSummary.income - monthSummary.expense >= 0 ? 'text-white' : 'text-rose-400'}`}>
                        {fmt(monthSummary.income - monthSummary.expense)}
                    </h5>
                </div>
            </div>

            {/* Import */}
            <div className="glass-card">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1"><h3 className="text-sm font-semibold text-white flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-emerald-400" />Smart Import Multi-Formato</h3><p className="text-xs text-gray-500 mt-1">CSV, Excel, JSON, TXT, XML, HTML, PDF, Word, imagens e mais</p></div>
                    <div className="flex items-center gap-2">
                        <button onClick={downloadSampleCsv} className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-all text-xs">📄 Modelo CSV</button>
                        <label className="gradient-btn text-sm cursor-pointer flex items-center gap-2">
                            {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Importando...</> : <><Upload className="w-4 h-4" />Importar Arquivo</>}
                            <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={handleFileImport} disabled={importing} className="hidden" />
                        </label>
                    </div>
                </div>
                {importResult && (
                    <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 text-sm ${importResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        {importResult.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                        <span>{importResult.message}</span>
                        <button onClick={() => setImportResult(null)} className="ml-auto shrink-0"><X className="w-3 h-3" /></button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar transações..." className="input-field pl-10" />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>}
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field pl-10 pr-8 appearance-none cursor-pointer min-w-[160px]">
                        <option value="all">Todas categorias</option>
                        {allCategories.map((c) => <option key={c} value={c}>{categoryConfig[c]?.icon} {categoryConfig[c]?.label || c}</option>)}
                    </select>
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field appearance-none cursor-pointer min-w-[130px]">
                    <option value="all">Todos tipos</option>
                    <option value="income">💰 Receita</option>
                    <option value="expense">💸 Despesa</option>
                </select>
            </div>

            {/* Content Mode Selection */}
            {viewMode === 'analysis' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Comparativo Mensal</h3>
                                <p className="text-xs text-gray-400">Total de gastos nos últimos 12 meses</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Média Mensal</p>
                                <p className="text-xl font-bold text-white">
                                    {fmt(monthlyData.reduce((acc, m) => acc + m.total, 0) / monthlyData.filter(m => m.total > 0).length || 0)}
                                </p>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="label" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        formatter={(v) => [fmt(v), 'Gastos']}
                                    />
                                    <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={32}>
                                        {monthlyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === monthlyData.length - 1 ? '#10b981' : '#374151'} fillOpacity={index === monthlyData.length - 1 ? 1 : 0.6} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
                            <p className="text-xs text-gray-400 font-medium">Mês Atual (Até agora)</p>
                            <h4 className="text-2xl font-bold text-white mt-1">{fmt(monthlyData[monthlyData.length - 1]?.total || 0)}</h4>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-500/10 text-gray-400`}>
                                    PROJEÇÃO ESTIMADA
                                </span>
                            </div>
                        </div>
                        <div className="glass-card p-5 border-l-4 border-l-blue-500">
                            <p className="text-xs text-gray-400 font-medium">Economia vs Mês Anterior</p>
                            {(() => {
                                const curr = monthlyData[monthlyData.length - 1]?.total || 0;
                                const prev = monthlyData[monthlyData.length - 2]?.total || 1; // evitar div zero
                                const diff = ((curr - prev) / prev) * 100;
                                return (
                                    <>
                                        <h4 className={`text-2xl font-bold mt-1 ${diff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {diff <= 0 ? '↓' : '↑'} {Math.abs(diff).toFixed(1)}%
                                        </h4>
                                        <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-wider">Baseado nos dados importados</p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* List */}
                    <div className="glass-card p-0 overflow-hidden">
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white/[0.02] border-b border-white/5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                            <div className="col-span-1">Data</div><div className="col-span-4">Descrição</div><div className="col-span-2">Categoria</div><div className="col-span-2">Status</div><div className="col-span-2 text-right">Valor</div><div className="col-span-1 text-right">Ação</div>
                        </div>
                        {filteredTransactions.length === 0 ? (
                            <div className="p-12 text-center"><Search className="w-12 h-12 text-gray-700 mx-auto mb-4" /><p className="text-gray-500">Nenhuma transação encontrada</p></div>
                        ) : (
                            <div className="divide-y divide-white/5">{filteredTransactions.map((t) => {
                                const cat = categoryConfig[t.category];
                                return (
                                    <div key={t.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="md:col-span-1 text-sm text-gray-500">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                                        <div className="md:col-span-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: `${cat?.color || '#6b7280'}15` }}>{cat?.icon || '📦'}</div>
                                            <div className="min-w-0"><p className="text-sm font-medium text-white truncate">{t.description}</p>{t.notes && <p className="text-xs text-gray-600 truncate">{t.notes}</p>}</div>
                                        </div>
                                        <div className="md:col-span-2"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${cat?.color || '#6b7280'}15`, color: cat?.color || '#6b7280' }}>{cat?.label || t.category}</span></div>
                                        <div className="md:col-span-2"><StatusChip status={t.status} /></div>
                                        <div className="md:col-span-2 text-right"><span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'income' ? '+' : '-'} {fmt(Math.abs(t.amount))}</span></div>
                                        <div className="md:col-span-1 text-right">
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                disabled={deletingId === t.id}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                                title="Excluir"
                                            >
                                                {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}</div>
                        )}
                    </div>
                </>
            )}

            {/* Add Modal - Moved outside to work in both views if needed,
                but keeping it consistent with the user's intended flow */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md animate-slide-up">
                        <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-white">Nova Transação</h2><button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"><X className="w-5 h-5" /></button></div>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="flex rounded-xl bg-white/5 p-1">
                                <button type="button" onClick={() => setNewTx((p) => ({ ...p, type: 'expense' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${newTx.type === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'}`}>💸 Despesa</button>
                                <button type="button" onClick={() => setNewTx((p) => ({ ...p, type: 'income' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${newTx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>💰 Receita</button>
                            </div>
                            <div><label className="block text-sm text-gray-400 mb-1">Descrição</label><input type="text" value={newTx.description} onChange={(e) => setNewTx((p) => ({ ...p, description: e.target.value }))} placeholder="Ex: Supermercado Extra" required className="input-field" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-sm text-gray-400 mb-1">Valor (R$)</label><input type="number" step="0.01" min="0.01" value={newTx.amount} onChange={(e) => setNewTx((p) => ({ ...p, amount: e.target.value }))} placeholder="0,00" required className="input-field" /></div>
                                <div><label className="block text-sm text-gray-400 mb-1">Data</label><input type="date" value={newTx.date} onChange={(e) => setNewTx((p) => ({ ...p, date: e.target.value }))} required className="input-field" /></div>
                            </div>
                            <div><label className="block text-sm text-gray-400 mb-1">Categoria</label><select value={newTx.category} onChange={(e) => setNewTx((p) => ({ ...p, category: e.target.value }))} className="input-field appearance-none cursor-pointer">{allCategories.map((c) => <option key={c} value={c}>{categoryConfig[c]?.icon} {categoryConfig[c]?.label || c}</option>)}</select></div>
                            <div><label className="block text-sm text-gray-400 mb-1">Notas (opcional)</label><input type="text" value={newTx.notes} onChange={(e) => setNewTx((p) => ({ ...p, notes: e.target.value }))} placeholder="Observações..." className="input-field" /></div>
                            <button type="submit" className="gradient-btn w-full">Adicionar Transação</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
