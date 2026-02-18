import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'sf_connected_banks';

export function useBankAccounts() {
    const { user } = useAuth();
    const [manualAccounts, setManualAccounts] = useState([]);
    const [pluggyAccounts, setPluggyAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAccounts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (isSupabaseConfigured && user?.id && user.id !== 'demo') {
                // 1. Carregar contas manuais
                const { data: manual, error: manualErr } = await supabase
                    .from('bank_accounts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (manualErr) throw manualErr;

                // 2. Carregar contas do Pluggy
                const { data: pluggy, error: pluggyErr } = await supabase
                    .from('pluggy_bank_accounts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (pluggyErr) throw pluggyErr;

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

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

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
            const table = type === 'manual' ? 'bank_accounts' : 'pluggy_bank_accounts';
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

    // Combine accounts for UI
    const allAccounts = [
        ...manualAccounts,
        ...pluggyAccounts.map(acc => ({
            id: acc.id,
            name: acc.display_name,
            bank_name: acc.bank_name,
            balance: acc.balance_current,
            account_number: acc.number,
            logo: acc.logo_url,
            isPluggy: true
        }))
    ];

    return {
        accounts: allAccounts,
        loading,
        error,
        addAccount,
        deleteAccount,
        reload: loadAccounts
    };
}
