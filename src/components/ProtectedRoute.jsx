import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PageLoader from './PageLoader'

/**
 * Wrapper de rota que exige autenticação.
 * Redireciona para /login mantendo a URL original para redirect pós-login.
 */
export default function ProtectedRoute({ children, redirectTo = '/login' }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <PageLoader message="Verificando acesso..." />
    }

    if (!user) {
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
