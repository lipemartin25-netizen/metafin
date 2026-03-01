
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


export default function Home() {


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
            name: "Starter",
            price: "R$ 0",
            period: "/mês",
            desc: "Automação básica e controle manual para organização inicial do capital.",
            features: [
                "Dashboard Consolidado",
                "Lançamentos Manuais Ilimitados",
                "Controle de Metas",
                "Até 2 Contas Integradas",
                "Suporte Comunitário"
            ],
            buttonText: "Começar Agora",
            popular: false,
            variant: "secondary"
        },
        {
            name: "Pro",
            price: "R$ 49,90",
            period: "/mês",
            desc: "Sincronização em tempo real e inteligência artificial preditiva.",
            features: [
                "Contas Bancárias Ilimitadas",
                "Inteligência Artificial (Nexus IA)",
                "Open Finance Completo",
                "Categorização Automática",
                "Suporte Prioritário"
            ],
            buttonText: "Assinar Pro",
            popular: true,
            variant: "primary"
        },
        {
            name: "Enterprise",
            price: "R$ 149,90",
            period: "/mês",
            desc: "Complexidade patrimonial gerida com algoritmos quantitativos de elite.",
            features: [
                "Tudo do Plano Pro",
                "Wealth Lab & Simuladores",
                "Relatórios Fiscais Automatizados",
                "Acesso API Desenvolvedores",
                "Gerente de Conta Dedicado"
            ],
            buttonText: "Falar com Vendas",
            popular: false,
            variant: "secondary"
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] overflow-x-hidden font-sans antialiased">
            {/* Background - Tech Grid */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="tech-grid-bg opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-base)] to-[var(--bg-base)] opacity-90" />
            </div>

            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[var(--bg-[var(--bg-elevated)])]/95 backdrop-blur-md border-b border-[var(--border-subtle)] py-4' : 'bg-transparent py-8'}`}>
                <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <MetaFinLogo className="h-8 w-auto text-[var(--menta-dark)]" />
                    </Link>

                    <div className="hidden lg:flex items-center gap-10">
                        {['Tecnologia', 'Soluções', 'Segurança', 'Planos'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                                className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="hidden lg:flex items-center gap-6">
                        <Link to="/login" className="text-[14px] font-bold text-[var(--text-primary)] hover:text-[var(--menta-dark)] transition-colors">
                            Entrar
                        </Link>
                        <Link to="/signup" className="btn-brand px-6 py-2.5 text-sm uppercase tracking-wider">
                            Acesso Gratuito
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 text-[var(--text-primary)] hover:text-[var(--menta-dark)] transition-colors relative z-50 rounded-lg bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border-subtle)]"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Mobile Menu */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-[100%] left-0 right-0 bg-[var(--bg-[var(--bg-elevated)])] border-b border-[var(--border-subtle)] shadow-xl lg:hidden flex flex-col px-6 py-8 space-y-6"
                            >
                                {['Tecnologia', 'Soluções', 'Segurança', 'Planos'].map((item) => (
                                    <a
                                        key={item}
                                        href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-lg font-bold text-[var(--text-primary)] tracking-tight"
                                    >
                                        {item}
                                    </a>
                                ))}
                                <div className="pt-6 border-t border-[var(--border-subtle)] space-y-4 flex flex-col">
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-lg font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        Entrar
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="btn-brand text-center w-full uppercase tracking-wider text-sm py-4"
                                    >
                                        Acesso Gratuito
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative pt-64 pb-32 px-6 z-10 text-center flex flex-col items-center justify-center min-h-[90vh]">
                <div className="max-w-5xl mx-auto w-full relative">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--menta-border)] bg-[var(--menta-soft)] text-[var(--menta-dark)] text-[11px] font-bold uppercase tracking-widest mb-10 mx-auto"
                    >
                        <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                        Plataforma Web3 Institucional
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-[5.5rem] font-playfair font-bold tracking-tight leading-[1.05] text-[var(--text-primary)] mb-8 text-balance"
                    >
                        O Futuro das <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--rosa)] to-[var(--menta-dark)]">Finanças Digitais</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed mb-12 font-light text-balance"
                    >
                        Sincronização Open Finance de alta latência e predição com Inteligência Artificial para gestão patrimonial absoluta.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto sm:max-w-none"
                    >
                        <Link to="/signup" className="w-full sm:w-auto btn-brand text-[15px] py-4 px-10 flex items-center justify-center gap-2 uppercase tracking-wide">
                            Iniciar Agora
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="#planos" className="w-full sm:w-auto btn-outline text-[15px] py-4 px-10 flex items-center justify-center bg-[var(--bg-[var(--bg-elevated)])]/50 uppercase tracking-wide">
                            Comparar Planos
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Metrics Section */}
            <section id="tecnologia" className="py-16 border-y border-[var(--border-subtle)] bg-[var(--bg-[var(--bg-elevated)])] relative z-10 overflow-hidden">
                {/* Subtle glow behind metrics */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-32 bg-[var(--menta-soft)] blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center animate-fade-in">
                        {[
                            { val: "150k+", label: "Gestores Ativos" },
                            { val: "R$ 2.4B+", label: "Capital Monitorado" },
                            { val: "99.97%", label: "Uptime do Sistema" },
                            { val: "< 50ms", label: "Latência Média" }
                        ].map((stat, i) => (
                            <div key={i} className="space-y-2">
                                <p className="text-3xl md:text-4xl font-playfair font-bold text-[var(--text-primary)] tracking-tight">{stat.val}</p>
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="solucoes" className="py-32 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl lg:text-5xl font-playfair font-bold text-[var(--text-primary)] tracking-tight">Arquitetura de Alta Performance</h2>
                        <p className="text-[var(--text-secondary)] text-lg">Seis pilares que garantem o controle absoluto do seu patrimônio.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {[
                            {
                                icon: <BarChart3 className="w-7 h-7 text-[var(--menta-dark)]" />,
                                title: "Predição Inteligente",
                                desc: "Algoritmos de alta performance que antecipam fluxos de caixa e sugerem realocações baseadas em dados históricos."
                            },
                            {
                                icon: <Globe className="w-7 h-7 text-[var(--menta-dark)]" />,
                                title: "Open Finance Total",
                                desc: "Conecte todos os seus bancos via protocolo oficial do BACEN para atualização de saldos em tempo real."
                            },
                            {
                                icon: <Lock className="w-7 h-7 text-[var(--menta-dark)]" />,
                                title: "Segurança 256-bit",
                                desc: "Criptografia de nível militar protegendo cada requisição, com certificação SOC-2 e compliance LGPD."
                            },
                            {
                                icon: <Layers className="w-7 h-7 text-[var(--menta-dark)]" />,
                                title: "Visão Consolidada",
                                desc: "Transforme dezenas de extratos espalhados em uma interface limpa, categorizada automaticamente."
                            },
                            {
                                icon: <Smartphone className="w-7 h-7 text-[var(--menta-dark)]" />,
                                title: "Controle Mobile",
                                desc: "Plataforma responsiva para gerenciar seu capital de qualquer dispositivo, a qualquer momento."
                            },
                            {
                                icon: <Shield className="w-7 h-7 text-[var(--menta-dark)]" />,
                                title: "Auditoria Contínua",
                                desc: "Análise vigilante contra discrepâncias de gastos e proteção preditiva contra fraudes anômalas."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="tech-card p-10 group cursor-default">
                                <div className="w-14 h-14 rounded-xl bg-[var(--bg-base)] flex items-center justify-center mb-8 border border-[var(--border-subtle)] group-hover:bg-[var(--menta-soft)] group-hover:border-[var(--menta-border)] transition-all duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)] tracking-tight font-playfair">{feature.title}</h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed text-[15px] font-normal">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="planos" className="py-32 px-6 relative z-10 bg-[var(--bg-[var(--bg-elevated)])] border-y border-[var(--border-subtle)]">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[var(--menta-soft)] blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-24 space-y-4">
                        <h2 className="text-4xl lg:text-5xl font-playfair font-bold text-[var(--text-primary)] tracking-tight">Planos Estratégicos</h2>
                        <p className="text-[var(--text-secondary)] text-lg">Soluções escaláveis para o tamanho do seu capital.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
                        {plans.map((plan, i) => (
                            <div key={i} className={`${plan.popular ? 'tech-card-elevated popular scale-105 z-20 shadow-[0_0_40px_rgba(0,229,118,0.15)] ring-1 ring-brand' : 'tech-card'} p-10 flex flex-col relative`}>

                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-lg">
                                        Mais Popular
                                    </div>
                                )}

                                <div className="mb-8 border-b border-[var(--border-subtle)] pb-8">
                                    <h3 className="text-2xl font-playfair font-bold text-[var(--text-primary)] mb-2">{plan.name}</h3>
                                    <p className="text-[var(--text-secondary)] text-sm font-medium h-10">{plan.desc}</p>
                                </div>

                                <div className="mb-10 flex items-baseline gap-2">
                                    <span className="text-5xl font-playfair font-bold text-[var(--text-primary)]">{plan.price}</span>
                                    <span className="text-[var(--text-muted)] text-sm font-medium">{plan.period}</span>
                                </div>

                                <div className="space-y-4 mb-12 flex-1">
                                    {plan.features.map((feat, idx) => (
                                        <div key={idx} className="flex gap-3 text-gray-300 text-sm font-medium items-center">
                                            <CheckCircle2 className="w-5 h-5 text-[var(--menta-dark)] flex-shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link to="/signup" className={`w-full text-center py-4 rounded-lg font-semibold transition-all uppercase tracking-wide text-sm ${plan.popular ? 'btn-brand shadow-lg' : 'bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-[var(--bg-elevated)])] hover:border-white/30'}`}>
                                    {plan.buttonText}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="pt-24 pb-12 px-6 bg-[#06080D] relative z-20 border-t border-[var(--border-subtle)]">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
                    <div className="space-y-6">
                        <MetaFinLogo className="h-7 w-auto text-[var(--text-primary)]/80" />
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed font-medium">
                            Tecnologia financeira de próxima geração. Segura, inteligente e sofisticada, desenhada para gestão patrimonial absoluta.
                        </p>
                        <div className="flex gap-4">
                            {[Smartphone, Shield, Globe, Activity].map((Icon, i) => (
                                <div key={i} className="p-3 rounded-lg bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border-subtle)] hover:border-brand/50 hover:text-[var(--menta-dark)] transition-all cursor-pointer text-[var(--text-muted)]">
                                    <Icon className="w-4 h-4" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {[
                        {
                            title: "Corporativo",
                            links: ["Ecossistema", "Segurança NEXUS", "Relatórios Financeiros", "Careers"]
                        },
                        {
                            title: "Plataforma",
                            links: ["Web Dashboard", "Mobile Apps", "API para Desenvolvedores", "System Status"]
                        },
                        {
                            title: "Legal",
                            links: ["Termos de Uso", "Política de Privacidade", "Conformidade LGPD", "Certificados BACEN"]
                        }
                    ].map((col, i) => (
                        <div key={i}>
                            <h4 className="text-[var(--text-primary)] font-bold text-xs mb-6 uppercase tracking-[0.15em]">{col.title}</h4>
                            <ul className="space-y-4">
                                {col.links.map((link, idx) => (
                                    <li key={idx}>
                                        <a href="#" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="max-w-7xl mx-auto pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <p className="text-[11px] font-bold text-[var(--text-muted)] tracking-widest uppercase">
                            © {new Date().getFullYear()} METAFIN HOLDINGS. ALL RIGHTS RESERVED.
                        </p>
                        <span className="text-[9px] font-black text-[var(--menta-dark)] bg-[var(--menta-soft)] px-2 py-0.5 rounded border border-[var(--menta-border)] uppercase tracking-tighter">
                            Build: v2.5.0 Premium 3D active
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-[var(--bg-elevated)])] px-4 py-2 rounded-full border border-[var(--border-subtle)]">
                        <Lock className="w-3 h-3 text-[var(--menta-dark)]" /> SOC-2 TYPE II COMPLIANT
                    </div>
                </div>
            </footer>
        </div>
    );
}
