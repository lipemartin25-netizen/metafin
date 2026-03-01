import { useState, useEffect, useMemo } from 'react';
import { usePluggy } from '../hooks/usePluggy';
import { TrendingUp, Briefcase, Trash2, ShieldCheck, X, BarChart3, PieChart as PieIcon, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import banksData from '../data/banks.json';
import benchmarksData from '../data/benchmarks.json';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}



export default function Investments() {
    const { openWidget } = usePluggy();
    const [connectedBrokers, setConnectedBrokers] = useState([]);
    const [showConnectModal, setShowConnectModal] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('sf_connected_brokers');
        if (stored) setConnectedBrokers(JSON.parse(stored));
    }, []);

    const portfolio = useMemo(() => {
        let total = 0;
        let allocation = {};
        connectedBrokers.forEach(broker => {
            if (broker.assets) {
                broker.assets.forEach(asset => {
                    const val = (asset.quantity || 0) * (asset.price || 0);
                    total += val;
                    if (!allocation[asset.type]) allocation[asset.type] = 0;
                    allocation[asset.type] += val;
                });
            } else {
                total += broker.totalValue || 0;
            }
        });
        const allocationData = Object.keys(allocation).map(type => ({ name: type, value: allocation[type] })).sort((a, b) => b.value - a.value);
        return { total, allocationData };
    }, [connectedBrokers]);

    const handleDisconnectBroker = (id) => {
        if (!confirm('Excluir carteira?')) return;
        const filtered = connectedBrokers.filter(b => b.id !== id);
        setConnectedBrokers(filtered);
        localStorage.setItem('sf_connected_brokers', JSON.stringify(filtered));
    };

    const evolutionData = useMemo(() => {
        const baseValue = portfolio.total || 10000;
        return benchmarksData.map((b, i) => {
            const progress = (i + 1) / benchmarksData.length;
            return {
                ...b,
                portfolio: baseValue * 0.85 + (baseValue * 0.15 * progress),
                cdi_norm: Math.pow(1.008, i) * baseValue * 0.85
            };
        });
    }, [portfolio.total]);

    const availableBrokers = banksData.filter(b => !connectedBrokers.find(cb => cb.id === b.id) && (b.type === 'broker' || b.type === 'integration'));

    return (
        <div className="py-6 space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tighter uppercase">
                        <Briefcase className="w-8 h-8 text-[var(--menta-dark)]" />
                        Investimentos
                    </h1>
                    <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Consolidação via Open Finance B3.</p>
                </div>
                <button className="btn-menta px-6 py-2.5 text-xs flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Histórico B3
                </button>
            </div>

            {/* Main Portfolio Card */}
            <div className="pastel-card-featured p-10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--menta-soft)]/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1 w-full text-center lg:text-left">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4 flex items-center justify-center lg:justify-start gap-3">
                            <span className="w-10 h-[1px] bg-[var(--border-subtle)]" /> Patrimônio em Renda Variável
                        </p>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--text-primary)] group-hover:scale-[1.01] transition-transform duration-700">
                            {fmt(portfolio.total)}
                        </h2>
                        <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                            <div className="tech-card px-4 py-2 border-[var(--menta-border)] bg-[var(--menta-soft)]/5 text-[10px] font-black text-[var(--menta-dark)] uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5" /> Sincronizado Pluggy
                            </div>
                        </div>
                    </div>

                    <div className="w-40 h-40 flex-shrink-0 relative">
                        {portfolio.total > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={portfolio.allocationData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                                        {portfolio.allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/20 rounded-full border border-dashed border-gray-700 opacity-40">
                                <PieIcon className="w-8 h-8 text-gray-500" />
                            </div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Asset Mix</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Evolution Chart */}
            <div className="tech-card p-6 border-[var(--border-subtle)]">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Performance da Carteira
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis hide domain={['auto', 'auto']} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} formatter={(v) => fmt(v)} />
                            <Line type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="cdi_norm" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Broker Grid */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Instituições Conectadas</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {connectedBrokers.map(b => (
                        <div key={b.id} className="tech-card p-5 border-[var(--border-subtle)] group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg" style={{ backgroundColor: b.color }}>{b.logo || b.name[0]}</div>
                                <button onClick={() => handleDisconnectBroker(b.id)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <h4 className="font-black text-[var(--text-primary)] text-sm uppercase tracking-tight">{b.name}</h4>
                            <p className="text-2xl font-black text-brand-primary mt-1">{fmt(b.totalValue || 0)}</p>
                        </div>
                    ))}
                    <button onClick={() => setShowConnectModal(true)} className="tech-card p-5 border-dashed border-2 border-[var(--border-subtle)]/40 hover:bg-brand-primary/5 transition-all flex flex-col items-center justify-center gap-2 group">
                        <Plus className="w-8 h-8 text-gray-500 group-hover:text-brand-primary transition-colors" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Adicionar Corretora</span>
                    </button>
                </div>
            </div>

            {/* Modal Connect */}
            {showConnectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
                    <div className="tech-card w-full max-w-2xl p-6 bg-gray-800/40 border border-white/5 shadow-2xl overflow-y-auto max-h-[80vh]">
                        <button onClick={() => setShowConnectModal(false)} className="absolute top-4 right-4 text-gray-500"><X className="w-5 h-5" /></button>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 uppercase tracking-wider">Selecionar Instituição</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {availableBrokers.map(b => (
                                <button key={b.id} onClick={() => { openWidget(); setShowConnectModal(false); }} className="tech-card p-3 flex flex-col items-center gap-2 hover:border-brand-primary/40 transition-all group">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: b.color }}>{b.logo}</div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter truncate w-full text-center">{b.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
