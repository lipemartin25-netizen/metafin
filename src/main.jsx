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

// Forçar carregamento limpo do Client ID
const VITE_GOOGLE_CLIENT_ID = "637395895732-62af4b16cjnok4v2uuv4n3kiicpin5jk.apps.googleusercontent.com";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || VITE_GOOGLE_CLIENT_ID;

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
