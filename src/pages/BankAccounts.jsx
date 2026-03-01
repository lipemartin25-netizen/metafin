import { tw } from '@/lib/theme';
import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { analytics } from '../hooks/useAnalytics';
import { Trash2, CheckCircle, ShieldCheck, Banknote, RefreshCw, X, Plug, FileText, ArrowUpRight, ArrowDownRight, AlertTriangle, Loader2, Plus } from 'lucide-react';
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
    const { accounts, accountTransactions, addAccount, deleteAccount, syncAccount, loading, error: hookError } = useBankAccounts();
    const { openWidget, error: pluggyError } = usePluggy();
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [selectedBank, setSelectedBank] = useState(null);
    const [connectingState, setConnectingState] = useState('idle');
    const [syncing, setSyncing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState(null);

    const [customNickname, setCustomNickname] = useState('');
    const [customBalance, setCustomBalance] = useState('');
    const [agency, setAgency] = useState('');
    const [accountNum, setAccountNum] = useState('');
    const [dataSource, setDataSource] = useState('empty');
    const [importFile, setImportFile] = useState(null);
    const [importError, setImportError] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };



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

    const handleDisconnect = (bank) => {
        setDeleteTarget(bank);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const success = await deleteAccount(deleteTarget.id, deleteTarget.isPluggy ? 'pluggy' : 'manual');
            if (success) {
                showToast(`${deleteTarget.display_name || deleteTarget.name} removido com sucesso!`, 'success');
                analytics.featureUsed('disconnect_bank');
            } else {
                showToast('Erro ao remover conta. Tente novamente.', 'error');
            }
        } catch (err) {
            showToast(`Erro: ${err.message}`, 'error');
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const totalBalance = (accounts || []).reduce((sum, b) => sum + (b.balance || 0), 0);

    return (
        <div className="py-6 space-y-6 animate-fade-in pb-20">
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)] flex items-center gap-2">
                            <Banknote className="text-brand-primary dark:text-brand-glow" /> Instituições Financeiras
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
                    <div className="bg-brand-primary/10 border border-brand-primary/20 text-brand-glow p-4 rounded-xl text-sm flex items-center gap-3 animate-shake mb-4">
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

            <div className="pastel-card-featured p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-[var(--menta-border)] opacity-30" /> Saldo Integrado Estimado
                        </p>
                        <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight">{fmt(totalBalance)}</h2>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--menta-soft)] flex items-center justify-center border border-[var(--menta-border)] shadow-inset-3d">
                            <ShieldCheck className="w-8 h-8 text-[var(--menta-dark)]" />
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-[var(--menta-dark)] bg-[var(--menta-soft)]/40 px-3 py-1.5 rounded-full border border-[var(--menta-border)]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Conexão segura Open Finance
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    Minhas Contas <span className="bg-gray-800/40/10 text-xs px-2 py-0.5 rounded-full text-gray-300">{accounts?.length || 0}</span>
                </h3>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <RefreshCw className="w-8 h-8 text-brand-glow animate-spin" />
                        <p className="text-gray-500 text-sm animate-pulse">Sincronizando suas contas...</p>
                    </div>
                ) : (accounts?.length || 0) === 0 ? (
                    <div className={`\${tw.card} text-center py-8 border-dashed border-2 border-[var(--border)] bg-transparent`}>
                        <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] mx-auto flex items-center justify-center mb-3">
                            <Banknote className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-gray-400 text-sm mb-4">Nenhuma conta conectada ainda.</p>
                        <button onClick={() => {
                            const newSection = document.getElementById('new-connection');
                            newSection?.scrollIntoView({ behavior: 'smooth' });
                        }} className="text-brand-glow hover:text-purple-300 text-sm font-medium">
                            Conectar primeira conta
                        </button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-6 animate-fade-in">
                        {accounts.map(bank => {
                            const txData = accountTransactions[bank.id];
                            return (
                                <div key={bank.id} className="tech-card p-6 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--menta-soft)]/5 to-transparent pointer-events-none" />

                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-start gap-4">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[var(--text-primary)] font-black text-xl shadow-3d border border-white/10 group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: bank.color || '#10b981', color: bank.textColor || '#fff' }}>
                                                    {bank.logo || bank.bank_name?.charAt(0) || 'B'}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-elevated">
                                                    {bank.display_name?.toLowerCase().includes('cartão') || bank.account_type === 'CREDIT' ? '💳' : '🏦'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-[var(--text-primary)] text-lg tracking-tight group-hover:text-[var(--brand)] transition-colors">{bank.display_name || bank.name}</h4>
                                                    {syncing === bank.id ? (
                                                        <span className="flex items-center gap-1 text-[8px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-yellow-500/20">Sincronizando</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[8px] text-[var(--menta-dark)] bg-[var(--menta-soft)] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-[var(--menta-border)]">Ativo</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.15em]">{bank.bank_name} • CTA {bank.account_number}</p>
                                                <div className="mt-3">
                                                    <p className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{fmt(bank.balance || 0)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSync(bank)}
                                                className={`p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm transition-all ${syncing === bank.id ? 'animate-spin text-[var(--brand)]' : ''}`}
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDisconnect(bank)}
                                                className="p-2.5 rounded-xl text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Activity Summary */}
                                    {txData && txData.count > 0 && (
                                        <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] space-y-4">
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-[var(--menta-soft)]/20 rounded-2xl p-3 border border-[var(--menta-border)]/30">
                                                    <p className="text-[8px] text-[var(--menta-dark)] uppercase font-black tracking-widest mb-1 text-center">Entradas</p>
                                                    <p className="text-xs font-black text-[var(--menta-dark)] flex items-center justify-center gap-1">
                                                        <ArrowDownRight className="w-3 h-3" /> {fmt(txData.income)}
                                                    </p>
                                                </div>
                                                <div className="bg-rose-500/5 rounded-2xl p-3 border border-rose-500/10">
                                                    <p className="text-[8px] text-rose-400 uppercase font-black tracking-widest mb-1 text-center">Saídas</p>
                                                    <p className="text-xs font-black text-rose-400 flex items-center justify-center gap-1">
                                                        <ArrowUpRight className="w-3 h-3" /> {fmt(txData.expense)}
                                                    </p>
                                                </div>
                                                <div className="bg-[var(--bg-surface)] rounded-2xl p-3 border border-[var(--border-subtle)]">
                                                    <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1 text-center">Qtd.</p>
                                                    <p className="text-xs font-black text-[var(--text-primary)] text-center">{txData.count}</p>
                                                </div>
                                            </div>

                                            {/* Últimas Transações */}
                                            {txData.recent.length > 0 && (
                                                <div className="space-y-1.5 px-1">
                                                    <p className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-[0.2em] mb-2 px-1">Últimas movimentações</p>
                                                    {txData.recent.slice(0, 3).map((tx, i) => (
                                                        <div key={tx.id || i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[var(--bg-surface)] transition-all border border-transparent hover:border-[var(--border-subtle)] group/tx">
                                                            <span className="text-xs text-[var(--text-secondary)] truncate max-w-[60%] font-medium group-hover/tx:text-[var(--text-primary)] transition-colors">{tx.description}</span>
                                                            <span className={`text-xs font-black ${tx.type === 'income' ? 'text-[var(--menta-dark)]' : 'text-rose-400'}`}>
                                                                {tx.type === 'income' ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {txData && txData.count === 0 && (
                                        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                                            <p className="text-[10px] text-[var(--text-muted)] text-center font-bold tracking-widest uppercase opacity-50 italic">Nenhuma movimentação este mês</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div id="new-connection" className="mt-12">
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-6 flex items-center gap-3 uppercase tracking-tighter">
                    <Plus className="w-5 h-5 text-[var(--menta-dark)]" /> Conectar Nova Instituição
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-fade-in">
                    {banksData.filter(b => !accounts?.find(cb => cb.bank_id === b.id || cb.id === b.id)).map(bank => (
                        <button
                            key={bank.id}
                            onClick={() => handleConnectClick(bank)}
                            className={tw.bankCard}
                        >
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[var(--text-primary)] font-black text-2xl transition-all group-hover:scale-110 group-hover:-translate-y-1 shadow-3d border border-white/5" style={{ backgroundColor: bank.color, color: bank.textColor }}>
                                {bank.logo}
                            </div>
                            <span className="text-xs font-black text-[var(--text-muted)] group-hover:text-[var(--text-primary)] uppercase tracking-tighter transition-colors">{bank.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Modals & Overlays */}
            {showConnectModal && selectedBank && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="tech-card w-full max-w-md p-0 overflow-hidden animate-slide-up relative">
                        <button onClick={() => setShowConnectModal(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-20"><X className="w-5 h-5" /></button>

                        <div className="bg-[var(--bg-surface)] p-8 text-center border-b border-[var(--border-subtle)] relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-[var(--menta-soft)]/5 to-transparent pointer-events-none" />
                            <div className="w-20 h-20 mx-auto flex items-center justify-center text-[var(--text-primary)] font-black text-4xl mb-6 shadow-3d rounded-2xl relative z-10" style={{ backgroundColor: selectedBank.color, color: selectedBank.textColor }}>
                                {selectedBank.logo}
                            </div>
                            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Conectar {selectedBank.name}</h2>
                            <p className="text-[10px] text-[var(--text-muted)] mt-2 uppercase font-black tracking-widest flex items-center justify-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-[var(--menta-dark)]" /> Ambiente seguro Open Finance
                            </p>
                        </div>

                        <div className="p-8">
                            {connectingState === 'choosing' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={handlePluggyDirect}
                                        className="w-full flex items-center gap-5 p-5 rounded-2xl bg-[var(--menta-soft)]/20 border-2 border-[var(--brand)]/10 hover:border-[var(--brand)]/30 hover:bg-[var(--menta-soft)]/30 transition-all group text-left relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-2">
                                            <span className="bg-[var(--brand)] text-[var(--menta-dark)] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Recomendado</span>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-[var(--brand)] flex items-center justify-center flex-shrink-0 shadow-3d group-hover:scale-110 transition-transform">
                                            <Plug className="w-6 h-6 text-[var(--menta-dark)]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter">Sincronização Automática</p>
                                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-medium">Conecte via Open Finance em segundos.</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setConnectingState('consenting')}
                                        className="w-full flex items-center gap-5 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-all group text-left"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-[var(--text-muted)]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter opacity-70">Cadastro Manual</p>
                                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-medium">Adicione dados ou importe arquivos.</p>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {connectingState === 'consenting' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest ml-1 mb-2 block">Apelido da Conta</label>
                                            <input
                                                type="text"
                                                value={customNickname}
                                                onChange={(e) => setCustomNickname(e.target.value)}
                                                className="input-pastel"
                                                placeholder="Ex: Minha Conta Nubank"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest ml-1 mb-2 block">Agência</label>
                                            <input
                                                type="text"
                                                value={agency}
                                                onChange={(e) => setAgency(e.target.value)}
                                                className="input-pastel"
                                                placeholder="0001"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest ml-1 mb-2 block">Conta</label>
                                            <input
                                                type="text"
                                                value={accountNum}
                                                onChange={(e) => setAccountNum(e.target.value)}
                                                className="input-pastel"
                                                placeholder="12345-6"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest ml-1 mb-2 block">Saldo Inicial (R$)</label>
                                            <input
                                                type="text"
                                                value={customBalance}
                                                onChange={(e) => setCustomBalance(e.target.value)}
                                                className="input-pastel"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest ml-1 mb-1 block">Fonte de Dados</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['empty', 'demo', 'file'].map(source => (
                                                <button
                                                    key={source}
                                                    onClick={() => setDataSource(source)}
                                                    className={`py-2 text-[10px] font-black rounded-xl border-2 transition-all uppercase tracking-tighter ${dataSource === source ? 'bg-[var(--brand)] text-[var(--menta-dark)] border-[var(--brand)]' : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--brand)]/30'}`}
                                                >
                                                    {source === 'empty' ? 'Limpa' : source === 'demo' ? 'Simulação' : 'Arquivo'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {dataSource === 'file' && (
                                        <div className="space-y-3 animate-fade-in">
                                            <input
                                                type="file"
                                                accept={ACCEPTED_EXTENSIONS}
                                                onChange={(e) => setImportFile(e.target.files[0])}
                                                className="w-full text-xs text-[var(--text-muted)] file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[var(--menta-soft)] file:text-[var(--menta-dark)] hover:file:bg-[var(--brand)] transition-all cursor-pointer bg-[var(--bg-surface)] p-2 rounded-2xl border border-dashed border-[var(--border-subtle)]"
                                            />
                                            <p className="text-[9px] text-[var(--text-muted)] text-center font-bold tracking-tight px-4 opacity-70">Arraste seu arquivo CSV ou Excel para importar transações.</p>
                                        </div>
                                    )}

                                    {importError && (
                                        <p className="text-xs text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center font-bold">{importError}</p>
                                    )}

                                    <button
                                        onClick={handleConfirmConsent}
                                        disabled={dataSource === 'file' && !importFile}
                                        className="btn-menta w-full py-4 text-xs font-black uppercase tracking-widest disabled:opacity-50 shadow-3d"
                                    >
                                        Vincular Conta {selectedBank.name}
                                    </button>
                                </div>
                            )}

                            {connectingState === 'syncing' && (
                                <div className="text-center py-12">
                                    <RefreshCw className="w-12 h-12 text-[var(--brand)] animate-spin mx-auto mb-6" />
                                    <p className="text-[var(--text-primary)] font-black uppercase tracking-widest text-sm">Sincronizando Dados...</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-2 font-medium">Segurança total via TLS 1.3</p>
                                </div>
                            )}

                            {connectingState === 'success' && (
                                <div className="text-center py-10 animate-fade-in">
                                    <div className="w-20 h-20 bg-[var(--menta-soft)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inset-3d">
                                        <CheckCircle className="w-10 h-10 text-[var(--menta-dark)]" />
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight uppercase">Conectado!</h3>
                                    <p className="text-sm text-[var(--text-muted)] font-medium">Suas transações de {customNickname} foram processadas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => !deleting && setDeleteTarget(null)}>
                    <div className="tech-card w-full max-w-sm p-8 animate-slide-up text-center border-rose-500/10" onClick={(e) => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-3d ring-1 ring-rose-500/20">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] mb-2 tracking-tight uppercase">Remover Conta</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-8 font-medium">
                            Deseja desconectar <strong className="text-[var(--text-primary)]">{deleteTarget.display_name || deleteTarget.name}</strong>? Esta ação removerá a sincronização automática.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-card)] transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-2xl bg-rose-500 border border-rose-400 text-[10px] font-black uppercase tracking-widest text-white hover:bg-rose-600 transition-all shadow-3d flex items-center justify-center gap-2"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-3d animate-slide-up flex items-center gap-3 border backdrop-blur-md ${toast.type === 'success'
                    ? 'bg-[var(--menta-soft)]/90 text-[var(--menta-dark)] border-[var(--menta-border)]'
                    : 'bg-rose-500/90 text-white border-rose-400'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}
        </div>
    );
}
