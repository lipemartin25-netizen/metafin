// src/lib/safeRender.js
// Previne XSS na renderização de dados vindos do usuário ou da IA

/**
 * Escapa caracteres HTML perigosos para exibição segura em texto puro
 * Use quando exibir descrições de transações, nomes, notas, etc.
 */
export function escapeHtml(unsafe) {
 if (typeof unsafe !== 'string') return String(unsafe ?? '')

 return unsafe
 .replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;')
 .replace(/"/g, '&quot;')
 .replace(/'/g, '&#x27;')
 .replace(/\//g, '&#x2F;')
}

/**
 * Para quando você PRECISA renderizar HTML (ex: resposta formatada da IA)
 * Usa DOMPurify para garantir que o HTML seja seguro.
 * Nota: DOMPurify deve estar nas dependências do projeto.
 */
export async function sanitizeHtml(dirtyHtml) {
 try {
 // Import dinâmico para carregar apenas quando necessário
 const DOMPurify = (await import('dompurify')).default

 return DOMPurify.sanitize(dirtyHtml, {
 ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4', 'code', 'pre'],
 ALLOWED_ATTR: [], // Nenhum atributo — sem onclick, href, etc.
 FORBID_SCRIPTS: true,
 FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input']
 })
 } catch (err) {
 console.error('Falha ao sanitizar HTML:', err)
 return escapeHtml(dirtyHtml) // Fallback seguro
 }
}

/**
 * Trunca texto para exibição segura com limite de caracteres
 */
export function truncateSafe(text, maxLength = 100) {
 const escaped = escapeHtml(String(text ?? ''))
 if (escaped.length <= maxLength) return escaped
 return escaped.slice(0, maxLength) + '…'
}
