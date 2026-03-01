import { useState, useMemo, useRef } from 'react';
import { usePageAnnounce } from '../components/A11yAnnouncer';
import { useTransactions } from '../hooks/useTransactions';
import StatusChip from '../components/StatusChip';
import { Search, Filter, Upload, Plus, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Trash2, Download, BarChart2, List, Landmark, FileText, File, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Papa from 'papaparse';
import { analytics } from '../hooks/useAnalytics';
import { parseFile, ACCEPTED_EXTENSIONS, SUPPORTED_FORMATS } from '../lib/fileParser';
import categoriesData from '../data/data.json';

const categoryConfig = categoriesData.categories;
const categoryGroups = categoriesData.categoryGroups || [];
const allCategories = Object.keys(categoryConfig);

const FORMAT_BUTTONS = [
    { ext: '.csv', label: 'CSV', icon: FileSpreadsheet, color: '#10B981' },
    { ext: '.ofx', label: 'OFX', icon: Landmark, color: '#3B82F6' },
    { ext: '.xls', label: 'XLS', icon: FileText, color: '#22C55E' },
    { ext: '.xlsx', label: 'XLSX', icon: FileText, color: '#16A34A' },
    { ext: '.pdf', label: 'PDF', icon: File, color: '#EF4444' },
];

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Transactions() {
    const { transactions, loading, addTransaction, addBulkTransactions, updateTransaction, deleteTransaction } = useTransactions();
    usePageAnnounce('Transações');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importing, setImporting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editId, setEditId] = useState(null);
    const fileInputRef = useRef(null);
    const [viewMode, setViewMode] = useState('list');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [newTx, setNewTx] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '', amount: '', category: 'outros', type: 'expense', notes: ''
    });
    const [isDragging, setIsDragging] = useState(false);
    const [catSearch, setCatSearch] = useState('');

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
                if (months[mk]) { months[mk].total += Math.abs(t.amount); months[mk].count += 1; }
            }
        });
        return Object.values(months).reverse();
    }, [transactions]);

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        const amount = parseFloat(newTx.amount);
        const txData = { ...newTx, amount: newTx.type === 'expense' ? -Math.abs(amount) : Math.abs(amount), status: 'categorized' };
        if (editId) {
            await updateTransaction(editId, txData);
            setEditId(null);
        } else {
            await addTransaction(txData);
            analytics.transactionCreated(newTx.type, newTx.category);
        }
        setShowAddModal(false);
        setNewTx({ date: new Date().toISOString().split('T')[0], description: '', amount: '', category: 'outros', type: 'expense', notes: '' });
    };

    const handleEditClick = (t) => {
        setNewTx({ date: t.date, description: t.description, amount: Math.abs(t.amount).toString(), category: t.category, type: t.type, notes: t.notes || '' });
        setEditId(t.id);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;
        setDeletingId(id);
        try {
            const success = await deleteTransaction(id);
            if (success) { analytics.transactionDeleted(); }
            else { alert('Erro ao excluir transação. Tente novamente.'); }
        } catch (err) { console.error('Delete error:', err); }
        finally { setDeletingId(null); }
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
                setImportResult({ success: false, message: 'Nenhuma transação válida encontrada. Verifique se o arquivo contém colunas: data, descrição, valor' });
                setImporting(false); return;
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

    const handleExport = (format) => {
        const dataToExport = filteredTransactions.map((t) => ({
            data: t.date,
            descricao: t.description,
            valor: t.amount,
            categoria: categoryConfig[t.category]?.label || t.category,
            tipo: t.type === 'income' ? 'Receita' : 'Despesa',
            status: t.status
        }));

        if (format === 'csv') {
            const csv = Papa.unparse(dataToExport);
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `metafin_export_${new Date().toISOString().split('T')[0]}.csv`; a.click();
            URL.revokeObjectURL(url);

        } else if (format === 'json') {
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `metafin_export_${new Date().toISOString().split('T')[0]}.json`; a.click();
            URL.revokeObjectURL(url);

        } else if (format === 'pdf') {
            const escapeHTML = (str) => String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
            const win = window.open('', '_blank');
            if (!win) { alert('Permita popups para gerar o PDF.'); return; }
            win.document.write(`<!DOCTYPE html><html><head>
 <title>Relatório Financeiro — MetaFin</title>
 <style>
 *{margin:0;padding:0;box-sizing:border-box}
 body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#111;background:#fff}
 .header{margin-bottom:28px;border-bottom:3px solid #8b5cf6;padding-bottom:16px}
 .header h1{color:#8b5cf6;font-size:24px;font-weight:700}
 .header p{color:#64748b;font-size:13px;margin-top:4px}
 .summary{display:flex;gap:24px;margin-bottom:24px}
 .summary-tech-card{background:#f8fafc;border-radius:12px;padding:16px 24px;flex:1;border:1px solid #e2e8f0}
 .summary-tech-card .label{font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600;letter-spacing:0.05em}
 .summary-tech-card .value{font-size:20px;font-weight:700;margin-top:4px}
 .income-val{color:#10b981}.expense-val{color:#ef4444}.balance-pos{color:#10b981}.balance-neg{color:#ef4444}
 table{width:100%;border-collapse:collapse;font-size:13px}
 thead tr{background:#f1f5f9}
 th{padding:11px 14px;text-align:left;font-weight:600;color:#334155;font-size:11px;text-transform:uppercase;letter-spacing:0.05em}
 td{padding:11px 14px;border-bottom:1px solid #f1f5f9;color:#334155}
 tr:hover td{background:#fafafa}
 .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600}
 .badge-income{background:#dcfce7;color:#16a34a}
 .badge-expense{background:#fee2e2;color:#dc2626}
 .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;text-align:center}
 @media print{@page{margin:16mm}body{padding:0}.no-print{display:none}}
 </style></head>
 <body>
 <div class="header">
 <h1>MetaFin — Relatório de Transações</h1>
 <p>Exportado em ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • ${dataToExport.length} transações • Período: ${monthLabel}</p>
 </div>
 <div class="summary">
 <div class="summary-tech-card">
 <div class="label">Receitas</div>
 <div class="value income-val">${fmt(dataToExport.filter(t => t.tipo === 'Receita').reduce((a, t) => a + Math.abs(t.valor), 0))}</div>
 </div>
 <div class="summary-tech-card">
 <div class="label">Despesas</div>
 <div class="value expense-val">${fmt(dataToExport.filter(t => t.tipo === 'Despesa').reduce((a, t) => a + Math.abs(t.valor), 0))}</div>
 </div>
 <div class="summary-tech-card">
 <div class="label">Saldo</div>
 ${(() => { const bal = dataToExport.reduce((a, t) => a + (t.tipo === 'Receita' ? Math.abs(t.valor) : -Math.abs(t.valor)), 0); return `<div class="value ${bal >= 0 ? 'balance-pos' : 'balance-neg'}">${fmt(bal)}</div>`; })()}
 </div>
 </div>
 <table>
 <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Categoria</th><th>Tipo</th></tr></thead>
 <tbody>${dataToExport.map(t => `<tr>
 <td>${new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
 <td>${escapeHTML(t.descricao)}</td>
 <td style="font-weight:700;color:${t.tipo === 'Receita' ? '#10b981' : '#ef4444'}">${t.tipo === 'Receita' ? '+' : '-'}${fmt(Math.abs(t.valor))}</td>
 <td>${escapeHTML(t.categoria)}</td>
 <td><span class="badge ${t.tipo === 'Receita' ? 'badge-income' : 'badge-expense'}">${t.tipo}</span></td>
 </tr>`).join('')}</tbody>
 </table>
 <div class="footer">Relatório Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
 <script>setTimeout(()=>{window.print();},400);</script>
 </body></html>`);
            win.document.close();
        }

        setShowExportModal(false);
        analytics.featureUsed(`export_${format}`);
    };

    const downloadSampleCsv = () => {
        const s = `data,descricao,valor,categoria\n2026-02-01,Salário Mensal,8500.00,renda\n2026-02-02,Supermercado Extra,-452.30,alimentacao\n2026-02-03,Uber Casa-Trabalho,-28.50,transporte\n2026-02-04,Netflix,-55.90,entretenimento\n2026-02-05,Aluguel,-2200.00,moradia`;
        const blob = new Blob(['\uFEFF' + s], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'sample_import.csv'; a.click(); URL.revokeObjectURL(url);
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

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-brand-glow animate-spin" /></div>;

    return (
        <div className="py-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tighter uppercase">
                        <List className="w-8 h-8 text-[var(--menta-dark)]" /> Transações
                    </h1>
                    <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mt-1">{filteredTransactions.length} registros em <span className="text-[var(--menta-dark)]">{monthLabel}</span></p>
                </div>
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    {/* Month navigator */}
                    <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl items-center border border-[var(--border)]">
                        <button onClick={() => changeMonth(-1)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-lg hover:bg-[var(--bg-surface)]">←</button>
                        <span className="px-3 text-sm font-bold text-[var(--text-primary)] min-w-[140px] text-center capitalize">{monthLabel}</span>
                        <button onClick={() => changeMonth(1)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-lg hover:bg-[var(--bg-surface)]">→</button>
                    </div>
                    {/* View mode */}
                    <div className="flex bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-subtle)] shadow-3d">
                        <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[var(--menta-soft)] text-[var(--menta-dark)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`} title="Lista"><List className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('analysis')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'analysis' ? 'bg-[var(--menta-soft)] text-[var(--menta-dark)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`} title="Análise"><BarChart2 className="w-4 h-4" /></button>
                    </div>
                    {/* Export */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportModal(!showExportModal)}
                            className="h-[48px] px-5 rounded-2xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 bg-[var(--bg-card)] shadow-3d"
                        >
                            <Download className="w-4 h-4 text-[var(--menta-dark)]" />
                            <span className="hidden sm:inline">Exportar</span>
                        </button>
                        {showExportModal && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowExportModal(false)} />
                                <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border)] rounded-2xl shadow-tech-card z-30 p-2 animate-slide-up">
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest px-3 py-2">Escolha o formato</p>
                                    <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] rounded-xl flex items-center justify-between transition-all">
                                        <span className="flex items-center gap-2">📊 Excel / CSV</span>
                                        <span className="text-[10px] text-slate-600 font-mono">.csv</span>
                                    </button>
                                    <button onClick={() => handleExport('json')} className="w-full text-left px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] rounded-xl flex items-center justify-between transition-all">
                                        <span className="flex items-center gap-2">🔧 JSON Data</span>
                                        <span className="text-[10px] text-slate-600 font-mono">.json</span>
                                    </button>
                                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] rounded-xl flex items-center justify-between transition-all">
                                        <span className="flex items-center gap-2">📄 Relatório PDF</span>
                                        <span className="text-[10px] text-slate-600 font-mono">.pdf</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Add */}
                    <button
                        onClick={() => { setEditId(null); setNewTx({ date: new Date().toISOString().split('T')[0], description: '', amount: '', category: 'outros', type: 'expense', notes: '' }); setShowAddModal(true); }}
                        className="gradient-btn flex items-center gap-2 font-medium px-4 py-2.5 h-[42px] rounded-xl transition-all duration-200 whitespace-nowrap shadow-lg active:scale-95"
                    >
                        <Plus className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Adicionar</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in">
                <div className="tech-card p-6 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent pointer-events-none" />
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Receitas</p>
                    <h5 className="text-3xl font-black text-[var(--menta-dark)] tracking-tighter">{fmt(monthSummary.income)}</h5>
                    <div className="absolute bottom-4 right-4 text-emerald-500/10 group-hover:scale-110 transition-transform">
                        <ArrowUpRight className="w-12 h-12" />
                    </div>
                </div>
                <div className="tech-card p-6 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent pointer-events-none" />
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Despesas</p>
                    <h5 className="text-3xl font-black text-rose-500 tracking-tighter">-{fmt(monthSummary.expense)}</h5>
                    <div className="absolute bottom-4 right-4 text-rose-500/10 group-hover:scale-110 transition-transform">
                        <ArrowDownRight className="w-12 h-12" />
                    </div>
                </div>
                <div className="tech-card p-6 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--menta-soft)]/10 to-transparent pointer-events-none" />
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Fluxo Líquido</p>
                    <h5 className={`text-3xl font-black tracking-tighter ${monthSummary.income - monthSummary.expense >= 0 ? 'text-[var(--menta-dark)]' : 'text-rose-500'}`}>
                        {fmt(monthSummary.income - monthSummary.expense)}
                    </h5>
                    <div className="absolute bottom-4 right-4 text-[var(--menta-dark)]/5 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-12 h-12" />
                    </div>
                </div>
            </div>

            {/* Import — Drag & Drop + Format Buttons */}
            <div className="tech-card p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-brand-glow" />
                            Importar Transações
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">CSV, OFX, Excel, PDF e mais formatos</p>
                    </div>
                    <button onClick={downloadSampleCsv} className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-all text-xs">
                        📄 Modelo CSV
                    </button>
                </div>

                {/* Drag & Drop Zone */}
                <div
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${isDragging
                        ? 'border-brand-glow bg-brand-primary/5'
                        : 'border-[var(--border)] hover:border-[var(--border)]'
                        }`}
                    onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files.length > 0) {
                            handleFileImport({ target: { files: e.dataTransfer.files } });
                        }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {importing ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-brand-glow animate-spin" />
                            <p className="text-sm text-brand-glow font-medium">Importando...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload className={`w-8 h-8 ${isDragging ? 'text-brand-glow' : 'text-[var(--text-muted)]'} transition-colors`} />
                            <p className="text-sm text-[var(--text-secondary)] hidden sm:block">
                                {isDragging ? 'Solte o arquivo aqui' : 'Arraste um arquivo aqui ou clique para selecionar'}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)] sm:hidden">Toque para selecionar arquivo</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Formatos aceitos: CSV, OFX, XLS, XLSX, PDF</p>
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={handleFileImport} disabled={importing} className="hidden" />
                </div>

                {/* Format Buttons */}
                <div className="mt-4">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-2">Ou importe diretamente</p>
                    <div className="flex flex-wrap gap-2">
                        {FORMAT_BUTTONS.map((fmt) => (
                            <button
                                key={fmt.ext}
                                onClick={() => {
                                    const inp = document.createElement('input');
                                    inp.type = 'file';
                                    inp.accept = fmt.ext;
                                    inp.onchange = (e) => handleFileImport(e);
                                    inp.click();
                                }}
                                className="flex flex-col items-center justify-center w-[72px] h-[64px] rounded-xl bg-gray-800/40/[0.03] border border-[var(--border)] hover:border-brand-glow/50 hover:bg-brand-primary/5 transition-all hover:-translate-y-px.5 gap-1"
                            >
                                <fmt.icon className="w-5 h-5" style={{ color: fmt.color }} />
                                <span className="text-[10px] font-bold tracking-wider text-[var(--text-secondary)]">{fmt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {importResult && (
                    <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 text-sm ${importResult.success ? 'bg-brand-primary/10 border border-brand-primary/20 text-brand-glow' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        {importResult.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                        <span>{importResult.message}</span>
                        <button onClick={() => setImportResult(null)} className="ml-auto shrink-0"><X className="w-3 h-3" /></button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por descrição ou categoria..." className="w-full bg-gray-800/40/[0.03] border border-[var(--border)] rounded-2xl py-3.5 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all" />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-4 h-4" /></button>}
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-gray-800/40/[0.03] border border-[var(--border)] rounded-2xl py-3.5 pl-12 pr-10 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer min-w-[200px]">
                        <option value="all" className="bg-[var(--bg-base)]">Todas as Categorias</option>
                        {allCategories.map((c) => <option key={c} value={c} className="bg-[var(--bg-base)]">{categoryConfig[c]?.icon} {categoryConfig[c]?.label || c}</option>)}
                    </select>
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-gray-800/40/[0.03] border border-[var(--border)] rounded-2xl py-3.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer min-w-[150px]">
                    <option value="all" className="bg-[var(--bg-base)]">Todos os Tipos</option>
                    <option value="income" className="bg-[var(--bg-base)]">💰 Receitas</option>
                    <option value="expense" className="bg-[var(--bg-base)]">💸 Despesas</option>
                </select>
            </div>

            {/* Content */}
            {viewMode === 'analysis' ? (
                <div className="space-y-6 animate-fade-in">
                    <div className="tech-card p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Comparativo Mensal</h3>
                                <p className="text-xs text-[var(--text-secondary)]">Total de gastos nos últimos 12 meses</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Média Mensal</p>
                                <p className="text-xl font-bold text-[var(--text-primary)]">
                                    {fmt(monthlyData.reduce((acc, m) => acc + m.total, 0) / (monthlyData.filter(m => m.total > 0).length || 1))}
                                </p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#0d1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} formatter={(v) => [fmt(v), 'Gastos']} />
                                    <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={32}>
                                        {monthlyData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index === monthlyData.length - 1 ? '#10b981' : '#1e293b'} fillOpacity={index === monthlyData.length - 1 ? 1 : 0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
                        <div className="tech-card p-5 border-l-4 border-l-emerald-500">
                            <p className="text-xs text-[var(--text-secondary)] font-medium">Mês Atual (Até agora)</p>
                            <h4 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{fmt(monthlyData[monthlyData.length - 1]?.total || 0)}</h4>
                        </div>
                        <div className="tech-card p-5 border-l-4 border-l-blue-500">
                            <p className="text-xs text-[var(--text-secondary)] font-medium">Variação vs Mês Anterior</p>
                            {(() => {
                                const curr = monthlyData[monthlyData.length - 1]?.total || 0;
                                const prev = monthlyData[monthlyData.length - 2]?.total || 1;
                                const diff = ((curr - prev) / prev) * 100;
                                return <h4 className={`text-2xl font-bold mt-1 ${diff <= 0 ? 'text-[var(--brand)]' : 'text-rose-400'}`}>{diff <= 0 ? '↓' : '↑'} {Math.abs(diff).toFixed(1)}%</h4>;
                            })()}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTransactions.length === 0 ? (
                        <div className={`p-12 text-center ${tw.card}`}>
                            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-[var(--text-secondary)]">Nenhuma transação encontrada</p>
                        </div>
                    ) : (
                        filteredTransactions.map((t) => {
                            const cat = categoryConfig[t.category];
                            return (
                                <div key={t.id} onClick={() => handleEditClick(t)} className="tech-card !p-4 flex items-center justify-between border-l-4 border-l-transparent hover:border-l-[var(--brand)] transition-all cursor-pointer group relative overflow-hidden">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${cat?.color || '#6b7280'}20` }}>
                                            {cat?.icon || '📦'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--brand)] transition-colors">{t.description}</p>
                                            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                                                <span>{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                                <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                                <span style={{ color: cat?.color || '#94a3b8' }}>{cat?.label || t.category}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-base font-black ${t.type === 'income' ? 'text-[var(--brand)]' : 'text-[var(--text-primary)]'}`}>
                                            {t.type === 'income' ? '+' : '-'}{fmt(Math.abs(t.amount))}
                                        </span>
                                        <div className="scale-75 origin-right"><StatusChip status={t.status} /></div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                        disabled={deletingId === t.id}
                                        className="absolute right-[-40px] top-1/2 -translate-y-1/2 p-2 rounded-xl bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all disabled:opacity-50 opacity-0 group-hover:right-4 group-hover:opacity-100"
                                    >
                                        {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ADD/EDIT MODAL - Sólido */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-base)]/90 ">
                    <div className="bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border)] w-full max-w-md rounded-3xl p-8 shadow-tech-card animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">{editId ? 'Editar Transação' : 'Nova Transação'}</h2>
                            <button onClick={() => { setShowAddModal(false); setEditId(null); }} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-gray-800/40/10 transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="flex rounded-xl bg-[var(--bg-surface)] p-1">
                                <button type="button" onClick={() => setNewTx((p) => ({ ...p, type: 'expense' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${newTx.type === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>💸 Despesa</button>
                                <button type="button" onClick={() => setNewTx((p) => ({ ...p, type: 'income' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${newTx.type === 'income' ? 'bg-brand-primary/20 text-brand-glow' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>💰 Receita</button>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Descrição</label>
                                <input type="text" value={newTx.description} onChange={(e) => setNewTx((p) => ({ ...p, description: e.target.value }))} placeholder="Ex: Supermercado Extra" required className="input-field" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                <div>
                                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Valor (R$)</label>
                                    <input type="number" step="0.01" min="0.01" value={newTx.amount} onChange={(e) => setNewTx((p) => ({ ...p, amount: e.target.value }))} placeholder="0,00" required className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Data</label>
                                    <input type="date" value={newTx.date} onChange={(e) => setNewTx((p) => ({ ...p, date: e.target.value }))} required className="input-field" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-2">Categoria</label>
                                <input
                                    type="text"
                                    value={catSearch}
                                    onChange={(e) => setCatSearch(e.target.value)}
                                    placeholder="🔍 Buscar categoria..."
                                    className="input-field mb-3 text-xs"
                                />
                                <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3">
                                    {categoryGroups.map((group) => {
                                        const cats = allCategories.filter(
                                            (c) => categoryConfig[c]?.group === group.id &&
                                                (catSearch === '' || categoryConfig[c]?.label?.toLowerCase().includes(catSearch.toLowerCase()))
                                        );
                                        if (cats.length === 0) return null;
                                        return (
                                            <div key={group.id}>
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mb-1.5">{group.label}</p>
                                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 animate-fade-in">
                                                    {cats.map((c) => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => { setNewTx((p) => ({ ...p, category: c })); setCatSearch(''); }}
                                                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-0.5 ${newTx.category === c
                                                                ? 'border-brand-glow bg-brand-primary/10 shadow-tech-card'
                                                                : 'border-[var(--border)] bg-gray-800/40/[0.02] hover:border-[var(--border)] hover:bg-gray-800/40/[0.05]'
                                                                }`}
                                                        >
                                                            <span className="text-lg leading-none">{categoryConfig[c]?.icon}</span>
                                                            <span className="text-[8px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide truncate w-full text-center">
                                                                {categoryConfig[c]?.label?.split(' ')[0] || c}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Notas (opcional)</label>
                                <input type="text" value={newTx.notes} onChange={(e) => setNewTx((p) => ({ ...p, notes: e.target.value }))} placeholder="Observações..." className="input-field" />
                            </div>
                            <button type="submit" className="gradient-btn w-full justify-center py-3">
                                {editId ? 'Salvar Transação' : 'Adicionar Transação'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
