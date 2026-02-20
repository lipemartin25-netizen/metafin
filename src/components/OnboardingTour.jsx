import { useState } from 'react';
import { Wallet, ArrowRight, Plug, BarChart3, Bot, Target, CreditCard, Sparkles, CheckCircle } from 'lucide-react';

const STEPS = [
    {
        icon: Wallet,
        title: 'Bem-vindo ao SmartFinance Hub!',
        description: 'Sua plataforma completa de financas pessoais. Vamos configurar tudo em poucos passos.',
        color: '#10b981',
        image: '💰'
    },
    {
        icon: Plug,
        title: 'Conecte suas Contas',
        description: 'Importe suas contas bancarias automaticamente via Open Finance (Pluggy) ou adicione manualmente.',
        color: '#8b5cf6',
        image: '🏦',
        action: { label: 'Ir para Contas', path: '/app/accounts' }
    },
    {
        icon: BarChart3,
        title: 'Acompanhe Tudo',
        description: 'Dashboard inteligente com graficos, fluxo de caixa, e comparacao mensal. Tudo em tempo real.',
        color: '#3b82f6',
        image: '📊'
    },
    {
        icon: CreditCard,
        title: 'Cartoes e Contas',
        description: 'Cadastre seus cartoes de credito, controle faturas, e gerencie contas a pagar com alertas de vencimento.',
        color: '#a855f7',
        image: '💳',
        action: { label: 'Ir para Cartoes', path: '/app/cards' }
    },
    {
        icon: Target,
        title: 'Defina suas Metas',
        description: 'Crie metas financeiras com prazo e aporte mensal. Acompanhe seu progresso com graficos interativos.',
        color: '#f59e0b',
        image: '🎯',
        action: { label: 'Criar Meta', path: '/app/goals' }
    },
    {
        icon: Bot,
        title: 'Assistente IA',
        description: 'Pergunte qualquer coisa sobre suas financas! O assistente analisa seus dados e da dicas personalizadas.',
        color: '#ec4899',
        image: '🤖'
    },
    {
        icon: Sparkles,
        title: 'Tudo Pronto!',
        description: 'Seu SmartFinance Hub ja esta configurado. Explore todas as funcionalidades e tome controle das suas financas!',
        color: '#10b981',
        image: '🚀'
    }
];

export default function OnboardingTour({ onComplete }) {
    const [step, setStep] = useState(0);
    const current = STEPS[step];
    const Icon = current.icon;
    const isLast = step === STEPS.length - 1;
    const progress = ((step + 1) / STEPS.length) * 100;

    const handleFinish = () => {
        localStorage.setItem('sf_onboarding_done', 'true');
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-lg">
                {/* Progress bar */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{step + 1}/{STEPS.length}</span>
                </div>

                <div className="glass-card p-8 text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: current.color }} />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-5" style={{ backgroundColor: current.color }} />

                    {/* Icon + Emoji */}
                    <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-4 shadow-lg" style={{ backgroundColor: `${current.color}20` }}>
                            {current.image}
                        </div>
                        <div className="w-8 h-8 rounded-full absolute bottom-2 right-1/2 translate-x-8 flex items-center justify-center shadow-lg" style={{ backgroundColor: current.color }}>
                            <Icon className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{current.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">{current.description}</p>

                    {/* Step indicators */}
                    <div className="flex justify-center gap-1.5 my-6">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6' : 'w-1.5'}`}
                                style={{ backgroundColor: i === step ? current.color : 'rgba(255,255,255,0.1)' }} />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-center">
                        {step > 0 && (
                            <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                                Voltar
                            </button>
                        )}

                        {isLast ? (
                            <button onClick={handleFinish} className="px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center gap-2" style={{ backgroundColor: current.color }}>
                                <CheckCircle className="w-4 h-4" /> Comecar a Usar!
                            </button>
                        ) : (
                            <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center gap-2 hover:gap-3" style={{ backgroundColor: current.color }}>
                                Proximo <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Skip */}
                    {!isLast && (
                        <button onClick={handleFinish} className="mt-4 text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                            Pular tour
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
