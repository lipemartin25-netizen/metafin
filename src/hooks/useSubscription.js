import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * useSubscription Hook - Versão simplificada (Todos são PRO)
 * Stripe bypass ativado.
 */
export function useSubscription() {
    const { user: _user } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, _setCheckoutLoading] = useState(false);
    const [error, _setError] = useState('');

    // Bypass Stripe - Todos são PRO por padrão
    useEffect(() => {
        setSubscription({
            plan: 'pro',
            subscription_status: 'active',
            subscription_current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
        setLoading(false);
    }, []);

    // Checkout - Desativado
    const checkout = useCallback(async (_billingPeriod = 'monthly') => {
        console.log('Checkout desativado: usuário já é Pro.');
    }, []);

    // Portal - Desativado
    const manageSubscription = useCallback(async () => {
        console.log('Portal desativado: usuário já é Pro.');
    }, []);

    // Histórico - Vazio
    const loadPayments = useCallback(async () => {
        setPayments([]);
        return [];
    }, []);

    // Refresh - No-op
    const refresh = useCallback(async () => {
        return subscription;
    }, [subscription]);

    const isActive = true;
    const isPro = true;
    const isTrial = false;
    const isPastDue = false;
    const daysRemaining = 999;

    return {
        subscription,
        payments,
        loading,
        checkoutLoading,
        error,
        isActive,
        isPro,
        isTrial,
        isPastDue,
        daysRemaining,
        checkout,
        manageSubscription,
        loadPayments,
        refresh,
    };
}
