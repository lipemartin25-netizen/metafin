import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { syncItemData } from './_sync.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// UUID v4 pattern for itemId validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// FIX M1 — Rate limit com expiração inline (sem setTimeout em serverless)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;

function isRateLimited(key, maxRequests = 100) {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    // Limpar entradas expiradas (garbage collection inline)
    for (const [k, v] of rateLimitMap.entries()) {
        if (now - v.timestamp > RATE_LIMIT_WINDOW_MS) {
            rateLimitMap.delete(k);
        }
    }

    if (!entry || now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(key, { count: 1, timestamp: now });
        return false;
    }

    entry.count += 1;
    if (entry.count > maxRequests) return true;
    return false;
}

// B. Replay Attack Protection com Map time-based (Fix M1 aplicado aqui também)
const seenNoncesMap = new Map();
function isReplayAttack(nonce) {
    const now = Date.now();

    // Garbage collection para seenNonces
    for (const [k, timestamp] of seenNoncesMap.entries()) {
        if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
            seenNoncesMap.delete(k);
        }
    }

    if (seenNoncesMap.has(nonce)) return true;

    seenNoncesMap.set(nonce, now);
    return false;
}

// FIX C3 — Timing-safe comparison para evitar timing attacks
function timingSafeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) {
        // Comparar com hash para manter tempo constante mesmo com tamanhos diferentes
        const hashA = crypto.createHash('sha256').update(a).digest();
        const hashB = crypto.createHash('sha256').update(b).digest();
        return crypto.timingSafeEqual(hashA, hashB);
    }
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // A. Rate Limiting (DDoS Protection)
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    if (isRateLimited(ip, 100)) {
        return res.status(429).json({ error: 'Too Many Requests' });
    }

    // Validação Webhook Secret OBRIGATÓRIA (Assinatura HMAC simplificada)
    const webhookSecret = process.env.PLUGGY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('CRITICAL: PLUGGY_WEBHOOK_SECRET is not configured on the server.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const receivedSecret = req.headers['x-webhook-secret'] || req.query?.secret || '';
    if (!timingSafeCompare(receivedSecret, webhookSecret)) {
        console.warn('Webhook rejected: invalid secret');
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const { event, item, itemId, id: eventId } = req.body || {};

        if (!event || typeof event !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid event' });
        }

        const connItemId = itemId || item?.id;

        // B. Replay Attack Protection
        const timestamp = new Date().toISOString();
        const webhookNonce = `${timestamp.slice(0, 13)}-${eventId || connItemId || crypto.randomUUID()}`;

        if (isReplayAttack(webhookNonce)) {
            // Evita duplicidade de execução no mesmo webhook id + hora
            return res.status(409).json({ error: 'Duplicate Event / Replay Attack Prevented' });
        }

        // C. Logging Estruturado (Datadog/Sentry Ready - No PII)
        const requestHash = crypto.createHash('sha256').update(ip).digest('hex');
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            webhookId: eventId || crypto.randomUUID(),
            status: 'received',
            provider: 'pluggy',
            event_type: event,
            actor_hash: requestHash
        }));

        if ((event === 'item/created' || event === 'item/updated') && connItemId) {
            if (!UUID_RE.test(connItemId)) {
                return res.status(400).json({ error: 'Invalid itemId format' });
            }
            await syncItemData(supabase, connItemId);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            status: 'error',
            message: error.message || 'Internal server error'
        }));
        res.status(500).json({ error: 'Internal server error' });
    }
}


