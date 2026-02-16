import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { initAnalytics } from './hooks/useAnalytics';
import './index.css';

import { LanguageProvider } from './contexts/LanguageContext';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Inicializar Analytics
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={googleClientId}>
        <LanguageProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LanguageProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
