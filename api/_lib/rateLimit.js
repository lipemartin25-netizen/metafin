// api/_lib/rateLimit.js
// Versão correta para ambiente SERVERLESS (sem setInterval, sem estado global)

/**
 * Rate limiting stateless usando headers de timestamp
 * 
 * Em serverless, cada função pode rodar em instâncias diferentes.
 * A solução correta sem Redis é usar um Map com TTL lazy-evaluated.
 * O cleanup acontece na própria leitura, não em intervalos.
 */

// Escopo de módulo — compartilhado dentro da mesma instância (quente)
const store = new Map()

function pruneExpired(now) {
    // Cleanup lazy — só roda quando a função é chamada, não em background
    for (const [key, record] of store.entries()) {
        if (now > record.resetAt) {
            store.delete(key)
        }
    }
    // Limita tamanho máximo do Map para evitar crescimento ilimitado
    if (store.size > 10000) {
        // Remove os mais antigos (resetAt menor)
        const sorted = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)
        sorted.slice(0, 1000).forEach(([k]) => store.delete(k))
    }
}

/**
 * @param {string} key - identificador (ex: "chat:192.168.1.1")
 * @param {number} limit - máximo de requests por janela
 * @param {number} windowMs - janela em milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetAt: number, retryAfter?: number }}
 */
export function checkRateLimit(key, limit = 10, windowMs = 60000) {
    const now = Date.now()

    // Cleanup lazy — sem setInterval para evitar memory leak em serverless
    pruneExpired(now)

    const record = store.get(key)

    // Sem registro ou janela expirada — permite e inicia nova janela
    if (!record || now > record.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
    }

    // Dentro da janela e limite atingido
    if (record.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: record.resetAt,
            retryAfter: Math.ceil((record.resetAt - now) / 1000)
        }
    }

    // Dentro da janela e ainda tem espaço
    record.count++
    store.set(key, record)
    return {
        allowed: true,
        remaining: limit - record.count,
        resetAt: record.resetAt
    }
}

/**
 * Rate limit mais restrito para endpoints sensíveis
 */
export function checkStrictRateLimit(key) {
    return checkRateLimit(key, 5, 60000) // 5 req/min
}

/**
 * Rate limit relaxado para health check / status
 */
export function checkHealthRateLimit(key) {
    return checkRateLimit(key, 60, 60000) // 60 req/min
}
