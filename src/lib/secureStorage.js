// src/lib/secureStorage.js
const STORAGE_PREFIX = 'mf_'

function isStorageAvailable() {
    try {
        const testKey = '__mf_test__'
        localStorage.setItem(testKey, '1')
        localStorage.removeItem(testKey)
        return true
    } catch (_e) {
        return false
    }
}

const memoryFallback = new Map()
const STORAGE_AVAILABLE = isStorageAvailable()

if (!STORAGE_AVAILABLE) {
    console.warn('[secureStorage] localStorage indisponível. Usando memória (dados não persistem).')
}

const STORAGE_SALT = 'metafin_v3_salt_';

export const secureStorage = {
    set(key, value) {
        try {
            const payload = {
                data: value,
                savedAt: Date.now(),
                version: '2',
                clientId: window.navigator.userAgent.slice(0, 50) // Fingerprinting básico para amarrar o dado ao browser
            }

            // Ofuscação melhorada: JSON -> UTF8 -> Salt -> Base64
            const jsonText = JSON.stringify(payload);
            const saltedText = STORAGE_SALT + jsonText;
            const encoded = btoa(unescape(encodeURIComponent(saltedText)));

            if (STORAGE_AVAILABLE) {
                localStorage.setItem(`${STORAGE_PREFIX}${key}`, encoded)
            } else {
                memoryFallback.set(key, payload)
            }
            return true
        } catch (err) {
            if (err.name === 'QuotaExceededError') {
                console.warn('[secureStorage] Storage cheio. Limpando dados antigos...')
                this.cleanup()
                return false
            }
            console.error('[secureStorage] Erro ao salvar:', err)
            return false
        }
    },

    get(key, defaultValue = null) {
        try {
            const raw = STORAGE_AVAILABLE
                ? localStorage.getItem(`${STORAGE_PREFIX}${key}`)
                : memoryFallback.get(key);

            if (!raw) return defaultValue

            let payload
            if (typeof raw === 'string' && STORAGE_AVAILABLE) {
                try {
                    const decoded = decodeURIComponent(escape(atob(raw)));
                    if (decoded.startsWith(STORAGE_SALT)) {
                        payload = JSON.parse(decoded.replace(STORAGE_SALT, ''));
                    } else {
                        // Fallback para dados antigos sem salt
                        payload = JSON.parse(decoded);
                    }
                } catch {
                    payload = JSON.parse(raw)
                }
            } else {
                payload = raw
            }

            if (!payload?.data || !payload?.savedAt) {
                return defaultValue
            }

            // Validação de Fingerprint (opcional, aumenta segurança mas pode falhar se browser atualizar)
            // if (payload.clientId && payload.clientId !== window.navigator.userAgent.slice(0, 50)) {
            //     return defaultValue;
            // }

            const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000
            if (Date.now() - payload.savedAt > ninetyDaysMs) {
                this.remove(key)
                return defaultValue
            }

            return payload.data
        } catch (_e) {
            return defaultValue
        }
    },

    remove(key) {
        if (STORAGE_AVAILABLE) {
            localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
        } else {
            memoryFallback.delete(key)
        }
    },

    clearAll() {
        if (STORAGE_AVAILABLE) {
            const keysToRemove = []
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key?.startsWith(STORAGE_PREFIX)) keysToRemove.push(key)
            }
            keysToRemove.forEach(k => localStorage.removeItem(k))
        } else {
            memoryFallback.clear()
        }
        console.info('[secureStorage] Todos os dados removidos')
    },

    cleanup(maxAgeDays = 90) {
        if (!STORAGE_AVAILABLE) return

        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
        const now = Date.now()

        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (!key?.startsWith(STORAGE_PREFIX)) continue

            try {
                const payload = JSON.parse(localStorage.getItem(key))
                if (now - payload.savedAt > maxAgeMs) {
                    localStorage.removeItem(key)
                }
            } catch (_e) {
                localStorage.removeItem(key)
            }
        }
    },

    getUsageKB() {
        if (!STORAGE_AVAILABLE) return 0
        let total = 0
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith(STORAGE_PREFIX)) {
                total += localStorage.getItem(key)?.length || 0
            }
        }
        return Math.round(total / 1024)
    }
}
