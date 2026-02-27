
import { PluggyClient } from 'pluggy-sdk';

/**
 * Mapeamento avançado de categorias baseado em palavras-chave e padrões brasileiros
 */
export function mapCategory(description, pluggyCategory) {
    const text = (description + ' ' + (pluggyCategory || '')).toLowerCase();

    // 1. Alimentação
    if (text.match(/aliment|restaurant|supermercad|food|comid|refeiç|mercad|padaria|ifood|rappi|uber.*eats|mcdonald|bk|burger|outback|pizzari|acai|cafeteria|confeitaria|hortifruti/))
        return 'alimentacao';

    // 2. Transporte
    if (text.match(/transport|auto|posto|uber|99|tax|combustível|veículo|estacionamento|pedagio|semparar|veloe|ipva|oficina|mecanico|pneu|locadora/))
        return 'transporte';

    // 3. Moradia & Contas Fixas
    if (text.match(/moradi|casa|conta|serviç|resid|telefone|tv|internet|energia|condomínio|aluguel|iptu|gas|luz|agua|sanepar|sabesp|enel|claro|vivo|tim|oi|reforma|ferragens|telhanorte|leroy/))
        return 'moradia';

    // 4. Saúde
    if (text.match(/sa[uú]d|farm[aá]ci|medic|hospital|clinica|drogari|exame|odonto|psicologo|terapia|academia|smartfit|crossfit|suplemento/))
        return 'saude';

    // 5. Educação
    if (text.match(/educ|curso|escola|faculdade|livraria|treinamento|udemy|alura|mensalidade|idiomas|ingles/))
        return 'educacao';

    // 6. Entretenimento & Lazer
    if (text.match(/entret|lazer|viagem|cinema|restaurante|bar|assinatura|streaming|jogos|spotify|netflix|disney|hbo|globo.*play|steam|psn|xbox|turismo|hospedagem|decolar|booking/))
        return 'entretenimento';

    // 7. Renda / Entradas
    if (text.match(/renda|salario|pagamento.*recebido|depos|remuneração|pix.*recebido|transferencia.*recebida|estorno|reembolso|dividendos|jcp/))
        return 'renda';

    // 8. Investimentos
    if (text.match(/invest|rendiment|poupanca|aplicação|corretora|tesouro|acoes|fii|crypto|binance|nuinvest|xp.*invest/))
        return 'investimentos';

    // 9. Compras / Pessoal
    if (text.match(/loja|shopee|amazon|mercado.*livre|magalu|americanas|vestuario|roupa|calcado|estetica|beleza|cabeleireiro|barbeiro|presente/))
        return 'compras';

    return 'outros';
}

/**
 * Extrai detalhes específicos de PIX da descrição
 */
export function parsePixDetails(description) {
    if (!description.toUpperCase().includes('PIX')) return null;

    let details = {
        is_pix: true,
        type: description.toUpperCase().includes('RECEBIDO') ? 'incoming' : 'outgoing',
        counterpart: null
    };

    // Tentar extrair nome após padrões comuns
    const patterns = [
        /PIX\s+RECEBIDO\s+DE\s+([^/-]+)/i,
        /PIX\s+ENVIADO\s+PARA\s+([^/-]+)/i,
        /PIX\s+TRANSF\s+([^/-]+)/i,
        /PIX\s+PAGTO\s+([^/-]+)/i,
        /-\s+PIX\s+-\s+([^/-]+)/i,
        /DE:\s+([^/-]+)/i,
        /PARA:\s+([^/-]+)/i
    ];

    for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match && match[1]) {
            details.counterpart = match[1].trim();
            break;
        }
    }

    return details;
}

/**
 * Função de sincronização centralizada
 */
export async function syncItemData(supabase, itemId) {
    if (!process.env.PLUGGY_CLIENT_ID || !process.env.PLUGGY_CLIENT_SECRET) {
        throw new Error('[Sync] PLUGGY_CLIENT_ID ou PLUGGY_CLIENT_SECRET não configurados.');
    }

    const pluggy = new PluggyClient({
        clientId: process.env.PLUGGY_CLIENT_ID.trim(),
        clientSecret: process.env.PLUGGY_CLIENT_SECRET.trim(),
    });

    try {
        console.log(`[Sync] Iniciando sincronização para item: ${itemId}`);

        const { data: connection } = await supabase
            .from('of_connections')
            .select('id, user_id')
            .eq('provider_item_id', itemId)
            .single();

        if (!connection) {
            console.error(`[Sync] Conexão não encontrada para provider_item_id: ${itemId}`);
            return;
        }

        // 1. Puxar Contas
        const { results: accounts } = await pluggy.fetchAccounts(itemId);
        console.log(`[Sync] ${accounts.length} contas encontradas.`);

        for (const acc of accounts) {
            // Mapear saldo e limites
            let balance = acc.balance || 0;
            let creditLimit = acc.creditLimit || 0;

            // Atualizar/Inserir conta bancária com metadados de limite se for cartão
            const bankAcc = {
                user_id: connection.user_id,
                connection_id: connection.id,
                provider_account_id: acc.id,
                bank_name: acc.institution?.name || 'Banco Desconhecido',
                display_name: acc.name || (acc.type === 'CREDIT' ? 'Cartão de Crédito' : 'Conta Corrente'),
                agency: acc.agency || '',
                account_number: acc.number || '',
                balance: balance,
                currency_code: acc.currencyCode || 'BRL',
                logo_url: acc.institution?.imageUrl || null,
                updated_at: new Date()
                // Se houver coluna de limite futuramente, mapear aqui: 
                // credit_limit: creditLimit
            };

            const { data: savedAcc, error: accErr } = await supabase
                .from('bank_accounts')
                .upsert(bankAcc, { onConflict: 'provider_account_id' })
                .select('id')
                .single();

            if (accErr || !savedAcc) {
                console.error(`[Sync] Erro ao salvar conta ${acc.id}:`, accErr?.message);
                continue;
            }

            // 2. Puxar Transações (90 dias)
            try {
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - 90);
                const from = fromDate.toISOString().split('T')[0];

                console.log(`[Sync] Puxando transações para conta ${acc.id} (${acc.type}) desde ${from}...`);

                // Puxar transações normais
                const { results: transactions } = await pluggy.fetchTransactions(acc.id, { from });

                if (transactions && transactions.length > 0) {
                    console.log(`[Sync] ${transactions.length} transações encontradas na conta ${acc.id}.`);

                    const txsToInsert = transactions.map(tx => {
                        const amountFloat = parseFloat(tx.amount) || 0;
                        const tType = amountFloat >= 0 ? 'income' : 'expense';

                        // Detalhes de PIX
                        const pixDetails = parsePixDetails(tx.description || '');

                        // Categoria (melhorada usando contraparte do PIX se existir)
                        const searchTerms = (pixDetails?.counterpart || '') + ' ' + (tx.description || '');
                        const targetCat = mapCategory(searchTerms, tx.category);

                        let finalDescription = tx.description || 'Transação Open Finance';
                        if (pixDetails && pixDetails.counterpart) {
                            finalDescription = `${pixDetails.type === 'incoming' ? 'PIX de' : 'PIX para'} ${pixDetails.counterpart}`;
                        } else if (acc.type === 'CREDIT') {
                            finalDescription = `[Cartão] ${tx.description}`;
                        }

                        return {
                            user_id: connection.user_id,
                            account_id: savedAcc.id,
                            provider_transaction_id: tx.id,
                            description: finalDescription,
                            amount: amountFloat,
                            category: targetCat,
                            status: 'categorized',
                            type: tType,
                            date: tx.date ? tx.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
                            notes: `Instituição: ${bankAcc.bank_name} | Original: ${tx.description} | Categoria Original: ${tx.category || 'N/A'} ${pixDetails ? '| Método: PIX' : ''} ${acc.type === 'CREDIT' ? `| Limite: ${creditLimit}` : ''}`,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                    });

                    const { error: txErr } = await supabase
                        .from('transactions')
                        .upsert(txsToInsert, { onConflict: 'provider_transaction_id' });

                    if (txErr) console.error(`[Sync] Erro ao salvar transações da conta ${acc.id}:`, txErr.message);
                }
            } catch (txFetchErr) {
                console.error(`[Sync] Erro ao buscar transações da conta ${acc.id}:`, txFetchErr.message);
            }
        }

        // 3. Atualizar status final da conexão
        const pluggyItem = await pluggy.fetchItem(itemId);
        await supabase
            .from('of_connections')
            .update({
                status: pluggyItem.status,
                last_synced_at: new Date(),
                updated_at: new Date()
            })
            .eq('provider_item_id', itemId);

        console.log(`[Sync] Sincronização finalizada para item ${itemId}. Status: ${pluggyItem.status}`);

    } catch (err) {
        console.error(`[Sync] Erro crítico na sincronização:`, err.message);
    }
}
