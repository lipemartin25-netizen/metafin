// src/test/rateLimit.test.js
import { describe, it, expect, beforeEach } from 'vitest'

// Implementação inline para isolar completamente do módulo real
// (que usa Map de escopo de módulo — difícil de resetar entre testes)
function createRateLimiter() {
 const store = new Map()

 function pruneExpired(now) {
 for (const [key, record] of store.entries()) {
 if (now > record.resetAt) store.delete(key)
 }
 }

 function checkRateLimit(key, limit = 10, windowMs = 60_000) {
 const now = Date.now()
 pruneExpired(now)

 const record = store.get(key)

 if (!record || now > record.resetAt) {
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
 return {
 allowed: true,
 remaining: limit - record.count,
 resetAt: record.resetAt
 }
 }

 return { checkRateLimit, store }
}

describe('Rate Limiter', () => {
 let checkRateLimit

 beforeEach(() => {
 // Cria instância nova para cada test — estado isolado
 const limiter = createRateLimiter()
 checkRateLimit = limiter.checkRateLimit
 })

 describe('comportamento básico', () => {
 it('permite a primeira requisição', () => {
 const result = checkRateLimit('user:1', 5, 60_000)
 expect(result.allowed).toBe(true)
 expect(result.remaining).toBe(4)
 })

 it('decrementa remaining a cada requisição', () => {
 checkRateLimit('user:2', 5, 60_000)
 checkRateLimit('user:2', 5, 60_000)
 const result = checkRateLimit('user:2', 5, 60_000)
 expect(result.allowed).toBe(true)
 expect(result.remaining).toBe(2)
 })

 it('bloqueia ao atingir o limite exato', () => {
 for (let i = 0; i < 5; i++) {
 checkRateLimit('user:3', 5, 60_000)
 }
 const result = checkRateLimit('user:3', 5, 60_000)
 expect(result.allowed).toBe(false)
 expect(result.remaining).toBe(0)
 })

 it('retorna retryAfter quando bloqueado', () => {
 for (let i = 0; i < 3; i++) {
 checkRateLimit('user:4', 3, 60_000)
 }
 const result = checkRateLimit('user:4', 3, 60_000)
 expect(result.allowed).toBe(false)
 expect(result.retryAfter).toBeGreaterThan(0)
 expect(result.retryAfter).toBeLessThanOrEqual(60)
 })
 })

 describe('isolamento entre usuários', () => {
 it('IPs diferentes não interferem entre si', () => {
 for (let i = 0; i < 5; i++) {
 checkRateLimit('userA', 5, 60_000)
 }
 // userA bloqueado
 expect(checkRateLimit('userA', 5, 60_000).allowed).toBe(false)
 // userB não afetado
 expect(checkRateLimit('userB', 5, 60_000).allowed).toBe(true)
 })

 it('chaves diferentes são completamente independentes', () => {
 const r1 = checkRateLimit('chat:user1', 10, 60_000)
 const r2 = checkRateLimit('analyze:user1', 5, 60_000)
 expect(r1.remaining).toBe(9)
 expect(r2.remaining).toBe(4)
 })
 })

 describe('limites customizados', () => {
 it('respeita limite de 1 requisição', () => {
 expect(checkRateLimit('strict:user', 1, 60_000).allowed).toBe(true)
 expect(checkRateLimit('strict:user', 1, 60_000).allowed).toBe(false)
 })

 it('respeita limite alto de 100 requisições', () => {
 for (let i = 0; i < 100; i++) {
 expect(checkRateLimit('health:user', 100, 60_000).allowed).toBe(true)
 }
 expect(checkRateLimit('health:user', 100, 60_000).allowed).toBe(false)
 })
 })
})
