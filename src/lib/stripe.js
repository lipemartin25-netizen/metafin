/**
 * SmartFinance Hub — Stripe Client
 * Gerencia checkout, portal e status de assinatura
 */

import { supabase } from './supabase';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const PRICES = {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
    yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY,
};

/**
 * Redirecionar para Stripe Checkout
 */
export async function createCheckoutSession(billingPeriod = 'monthly') {
    const priceId = PRICES[billingPeriod];

    if (!priceId) {
        throw new Error(`Price ID não configurado para "${billingPeriod}". Verifique .env.local`);
    }

    if (!supabase) {
        throw new Error('Supabase não configurado. Pagamentos requerem Supabase.');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('Faça login para assinar.');
    }

    // Tenta chamar a edge function
    // Se falhar por 404, avisa que precisa de deploy
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                priceId,
                successUrl: `${window.location.origin}/app/upgrade?checkout=success`,
                cancelUrl: `${window.location.origin}/app/upgrade?checkout=canceled`,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Erro ${response.status}: verifique se a Edge Function 'stripe-checkout' foi deployada.`);
        }

        const { url } = await response.json();

        // Redirecionar para Stripe
        window.location.href = url;
    } catch (err) {
        console.error('Stripe Checkout Error:', err);
        throw err;
    }
}

/**
 * Abrir Customer Portal (gerenciar assinatura)
 */
export async function openCustomerPortal() {
    if (!supabase) {
        throw new Error('Supabase não configurado.');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('Faça login primeiro.');
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-portal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                returnUrl: `${window.location.origin}/app`,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Erro ${response.status}: verifique se a Edge Function 'stripe-portal' foi deployada.`);
        }

        const { url } = await response.json();
        window.location.href = url;
    } catch (err) {
        console.error('Stripe Portal Error:', err);
        throw err;
    }
}

/**
 * Buscar status da assinatura do perfil
 */
export async function getSubscriptionStatus() {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan, subscription_status, subscription_current_period_end, stripe_subscription_id')
        .eq('id', user.id)
        .single();

    if (error) {
        console.warn('Erro ao buscar status da assinatura:', error.message);
        return null;
    }

    return profile;
}

/**
 * Buscar histórico de pagamentos
 */
export async function getPaymentHistory() {
    if (!supabase) return [];

    const { data } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    return data || [];
}

/**
 * Verificar se assinatura está ativa
 */
export function isSubscriptionActive(profile) {
    if (!profile) return false;
    return ['active', 'trialing'].includes(profile.subscription_status);
}
