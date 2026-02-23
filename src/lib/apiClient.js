// src/lib/apiClient.js
class APIError extends Error {
    constructor(message, status, retryAfter = null) {
        super(message)
        this.name = 'APIError'
        this.status = status
        this.retryAfter = retryAfter
    }
}

async function request(endpoint, options = {}) {
    const baseURL = '' // Vercel API routes are relative
    const url = `${baseURL}${endpoint}`

    const defaultOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...options
    }

    let response
    try {
        response = await fetch(url, defaultOptions)
    } catch (_err) {
        throw new APIError('Sem conexão com o servidor de API', 0)
    }

    if (response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After')) || 60
        throw new APIError(
            `Muitas requisições. Aguarde ${retryAfter}s.`,
            429,
            retryAfter
        )
    }

    if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new APIError(body.error || 'Erro desconhecido na API', response.status)
    }

    return response.json()
}

export const aiAPI = {
    chat: (messages, model = 'gpt-4o-mini') =>
        request('/api/ai-chat', {
            body: JSON.stringify({ messages, model })
        })
}

export { APIError }
