// src/lib/apiClient.js — versão final consolidada

export class APIError extends Error {
 constructor(message, status, retryAfter = null) {
 super(message)
 this.name = 'APIError'
 this.status = status
 this.retryAfter = retryAfter
 }
}

/**
 * Estratégia de obtenção de token — ordem de prioridade
 */
function getAuthToken() {
 // 1. Supabase v2 — Tenta extrair da chave exata no localStorage
 try {
 const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
 const projectRef = supabaseUrl?.match(/https:\/\/([a-z0-9]+)\.supabase/)?.[1]

 if (projectRef) {
 const key = `sb-${projectRef}-auth-token`
 const raw = localStorage.getItem(key)
 if (raw) {
 const parsed = JSON.parse(raw)
 return parsed?.access_token || null
 }
 }
 } catch (_err) { /* fallback */ }

 // 2. Token HMAC customizado (Guardado pelo setAuthToken)
 try {
 return localStorage.getItem('mf_auth_token') || null
 } catch (_err) {
 return null
 }
}

/**
 * Armazena token customizado após login com sucesso
 */
export function setAuthToken(token) {
 try {
 localStorage.setItem('mf_auth_token', token)
 } catch (err) {
 console.warn('[apiClient] Não foi possível salvar token:', err.message)
 }
}

/**
 * Remove token durante logout
 */
export function clearAuthToken() {
 try {
 localStorage.removeItem('mf_auth_token')
 } catch (_err) { /* ignora */ }
}

async function request(endpoint, options = {}) {
 const baseURL = import.meta.env.VITE_API_BASE_URL || ''
 const token = getAuthToken()

 const headers = {
 'Content-Type': 'application/json',
 ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
 ...(options.headers || {})
 }

 let response
 try {
 response = await fetch(`${baseURL}${endpoint}`, {
 method: 'POST',
 ...options,
 headers,
 credentials: 'same-origin'
 })
 } catch (_err) {
 throw new APIError(
 'Sem conexão com o servidor. Verifique sua rede.',
 0
 )
 }

 // Notifica a aplicação sobre expiração de sessão
 if (response.status === 401) {
 clearAuthToken()
 window.dispatchEvent(new CustomEvent('metafin:session-expired'))
 throw new APIError('Sessão expirada. Por favor, faça login novamente.', 401)
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
 throw new APIError(body.error || `Erro inesperado (${response.status})`, response.status)
 }

 return response.json()
}

export const aiAPI = {
 chat: (messages, model = 'gpt-4o-mini') =>
 request('/api/ai-chat', {
 body: JSON.stringify({ messages, model })
 }),

 analyze: (financialData) =>
 request('/api/ai-analyze', {
 body: JSON.stringify({ financialData })
 }),

 // Emite token via API interna (mode sem Supabase ou proxy)
 getToken: (userId, credential) =>
 request('/api/auth-token', {
 body: JSON.stringify({ userId, credential })
 })
}
