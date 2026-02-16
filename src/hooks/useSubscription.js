import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    createCheckoutSession,
    openCustomerPortal,
    getSubscriptionStatus,
    getPaymentHistory,
    isSubscriptionActive,
} from '../lib/stripe';

export function useSubscription() {
    const { user, isDemo } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState('');

    // Bypass Stripe - Todos são PRO por enquanto
    useEffect(() => {
        setSubscription({ plan: 'pro', subscription_status: 'active' });
        setLoading(false);
    }, []);

    // Checkout
    const checkout = useCallback(async (billingPeriod = 'monthly') => {
        setCheckoutLoading(true);
        setError('');
        try {
            await createCheckoutSession(billingPeriod);
        } catch (err) {
            setError(err.message);
            setCheckoutLoading(false);
        }
    }, []);

    // Portal
    const manageSubscription = useCallback(async () => {
        setError('');
        try {
            await openCustomerPortal();
        } catch (err) {
            setError(err.message);
        }
    }, []);

    // Histórico
    const loadPayments = useCallback(async () => {
        const data = await getPaymentHistory();
        setPayments(data);
        return data;
    }, []);

    // Refresh
    const refresh = useCallback(async () => {
        const status = await getSubscriptionStatus();
        setSubscription(status);
        return status;
    }, []);

    const isActive = true;
    // Considera PRO se estiver Ativo/Trialing ou se o plan no DB for 'pro'.
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
