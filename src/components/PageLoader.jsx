import { Loader2 } from 'lucide-react';

/**
 * Componente de loading para Suspense/Lazy loading
 */
export default function PageLoader({ message = 'Carregando...' }) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
 <div className="relative">
 <div className="w-16 h-16 border-4 border-brand-500/20 rounded-full" />
 <div className="absolute inset-0 w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
 </div>
 <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">
 {message}
 </p>
 </div>
 );
}
