import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// URL do seu Backend Node (Ajuste para produção conforme necessário)
// URL do seu Backend Node (Ajuste para produção conforme necessário)

export function usePluggy() {
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(null);

    const openWidget = useCallback(async (itemId = null) => {
        setConnecting(true);
        setError(null);

        // Em produção na Vercel, o backend está no mesmo domínio /api
        const API_URL = import.meta.env.VITE_API_URL || '';

        try {
            console.log('Iniciando conexão Pluggy via:', `${API_URL}/api/pluggy-connect`);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Não autenticado no Supabase');

            // 1. Pegar Connect Token do seu Backend
            const response = await fetch(`${API_URL}/api/pluggy-connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ itemId })
            });

            if (!response.ok) throw new Error('Falha ao gerar token de conexão');
            const { accessToken } = await response.json();

            // 2. Carregar Script do Pluggy se não existir
            if (!window.PluggyConnect) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2/index.js';
                    script.async = true;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }

            // 3. Abrir Widget
            const pluggyConnect = new window.PluggyConnect({
                connectToken: accessToken,
                onSuccess: async (itemData) => {
                    console.log('Sucesso Pluggy:', itemData);

                    try {
                        const { data: { session } } = await supabase.auth.getSession();

                        // Registrar item no backend para garantir vínculo com user_id antes do webhook
                        await fetch(`${API_URL}/api/pluggy-save-item`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({ itemId: itemData.item.id })
                        });

                        window.location.reload();
                    } catch (err) {
                        console.error('Erro ao salvar item no banco:', err);
                        setError('Conexão estabelecida, mas erro ao registrar. Atualize a página.');
                    }
                },
                onError: (errorData) => {
                    console.error('Erro Pluggy:', errorData);
                    setError(errorData.message);
                },
                onClose: () => {
                    setConnecting(false);
                }
            });

            pluggyConnect.init();

        } catch (err) {
            console.error('Pluggy Connect Error:', err);
            setError(err.message);
            setConnecting(false);
        }
    }, []);

    return {
        openWidget,
        connecting,
        error
    };
}
