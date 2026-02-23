// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'

/**
 * Wrapper de rota que exige autenticação.
 * Redireciona para /login mantendo a URL original para redirect pós-login.
 */
function getAuthToken() {
    try {
        // 1. Verifica token customizado
        const customToken = localStorage.getItem('mf_auth_token')
        if (customToken) return customToken

        // 2. Verifica sessão Supabase
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        if (supabaseUrl) {
            const projectRef = supabaseUrl.match(/\/\/([^.]+)\./)?.[1]
            if (projectRef) {
                const key = `sb-${projectRef}-auth-token`
                const raw = localStorage.getItem(key)
                if (raw) {
                    const session = JSON.parse(raw)
                    // Verifica se não expirou
                    if (session?.expires_at && session.expires_at * 1000 > Date.now()) {
                        return session.access_token
                    }
                }
            }
        }

        return null
    } catch {
        return null
    }
}

export function ProtectedRoute({ children, redirectTo = '/login' }) {
    const location = useLocation()
    const token = getAuthToken()

    if (!token) {
        // Salva a URL atual para redirect após login
        return (
            <Navigate
                to={redirectTo}
                state={{ from: location.pathname }}
                replace
            />
        )
    }

    return children
}

/**
 * Hook helper para uso em componentes
 */
export function useIsAuthenticated() {
    return !!getAuthToken()
}
