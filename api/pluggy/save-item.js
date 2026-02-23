import { createClient } from '@supabase/supabase-js';
import { PluggyClient } from 'pluggy-sdk';

const ALLOWED_ORIGINS = [
    'https://metafin.vercel.app',
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
            const pluggy = new PluggyClient({
                clientId: process.env.PLUGGY_CLIENT_ID.trim(),
                clientSecret: process.env.PLUGGY_CLIENT_SECRET.trim(),
            });

            const { results: accounts } = await pluggy.fetchAccounts(itemId);

            for (const acc of accounts) {
                const bankAcc = {
                    user_id: user.id,
                    connection_id: data.id,
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

                if (!accErr && savedAcc) {
                    try {
                        // Buscar últimos 90 dias
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
                                // Pluggy expenses vêm como tipo DEBIT ou CREDIT negativo. As receitas vêm positivas e tipo CREDIT (na maior parte).
                                const amountFloat = parseFloat(tx.amount) || 0;
                                const tType = amountFloat >= 0 ? 'income' : 'expense';

                                return {
                                    user_id: user.id,
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

                            // Inserir diretamente na tabela principal do Livro-Caixa do App ("transactions")
                            await supabase
                                .from('transactions')
                                .upsert(txsToInsert, { onConflict: 'provider_transaction_id' });
                        }
                    } catch (txErr) {
                        console.error(`Erro na carga inicial de transações (Conta ${acc.id}):`, txErr.message);
                    }
                }
            }

            // Atualizar status para refletir o status no Pluggy
            const pluggyItem = await pluggy.fetchItem(itemId);
            await supabase
                .from('of_connections')
                .update({ status: pluggyItem.status, last_synced_at: new Date() })
                .eq('id', data.id);

        } catch (syncErr) {
            console.error('Erro na sincronização inicial do Pluggy:', syncErr.message);
            // Não quebra a requisição do usuário, pois o item foi cadastrado na linha 42
        }

        return res.status(200).json(data);
    } catch (e) {
        console.error("pluggy/save-item error:", e);
        return res.status(500).json({ error: "Internal error" });
    }
}
