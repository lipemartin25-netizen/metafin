import { useState, useEffect } from 'react';

/**
 * Sistema de Feature Flags
 * Permite habilitar/desabilitar funcionalidades sem deploy
 */

// Flags disponíveis
export const FLAGS = {
 // Funcionalidades
 AI_CHAT: 'ai_chat',
 INVESTMENTS: 'investments',
 OPEN_FINANCE: 'open_finance',
 EXPORT_PDF: 'export_pdf',
 DARK_MODE: 'dark_mode',

 // Experimentos
 NEW_DASHBOARD: 'new_dashboard',
 BETA_FEATURES: 'beta_features',

 // Debug
 DEBUG_MODE: 'debug_mode',
 ANALYTICS_VERBOSE: 'analytics_verbose',
};

// Configuração padrão das flags
const DEFAULT_FLAGS = {
 [FLAGS.AI_CHAT]: true,
 [FLAGS.INVESTMENTS]: true,
 [FLAGS.OPEN_FINANCE]: true,
 [FLAGS.EXPORT_PDF]: true,
 [FLAGS.DARK_MODE]: true,
 [FLAGS.NEW_DASHBOARD]: false,
 [FLAGS.BETA_FEATURES]: false,
 [FLAGS.DEBUG_MODE]: import.meta.env.DEV,
 [FLAGS.ANALYTICS_VERBOSE]: import.meta.env.DEV,
};

// Estado das flags (pode ser carregado do servidor)
let flagsState = { ...DEFAULT_FLAGS };

/**
 * Inicializa flags do servidor ou localStorage
 */
export async function initFeatureFlags(userId = null) {
 // Carregar flags do localStorage (overrides locais)
 const localFlags = localStorage.getItem('sf_feature_flags');
 if (localFlags) {
 try {
 const parsed = JSON.parse(localFlags);
 flagsState = { ...flagsState, ...parsed };
 } catch (e) {
 console.warn('Erro ao parsear feature flags locais:', e);
 }
 }

 return flagsState;
}

/**
 * Verifica se uma flag está habilitada
 */
export function isEnabled(flag) {
 return flagsState[flag] ?? false;
}

/**
 * Habilita uma flag (apenas dev/admin)
 */
export function enableFlag(flag) {
 if (import.meta.env.DEV || flagsState[FLAGS.DEBUG_MODE]) {
 flagsState[flag] = true;
 persistFlags();
 window.dispatchEvent(new Event('sf_flags_updated'));
 }
}

/**
 * Desabilita uma flag (apenas dev/admin)
 */
export function disableFlag(flag) {
 if (import.meta.env.DEV || flagsState[FLAGS.DEBUG_MODE]) {
 flagsState[flag] = false;
 persistFlags();
 window.dispatchEvent(new Event('sf_flags_updated'));
 }
}

/**
 * Toggle uma flag
 */
export function toggleFlag(flag) {
 if (import.meta.env.DEV || flagsState[FLAGS.DEBUG_MODE]) {
 flagsState[flag] = !flagsState[flag];
 persistFlags();
 window.dispatchEvent(new Event('sf_flags_updated'));
 }
}

/**
 * Retorna todas as flags
 */
export function getAllFlags() {
 return { ...flagsState };
}

/**
 * Persiste flags no localStorage
 */
function persistFlags() {
 localStorage.setItem('sf_feature_flags', JSON.stringify(flagsState));
}

/**
 * Hook para usar feature flags no React
 */
export function useFeatureFlag(flag) {
 const [enabled, setEnabled] = useState(isEnabled(flag));

 useEffect(() => {
 const handleUpdate = () => {
 setEnabled(isEnabled(flag));
 };

 window.addEventListener('sf_flags_updated', handleUpdate);
 window.addEventListener('storage', handleUpdate);
 return () => {
 window.removeEventListener('sf_flags_updated', handleUpdate);
 window.removeEventListener('storage', handleUpdate);
 };
 }, [flag]);

 return enabled;
}

export default {
 FLAGS,
 initFeatureFlags,
 isEnabled,
 enableFlag,
 disableFlag,
 toggleFlag,
 getAllFlags,
 useFeatureFlag,
};
