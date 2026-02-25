// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'

/**
 * Wrapper de rota que exige autenticação.
 * Redireciona para /login mantendo a URL original para redirect pós-login.
 */
import { getAuthToken } from '../hooks/useAuthUtils'

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
