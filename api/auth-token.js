// api/auth-token.js
import { generateToken } from './_lib/auth.js'
import { checkRateLimit } from './_lib/rateLimit.js'

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://metafin-app.vercel.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
}

export default async function handler(req, res) {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

    if (req.method === 'OPTIONS') return res.status(204).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

    const ip = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()

    // Rate limit rigoroso — 5 tentativas de login por hora por IP
    const limit = checkRateLimit(`token:${ip}`, 5, 3600000)
    if (!limit.allowed) {
        res.setHeader('Retry-After', String(limit.retryAfter))
        return res.status(429).json({ error: 'Muitas tentativas. Aguarde antes de tentar novamente.' })
    }

    let body
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    } catch {
        return res.status(400).json({ error: 'Requisição inválida' })
    }

    const { userId, credential } = body || {}

    // Validação básica dos campos
    if (!userId || typeof userId !== 'string' || userId.length < 3) {
        return res.status(400).json({ error: 'userId inválido' })
    }

    // Validação de credencial (Supabase ou Fallback)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        const isValid = await validateWithSupabase(credential)
        if (!isValid) {
            return res.status(401).json({ error: 'Sessão inválida ou expirada no provedor' })
        }
    } else if (!process.env.APP_SECRET && process.env.NODE_ENV !== 'development') {
        return res.status(503).json({ error: 'Sistema de autenticação não configurado no servidor' })
    }

    try {
        const token = await generateToken(userId)
        return res.status(200).json({
            token,
            expiresIn: 86400 // 24 horas
        })
    } catch (err) {
        console.error('[auth-token] Erro ao gerar token:', err.message)
        return res.status(500).json({ error: 'Erro interno ao emitir token de acesso' })
    }
}

async function validateWithSupabase(accessToken) {
    if (!accessToken) return false
    try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { auth: { persistSession: false } }
        )
        const { data, error } = await supabase.auth.getUser(accessToken)
        return !error && !!data?.user
    } catch {
        return false
    }
}
