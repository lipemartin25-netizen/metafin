import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
    TrendingUp,
    Shield,
    Zap,
    BarChart3,
    Upload,
    Brain,
    CheckCircle,
    ArrowRight,
    Star,
} from 'lucide-react';
import { analytics } from '../hooks/useAnalytics';
import { db, isSupabaseConfigured } from '../lib/supabase';
import { PLANS } from '../lib/plans';

const features = [
    {
        icon: Upload,
        title: 'Smart Import CSV',
        description:
            'Importe extratos do seu banco. Categorização automática com IA detecta padrões.',
        color: '#f97316',
    },
    {
        icon: BarChart3,
        title: 'Dashboard Inteligente',
        description:
            'Gráficos interativos com análise de gastos por categoria, período e tendências.',
        color: '#3b82f6',
    },
    {
        icon: Brain,
        title: 'IA Brasileira',
        description:
            'Treinada para entender padrões financeiros brasileiros: PIX, boleto, cartão.',
        color: '#8b5cf6',
    },
    {
        icon: Shield,
        title: 'Segurança Total',
        description:
            'Criptografia ponta-a-ponta. Nunca acessamos sua conta bancária.',
        color: '#10b981',
    },
    {
        icon: Zap,
        title: 'Tempo Real',
        description:
            'Atualizações instantâneas. Importe, categorize e analise em segundos.',
        color: '#06b6d4',
    },
    {
        icon: Star,
        title: 'Insights Personalizados',
        description:
            'Descubra onde economizar com sugestões baseadas no seu perfil de gastos.',
        color: '#ec4899',
    },
];

const pricing = Object.values(PLANS).map((plan) => ({
    name: plan.name,
    price: plan.priceLabel,
    period: plan.period,
    description: plan.id === 'free' ? 'Para começar a organizar' : plan.id === 'pro' ? 'Para controle total' : 'Para empresas e times',
    features: plan.features,
    cta: plan.cta,
    popular: plan.popular,
}));


const testimonials = [
    {
        name: 'Mariana Silva',
        role: 'Designer • São Paulo',
        text: 'Finalmente consigo entender para onde vai meu dinheiro. O import de CSV é absurdamente rápido!',
        rating: 5,
    },
    {
        name: 'João Pedro',
        role: 'Dev Fullstack • Curitiba',
        text: 'A categorização automática acerta 90% das vezes. Economizo horas todo mês.',
        rating: 5,
    },
    {
        name: 'Ana Beatriz',
        role: 'Empreendedora • BH',
        text: 'Uso para gerenciar as finanças da minha MEI. Simples e poderoso.',
        rating: 5,
    },
];

export default function Home() {
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistStatus, setWaitlistStatus] = useState(null);

    const handleWaitlist = async (e) => {
        e.preventDefault();
        if (!waitlistEmail) return;

        analytics.waitlistJoined();

        if (isSupabaseConfigured) {
            const { error } = await db.waitlist.add(waitlistEmail);
            if (error && error.code === '23505') {
                setWaitlistStatus('already');
            } else if (error) {
                setWaitlistStatus('error');
            } else {
                setWaitlistStatus('success');
            }
        } else {
            // Modo demo
            const existing = JSON.parse(localStorage.getItem('sf_waitlist') || '[]');
            existing.push({ email: waitlistEmail, date: new Date().toISOString() });
            localStorage.setItem('sf_waitlist', JSON.stringify(existing));
            setWaitlistStatus('success');
        }

        setWaitlistEmail('');
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* ========== NAVBAR ========== */}
            <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold">SmartFinance</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            Entrar
                        </Link>
                        <Link
                            to="/signup"
                            onClick={() => analytics.ctaClicked('hero_signup', 'navbar')}
                            className="gradient-btn text-sm px-4 py-2"
                        >
                            Criar Conta
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ========== HERO ========== */}
            <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                        <Zap className="w-3.5 h-3.5" />
                        Finanças inteligentes com IA
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                        Controle suas finanças{' '}
                        <span className="gradient-text">como nunca antes</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Importe seus extratos, categorize automaticamente com IA brasileira,
                        e descubra para onde vai cada centavo do seu dinheiro.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/signup"
                            onClick={() => analytics.ctaClicked('hero_start', 'hero')}
                            className="gradient-btn text-lg px-8 py-4 flex items-center gap-2"
                        >
                            Começar Grátis
                            <ArrowRight className="w-5 h-5" />
                        </Link>

                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16">
                        {[
                            { value: '10K+', label: 'Transações' },
                            { value: '98%', label: 'Precisão IA' },
                            { value: '<2s', label: 'Latência' },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="text-2xl font-bold gradient-text">
                                    {stat.value}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FEATURES ========== */}
            <section className="py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Tudo que você precisa para{' '}
                            <span className="gradient-text">dominar suas finanças</span>
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            Ferramenta completa, pensada para o brasileiro que quer sair do
                            vermelho e construir patrimônio.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f) => (
                            <div key={f.title} className="glass-card group hover:border-white/20 transition-all duration-300">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                    style={{ backgroundColor: `${f.color}15` }}
                                >
                                    <f.icon className="w-6 h-6" style={{ color: f.color }} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                                    {f.title}
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    {f.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== PRICING ========== */}
            <section className="py-20 px-4 sm:px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Planos para <span className="gradient-text">cada momento</span>
                        </h2>
                        <p className="text-gray-400">
                            Comece grátis. Upgrade quando precisar.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {pricing.map((plan) => (
                            <div
                                key={plan.name}
                                className={`glass-card relative ${plan.popular
                                    ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-2xl scale-[1.02]'
                                    : ''
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-xs font-bold">
                                        Mais Popular
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-white mb-1">
                                    {plan.name}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                                <div className="mb-6">
                                    <span className="text-3xl font-extrabold text-white">
                                        {plan.price}
                                    </span>
                                    <span className="text-gray-500">{plan.period}</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-center gap-2 text-sm text-gray-300"
                                        >
                                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/signup"
                                    onClick={() => analytics.planSelected(plan.name)}
                                    className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.popular
                                        ? 'gradient-btn'
                                        : 'border border-white/10 text-gray-300 hover:bg-white/5'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== TESTIMONIALS ========== */}
            <section className="py-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold">
                            Quem usa, <span className="gradient-text">recomenda</span>
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6">
                        {testimonials.map((t) => (
                            <div key={t.name} className="glass-card">
                                <div className="flex gap-0.5 mb-3">
                                    {Array.from({ length: t.rating }, (_, i) => (
                                        <Star
                                            key={i}
                                            className="w-4 h-4 text-amber-400 fill-amber-400"
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                                    &quot;{t.text}&quot;
                                </p>
                                <div>
                                    <p className="text-sm font-semibold text-white">{t.name}</p>
                                    <p className="text-xs text-gray-500">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== WAITLIST CTA ========== */}
            <section className="py-20 px-4 sm:px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="glass-card">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                            Fique por dentro das{' '}
                            <span className="gradient-text">novidades</span>
                        </h2>
                        <p className="text-gray-400 mb-8">
                            Receba atualizações e acesso antecipado a novas features.
                        </p>

                        <form
                            onSubmit={handleWaitlist}
                            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                        >
                            <input
                                type="email"
                                value={waitlistEmail}
                                onChange={(e) => setWaitlistEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="input-field flex-1"
                            />
                            <button type="submit" className="gradient-btn whitespace-nowrap">
                                Quero Acesso
                            </button>
                        </form>

                        {waitlistStatus === 'success' && (
                            <p className="text-emerald-400 text-sm mt-4 animate-fade-in">
                                🎉 Inscrito com sucesso! Fique de olho no seu email.
                            </p>
                        )}
                        {waitlistStatus === 'already' && (
                            <p className="text-amber-400 text-sm mt-4 animate-fade-in">
                                Você já está na lista! Aguarde novidades.
                            </p>
                        )}
                        {waitlistStatus === 'error' && (
                            <p className="text-red-400 text-sm mt-4 animate-fade-in">
                                Erro ao inscrever. Tente novamente.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <footer className="border-t border-white/5 py-12 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-md flex items-center justify-center">
                            <TrendingUp className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-400">
                            SmartFinance Hub
                        </span>
                    </div>
                    <p className="text-xs text-gray-600">
                        © {new Date().getFullYear()} SmartFinance Hub. Feito com 💚 no
                        Brasil.
                    </p>
                </div>
            </footer>
        </div>
    );
}
