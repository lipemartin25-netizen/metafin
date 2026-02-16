import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPlan, canUseFeature } from '../lib/plans';
import { getSubscriptionStatus, isSubscriptionActive } from '../lib/stripe';

export function usePlan() {
    const { user, isDemo } = useAuth();
    const [planId, setPlanId] = useState('free');

    useEffect(() => {
        let mounted = true;
        async function fetchPlan() {
            if (isDemo) {
                if (mounted) setPlanId('free');
                return;
            }
            try {
                const profile = await getSubscriptionStatus();

                if (mounted) {
                    if (profile && (isSubscriptionActive(profile) || profile.plan === 'pro')) {
                        setPlanId('pro');
                    } else {
                        // Se não tiver assinatura ativa, verifica se o plano no banco é pro (ex: atribuído manualmente)
                        setPlanId(profile?.plan || 'free');
                    }
                }
            } catch (err) {
                console.warn('Erro fetchPlan:', err);
                if (mounted) setPlanId('free');
            }
        }
        fetchPlan();
        return () => { mounted = false; };
    }, [user, isDemo]);

    const plan = useMemo(() => getPlan(planId), [planId]);
    const can = useMemo(() => (feature) => canUseFeature(planId, feature), [planId]);
    const isPro = planId === 'pro' || planId === 'enterprise';
    const isFree = planId === 'free';

    return { planId, plan, isPro, isFree, can, limits: plan.limits };
}
