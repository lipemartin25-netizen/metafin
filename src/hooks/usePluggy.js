import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function usePluggy() {
 const [connecting, setConnecting] = useState(false);
 const [error, setError] = useState(null);

 const openWidget = useCallback(async (itemId = null) => {
 setConnecting(true);
 setError(null);

 // Chamada relativa funciona em produção (mesmo domínio Vercel)
 const API_URL = import.meta.env.VITE_API_URL || '';

 try {
 // 1. Verificar sessão do Supabase
 console.log('[Pluggy] Obtendo sessão do Supabase...');
 const { data: { session } } = await supabase.auth.getSession();
 if (!session) {
 throw new Error('Você precisa estar logado para conectar uma conta bancária.');
 }
 console.log('[Pluggy] Sessão válida. Solicitando connect token...');

 // 2. Obter Connect Token do backend
 const connectUrl = `${API_URL}/api/pluggy/connect`;
 console.log('[Pluggy] POST →', connectUrl);

 const response = await fetch(connectUrl, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${session.access_token}`
 },
 body: JSON.stringify({ itemId })
 });

 if (!response.ok) {
 const errData = await response.json().catch(() => ({}));
 const detail = errData.details || errData.error || `HTTP ${response.status}`;
 console.error('[Pluggy] Erro na API:', response.status, errData);
 throw new Error(`Falha ao gerar token: ${detail}`);
 }

 const connectData = await response.json();
 const token = connectData.accessToken;

 if (!token) {
 console.error('[Pluggy] Resposta inesperada:', connectData);
 throw new Error('Token de conexão não retornado pela API. Verifique as variáveis de ambiente da Pluggy no Vercel.');
 }
 console.log('[Pluggy] Connect token obtido com sucesso.');

 // 3. Carregar script do Pluggy Connect Widget (CDN)
 if (!window.PluggyConnect) {
 console.log('[Pluggy] Carregando script do CDN...');
 await new Promise((resolve, reject) => {
 const script = document.createElement('script');
 script.src = 'https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js';
 script.async = true;
 script.onload = () => {
 console.log('[Pluggy] Script CDN carregado com sucesso.');
 resolve();
 };
 script.onerror = (e) => {
 console.error('[Pluggy] Falha ao carregar script CDN:', e);
 reject(new Error('Falha ao carregar o widget da Pluggy. Verifique sua conexão com a internet.'));
 };
 document.body.appendChild(script);
 });
 }

 if (!window.PluggyConnect) {
 throw new Error('Widget PluggyConnect não encontrado após carregamento do script. O CDN pode estar indisponível.');
 }

 // 4. Abrir Widget
 console.log('[Pluggy] Inicializando widget...');
 const pluggyConnect = new window.PluggyConnect({
 connectToken: token,
 includeSandbox: false,
 onSuccess: async (itemData) => {
 console.log('[Pluggy] Conexão bem-sucedida:', itemData);

 try {
 const { data: { session: currentSession } } = await supabase.auth.getSession();

 // Registrar item no backend
 const resp = await fetch(`${API_URL}/api/pluggy/save-item`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${currentSession.access_token}`
 },
 body: JSON.stringify({ itemId: itemData.item.id })
 });

 if (!resp.ok) {
 const err = await resp.json().catch(() => ({}));
 throw new Error(err.error || 'Erro ao registrar item');
 }

 console.log('[Pluggy] Item salvo com sucesso. Recarregando...');
 window.location.reload();
 } catch (err) {
 console.error('[Pluggy] Erro ao salvar item:', err);
 setError(`Conexão estabelecida, mas erro ao registrar: ${err.message}`);
 }
 },
 onError: (errorData) => {
 console.error('[Pluggy] Erro no widget:', errorData);
 setError(errorData.message || 'Erro desconhecido no widget Pluggy.');
 },
 onClose: () => {
 console.log('[Pluggy] Widget fechado.');
 setConnecting(false);
 }
 });

 pluggyConnect.init();
 console.log('[Pluggy] Widget aberto com sucesso.');

 } catch (err) {
 console.error('[Pluggy] Erro geral:', err);
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
