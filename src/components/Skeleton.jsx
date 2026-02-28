import { tw } from '@/lib/theme';
/**
 * Componentes de Skeleton para loading states
 * Melhora percepção de performance
 */

// Skeleton base
export function Skeleton({ className = '', ...props }) {
 return (
 <div
 className={`animate-pulse bg-gray-800/50 dark:bg-gray-800/40/5 rounded ${className}`}
 {...props}
 />
 );
}

// Skeleton para texto
export function SkeletonText({ lines = 3, className = '' }) {
 return (
 <div className={`space-y-2 ${className}`}>
 {Array.from({ length: lines }).map((_, i) => (
 <Skeleton
 key={i}
 className="h-4"
 style={{ width: i === lines - 1 ? '60%' : '100%' }}
 />
 ))}
 </div>
 );
}

// Skeleton para avatar
export function SkeletonAvatar({ size = 'md', className = '' }) {
 const sizes = {
 sm: 'w-8 h-8',
 md: 'w-12 h-12',
 lg: 'w-16 h-16',
 xl: 'w-24 h-24',
 };

 return (
 <Skeleton className={`rounded-full ${sizes[size]} ${className}`} />
 );
}

// Skeleton para glass-card
export function SkeletonCard({ className = '' }) {
 return (
 <div className={`${tw.card} p-6 space-y-4 ${className}`}>
 <div className="flex items-center gap-4">
 <SkeletonAvatar size="md" />
 <div className="flex-1 space-y-2">
 <Skeleton className="h-4 w-3/4" />
 <Skeleton className="h-3 w-1/2" />
 </div>
 </div>
 <SkeletonText lines={2} />
 </div>
 );
}

// Skeleton para transação
export function SkeletonTransaction({ className = '' }) {
 return (
 <div className={`flex items-center gap-4 p-4 ${className}`}>
 <Skeleton className="w-10 h-10 rounded-xl" />
 <div className="flex-1 space-y-2">
 <Skeleton className="h-4 w-2/3" />
 <Skeleton className="h-3 w-1/3" />
 </div>
 <Skeleton className="h-5 w-20" />
 </div>
 );
}

// Skeleton para lista de transações
export function SkeletonTransactionList({ count = 5, className = '' }) {
 return (
 <div className={`divide-y divide-gray-800/50 dark:divide-white/5 ${className}`}>
 {Array.from({ length: count }).map((_, i) => (
 <SkeletonTransaction key={i} />
 ))}
 </div>
 );
}

// Skeleton para gráfico
export function SkeletonChart({ className = '' }) {
 return (
 <div className={`${tw.card} p-6 ${className}`}>
 <Skeleton className="h-6 w-1/3 mb-4" />
 <div className="flex items-end gap-2 h-48">
 {Array.from({ length: 7 }).map((_, i) => (
 <Skeleton
 key={i}
 className="flex-1 rounded-t"
 style={{ height: `${Math.random() * 80 + 20}%` }}
 />
 ))}
 </div>
 </div>
 );
}

// Skeleton para dashboard
export function SkeletonDashboard() {
 return (
 <div className="space-y-6">
 {/* Cards de resumo */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
 {Array.from({ length: 3 }).map((_, i) => (
 <div key={i} className={`\${tw.card} p-6`}>
 <Skeleton className="h-4 w-1/2 mb-3" />
 <Skeleton className="h-8 w-3/4 mb-2" />
 <Skeleton className="h-3 w-1/3" />
 </div>
 ))}
 </div>

 {/* Gráfico */}
 <SkeletonChart />

 {/* Lista */}
 <div className={`\${tw.card}`}>
 <div className="p-4 border-b border-gray-700/40 dark:border-[var(--border)]">
 <Skeleton className="h-5 w-1/4" />
 </div>
 <SkeletonTransactionList count={5} />
 </div>
 </div>
 );
}

export default Skeleton;
