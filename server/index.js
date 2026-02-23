const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { PluggyClient } = require('pluggy-sdk');

const app = express();

// Supabase Setup
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Pluggy Setup
const pluggy = new PluggyClient({
    clientId: process.env.PLUGGY_CLIENT_ID,
    clientSecret: process.env.PLUGGY_CLIENT_SECRET,
});

// CORS — restringir origens permitidas
const ALLOWED_ORIGINS = [
    'https://metafin.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
];
app.use(cors({
    origin: (origin, cb) => {
        // Permitir requests sem origin (mobile apps, Postman em dev)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error('Bloqueado por CORS'));
    },
    credentials: true,
}));
app.use(express.json({ limit: '1mb' })); // Prevenir payloads absurdos
app.use(morgan('dev'));

// Health Check
app.get('/api/pluggy/health', (req, res) => {
    res.json({ status: 'ok', message: 'MetaFin API is running on Vercel' });
});

// Middleware: Autenticação via Supabase JWT
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token missing' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;
    next();
};

// 1. Criar Connect Token
app.post('/api/pluggy/connect-token', authenticate, async (req, res) => {
    try {
        const { itemId } = req.body;
        const token = await pluggy.createConnectToken(itemId);
        res.json(token);
    } catch (err) {
        console.error('Pluggy Token Error:', err);
        res.status(500).json({ error: 'Failed to create connect token' });
    }
});

// 2. Webhook
app.post('/api/pluggy/webhook', async (req, res) => {
    const { event, item, itemId } = req.body;
    if (event === 'item/created' || event === 'item/updated') {
        const connItemId = itemId || item?.id;
        await syncItemData(connItemId);
    }
    res.sendStatus(200);
});

// Helper Function: Sincronizar dados
async function syncItemData(itemId) {
    try {
        const { data: connection } = await supabase
            .from('of_connections')
            .select('id, user_id')
            .eq('provider_item_id', itemId)
            .single();

        if (!connection) return;

        const { results: accounts } = await pluggy.fetchAccounts(itemId);

        for (const acc of accounts) {
            const bankAcc = {
                user_id: connection.user_id,
                connection_id: connection.id,
                provider_account_id: acc.id,
                bank_name: acc.institution.name,
                display_name: acc.name,
                type: acc.type,
                number: acc.number,
                balance_current: acc.balance,
                balance_available: acc.balance,
                currency_code: acc.currencyCode,
                updated_at: new Date()
            };

            await supabase
                .from('pluggy_bank_accounts')
                .upsert(bankAcc, { onConflict: 'provider_account_id' });
        }

        const pluggyItem = await pluggy.fetchItem(itemId);
        await supabase
            .from('of_connections')
            .update({ status: pluggyItem.status, last_synced_at: new Date() })
            .eq('provider_item_id', itemId);

    } catch (err) {
        console.error('Sync Error:', err);
    }
}

// Export for Vercel Serverless
module.exports = app;

// Listen only if not in production (Vercel handles listening in prod)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Development server running on port ${PORT}`);
    });
}
