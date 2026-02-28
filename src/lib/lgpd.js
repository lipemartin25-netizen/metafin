// src/lib/lgpd.js
/**
 * Utilitários para conformidade com a LGPD (Lei Geral de Proteção de Dados)
 */

/**
 * Anonimiza dados sensíveis antes de enviar para processamento externo (IA)
 * Útil para cumprir o Art. 12 da LGPD (dados anonimizados não são dados pessoais)
 */
export function anonymizeForAI(data) {
 if (!data || typeof data !== 'object') return data

 const sensitiveFields = [
 'name', 'nome', 'full_name', 'email', 'cpf', 'cnpj',
 'phone', 'telefone', 'address', 'endereco', 'birth_date',
 'bank_account', 'agencia', 'conta', 'pix_key'
 ]

 const process = (obj) => {
 if (!obj || typeof obj !== 'object') return obj

 // Suporte para arrays
 if (Array.isArray(obj)) {
 return obj.map(item => process(item))
 }

 const out = {}
 for (const [k, v] of Object.entries(obj)) {
 const keyLower = k.toLowerCase()

 if (sensitiveFields.some(field => keyLower.includes(field))) {
 out[k] = maskValue(k, v)
 } else if (typeof v === 'object' && v !== null) {
 out[k] = process(v)
 } else {
 out[k] = v
 }
 }
 return out
 }

 return process(data)
}

function maskValue(field, value) {
 if (!value) return value
 const s = String(value)

 if (field.includes('email')) {
 const [user, domain] = s.split('@')
 if (!domain) return '***'
 return `${user[0]}***@${domain}`
 }

 if (field.includes('cpf')) return `***.***.${s.slice(-3)}`

 if (field.includes('phone') || field.includes('telefone')) {
 return `(**) ****-${s.slice(-4)}`
 }

 if (s.length <= 4) return '****'
 return `${s[0]}***${s.slice(-1)}`
}

/**
 * Exporta todos os dados mf_ do usuário para JSON (Portabilidade - Art. 18, IV)
 */
export function exportUserData() {
 const data = {}
 for (let i = 0; i < localStorage.length; i++) {
 const key = localStorage.key(i)
 if (key?.startsWith('mf_')) {
 try {
 data[key] = JSON.parse(localStorage.getItem(key))
 } catch {
 data[key] = localStorage.getItem(key)
 }
 }
 }

 const blob = new Blob(
 [JSON.stringify({
 exportedAt: new Date().toISOString(),
 appName: 'MetaFin',
 data
 }, null, 2)],
 { type: 'application/json' }
 )

 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `metafin-dados-${new Date().toISOString().split('T')[0]}.json`
 document.body.appendChild(a)
 a.click()
 document.body.removeChild(a)
 URL.revokeObjectURL(url)
}

/**
 * Remove todos os dados locais do usuário (Direito ao Esquecimento - Art. 18, VI)
 */
export function deleteAllUserData() {
 const keysToRemove = []
 for (let i = 0; i < localStorage.length; i++) {
 const key = localStorage.key(i)
 if (key?.startsWith('mf_')) {
 keysToRemove.push(key)
 }
 }

 keysToRemove.forEach(k => localStorage.removeItem(k))
 sessionStorage.clear()

 return keysToRemove.length
}

/**
 * Remove dados que excederam o tempo de retenção (Art. 15)
 */
export function enforceRetentionPolicy(days = 365) {
 const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
 let removedCount = 0

 for (let i = localStorage.length - 1; i >= 0; i--) {
 const key = localStorage.key(i)
 if (!key?.startsWith('mf_')) continue

 try {
 const record = JSON.parse(localStorage.getItem(key))
 // Espera um campo 'savedAt' ou similar no objeto do secureStorage
 if (record?.savedAt && record.savedAt < cutoff) {
 localStorage.removeItem(key)
 removedCount++
 }
 } catch {
 // Se não for JSON válido mas tiver nosso prefixo, pode estar corrompido
 // (Não removemos se for só uma string simples para evitar falsos positivos)
 }
 }

 return removedCount
}
