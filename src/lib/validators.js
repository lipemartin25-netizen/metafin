// src/lib/validators.js
export const validators = {
    currency: (value) => {
        const rawValue = String(value).replace(/[^\d,.-]/g, '').replace(',', '.')
        const num = parseFloat(rawValue)
        if (isNaN(num)) return { valid: false, error: 'Valor numérico inválido' }
        if (num <= 0) return { valid: false, error: 'O valor deve ser maior que zero' }
        if (num > 999999999) return { valid: false, error: 'Valor excede o limite permitido' }
        return { valid: true, value: num }
    },

    date: (value) => {
        const date = new Date(value)
        if (isNaN(date.getTime())) return { valid: false, error: 'Formato de data inválido' }

        const now = new Date()
        const minDate = new Date(now.getFullYear() - 10, 0, 1)
        const maxDate = new Date(now.getFullYear() + 2, 11, 31)

        if (date < minDate || date > maxDate) {
            return { valid: false, error: 'Data fora do período permitido (±10 anos)' }
        }
        return { valid: true, value: date }
    },

    description: (value) => {
        const trimmed = String(value || '').trim()
        if (trimmed.length < 2) return { valid: false, error: 'Descrição muito curta (mín. 2 caracteres)' }
        if (trimmed.length > 250) return { valid: false, error: 'Descrição muito longa (máx. 250 caracteres)' }
        return { valid: true, value: trimmed }
    },

    email: (value) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!re.test(String(value).toLowerCase())) return { valid: false, error: 'E-mail inválido' }
        return { valid: true, value: value.toLowerCase() }
    }
}
