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

// ========== API ENDPOINTS ==========
const ENDPOINTS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    google: 'https://generativelanguage.googleapis.com/v1beta/models',
    anthropic: 'https://api.anthropic.com/v1/messages',
    deepseek: 'https://api.deepseek.com/chat/completions', // Corrigido endpoint v1 deepseek
    xai: 'https://api.x.ai/v1/chat/completions',
    alibaba: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
};

// ========== API KEYS (dev only — em prod usar Edge Functions) ==========
function getApiKey(provider) {
    const keys = {
        openai: import.meta.env.VITE_OPENAI_API_KEY,
        google: import.meta.env.VITE_GEMINI_API_KEY,
        anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY,
        deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY,
        xai: import.meta.env.VITE_GROK_API_KEY,
        alibaba: import.meta.env.VITE_QWEN_API_KEY,
    };
    return keys[provider] || '';
}

// ========== PROVIDER-SPECIFIC CALLERS ==========

async function callOpenAICompatible(endpoint, apiKey, model, messages, options = {}) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048,
            stream: false,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage || {},
        model: data.model || model,
    };
}

async function callGemini(apiKey, model, messages, options = {}) {
    // Ajuste para Gemini Flash 1.5 ou 2.0
    const modelId = model.startsWith('gemini') ? model : 'gemini-1.5-flash';
    const url = `${ENDPOINTS.google}/${modelId}:generateContent?key=${apiKey}`;

    // Converter formato OpenAI -> Gemini
    const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

    const systemInstruction = messages.find((m) => m.role === 'system');

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents,
            systemInstruction: systemInstruction
                ? { parts: [{ text: systemInstruction.content }] }
                : undefined,
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.maxTokens ?? 2048,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Gemini Error: ${response.status}`);
    }

    const data = await response.json();
    return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        usage: data.usageMetadata || {},
        model,
    };
}

async function callAnthropic(apiKey, model, messages, options = {}) {
    const systemMsg = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch(ENDPOINTS.anthropic, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model,
            max_tokens: options.maxTokens ?? 2048,
            system: systemMsg?.content || SYSTEM_PROMPT,
            messages: chatMessages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Claude Error: ${response.status}`);
    }

    const data = await response.json();
    return {
        content: data.content?.[0]?.text || '',
        usage: data.usage || {},
        model,
    };
}

// ========== UNIVERSAL CALL ==========
/**
 * Chamar qualquer modelo de IA configurado.
 *
 * @param {string} modelId - ID do modelo (ex: 'gpt-5-nano')
 * @param {Array} messages - [{ role: 'user'|'assistant'|'system', content: string }]
 * @param {Object} options - { temperature?, maxTokens? }
 */
export async function callAI(modelId, messages, options = {}) {
    const modelConfig = AI_MODELS[modelId];
    if (!modelConfig) throw new Error(`Modelo "${modelId}" não encontrado`);

    const apiKey = getApiKey(modelConfig.provider);
    // Em demo mode ou sem key, podemos retornar mock se falhar autenticação
    // Mas vamos deixar erro explícito para configurar
    if (!apiKey) {
        throw new Error(
            `API key não configurada para ${modelConfig.provider}. ` +
            `Configure VITE_${modelConfig.provider.toUpperCase()}_API_KEY no .env.local`
        );
    }

    // Adicionar system prompt se não existir
    const fullMessages = messages[0]?.role === 'system'
        ? messages
        : [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    const startTime = Date.now();

    let result;

    switch (modelConfig.provider) {
        case 'openai':
            result = await callOpenAICompatible(
                ENDPOINTS.openai, apiKey, modelConfig.model, fullMessages, options
            );
            break;

        case 'google':
            result = await callGemini(apiKey, modelConfig.model, fullMessages, options);
            break;

        case 'anthropic':
            result = await callAnthropic(apiKey, modelConfig.model, fullMessages, options);
            break;

        case 'deepseek':
            result = await callOpenAICompatible(
                ENDPOINTS.deepseek, apiKey, modelConfig.model, fullMessages, options
            );
            break;

        case 'xai':
            result = await callOpenAICompatible(
                ENDPOINTS.xai, apiKey, modelConfig.model, fullMessages, options
            );
            break;

        case 'alibaba':
            result = await callOpenAICompatible(
                ENDPOINTS.alibaba, apiKey, modelConfig.model, fullMessages, options
            );
            break;

        default:
            throw new Error(`Provider "${modelConfig.provider}" não suportado`);
    }

    return {
        ...result,
        modelId,
        modelName: modelConfig.name,
        provider: modelConfig.provider,
        latency: Date.now() - startTime,
    };
}

// ========== FINANCIAL PROMPTS ==========
export function buildFinancialContext(transactions, summary) {
    if (!transactions || transactions.length === 0) return "O usuário ainda não tem transações registradas.";

    const recentTx = transactions.slice(0, 30).map((t) =>
        `${t.date} | ${t.description} | R$ ${t.amount.toFixed(2)} | ${t.category}`
    ).join('\n');

    // Safely handle summary values
    const totalIncome = summary?.income || 0;
    const totalExpense = summary?.expense || 0;
    const balance = summary?.balance || 0;
    const count = transactions.length;

    return `
## Dados Financeiros do Usuário

**Resumo:**
- Receita Total: R$ ${totalIncome.toFixed(2)}
- Despesa Total: R$ ${Math.abs(totalExpense).toFixed(2)}
- Saldo: R$ ${balance.toFixed(2)}
- Total de Transações: ${count}

**Transações Recentes:**
${recentTx}
`.trim();
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
