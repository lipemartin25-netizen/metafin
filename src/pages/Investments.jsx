import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../hooks/useAnalytics';
import { usePluggy } from '../hooks/usePluggy';
import {
    TrendingUp,
    Briefcase,
    CheckCircle,
    Building2,
    Trash2,
    ExternalLink,
    Plug,
    RefreshCw,
    ShieldCheck,
    X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import banksData from '../data/banks.json';
import benchmarksData from '../data/benchmarks.json';

// Cores para o grafico de pizza
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Link oficial da B3 para consulta (nao e fonte de dados)
const B3_PORTAL_URL = 'https://www.investidor.b3.com.br/login?utm_source=B3_MVP&utm_medium=HM_PF&utm_campaign=menu';

export default function Investments() {
    const { user: _user } = useAuth();
    const { openWidget, connecting: pluggyConnecting, error: pluggyError } = usePluggy();
    const [connectedBrokers, setConnectedBrokers] = useState([]);

    // Carregar estado inicial do localStorage
    useEffect(() => {
        const stored = localStorage.getItem('sf_connected_brokers');
        if (stored) setConnectedBrokers(JSON.parse(stored));
    }, []);

    const saveBrokers = (brokers) => {
        setConnectedBrokers(brokers);
        localStorage.setItem('sf_connected_brokers', JSON.stringify(brokers));
    };

    // Excluir carteira
    const handleDisconnectBroker = (brokerId) => {
        if (!confirm('Tem certeza que deseja excluir esta carteira? Os dados serao removidos.')) return;
        const updated = connectedBrokers.filter(b => b.id !== brokerId);
        saveBrokers(updated);
        analytics.featureUsed('disconnect_broker');
    };

    // Conectar via Pluggy (Open Finance) — unica via real de integracao
    const handleConnectPluggy = () => {
        openWidget();
        analytics.featureUsed('connect_broker_pluggy');
    };

    // Calcular totais
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

        const allocationData = Object.keys(allocation).map(type => ({
            name: type,
            value: allocation[type]
        })).sort((a, b) => b.value - a.value);

        return { total, allocationData };
    }, [connectedBrokers]);

    // Filtrar corretoras disponiveis
    const availableBrokers = banksData.filter(b =>
        !connectedBrokers.find(cb => cb.id === b.id) &&
        (b.type === 'broker' || b.type === 'integration')
    );

    const evolutionData = useMemo(() => {
        const baseValue = portfolio.total || 150000;
        const startValue = baseValue * 0.85;

        return benchmarksData.map((b, i) => {
            const progress = (i + 1) / benchmarksData.length;
            const portValue = startValue + (baseValue - startValue) * Math.pow(progress, 0.8) * (1 + (Math.random() * 0.05 - 0.025));

            return {
                ...b,
                portfolio: portValue,
                ibov_norm: (b.ibovespa / benchmarksData[0].ibovespa) * startValue,
                cdi_norm: Math.pow(1.008, i) * startValue,
                analysis_target: startValue * Math.pow(1.011, i)
            };
        });
    }, [portfolio.total]);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                        Investimentos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Acompanhe seu patrimonio consolidado via Open Finance.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleConnectPluggy}
                        disabled={pluggyConnecting}
                        className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20"
                    >
                        {pluggyConnecting ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plug className="w-4 h-4" />
                        )}
                        Conectar via Pluggy
                    </button>
                    <button
                        onClick={() => window.open(B3_PORTAL_URL, '_blank')}
                        className="bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
                    >
                        <ExternalLink className="w-4 h-4" />
                        B3
                    </button>
                </div>
            </div>

            {/* Pluggy Error */}
            {pluggyError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-bold">Erro na conexao Pluggy:</p>
                        <p className="text-xs opacity-80">{pluggyError}</p>
                        {pluggyError === 'Failed to fetch' && (
                            <p className="text-[10px] mt-1 text-red-300/80 italic">Dica: O servidor em localhost:3001 nao esta respondendo. Verifique se o terminal do server esta rodando.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Security Badge */}
            <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Conexao segura via Open Finance</p>
                    <p className="text-[10px] text-gray-500">Dados criptografados end-to-end. Suas credenciais nunca passam pelo SmartFinance — elas ficam dentro do Pluggy (regulado pelo Banco Central).</p>
                </div>
            </div>

            {/* Portfolio Summary */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-card bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800 border-emerald-500/20 col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Building2 className="w-32 h-32 text-emerald-500" /></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Patrimonio Total</p>
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{fmt(portfolio.total)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg flex items-center gap-1 font-medium">
                            <TrendingUp className="w-3 h-3" /> +1.2% hoje
                        </span>
                        <span className="text-gray-500">Variacao diaria simulada</span>
                    </div>
                </div>

                <div className="glass-card flex flex-col justify-center items-center relative">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 absolute top-4 left-4">Alocacao</h3>
                    {portfolio.total > 0 ? (
                        <div className="w-full h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={portfolio.allocationData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                        {portfolio.allocationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(val) => fmt(val)} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 text-xs py-8">
                            Conecte uma corretora via Pluggy para ver sua alocacao
                        </div>
                    )}
                </div>
            </div>

            {/* Evolution Chart */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Evolucao do Patrimonio</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Comparado a Ibovespa, CDI e Selic</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Carteira</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Ibov</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">CDI</span>
                        </div>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="month"
                                stroke="#6b7280"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => v.split('-')[1] + '/' + v.split('-')[0].slice(2)}
                            />
                            <YAxis hide domain={['auto', 'auto']} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                formatter={(v, name) => [
                                    fmt(v),
                                    name === 'portfolio' ? 'Minha Carteira' :
                                        name === 'ibov_norm' ? 'Ibovespa' :
                                            name === 'cdi_norm' ? 'CDI' :
                                                name === 'analysis_target' ? 'Analise Alvo' : name
                                ]}
                            />
                            <Line type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={3} dot={false} tension={0.4} />
                            <Line type="monotone" dataKey="cdi_norm" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                            <Line type="monotone" dataKey="ibov_norm" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            <Line type="monotone" dataKey="analysis_target" name="Analise Alvo" stroke="#ec4899" strokeWidth={2} strokeDasharray="10 5" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* My Portfolios */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    Minhas Carteiras
                    <span className="bg-gray-100 dark:bg-white/10 text-xs px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">{connectedBrokers.length}</span>
                </h3>
                {connectedBrokers.length === 0 ? (
                    <div className="glass-card text-center py-12 border-dashed border-2 border-gray-200 dark:border-white/10 bg-transparent">
                        <div className="w-16 h-16 rounded-full bg-purple-500/10 mx-auto flex items-center justify-center mb-4">
                            <Plug className="w-8 h-8 text-purple-500" />
                        </div>
                        <h4 className="text-gray-900 dark:text-white font-medium mb-1">Nenhuma corretora conectada</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                            Conecte suas contas da XP, BTG, Rico, ou qualquer instituicao via <strong>Pluggy Open Finance</strong> para ver todos os seus ativos em um so lugar.
                        </p>
                        <button
                            onClick={handleConnectPluggy}
                            disabled={pluggyConnecting}
                            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 mx-auto"
                        >
                            <Plug className="w-5 h-5" />
                            Conectar via Open Finance
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {connectedBrokers.map(broker => (
                            <div key={broker.id} className="glass-card">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-white/5 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg" style={{ backgroundColor: broker.color || '#6b7280', color: broker.textColor || '#fff' }}>
                                            {broker.logo || broker.name?.[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">{broker.name}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Conectado em {new Date(broker.connectedAt).toLocaleDateString()}
                                                <span className="ml-1 text-purple-500">• via Pluggy</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                            <p className="text-xl font-bold text-emerald-500 dark:text-emerald-400">{fmt(broker.totalValue || 0)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDisconnectBroker(broker.id)}
                                            className="p-2 rounded-lg text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            title="Excluir carteira"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {broker.assets && broker.assets.length > 0 && (
                                    <div className="space-y-2">
                                        {broker.assets.map((asset, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                                                        {asset.symbol?.substring(0, 4) || '---'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</p>
                                                        <p className="text-xs text-gray-500">{asset.type} {asset.quantity ? `• ${asset.quantity} un.` : ''}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{fmt((asset.price || 0) * (asset.quantity || 1))}</p>
                                                    {asset.price && <p className="text-xs text-gray-500">{fmt(asset.price)}/un</p>}
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

            {/* Connect New Broker — Pluggy Only */}
            <div id="connect-broker">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conectar Corretora ou Banco de Investimento</h3>

                {/* Pluggy CTA */}
                <div className="mb-6">
                    <button
                        onClick={handleConnectPluggy}
                        disabled={pluggyConnecting}
                        className="w-full glass-card p-5 flex items-center gap-4 bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/30 hover:border-purple-500/60 transition-all text-left group"
                    >
                        <div className="w-14 h-14 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform">
                            <Plug className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Conectar via Open Finance (Pluggy)
                                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-lg">SEGURO</span>
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Importa ativos de qualquer instituicao brasileira: XP, BTG, Rico, Clear, Nubank, Itau, Bradesco e centenas mais.
                                Regulado pelo Banco Central do Brasil.
                            </p>
                        </div>
                        <div className="text-purple-400 group-hover:translate-x-1 transition-transform flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </button>
                </div>

                {/* Info cards */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <a
                        href={B3_PORTAL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-card p-4 flex items-center gap-4 bg-gradient-to-r from-yellow-500/5 to-transparent border-yellow-500/20 hover:border-yellow-500/50 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-yellow-500 text-black flex items-center justify-center font-bold text-xl shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">B3</div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                                Area do Investidor B3
                                <ExternalLink className="w-3 h-3 text-yellow-500" />
                            </h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Consulte sua posicao diretamente no portal oficial da bolsa.</p>
                        </div>
                    </a>

                    <div className="glass-card p-4 flex items-center gap-4 bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Seguranca</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                API keys protegidas server-side. Conexao E2E. Dados trafegam apenas entre sua instituicao e o Pluggy (BCB).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Visual broker grid — all point to Pluggy */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    Instituicoes disponiveis via Pluggy Open Finance:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {availableBrokers.filter(b => b.id !== 'openfinance').map(broker => (
                        <button
                            key={broker.id}
                            onClick={handleConnectPluggy}
                            className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 hover:border-purple-500/30 transition-all flex flex-col items-center gap-2 text-center group"
                            title={`Conectar ${broker.name} via Pluggy`}
                        >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow transition-transform group-hover:scale-110" style={{ backgroundColor: broker.color, color: broker.textColor }}>
                                {broker.logo}
                            </div>
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white truncate w-full leading-tight">{broker.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
