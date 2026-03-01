import { tw } from '@/lib/theme';
import { Lock, Sparkles } from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { Link } from 'react-router-dom';

/**
 * Componente wrapper que bloqueia features Pro.
 * Usage: <ProGate feature="aiChat"> ... conteúdo pro ... </ProGate>
 */
export default function ProGate({ feature, children, fallback, className = '' }) {
 const { can } = usePlan();

 // Se tiver permissão, mostra o conteúdo real
 if (can(feature)) {
 return children;
 }

 // Se tiver um fallback customizado, mostra ele
 if (fallback) return fallback;

 // Padrão: mostra conteúdo "borrado" com overlay de travamento
 return (
 <div className={`relative ${className} group`}>
 {/* Blurred content preview (não interativo) */}
 <div className="filter blur-sm pointer-events-none select-none opacity-40 grayscale group-hover:grayscale-0 transition-all duration-500">
 {children}
 </div>

 {/* Overlay */}
 <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[var(--bg-base)]/20 backdrop-blur-[2px]">
 <div className={`${tw.card} bg-gray-900/90 border border-brand-primary/20 p-6 max-w-xs text-center shadow-elevated relative overflow-hidden`}>
 {/* Efeito de brilho no fundo */}
 <div className="absolute top-0 left-0 w-full h-1 bg-[var(--bg-base)] from-transparent via-emerald-500 to-transparent opacity-50"></div>

 <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-3 border border-brand-primary/20 shadow-lg shadow-brand-primary/10">
 <Lock className="w-5 h-5 text-brand-glow" />
 </div>

 <h3 className="text-[var(--text-primary)] font-bold text-lg mb-1 flex items-center justify-center gap-2">
 Recurso Pro <span className="text-[10px] bg-brand-primary text-[var(--text-primary)] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">PRO</span>
 </h3>

 <p className="text-gray-400 text-xs mb-5 leading-relaxed">
 Desbloqueie IA avançada, relatórios PDF, multi-formatos e suporte prioritário.
 </p>

 <Link
 to="/app/upgrade"
 className="gradient-btn w-full text-sm py-2.5 flex items-center justify-center gap-2 hover:shadow-brand-primary/25 transition-all group-hover:scale-[1.02]"
 >
 <Sparkles className="w-4 h-4 fill-white" />
 Upgrade — R$ 24,90/mês
 </Link>

 <p className="text-[10px] text-gray-500 mt-3 font-medium">
 Cancele quando quiser.
 </p>
 </div>
 </div>
 </div>
 );
}
