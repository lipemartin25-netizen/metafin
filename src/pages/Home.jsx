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
    ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import MetaFinLogo from '../components/MetaFinLogo';

export default function Home() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        // Robust Vercel Toolbar Removal
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
            desc: "Ideal para começar a organizar sua vida financeira de forma manual.",
            features: [
                "Dashboard consolidado",
                "Lançamentos manuais ilimitados",
                "Metas financeiras básicas",
                "Relatórios mensais simplificados",
                "Suporte via comunidade"
            ],
            buttonText: "Começar Grátis",
            popular: false,
            highlight: "bg-surface-900/50 border-white/5"
        },
        {
            name: "Premium",
            price: "R$ 19,90",
            period: "/mês",
            desc: "A experiência completa com monitoramento automático e IA.",
            features: [
                "Conexão bancária automática (Open Finance)",
                "Nexus IA: Insights inteligentes",
                "Gestão de cartões ultra-avançada",
                "Categorização automática com Machine Learning",
                "Suporte prioritário"
            ],
            buttonText: "Assinar Premium",
            popular: true,
            highlight: "bg-emerald-500/10 border-emerald-500/20"
        },
        {
            name: "Elite",
            price: "R$ 49,90",
            period: "/mês",
            desc: "Para quem busca excelência e gestão patrimonial sofisticada.",
            features: [
                "Tudo do plano Premium",
                "Laboratório Wealth: Simulações avançadas",
                "Webhooks & API para desenvolvedores",
                "Assessoria exclusiva trimestral",
                "Acesso antecipado a novas funções"
            ],
            buttonText: "Seja Elite",
            popular: false,
            highlight: "bg-brand-500/10 border-brand-500/20"
        }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-emerald-500/20 overflow-x-hidden">
            {/* Mesh Background for depth */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full" />
            </div>

            {/* Header / Nav */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
                <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <MetaFinLogo className="h-9 w-auto" />
                    </Link>

                    <div className="hidden lg:flex items-center gap-10">
                        {['Recursos', 'Tecnologia', 'Segurança', 'Planos'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 hover:text-emerald-400 transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">
                            Login
                        </Link>
                        <Link to="/signup" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/20">
                            Get Started
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative pt-48 pb-32 px-4 z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-10 max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            <span>Powered by Nexus AI Technology</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white"
                        >
                            Inteligência que <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-brand-400">
                                escala seu patrimônio.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-100 max-w-3xl mx-auto leading-relaxed font-medium"
                        >
                            A MetaFin não apenas rastreia, ela antecipa. Combine Open Finance
                            com análise preditiva de última geração para tomar as melhores
                            decisões financeiras da sua vida.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
                        >
                            <Link to="/signup" className="group px-10 py-6 bg-white text-black font-black rounded-[2rem] transition-all transform hover:scale-105 shadow-2xl flex items-center gap-3">
                                <span className="uppercase tracking-[0.2em] text-[10px]">Abrir conta gratuita</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#planos" className="px-10 py-6 bg-white/5 border border-white/10 text-white font-black rounded-[2rem] hover:bg-white/10 transition-all">
                                <span className="uppercase tracking-[0.2em] text-[10px]">Ver planos premium</span>
                            </a>
                        </motion.div>
                    </div>

                    {/* App Preview Window */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="mt-32 relative group"
                    >
                        <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
                        <div className="max-w-6xl mx-auto bg-[#0a0f1e] rounded-[3rem] p-3 shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)] border border-white/10 overflow-hidden relative z-10">
                            {/* Window Header */}
                            <div className="h-10 border-b border-white/5 flex items-center px-6 gap-2 bg-white/[0.02]">
                                <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                                <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                                <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                            </div>
                            <img
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000"
                                alt="MetaFin Interface"
                                className="w-full grayscale hover:grayscale-0 transition-all duration-1000"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Stats Section */}
            <section id="tecnologia" className="py-20 z-10 relative border-y border-white/5 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        <div>
                            <p className="text-3xl font-black text-emerald-400">100k+</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Usuários Ativos</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-brand-400">BRL 2B+</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Patrimônio Gerido</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-emerald-400">99.9%</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Uptime Bancário</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-brand-400">256-bit</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Criptografia AES</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Deep Tech Features Grid */}
            <section id="recursos" className="py-32 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Cpu className="w-6 h-6" />,
                                title: "Nexus IA Core",
                                desc: "Algoritmos de rede neural que analisam seu padrão de consumo e sugerem otimizações em tempo real.",
                                color: "text-emerald-400",
                                border: "border-emerald-500/10"
                            },
                            {
                                icon: <Layers className="w-6 h-6" />,
                                title: "Open Finance Multi-Tier",
                                desc: "Conexão direta com mais de 50 instituições financeiras para uma visão 360 do seu capital.",
                                color: "text-brand-400",
                                border: "border-brand-500/10"
                            },
                            {
                                icon: <Shield className="w-6 h-6" />,
                                title: "Security Matrix",
                                desc: "Proteção de nível militar para todos os seus dados e transações, com auditoria constante.",
                                color: "text-white",
                                border: "border-white/10"
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -8 }}
                                className={`bg-[#0a0f1e] p-10 rounded-[2.5rem] border ${feature.border} group transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5`}
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${feature.color} mb-8 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-black mb-4 uppercase tracking-tighter">{feature.title}</h3>
                                <p className="text-slate-200 text-sm leading-relaxed font-medium">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Professional Pricing Section */}
            <section id="planos" className="py-32 px-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[800px] bg-brand-500/5 blur-[150px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-24">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">Escolha sua jornada.</h2>
                        <p className="text-slate-100 font-medium font-bold">Planos desenhados para todos os níveis de ambição financeira.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-10 rounded-[3rem] border ${plan.highlight} flex flex-col group relative overflow-hidden`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-6 right-10">
                                        <div className="bg-emerald-500 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">Recomendado</div>
                                    </div>
                                )}

                                <div className="mb-10">
                                    <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{plan.name}</h3>
                                    <p className="text-slate-200 text-xs font-bold leading-relaxed">{plan.desc}</p>
                                </div>

                                <div className="mb-10 flex items-baseline gap-2">
                                    <span className="text-4xl font-black">{plan.price}</span>
                                    <span className="text-slate-400 text-sm font-bold">{plan.period}</span>
                                </div>

                                <div className="space-y-4 mb-12 flex-1">
                                    {plan.features.map(f => (
                                        <div key={f} className="flex items-start gap-3 text-xs font-bold text-gray-200">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    to="/signup"
                                    className={`w-full py-5 text-center text-[10px] font-black uppercase tracking-[0.3em] rounded-[2rem] transition-all ${plan.popular
                                        ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-xl shadow-emerald-500/20'
                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'
                                        }`}
                                >
                                    {plan.buttonText}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modern Footer */}
            <footer className="py-24 border-t border-white/5 px-6 relative z-10 bg-[#01030a]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                    <div className="space-y-8 col-span-1 lg:col-span-1">
                        <MetaFinLogo className="h-8 w-auto opacity-80" />
                        <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs">
                            Elevando a gestão de patrimônio ao estado da arte.
                            Tecnologia proprietária Nexus AI integrada ao Open Finance global.
                        </p>
                        <div className="flex gap-4">
                            {[Globe, Smartphone, Shield, Activity].map((Icon, i) => (
                                <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-emerald-500 group transition-all cursor-pointer">
                                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-black" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-8">Ecossistema</h4>
                        <ul className="space-y-4 text-xs font-bold text-slate-400">
                            <li><a href="#" className="hover:text-white transition-colors">Nexus Intelligent Engine</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Open Finance Connect</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Wealth Matrix Simulator</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Mobile Experience</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-8">Transparência</h4>
                        <ul className="space-y-4 text-xs font-bold text-slate-400">
                            <li><a href="#" className="hover:text-white transition-colors">Políticas de Privacidade</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Compliance Financeiro</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Socorro & Suporte</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Status do Sistema</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-8">Newsletter Tech</h4>
                        <p className="text-slate-400 text-[10px] font-bold mb-4">Receba insights semanais da Nexus IA.</p>
                        <div className="flex gap-2">
                            <input type="email" placeholder="E-mail" className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs w-full focus:outline-none focus:border-emerald-500/50" />
                            <button className="bg-emerald-500 p-2 rounded-xl text-black hover:bg-emerald-400">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                        © {new Date().getFullYear()} METAFIN GLOBAL OPERATIONS.
                    </p>
                    <div className="flex items-center gap-8 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2 hover:text-emerald-500 transition-colors pointer-events-auto cursor-pointer"><Globe className="w-3 h-3" /> LATAM REGION</span>
                        <span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> NEXUS V4.2 CORE</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
