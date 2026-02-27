import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para debounce de valores
 * @param {any} value - Valor a ser debounced
 * @param {number} delay - Delay em ms
 * @returns {any} Valor debounced
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook para debounce de callbacks
 * @param {Function} callback - Função a ser debounced
 * @param {number} delay - Delay em ms
 * @returns {Function} Função debounced
 */
export function useDebouncedCallback(callback, delay = 300) {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);

    // Atualizar ref quando callback mudar
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Limpar timeout no unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);

    // Função para cancelar o debounce pendente
    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    // Função para executar imediatamente
    const flush = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        callbackRef.current(...args);
    }, []);

    return { debouncedCallback, cancel, flush };
}

export default useDebounce;
