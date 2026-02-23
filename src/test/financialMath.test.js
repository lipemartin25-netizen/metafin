// src/test/financialMath.test.js
import { describe, it, expect } from 'vitest'
import {
    toCents, fromCents, add, subtract,
    multiply, applyPercentage, sumTransactions,
    calculateBalance, isValidAmount, isEqual,
    formatBRL
} from '../lib/financialMath'

describe('toCents', () => {
    it('converte reais para centavos corretamente', () => {
        expect(toCents(1.00)).toBe(100)
        expect(toCents(1234.56)).toBe(123456)
        expect(toCents(0.1)).toBe(10)
        expect(toCents(0.01)).toBe(1)
    })

    it('resolve o problema clássico de float', () => {
        // 0.1 + 0.2 em float = 0.30000000000000004
        expect(toCents(0.1) + toCents(0.2)).toBe(30) // ✅ correto
    })

    it('trata strings BRL', () => {
        // Nota: O toCents atual remove R$, espaço, ponto e troca vírgula por ponto
        expect(toCents('R$ 1.234,56')).toBe(123456)
        expect(toCents('1234,56')).toBe(123456)
        expect(toCents('1.234,56')).toBe(123456)
    })

    it('trata valores inválidos', () => {
        expect(toCents(null)).toBe(0)
        expect(toCents(undefined)).toBe(0)
        expect(toCents('')).toBe(0)
        expect(toCents(NaN)).toBe(0)
        expect(toCents(Infinity)).toBe(0)
    })
})

describe('add', () => {
    it('soma valores sem erro de float', () => {
        expect(add(0.1, 0.2)).toBe(0.3)
        expect(add(10.50, 5.50)).toBe(16.00)
        expect(add(1234.56, 765.44)).toBe(2000.00)
    })
})

describe('subtract', () => {
    it('subtrai corretamente', () => {
        expect(subtract(10.00, 3.33)).toBe(6.67)
        expect(subtract(100, 0.01)).toBe(99.99)
    })
})

describe('applyPercentage', () => {
    it('calcula percentual corretamente', () => {
        expect(applyPercentage(1000, 10)).toBe(100)
        expect(applyPercentage(1234.56, 15)).toBe(185.18)
    })
})

describe('calculateBalance', () => {
    const transactions = [
        { type: 'income', amount: 5000.00 },
        { type: 'income', amount: 1500.50 },
        { type: 'expense', amount: 1200.00 },
        { type: 'expense', amount: 345.67 }
    ]

    it('calcula saldo corretamente', () => {
        const result = calculateBalance(transactions)
        expect(result.income).toBe(6500.50)
        expect(result.expenses).toBe(1545.67)
        expect(result.balance).toBe(4954.83)
    })

    it('retorna zeros para array vazio', () => {
        const result = calculateBalance([])
        expect(result.income).toBe(0)
        expect(result.expenses).toBe(0)
        expect(result.balance).toBe(0)
    })
})

describe('formatBRL', () => {
    it('formata em reais corretamente', () => {
        // Intl.NumberFormat pode usar nbsp (\u00a0) ou espaço normal dependendo do ambiente
        // O teste deve ser flexível ou usar o caractere correto
        const formatted = formatBRL(1234.56)
        expect(formatted).toMatch(/R\$\s?1\.234,56/)
    })
})

describe('isValidAmount', () => {
    it('valida valores corretamente', () => {
        expect(isValidAmount(1)).toBe(true)
        expect(isValidAmount(0.01)).toBe(true)
        expect(isValidAmount(0)).toBe(false)
        expect(isValidAmount(-1)).toBe(false)
        // O limite no código é 999.999.999.999 centavos (aprox 10 bi)
        expect(isValidAmount(10_000_000_001)).toBe(false)
    })
})
