import { tw } from '@/lib/theme';
import { useMemo, useEffect } from 'react';
import { usePageAnnounce } from '../components/A11yAnnouncer';
import { Link } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import {
 TrendingUp,
 TrendingDown,
 Wallet,
 ArrowUpRight,
 ArrowDownRight,
 Loader2,
} from 'lucide-react';
import {
 AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
 ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import categoriesData from '../data/data.json';
import { analytics } from '../hooks/useAnalytics';
import { useLanguage } from '../contexts/LanguageContext';
import ProGate from '../components/ProGate';
import { Sparkles } from 'lucide-react';
import { formatCurrency as fmt } from '../lib/formatters';

const categoryConfig = categoriesData.categories;

export default function Dashboard() {
 const { t } = useLanguage();
 const { transactions, loading } = useTransactions();
 usePageAnnounce(t('dashboard'));

 useEffect(() => { analytics.dashboardViewed(); }, []);

 // ========== PROCESSAMENTO DE DADOS ==========
 const summary = useMemo(() => {
 return transactions.reduce((acc, tx) => {
 const amount = Math.abs(tx.amount);
 if (tx.type === 'income') acc.totalIncome += amount;
 else acc.totalExpenses += amount;
 return acc;
 }, { totalIncome: 0, totalExpenses: 0, balance: 0 });
 }, [transactions]);

 summary.balance = summary.totalIncome - summary.totalExpenses;

 const dailyData = useMemo(() => {
 const last30Days = [...Array(30)].map((_, i) => {
 const d = new Date();
 d.setDate(d.getDate() - i);
 return d.toISOString().split('T')[0];
 }).reverse();

 const dataMap = transactions.reduce((acc, tx) => {
 if (!acc[tx.date]) acc[tx.date] = { date: tx.date, income: 0, expense: 0 };
 if (tx.type === 'income') acc[tx.date].income += Math.abs(tx.amount);
 else acc[tx.date].expense += Math.abs(tx.amount);
 return acc;
 }, {});

 return last30Days.map(date => dataMap[date] || { date, income: 0, expense: 0 });
 }, [transactions]);

 const categoryData = useMemo(() => {
 const cats = transactions
 .filter(tx => tx.type === 'expense')
 .reduce((acc, tx) => {
 acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
 return acc;
 }, {});

 return Object.entries(cats).map(([name, value]) => ({
 name: categoryConfig[name]?.label || name,
 value,
 color: categoryConfig[name]?.color || '#94a3b8'
 })).sort((a, b) => b.value - a.value);
 }, [transactions]);

 const recentTransactions = useMemo(() => {
 return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
 }, [transactions]);
 // =====================================

 if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-brand-glow animate-spin" /></div>;

 const ttStyle = { backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' };

 return (
 <div className="py-6 space-y-6 animate-fade-in">
 <div className="flex items-center justify-between">
 <div><h1 className="text-2xl font-bold text-[var(--text-primary)] uppercase tracking-tight">{t('dashboard')}</h1><p className="text-gray-400 text-sm mt-1">{t('dashboard_overview')}</p></div>
 </div>

 <div className="grid sm:grid-cols-3 gap-4 animate-fade-in">
 <div className={`\${tw.card} relative overflow-hidden group border-brand-primary/20 bg-[var(--bg-base)] from-surface-900 to-emerald-950/20`}>
 <div className="flex items-center justify-between relative z-10">
 <div>
 <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{t('total_balance')}</p>
 <h2 className="text-3xl font-bold text-[var(--text-primary)]">{fmt(summary.balance)}</h2>
 </div>
 <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 group-hover:-translate-y-px transition-transform transition-transform">
 <Wallet className="w-6 h-6 text-brand-glow" />
 </div>
 </div>
 </div>

 <div className={`\${tw.card} group border-brand-primary/20`}>
 <div className="flex items-center justify-between">
 <div><p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('income')}</p><h2 className="text-2xl font-bold text-brand-glow">{fmt(summary.totalIncome)}</h2></div>
 <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors"><TrendingUp className="w-5 h-5 text-brand-glow" /></div>
 </div>
 </div>

 <div className={`\${tw.card} group border-rose-500/20`}>
 <div className="flex items-center justify-between">
 <div><p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('expenses')}</p><h2 className="text-2xl font-bold text-rose-400">{fmt(summary.totalExpenses)}</h2></div>
 <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors"><TrendingDown className="w-5 h-5 text-rose-400" /></div>
 </div>
 </div>
 </div>

 {/* Charts Grid */}
 <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
 <div className={`\${tw.card} lg:col-span-2 p-6`}>
 <div className="flex items-center justify-between mb-8">
 <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight"><TrendingUp className="w-5 h-5 text-brand-glow" /> {t('cash_flow')}</h3>
 <div className="flex gap-2">
 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-brand-glow" /><span className="text-[10px] text-gray-500 font-bold uppercase">{t('income')}</span></div>
 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-400" /><span className="text-[10px] text-gray-500 font-bold uppercase">{t('expenses')}</span></div>
 </div>
 </div>

 <div className="h-[280px]">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={dailyData}>
 <defs>
 <linearGradient id="colInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} /><stop offset="95%" stopColor="#4ade80" stopOpacity={0} /></linearGradient>
 <linearGradient id="colExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} /><stop offset="95%" stopColor="#fb7185" stopOpacity={0} /></linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
 <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickFormatter={(val) => val.split('-')[2]} axisLine={false} tickLine={false} />
 <YAxis hide />
 <Tooltip contentStyle={ttStyle} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
 <Area type="monotone" dataKey="income" stroke="#4ade80" fillOpacity={1} fill="url(#colInc)" strokeWidth={3} />
 <Area type="monotone" dataKey="expense" stroke="#fb7185" fillOpacity={1} fill="url(#colExp)" strokeWidth={3} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className={`\${tw.card} p-6`}>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-8 uppercase tracking-tight">{t('expenses_by_category')}</h3>
 <div className="h-[200px]">
 {categoryData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
 {categoryData.map((entry, idx) => <Cell key={idx} fill={entry.color} stroke="none" />)}
 </Pie>
 <Tooltip contentStyle={ttStyle} />
 </PieChart>
 </ResponsiveContainer>
 ) : (
 <div className="h-full flex items-center justify-center text-gray-600 text-xs italic">{t('no_expenses')}</div>
 )}
 </div>
 <div className="mt-4 space-y-2">
 {categoryData.slice(0, 4).map((cat, i) => (
 <div key={i} className="flex items-center justify-between group/cat">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
 <span className="text-xs text-gray-400 group-hover/cat:text-gray-200 transition-colors uppercase font-bold">{cat.name}</span>
 </div>
 <span className="text-xs text-[var(--text-primary)] font-bold">{fmt(cat.value)}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Recent Transactions */}
 <div className={`\${tw.card} p-0 overflow-hidden flex flex-col border-[var(--border)]`}>
 <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
 <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-tight">{t('recent_transactions')}</h3>
 <Link to="/app/transactions" className="text-xs text-brand-glow hover:text-purple-300 font-bold uppercase tracking-widest transition-colors">{t('see_all')}</Link>
 </div>
 <div className="divide-y divide-white/5">
 {recentTransactions.map((tx) => (
 <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-800/40/[0.02] transition-colors group">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-surface-800 border border-[var(--border)] flex items-center justify-center group-hover:-translate-y-px transition-transform transition-transform">
 {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5 text-brand-glow" /> : <ArrowDownRight className="w-5 h-5 text-rose-400" />}
 </div>
 <div>
 <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-brand-glow transition-colors">{tx.description}</p>
 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{categoryConfig[tx.category]?.label || tx.category}</p>
 </div>
 </div>
 <div className="text-right">
 <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-brand-glow' : 'text-[var(--text-primary)]'}`}>
 {tx.type === 'income' ? '+' : '-'} {fmt(Math.abs(tx.amount))}
 </p>
 <p className="text-[10px] text-gray-600 font-medium">{tx.date}</p>
 </div>
 </div>
 ))}
 {recentTransactions.length === 0 && (
 <div className="p-12 text-center">
 <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-20" />
 <p className="text-gray-500 text-sm font-medium">{t('no_recent_transactions')}</p>
 </div>
 )}
 </div>
 </div>

 {/* AI Insights Section */}
 <ProGate feature="aiInsights">
 <div className={`\${tw.card} border border-brand-primary/10 p-6 flex flex-col md:flex-row gap-8 items-center bg-[var(--bg-base)] from-surface-900 to-emerald-950/10`}>
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
 <Sparkles className="w-5 h-5 text-brand-glow" />
 </div>
 <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Otimize com IA</h3>
 </div>
 <p className="text-gray-400 text-sm mb-0 leading-relaxed max-w-md">
 Use o chat de nossa rede neural para obter análises personalizadas e previsões de gastos.
 A IA processa seus dados localmente para garantir sua privacidade.
 </p>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto animate-fade-in">
 {[
 { icon: '📊', label: 'Análise', prompt: 'Me dê um resumo financeiro completo' },
 { icon: '💰', label: 'Economia', prompt: 'Me dê dicas de como economizar' },
 { icon: '📈', label: 'Previsão', prompt: 'Qual a minha previsão financeira?' },
 ].map((item) => (
 <Link
 key={item.label}
 to={`/app/advisor?q=${encodeURIComponent(item.prompt)}`}
 className="p-4 rounded-2xl bg-gray-800/40/[0.03] border border-[var(--border)] text-center hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all group/glass-card shadow-lg"
 >
 <span className="text-2xl block mb-2 transition-transform group-hover/glass-card:scale-125">{item.icon}</span>
 <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest group-hover/glass-card:text-brand-glow">{item.label}</p>
 </Link>
 ))}
 </div>
 </div>
 </ProGate>
 </div>
 );
}
