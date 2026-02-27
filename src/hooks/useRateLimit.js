import { useRef, useCallback } from 'react';

/**
 * Hook para rate limiting de ações
 * Previne spam de requisições
 */
export function useRateLimit(minInterval = 1000) {
    const lastActionTime = useRef(0);
    const pendingAction = useRef(null);

    const checkLimit = useCallback(() => {
        const now = Date.now();
        const elapsed = now - lastActionTime.current;

        if (elapsed < minInterval) {
            return {
                allowed: false,
                waitTime: minInterval - elapsed,
                message: `Aguarde ${Math.ceil((minInterval - elapsed) / 1000)}s`,
            };
        }

        return { allowed: true, waitTime: 0, message: null };
    }, [minInterval]);

    const executeWithLimit = useCallback(async (action) => {
        const { allowed, message } = checkLimit();

        if (!allowed) {
            return { success: false, error: message };
        }

        lastActionTime.current = Date.now();

        try {
            const result = await action();
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [checkLimit]);

    const reset = useCallback(() => {
        lastActionTime.current = 0;
        if (pendingAction.current) {
            clearTimeout(pendingAction.current);
            pendingAction.current = null;
        }
    }, []);

    const recordAction = useCallback(() => {
        lastActionTime.current = Date.now();
    }, []);

    return { checkLimit, executeWithLimit, reset, recordAction };
}

export default useRateLimit;
