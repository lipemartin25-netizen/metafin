import { useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../hooks/useAnalytics';
import { Plus, Trash2, CheckCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck, Banknote, RefreshCw, X } from 'lucide-react';
import banksData from '../data/banks.json';

const SAMPLE_BANK_TRANSACTIONS = {
    nubank: [
        { description: 'Uber Trip', amount: -24.90, category: 'transporte', type: 'expense' },
        { description: 'Spotify', amount: -21.90, category: 'entretenimento', type: 'expense' },
        { description: 'Padaria Real', amount: -15.50, category: 'alimentacao', type: 'expense' },
    ],
    itau: [
        { description: 'Netflix', amount: -55.90, category: 'entretenimento', type: 'expense' },
        { description: 'Condomínio', amount: -450.00, category: 'moradia', type: 'expense' },
        { description: 'Salário', amount: 3500.00, category: 'renda', type: 'income' },
    ],
    // Generic fallback for others
    generic: [
        { description: 'Transferência Recebida', amount: 150.00, category: 'renda', type: 'income' },
        { description: 'Pagamento Boleto', amount: -89.90, category: 'moradia', type: 'expense' },
    ]
};

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function BankAccounts() {
    const { addBulkTransactions, deleteTransaction, transactions } = useTransactions();
    const { user } = useAuth();
    const [connectedBanks, setConnectedBanks] = useState([]);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [selectedBank, setSelectedBank] = useState(null);
    const [connectingState, setConnectingState] = useState('idle'); // idle, redirecting, consenting, success
    const [syncing, setSyncing] = useState(null);

    // Load initial state from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('sf_connected_banks');
        if (stored) setConnectedBanks(JSON.parse(stored));
    }, []);

    const saveBanks = (banks) => {
        setConnectedBanks(banks);
        localStorage.setItem('sf_connected_banks', JSON.stringify(banks));
    };

    const handleConnectClick = (bank) => {
        setSelectedBank(bank);
        setConnectingState('redirecting');
        setShowConnectModal(true);
        analytics.featureUsed(`connect_bank_start_${bank.id}`);

        // Simulate redirection delay
        setTimeout(() => {
            setConnectingState('consenting');
        }, 1500);
    };

    const handleConfirmConsent = async () => {
        setConnectingState('syncing');

        // Simulate API call and syncing transactions
        await new Promise(r => setTimeout(r, 2000));

        const newBank = { ...selectedBank, connectedAt: new Date().toISOString(), balance: Math.random() * 5000 + 500 };
        const updated = [...connectedBanks, newBank];
        saveBanks(updated);

        // Import sample transactions for this bank
        const samples = SAMPLE_BANK_TRANSACTIONS[selectedBank.id] || SAMPLE_BANK_TRANSACTIONS.generic;
        const transactionsToAdd = samples.map(t => ({
            ...t,
            date: new Date().toISOString().split('T')[0],
            status: 'categorized',
            notes: `Importado via Open Finance (${selectedBank.name})`
        }));

        await addBulkTransactions(transactionsToAdd);
        analytics.featureUsed(`connect_bank_success_${selectedBank.id}`);
        setConnectingState('success');

        setTimeout(() => {
            setShowConnectModal(false);
            setConnectingState('idle');
            setSelectedBank(null);
        }, 1500);
    };

    const handleDisconnect = async (bankId) => {
        const updated = connectedBanks.filter(b => b.id !== bankId);
        saveBanks(updated);
        analytics.featureUsed('disconnect_bank');
    };

    const handleSync = async (bankId) => {
        setSyncing(bankId);
        await new Promise(r => setTimeout(r, 1500));

        // Simular nova transação encontrada
        const newTx = {
            description: 'Recarga Celular (Sync)',
            amount: -30.00,
            category: 'servicos',
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
            notes: 'Sincronizado automaticamente via Open Finance'
        };
        await addBulkTransactions([newTx]);

        // Atualizar saldo localmente
        const updated = connectedBanks.map(b =>
            b.id === bankId ? { ...b, balance: (b.balance || 0) - 30 } : b
        );
        saveBanks(updated);

        analytics.featureUsed('bank_sync_refresh');
        setSyncing(null);
    };

    const totalBalance = connectedBanks.reduce((sum, b) => sum + (b.balance || 0), 0);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Banknote className="w-6 h-6 text-emerald-400" />
                    Contas Conectadas
                </h1>
                <p className="text-gray-400 text-sm mt-1">Gerencie suas conexões Open Finance e sincronize saldos automaticamente.</p>
            </div>

            {/* Total Balance Card */}
            <div className="glass-card bg-gradient-to-br from-gray-900 to-gray-800 border-emerald-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400">Saldo Integrado Estimado</p>
                        <h2 className="text-3xl font-bold text-emerald-400 mt-1">{fmt(totalBalance)}</h2>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-200/70 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                    <CheckCircle className="w-3 h-3" />
                    Conexão segura via Open Finance Brasil
                </div>
            </div>

            {/* My Connected Accounts */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    Minhas Contas <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-gray-300">{connectedBanks.length}</span>
                </h3>

                {connectedBanks.length === 0 ? (
                    <div className="glass-card text-center py-8 border-dashed border-2 border-white/10 bg-transparent">
                        <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-3">
                            <Banknote className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-gray-400 text-sm mb-4">Nenhuma conta conectada ainda.</p>
                        <button onClick={() => {
                            const newSection = document.getElementById('new-connection');
                            newSection?.scrollIntoView({ behavior: 'smooth' });
                        }} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                            Conectar primeira conta
                        </button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {connectedBanks.map(bank => (
                            <div key={bank.id} className="glass-card flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ backgroundColor: bank.color, color: bank.textColor }}>
                                        {bank.logo}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">{bank.name}</h4>
                                        <p className="text-xs text-gray-400">Conta Corrente •••• {Math.floor(Math.random() * 9000) + 1000}</p>
                                        <p className="text-sm font-medium text-emerald-400 mt-0.5">{fmt(bank.balance || 0)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleSync(bank.id)}
                                        className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all ${syncing === bank.id ? 'animate-spin text-emerald-400' : ''}`}
                                        title="Sincronizar"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDisconnect(bank.id)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                        title="Desconectar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add New Connection */}
            <div id="new-connection">
                <h3 className="text-lg font-semibold text-white mb-3">Conectar Nova Instituição</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {banksData.filter(b => !connectedBanks.find(cb => cb.id === b.id)).map(bank => (
                        <button
                            key={bank.id}
                            onClick={() => handleConnectClick(bank)}
                            className="glass-card hover:bg-white/5 transition-all p-4 flex flex-col items-center gap-3 text-center border hover:border-emerald-500/30 group"
                        >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: bank.color, color: bank.textColor }}>
                                {bank.logo}
                            </div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white">{bank.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Connect Modal */}
            {showConnectModal && selectedBank && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-md p-0 overflow-hidden animate-slide-up relative">
                        <button onClick={() => setShowConnectModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>

                        {/* Header */}
                        <div className="bg-white/5 p-6 text-center border-b border-white/5">
                            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4" style={{ backgroundColor: selectedBank.color, color: selectedBank.textColor }}>
                                {selectedBank.logo}
                            </div>
                            <h2 className="text-xl font-bold text-white">Conectar {selectedBank.name}</h2>
                            <p className="text-sm text-gray-400 mt-1">Ambiente seguro Open Finance</p>
                        </div>

                        {/* Content based on state */}
                        <div className="p-6">
                            {connectingState === 'redirecting' && (
                                <div className="text-center py-6">
                                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                                    <p className="text-white font-medium">Redirecionando para o aplicativo do banco...</p>
                                    <p className="text-sm text-gray-500 mt-2">Valide sua identidade no app da instituição.</p>
                                </div>
                            )}

                            {connectingState === 'consenting' && (
                                <div className="space-y-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                        <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Autorização de Dados</h4>
                                        <ul className="text-xs text-gray-300 space-y-2 list-disc pl-4">
                                            <li>Dados cadastrais</li>
                                            <li>Saldos e extratos de conta corrente</li>
                                            <li>Informações de cartão de crédito</li>
                                        </ul>
                                    </div>
                                    <p className="text-xs text-gray-500 text-center px-4">
                                        Ao continuar, você concorda em compartilhar seus dados financeiros para fins de gestão financeira, com validade de 12 meses.
                                    </p>
                                    <button onClick={handleConfirmConsent} className="gradient-btn w-full py-3 text-sm font-semibold">
                                        Confirmar e Conectar
                                    </button>
                                </div>
                            )}

                            {connectingState === 'syncing' && (
                                <div className="text-center py-6">
                                    <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                                    <p className="text-white font-medium">Sincronizando transações...</p>
                                    <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos.</p>
                                </div>
                            )}

                            {connectingState === 'success' && (
                                <div className="text-center py-6 animate-fade-in">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Conectado com Sucesso!</h3>
                                    <p className="text-sm text-gray-400">Suas transações foram importadas e o saldo atualizado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
