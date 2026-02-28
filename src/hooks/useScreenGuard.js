import { useEffect, useRef } from 'react';

/**
 * useScreenGuard
 * Camadas de proteção contra captura de tela:
 * 1. PrintScreen / Cmd+Shift+3/4/5 → borra tela por 1.5s
 * 2. visibilitychange → borra tela ao trocar de aba
 * 3. window blur → borra ao perder foco (Alt+Tab etc)
 * 4. Watermark forense invisível com email + data
 */
export function useScreenGuard(_userEmail = '') {
 const overlayRef = useRef(null);

 useEffect(() => {
 // Cria overlay de proteção
 const overlay = document.createElement('div');
 overlay.id = 'screen-guard-overlay';
 Object.assign(overlay.style, {
 position: 'fixed',
 inset: '0',
 zIndex: '99999',
 backdropFilter: 'blur(32px)',
 WebkitBackdropFilter: 'blur(32px)',
 background: 'rgba(2, 6, 23, 0.92)',
 display: 'none',
 alignItems: 'center',
 justifyContent: 'center',
 flexDirection: 'column',
 gap: '16px',
 });

 overlay.innerHTML = `
 <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
 stroke="rgba(255,255,255,0.3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
 </svg>
 <p style="color:rgba(255,255,255,0.4);font-size:12px;font-family:system-ui,sans-serif;
 letter-spacing:0.08em;text-transform:uppercase;margin:0;font-weight:600;">
 Conteúdo protegido
 </p>
 `;

 document.body.appendChild(overlay);
 overlayRef.current = overlay;

 const show = () => { overlay.style.display = 'flex'; };
 const hide = (delay = 0) => {
 setTimeout(() => { overlay.style.display = 'none'; }, delay);
 };

 // 1. Detecta PrintScreen e atalhos de captura
 const handleKeyDown = (e) => {
 const isPrintScreen = e.key === 'PrintScreen' || e.keyCode === 44;
 const isMacCapture = e.metaKey && e.shiftKey &&
 ['3', '4', '5', 's', 'S'].includes(e.key);
 const isWinSnip = (e.metaKey || e.ctrlKey) && e.shiftKey &&
 ['s', 'S'].includes(e.key);

 if (isPrintScreen || isMacCapture || isWinSnip) {
 e.preventDefault();
 show();
 hide(1500);
 }
 };

 // 2. Troca de aba
 const handleVisibility = () => {
 if (document.hidden) {
 show();
 } else {
 hide(700);
 }
 };

 // 3. Perda de foco da janela
 const handleBlur = () => show();
 const handleFocus = () => hide(600);

 document.addEventListener('keydown', handleKeyDown);
 document.addEventListener('visibilitychange', handleVisibility);
 window.addEventListener('blur', handleBlur);
 window.addEventListener('focus', handleFocus);

 return () => {
 document.removeEventListener('keydown', handleKeyDown);
 document.removeEventListener('visibilitychange', handleVisibility);
 window.removeEventListener('blur', handleBlur);
 window.removeEventListener('focus', handleFocus);
 if (overlayRef.current) overlayRef.current.remove();
 };
 }, []);

 // Nota: O Watermark forense foi removido conforme solicitação do usuário.
}

