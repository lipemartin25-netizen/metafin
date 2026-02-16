import { useState, useEffect, useCallback } from 'react';
import { db, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import initialData from '../data/data.json';

const STORAGE_KEY = 'sf_transactions';

function getLocalTransactions() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function saveLocalTransactions(transactions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
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
                // Modo online: Supabase
                const { data, error: dbError } = await db.transactions.getAll(user.id);
                if (dbError) throw dbError;

                if (data && data.length > 0) {
                    setTransactions(data);
                } else {
                    // Primeiro login: carregar dados iniciais
                    const initialTransactions = initialData.transactions.map((t) => ({
                        ...t,
                        user_id: user.id,
                    }));
                    const { data: created } = await db.transactions.bulkCreate(initialTransactions);
                    setTransactions(created || initialTransactions);
                }
            } else {
                // Modo offline: localStorage
                const local = getLocalTransactions();
                if (local && local.length > 0) {
                    setTransactions(local);
                } else {
                    setTransactions(initialData.transactions);
                    saveLocalTransactions(initialData.transactions);
                }
            }
        } catch (err) {
            console.error('Error loading transactions:', err);
            setError(err.message);
            // Fallback para localStorage
            const local = getLocalTransactions();
            setTransactions(local || initialData.transactions);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    // ========== CREATE ==========
    const addTransaction = useCallback(
        async (transaction) => {
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
        },
        [user]
    );

    // ========== BULK CREATE (Import) ==========
    const addBulkTransactions = useCallback(
        async (transactionsArray) => {
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
        },
        [user]
    );

    // ========== UPDATE ==========
    const updateTransaction = useCallback(
        async (id, updates) => {
            try {
                if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
                    const { data, error: dbError } = await db.transactions.update(id, updates);
                    if (dbError) throw dbError;
                    setTransactions((prev) =>
                        prev.map((t) => (t.id === id ? data : t))
                    );
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
        },
        [user]
    );

    // ========== DELETE ==========
    const deleteTransaction = useCallback(
        async (id) => {
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
        },
        [user]
    );

    // ========== COMPUTED ==========
    const summary = {
        totalIncome: transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        totalExpenses: transactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        get balance() {
            return this.totalIncome - this.totalExpenses;
        },
        count: transactions.length,
        categorySummary: transactions.reduce((acc, t) => {
            const key = t.category;
            if (!acc[key]) acc[key] = { total: 0, count: 0, type: t.type };
            acc[key].total += Math.abs(t.amount);
            acc[key].count += 1;
            return acc;
        }, {}),
    };

    return {
        transactions,
        loading,
        error,
        summary,
        addTransaction,
        addBulkTransactions,
        updateTransaction,
        deleteTransaction,
        reload: loadTransactions,
    };
}
