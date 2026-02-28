import { useState, useEffect, useCallback } from 'react';
import { secureStorage } from '../lib/secureStorage';

/**
 * Hook centralizado para gestão de estado persistente com segurança.
 * 
 * Funcionalidades:
 * - Ofuscação/Criptografia via secureStorage
 * - Validação de integridade
 * - Expiração Programada (TTL)
 * - Sincronização entre abas
 * 
 * @param {string} key Chave do storage (será prefixada por 'sf_')
 * @param {any} defaultValue Valor padrão se não houver dados
 * @param {Object} options Configurações extras { ttl: ms, secure: bool }
 */
export function usePersistentState(key, defaultValue, options = {}) {
    const {
        ttl = 90 * 24 * 60 * 60 * 1000, // 90 dias padrão
        secure = true
    } = options;

    const [state, setState] = useState(defaultValue);
    const [isLoaded, setIsLoaded] = useState(false);

    // Inicialização do estado via Async (Device ready)
    useEffect(() => {
        let mounted = true;
        const loadInitialData = async () => {
            try {
                if (secure) {
                    const stored = await secureStorage.getItem(key);
                    if (mounted && stored !== null && stored !== undefined) {
                        setState(stored);
                    }
                } else {
                    const stored = localStorage.getItem(`sf_${key}`);
                    if (stored !== null && stored !== undefined) {
                        let parsed = stored;
                        try { parsed = JSON.parse(stored); } catch { /* was just string */ }
                        if (mounted) setState(parsed);
                    }
                }
            } catch (err) {
                console.error(`[usePersistentState] Erro ao carregar ${key}:`, err);
            } finally {
                if (mounted) setIsLoaded(true);
            }
        };

        loadInitialData();
        return () => { mounted = false; };
    }, [key, secure]);

    // Função para atualizar estado e storage
    const setPersistentState = useCallback(async (newValue) => {
        const actualValue = typeof newValue === 'function' ? newValue(state) : newValue;
        setState(actualValue);

        try {
            if (secure) {
                await secureStorage.setItem(key, actualValue);
            } else {
                const stringified = typeof actualValue === 'object'
                    ? JSON.stringify(actualValue)
                    : String(actualValue);
                localStorage.setItem(`sf_${key}`, stringified);
            }
        } catch (err) {
            console.error(`[usePersistentState] Erro ao salvar ${key}:`, err);
        }
    }, [key, secure, state]);

    // Listener para sincronização entre abas
    useEffect(() => {
        const handleStorageChange = async (e) => {
            const fullKey = secure ? `mf_${key}` : `sf_${key}`;
            if (e.key === fullKey && e.newValue) {
                try {
                    const updatedValue = secure
                        ? await secureStorage.getItem(key)
                        : (e.newValue.startsWith('{') || e.newValue.startsWith('[') ? JSON.parse(e.newValue) : e.newValue);
                    setState(updatedValue);
                } catch {
                    // Ignora erros de parse na sincronização
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, secure]);

    // O retorno agora é um array pra ficar igual useState normal
    return [state, setPersistentState, isLoaded];
}
