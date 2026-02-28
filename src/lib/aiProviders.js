/**
 * ⚠️ ARQUIVO DEPRECADO
 * As chamadas de IA foram migradas para API Routes server-side.
 * Use src/lib/apiClient.js para todas as integrações com IA.
 * 
 * Este arquivo existe apenas para compatibilidade transitória.
 * TODO: Remover após confirmar que nenhum componente importa daqui.
 */

import { aiAPI } from './apiClient.js'

export { aiAPI as default } from './apiClient.js'

// Re-exporta para compatibilidade com imports antigos
export const callAI = (modelId, messages, _options = {}) => {
 console.warn('[aiProviders] Deprecado. Use apiClient.js');
 return aiAPI.chat(messages, modelId);
};

export const analyzeWithAI = (data) => {
 console.warn('[aiProviders] Deprecado. Use apiClient.js');
 return aiAPI.chat([{ role: 'user', content: `Analise: ${JSON.stringify(data)}` }]);
};

// Dados auxiliares mantidos para não quebrar a UI que depende de AI_MODELS ou AI_ACTIONS
export const AI_MODELS = {
 'gpt-4o-mini': { name: 'GPT-4o Mini', provider: 'openai' },
 'gemini-flash': { name: 'Gemini 1.5 Flash', provider: 'google' }
};

export const AI_ACTIONS = {
 analyze: { label: '📊 Analisar Finanças' },
 savings: { label: '💰 Dicas de Economia' }
};
