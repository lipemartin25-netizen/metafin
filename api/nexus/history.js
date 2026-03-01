// api/nexus/history.js
import { validateSession } from '../_lib/auth.js'
import { createClient } from '@supabase/supabase-js'

/**
 * Nexus History Management Endpoint
 * GET: Retorna o histórico de mensagens do usuário (limitado às últimas 50)
 * DELETE: Limpa todo o histórico (Hard Delete)
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(204).end();

    const session = await validateSession(req);
    if (!session.valid) return res.status(401).json({ error: 'Não autorizado' });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('nexus_chat_history')
                .select('role, content, model, created_at')
                .eq('user_id', session.userId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) throw error;
            return res.status(200).json({ history: data });
        }

        if (req.method === 'DELETE') {
            const { error } = await supabase
                .from('nexus_chat_history')
                .delete()
                .eq('user_id', session.userId);

            if (error) throw error;
            return res.status(200).json({ success: true, message: 'Histórico limpo com sucesso.' });
        }

        return res.status(405).json({ error: 'Método não permitido' });

    } catch (error) {
        console.error('[nexus-history] Erro:', error.message);
        return res.status(500).json({ error: 'Falha ao gerenciar histórico do Nexus.' });
    }
}
