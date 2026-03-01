// api/nexus/chat.js
import { checkRateLimit } from '../_lib/rateLimit.js'
import { sanitizeMessages, sanitizeModel } from '../_lib/sanitize.js'
import { validateSession } from '../_lib/auth.js'
import { getFinancialContext, formatSystemPrompt } from '../_lib/nexusEnricher.js'
import { createClient } from '@supabase/supabase-js'

const NEXUS_LIMIT = 8; // Conforme SD 1.3: 8 req/min
const WINDOW_MS = 60000;

export default async function handler(req, res) {
    // 1. Headers CORS & Streaming
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    // 2. Validação de Sessão
    const session = await validateSession(req);
    if (!session.valid) {
        return res.status(401).json({ error: `Não autorizado: ${session.reason}` });
    }

    // 3. Rate Limit (8 req/min)
    const rateLimitKey = `nexus:${session.userId}`;
    const limit = checkRateLimit(rateLimitKey, NEXUS_LIMIT, WINDOW_MS);

    if (!limit.allowed) {
        res.setHeader('Retry-After', String(limit.retryAfter));
        return res.status(429).json({
            error: `Limite de IA atingido (Nexus v3.0: 8/min). Tente em ${limit.retryAfter}s.`,
            retryAfter: limit.retryAfter
        });
    }

    // 4. Parsing e Sanitização
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
        return res.status(400).json({ error: 'Payload JSON inválido' });
    }

    let messages, model;
    try {
        messages = sanitizeMessages(body.messages);
        model = sanitizeModel(body.model || 'gemini-1.5-flash');
    } catch (err) {
        return res.status(400).json({ error: err.message || 'Dados inválidos' });
    }

    // 5. Salvar Mensagem do Usuário no Histórico (Memory)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg && lastUserMsg.role === 'user') {
        await supabase.from('nexus_chat_history').insert({
            user_id: session.userId,
            role: 'user',
            content: lastUserMsg.content,
            model: model
        });
    }

    // 6. Configuração do Stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        await streamAIProvider(model, messages, res, session.userId, supabase);
    } catch (error) {
        console.error('[nexus-chat] Erro fatal:', error.message);
        res.write(`data: ${JSON.stringify({ error: 'Falha crítica no processamento do Advisor' })}\n\n`);
        res.end();
    }
}

async function streamAIProvider(model, messages, res, userId, supabase) {
    const isAnthropic = model.startsWith('claude');
    const isGemini = model.includes('gemini');

    // Injeção de contexto financeiro real
    const rawContext = await getFinancialContext(userId);
    const systemPrompt = formatSystemPrompt(rawContext);

    // Substitui ou injeta o system prompt
    const systemIndex = messages.findIndex(m => m.role === 'system');
    if (systemIndex !== -1) {
        messages[systemIndex].content = `${systemPrompt}\n\nNota adicional: ${messages[systemIndex].content}`;
    } else {
        messages.unshift({ role: 'system', content: systemPrompt });
    }

    let fullAssistantContent = '';

    if (isGemini) {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const geminiModel = genAI.getGenerativeModel({ model });

        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const chatHistory = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        const result = await geminiModel.generateContentStream({
            contents: chatHistory,
            systemInstruction: systemMessage
        });

        for await (const chunk of result.stream) {
            const text = chunk.text();
            fullAssistantContent += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
    } else if (isAnthropic) {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const system = messages.find(m => m.role === 'system')?.content || '';
        const streamMessages = messages.filter(m => m.role !== 'system');

        await new Promise((resolve, reject) => {
            client.messages.stream({
                model,
                max_tokens: 1500,
                system,
                messages: streamMessages
            })
                .on('text', (text) => {
                    fullAssistantContent += text;
                    res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
                })
                .on('end', resolve)
                .on('error', reject);
        });
    } else {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const stream = await client.chat.completions.create({
            model,
            messages,
            stream: true,
        });

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
                fullAssistantContent += text;
                res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
            }
        }
    }

    // Salvar Resposta do Assistant no Histórico
    if (fullAssistantContent) {
        await supabase.from('nexus_chat_history').insert({
            user_id: userId,
            role: 'assistant',
            content: fullAssistantContent,
            model: model
        });
    }

    res.write('data: [DONE]\n\n');
    res.end();
}
