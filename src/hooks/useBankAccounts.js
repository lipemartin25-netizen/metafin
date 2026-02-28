import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { secureStorage } from '../lib/secureStorage';

const STORAGE_KEY = 'sf_connected_banks';

export function useBankAccounts() {
 const { user } = useAuth();
 const [manualAccounts, setManualAccounts] = useState([]);
 const [pluggyAccounts, setPluggyAccounts] = useState([]);
 const [accountTransactions, setAccountTransactions] = useState({});
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 const loadAccounts = useCallback(async () => {
 setLoading(true);
 setError(null);

 try {
 if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
 // Carregar todas as contas da tabela unificada
 let { data: accounts, error: err } = await supabase
 .from('bank_accounts')
 .select('*')
 .eq('user_id', user.id)
 .order('created_at', { ascending: false });

 // Auto-retry on JWT expired
 if (err && err.message?.toLowerCase().includes('jwt expired')) {
 console.log('[BankAccounts] JWT expirado, fazendo refresh...');
 const { error: refreshErr } = await supabase.auth.refreshSession();
 if (!refreshErr) {
 const retry = await supabase
 .from('bank_accounts')
 .select('*')
 .eq('user_id', user.id)
 .order('created_at', { ascending: false });
 accounts = retry.data;
 err = retry.error;
 }
 }

 if (err) throw err;

 // Separar contas manuais e conectadas via Pluggy Open Finance
 const manual = accounts.filter(acc => !acc.provider_account_id);
 const pluggy = accounts.filter(acc => !!acc.provider_account_id);

 setManualAccounts(manual || []);
 setPluggyAccounts(pluggy || []);

 // Limpar local se migração pendente ocorrer aqui no futuro
 } else {
 const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
 setManualAccounts(local);
 setPluggyAccounts([]);
 }
 } catch (err) {
 console.error('Error loading accounts:', err);
 setError(err.message);
 } finally {
 setLoading(false);
 }
 }, [user]);

 // Carrega transações recentes de cada conta
 const loadAccountTransactions = useCallback(async (accounts) => {
 if (!accounts || accounts.length === 0) {
 setAccountTransactions({});
 return;
 }

 const now = new Date();
 const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
 const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

 try {
 if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
 // Buscar todas as transações do mês do usuário
 const { data: txns, error: txErr } = await supabase
 .from('transactions')
 .select('*')
 .eq('user_id', user.id)
 .gte('date', startOfMonth)
 .lte('date', endOfMonth)
 .order('date', { ascending: false })
 .limit(100);

 if (txErr) {
 console.warn('Erro ao carregar transações das contas:', txErr);
 return;
 }

 // Agrupar por conta (via notes que contém nome da conta)
 const grouped = {};
 for (const acc of accounts) {
 const accName = (acc.display_name || acc.name || '').toLowerCase();
 const accTxns = (txns || []).filter(t => {
 const notes = (t.notes || '').toLowerCase();
 return notes.includes(accName) || notes.includes(acc.bank_id || acc.id);
 });
 grouped[acc.id] = {
 recent: accTxns.slice(0, 5),
 income: accTxns.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0),
 expense: accTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0),
 count: accTxns.length
 };
 }
 setAccountTransactions(grouped);
 } else {
 // Fallback: localStorage
 const localTxns = await secureStorage.getItem('transactions') || [];
 const monthTxns = localTxns.filter(t => t.date >= startOfMonth && t.date <= endOfMonth);
 const grouped = {};
 for (const acc of accounts) {
 const accName = (acc.display_name || acc.name || '').toLowerCase();
 const accTxns = monthTxns.filter(t => {
 const notes = (t.notes || '').toLowerCase();
 return notes.includes(accName);
 });
 grouped[acc.id] = {
 recent: accTxns.slice(0, 5),
 income: accTxns.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0),
 expense: accTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0),
 count: accTxns.length
 };
 }
 setAccountTransactions(grouped);
 }
 } catch (err) {
 console.warn('Erro ao carregar transações por conta:', err);
 }
 }, [user]);

 useEffect(() => {
 loadAccounts();
 }, [loadAccounts]);

 // Carregar transações quando as contas forem carregadas
 useEffect(() => {
 const allAccs = [...manualAccounts, ...pluggyAccounts];
 if (allAccs.length > 0) {
 loadAccountTransactions(allAccs);
 }
 }, [manualAccounts, pluggyAccounts, loadAccountTransactions]);

 const addAccount = async (accountData) => {
 try {
 if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
 const { data, error: dbError } = await supabase
 .from('bank_accounts')
 .insert([{
 bank_id: accountData.id || accountData.bank_id,
 name: accountData.name,
 agency: accountData.agency,
 account_number: accountData.account_number,
 balance: parseFloat(accountData.balance) || 0,
 color: accountData.color,
 logo: accountData.logo
 }])
 .select()
 .single();

 if (dbError) throw dbError;
 setManualAccounts(prev => [data, ...prev]);
 return data;
 } else {
 const newAcc = { ...accountData, id: crypto.randomUUID() };
 const updated = [newAcc, ...manualAccounts];
 localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
 setManualAccounts(updated);
 return newAcc;
 }
 } catch (err) {
 setError(err.message);
 return null;
 }
 };

 const deleteAccount = async (id, type = 'manual') => {
 try {
 // Conta unificada usa somente a tabela bank_accounts agora
 const table = 'bank_accounts';
 if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
 const { error: dbError } = await supabase
 .from(table)
 .delete()
 .eq('id', id);

 if (dbError) throw dbError;
 }

 if (type === 'manual') {
 setManualAccounts(prev => {
 const updated = prev.filter(a => a.id !== id);
 if (!isSupabaseConfigured || user?.id === 'demo') {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
 }
 return updated;
 });
 } else {
 setPluggyAccounts(prev => prev.filter(a => a.id !== id));
 }
 return true;
 } catch (err) {
 setError(err.message);
 return false;
 }
 };

 const syncAccount = async (connectionId) => {
 if (!isSupabaseConfigured || !user?.id) return false;

 try {
 // Primeiro buscar o provider_item_id desta conexão
 const { data: conn } = await supabase
 .from('of_connections')
 .select('provider_item_id')
 .eq('id', connectionId)
 .single();

 if (!conn) throw new Error('Conexão não encontrada');

 const { data: session } = await supabase.auth.getSession();
 const response = await fetch('/api/pluggy/sync-item', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${session?.session?.access_token}`
 },
 body: JSON.stringify({ itemId: conn.provider_item_id })
 });

 if (!response.ok) throw new Error('Falha na sincronização remota');

 await loadAccounts();
 return true;
 } catch (err) {
 console.error('Sync error:', err);
 setError(err.message);
 return false;
 }
 };

 // Combine accounts for UI
 const allAccounts = [
 ...manualAccounts,
 ...pluggyAccounts.map(acc => ({
 id: acc.id,
 connectionId: acc.connection_id,
 name: acc.display_name,
 bank_name: acc.bank_name,
 balance: acc.balance,
 account_number: acc.account_number,
 logo: acc.logo_url,
 isPluggy: true
 }))
 ];

 return {
 accounts: allAccounts,
 accountTransactions,
 loading,
 error,
 addAccount,
 deleteAccount,
 syncAccount,
 reload: loadAccounts
 };
}
