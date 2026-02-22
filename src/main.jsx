import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initAnalytics } from './hooks/useAnalytics';
import './index.css';
import './light-theme.css'; // Mantendo para compatibilidade com páginas antigas
import './lib/sentry';

// Google Client ID — suporte para múltiplas nomenclaturas para garantir funcionamento na Vercel
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENTID || '';

// Inicializar Analytics
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </BrowserRouter>
);
