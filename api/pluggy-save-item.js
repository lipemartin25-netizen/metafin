const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Token missing' });

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: 'Invalid token' });

        const { itemId } = req.body;

        // Criar a conexão no banco ANTES de sincronizar
        const { data, error: upsertError } = await supabase
            .from('of_connections')
            .upsert({
                user_id: user.id,
                provider_item_id: itemId,
                status: 'UPDATING',
                provider: 'pluggy'
            }, { onConflict: 'provider_item_id' })
            .select()
            .single();

        if (upsertError) throw upsertError;

        res.status(200).json(data);
    } catch (err) {
        console.error('Pluggy Save Item Error:', err);
        res.status(500).json({ error: 'Failed to save connection item' });
    }
}
