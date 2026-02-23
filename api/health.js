// api/health.js
import { checkHealthRateLimit } from './_lib/rateLimit.js'

export default function handler(req, res) {
    // Rate limit até no health check para evitar enumeração/DoS
    const ip = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()
    const limit = checkHealthRateLimit(`health:${ip}`)

    if (!limit.allowed) {
        return res.status(429).json({ error: 'Too many requests' })
    }

    // Informação mínima — sem revelar quais chaves de serviço estão ativas
    res.status(200).json({
        status: 'ok',
        ts: new Date().toISOString()
    })
}
