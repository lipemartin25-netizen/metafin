/**
 * Logger centralizado com níveis e formatação
 * MetaFin - v1.0.2
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4,
};

// Nível atual baseado no ambiente
const currentLevel = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

// Cores para o console
const COLORS = {
    DEBUG: '#8B5CF6', // violet
    INFO: '#06B6D4',  // cyan
    WARN: '#F59E0B',  // amber
    ERROR: '#EF4444', // red
};

// Buffer para logs (útil para enviar em batch)
const logBuffer = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Formata o timestamp
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Cria entrada de log
 */
function createLogEntry(level, message, data = {}) {
    return {
        level,
        message,
        data,
        timestamp: getTimestamp(),
        url: window.location.href,
        userAgent: navigator.userAgent,
    };
}

/**
 * Envia logs para serviço externo (Sentry, etc)
 */
async function sendToService(entry) {
    // Em produção, enviar para serviço de logging
    if (!import.meta.env.DEV && entry.level >= LOG_LEVELS.ERROR) {
        if (window.Sentry) {
            window.Sentry.captureMessage(entry.message, {
                level: (entry.level >= LOG_LEVELS.ERROR) ? 'error' : 'warning',
                extra: entry.data,
            });
        }
    }
}

/**
 * Log genérico
 */
function log(level, levelName, message, data = {}) {
    if (level < currentLevel) return;

    const entry = createLogEntry(level, message, data);

    // Console colorido em dev
    if (import.meta.env.DEV) {
        const color = COLORS[levelName];
        console.log(
            `%c[${levelName}] %c${getTimestamp()} %c${message}`,
            `color: ${color}; font-weight: bold`,
            'color: gray',
            'color: inherit',
            Object.keys(data).length > 0 ? data : ''
        );
    }

    // Adicionar ao buffer
    logBuffer.push(entry);
    if (logBuffer.length > MAX_BUFFER_SIZE) {
        logBuffer.shift();
    }

    // Enviar para serviço se necessário
    if (level >= LOG_LEVELS.ERROR) {
        sendToService({ ...entry, levelName });
    }

    return entry;
}

// Métodos de conveniência
const logger = {
    debug: (message, data) => log(LOG_LEVELS.DEBUG, 'DEBUG', message, data),
    info: (message, data) => log(LOG_LEVELS.INFO, 'INFO', message, data),
    warn: (message, data) => log(LOG_LEVELS.WARN, 'WARN', message, data),
    error: (message, data) => log(LOG_LEVELS.ERROR, 'ERROR', message, data),

    // Logging de performance
    time: (label) => {
        if (import.meta.env.DEV) {
            console.time(label);
        }
    },
    timeEnd: (label) => {
        if (import.meta.env.DEV) {
            console.timeEnd(label);
        }
    },

    // Obter logs do buffer
    getBuffer: () => [...logBuffer],
    clearBuffer: () => { logBuffer.length = 0; },

    // Grupos de log
    group: (label) => {
        if (import.meta.env.DEV) {
            console.group(label);
        }
    },
    groupEnd: () => {
        if (import.meta.env.DEV) {
            console.groupEnd();
        }
    },

    // Table para arrays/objetos
    table: (data) => {
        if (import.meta.env.DEV) {
            console.table(data);
        }
    },
};

export default logger;
export { LOG_LEVELS };
