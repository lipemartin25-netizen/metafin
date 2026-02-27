// api/_lib/sanitize.js
const MAX_MESSAGE_LENGTH = 4000
const MAX_MESSAGES_COUNT = 30
const ALLOWED_ROLES = ['user', 'assistant', 'system']

export class ValidationError extends Error {
    constructor(message) {
        super(message)
        this.name = 'ValidationError'
        this.statusCode = 400
    }
}

export function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) {
        throw new ValidationError('messages deve ser um array')
    }

    if (messages.length > MAX_MESSAGES_COUNT) {
        throw new ValidationError(`Máximo de ${MAX_MESSAGES_COUNT} mensagens permitidas`)
    }

    return messages.map((msg, index) => {
        if (!msg || typeof msg !== 'object') {
            throw new ValidationError(`Mensagem ${index} inválida`)
        }

        if (!ALLOWED_ROLES.includes(msg.role)) {
            throw new ValidationError(`Role inválido na mensagem ${index}: ${msg.role}`)
        }

        if (typeof msg.content !== 'string') {
            throw new ValidationError(`Conteúdo da mensagem ${index} deve ser string`)
        }

        return {
            role: msg.role,
            content: msg.content
                .slice(0, MAX_MESSAGE_LENGTH)
                .replace(/[\p{Cc}]/gu, '')
                .trim()
        }
    })
}

export function sanitizeModel(model) {
    const ALLOWED_MODELS = [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'claude-3-5-sonnet-20241022',
        'claude-3-haiku-20240307',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite'
    ]

    if (!model || !ALLOWED_MODELS.includes(model)) {
        return 'gpt-4o-mini'
    }

    return model
}
