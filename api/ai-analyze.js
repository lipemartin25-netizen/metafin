// api/ai-analyze.js
import { checkRateLimit } from './_lib/rateLimit.js'
import { validateSession } from './_lib/auth.js'

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://metafin-app.vercel.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
}

const ANALYSIS_SYSTEM_PROMPT = `Você é um analista financeiro especializado do MetaFin.
Analise os dados financeiros fornecidos e retorne insights estratégicos.
Seja preciso, objetivo e baseie-se APENAS nos dados reais.
Responda SEMPRE em português brasileiro usando markdown para estrutura.`

export default async function handler(req, res) {
    // Aplicar headers CORS
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

    if (req.method === 'OPTIONS') return res.status(204).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

    // 1. Autenticação
    const session = await validateSession(req)
    if (!session.valid) {
        return res.status(401).json({ error: `Não autorizado: ${session.reason}` })
    }

    // 2. Rate Limit
    const ip = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()
    const rateLimitKey = `analyze:${session.userId || ip}`
    const limit = checkRateLimit(rateLimitKey, 5, 60000)

    if (!limit.allowed) {
        res.setHeader('Retry-After', String(limit.retryAfter))
        return res.status(429).json({ error: 'Limite de análises atingido. Aguarde 1 minuto.' })
    }

    let body
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
        if (!body?.financialData) throw new Error('financialData é obrigatório')
    } catch (_err) {
        return res.status(400).json({ error: 'Payload inválido ou incompleto' })
    }

    const { financialData } = body
    const sanitized = sanitizeFinancialData(financialData)

    if (!sanitized.valid) {
        return res.status(400).json({ error: sanitized.error })
    }

    if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ error: 'Serviço de análise temporariamente indisponível' })
    }

    try {
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `Analise estes dados financeiros e forneça o diagnóstico:\n\n${JSON.stringify(sanitized.data, null, 2)}`
                }
            ],
            max_tokens: 1000,
            temperature: 0.4
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('Falha ao gerar análise')

        return res.status(200).json({
            analysis: content,
            model: response.model,
            usage: response.usage
        })

    } catch (error) {
        console.error('[ai-analyze] Crítico:', error.message)
        return res.status(500).json({ error: 'Erro interno ao processar diagnóstico' })
    }
}

function sanitizeFinancialData(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Dados em formato inválido' }
    }

    const size = JSON.stringify(data).length
    if (size > 30000) {
        return { valid: false, error: 'Volume de dados excede o limite de análise rápida' }
    }

    // Filtragem RECURSIVA de PII em qualquer nível de profundidade
    const blacklist = new Set(['password', 'token', 'apikey', 'api_key', 'secret', 'auth',
        'email', 'phone', 'cpf', 'cnpj', 'rg', 'address', 'endereco', 'telefone',
        'access_token', 'refresh_token', 'session', 'cookie', 'authorization'])

    function deepSanitize(obj, depth = 0) {
        if (depth > 10) return '[MAX_DEPTH]'
        if (obj === null || obj === undefined) return obj
        if (typeof obj !== 'object') return obj
        if (Array.isArray(obj)) return obj.map(item => deepSanitize(item, depth + 1))

        const clean = {}
        for (const [key, value] of Object.entries(obj)) {
            if (blacklist.has(key.toLowerCase())) continue
            clean[key] = deepSanitize(value, depth + 1)
        }
        return clean
    }

    return { valid: true, data: deepSanitize(data) }
}
