import { createClient } from '@supabase/supabase-js';
import { PluggyClient } from 'pluggy-sdk';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const pluggy = new PluggyClient({
    clientId: process.env.PLUGGY_CLIENT_ID,
    clientSecret: process.env.PLUGGY_CLIENT_SECRET,
});

// UUID v4 pattern for itemId validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validar webhook secret (configure PLUGGY_WEBHOOK_SECRET nas env vars da Vercel)
    const webhookSecret = process.env.PLUGGY_WEBHOOK_SECRET;
    if (webhookSecret) {
        const receivedSecret = req.headers['x-webhook-secret'] || req.query?.secret;
        if (receivedSecret !== webhookSecret) {
            console.warn('Webhook rejected: invalid secret');
            return res.status(403).json({ error: 'Forbidden' });
        }
    }

    try {
        const { event, item, itemId } = req.body || {};

        // Validar campos obrigatórios
        if (!event || typeof event !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid event' });
        }

        const connItemId = itemId || item?.id;
        console.log(`Webhook received: ${event} for item ${connItemId}`);

        if ((event === 'item/created' || event === 'item/updated') && connItemId) {
            // Validar formato do itemId
            if (!UUID_RE.test(connItemId)) {
                return res.status(400).json({ error: 'Invalid itemId format' });
            }
            await syncItemData(connItemId);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Handler Error:', error);
        // Não expor detalhes internos do erro em produção
        res.status(500).json({ error: 'Internal server error' });
    }
}

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
