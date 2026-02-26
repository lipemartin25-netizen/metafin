import { createClient } from '@supabase/supabase-js';
import { syncItemData } from './_sync.js';

const ALLOWED_ORIGINS = [
    'https://metafin-app.vercel.app',
    'https://metafin-app.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
];

function getBearerToken(req) {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return null;
    return auth.slice(7);
}

export default async function handler(req, res) {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).end();

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const token = getBearerToken(req);
        if (!token) return res.status(401).json({ error: "Missing bearer token" });

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        const { itemId } = req.body || {};
        if (!itemId) return res.status(400).json({ error: "Missing itemId" });

        const { data, error } = await supabase
            .from("of_connections")
            .upsert(
                {
                    user_id: user.id,
                    provider_item_id: itemId,
                    status: "UPDATING",
                    provider: "pluggy",
                    updated_at: new Date(),
                },
                { onConflict: "provider_item_id" }
            )
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });

        // INICIAR SINCRONIZAÇÃO IMEDIATA DAS CONTAS E TRANSAÇÕES
        try {
            await syncItemData(supabase, itemId);
        } catch (syncErr) {
            console.error('Erro na sincronização inicial do Pluggy:', syncErr.message);
        }

        return res.status(200).json(data);
    } catch (e) {
        console.error("pluggy/save-item error:", e);
        return res.status(500).json({ error: "Internal error" });
    }
}
