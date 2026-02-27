/**
 * Formatadores centralizados para o app
 * Evita duplicação e garante consistência
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

const compactFormatter = new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
});

/**
 * Formata valor para moeda brasileira
 * @param {number} value - Valor a formatar
 * @returns {string} Valor formatado (ex: R$ 1.234,56)
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return 'R$ 0,00';
    }
    return currencyFormatter.format(value);
};

/**
 * Formata data para padrão brasileiro
 * @param {string|Date} date - Data a formatar
 * @returns {string} Data formatada (ex: 26/02/2026)
 */
export const formatDate = (date) => {
    if (!date) return '-';
    try {
        return dateFormatter.format(new Date(date));
    } catch {
        return '-';
    }
};

/**
 * Formata data e hora
 * @param {string|Date} date - Data a formatar
 * @returns {string} Data e hora formatadas
 */
export const formatDateTime = (date) => {
    if (!date) return '-';
    try {
        return dateTimeFormatter.format(new Date(date));
    } catch {
        return '-';
    }
};

/**
 * Formata porcentagem
 * @param {number} value - Valor (0-100)
 * @returns {string} Porcentagem formatada
 */
export const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0,0%';
    }
    return percentFormatter.format(value / 100);
};

/**
 * Formata número grande de forma compacta
 * @param {number} value - Valor a formatar
 * @returns {string} Valor compactado (ex: 1,2 mi)
 */
export const formatCompact = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }
    return compactFormatter.format(value);
};

/**
 * Formata valor relativo (positivo/negativo com sinal)
 * @param {number} value - Valor a formatar
 * @returns {string} Valor com sinal
 */
export const formatSignedCurrency = (value) => {
    const formatted = formatCurrency(Math.abs(value));
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
};

export default {
    formatCurrency,
    formatDate,
    formatDateTime,
    formatPercent,
    formatCompact,
    formatSignedCurrency,
};
