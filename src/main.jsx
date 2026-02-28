import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { VisibilityProvider } from './contexts/VisibilityProvider';
import { initAnalytics } from './hooks/useAnalytics';
import { initFeatureFlags } from './lib/featureFlags';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { A11yProvider } from './components/A11yAnnouncer';
import SkipLinks from './components/SkipLinks';

// Importação segura do estilo global
import './index.css';

// Configurações do ambiente
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENTID || '';

// Inicialização de serviços core
async function initCore() {
 try {
 // 1. Analytics
 initAnalytics();

 // 2. Feature Flags
 await initFeatureFlags();

 // 3. LGPD & Bootstrap Logic
 const { enforceRetentionPolicy } = await import('./lib/lgpd.js');
 setTimeout(() => enforceRetentionPolicy(365), 5000);

 // 4. Service Worker (PWA)
 if ('serviceWorker' in navigator && import.meta.env.PROD) {
 window.addEventListener('load', () => {
 navigator.serviceWorker.register('/sw-custom.js')
 .catch(err => console.error('SW registration failed:', err));
 });
 }

 // 5. Listener global para sessões expiradas
 window.addEventListener('metafin:session-expired', () => {
 sessionStorage.clear();
 window.location.href = '/login?expired=true';
 });

 } catch (err) {
 console.error('[MetaFin] Boot Error:', err);
 }
}

// Executar inicialização
initCore();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
 <ErrorBoundary>
 <BrowserRouter>
 <GoogleOAuthProvider clientId={googleClientId}>
 <ThemeProvider>
 <LanguageProvider>
 <VisibilityProvider>
 <AuthProvider>
 <A11yProvider>
 <ToastProvider>
 <SkipLinks />
 <App />
 </ToastProvider>
 </A11yProvider>
 </AuthProvider>
 </VisibilityProvider>
 </LanguageProvider>
 </ThemeProvider>
 </GoogleOAuthProvider>
 </BrowserRouter>
 </ErrorBoundary>
);
