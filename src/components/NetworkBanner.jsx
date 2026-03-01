import { tw } from '@/lib/theme';
// src/components/NetworkBanner.jsx
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react'

export function NetworkBanner() {
 const { isOnline, isApiSuboptimal, checkApiHealth } = useNetworkStatus()

 // Se tudo estiver normal, não renderiza nada
 if (isOnline && !isApiSuboptimal) return null

 return (
 <div
 role="alert"
 className={`fixed top-0 left-0 right-0 z-[100] animate-slide-down flex items-center justify-center gap-3 py-2 px-4 shadow-lg transition-colors border-b ${!isOnline
 ? 'bg-red-600 text-[var(--text-primary)] border-red-700'
 : 'bg-[var(--bg-base)]mber-500 text-[var(--text-primary)] border-amber-600'
 }`}
 >
 {!isOnline ? (
 <>
 <WifiOff className="w-4 h-4 animate-pulse" />
 <span className="text-xs font-bold uppercase tracking-wider">
 Você está Offline — Usando dados locais (em cache)
 </span>
 </>
 ) : (
 <>
 <AlertTriangle className="w-4 h-4" />
 <span className="text-xs font-bold uppercase tracking-wider">
 Sistema indisponível — Algumas funções podem falhar
 </span>
 <button
 onClick={checkApiHealth}
 className="ml-2 p-1 hover:bg-gray-800/40/20 rounded-lg transition-colors"
 title="Tentar reconectar"
 >
 <RefreshCw className="w-3 h-3" />
 </button>
 </>
 )}
 </div>
 )
}
