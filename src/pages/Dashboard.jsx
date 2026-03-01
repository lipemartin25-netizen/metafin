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

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-[var(--menta-dark)] animate-spin" /></div>;

    const ttStyle = { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' };

    return (
        <div className="py-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] uppercase tracking-tight">{t('dashboard')}</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">{t('dashboard_overview')}</p>
                </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 animate-fade-in">
                <div className="pastel-card-featured p-6 group">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mb-2">{t('total_balance')}</p>
                            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-[var(--text-primary)] group-hover:text-[var(--menta-dark)] transition-colors">{fmt(summary.balance)}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[var(--menta-soft)] flex items-center justify-center border border-[var(--menta-border)] shadow-inset-3d group-hover:scale-110 transition-transform">
                            <Wallet className="w-6 h-6 text-[var(--menta-dark)]" />
                        </div>
                    </div>
                </div>

                <div className="tech-card p-6 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mb-2">{t('income')}</p>
                            <h2 className="text-2xl font-playfair font-bold text-emerald-500">{fmt(summary.totalIncome)}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:rotate-12 transition-transform">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="tech-card p-6 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mb-2">{t('expenses')}</p>
                            <h2 className="text-2xl font-playfair font-bold text-rose-500">{fmt(summary.totalExpenses)}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:-rotate-12 transition-transform">
                            <TrendingDown className="w-5 h-5 text-rose-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="tech-card lg:col-span-2 p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-widest">
                            <TrendingUp className="w-4 h-4 text-[var(--menta-dark)]" /> {t('cash_flow')}
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{t('income')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-400" />
                                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{t('expenses')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="colInc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickFormatter={(val) => val.split('-')[2]} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip contentStyle={ttStyle} cursor={{ stroke: 'var(--border-subtle)' }} />
                                <Area type="monotone" dataKey="income" stroke="#34d399" fillOpacity={1} fill="url(#colInc)" strokeWidth={2} />
                                <Area type="monotone" dataKey="expense" stroke="#fb7185" fillOpacity={1} fill="url(#colExp)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="tech-card p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-8 uppercase tracking-widest">{t('expenses_by_category')}</h3>
                    <div className="h-[200px] flex-shrink-0">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                        {categoryData.map((entry, idx) => <Cell key={idx} fill={entry.color} stroke="var(--bg-[var(--bg-elevated)])" strokeWidth={2} />)}
                                    </Pie>
                                    <Tooltip contentStyle={ttStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-xs italic">{t('no_expenses')}</div>
                        )}
                    </div>
                    <div className="mt-6 flex-1 space-y-3">
                        {categoryData.slice(0, 4).map((cat, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                    <span className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">{cat.name}</span>
                                </div>
                                <span className="text-xs text-[var(--text-primary)] font-bold">{fmt(cat.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions & AI Layer */}
            <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="tech-card p-0 overflow-hidden flex flex-col lg:col-span-2">
                    <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)]">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">{t('recent_transactions')}</h3>
                        <Link to="/app/transactions" className="text-[10px] text-[var(--menta-dark)] hover:text-[var(--menta-dark)]-light font-bold uppercase tracking-[0.2em] transition-colors">{t('see_all')}</Link>
                    </div>
                    <div className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-[var(--bg-elevated)])]">
                        {recentTransactions.map((tx) => (
                            <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-[var(--bg-surface)] transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center">
                                        {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4 text-[var(--menta-dark)]" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--menta-dark)] transition-colors">{tx.description}</p>
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{categoryConfig[tx.category]?.label || tx.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-[var(--menta-dark)]' : 'text-[var(--text-primary)]'}`}>
                                        {tx.type === 'income' ? '+' : '-'} {fmt(Math.abs(tx.amount))}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">{tx.date}</p>
                                </div>
                            </div>
                        ))}
                        {recentTransactions.length === 0 && (
                            <div className="p-12 text-center">
                                <Wallet className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
                                <p className="text-[var(--text-muted)] text-sm font-medium">{t('no_recent_transactions')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Insights Section */}
                <ProGate feature="aiInsights">
                    <div className="tech-card p-6 flex flex-col relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--menta-soft)] blur-[50px] pointer-events-none" />

                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="w-8 h-8 rounded-lg bg-[var(--menta-soft)] flex items-center justify-center border border-[var(--menta-border)]">
                                <Sparkles className="w-4 h-4 text-[var(--menta-dark)]" />
                            </div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Otimize com IA</h3>
                        </div>

                        <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed relative z-10 font-light max-w-[250px]">
                            Use a rede neural para predição de gastos e rebalanceamento patrimonial.
                        </p>

                        <div className="mt-auto space-y-2 relative z-10">
                            {[
                                { icon: '📊', label: 'Análise Geral', prompt: 'Me dê um resumo financeiro completo' },
                                { icon: '💰', label: 'Otimizar Gasto', prompt: 'Me dê dicas de onde posso cortar gastos supérfluos' },
                                { icon: '📈', label: 'Projeção 30d', prompt: 'Qual a minha projeção financeira pro fim do mes?' },
                            ].map((item) => (
                                <Link
                                    key={item.label}
                                    to={`/app/advisor?q=${encodeURIComponent(item.prompt)}`}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] hover:bg-[var(--bg-surface)] hover:border-[var(--menta-border)] transition-all group"
                                >
                                    <span className="text-base grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{item.icon}</span>
                                    <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider group-hover:text-[var(--text-primary)] transition-colors">
                                        {item.label}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </ProGate>
            </div>
        </div>
    );
}
