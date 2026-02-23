// api/ai-chat.js
import { checkRateLimit } from './_lib/rateLimit.js'
import { sanitizeMessages, sanitizeModel, ValidationError } from './_lib/sanitize.js'

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff'
}

export default async function handler(req, res) {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

    if (req.method === 'OPTIONS') {
        return res.status(204).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' })
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
    const rateCheck = checkRateLimit(`chat:${ip}`, 15, 60000)

    if (!rateCheck.allowed) {
        res.setHeader('Retry-After', rateCheck.retryAfter)
        return res.status(429).json({
            error: 'Muitas requisições. Aguarde antes de tentar novamente.',
            retryAfter: rateCheck.retryAfter
        })
    }

    let messages, model
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
        messages = sanitizeMessages(body?.messages)
        model = sanitizeModel(body?.model)
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message })
        }
        return res.status(400).json({ error: 'Requisição inválida' })
    }

    try {
        const response = await callAIProvider(model, messages)
        return res.status(200).json(response)
    } catch (error) {
        console.error('[ai-chat] Erro ao chamar API:', {
            model,
            errorCode: error.status || error.code,
            message: error.message,
            timestamp: new Date().toISOString()
        })

        if (error.status === 401) {
            return res.status(503).json({ error: 'Serviço de IA indisponível (Erro de Auth)' })
        }
        if (error.status === 429) {
            return res.status(503).json({ error: 'Limite da IA atingido. Tente em alguns minutos.' })
        }

        return res.status(500).json({ error: 'Erro interno na IA. Tente novamente.' })
    }
}

async function callAIProvider(model, messages) {
    const isAnthropic = model.startsWith('claude')

    if (isAnthropic) {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        })

        const systemMessage = messages.find(m => m.role === 'system')?.content
        const userMessages = messages.filter(m => m.role !== 'system')

        const response = await client.messages.create({
            model,
            max_tokens: 2048,
            system: systemMessage,
            messages: userMessages
        })

        return {
            choices: [{
                message: {
                    role: 'assistant',
                    content: response.content[0].text
                }
            }],
            model: response.model
        }
    }

    const OpenAI = (await import('openai')).default
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })

    return client.chat.completions.create({
        model,
        messages,
        max_tokens: 2048,
        temperature: 0.7
    })
}
