// api/_lib/auth.js

/**
 * Middleware de autenticação para API Routes
 * 
 * Suporta dois modos:
 * 1. Supabase JWT (se SUPABASE_URL + SUPABASE_SERVICE_KEY configurados)
 * 2. APP_SECRET HMAC (fallback simples para tokens gerados internamente)
 */

export async function validateSession(req) {
    const authHeader = req.headers['authorization']

    if (!authHeader?.startsWith('Bearer ')) {
        return { valid: false, reason: 'Token ausente' }
    }

    const token = authHeader.split('Bearer ')[1]?.trim()
    if (!token || token.length < 10) {
        return { valid: false, reason: 'Token malformado' }
    }

    // Normalização de variáveis de ambiente (Suporte para Padrão Vercel + Padrão Local)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    // Modo Supabase (prioritário se configurado para validar JWTs do cliente)
    if (supabaseUrl && supabaseServiceKey) {
        console.log('[auth] DEBUG: Usando Supabase para validar sessão.')
        return validateSupabaseJWT(token, supabaseUrl, supabaseServiceKey)
    }

    // Modo APP_SECRET (para tokens internos assinados com HMAC)
    const secret = process.env.APP_SECRET
    if (secret) {
        console.log('[auth] DEBUG: Usando APP_SECRET para validar sessão.')
        return validateHmacToken(token, secret)
    }

    // Nenhum sistema de autenticação configurado — bloqueia sempre
    console.error('[auth] CRÍTICO: Nenhum sistema de autenticação configurado! Configure SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY ou APP_SECRET.')
    console.log('[auth] DEBUG Vars presentes:', {
        HAS_SUPABASE_URL: !!supabaseUrl,
        HAS_SUPABASE_KEY: !!supabaseServiceKey,
        HAS_APP_SECRET: !!secret
    })
    return { valid: false, reason: 'Serviço de autenticação não configurado' }
}

async function validateSupabaseJWT(token, supabaseUrl, supabaseServiceKey) {
    try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
            supabaseUrl,
            supabaseServiceKey,
            { auth: { persistSession: false } }
        )

        // Verifica o token diretamente com o Supabase
        const { data, error } = await supabase.auth.getUser(token)

        if (error || !data?.user) {
            return { valid: false, reason: 'Sessão expirada ou inválida' }
        }

        return {
            valid: true,
            userId: data.user.id,
            email: data.user.email
        }
    } catch (err) {
        console.error('[auth] Erro Supabase:', err.message)
        return { valid: false, reason: 'Erro interno de autenticação' }
    }
}

async function validateHmacToken(token, secret) {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return { valid: false, reason: 'Formato de token inválido' }

        const [userId, timestamp, sig] = parts
        const age = Date.now() - parseInt(timestamp, 10)

        // Token expira em 24 horas para tokens HMAC manuais
        if (age > 86400000) {
            return { valid: false, reason: 'Token expirado' }
        }

        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        )

        const payload = `${userId}.${timestamp}`
        const sigBuffer = Buffer.from(sig, 'base64url')
        const isValid = await crypto.subtle.verify(
            'HMAC', key, sigBuffer, encoder.encode(payload)
        )

        return isValid
            ? { valid: true, userId }
            : { valid: false, reason: 'Assinatura inválida' }
    } catch {
        return { valid: false, reason: 'Erro ao verificar token' }
    }
}

export async function generateToken(userId) {
    const secret = process.env.APP_SECRET
    if (!secret) throw new Error('APP_SECRET não configurado. Defina a variável de ambiente APP_SECRET.')

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const timestamp = Date.now().toString()
    const payload = `${userId}.${timestamp}`
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const sig = Buffer.from(signature).toString('base64url')

    return `${payload}.${sig}`
}
