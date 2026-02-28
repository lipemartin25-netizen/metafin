import { useState, useEffect, useCallback } from 'react';
import { db, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { secureStorage } from '../lib/secureStorage';
import { add, sumTransactions } from '../lib/financialMath';

const STORAGE_KEY = 'transactions';

function getLocalTransactions() {
 return secureStorage.getItem(STORAGE_KEY);
}

function saveLocalTransactions(transactions) {
 secureStorage.setItem(STORAGE_KEY, transactions);
}

export function useTransactions() {
 const { user } = useAuth();
 const [transactions, setTransactions] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 // ========== LOAD ==========
 const loadTransactions = useCallback(async () => {
 setLoading(true);
 setError(null);

 try {
 if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
 // Modo online: Supabase — sempre limpo por usuário
 const { data, error: dbError } = await db.transactions.getAll(user.id);
 if (dbError) throw dbError;
 // Retorna o que está no banco (pode ser vazio = lista limpa)
 setTransactions(data && data.length > 0 ? data : []);
 } else {
 // Modo offline: secureStorage
 const local = await getLocalTransactions();
 if (local && local.length > 0) {
 // Usa somente o que o usuário já salvou localmente
 setTransactions(local);
 } else {
 // Primeira vez: começa zerado — sem dados fictícios
 setTransactions([]);
 await saveLocalTransactions([]);
 }
 }
 } catch (err) {
 console.error('Error loading transactions:', err);
 setError(err.message);
 // Fallback: tenta secureStorage, senão vazio
 const local = await getLocalTransactions();
 setTransactions(local && local.length > 0 ? local : []);
 } finally {
 setLoading(false);
 }
 }, [user]);

 useEffect(() => {
 loadTransactions();
 }, [loadTransactions]);

 // ========== CREATE ==========
 const addTransaction = useCallback(async (transaction) => {
 const newTransaction = {
 id: crypto.randomUUID(),
 date: transaction.date,
 description: transaction.description,
 amount: parseFloat(transaction.amount),
 category: transaction.category,
 type: transaction.type || (transaction.amount >= 0 ? 'income' : 'expense'),
 status: transaction.status || 'categorized',
 notes: transaction.notes || '',
 created_at: new Date().toISOString(),
 updated_at: new Date().toISOString(),
 };

 try {
 if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
 const { data, error: dbError } = await db.transactions.create({
 ...newTransaction,
 user_id: user.id,
 });
 if (dbError) throw dbError;
 setTransactions((prev) => [data, ...prev]);
 return data;
 } else {
 setTransactions((prev) => {
 const updated = [newTransaction, ...prev];
 saveLocalTransactions(updated);
 return updated;
 });
 return newTransaction;
 }
 } catch (err) {
 console.error('Error creating transaction:', err);
 setError(err.message);
 return null;
 }
 }, [user]);

 // ========== BULK CREATE ==========
 const addBulkTransactions = useCallback(async (transactionsArray) => {
 const prepared = transactionsArray.map((t) => ({
 id: crypto.randomUUID(),
 date: t.date,
 description: t.description,
 amount: parseFloat(t.amount),
 category: t.category,
 type: t.type || (parseFloat(t.amount) >= 0 ? 'income' : 'expense'),
 status: t.status || 'categorized',
 notes: t.notes || '',
 created_at: new Date().toISOString(),
 updated_at: new Date().toISOString(),
 }));

 try {
 if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
 const withUser = prepared.map((t) => ({ ...t, user_id: user.id }));
 const { data, error: dbError } = await db.transactions.bulkCreate(withUser);
 if (dbError) throw dbError;
 setTransactions((prev) => [...(data || prepared), ...prev]);
 return data || prepared;
 } else {
 setTransactions((prev) => {
 const updated = [...prepared, ...prev];
 saveLocalTransactions(updated);
 return updated;
 });
 return prepared;
 }
 } catch (err) {
 console.error('Error bulk creating:', err);
 setError(err.message);
 return null;
 }
 }, [user]);

 // ========== UPDATE ==========
 const updateTransaction = useCallback(async (id, updates) => {
 try {
 if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
 const { data, error: dbError } = await db.transactions.update(id, updates);
 if (dbError) throw dbError;
 setTransactions((prev) => prev.map((t) => (t.id === id ? data : t)));
 return data;
 } else {
 setTransactions((prev) => {
 const updated = prev.map((t) =>
 t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
 );
 saveLocalTransactions(updated);
 return updated;
 });
 return { id, ...updates };
 }
 } catch (err) {
 console.error('Error updating transaction:', err);
 setError(err.message);
 return null;
 }
 }, [user]);

 // ========== DELETE ==========
 const deleteTransaction = useCallback(async (id) => {
 try {
 if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
 const { error: dbError } = await db.transactions.delete(id);
 if (dbError) throw dbError;
 }
 setTransactions((prev) => {
 const updated = prev.filter((t) => t.id !== id);
 if (!isSupabaseConfigured || user?.id === 'demo') {
 saveLocalTransactions(updated);
 }
 return updated;
 });
 return true;
 } catch (err) {
 console.error('Error deleting transaction:', err);
 setError(err.message);
 return false;
 }
 }, [user]);

 // ========== CLEAR ALL (para limpar dados fictícios salvos) ==========
 const clearAllTransactions = useCallback(() => {
 setTransactions([]);
 saveLocalTransactions([]);
 }, []);

 // ========== COMPUTED ==========
 const summary = {
 income: sumTransactions(transactions.filter(t => t.type === 'income')),
 expense: sumTransactions(transactions.filter(t => t.type === 'expense')),
 get balance() { return add(this.income, -this.expense); },
 count: transactions.length,
 categorySummary: transactions.reduce((acc, t) => {
 const key = t.category;
 if (!acc[key]) acc[key] = { total: 0, count: 0, type: t.type };
 acc[key].total = add(acc[key].total, Math.abs(t.amount));
 acc[key].count += 1;
 return acc;
 }, {}),
 };

 summary.totalIncome = summary.income;
 summary.totalExpenses = summary.expense;

 return {
 transactions,
 loading,
 error,
 summary,
 addTransaction,
 addBulkTransactions,
 updateTransaction,
 deleteTransaction,
 clearAllTransactions,
 reload: loadTransactions,
 };
}
