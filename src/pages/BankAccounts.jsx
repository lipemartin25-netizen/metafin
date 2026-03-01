import { tw } from '@/lib/theme';
import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../hooks/useAnalytics';
import { Trash2, CheckCircle, ShieldCheck, Banknote, RefreshCw, X, Plug, FileText, ArrowUpRight, ArrowDownRight, AlertTriangle, Loader2 } from 'lucide-react';
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

 const formatTimeAgo = (dateStr) => {
 if (!dateStr) return null;
 const diff = Date.now() - new Date(dateStr).getTime();
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return 'agora';
 if (mins < 60) return `há ${mins}min`;
 const hours = Math.floor(mins / 60);
 if (hours < 24) return `há ${hours}h`;
 const days = Math.floor(hours / 24);
 return `há ${days}d`;
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

 <div className={`\${tw.card} bg-[var(--bg-base)] from-gray-900 to-gray-800 border-brand-primary/20`}>
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-gray-400">Saldo Integrado Estimado</p>
 <h2 className="text-3xl font-bold text-brand-glow mt-1">{fmt(totalBalance)}</h2>
 </div>
 <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
 <ShieldCheck className="w-6 h-6 text-brand-glow" />
 </div>
 </div>
 <div className="mt-4 flex items-center gap-2 text-xs text-purple-200/70 bg-brand-primary/5 p-2 rounded-lg border border-brand-primary/10">
 <CheckCircle className="w-3 h-3" />
 Conexão segura via Open Finance Brasil
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
 <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
 {accounts.map(bank => {
 const txData = accountTransactions[bank.id];
 return (
 <div key={bank.id} className={`${tw.bankCard} group`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="relative">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-primary)] font-bold text-lg shadow-lg" style={{ backgroundColor: bank.color || '#10b981', color: bank.textColor || '#fff' }}>
 {bank.logo || bank.bank_name?.charAt(0) || 'B'}
 </div>
 {/* Source badge */}
 <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-[var(--border-subtle)] ${bank.display_name?.toLowerCase().includes('cartão') || bank.account_type === 'CREDIT' ? 'bg-brand-primary' : 'bg-brand-primary'}`}>
 {bank.display_name?.toLowerCase().includes('cartão') || bank.account_type === 'CREDIT' ? '💳' : '🏦'}
 </div>
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h4 className="font-semibold text-[var(--text-primary)]">{bank.display_name || bank.name}</h4>
 {/* Sync status badge */}
 {syncing === bank.id ? (
 <span className="flex items-center gap-1 text-[9px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-full font-bold">🟡 Sincronizando</span>
 ) : bank.last_synced_at || bank.updated_at ? (
 <span className="flex items-center gap-1 text-[9px] text-brand-glow bg-brand-primary/10 px-1.5 py-0.5 rounded-full font-bold">🟢 Ativo</span>
 ) : (
 <span className="flex items-center gap-1 text-[9px] text-gray-500 bg-[var(--bg-surface)] px-1.5 py-0.5 rounded-full font-bold">⚪ Manual</span>
 )}
 </div>
 <p className="text-xs text-gray-400">{bank.bank_name} • Ag {bank.agency || '0001'} • Cta {bank.account_number}</p>
 <div className="flex items-center gap-2 mt-0.5">
 <p className="text-sm font-medium text-brand-glow">{fmt(bank.balance || 0)}</p>
 {(bank.last_synced_at || bank.updated_at) && (
 <span className="text-[9px] text-gray-500">• Sync {formatTimeAgo(bank.last_synced_at || bank.updated_at)}</span>
 )}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => handleSync(bank)}
 className={`p-2 rounded-lg text-gray-400 hover:text-[var(--text-primary)] hover:bg-gray-800/40/10 transition-all ${syncing === bank.id ? 'animate-spin text-brand-glow' : ''}`}
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

 {/* Resumo de Atividade do Mês */}
 {txData && txData.count > 0 && (
 <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-3">
 <div className="grid grid-cols-3 gap-2 animate-fade-in">
 <div className="bg-brand-primary/10 rounded-xl p-2.5 text-center">
 <p className="text-[9px] text-brand-glow/70 uppercase font-bold tracking-wider">Entradas</p>
 <p className="text-sm font-bold text-brand-glow flex items-center justify-center gap-1">
 <ArrowDownRight className="w-3 h-3" />
 {fmt(txData.income)}
 </p>
 </div>
 <div className="bg-red-500/10 rounded-xl p-2.5 text-center">
 <p className="text-[9px] text-red-400/70 uppercase font-bold tracking-wider">Saídas</p>
 <p className="text-sm font-bold text-red-400 flex items-center justify-center gap-1">
 <ArrowUpRight className="w-3 h-3" />
 {fmt(txData.expense)}
 </p>
 </div>
 <div className="bg-[var(--bg-surface)] rounded-xl p-2.5 text-center">
 <p className="text-[9px] text-gray-400/70 uppercase font-bold tracking-wider">Moviment.</p>
 <p className="text-sm font-bold text-[var(--text-primary)]">{txData.count}</p>
 </div>
 </div>

 {/* Últimas Transações */}
 {txData.recent.length > 0 && (
 <div className="space-y-1">
 <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Últimas movimentações</p>
 {txData.recent.slice(0, 3).map((tx, i) => (
 <div key={tx.id || i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors">
 <span className="text-xs text-gray-300 truncate max-w-[60%]">{tx.description}</span>
 <span className={`text-xs font-bold ${tx.type === 'income' ? 'text-brand-glow' : 'text-red-400'}`}>
 {tx.type === 'income' ? '+' : '-'}{fmt(Math.abs(tx.amount))}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {txData && txData.count === 0 && (
 <div className="mt-3 pt-3 border-t border-[var(--border)]">
 <p className="text-[10px] text-gray-500 text-center italic">Nenhuma movimentação neste mês</p>
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>

 <div id="new-connection">
 <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Conectar Nova Instituição</h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-fade-in">
 {banksData.filter(b => !accounts?.find(cb => cb.bank_id === b.id || cb.id === b.id)).map(bank => (
 <button
 key={bank.id}
 onClick={() => handleConnectClick(bank)}
 className={`${tw.bankCard} hover:bg-[var(--bg-surface)] transition-all p-4 flex flex-col items-center gap-3 text-center border hover:border-brand-primary/30 group`}
 >
 <div className="w-12 h-12 bank-icon-container flex items-center justify-center text-[var(--text-primary)] font-bold text-xl transition-transform group-hover:-translate-y-px transition-transform" style={{ backgroundColor: bank.color, color: bank.textColor }}>
 {bank.logo}
 </div>
 <span className="text-sm font-medium text-gray-300 group-hover:text-[var(--text-primary)]">{bank.name}</span>
 </button>
 ))}
 </div>
 </div>

 {showConnectModal && selectedBank && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
 <div className={`\${tw.card} w-full max-w-md p-0 overflow-hidden animate-slide-up relative`}>
 <button onClick={() => setShowConnectModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>

 <div className="bg-[var(--bg-surface)] p-6 text-center border-b border-[var(--border)]">
 <div className="w-16 h-16 bank-icon-container mx-auto flex items-center justify-center text-[var(--text-primary)] font-bold text-3xl mb-4" style={{ backgroundColor: selectedBank.color, color: selectedBank.textColor }}>
 {selectedBank.logo}
 </div>
 <h2 className="text-xl font-bold text-[var(--text-primary)]">Conectar {selectedBank.name}</h2>
 <p className="text-sm text-gray-400 mt-1">Ambiente seguro Open Finance</p>
 </div>

 <div className="p-6">
 {connectingState === 'choosing' && (
 <div className="space-y-3">
 <p className="text-sm text-gray-400 text-center mb-4">Escolha como deseja conectar:</p>

 <button
 onClick={handlePluggyDirect}
 className="w-full flex items-center gap-4 p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/30 hover:bg-brand-primary/20 hover:border-brand-primary/50 transition-all group text-left"
 >
 <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center flex-shrink-0 group-hover:-translate-y-px transition-transform transition-transform">
 <Plug className="w-6 h-6 text-brand-glow" />
 </div>
 <div>
 <p className="text-sm font-bold text-[var(--text-primary)]">Conectar via Open Finance</p>
 <p className="text-[11px] text-gray-400 mt-0.5">Sincroniza automaticamente via Pluggy. Seus dados em tempo real.</p>
 </div>
 <span className="ml-auto bg-brand-primary/30 text-purple-300 text-[9px] font-bold px-2 py-1 rounded-lg flex-shrink-0">RECOMENDADO</span>
 </button>

 <button
 onClick={() => setConnectingState('consenting')}
 className="w-full flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:bg-gray-800/40/10 hover:border-[var(--border)] transition-all group text-left"
 >
 <div className="w-12 h-12 rounded-xl bg-gray-800/40/10 flex items-center justify-center flex-shrink-0 group-hover:-translate-y-px transition-transform transition-transform">
 <FileText className="w-6 h-6 text-gray-400" />
 </div>
 <div>
 <p className="text-sm font-bold text-[var(--text-primary)]">Cadastro Manual</p>
 <p className="text-[11px] text-gray-400 mt-0.5">Adicione seus dados manualmente ou importe um extrato.</p>
 </div>
 </button>
 </div>
 )}

 {connectingState === 'consenting' && (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-3 animate-fade-in">
 <div className="col-span-2">
 <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Apelido da Conta</label>
 <input
 type="text"
 value={customNickname}
 onChange={(e) => setCustomNickname(e.target.value)}
 className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-[var(--text-primary)] text-sm focus:border-brand-primary/50 outline-none mt-1"
 placeholder="Ex: Minha Conta Nubank"
 />
 </div>
 <div>
 <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Agência</label>
 <input
 type="text"
 value={agency}
 onChange={(e) => setAgency(e.target.value)}
 className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-[var(--text-primary)] text-sm focus:border-brand-primary/50 outline-none mt-1"
 placeholder="0001"
 />
 </div>
 <div>
 <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Conta</label>
 <input
 type="text"
 value={accountNum}
 onChange={(e) => setAccountNum(e.target.value)}
 className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-[var(--text-primary)] text-sm focus:border-brand-primary/50 outline-none mt-1"
 placeholder="12345-6"
 />
 </div>
 <div className="col-span-2">
 <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Saldo Inicial (R$)</label>
 <input
 type="text"
 value={customBalance}
 onChange={(e) => setCustomBalance(e.target.value)}
 className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-[var(--text-primary)] text-sm focus:border-brand-primary/50 outline-none mt-1"
 placeholder="0,00"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[10px] text-gray-500 uppercase font-bold ml-1">Fonte de Dados</label>
 <div className="grid grid-cols-3 gap-2 animate-fade-in">
 <button
 onClick={() => setDataSource('empty')}
 className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${dataSource === 'empty' ? 'bg-brand-primary/20 border-brand-primary/50 text-brand-glow' : 'bg-[var(--bg-surface)] border-[var(--border)] text-gray-500'}`}
 >
 LIMPA
 </button>
 <button
 onClick={() => setDataSource('demo')}
 className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${dataSource === 'demo' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-[var(--bg-surface)] border-[var(--border)] text-gray-500'}`}
 >
 DEMO
 </button>
 <button
 onClick={() => setDataSource('file')}
 className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${dataSource === 'file' ? 'bg-brand-primary/20 border-brand-primary/50 text-brand-glow' : 'bg-[var(--bg-surface)] border-[var(--border)] text-gray-500'}`}
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
 className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-primary/10 file:text-brand-glow hover:file:bg-brand-primary/20 cursor-pointer"
 />
 <p className="text-[9px] text-gray-500 text-center italic">Arraste seu arquivo CSV, Excel ou JSON para importar transações reais.</p>
 </div>
 )}

 {importError && (
 <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20 text-center">{importError}</p>
 )}

 <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4">
 <h4 className="text-sm font-semibold text-brand-glow mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Conexão Segura</h4>
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
 <RefreshCw className="w-10 h-10 text-brand-glow animate-spin mx-auto mb-4" />
 <p className="text-[var(--text-primary)] font-medium">Sincronizando transações...</p>
 <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos.</p>
 </div>
 )}

 {connectingState === 'success' && (
 <div className="text-center py-6 animate-fade-in">
 <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
 <CheckCircle className="w-8 h-8 text-brand-glow" />
 </div>
 <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Conectado com Sucesso!</h3>
 <p className="text-sm text-gray-400">Suas transações de {customNickname} foram importadas.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Delete Confirmation Modal */}
 {deleteTarget && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in" onClick={() => !deleting && setDeleteTarget(null)}>
 <div className={`\${tw.card} w-full max-w-sm p-6 animate-slide-up text-center`} onClick={(e) => e.stopPropagation()}>
 <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-red-500/5">
 <AlertTriangle className="w-7 h-7 text-red-400" />
 </div>
 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Remover Conta</h3>
 <p className="text-sm text-gray-400 mb-1">
 Tem certeza que deseja remover <strong className="text-[var(--text-primary)]">{deleteTarget.display_name || deleteTarget.name}</strong>?
 </p>
 <p className="text-xs text-gray-500 mb-6">
 Todas as transações vinculadas serão desassociadas. A sincronização será interrompida.
 </p>
 <div className="flex gap-3">
 <button
 onClick={() => setDeleteTarget(null)}
 disabled={deleting}
 className="flex-1 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-sm text-gray-300 hover:bg-gray-800/40/10 transition-all disabled:opacity-50"
 >
 Cancelar
 </button>
 <button
 onClick={confirmDelete}
 disabled={deleting}
 className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-sm text-red-400 hover:bg-red-500/30 transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
 {deleting ? 'Removendo...' : 'Remover'}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Toast Notification */}
 {toast && (
 <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-medium shadow-elevated animate-slide-up flex items-center gap-2 ${toast.type === 'success'
 ? 'bg-brand-primary/90 text-[var(--text-primary)] border border-brand-glow/30'
 : 'bg-red-500/90 text-[var(--text-primary)] border border-red-400/30'
 }`}>
 {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
 {toast.message}
 </div>
 )}
 </div>
 );
}
