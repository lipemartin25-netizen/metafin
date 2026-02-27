import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { syncItemData } from './_sync.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// UUID v4 pattern for itemId validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Cache global em memória para Rate Limiting e Replay Protection
const rateLimit = new Map();
const seenNonces = new Set();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // A. Rate Limiting (DDoS Protection)
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const currentRequests = rateLimit.get(ip) || 0;
    if (currentRequests > 100) {
        return res.status(429).json({ error: 'Too Many Requests' });
    }
    rateLimit.set(ip, currentRequests + 1);

    // Libera a requisição do rate limit global após 1 minuto (Edge/Serverless lifetime support)
    setTimeout(() => { rateLimit.set(ip, Math.max(0, rateLimit.get(ip) - 1)); }, 60000);

    // Validação Webhook Secret OBRIGATÓRIA (Assinatura HMAC simplificada)
    const webhookSecret = process.env.PLUGGY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('CRITICAL: PLUGGY_WEBHOOK_SECRET is not configured on the server.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const receivedSecret = req.headers['x-webhook-secret'] || req.query?.secret || '';
    const secretsMatch = receivedSecret.length === webhookSecret.length &&
        crypto.timingSafeEqual(Buffer.from(receivedSecret), Buffer.from(webhookSecret));
    if (!secretsMatch) {
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

        if (seenNonces.has(webhookNonce)) {
            // Evita duplicidade de execução no mesmo webhook id + hora
            return res.status(409).json({ error: 'Duplicate Event / Replay Attack Prevented' });
        }
        seenNonces.add(webhookNonce);
        setTimeout(() => seenNonces.delete(webhookNonce), 60000);

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


