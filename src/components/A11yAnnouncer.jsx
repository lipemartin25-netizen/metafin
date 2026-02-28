import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

/**
 * Componente para anúncios de acessibilidade (screen readers)
 */

const A11yContext = createContext(null);

export function A11yProvider({ children }) {
 const [message, setMessage] = useState('');
 const [politeness, setPoliteness] = useState('polite');
 const timeoutRef = useRef(null);

 const announce = useCallback((text, { polite = true, timeout = 5000 } = {}) => {
 // Limpar timeout anterior
 if (timeoutRef.current) {
 clearTimeout(timeoutRef.current);
 }

 setPoliteness(polite ? 'polite' : 'assertive');
 setMessage(text);

 // Limpar mensagem após timeout
 if (timeout > 0) {
 timeoutRef.current = setTimeout(() => {
 setMessage('');
 }, timeout);
 }
 }, []);

 const clear = useCallback(() => {
 setMessage('');
 }, []);

 useEffect(() => {
 return () => {
 if (timeoutRef.current) {
 clearTimeout(timeoutRef.current);
 }
 };
 }, []);

 return (
 <A11yContext.Provider value={{ announce, clear }}>
 {children}

 {/* Live region para anúncios */}
 <div
 role="status"
 aria-live={politeness}
 aria-atomic="true"
 className="sr-only"
 >
 {message}
 </div>
 </A11yContext.Provider>
 );
}

export function useA11y() {
 const context = useContext(A11yContext);
 if (!context) {
 throw new Error('useA11y deve ser usado dentro de A11yProvider');
 }
 return context;
}

// Hook para anunciar mudanças de página
export function usePageAnnounce(title) {
 const { announce } = useA11y();

 useEffect(() => {
 if (title) {
 announce(`Navegou para ${title}`);
 }
 }, [title, announce]);
}

// Hook para anunciar ações
export function useActionAnnounce() {
 const { announce } = useA11y();

 return {
 announceSuccess: (message) => announce(message, { polite: true }),
 announceError: (message) => announce(message, { polite: false }),
 announceLoading: (message = 'Carregando...') => announce(message),
 };
}

export default A11yProvider;
