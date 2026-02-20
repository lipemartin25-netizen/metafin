import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
    'https://smart-finance-hub-tau.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
];

function setCorsHeaders(req, res) {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
}

export default async function handler(req, res) {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validar env vars antes de tudo
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET } = process.env;

    if (!PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Missing Pluggy env vars' });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Missing Supabase env vars' });
    }

    try {
        // Autenticar usuário via Supabase
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) return res.status(401).json({ error: 'Token missing' });

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token', details: authError?.message });
        }

        // Criar connect token via API REST (sem depender da SDK)
        // Primeiro, obter API key da Pluggy
        const authResponse = await fetch('https://api.pluggy.ai/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId: PLUGGY_CLIENT_ID,
                clientSecret: PLUGGY_CLIENT_SECRET,
            }),
        });

        if (!authResponse.ok) {
            const authErr = await authResponse.text();
            return res.status(500).json({ error: 'Pluggy auth failed', details: authErr });
        }

        const { apiKey } = await authResponse.json();

        // Agora criar o connect token
        const body = {};
        const { itemId } = req.body || {};
        if (itemId) body.itemId = itemId;

        const connectResponse = await fetch('https://api.pluggy.ai/connect_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey,
            },
            body: JSON.stringify(body),
        });

        if (!connectResponse.ok) {
            const connectErr = await connectResponse.text();
            return res.status(500).json({ error: 'Failed to create connect token', details: connectErr });
        }

        const connectData = await connectResponse.json();
        return res.status(200).json(connectData);

    } catch (err) {
        console.error('Pluggy Connect Error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
