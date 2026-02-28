import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPlan, canUseFeature } from '../lib/plans';

/**
 * usePlan Hook - Versão simplificada (Todos são PRO)
 */
export function usePlan() {
 const { user: _user } = useAuth();
 const [planId, setPlanId] = useState('pro');

 useEffect(() => {
 // Bypass total - Libera Pro para todos instantaneamente
 setPlanId('pro');
 }, []);

 const plan = useMemo(() => getPlan(planId), [planId]);
 const can = useMemo(() => (feature) => canUseFeature(planId, feature), [planId]);
 const isPro = true;
 const isFree = false;

 return { planId, plan, isPro, isFree, can, limits: plan.limits };
}
