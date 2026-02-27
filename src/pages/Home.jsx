import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Shield,
    Smartphone,
    Globe,
    CheckCircle2,
    Activity,
    Layers,
    Lock,
    BarChart3,
    Menu,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import MetaFinLogo from '../components/MetaFinLogo';
import { useForceDark } from '../hooks/useForceDark';

export default function Home() {
    useForceDark();

    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const plans = [
        {
            name: "Essencial",
            price: "R$ 0",
            period: "/sempre",
            desc: "Ponto de partida ideal para quem busca controle e organização manual com ferramentas de nível profissional.",
            features: [
                "Dashboard Financeiro Consolidado",
                "Lançamentos Manuais Ilimitados",
                "Controle de Metas de Economia",
                "Relatórios de Fluxo de Caixa",
                "Suporte via Central de Ajuda"
            ],
            buttonText: "Começar Agora",
            popular: false,
            variant: "secondary"
        },
        {
            name: "Premium",
            price: "R$ 14,90",
            period: "/mês",
            desc: "Produtividade total com automação bancária em tempo real e inteligência preditiva Nexus IA.",
            features: [
                "Open Finance: Conexão Automática",
                "Nexus IA: Insights Preditivos",
                "Dashboard de Cartões de Crédito",
                "Categorização Inteligente (ML)",
                "Suporte Especializado Prioritário"
            ],
            buttonText: "Assinar Premium",
            popular: true,
            variant: "primary"
        },
        {
            name: "Elite",
            price: "R$ 29,90",
            period: "/mês",
            desc: "A solução definitiva para investidores e gestão de patrimônio de alta complexidade.",
            features: [
                "Tudo do Plano Premium",
                "Wealth Lab: Simuladores de Ativos",
                "Acesso a API para Desenvolvedores",
                "Funcionalidades Beta Exclusivas"
            ],
            buttonText: "Seja Elite",
            popular: false,
            variant: "secondary"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden selection:bg-emerald-500/30 font-sans antialiased">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-500/[0.03] blur-[160px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-500/[0.02] blur-[160px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>

            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-900/90 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl' : 'bg-transparent py-8'}`}>
                <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <MetaFinLogo className="h-8 w-auto" />
                    </Link>

                    <div className="hidden lg:flex items-center gap-10">
                        {['Tecnologia', 'Funcionalidades', 'Segurança', 'Planos'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                                className="text-[14px] font-semibold tracking-tight text-slate-300 hover:text-white transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="hidden lg:flex items-center gap-6">
                        <Link to="/login" className="text-[14px] font-bold text-slate-300 hover:text-white transition-colors">
                            Entrar
                        </Link>
                        <Link to="/signup" className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[13px] font-extrabold rounded-xl transition-all shadow-xl shadow-emerald-500/10 active:scale-95">
                            Acesso Gratuito
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 text-slate-300 hover:text-white transition-colors relative z-50 rounded-xl hover:bg-white/5 active:bg-white/10"
                        id="mobile-menu-toggle"
                        aria-label="Abrir menu de navegação"
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>

                    {/* Mobile Menu Overlay */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: '100%' }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-0 z-40 bg-slate-950 flex flex-col p-10 lg:hidden"
                            >
                                <div className="mt-16 space-y-8 flex flex-col">
                                    {['Tecnologia', 'Funcionalidades', 'Segurança', 'Planos'].map((item) => (
                                        <a
                                            key={item}
                                            href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-2xl font-bold text-white tracking-tight"
                                        >
                                            {item}
                                        </a>
                                    ))}
                                    <div className="pt-10 border-t border-white/5 space-y-6 flex flex-col">
                                        <Link
                                            to="/login"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-xl font-bold text-slate-300"
                                        >
                                            Entrar
                                        </Link>
                                        <Link
                                            to="/signup"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="w-full py-4 bg-emerald-500 text-slate-950 text-center font-black rounded-2xl"
                                        >
                                            Acesso Gratuito
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>
            </header>

            {/* Hero */}
            <section className="relative pt-64 pb-48 px-6 z-10 text-center">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-800/50 border border-white/10 text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-12 shadow-inner"
                    >
                        <Shield className="w-4 h-4" />
                        <span>Infraestrutura Nexus IA Certificada</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-[5.5rem] font-extrabold tracking-tight leading-[1.05] text-white mb-10 text-balance"
                    >
                        O futuro da gestão <br />
                        <span className="text-emerald-500/90">patrimonial é aqui.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-16 font-medium text-balance"
                    >
                        Poderosa convergência de Open Finance e Inteligência Artificial para
                        quem exige clareza absoluta e controle refinado sobre o capital.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/signup" className="px-10 py-5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-2xl shadow-white/5 active:scale-95 group">
                            Iniciar Agora
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#planos" className="px-10 py-5 bg-slate-800/40 hover:bg-slate-800/60 border border-white/10 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95">
                            Comparar Planos
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Metrics */}
            <section id="tecnologia" className="py-24 border-y border-white/5 bg-slate-900/50 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        {[
                            { val: "100k+", label: "Gestores Ativos" },
                            { val: "R$ 4.2B", label: "Capital Monitorado" },
                            { val: "AES-256", label: "Criptografia Elite" },
                            { val: "v4.2", label: "NEXUS IA CORE" }
                        ].map((stat, i) => (
                            <div key={i} className="space-y-2">
                                <p className="text-4xl font-bold text-white tracking-tight">{stat.val}</p>
                                <p className="text-[12px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="funcionalidades" className="py-32 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BarChart3 className="w-8 h-8 text-emerald-500" />,
                                title: "Predição Inteligente",
                                desc: "Algoritmos de alta performance que antecipam fluxos e sugerem realocações estratégicas com precisão matemática."
                            },
                            {
                                icon: <Layers className="w-8 h-8 text-emerald-500" />,
                                title: "Consolidação Agregada",
                                desc: "Visão 360 do seu patrimônio com integração fluida e automática de todas as suas instituições financeiras."
                            },
                            {
                                icon: <Lock className="w-8 h-8 text-emerald-500" />,
                                title: "Segurança Institucional",
                                desc: "Conformidade total com as regulamentações BACEN e LGPD para uma proteção de dados em nível de estado-da-arte."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-10 bg-slate-900/30 border border-white/5 rounded-[2.5rem] hover:bg-slate-900/50 hover:border-emerald-500/20 transition-all duration-500 group">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800/40 flex items-center justify-center mb-8 border border-white/5 group-hover:bg-emerald-500/10 group-hover:border-emerald-400/20 transition-all duration-500">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-tight">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-[15px] font-medium group-hover:text-slate-300 transition-colors">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="planos" className="py-32 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">Gestão sem fronteiras.</h2>
                        <p className="text-slate-400 text-lg md:text-xl font-medium">Arquitetado para todas as fases da sua vida financeira.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {plans.map((plan, i) => (
                            <div key={i} className={`p-10 rounded-[3rem] bg-slate-900/60 border transition-all duration-500 flex flex-col relative ${plan.popular ? 'border-emerald-500/40 shadow-2xl ring-1 ring-emerald-500/20' : 'border-white/5'}`}>
                                {plan.popular && (
                                    <div className="absolute top-10 right-10">
                                        <span className="bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em]">
                                            Estratégico
                                        </span>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-white mb-3 uppercase tracking-tight">{plan.name}</h3>
                                    <p className="text-slate-300 text-sm font-medium leading-relaxed min-h-[48px]">{plan.desc}</p>
                                </div>

                                <div className="mb-10 flex items-baseline gap-2">
                                    <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                                    <span className="text-slate-400 font-bold">{plan.period}</span>
                                </div>

                                <div className="space-y-4 mb-14 flex-1">
                                    {plan.features.map((feat, idx) => (
                                        <div key={idx} className="flex gap-4 text-slate-100 text-[14px] font-semibold items-center">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500/90 flex-shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link to="/signup" className={plan.variant === 'primary' ? 'btn-clean-primary w-full shadow-emerald-500/10' : 'px-8 py-4 bg-slate-800/60 hover:bg-slate-800 text-white font-bold rounded-2xl text-center transition-all border border-white/5'}>
                                    {plan.buttonText}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="pt-32 pb-16 px-6 border-t border-white/5 bg-[#0a0f1e] relative z-20">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-20 mb-24">
                    <div className="md:col-span-1 space-y-8">
                        <MetaFinLogo className="h-7 w-auto" />
                        <p className="text-slate-400 text-sm leading-relaxed font-medium pr-10">
                            Alta performance em tecnologia financeira integrada.
                            Sua segurança e transparência em primeiro nível global.
                        </p>
                        <div className="flex gap-4">
                            {[Smartphone, Shield, Globe, Activity].map((Icon, i) => (
                                <div key={i} className="p-3.5 rounded-2xl bg-slate-900 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer">
                                    <Icon className="w-4 h-4 text-slate-400" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {[
                        {
                            title: "Corporativo",
                            links: [
                                { n: "Ecossistema", h: "/hub/ecosistema" },
                                { n: "Segurança", h: "/hub/seguranca" },
                                { n: "Central de Ajuda", h: "/hub/ajuda" },
                                { n: "Contatos", h: "/hub/contatos" }
                            ]
                        },
                        {
                            title: "Plataforma",
                            links: [
                                { n: "Painel Desktop", h: "/hub/plataforma" },
                                { n: "iOS & Android", h: "/hub/plataforma" },
                                { n: "API Developers", h: "/app/api" },
                                { n: "Uptime & Status", h: "/hub/status" }
                            ]
                        },
                        {
                            title: "Jurídico",
                            links: [
                                { n: "Privacidade", h: "/hub/privacidade" },
                                { n: "Termos de Uso", h: "/hub/termos" },
                                { n: "LGPD", h: "/hub/lgpd" },
                                { n: "BACEN Compliance", h: "/hub/bacen" }
                            ]
                        }
                    ].map((col, i) => (
                        <div key={i}>
                            <h4 className="text-white font-bold text-[13px] mb-8 uppercase tracking-[0.15em]">{col.title}</h4>
                            <ul className="space-y-4">
                                {col.links.map((link, idx) => (
                                    <li key={idx}>
                                        <Link to={link.h} className="text-slate-400 hover:text-white transition-colors text-[14px] font-semibold">{link.n}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="max-w-7xl mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[11px] font-bold text-slate-400 tracking-[0.1em]">
                        © {new Date().getFullYear()} METAFIN GLOBAL OPERATIONS. TODOS OS DIREITOS RESERVADOS.
                    </p>
                    <div className="flex items-center gap-8">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest bg-slate-900/50 px-4 py-1.5 rounded-full border border-white/5">
                            <Lock className="w-3.5 h-3.5 text-emerald-500/80" /> 256-bit AES SECURE PROTOCOL
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
