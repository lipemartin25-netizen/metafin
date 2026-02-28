import { tw } from '@/lib/theme';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
 Check, Shield,
 CreditCard, AlertCircle, Crown, ArrowLeft,
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { PLANS } from '../lib/plans';
import { AI_MODELS } from '../lib/aiProviders';
import { analytics } from '../hooks/useAnalytics';

export default function Upgrade() {
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const [billing, setBilling] = useState('monthly');
 const {
 subscription, isPro, isTrial, daysRemaining,
 manageSubscription,
 error,
 } = useSubscription();

 // Checar se veio de checkout success/canceled
 const checkoutResult = searchParams.get('checkout');

 useEffect(() => {
 analytics.featureUsed('upgrade_page_viewed');
 }, []);

 const proPlan = PLANS.pro;
 const prices = {
 monthly: { amount: 24.90, label: 'R$ 24,90', period: '/mês' },
 yearly: { amount: 199, label: 'R$ 199,00', period: '/ano', savings: 'Economia de R$ 99' },
 };

 const selected = prices[billing];

 // ========== JÁ É PRO ==========
 if (isPro) {
 return (
 <div className="py-6 max-w-2xl mx-auto animate-fade-in">
 <button
 onClick={() => navigate('/app')}
 className="flex items-center gap-2 text-gray-400 hover:text-[var(--text-primary)] text-sm mb-6 transition-colors"
 >
 <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
 </button>

 <div className={`\${tw.card} text-center`}>
 <Crown className="w-16 h-16 text-brand-glow mx-auto mb-4" />
 <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
 Você é Pro! 💎
 </h1>
 <p className="text-gray-400 mb-2">
 Status: <span className="text-brand-glow font-medium">
 {isTrial ? `Trial (${daysRemaining} dias restantes)` : 'Ativo'}
 </span>
 </p>
 {subscription?.subscription_current_period_end && (
 <p className="text-gray-500 text-sm mb-6">
 Próxima cobrança: {new Date(subscription.subscription_current_period_end).toLocaleDateString('pt-BR')}
 </p>
 )}
 <button
 onClick={manageSubscription}
 className="gradient-btn text-sm"
 >
 <CreditCard className="w-4 h-4 mr-2 inline" />
 Gerenciar Assinatura
 </button>
 <p className="text-xs text-gray-600 mt-3">
 Alterar cartão, trocar plano ou cancelar
 </p>
 </div>
 </div>
 );
 }

 return (
 <div className="py-6 max-w-4xl mx-auto animate-fade-in">
 <button
 onClick={() => navigate('/app')}
 className="flex items-center gap-2 text-gray-400 hover:text-[var(--text-primary)] text-sm mb-6 transition-colors"
 >
 <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
 </button>

 {/* Checkout Result */}
 {checkoutResult === 'success' && (
 <div className="mb-6 p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-glow flex items-center gap-3">
 <Check className="w-5 h-5 shrink-0" />
 <div>
 <p className="font-semibold">Assinatura realizada com sucesso! 🎉</p>
 <p className="text-sm text-brand-glow/70">Seu plano Pro está ativo. Aproveite a IA!</p>
 </div>
 </div>
 )}

 {checkoutResult === 'canceled' && (
 <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center gap-3">
 <AlertCircle className="w-5 h-5 shrink-0" />
 <p>Checkout cancelado. Sem problemas, você pode assinar quando quiser.</p>
 </div>
 )}

 {/* Header */}
 <div className="text-center mb-8">
 <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
 Desbloqueie o Poder da <span className="text-transparent bg-clip-text bg-[var(--bg-base)] from-brand-glow to-brand-glow">IA Financeira</span>
 </h1>
 <p className="text-gray-400">
 7 modelos de IA, import ilimitado, insights personalizados
 </p>
 </div>

 {/* Billing Toggle */}
 <div className="flex justify-center mb-8">
 <div className="flex rounded-xl bg-gray-800/40/5 p-1">
 <button
 onClick={() => setBilling('monthly')}
 className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${billing === 'monthly'
 ? 'bg-brand-primary/20 text-brand-glow'
 : 'text-gray-500 hover:text-gray-300'
 }`}
 >
 Mensal
 </button>
 <button
 onClick={() => setBilling('yearly')}
 className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${billing === 'yearly'
 ? 'bg-brand-primary/20 text-brand-glow'
 : 'text-gray-500 hover:text-gray-300'
 }`}
 >
 Anual
 <span className="px-1.5 py-0.5 rounded-full bg-brand-primary/20 text-brand-glow text-[10px] font-bold">
 -28%
 </span>
 </button>
 </div>
 </div>

 {/* Plan Card */}
 <div className={`max-w-lg mx-auto \${tw.card} border border-brand-primary/20 relative overflow-hidden`}>
 <div className="absolute top-0 right-0 px-4 py-1.5 bg-[var(--bg-base)] from-brand-primary to-brand-glow text-xs font-bold text-[var(--text-primary)] rounded-bl-xl">
 7 DIAS GRÁTIS
 </div>

 <div className="mb-6">
 <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
 💎 MetaFin Pro
 </h2>
 <div className="flex items-baseline gap-1 mt-2">
 <span className="text-4xl font-bold text-[var(--text-primary)]">{selected.label}</span>
 <span className="text-gray-500">{selected.period}</span>
 </div>
 {selected.savings && (
 <p className="text-brand-glow text-sm mt-1">{selected.savings}</p>
 )}
 </div>

 {/* Features */}
 <div className="space-y-3 mb-6">
 {proPlan.features.map((feature) => (
 <div key={feature} className="flex items-start gap-3">
 <Check className="w-4 h-4 text-brand-glow shrink-0 mt-0.5" />
 <span className="text-sm text-gray-300">{feature}</span>
 </div>
 ))}
 </div>

 {/* AI Models Grid */}
 <div className="mb-6">
 <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Modelos de IA Inclusos</p>
 <div className="grid grid-cols-2 gap-2 animate-fade-in">
 {Object.values(AI_MODELS).filter(m => m.id !== 'gemini-1.5-flash').map((m) => ( // Show only premium models roughly
 <div
 key={m.id}
 className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/40/[0.03] border border-[var(--border)] text-xs"
 >
 <span>{m.icon}</span>
 <div>
 <span className="text-gray-300">{m.name}</span>
 <span className="text-gray-600 ml-1">{m.costTier}</span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Error */}
 {error && (
 <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 {error}
 </div>
 )}

 {/* CTA */}
 <div className="p-6 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-center">
 <Crown className="w-12 h-12 text-brand-glow mx-auto mb-3" />
 <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Acesso Pro Liberado! 🎉</h3>
 <p className="text-gray-400 text-sm mb-4">
 Estamos em uma fase especial e liberamos todas as funcionalidades Premium gratuitamente para todos os usuários.
 </p>
 <button
 onClick={() => navigate('/app')}
 className="gradient-btn w-full text-base py-3"
 >
 Começar a Usar Agora
 </button>
 </div>

 <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
 <span className="flex items-center gap-1">
 <Shield className="w-3 h-3" /> Pagamento seguro
 </span>
 <span>Cancele quando quiser</span>
 <span>Sem multa</span>
 </div>
 </div>
 </div>
 );
}
