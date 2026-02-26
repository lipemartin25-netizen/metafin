import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../hooks/useAnalytics';
import { Trash2, CheckCircle, ShieldCheck, Banknote, RefreshCw, X, Plug, FileText } from 'lucide-react';
import banksData from '../data/banks.json';
import { parseFile, ACCEPTED_EXTENSIONS } from '../lib/fileParser';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { usePluggy } from '../hooks/usePluggy';

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
    generic: [
        { description: 'Transferência Recebida', amount: 150.00, category: 'renda', type: 'income' },
        { description: 'Pagamento Boleto', amount: -89.90, category: 'moradia', type: 'expense' },
    ]
};

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function BankAccounts() {
    const { addBulkTransactions } = useTransactions();
    const { user: _user } = useAuth();
    const { accounts, addAccount, deleteAccount, updateAccount: _updateAccount, syncAccount, loading, error: hookError } = useBankAccounts();
    const { openWidget, connecting: _pluggyLoading, error: pluggyError } = usePluggy();
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [selectedBank, setSelectedBank] = useState(null);
    const [connectingState, setConnectingState] = useState('idle');
    const [syncing, setSyncing] = useState(null);

    const [customNickname, setCustomNickname] = useState('');
    const [customBalance, setCustomBalance] = useState('');
    const [agency, setAgency] = useState('');
    const [accountNum, setAccountNum] = useState('');
    const [dataSource, setDataSource] = useState('empty');
    const [importFile, setImportFile] = useState(null);
    const [importError, setImportError] = useState('');

    const handleConnectClick = (bank) => {
        setSelectedBank(bank);
        setCustomNickname(bank.name);
        setCustomBalance('0,00');
        setAgency('');
        setAccountNum('');
        setDataSource('empty');
        setImportFile(null);
        setImportError('');
        setConnectingState('choosing');
        setShowConnectModal(true);
        analytics.featureUsed(`connect_bank_start_${bank.id}`);
    };

    const handlePluggyDirect = () => {
        setShowConnectModal(false);
        openWidget();
        analytics.featureUsed(`connect_bank_pluggy_${selectedBank?.id}`);
    };

    const handleConfirmConsent = async () => {
        setConnectingState('syncing');
        setImportError('');

        try {
            const balanceNum = parseFloat(customBalance.replace(/\./g, '').replace(',', '.')) || 0;
            let transactionsToAdd = [];

            if (dataSource === 'demo') {
                const samples = SAMPLE_BANK_TRANSACTIONS[selectedBank.id] || SAMPLE_BANK_TRANSACTIONS.generic;
                transactionsToAdd = samples.map(t => ({
                    ...t,
                    date: new Date().toISOString().split('T')[0],
                    status: 'categorized',
                    notes: `Simulado via Demo (${customNickname})`
                }));
            } else if (dataSource === 'file' && importFile) {
                const parsed = await parseFile(importFile);
                transactionsToAdd = parsed.map(t => ({
                    ...t,
                    notes: `Importado via Arquivo (${customNickname})`
                }));
            }

            const newBankData = {
                ...selectedBank,
                name: customNickname || selectedBank.name,
                agency: agency || '0001',
                account_number: accountNum || Math.floor(Math.random() * 90000) + 1000,
                connectedAt: new Date().toISOString(),
                balance: balanceNum
            };

            const result = await addAccount(newBankData);

            if (!result) {
                throw new Error('Falha ao salvar no banco de dados. Verifique sua conexão ou se a tabela bank_accounts existe.');
            }

            if (transactionsToAdd.length > 0) {
                await addBulkTransactions(transactionsToAdd);
            }

            analytics.featureUsed(`connect_bank_success_${selectedBank.id}_${dataSource}`);
            setConnectingState('success');

            setTimeout(() => {
                setShowConnectModal(false);
                setConnectingState('idle');
                setSelectedBank(null);
            }, 1500);
        } catch (err) {
            console.error('Error connecting bank:', err);
            setImportError(err.message);
            setConnectingState('consenting');
        }
    };

    const handleSync = async (bank) => {
        setSyncing(bank.id);

        try {
            if (bank.isPluggy && bank.connectionId) {
                await syncAccount(bank.connectionId);
            } else {
                await new Promise(r => setTimeout(r, 1000));
            }
            analytics.featureUsed('bank_sync_refresh');
        } catch (err) {
            console.error('Failed to sync:', err);
        } finally {
            setSyncing(null);
        }
    };

    const handleDisconnect = async (bank) => {
        if (!confirm(`Tem certeza que deseja desconectar a conta ${bank.display_name || bank.name}? Todos os dados importados serão mantidos no histórico, mas a sincronização será interrompida.`)) return;
        await deleteAccount(bank.id, bank.isPluggy ? 'pluggy' : 'manual');
        analytics.featureUsed('disconnect_bank');
    };

    const totalBalance = (accounts || []).reduce((sum, b) => sum + (b.balance || 0), 0);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Banknote className="text-emerald-500 dark:text-emerald-400" /> Instituições Financeiras
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie suas contas bancárias e conexões Open Finance.</p>
                    </div>
                </div>

                {hookError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3 animate-shake mb-4">
                        <X className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-bold">Erro no Banco de Dados (Supabase):</p>
                            <p className="text-xs opacity-80">{hookError}</p>
                        </div>
                    </div>
                )}

                {pluggyError && (
                    <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 p-4 rounded-xl text-sm flex items-center gap-3 animate-shake mb-4">
                        <X className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-bold">Erro na Conexão Pluggy (Servidor Node):</p>
                            <p className="text-xs opacity-80">{pluggyError}</p>
                            {pluggyError === 'Failed to fetch' && (
                                <p className="text-[10px] mt-1 text-purple-300/80 italic">Dica: O servidor em localhost:3001 não está respondendo. Verifique se o terminal do &quot;server&quot; está rodando.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

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

            <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    Minhas Contas <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-gray-300">{accounts?.length || 0}</span>
                </h3>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                        <p className="text-gray-500 text-sm animate-pulse">Sincronizando suas contas...</p>
                    </div>
                ) : (accounts?.length || 0) === 0 ? (
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
                        {accounts.map(bank => (
                            <div key={bank.id} className="glass-card flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ backgroundColor: bank.color || '#10b981', color: bank.textColor || '#fff' }}>
                                        {bank.logo || bank.bank_name?.charAt(0) || 'B'}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">{bank.display_name || bank.name}</h4>
                                        <p className="text-xs text-gray-400">{bank.bank_name} • Ag {bank.agency || '0001'} • Cta {bank.account_number}</p>
                                        <p className="text-sm font-medium text-emerald-400 mt-0.5">{fmt(bank.balance || 0)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleSync(bank)}
                                        className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all ${syncing === bank.id ? 'animate-spin text-emerald-400' : ''}`}
                                        title="Sincronizar"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDisconnect(bank)}
                                        className="p-2 rounded-lg text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        title="Remover Conta"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div id="new-connection">
                <h3 className="text-lg font-semibold text-white mb-3">Conectar Nova Instituição</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {banksData.filter(b => !accounts?.find(cb => cb.bank_id === b.id || cb.id === b.id)).map(bank => (
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

            {showConnectModal && selectedBank && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-md p-0 overflow-hidden animate-slide-up relative">
                        <button onClick={() => setShowConnectModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>

                        <div className="bg-white/5 p-6 text-center border-b border-white/5">
                            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4" style={{ backgroundColor: selectedBank.color, color: selectedBank.textColor }}>
                                {selectedBank.logo}
                            </div>
                            <h2 className="text-xl font-bold text-white">Conectar {selectedBank.name}</h2>
                            <p className="text-sm text-gray-400 mt-1">Ambiente seguro Open Finance</p>
                        </div>

                        <div className="p-6">
                            {connectingState === 'choosing' && (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-400 text-center mb-4">Escolha como deseja conectar:</p>

                                    <button
                                        onClick={handlePluggyDirect}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all group text-left"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Plug className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Conectar via Open Finance</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Sincroniza automaticamente via Pluggy. Seus dados em tempo real.</p>
                                        </div>
                                        <span className="ml-auto bg-purple-500/30 text-purple-300 text-[9px] font-bold px-2 py-1 rounded-lg flex-shrink-0">RECOMENDADO</span>
                                    </button>

                                    <button
                                        onClick={() => setConnectingState('consenting')}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group text-left"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Cadastro Manual</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Adicione seus dados manualmente ou importe um extrato.</p>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {connectingState === 'consenting' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Apelido da Conta</label>
                                            <input
                                                type="text"
                                                value={customNickname}
                                                onChange={(e) => setCustomNickname(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-emerald-500/50 outline-none mt-1"
                                                placeholder="Ex: Minha Conta Nubank"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Agência</label>
                                            <input
                                                type="text"
                                                value={agency}
                                                onChange={(e) => setAgency(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-emerald-500/50 outline-none mt-1"
                                                placeholder="0001"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Conta</label>
                                            <input
                                                type="text"
                                                value={accountNum}
                                                onChange={(e) => setAccountNum(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-emerald-500/50 outline-none mt-1"
                                                placeholder="12345-6"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Saldo Inicial (R$)</label>
                                            <input
                                                type="text"
                                                value={customBalance}
                                                onChange={(e) => setCustomBalance(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-emerald-500/50 outline-none mt-1"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Fonte de Dados</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => setDataSource('empty')}
                                                className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${dataSource === 'empty' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                            >
                                                LIMPA
                                            </button>
                                            <button
                                                onClick={() => setDataSource('demo')}
                                                className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${dataSource === 'demo' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                            >
                                                DEMO
                                            </button>
                                            <button
                                                onClick={() => setDataSource('file')}
                                                className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${dataSource === 'file' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                            >
                                                EXTRATO
                                            </button>
                                        </div>
                                    </div>

                                    {dataSource === 'file' && (
                                        <div className="space-y-2">
                                            <input
                                                type="file"
                                                accept={ACCEPTED_EXTENSIONS}
                                                onChange={(e) => setImportFile(e.target.files[0])}
                                                className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20 cursor-pointer"
                                            />
                                            <p className="text-[9px] text-gray-500 text-center italic">Arraste seu arquivo CSV, Excel ou JSON para importar transações reais.</p>
                                        </div>
                                    )}

                                    {importError && (
                                        <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20 text-center">{importError}</p>
                                    )}

                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                        <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Conexão Segura</h4>
                                        <p className="text-[10px] text-gray-300">Seus dados serão processados localmente e criptografados. Não armazenamos senhas bancárias.</p>
                                    </div>

                                    <button
                                        onClick={handleConfirmConsent}
                                        disabled={dataSource === 'file' && !importFile}
                                        className="gradient-btn w-full py-3 text-sm font-semibold disabled:opacity-50"
                                    >
                                        Vincular Conta {selectedBank.name}
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
                                    <p className="text-sm text-gray-400">Suas transações de {customNickname} foram importadas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
