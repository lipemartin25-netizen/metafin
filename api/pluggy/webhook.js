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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { event, item, itemId } = req.body;
        console.log(`Webhook received: ${event} for item ${itemId || item?.id}`);

        if (event === 'item/created' || event === 'item/updated') {
            const connItemId = itemId || item?.id;
            await syncItemData(connItemId);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Handler Error:', error);
        res.status(500).json({ error: error.message });
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
