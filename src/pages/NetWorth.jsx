import { tw } from '@/lib/theme';
import { useMemo, useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Landmark, TrendingUp, TrendingDown, Wallet, CreditCard, PieChart, Building2, Plus, X, Trash2, Home as HomeIcon, Car, Bitcoin, FileDigit } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function fmt(v) {
 return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const TYPE_ICONS = {
 property: HomeIcon,
 vehicle: Car,
 crypto: Bitcoin,
 other_asset: FileDigit,
 checking: Wallet,
 savings: Building2,
 investment: TrendingUp
};

const TYPE_LABELS = {
 property: 'Imóvel',
 vehicle: 'Veículo',
 crypto: 'Criptoativos',
 other_asset: 'Outro Ativo',
 checking: 'Conta Corrente',
 savings: 'Poupança',
 investment: 'Investimento'
};

export default function NetWorth() {
 const { user } = useAuth();
 const { summary } = useTransactions();
 const [customAssets, setCustomAssets] = useState([]);
 const [history, setHistory] = useState([]);

 // Modal state
 const [showModal, setShowModal] = useState(false);
 const [loading, setLoading] = useState(false);
 const [form, setForm] = useState({ name: '', type: 'property', current_value: '', is_liability: false });

 // Load Data
 useEffect(() => {
 if (!user) return;
 async function load() {
 const { data: aData } = await supabase.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
 if (aData) setCustomAssets(aData);

 const { data: hData } = await supabase.from('net_worth_history').select('*').eq('user_id', user.id).order('snapshot_date', { ascending: true });
 if (hData) setHistory(hData);
 }
 load();
 }, [user]);

 const data = useMemo(() => {
 const accounts = JSON.parse(localStorage.getItem('sf_bank_accounts') || '[]');
 const brokers = JSON.parse(localStorage.getItem('sf_connected_brokers') || '[]');
 const cards = JSON.parse(localStorage.getItem('sf_credit_cards') || '[]');

 const totalAccounts = accounts.reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
 const totalInvestments = brokers.reduce((s, b) => s + (parseFloat(b.totalValue) || 0), 0);
 const totalCardDebt = cards.reduce((s, c) => s + (parseFloat(c.used) || 0), 0);

 let customAssetsTotal = 0;
 let customLiabilitiesTotal = 0;
 customAssets.forEach(a => {
 if (a.is_liability) customLiabilitiesTotal += parseFloat(a.current_value);
 else customAssetsTotal += parseFloat(a.current_value);
 });

 const assets = totalAccounts + totalInvestments + Math.max(summary.balance, 0) + customAssetsTotal;
 const liabilities = totalCardDebt + customLiabilitiesTotal;
 const netWorth = assets - liabilities;

 return { totalAccounts, totalInvestments, totalCardDebt, assets, liabilities, netWorth, customAssetsTotal, customLiabilitiesTotal };
 }, [summary, customAssets]);

 const timeline = useMemo(() => {
 if (history.length >= 2) {
 return history.map(h => {
 const d = new Date(h.snapshot_date);
 return {
 month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
 netWorth: parseFloat(h.net_worth)
 };
 });
 }
 // Fallback mockup se não houver base histórica gravada ainda no banco
 const months = [];
 const base = data.netWorth > 0 ? data.netWorth : 50000;
 for (let i = 5; i >= 0; i--) {
 const d = new Date();
 d.setMonth(d.getMonth() - i);
 const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
 const variation = 1 + (Math.random() * 0.08 - 0.02) * (6 - i) / 6;
 months.push({
 month: label,
 netWorth: Math.round(base * (0.85 + (0.15 * (6 - i) / 6)) * variation),
 });
 }
 months[months.length - 1].netWorth = Math.round(data.netWorth);
 return months;
 }, [data.netWorth, history]);

 const breakdown = [
 { label: 'Contas Bancárias', value: data.totalAccounts, icon: Wallet, color: '#3b82f6', type: 'asset' },
 { label: 'Investimentos', value: data.totalInvestments, icon: Building2, color: '#10b981', type: 'asset' },
 { label: 'Bens & Outros', value: data.customAssetsTotal, icon: HomeIcon, color: '#f59e0b', type: 'asset' },
 { label: 'Faturas Cartão', value: data.totalCardDebt, icon: CreditCard, color: '#ef4444', type: 'liability' },
 { label: 'Empréstimos/Dívidas', value: data.customLiabilitiesTotal, icon: TrendingDown, color: '#eab308', type: 'liability' },
 ];

 const handleSaveAsset = async (e) => {
 e.preventDefault();
 if (!user || !form.name || !form.current_value) return;
 setLoading(true);
 try {
 const payload = {
 user_id: user.id,
 name: form.name,
 type: form.type,
 current_value: parseFloat(form.current_value),
 is_liability: form.is_liability
 };
 const { data: inserted, error } = await supabase.from('assets').insert([payload]).select().single();
 if (inserted) {
 setCustomAssets(prev => [inserted, ...prev]);
 setShowModal(false);
 setForm({ name: '', type: 'property', current_value: '', is_liability: false });
 }
 if (error) console.error(error);
 } catch (e) { console.error(e); }
 setLoading(false);
 };

 const handleDeleteAsset = async (id) => {
 if (!user) return;
 setCustomAssets(prev => prev.filter(a => a.id !== id));
 await supabase.from('assets').delete().eq('id', id);
 };

 return (
 <div className="py-6 space-y-6 animate-fade-in pb-20">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2">
 <Landmark className="w-6 h-6 text-indigo-500" />
 Patrimônio Líquido
 </h1>
 <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visão consolidada de ativos, imóveis e passivos.</p>
 </div>
 <button
 onClick={() => setShowModal(true)}
 className="gradient-btn px-4 py-2 text-sm flex items-center gap-2 shadow-indigo-500/20"
 >
 <Plus className="w-4 h-4" /> Adicionar Patrimônio
 </button>
 </div>

 {/* Main Net Worth Card */}
 <div className={`\${tw.card} !bg-transparent !border-transparent !p-4 !shadow-none !mt-0 relative overflow-hidden`}>
 <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">Patrimônio Líquido Real</p>
 <h2 className={`text-6xl font-extrabold tracking-tighter ${data.netWorth >= 0 ? 'text-[var(--text-primary)] dark:text-[var(--text-primary)]' : 'text-red-500'}`}>
 {fmt(data.netWorth)}
 </h2>

 <div className="mt-8 flex gap-8">
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total de Ativos</p>
 <p className="text-2xl font-bold flex items-center gap-1.5"><TrendingUp className="w-5 h-5 text-brand-primary" /> {fmt(data.assets)}</p>
 </div>
 <div className="w-px bg-gray-800/50 dark:bg-gray-800/40/10" />
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total de Passivos</p>
 <p className="text-2xl font-bold flex items-center gap-1.5"><TrendingDown className="w-5 h-5 text-rose-500" /> {fmt(data.liabilities)}</p>
 </div>
 </div>
 </div>

 {/* Timeline Chart */}
 <div className={`\${tw.card} p-6`}>
 <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] mb-6">Evolução Histórica</h3>
 <div className="h-[250px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
 <defs>
 <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
 <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
 <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
 <Tooltip
 contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
 formatter={v => [fmt(v), 'Patrimônio']}
 />
 <Area type="monotone" dataKey="netWorth" stroke="#6366f1" strokeWidth={3} fill="url(#nwGrad)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Breakdown & Listing */}
 <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
 <div className="space-y-4">
 <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2">
 <PieChart className="w-5 h-5 text-indigo-500" /> Composição Global
 </h3>
 <div className="space-y-3">
 {breakdown.filter(i => i.value > 0).map((item, i) => {
 const Icon = item.icon;
 return (
 <div key={i} className={`${tw.card} flex items-center gap-4 ${item.type === 'liability' ? 'hover:border-red-500/30' : 'hover:border-brand-primary/30'} transition-all`}>
 <div className="w-12 h-12 rounded-xl flex items-center justify-center p-3" style={{ backgroundColor: `${item.color}15` }}>
 <Icon className="w-6 h-6" style={{ color: item.color }} />
 </div>
 <div className="flex-1">
 <p className="text-xs text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase">{item.label}</p>
 <p className={`text-xl font-bold mt-0.5 ${item.type === 'liability' ? 'text-red-500' : 'text-[var(--text-primary)] dark:text-[var(--text-primary)]'}`}>
 {item.type === 'liability' ? '-' : ''}{fmt(item.value)}
 </p>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2">
 <HomeIcon className="w-5 h-5 text-brand-primary" /> Patrimônios Manuais
 </h3>
 {customAssets.length === 0 ? (
 <div className={`\${tw.card} flex flex-col items-center justify-center h-[200px] text-center border-dashed`}>
 <Landmark className="w-8 h-8 text-gray-400 mb-3" />
 <p className="text-sm font-medium text-[var(--text-primary)] dark:text-[var(--text-primary)] mb-1">Nenhum Patrimônio Adicionado</p>
 <p className="text-xs text-gray-500">Adicione imóveis, veículos ou dívidas ativas para rastreio.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {customAssets.map(a => {
 const AssetIcon = TYPE_ICONS[a.type] || FileDigit;
 return (
 <div key={a.id} className={`\${tw.card} flex items-center justify-between p-4 group`}>
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.is_liability ? 'bg-red-500/10 text-red-500' : 'bg-brand-primary/10 text-brand-primary'}`}>
 <AssetIcon className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)] leading-tight">{a.name}</p>
 <p className="text-[10px] text-gray-500 uppercase tracking-widest">{TYPE_LABELS[a.type]}</p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <p className={`text-sm font-bold ${a.is_liability ? 'text-red-500' : 'text-brand-primary'}`}>
 {a.is_liability ? '-' : '+'}{fmt(a.current_value)}
 </p>
 <button
 onClick={() => handleDeleteAsset(a.id)}
 className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>

 {/* Modal de Adição */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
 <div className={`\${tw.card} w-full max-w-md animate-slide-up relative bg-gray-800/40 dark:bg-surface-900 border border-gray-700/40 dark:border-[var(--border)]`}>
 <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-[var(--text-primary)] dark:hover:text-[var(--text-primary)]">
 <X className="w-5 h-5" />
 </button>

 <h2 className="text-xl font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] mb-6">Novo Registro</h2>

 <form onSubmit={handleSaveAsset} className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nome do Patrimônio / Dívida</label>
 <input required type="text" placeholder="Ex: Apartamento Centro"
 className="w-full px-4 py-3 rounded-xl bg-gray-800/30 dark:bg-black/20 border border-gray-700/40 dark:border-[var(--border)] focus:border-brand-primary focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)]"
 value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
 </div>

 <div className="grid grid-cols-2 gap-4 animate-fade-in">
 <div>
 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Valor Atual (R$)</label>
 <input required type="number" step="0.01" placeholder="350000"
 className="w-full px-4 py-3 rounded-xl bg-gray-800/30 dark:bg-black/20 border border-gray-700/40 dark:border-[var(--border)] focus:border-brand-primary focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)]"
 value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} />
 </div>
 <div>
 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Categoria</label>
 <select
 className="w-full px-4 py-3 rounded-xl bg-gray-800/30 dark:bg-black/20 border border-gray-700/40 dark:border-[var(--border)] focus:border-brand-primary focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm text-[var(--text-primary)] dark:text-[var(--text-primary)]"
 value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
 {Object.entries(TYPE_LABELS).map(([k, v]) => (
 <option key={k} value={k}>{v}</option>
 ))}
 </select>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tipo de Registro</label>
 <div className="grid grid-cols-2 gap-3 animate-fade-in">
 <button type="button" onClick={() => setForm({ ...form, is_liability: false })}
 className={`px-3 py-3 rounded-xl text-sm font-bold border transition-all ${!form.is_liability ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary dark:text-brand-glow shadow-glass-card' : 'border-gray-700/40 dark:border-[var(--border)] text-gray-500 hover:bg-gray-800/30 dark:hover:bg-gray-800/40/5'}`}>
 + É um Ativo
 </button>
 <button type="button" onClick={() => setForm({ ...form, is_liability: true })}
 className={`px-3 py-3 rounded-xl text-sm font-bold border transition-all ${form.is_liability ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 shadow-glass-card' : 'border-gray-700/40 dark:border-[var(--border)] text-gray-500 hover:bg-gray-800/30 dark:hover:bg-gray-800/40/5'}`}>
 - Passivo (Dívida)
 </button>
 </div>
 </div>

 <button type="submit" disabled={loading} className="w-full gradient-btn py-3.5 mt-2 rounded-xl font-bold shadow-lg shadow-brand-primary/20 disabled:opacity-50 text-sm hover:shadow-brand-primary/30 transition-shadow">
 {loading ? 'Salvando...' : 'Salvar Registro'}
 </button>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
