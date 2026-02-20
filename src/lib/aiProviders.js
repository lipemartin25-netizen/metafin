/**
 * SmartFinance Hub — AI Provider Hub
 * Suporta: OpenAI, Gemini, Claude, DeepSeek, Grok, Qwen
 *
 * IMPORTANTE: Em produção, as API keys devem ficar no BACKEND (Supabase Edge Functions).
 * Esta implementação usa proxy via Edge Function para segurança.
 * Para MVP/teste, chamadas diretas são usadas com keys no .env (apenas dev).
 */

// ========== MODELOS DISPONÍVEIS ==========
export const AI_MODELS = {
    'gpt-5-nano': {
        id: 'gpt-5-nano',
        name: 'GPT-5 Nano',
        provider: 'openai',
        label: 'Rápido & Econômico',
        icon: '⚡',
        color: '#10a37f',
        description: 'Respostas rápidas para perguntas simples',
        costTier: 'Free*',
        contextWindow: '128K',
        model: 'gpt-4o-mini',
    },
    'gpt-5': {
        id: 'gpt-5',
        name: 'GPT-5 Standard',
        provider: 'openai',
        label: 'Análise Inteligente',
        icon: '🧠',
        color: '#10a37f',
        description: 'Análises financeiras com alta inteligência (o1-mini/4o-mini)',
        costTier: 'Economical',
        contextWindow: '128K',
        model: 'gpt-4o-mini', // Mantido econômico para evitar custos altos
    },
    'gemini-flash': {
        id: 'gemini-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'google',
        label: 'Grátis & Rápido',
        icon: '✨',
        color: '#4285f4',
        description: 'Google AI Grátis — alta velocidade e limites generosos',
        costTier: 'FREE',
        contextWindow: '1M',
        model: 'gemini-1.5-flash',
    },
    'claude-sonnet': {
        id: 'claude-sonnet',
        name: 'Claude Sonnet',
        provider: 'anthropic',
        label: 'Análise Detalhada',
        icon: '🎭',
        color: '#d97706',
        description: 'Anthropic — excelente para análises detalhadas e nuance',
        costTier: '$$$',
        contextWindow: '200K',
        model: 'claude-3-5-sonnet-20240620', // Atualizado para ID real
    },
    'deepseek': {
        id: 'deepseek',
        name: 'DeepSeek',
        provider: 'deepseek',
        label: 'Melhor Custo-Benefício',
        icon: '🔮',
        color: '#6366f1',
        description: 'Extremamente econômico com boa capacidade de raciocínio',
        costTier: '$',
        contextWindow: '128K',
        model: 'deepseek-chat',
    },
    'grok-fast': {
        id: 'grok-fast',
        name: 'Grok Fast',
        provider: 'xai',
        label: 'Tendências & Insights',
        icon: '🔥',
        color: '#ef4444',
        description: 'xAI — rápido e com perspectiva única',
        costTier: '$',
        contextWindow: '2M',
        model: 'grok-beta', // Fallback ID
    },
    'qwen': {
        id: 'qwen',
        name: 'Qwen 2.5',
        provider: 'alibaba',
        label: 'Multilíngue',
        icon: '🌏',
        color: '#8b5cf6',
        description: 'Alibaba — forte em multilíngue e dados tabulares',
        costTier: '$$',
        contextWindow: '128K',
        model: 'qwen-turbo',
    },
};

// ========== SYSTEM PROMPT ==========
const SYSTEM_PROMPT = `Você é o SmartFinance AI, um assistente financeiro especializado em finanças pessoais brasileiras.

Regras:
- Responda SEMPRE em Português do Brasil
- Use valores em R$ (Real)
- Considere a realidade econômica brasileira (IPCA, Selic, CLT, INSS, IR)
- Formate valores como: R$ 1.234,56
- Formate datas como: DD/MM/YYYY
- Seja direto e prático nas recomendações
- Use emojis moderadamente para melhor legibilidade
- NUNCA invente dados — use apenas o que foi fornecido no contexto
- Se não souber, diga claramente

Contexto financeiro do usuário será fornecido na mensagem.`;

// ========== EDGE FUNCTION PROXY ==========
// Todas as chamadas de IA passam pela Edge Function 'ai-chat' do Supabase.
// As API keys ficam APENAS no servidor (Supabase Secrets).
// O frontend NUNCA mais tem acesso a chaves de IA.

import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Chamar qualquer modelo de IA via Edge Function segura.
 *
 * @param {string} modelId - ID do modelo (ex: 'gemini-flash', 'gpt-5-nano')
 * @param {Array} messages - [{ role: 'user'|'assistant'|'system', content: string }]
 * @param {Object} options - { temperature?, maxTokens? }
 */
export async function callAI(modelId, messages, options = {}) {
    const modelConfig = AI_MODELS[modelId];
    if (!modelConfig) throw new Error(`Modelo "${modelId}" não encontrado`);

    // Adicionar system prompt se não existir
    const fullMessages = messages[0]?.role === 'system'
        ? messages
        : [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    if (!supabase) {
        throw new Error('Supabase não configurado. IA requer autenticação.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Faça login para usar o assistente de IA.');
    }

    const startTime = Date.now();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
            modelId,
            messages: fullMessages,
            options: {
                temperature: options.temperature ?? 0.7,
                maxTokens: options.maxTokens ?? 2048,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            error.error ||
            `Erro ${response.status}: verifique se a Edge Function 'ai-chat' foi deployada.`
        );
    }

    const result = await response.json();

    return {
        content: result.content || '',
        usage: result.usage || {},
        model: result.model || modelConfig.model,
        modelId,
        modelName: modelConfig.name,
        provider: result.provider || modelConfig.provider,
        latency: result.latency || (Date.now() - startTime),
    };
}

// ========== FINANCIAL PROMPTS ==========
export function buildFinancialContext(transactions, summary, extraData = {}) {
    if (!transactions || transactions.length === 0) return "O usuário ainda não tem transações registradas.";

    const recentTx = transactions.slice(0, 30).map((t) =>
        `${t.date} | ${t.description} | R$ ${t.amount.toFixed(2)} | ${t.category}`
    ).join('\n');

    // Safely handle summary values
    const totalIncome = summary?.income || 0;
    const totalExpense = summary?.expense || 0;
    const balance = summary?.balance || 0;
    const count = transactions.length;

    let context = `
## Dados Financeiros do Usuário

**Resumo:**
- Receita Total: R$ ${parseFloat(totalIncome).toFixed(2)}
- Despesa Total: R$ ${Math.abs(parseFloat(totalExpense)).toFixed(2)}
- Saldo: R$ ${parseFloat(balance).toFixed(2)}
- Total de Transações: ${count}
`.trim() + '\n\n';

    if (extraData.budgets && extraData.budgets.length > 0) {
        context += `**Orçamentos Definidos:**\n`;
        extraData.budgets.forEach(b => {
            context += `- ${b.category}: R$ ${parseFloat(b.limit).toFixed(2)}/mês\n`;
        });
        context += '\n';
    }

    if (extraData.goals && extraData.goals.length > 0) {
        context += `**Metas Atuais:**\n`;
        extraData.goals.forEach(g => {
            context += `- ${g.name}: R$ ${parseFloat(g.current).toFixed(2)} / R$ ${parseFloat(g.target).toFixed(2)}\n`;
        });
        context += '\n';
    }

    context += `**Transações Recentes:**\n${recentTx}\n`;

    return context;
}

// Prompts predefinidos para ações comuns
export const AI_ACTIONS = {
    analyze: {
        label: '📊 Analisar Finanças',
        prompt: 'Analise meus dados financeiros e me dê um resumo detalhado com pontos de atenção, sugestões de economia e tendências.',
    },
    categorize: {
        label: '🏷️ Categorizar Transações',
        prompt: 'Revise as transações com status "pending" e sugira a categoria correta para cada uma. Liste no formato: "Descrição → Categoria sugerida".',
    },
    savings: {
        label: '💰 Dicas de Economia',
        prompt: 'Com base nos meus gastos, identifique onde posso economizar e sugira metas realistas de economia mensal.',
    },
    forecast: {
        label: '📈 Previsão Mensal',
        prompt: 'Com base nos meus padrões de gastos e receitas, faça uma previsão para o próximo mês e identifique possíveis riscos.',
    },
    budget: {
        label: '📋 Plano de Orçamento',
        prompt: 'Crie um plano de orçamento mensal baseado nos meus dados, usando a regra 50/30/20 adaptada à minha realidade.',
    },
    tax: {
        label: '🧾 Dicas de IR',
        prompt: 'Com base nas minhas receitas e despesas, me dê dicas sobre o Imposto de Renda (deduções, categorias dedutíveis, e se devo usar modelo simplificado ou completo).',
    },
};
