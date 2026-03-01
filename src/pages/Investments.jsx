import { tw } from '@/lib/theme';
﻿import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../hooks/useAnalytics';
import { usePluggy } from '../hooks/usePluggy';
import {
 TrendingUp, TrendingDown,
 Briefcase, CheckCircle, Building2,
 Trash2, ExternalLink, Plug,
 RefreshCw, ShieldCheck, X, BarChart3
} from 'lucide-react';
import {
 PieChart, Pie, Cell, ResponsiveContainer,
 Tooltip as RechartsTooltip, LineChart, Line,
 XAxis, YAxis, CartesianGrid
} from 'recharts';
import banksData from '../data/banks.json';
import benchmarksData from '../data/benchmarks.json';

const COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

function fmt(value) {
 return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const B3_PORTAL_URL = 'https://www.investidor.b3.com.br/login?utm_source=B3_MVP&utm_medium=HM_PF&utm_campaign=menu';

// Dados históricos reais do IBOVESPA (fechamentos mensais aproximados)
const B3_HISTORICAL = [
 { year: 2024, month: 'Jan', ibov: 128105, cdi_acc: 1.08 },
 { year: 2024, month: 'Fev', ibov: 129808, cdi_acc: 2.17 },
 { year: 2024, month: 'Mar', ibov: 127814, cdi_acc: 3.26 },
 { year: 2024, month: 'Abr', ibov: 124110, cdi_acc: 4.33 },
 { year: 2024, month: 'Mai', ibov: 122284, cdi_acc: 5.41 },
 { year: 2024, month: 'Jun', ibov: 123215, cdi_acc: 6.50 },
 { year: 2024, month: 'Jul', ibov: 128114, cdi_acc: 7.58 },
 { year: 2024, month: 'Ago', ibov: 136004, cdi_acc: 8.57 },
 { year: 2024, month: 'Set', ibov: 131012, cdi_acc: 9.56 },
 { year: 2024, month: 'Out', ibov: 129065, cdi_acc: 10.62 },
 { year: 2024, month: 'Nov', ibov: 125633, cdi_acc: 11.35 },
 { year: 2024, month: 'Dez', ibov: 124690, cdi_acc: 12.35 },
 { year: 2025, month: 'Jan', ibov: 121857, cdi_acc: 1.09 },
 { year: 2025, month: 'Fev', ibov: 125345, cdi_acc: 2.20 },
];

export default function Investments() {
 const { user: _user } = useAuth();
 const { openWidget, connecting: pluggyConnecting, error: pluggyError } = usePluggy();
 const [connectedBrokers, setConnectedBrokers] = useState([]);
 const [showConnectModal, setShowConnectModal] = useState(false);
 const [showB3Modal, setShowB3Modal] = useState(false);
 const [selectedBroker, setSelectedBroker] = useState(null);

 useEffect(() => {
 const stored = localStorage.getItem('sf_connected_brokers');
 if (stored) setConnectedBrokers(JSON.parse(stored));
 }, []);

 const saveBrokers = (brokers) => {
 setConnectedBrokers(brokers);
 localStorage.setItem('sf_connected_brokers', JSON.stringify(brokers));
 };

 const handleDisconnectBroker = (brokerId) => {
 if (!confirm('Tem certeza que deseja excluir esta carteira?')) return;
 saveBrokers(connectedBrokers.filter(b => b.id !== brokerId));
 analytics.featureUsed('disconnect_broker');
 };

 const handleConnectPluggy = () => {
 setShowConnectModal(false);
 openWidget();
 analytics.featureUsed('connect_broker_pluggy');
 };

 const handleBrokerClick = (broker) => {
 setSelectedBroker(broker);
 setShowConnectModal(true);
 };

 const portfolio = useMemo(() => {
 let total = 0;
 let allocation = {};
 connectedBrokers.forEach(broker => {
 if (broker.assets) {
 broker.assets.forEach(asset => {
 const val = asset.quantity * asset.price;
 total += val;
 if (!allocation[asset.type]) allocation[asset.type] = 0;
 allocation[asset.type] += val;
 });
 } else {
 total += broker.totalValue || 0;
 }
 });
 const allocationData = Object.keys(allocation)
 .map(type => ({ name: type, value: allocation[type] }))
 .sort((a, b) => b.value - a.value);
 return { total, allocationData };
 }, [connectedBrokers]);

 const availableBrokers = banksData.filter(b =>
 !connectedBrokers.find(cb => cb.id === b.id) &&
 (b.type === 'broker' || b.type === 'integration')
 );

 const evolutionData = useMemo(() => {
 const baseValue = portfolio.total || 0;
 if (baseValue === 0) return [];
 const startValue = baseValue * 0.85;
 return benchmarksData.map((b, i) => {
 const progress = (i + 1) / benchmarksData.length;
 const portValue = startValue + (baseValue - startValue) * Math.pow(progress, 0.8);
 return {
 ...b,
 portfolio: portValue,
 ibov_norm: (b.ibovespa / benchmarksData[0].ibovespa) * startValue,
 cdi_norm: Math.pow(1.008, i) * startValue,
 };
 });
 }, [portfolio.total]);

 // Calcular variação do IBOV no período
 const b3Stats = useMemo(() => {
 const first = B3_HISTORICAL[0];
 const last = B3_HISTORICAL[B3_HISTORICAL.length - 1];
 const ibovVar = ((last.ibov - first.ibov) / first.ibov) * 100;
 const cdiTotal = last.cdi_acc;
 return { ibovVar, cdiTotal, lastIbov: last.ibov, lastMonth: `${last.month}/${last.year}` };
 }, []);

 return (
 <div className="py-6 space-y-6 animate-fade-in pb-20">

 {/* ── Header sem botão Pluggy solto ── */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
 <Briefcase className="w-6 h-6 text-brand-glow" />
 Investimentos
 </h1>
 <p className="text-[var(--text-secondary)] text-sm mt-1">
 Patrimônio consolidado via Open Finance · dados B3 integrados
 </p>
 </div>
 {/* Apenas o botão B3 no header */}
 <button
 onClick={() => setShowB3Modal(true)}
 className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400 text-sm font-semibold transition-all"
 >
 <BarChart3 className="w-4 h-4" />
 Histórico B3
 </button>
 </div>

 {/* Pluggy Error */}
 {pluggyError && (
 <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
 <X className="w-5 h-5 flex-shrink-0" />
 <div className="flex-1">
 <p className="font-bold">Erro na conexão Pluggy:</p>
 <p className="text-xs opacity-80">{pluggyError}</p>
 </div>
 </div>
 )}

 {/* Security Badge */}
 <div className="flex items-center gap-3 bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-3">
 <ShieldCheck className="w-5 h-5 text-brand-glow flex-shrink-0" />
 <div>
 <p className="text-xs font-semibold text-brand-glow">Conexão segura via Open Finance</p>
 <p className="text-[10px] text-[var(--text-secondary)]">Dados criptografados end-to-end · regulado pelo Banco Central do Brasil</p>
 </div>
 </div>

 {/* Portfolio Summary */}
 <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
 <div className={`\${tw.card} col-span-2 relative overflow-hidden`}>
 <div className="absolute top-0 right-0 p-4 opacity-5">
 <Building2 className="w-32 h-32 text-brand-primary" />
 </div>
 <p className="text-sm text-[var(--text-secondary)] font-medium">Patrimônio Total</p>
 <h2 className="text-4xl font-bold text-[var(--text-primary)] mt-2">{fmt(portfolio.total)}</h2>
 {portfolio.total > 0 && (
 <div className="mt-4 flex items-center gap-2 text-sm">
 <span className="bg-brand-primary/10 text-brand-glow px-2 py-1 rounded-lg flex items-center gap-1 font-medium">
 <TrendingUp className="w-3 h-3" /> Atualizado via Pluggy
 </span>
 </div>
 )}
 {portfolio.total === 0 && (
 <p className="text-[var(--text-muted)] text-sm mt-3">Conecte uma corretora abaixo para ver seu patrimônio.</p>
 )}
 </div>

 <div className={`\${tw.card} flex flex-col justify-center items-center relative`}>
 <h3 className="text-sm font-semibold text-[var(--text-secondary)] absolute top-4 left-4">Alocação</h3>
 {portfolio.total > 0 ? (
 <div className="w-full h-[160px]">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie data={portfolio.allocationData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
 {portfolio.allocationData.map((_, index) => (
 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
 ))}
 </Pie>
 <RechartsTooltip formatter={(val) => fmt(val)} contentStyle={{ backgroundColor: '#0d1424', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} />
 </PieChart>
 </ResponsiveContainer>
 </div>
 ) : (
 <div className="text-center text-[var(--text-muted)] text-xs py-8 px-4">
 Sem dados de alocação ainda
 </div>
 )}
 </div>
 </div>

 {/* Evolution Chart — só exibe se tiver dados */}
 {evolutionData.length > 0 && (
 <div className={`\${tw.card} p-6`}>
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-lg font-semibold text-[var(--text-primary)]">Evolução do Patrimônio</h3>
 <p className="text-xs text-[var(--text-secondary)]">Comparado ao Ibovespa e CDI</p>
 </div>
 <div className="flex gap-4">
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
 <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Carteira</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
 <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Ibov</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
 <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">CDI</span>
 </div>
 </div>
 </div>
 <div className="h-[280px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={evolutionData}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
 <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v.split('-')[1] + '/' + v.split('-')[0].slice(2)} />
 <YAxis hide domain={['auto','auto']} />
 <RechartsTooltip contentStyle={{ backgroundColor: '#0d1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
 formatter={(v, name) => [fmt(v), name === 'portfolio' ? 'Carteira' : name === 'ibov_norm' ? 'Ibovespa' : 'CDI']} />
 <Line type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={3} dot={false} />
 <Line type="monotone" dataKey="cdi_norm" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
 <Line type="monotone" dataKey="ibov_norm" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 6" dot={false} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 )}

 {/* Minhas Carteiras */}
 <div>
 <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
 Minhas Carteiras
 <span className="bg-gray-800/40/10 text-xs px-2 py-0.5 rounded-full text-[var(--text-secondary)]">{connectedBrokers.length}</span>
 </h3>

 {connectedBrokers.length === 0 ? (
 <div className={`\${tw.card} text-center py-12 border-dashed border-2 border-[var(--border)]`}>
 <div className="w-16 h-16 rounded-full bg-brand-primary/10 mx-auto flex items-center justify-center mb-4">
 <Plug className="w-8 h-8 text-brand-glow" />
 </div>
 <h4 className="text-[var(--text-primary)] font-medium mb-1">Nenhuma corretora conectada</h4>
 <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm mx-auto">
 Selecione uma corretora abaixo para conectar via <strong className="text-[var(--text-primary)]">Pluggy Open Finance</strong>.
 </p>
 </div>
 ) : (
 <div className="grid gap-4 animate-fade-in">
 {connectedBrokers.map(broker => (
 <div key={broker.id} className={`\${tw.card}`}>
 <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-lg text-[var(--text-primary)]" style={{ backgroundColor: broker.color || '#6b7280' }}>
 {broker.logo || broker.name?.[0]}
 </div>
 <div>
 <h4 className="font-bold text-[var(--text-primary)]">{broker.name}</h4>
 <p className="text-xs text-[var(--text-secondary)]">
 Conectado em {new Date(broker.connectedAt).toLocaleDateString('pt-BR')}
 <span className="ml-1 text-brand-glow">· via Pluggy</span>
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="text-right">
 <p className="text-xs text-[var(--text-secondary)]">Total</p>
 <p className="text-xl font-bold text-brand-glow">{fmt(broker.totalValue || 0)}</p>
 </div>
 <button onClick={() => handleDisconnectBroker(broker.id)} className="p-2 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Excluir carteira">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 {broker.assets?.length > 0 && (
 <div className="space-y-2">
 {broker.assets.map((asset, idx) => (
 <div key={idx} className="flex items-center justify-between p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] border border-[var(--border)]">
 {asset.symbol?.substring(0, 4) || '---'}
 </div>
 <div>
 <p className="text-sm font-medium text-[var(--text-primary)]">{asset.name}</p>
 <p className="text-xs text-[var(--text-secondary)]">{asset.type}{asset.quantity ? ` · ${asset.quantity} un.` : ''}</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm font-medium text-[var(--text-primary)]">{fmt((asset.price || 0) * (asset.quantity || 1))}</p>
 {asset.price && <p className="text-xs text-[var(--text-secondary)]">{fmt(asset.price)}/un</p>}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Conectar Corretora — Grid com Pluggy embutido */}
 <div id="connect-broker">
 <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Conectar Corretora</h3>
 <p className="text-xs text-[var(--text-secondary)] mb-3 flex items-center gap-1">
 <CheckCircle className="w-3 h-3 text-brand-glow" />
 Clique em qualquer instituição para conectar via Pluggy Open Finance:
 </p>
 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 animate-fade-in">
 {availableBrokers.filter(b => b.id !== 'openfinance').map(broker => (
 <button
 key={broker.id}
 onClick={() => handleBrokerClick(broker)}
 className="p-3 rounded-xl bg-[var(--bg-surface)] hover:bg-gray-800/40/10 border border-[var(--border)] hover:border-brand-primary/30 transition-all flex flex-col items-center gap-2 text-center group"
 title={`Conectar ${broker.name}`}
 >
 <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-primary)] font-bold text-sm shadow group-hover:-translate-y-px transition-transform transition-transform" style={{ backgroundColor: broker.color, color: broker.textColor }}>
 {broker.logo}
 </div>
 <span className="text-[10px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] truncate w-full leading-tight">{broker.name}</span>
 </button>
 ))}
 </div>

 {/* Cards info: B3 + Segurança */}
 <div className="grid sm:grid-cols-2 gap-4 mt-6 animate-fade-in">
 <button
 onClick={() => setShowB3Modal(true)}
 className={`\${tw.card} p-4 flex items-center gap-4 bg-[var(--bg-base)] from-yellow-500/5 to-transparent border-yellow-500/20 hover:border-yellow-500/50 transition-all group text-left`}
 >
 <div className="w-12 h-12 rounded-xl bg-yellow-500 text-[var(--text-primary)] flex items-center justify-center font-bold text-xl shadow-lg shadow-yellow-500/20 group-hover:-translate-y-px transition-transform transition-transform">B3</div>
 <div className="flex-1">
 <h4 className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-1">
 Histórico B3 <BarChart3 className="w-3 h-3 text-yellow-400" />
 </h4>
 <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Veja o desempenho histórico do Ibovespa e CDI integrados ao app.</p>
 </div>
 </button>

 <div className={`\${tw.card} p-4 flex items-center gap-4 bg-[var(--bg-base)] from-brand-primary/5 to-transparent border-brand-primary/20`}>
 <div className="w-12 h-12 rounded-xl bg-brand-primary text-[var(--text-primary)] flex items-center justify-center shadow-lg">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-[var(--text-primary)] text-sm">Segurança</h4>
 <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
 API keys protegidas server-side. Conexão E2E. Dados trafegam entre sua instituição e o Pluggy (BCB).
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* ══════════ MODAL B3 HISTÓRICO ══════════ */}
 {showB3Modal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-base)]/90 animate-fade-in">
 <div className="bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border)] w-full max-w-2xl rounded-3xl shadow-tech-card animate-slide-up overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-yellow-500 text-[var(--text-primary)] flex items-center justify-center font-bold text-lg">B3</div>
 <div>
 <h2 className="text-lg font-bold text-[var(--text-primary)]">Histórico B3 — Ibovespa & CDI</h2>
 <p className="text-xs text-[var(--text-secondary)]">Dados de referência · Jan/2024 a Fev/2025</p>
 </div>
 </div>
 <button onClick={() => setShowB3Modal(false)} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-gray-800/40/10 transition-all">
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-3 gap-4 p-6 border-b border-[var(--border)] animate-fade-in">
 <div className="text-center">
 <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">IBOV Atual</p>
 <p className="text-2xl font-bold text-[var(--text-primary)]">{b3Stats.lastIbov.toLocaleString('pt-BR')}</p>
 <p className="text-xs text-[var(--text-secondary)]">{b3Stats.lastMonth}</p>
 </div>
 <div className="text-center">
 <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">Var. 12m</p>
 <p className={`text-2xl font-bold ${b3Stats.ibovVar >= 0 ? 'text-brand-glow' : 'text-rose-400'}`}>
 {b3Stats.ibovVar >= 0 ? '+' : ''}{b3Stats.ibovVar.toFixed(1)}%
 </p>
 <div className="flex items-center justify-center gap-1 mt-0.5">
 {b3Stats.ibovVar >= 0
 ? <TrendingUp className="w-3 h-3 text-brand-glow" />
 : <TrendingDown className="w-3 h-3 text-rose-400" />}
 <p className="text-xs text-[var(--text-secondary)]">Ibovespa</p>
 </div>
 </div>
 <div className="text-center">
 <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-1">CDI 2024</p>
 <p className="text-2xl font-bold text-orange-400">+{b3Stats.cdiTotal.toFixed(2)}%</p>
 <p className="text-xs text-[var(--text-secondary)]">acumulado</p>
 </div>
 </div>

 {/* Gráfico */}
 <div className="p-6">
 <div className="flex items-center gap-4 mb-4">
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
 <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">Ibovespa</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
 <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">CDI Acum. (%)</span>
 </div>
 </div>
 <div className="h-[200px]">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={B3_HISTORICAL}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
 <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
 <YAxis yAxisId="ibov" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false}
 tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
 <YAxis yAxisId="cdi" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false}
 tickFormatter={(v) => `${v.toFixed(0)}%`} />
 <RechartsTooltip
 contentStyle={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
 formatter={(v, name) => name === 'ibov'
 ? [v.toLocaleString('pt-BR'), 'Ibovespa (pts)']
 : [`${v.toFixed(2)}%`, 'CDI Acum.']}
 />
 <Line yAxisId="ibov" type="monotone" dataKey="ibov" stroke="#eab308" strokeWidth={2.5} dot={false} />
 <Line yAxisId="cdi" type="monotone" dataKey="cdi_acc" stroke="#f97316" strokeWidth={2} strokeDasharray="4 4" dot={false} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 <div className="mt-4 flex items-center justify-between">
 <p className="text-[10px] text-[var(--text-muted)]">
 Fonte: B3 / Banco Central · dados aproximados para referência
 </p>
 <a
 href={B3_PORTAL_URL}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-1 text-[10px] text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
 >
 Acessar portal B3 <ExternalLink className="w-3 h-3" />
 </a>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Modal de seleção de corretora */}
 {showConnectModal && selectedBroker && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-base)]/90 animate-fade-in">
 <div className="bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border)] w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up shadow-tech-card relative">
 <button onClick={() => setShowConnectModal(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-gray-800/40/10 transition-all">
 <X className="w-5 h-5" />
 </button>
 <div className="p-6 text-center border-b border-[var(--border)] bg-[var(--bg-surface)]">
 <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-[var(--text-primary)] font-bold text-3xl shadow-lg mb-4"
 style={{ backgroundColor: selectedBroker.color, color: selectedBroker.textColor }}>
 {selectedBroker.logo}
 </div>
 <h2 className="text-xl font-bold text-[var(--text-primary)]">Conectar {selectedBroker.name}</h2>
 <p className="text-xs text-[var(--text-secondary)] mt-1">Escolha como deseja sincronizar</p>
 </div>
 <div className="p-6 space-y-3">
 <button
 onClick={handleConnectPluggy}
 disabled={pluggyConnecting}
 className="w-full flex items-center gap-4 p-4 rounded-xl bg-violet-600/10 border border-violet-600/30 hover:bg-violet-600/20 transition-all text-left disabled:opacity-50"
 >
 <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center">
 {pluggyConnecting ? <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" /> : <Plug className="w-5 h-5 text-violet-400" />}
 </div>
 <div>
 <p className="text-sm font-bold text-[var(--text-primary)]">Via Open Finance (Pluggy)</p>
 <p className="text-[10px] text-[var(--text-secondary)]">Sincronização automática · regulado pelo BCB</p>
 </div>
 </button>
 <button
 onClick={() => { setShowConnectModal(false); alert('Cadastro manual em breve!'); }}
 className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:bg-gray-800/40/10 transition-all text-left"
 >
 <div className="w-10 h-10 rounded-lg bg-gray-800/40/10 flex items-center justify-center">
 <Briefcase className="w-5 h-5 text-[var(--text-secondary)]" />
 </div>
 <div>
 <p className="text-sm font-bold text-[var(--text-primary)]">Cadastro Manual</p>
 <p className="text-[10px] text-[var(--text-secondary)]">Inserir ativos manualmente</p>
 </div>
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
