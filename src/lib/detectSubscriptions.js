import { differenceInDays, addDays, parseISO } from 'date-fns';

function normalizeDescription(desc) {
    if (!desc) return 'desconhecido';

    // Remove palavras-chave muito comuns de extrato bancário
    let clean = desc.toLowerCase()
        .replace(/pagto|pgto|compra|cartao|fatura|pix|debito|automatico/g, '')
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Geralmente a primeira palavra que sobrar carrega o nome da empresa (ex: 'netflix', 'spotify')
    const key = clean.split(' ')[0];
    return key;
}

export function detectSubscriptions(transactions) {
    if (!transactions || transactions.length === 0) return [];

    // Selecionar despesas consolidadas
    const expenses = transactions.filter(t => t.type === 'expense' && t.status !== 'pending' && t.amount < 0);

    const grouped = {};
    expenses.forEach(t => {
        const key = normalizeDescription(t.description);
        if (key.length <= 2) return; // ignorar ruídos

        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t);
    });

    const subscriptions = [];

    Object.entries(grouped).forEach(([key, txns]) => {
        if (txns.length < 2) return; // Requer pelo menos 2 ocorrências para traçar padrão

        // Ordenar do mais antigo pro mais recente
        txns.sort((a, b) => new Date(a.date) - new Date(b.date));

        const amounts = txns.map(t => Math.abs(t.amount));
        const minAmount = Math.min(...amounts);
        const maxAmount = Math.max(...amounts);

        // Tolerância de até 15% de variação no preço da assinatura (casos de taxas/impostos pequenos)
        if (minAmount === 0 || maxAmount / minAmount > 1.15) return;

        // Analisar intervalos de tempo entre as contas
        const intervals = [];
        for (let i = 1; i < txns.length; i++) {
            const diff = differenceInDays(parseISO(txns[i].date), parseISO(txns[i - 1].date));
            intervals.push(diff);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

        const isMonthly = avgInterval >= 25 && avgInterval <= 35;
        const isAnnual = avgInterval >= 350 && avgInterval <= 380;

        if (isMonthly || isAnnual) {
            const lastCharge = txns[txns.length - 1];

            // Tentar capturar o nome original mais legível possível
            const bestDesc = txns.reduce((a, b) => a.description.length > b.description.length ? a : b).description;
            const cleanName = bestDesc.split('-')[0].split('*').pop().trim();

            const nextRenewalDate = addDays(parseISO(lastCharge.date), Math.round(avgInterval));

            subscriptions.push({
                id: key,
                name: cleanName || key.toUpperCase(),
                amount: Math.abs(lastCharge.amount),
                frequency: isMonthly ? 'Mensal' : 'Anual',
                lastCharge: lastCharge.date,
                nextRenewal: nextRenewalDate.toISOString(),
                annualCost: isMonthly ? Math.abs(lastCharge.amount) * 12 : Math.abs(lastCharge.amount),
                chargeCount: txns.length,
            });
        }
    });

    // Retornar lista ordenada pela assinatura mais cara anualmente
    return subscriptions.sort((a, b) => b.annualCost - a.annualCost);
}
