// api/_lib/rateLimit.js
const store = new Map()

export function checkRateLimit(key, limit = 10, windowMs = 60000) {
    const now = Date.now()
    const record = store.get(key) || { count: 0, resetAt: now + windowMs }

    if (now > record.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
    }

    if (record.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: record.resetAt,
            retryAfter: Math.ceil((record.resetAt - now) / 1000)
        }
    }

    record.count++
    store.set(key, record)
    return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt }
}

setInterval(() => {
    const now = Date.now()
    for (const [key, record] of store.entries()) {
        if (now > record.resetAt) store.delete(key)
    }
}, 5 * 60000)
