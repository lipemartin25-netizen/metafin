import { useScreenGuard } from '../hooks/useScreenGuard';
import { useAuth } from '../contexts/AuthContext';

/**
 * Ativa todas as proteções de tela para as rotas autenticadas (/app).
 * Deve envolver o <Layout /> dentro do <ProtectedRoute>.
 */
export default function ScreenGuardProvider({ children }) {
    const { user } = useAuth();
    useScreenGuard(user?.email ?? '');
    return <>{children}</>;
}
