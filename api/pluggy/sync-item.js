
import { createClient } from '@supabase/supabase-js';
import { syncItemData } from './_sync.js';

/**
 * Endpoint para disparar sincronização manual de um item Pluggy
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'Missing itemId' });

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Validar token do usuário para autorização
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

        // Verificar se este itemId pertence ao usuário
        const { data: connection, error: connError } = await supabase
            .from('of_connections')
            .select('id')
            .eq('provider_item_id', itemId)
            .eq('user_id', user.id)
            .single();

        if (connError || !connection) {
            return res.status(403).json({ error: 'Item not found or does not belong to user' });
        }

        // Chamar o motor de sincronização
        await syncItemData(supabase, itemId);

        return res.status(200).json({ status: 'success' });
    } catch (err) {
        console.error('Manual sync error:', err);
        return res.status(500).json({ error: err.message });
    }
}
