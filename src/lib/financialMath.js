// src/lib/financialMath.js — VERSÃO COMPLETA E CORRIGIDA

/**
 * Biblioteca de matemática financeira para o MetaFin
 * 
 * REGRA: Todos os cálculos internos são feitos em CENTAVOS (inteiros)
 * para evitar erros de ponto flutuante do JavaScript.
 * 
 * Exemplos de problemas evitados:
 *   0.1 + 0.2 = 0.30000000000000004 ❌
 *   toCents(0.1) + toCents(0.2) = 30 → fromCents(30) = 0.3 ✅
 */

// Converte reais → centavos com tratamento de edge cases
export function toCents(value) {
    if (value === null || value === undefined || value === '') return 0

    let num
    if (typeof value === 'string') {
        // Limpa formatação comum de moeda brasileira
        num = parseFloat(value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.'))
    } else {
        num = Number(value)
    }

    if (!isFinite(num)) return 0

    // Math.round lida corretamente com a maioria dos casos de precisão ao multiplicar por 100
    return Math.round(num * 100)
}

// Converte centavos → reais
export function fromCents(cents) {
    if (!Number.isInteger(cents)) {
        cents = Math.round(cents)
    }
    return cents / 100
}

// Formata para BRL com opções customizáveis
export function formatBRL(value, options = {}) {
    const num = typeof value === 'number' ? value : fromCents(toCents(value))

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
    }).format(num)
}

// Formata sem símbolo (para uso em campos de input)
export function formatBRLInput(value) {
    const cents = toCents(value)
    return (cents / 100).toFixed(2).replace('.', ',')
}

// Soma segura — aceita qualquer número de argumentos
export function add(...values) {
    return fromCents(values.reduce((sum, v) => sum + toCents(v), 0))
}

// Subtração segura
export function subtract(a, b) {
    return fromCents(toCents(a) - toCents(b))
}

// Multiplicação com precisão (ex: valor unitário × quantidade)
export function multiply(value, multiplier) {
    if (!isFinite(multiplier)) return 0
    return fromCents(Math.round(toCents(value) * multiplier))
}

// Percentual (ex: 15% de R$ 1.000 = R$ 150)
export function applyPercentage(value, percent) {
    if (!isFinite(percent)) return 0
    return fromCents(Math.round(toCents(value) * (percent / 100)))
}

// Soma array de objetos (transações) com base em uma chave
export function sumTransactions(transactions = [], key = 'amount') {
    return fromCents(
        transactions.reduce((sum, t) => {
            const val = toCents(t?.[key])
            return sum + (isFinite(val) ? val : 0)
        }, 0)
    )
}

// Calcula resumo: receitas, despesas e saldo
export function calculateBalance(transactions = []) {
    const incomeCents = transactions
        .filter(t => t?.type === 'income')
        .reduce((sum, t) => sum + toCents(t.amount), 0)

    const expenseCents = transactions
        .filter(t => t?.type === 'expense')
        .reduce((sum, t) => sum + toCents(t.amount), 0)

    return {
        income: fromCents(incomeCents),
        expenses: fromCents(expenseCents),
        balance: fromCents(incomeCents - expenseCents),
        // Exportado para depuração se necessário
        _cents: { income: incomeCents, expenses: expenseCents }
    }
}

// Validação de entrada monetária
export function isValidAmount(value) {
    const cents = toCents(value)
    // Limite arbitrário de 10 bilhões para evitar estouro de representação numérica segura
    return Number.isInteger(cents) && cents > 0 && cents <= 999999999999
}

// Operadores lógicos com precisão de centavos
export function isEqual(a, b) {
    return toCents(a) === toCents(b)
}

export function isGreaterThan(a, b) {
    return toCents(a) > toCents(b)
}

export function isLessThan(a, b) {
    return toCents(a) < toCents(b)
}
