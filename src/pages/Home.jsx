import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Shield,
    Zap,
    TrendingUp,
    Smartphone,
    Globe,
    CheckCircle2,
    Sparkles,
    Activity,
    Cpu,
    Layers,
    LineChart,
    ChevronDown,
    Lock,
    PieChart,
    BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import MetaFinLogo from '../components/MetaFinLogo';

export default function Home() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        const removeVercelToolbar = () => {
            const toolbars = document.querySelectorAll('vercel-live-feedback, #__vercel-toolbar, .vercel-toolbar');
            toolbars.forEach(el => {
                el.style.display = 'none';
                el.remove();
            });
        };

        const observer = new MutationObserver(removeVercelToolbar);
        observer.observe(document.body, { childList: true, subtree: true });
        removeVercelToolbar();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, []);

    const plans = [
        {
            name: "Essencial",
            price: "R$ 0",
            period: "/sempre",
            desc: "O ponto de partida ideal para quem busca controle e organização manual com ferramentas profissionais.",
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
            price: "R$ 19,90",
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
            price: "R$ 49,90",
            period: "/mês",
            desc: "A solução definitiva para investidores e gestão de patrimônio de alta complexidade.",
            features: [
                "Tudo do Plano Premium",
                "Wealth Lab: Simuladores de Ativos",
                "Acesso a API para Desenvolvedores",
                "Mentoria Financeira Trimestral",
                "Funcionalidades Beta Exclusivas"
            ],
            buttonText: "Seja Elite",
            popular: false,
            variant: "secondary"
        }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden selection:bg-emerald-500/30 font-sans">
            {/* Subtle background for depth */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-500/[0.03] blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/[0.02] blur-[150px] rounded-full" />
            </div>

            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0f1e]/95 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl' : 'bg-transparent py-8'}`}>
                <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <MetaFinLogo className="h-8 w-auto text-white" />
                    </Link>

                    <div className="hidden lg:flex items-center gap-10">
                        {['Tecnologia', 'Funcionalidades', 'Segurança', 'Planos'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                                className="text-[13px] font-bold tracking-wide text-slate-100 hover:text-emerald-400 transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-[14px] font-bold text-white hover:text-emerald-400 transition-colors">
                            Entrar
                        </Link>
                        <Link to="/signup" className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[13px] font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                            Experimentar Grátis
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative pt-64 pb-40 px-6 z-10">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-10"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Infraestrutura Nexus IA Ativa</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-[5.5rem] font-extrabold tracking-tight leading-[1.1] text-white mb-10 text-balance"
                    >
                        O futuro da sua gestão <br />
                        <span className="text-emerald-500">financeira é aqui.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto leading-relaxed mb-16 font-medium text-balance"
                    >
                        Combine a potência do Open Finance com Inteligência Artificial
                        para antecipar movimentos e escalar seu patrimônio com segurança.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/signup" className="btn-clean-white w-full sm:w-auto min-w-[240px]">
                            Começar sua Jornada
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="#planos" className="btn-clean-secondary w-full sm:w-auto min-w-[240px] text-white">
                            Conhecer Planos
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Core Stats */}
            <section id="tecnologia" className="py-24 border-y border-white/10 bg-slate-900/40 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        {[
                            { val: "100k+", label: "Usuários Ativos" },
                            { val: "R$ 4.2B", label: "Patrimônio Integrado" },
                            { val: "256-bit", label: "Segurança de Elite" },
                            { val: "Nexus 4.0", label: "Engine Preditiva" }
                        ].map((stat, i) => (
                            <div key={i} className="space-y-2">
                                <p className="text-4xl font-bold text-white">{stat.val}</p>
                                <p className="text-[12px] font-bold uppercase tracking-widest text-slate-300">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="funcionalidades" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BarChart3 className="w-7 h-7 text-emerald-500" />,
                                title: "Análise Preditiva",
                                desc: "Otimize seu fluxo de caixa com algoritmos que aprendem seus padrões e previnem gastos desnecessários."
                            },
                            {
                                icon: <Layers className="w-7 h-7 text-emerald-500" />,
                                title: "Conexão Bancária",
                                desc: "Open Finance nativo para consolidar contas, cartões e investimentos em uma visão única e automática."
                            },
                            {
                                icon: <Shield className="w-7 h-7 text-emerald-500" />,
                                title: "Segurança Bancária",
                                desc: "Criptografia de ponta a ponta e conformidade com os mais rigorosos padrões de proteção de dados."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="clean-card group bg-[#0a0f1e] hover:bg-[#0f172a] border-white/10">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-8 border border-white/10 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-tight">{feature.title}</h3>
                                <p className="text-slate-300 leading-relaxed text-sm font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="planos" className="py-32 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">Domine seu capital.</h2>
                        <p className="text-slate-200 text-lg md:text-xl font-medium">Planos desenhados para todos os níveis de ambição.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {plans.map((plan, i) => (
                            <div key={i} className={`clean-card flex flex-col relative bg-[#0a0f1e] ${plan.popular ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/20' : 'border-white/10'}`}>
                                {plan.popular && (
                                    <div className="absolute top-8 right-8">
                                        <span className="bg-emerald-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                            Recomendado
                                        </span>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">{plan.name}</h3>
                                    <p className="text-slate-200 text-sm font-medium leading-relaxed">{plan.desc}</p>
                                </div>

                                <div className="mb-10 flex items-baseline gap-2">
                                    <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                                    <span className="text-slate-300 font-bold">{plan.period}</span>
                                </div>

                                <div className="space-y-4 mb-12 flex-1">
                                    {plan.features.map((feat, idx) => (
                                        <div key={idx} className="flex gap-3 text-slate-100 text-[13.5px] font-semibold items-center">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link to="/signup" className={plan.variant === 'primary' ? 'btn-clean-primary w-full' : 'btn-clean-secondary w-full'}>
                                    {plan.buttonText}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="pt-32 pb-16 px-6 border-t border-white/10 bg-[#060b18]">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16 mb-24">
                    <div className="md:col-span-1 space-y-6">
                        <MetaFinLogo className="h-7 w-auto" />
                        <p className="text-slate-300 text-sm leading-relaxed font-medium pr-8">
                            Referência em inteligência financeira integrada.
                            Tecnologia proprietária Nexus IA para sua liberdade.
                        </p>
                        <div className="flex gap-4">
                            {[Smartphone, Shield, Globe, Activity].map((Icon, i) => (
                                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer">
                                    <Icon className="w-4 h-4 text-slate-100" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {[
                        { title: "Empresa", links: ["Recursos", "Segurança", "Ajuda", "Contatos"] },
                        { title: "Plataforma", links: ["Painel Desktop", "App Móvel", "Desenvolvedores", "Status"] },
                        { title: "Jurídico", links: ["Privacidade", "Termos", "Cookies", "Compliance"] }
                    ].map((col, i) => (
                        <div key={i}>
                            <h4 className="text-white font-bold text-[13px] mb-8 uppercase tracking-widest">{col.title}</h4>
                            <ul className="space-y-4">
                                {col.links.map((link, idx) => (
                                    <li key={idx}>
                                        <a href="#" className="text-slate-300 hover:text-white transition-colors text-[14px] font-medium">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[11px] font-bold text-slate-400 tracking-[0.05em]">
                        © {new Date().getFullYear()} METAFIN GLOBAL OPERATIONS.
                    </p>
                    <div className="flex items-center gap-8">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                            <Shield className="w-4 h-4 text-emerald-500" /> Secure Encryption
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
