import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { VisibilityProvider } from './contexts/VisibilityProvider';
import { initAnalytics } from './hooks/useAnalytics';
import './index.css';
// import './light-theme.css'; // Removido para unificar layout premium escuro
import './lib/sentry';

// Google Client ID — suporte para múltiplas nomenclaturas para garantir funcionamento na Vercel
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENTID || '';

// Inicializar Analytics
initAnalytics();

// MetaFin Bootstrap: Inicializa verificações críticas
async function bootstrap() {
  // 1. Política de retenção LGPD (executa de forma assíncrona para não travar o boot)
  try {
    const { enforceRetentionPolicy } = await import('./lib/lgpd.js');
    setTimeout(() => enforceRetentionPolicy(365), 5000); // 365 dias
  } catch (err) {
    console.warn('[MetaFin] Falha ao carregar política LGPD:', err.message);
  }

  // 2. Listener global para sessões expiradas
  window.addEventListener('metafin:session-expired', () => {
    sessionStorage.clear();
    // O redirecionamento é feito pelo componente App (useEffect)
  });

  // 3. Limpeza de vestígios de debug em produção
  if (import.meta.env.PROD) {
    const sensitive = ['debug_mode', 'dev_token', '__debug__'];
    sensitive.forEach(k => {
      try { localStorage.removeItem(k); } catch (_err) { /* ignore */ }
    });
  }
}

bootstrap().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <LanguageProvider>
          <VisibilityProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </VisibilityProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </BrowserRouter>
);
