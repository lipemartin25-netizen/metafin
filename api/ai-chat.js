// api/ai-chat.js
import { checkRateLimit } from './_lib/rateLimit.js'
import { sanitizeMessages, sanitizeModel, ValidationError } from './_lib/sanitize.js'
import { validateSession } from './_lib/auth.js'

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://metafin-app.vercel.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
}

export default async function handler(req, res) {
    // Configurar headers CORS
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

    if (req.method === 'OPTIONS') return res.status(204).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

    // 1. Validação de Sessão (Auth)
    const session = await validateSession(req)
    if (!session.valid) {
        return res.status(401).json({ error: `Não autorizado: ${session.reason}` })
    }

    // 2. Rate Limit (por userId se autenticado, senão por IP)
    const ip = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()
    const rateLimitKey = `chat:${session.userId || ip}`
    const limit = checkRateLimit(rateLimitKey, 15, 60000)

    if (!limit.allowed) {
        res.setHeader('Retry-After', String(limit.retryAfter))
        return res.status(429).json({
            error: 'Muitas requisições. Tente novamente em breve.',
            retryAfter: limit.retryAfter
        })
    }

    // 3. Parsing e Sanitização
    let body
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    } catch {
        return res.status(400).json({ error: 'Payload JSON inválido' })
    }

    let messages, model
    try {
        messages = sanitizeMessages(body.messages)
        model = sanitizeModel(body.model)
    } catch (err) {
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: err.message })
        }
        return res.status(400).json({ error: 'Dados de entrada inválidos' })
    }

    // 4. Seleção de Provedor e Chave
    const isAnthropic = model.startsWith('claude')
    const isGemini = model.includes('gemini')

    let apiKey
    if (isAnthropic) apiKey = process.env.ANTHROPIC_API_KEY
    else if (isGemini) apiKey = process.env.GEMINI_API_KEY
    else apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        console.error(`[ai-chat] Chave ausente para modelo: ${model}`)
        return res.status(503).json({ error: 'Serviço de IA não configurado para este modelo' })
    }

    // 5. Execução do Chat
    try {
        const response = await callAIProvider(model, messages, { isAnthropic, isGemini }, apiKey)
        return res.status(200).json(response)
    } catch (error) {
        console.error('[ai-chat] Erro no provedor:', error.message)
        return res.status(error.status || 500).json({
            error: 'Falha na comunicação com o assistente de IA'
        })
    }
}

async function callAIProvider(model, messages, flags, apiKey) {
    // A. ANTHROPIC
    if (flags.isAnthropic) {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const client = new Anthropic({ apiKey })
        const systemMessage = messages.find(m => m.role === 'system')?.content || ''
        const chatMessages = messages.filter(m => m.role !== 'system')

        const resp = await client.messages.create({
            model,
            max_tokens: 1500,
            system: systemMessage,
            messages: chatMessages
        })

        return {
            content: resp.content[0].text,
            modelName: resp.model,
            provider: 'anthropic',
            usage: resp.usage
        }
    }

    // B. GEMINI (GOOGLE)
    if (flags.isGemini) {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey)
        const geminiModel = genAI.getGenerativeModel({ model })

        // Converter formato (role 'assistant' -> 'model')
        const systemMessage = messages.find(m => m.role === 'system')?.content || ''
        const contents = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))

        // Se houver system prompt, ele vai na config inicial se suportado, 
        // ou como primeira mensagem se não (Flash 1.5 suporta via systemInstruction)
        const result = await geminiModel.generateContent({
            contents,
            systemInstruction: systemMessage
        })

        return {
            content: result.response.text(),
            modelName: model,
            provider: 'google'
        }
    }

    // C. OPENAI (DEFAULT)
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey })

    const completion = await client.chat.completions.create({
        model,
        messages,
        max_tokens: 1500,
        temperature: 0.7
    })

    return {
        content: completion.choices[0].message.content,
        modelName: completion.model,
        provider: 'openai',
        usage: completion.usage
    }
}
