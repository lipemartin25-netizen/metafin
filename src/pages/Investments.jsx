import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { analytics } from '../hooks/useAnalytics';
import {
    TrendingUp,
    TrendingDown,
    PieChart as PieIcon,
    Briefcase,
    Plus,
    Link2,
    CheckCircle,
    Loader2,
    X,
    Building2,
    Landmark
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import banksData from '../data/banks.json';
import investmentsData from '../data/investments.json';
import benchmarksData from '../data/benchmarks.json';

// Cores para o gráfico de pizza
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Investments() {
    const { user } = useAuth();
    const { addBulkTransactions } = useTransactions();
    const [connectedBrokers, setConnectedBrokers] = useState([]);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [connectingState, setConnectingState] = useState('idle');

    // Carregar estado inicial
    useEffect(() => {
        const stored = localStorage.getItem('sf_connected_brokers');
        if (stored) setConnectedBrokers(JSON.parse(stored));
    }, []);

    const saveBrokers = (brokers) => {
        setConnectedBrokers(brokers);
        localStorage.setItem('sf_connected_brokers', JSON.stringify(brokers));
    };

    const handleConnectClick = (broker) => {
        setSelectedBroker(broker);
        setConnectingState('redirecting');
        setShowConnectModal(true);
        analytics.featureUsed(`connect_broker_start_${broker.id}`);

        // Simular fluxo de conexão
        setTimeout(() => setConnectingState('consenting'), 1500);
    };

    const handleConfirmConsent = async () => {
        setConnectingState('syncing');
        await new Promise(r => setTimeout(r, 2000));

        const assets = investmentsData[selectedBroker.id] || investmentsData.xp || [];
        const totalValue = assets.reduce((sum, asset) => sum + (asset.quantity * asset.price), 0);

        // Gerar transações mock para o histórico
        const mockTxs = [
            {
                date: new Date().toISOString().split('T')[0],
                description: `Aporte Inicial - ${selectedBroker.name}`,
                amount: totalValue * 0.1,
                category: 'investimentos',
                type: 'expense'
            },
            {
                date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
                description: `Dividendos Recebidos - ${selectedBroker.name}`,
                amount: totalValue * 0.005,
                category: 'investimentos',
                type: 'income'
            }
        ];
        await addBulkTransactions(mockTxs);

        const newBroker = {
            ...selectedBroker,
            connectedAt: new Date().toISOString(),
            totalValue,
            assets
        };

        const updated = [...connectedBrokers, newBroker];
        saveBrokers(updated);

        analytics.featureUsed(`connect_broker_success_${selectedBroker.id}`);
        setConnectingState('success');

        setTimeout(() => {
            setShowConnectModal(false);
            setConnectingState('idle');
            setSelectedBroker(null);
        }, 1500);
    };

    // Calcular totais
    const portfolio = useMemo(() => {
        let total = 0;
        let allocation = {};

        connectedBrokers.forEach(broker => {
            broker.assets.forEach(asset => {
                const val = asset.quantity * asset.price;
                total += val;
                if (!allocation[asset.type]) allocation[asset.type] = 0;
                allocation[asset.type] += val;
            });
        });

        const allocationData = Object.keys(allocation).map(type => ({
            name: type,
            value: allocation[type]
        })).sort((a, b) => b.value - a.value);

        return { total, allocationData };
    }, [connectedBrokers]);

    // Filtrar apenas corretoras e integrações (excluir bancos de varejo simples se quiser, mas muitos têm investimentos)
    // Vou listar todos que têm type 'broker' ou 'integration' ou 'bank' (pois bancos tbm têm investimentos)
    // Mas vou dar destaque para type 'broker' e 'integration'
    const availableBrokers = banksData.filter(b => !connectedBrokers.find(cb => cb.id === b.id));

    const evolutionData = useMemo(() => {
        const baseValue = portfolio.total || 150000; // Mock base if empty
        const startValue = baseValue * 0.85; // Começa 15% abaixo para mostrar evolução

        return benchmarksData.map((b, i) => {
            const progress = (i + 1) / benchmarksData.length;
            const portValue = startValue + (baseValue - startValue) * Math.pow(progress, 0.8) * (1 + (Math.random() * 0.05 - 0.025));

            // Normalizar índices para base 100 ou similar
            return {
                ...b,
                portfolio: portValue,
                ibov_norm: (b.ibovespa / benchmarksData[0].ibovespa) * startValue,
                cdi_norm: Math.pow(1.008, i) * startValue, // 0.8% am aprox
            };
        });
    }, [portfolio.total]);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-emerald-400" />
                        Investimentos
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Acompanhe seu patrimônio consolidado.</p>
                </div>
                {connectedBrokers.length > 0 && (
                    <button onClick={() => window.open('https://www.b3.com.br', '_blank')} className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                        Acessar Área do Investidor B3 <Link2 className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Portfolio Summary */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-card bg-gradient-to-br from-gray-900 to-gray-800 border-emerald-500/20 col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Building2 className="w-32 h-32 text-emerald-500" /></div>
                    <p className="text-sm text-gray-400 font-medium">Patrimônio Total</p>
                    <h2 className="text-4xl font-bold text-white mt-2">{fmt(portfolio.total)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg flex items-center gap-1 font-medium">
                            <TrendingUp className="w-3 h-3" /> +1.2% hoje
                        </span>
                        <span className="text-gray-500">Variação diária simulada</span>
                    </div>
                </div>

                <div className="glass-card flex flex-col justify-center items-center relative">
                    <h3 className="text-sm font-semibold text-gray-300 absolute top-4 left-4">Alocação</h3>
                    {portfolio.total > 0 ? (
                        <div className="w-full h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={portfolio.allocationData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                        {portfolio.allocationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(val) => fmt(val)} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 text-xs py-8">
                            Conecte uma corretora para ver sua alocação
                        </div>
                    )}
                </div>
            </div>

            {/* Evolution Chart */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Evolução do Patrimônio</h3>
                        <p className="text-xs text-gray-400">Comparado a Ibovespa, CDI e Selic</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Carteira</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Ibov</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">CDI</span>
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
                                formatter={(v, name) => [fmt(v), name === 'portfolio' ? 'Minha Carteira' : name === 'ibov_norm' ? 'Ibovespa' : 'CDI']}
                            />
                            <Line type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={3} dot={false} tension={0.4} />
                            <Line type="monotone" dataKey="ibov_norm" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            <Line type="monotone" dataKey="cdi_norm" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Brokers List */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Minhas Carteiras</h3>
                {connectedBrokers.length === 0 ? (
                    <div className="glass-card text-center py-12 border-dashed border-2 border-white/10 bg-transparent">
                        <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4">
                            <Link2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h4 className="text-white font-medium mb-1">Nenhuma corretora conectada</h4>
                        <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                            Conecte suas contas da XP, BTG, Rico, ou integre diretamente com a <strong>B3</strong> para ver todos os seus ativos em um só lugar.
                        </p>
                        <button onClick={() => {
                            const section = document.getElementById('connect-broker');
                            section?.scrollIntoView({ behavior: 'smooth' });
                        }} className="gradient-btn px-6 py-2">
                            Conectar Agora
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {connectedBrokers.map(broker => (
                            <div key={broker.id} className="glass-card">
                                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg" style={{ backgroundColor: broker.color, color: broker.textColor }}>
                                            {broker.logo}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{broker.name}</h4>
                                            <p className="text-xs text-gray-400">Conectado em {new Date(broker.connectedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Total na Corretora</p>
                                        <p className="text-xl font-bold text-emerald-400">{fmt(broker.totalValue)}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {broker.assets.map((asset, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300 border border-white/10">
                                                    {asset.symbol.substring(0, 4)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{asset.name}</p>
                                                    <p className="text-xs text-gray-500">{asset.type} • {asset.quantity} un.</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-white">{fmt(asset.price * asset.quantity)}</p>
                                                <p className="text-xs text-gray-500">{fmt(asset.price)}/un</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Connect New Broker */}
            <div id="connect-broker">
                <h3 className="text-lg font-semibold text-white mb-4">Conectar Corretora ou Banco de Investimento</h3>

                {/* Integration Types */}
                <div className="mb-6 grid sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => handleConnectClick(availableBrokers.find(b => b.id === 'b3'))}
                        className="glass-card p-4 flex items-center gap-4 bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30 hover:border-yellow-500 transition-all text-left"
                        disabled={connectedBrokers.some(b => b.id === 'b3')}
                    >
                        <div className="w-12 h-12 rounded-xl bg-yellow-500 text-black flex items-center justify-center font-bold text-xl shadow-lg shadow-yellow-500/20">B3</div>
                        <div>
                            <h4 className="font-bold text-white">B3 Área do Investidor</h4>
                            <p className="text-xs text-gray-400 mt-1">Integração oficial. Importa todas as ações, FIIs e Tesouro Direto direto da bolsa.</p>
                        </div>
                    </button>
                    <button
                        onClick={() => handleConnectClick(availableBrokers.find(b => b.id === 'openfinance'))}
                        className="glass-card p-4 flex items-center gap-4 bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/30 hover:border-emerald-500 transition-all text-left"
                        disabled={connectedBrokers.some(b => b.id === 'openfinance')}
                    >
                        <div className="w-12 h-12 rounded-xl bg-gray-700 text-white flex items-center justify-center font-bold text-lg shadow-lg">OF</div>
                        <div>
                            <h4 className="font-bold text-white">Open Finance Brasil</h4>
                            <p className="text-xs text-gray-400 mt-1">Conecte múltiplas instituições de uma só vez através do sistema padronizado.</p>
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {availableBrokers.filter(b => b.id !== 'b3' && b.id !== 'openfinance').map(broker => (
                        <button
                            key={broker.id}
                            onClick={() => handleConnectClick(broker)}
                            className="glass-card hover:bg-white/5 transition-all p-4 flex flex-col items-center gap-3 text-center border hover:border-emerald-500/30 group"
                        >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: broker.color, color: broker.textColor }}>
                                {broker.logo}
                            </div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white truncate w-full">{broker.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 border border-white/5 px-1.5 py-0.5 rounded">{broker.type === 'broker' ? 'Corretora' : 'Banco'}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Connect Modal */}
            {showConnectModal && selectedBroker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-md p-0 overflow-hidden animate-slide-up relative">
                        <button onClick={() => setShowConnectModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>

                        <div className="bg-white/5 p-6 text-center border-b border-white/5">
                            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4" style={{ backgroundColor: selectedBroker.color, color: selectedBroker.textColor }}>
                                {selectedBroker.logo}
                            </div>
                            <h2 className="text-xl font-bold text-white">Conectar {selectedBroker.name}</h2>
                            <p className="text-sm text-gray-400 mt-1">Ambiente Seguro de Investimentos</p>
                        </div>

                        <div className="p-6">
                            {connectingState === 'redirecting' && (
                                <div className="text-center py-6">
                                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                                    <p className="text-white font-medium">Redirecionando para autenticação...</p>
                                    <p className="text-sm text-gray-500 mt-2">Aguarde enquanto conectamos com a instituição.</p>
                                </div>
                            )}

                            {connectingState === 'consenting' && (
                                <div className="space-y-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                        <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Autorização de Leitura</h4>
                                        <ul className="text-xs text-gray-300 space-y-2 list-disc pl-4">
                                            <li>Posição consolidada de ativos</li>
                                            <li>Histórico de movimentações (Renda Variável)</li>
                                            <li>Produtos de Renda Fixa e Fundos</li>
                                        </ul>
                                    </div>
                                    <p className="text-xs text-gray-500 text-center px-4">
                                        Esta conexão permite apenas a leitura dos dados. Nenhuma transação pode ser realizada por aqui.
                                    </p>
                                    <button onClick={handleConfirmConsent} className="gradient-btn w-full py-3 text-sm font-semibold">
                                        Confirmar Conexão
                                    </button>
                                </div>
                            )}

                            {connectingState === 'syncing' && (
                                <div className="text-center py-6">
                                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                                    <p className="text-white font-medium">Importando carteira de ativos...</p>
                                    <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns instantes.</p>
                                </div>
                            )}

                            {connectingState === 'success' && (
                                <div className="text-center py-6 animate-fade-in">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Carteira Sincronizada!</h3>
                                    <p className="text-sm text-gray-400">Seus investimentos foram importados com sucesso.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

