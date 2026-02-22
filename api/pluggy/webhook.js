import { createClient } from '@supabase/supabase-js';
import { PluggyClient } from 'pluggy-sdk';
import crypto from 'crypto';

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

// Cache global em memória para Rate Limiting e Replay Protection
const rateLimit = new Map();
const seenNonces = new Set();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // A. Rate Limiting (DDoS Protection)
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const currentRequests = rateLimit.get(ip) || 0;
    if (currentRequests > 100) {
        return res.status(429).json({ error: 'Too Many Requests' });
    }
    rateLimit.set(ip, currentRequests + 1);

    // Libera a requisição do rate limit global após 1 minuto (Edge/Serverless lifetime support)
    setTimeout(() => { rateLimit.set(ip, Math.max(0, rateLimit.get(ip) - 1)); }, 60000);

    // Validação Webhook Secret OBRIGATÓRIA (Assinatura HMAC simplificada)
    const webhookSecret = process.env.PLUGGY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('CRITICAL: PLUGGY_WEBHOOK_SECRET is not configured on the server.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const receivedSecret = req.headers['x-webhook-secret'] || req.query?.secret;
    if (receivedSecret !== webhookSecret) {
        console.warn('Webhook rejected: invalid secret');
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const { event, item, itemId, id: eventId } = req.body || {};

        if (!event || typeof event !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid event' });
        }

        const connItemId = itemId || item?.id;

        // B. Replay Attack Protection
        const timestamp = new Date().toISOString();
        const webhookNonce = `${timestamp.slice(0, 13)}-${eventId || connItemId || crypto.randomUUID()}`;

        if (seenNonces.has(webhookNonce)) {
            // Evita duplicidade de execução no mesmo webhook id + hora
            return res.status(409).json({ error: 'Duplicate Event / Replay Attack Prevented' });
        }
        seenNonces.add(webhookNonce);
        setTimeout(() => seenNonces.delete(webhookNonce), 60000);

        // C. Logging Estruturado (Datadog/Sentry Ready - No PII)
        const requestHash = crypto.createHash('sha256').update(ip).digest('hex');
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            webhookId: eventId || crypto.randomUUID(),
            status: 'received',
            provider: 'pluggy',
            event_type: event,
            actor_hash: requestHash
        }));

        if ((event === 'item/created' || event === 'item/updated') && connItemId) {
            if (!UUID_RE.test(connItemId)) {
                return res.status(400).json({ error: 'Invalid itemId format' });
            }
            await syncItemData(connItemId);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            status: 'error',
            message: error.message || 'Internal server error'
        }));
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

        // 1. Puxar Contas e salvar na tabela correta "bank_accounts"
        const { results: accounts } = await pluggy.fetchAccounts(itemId);

        for (const acc of accounts) {
            const bankAcc = {
                user_id: connection.user_id,
                connection_id: connection.id,
                provider_account_id: acc.id,
                bank_name: acc.institution?.name || 'Banco Desconhecido',
                display_name: acc.name || 'Conta Corrente',
                agency: acc.agency || '',
                account_number: acc.number || '',
                balance: acc.balance || 0,
                currency_code: acc.currencyCode || 'BRL',
                logo_url: acc.institution?.imageUrl || null,
                updated_at: new Date()
            };

            const { data: savedAcc, error: accErr } = await supabase
                .from('bank_accounts')
                .upsert(bankAcc, { onConflict: 'provider_account_id' })
                .select('id')
                .single();

            if (accErr) {
                console.error('Erro ao salvar conta:', accErr);
                continue;
            }

            // 2. Puxar Transações da Conta e Cartões de Crédito (Últimos 90 Dias Line-by-Line)
            try {
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - 90);
                const from = fromDate.toISOString().split('T')[0];

                const { results: transactions } = await pluggy.fetchTransactions(acc.id, { from });

                if (transactions && transactions.length > 0) {
                    const txsToInsert = transactions.map(tx => {
                        // 1. Mapeamento Semântico de Categoria
                        const pluggyCat = (tx.category || '').toLowerCase();
                        let targetCat = 'outros';
                        if (pluggyCat.match(/aliment|restaurant|supermercad|food|comid|refeiç|mercad|padaria|ifood|rappi/)) targetCat = 'alimentacao';
                        else if (pluggyCat.match(/transport|auto|posto|uber|99|combustível|veículo|estacionamento/)) targetCat = 'transporte';
                        else if (pluggyCat.match(/moradi|casa|conta|serviç|resid|telefone|tv|internet|energia|condomínio/)) targetCat = 'moradia';
                        else if (pluggyCat.match(/sa[uú]d|farm[aá]ci|medic|hospital|clinica|drogari/)) targetCat = 'saude';
                        else if (pluggyCat.match(/educ|curso|escola|faculdade|livraria|treinamento/)) targetCat = 'educacao';
                        else if (pluggyCat.match(/entret|lazer|viagem|cinema|restaurante|bar|assinatura|streaming|jogos|spotify|netflix/)) targetCat = 'entretenimento';
                        else if (pluggyCat.match(/renda|salario|pagamento|depos|remuneração|pix.*recebido/)) targetCat = 'renda';
                        else if (pluggyCat.match(/invest|rendiment|poupanca|aplicação|corretora/)) targetCat = 'investimentos';

                        // 2. Tradução de Valores e Tipos
                        const amountFloat = parseFloat(tx.amount) || 0;
                        const tType = amountFloat >= 0 ? 'income' : 'expense';

                        return {
                            user_id: connection.user_id,
                            account_id: savedAcc.id,
                            provider_transaction_id: tx.id,
                            description: tx.description || 'Transação Open Finance',
                            amount: amountFloat,
                            category: targetCat,
                            status: 'categorized',
                            type: tType,
                            date: tx.date ? tx.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
                            notes: `Plataforma: Open Finance | Categoria Original: ${tx.category || 'N/A'}`,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                    });

                    const { error: txErr } = await supabase
                        .from('transactions')
                        .upsert(txsToInsert, { onConflict: 'provider_transaction_id' });

                    if (txErr) console.error('Erro ao salvar transações:', txErr.message);
                }
            } catch (txFetchErr) {
                console.error(`Erro ao puxar transações para conta ${acc.id}:`, txFetchErr.message);
            }
        }

        // Atualizar status da conexão
        const pluggyItem = await pluggy.fetchItem(itemId);
        await supabase
            .from('of_connections')
            .update({ status: pluggyItem.status, last_synced_at: new Date() })
            .eq('provider_item_id', itemId);

    } catch (err) {
        console.error('Sync Error:', err);
    }
}
