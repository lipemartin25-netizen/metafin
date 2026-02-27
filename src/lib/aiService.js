/**
 * Serviço para chamadas de IA via Edge Function
 * NÃO expõe API keys no frontend
 */

import { supabase } from './supabase';

// Modelos disponíveis
export const AI_MODELS = {
    'gemini-flash': {
        id: 'gemini-1.5-flash',
        name: 'Gemini Flash',
        provider: 'google',
        icon: '✨',
        description: 'Rápido e eficiente',
        costTier: 'free',
    },
    'gemini-pro': {
        id: 'gemini-1.5-pro',
        name: 'Gemini Pro',
        provider: 'google',
        icon: '💎',
        description: 'Mais capaz e preciso',
        costTier: 'pro',
    },
    'gpt-4o-mini': {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        icon: '🧠',
        description: 'Equilíbrio custo-benefício',
        costTier: 'pro',
    },
    'gpt-4o': {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        icon: '🚀',
        description: 'O mais avançado da OpenAI',
        costTier: 'pro',
    },
    'claude-haiku': {
        id: 'claude-3-haiku-20240307',
        name: 'Claude Haiku',
        provider: 'anthropic',
        icon: '⚡',
        description: 'Rápido e econômico',
        costTier: 'pro',
    },
    'claude-sonnet': {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude Sonnet',
        provider: 'anthropic',
        icon: '🎭',
        description: 'Excelente em análises',
        costTier: 'pro',
    },
};

// Ações rápidas pré-definidas
export const AI_ACTIONS = {
    analyze: {
        label: '📊 Analisar gastos',
        prompt: 'Analise meus gastos do último mês e identifique padrões. Onde estou gastando mais?',
    },
    save: {
        label: '💰 Dicas de economia',
        prompt: 'Com base nas minhas transações, onde posso economizar dinheiro?',
    },
    budget: {
        label: '📋 Criar orçamento',
        prompt: 'Crie um plano de orçamento mensal baseado nos meus gastos e receitas.',
    },
    invest: {
        label: '📈 Sugestão de investimento',
        prompt: 'Com base no meu saldo e gastos, quanto posso investir mensalmente?',
    },
    category: {
        label: '🏷️ Categorizar transações',
        prompt: 'Revise minhas transações sem categoria e sugira categorias apropriadas.',
    },
    alert: {
        label: '⚠️ Alertas de gastos',
        prompt: 'Identifique gastos suspeitos ou fora do padrão nas minhas transações.',
    },
};

/**
 * Chama a Edge Function de AI
 * @param {string} modelKey - Chave do modelo (ex: 'gemini-flash')
 * @param {Array} messages - Array de mensagens no formato OpenAI
 * @returns {Promise<{content: string, model: string, provider: string, latency: number}>}
 */
export async function callAI(modelKey, messages) {
    const model = AI_MODELS[modelKey];

    if (!model) {
        throw new Error(`Modelo ${modelKey} não encontrado`);
    }

    const startTime = Date.now();

    try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: {
                messages,
                model: model.id,
                provider: model.provider,
            },
        });

        if (error) {
            console.error('AI Service Error:', error);
            throw new Error(error.message || 'Erro ao chamar IA');
        }

        return {
            content: data.content,
            model: data.model,
            provider: data.provider,
            latency: data.latency || (Date.now() - startTime),
            modelName: model.name,
        };
    } catch (err) {
        console.error('AI Service Failed:', err);
        throw err;
    }
}

/**
 * Constrói contexto financeiro para o prompt
 * @param {Array} transactions - Transações do usuário
 * @param {Object} summary - Resumo financeiro
 * @returns {string} Contexto formatado
 */
export function buildFinancialContext(transactions, summary) {
    if (!transactions?.length) {
        return 'O usuário ainda não possui transações registradas.';
    }

    // Agrupar por categoria
    const byCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const cat = t.category || 'Sem categoria';
            acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
            return acc;
        }, {});

    const topCategories = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, val]) => `- ${cat}: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
        .join('\n');

    // Últimas transações
    const recentTransactions = transactions
        .slice(0, 10)
        .map(t => `- ${t.date}: ${t.description} (${t.type === 'income' ? '+' : '-'}R$ ${Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`)
        .join('\n');

    return `
CONTEXTO FINANCEIRO DO USUÁRIO (METAFIN):

📊 Resumo:
- Total de Receitas: R$ ${(summary.income || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total de Despesas: R$ ${(summary.expense || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Saldo: R$ ${(summary.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total de transações: ${summary.count || transactions.length}

🏷️ Top 5 Categorias de Gastos:
${topCategories || 'Nenhuma despesa categorizada'}

📜 Últimas 10 Transações:
${recentTransactions || 'Nenhuma transação recente'}

⚠️ IMPORTANTE: Você é o MetaFin AI. Responda sempre em português brasileiro, de forma clara e objetiva.
Use emojis para tornar a resposta mais visual. Formate valores em Reais (R$).
`.trim();
}

export default {
    callAI,
    buildFinancialContext,
    AI_MODELS,
    AI_ACTIONS,
};
