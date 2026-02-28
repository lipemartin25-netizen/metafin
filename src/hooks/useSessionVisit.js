import { useEffect, useRef } from 'react';

/**
 * Hook para contar visitas por sessão (não por navegação)
 * Corrige o bug de incrementar a cada mudança de rota
 */
export function useSessionVisit() {
 const hasCountedRef = useRef(false);

 useEffect(() => {
 // Só conta uma vez por sessão
 const sessionKey = 'sf_session_counted';

 if (!sessionStorage.getItem(sessionKey) && !hasCountedRef.current) {
 hasCountedRef.current = true;

 const currentVisits = parseInt(localStorage.getItem('sf_visits') || '0', 10);
 const newVisitCount = currentVisits + 1;

 localStorage.setItem('sf_visits', newVisitCount.toString());
 sessionStorage.setItem(sessionKey, 'true');
 }
 }, []);

 const getVisitCount = () => {
 return parseInt(localStorage.getItem('sf_visits') || '0', 10);
 };

 const hasCompletedNps = () => {
 return !!localStorage.getItem('sf_nps_done');
 };

 const markNpsComplete = () => {
 localStorage.setItem('sf_nps_done', new Date().toISOString());
 };

 const shouldShowNps = (minVisits = 3) => {
 return getVisitCount() >= minVisits && !hasCompletedNps();
 };

 return {
 getVisitCount,
 hasCompletedNps,
 markNpsComplete,
 shouldShowNps,
 };
}

export default useSessionVisit;
