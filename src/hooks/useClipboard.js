import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook para copiar texto para clipboard com feedback
 * Inclui fallback para navegadores antigos
 */
export function useClipboard(resetDelay = 2000) {
    const [copiedId, setCopiedId] = useState(null);
    const timeoutRef = useRef(null);

    // Limpa timeout ao desmontar
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Reseta o estado após delay
    useEffect(() => {
        if (copiedId !== null) {
            timeoutRef.current = setTimeout(() => {
                setCopiedId(null);
            }, resetDelay);

            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        }
    }, [copiedId, resetDelay]);

    const copy = useCallback(async (text, id = 'default') => {
        try {
            // Tenta API moderna primeiro
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                setCopiedId(id);
                return true;
            }

            // Fallback para método antigo
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '-9999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            const success = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (success) {
                setCopiedId(id);
                return true;
            }

            throw new Error('Fallback copy failed');
        } catch (err) {
            console.error('Falha ao copiar:', err);
            return false;
        }
    }, []);

    const isCopied = useCallback((id = 'default') => {
        return copiedId === id;
    }, [copiedId]);

    return { copy, isCopied, copiedId };
}

export default useClipboard;
