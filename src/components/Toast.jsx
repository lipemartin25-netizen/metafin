import { tw } from '@/lib/theme';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Contexto para toasts globais
const ToastContext = createContext(null);

// Tipos de toast
const TOAST_TYPES = {
 success: {
 icon: CheckCircle,
 className: 'bg-brand-primary/10 border-brand-primary/20 text-brand-glow',
 iconClass: 'text-brand-glow',
 },
 error: {
 icon: AlertCircle,
 className: 'bg-red-500/10 border-red-500/20 text-red-400',
 iconClass: 'text-red-400',
 },
 warning: {
 icon: AlertTriangle,
 className: 'bg-[var(--bg-base)]mber-500/10 border-amber-500/20 text-amber-400',
 iconClass: 'text-amber-400',
 },
 info: {
 icon: Info,
 className: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
 iconClass: 'text-blue-400',
 },
};

// Componente individual de Toast
function ToastItem({ id, type = 'info', title, message, duration = 5000, onClose }) {
 const config = TOAST_TYPES[type] || TOAST_TYPES.info;
 const Icon = config.icon;

 useEffect(() => {
 if (duration > 0) {
 const timer = setTimeout(() => onClose(id), duration);
 return () => clearTimeout(timer);
 }
 }, [id, duration, onClose]);

 return (
 <div
 role="alert"
 aria-live="polite"
 className={`
 flex items-start gap-3 p-4 rounded-xl border 
 shadow-lg animate-slide-up min-w-[300px] max-w-[400px]
 ${config.className}
 `}
 >
 <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconClass}`} />

 <div className="flex-1 min-w-0">
 {title && (
 <p className="font-semibold text-sm text-[var(--text-primary)] mb-0.5">{title}</p>
 )}
 {message && (
 <p className="text-sm opacity-90">{message}</p>
 )}
 </div>

 <button
 onClick={() => onClose(id)}
 className="shrink-0 p-1 rounded-lg hover:bg-gray-800/40/10 transition-colors"
 aria-label="Fechar notificação"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 );
}

// Container de Toasts
function ToastContainer({ toasts, removeToast }) {
 if (toasts.length === 0) return null;

 return (
 <div
 className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2"
 aria-label="Notificações"
 >
 {toasts.map((toast) => (
 <ToastItem
 key={toast.id}
 {...toast}
 onClose={removeToast}
 />
 ))}
 </div>
 );
}

// Provider
export function ToastProvider({ children }) {
 const [toasts, setToasts] = useState([]);

 const addToast = useCallback((toast) => {
 const id = Date.now() + Math.random();
 setToasts((prev) => [...prev, { ...toast, id }]);
 return id;
 }, []);

 const removeToast = useCallback((id) => {
 setToasts((prev) => prev.filter((t) => t.id !== id));
 }, []);

 const clearToasts = useCallback(() => {
 setToasts([]);
 }, []);

 // Helpers
 const success = useCallback((message, title) => {
 return addToast({ type: 'success', message, title });
 }, [addToast]);

 const error = useCallback((message, title) => {
 return addToast({ type: 'error', message, title, duration: 8000 });
 }, [addToast]);

 const warning = useCallback((message, title) => {
 return addToast({ type: 'warning', message, title });
 }, [addToast]);

 const info = useCallback((message, title) => {
 return addToast({ type: 'info', message, title });
 }, [addToast]);

 const value = {
 toasts,
 addToast,
 removeToast,
 clearToasts,
 success,
 error,
 warning,
 info,
 };

 return (
 <ToastContext.Provider value={value}>
 {children}
 <ToastContainer toasts={toasts} removeToast={removeToast} />
 </ToastContext.Provider>
 );
}

// Hook para usar toasts
export function useToast() {
 const context = useContext(ToastContext);
 if (!context) {
 throw new Error('useToast deve ser usado dentro de ToastProvider');
 }
 return context;
}

export default ToastProvider;
