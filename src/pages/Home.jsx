import { Link } from 'react-router-dom';
import { ArrowRight, Wallet, Shield, Zap, TrendingUp, PieChart, Clock, Smartphone, Globe, Lock, CheckCircle2, Sparkles, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
    return (
        <div className="min-h-screen bg-white text-gray-800 selection:bg-mobills-purple/10 overflow-x-hidden">
            {/* Header / Nav */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#2B1464] text-white shadow-lg">
                <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-mobills-yellow flex items-center justify-center shadow-md">
                            <Wallet className="w-6 h-6 text-[#2B1464]" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight lowercase">metafin</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-10">
                        {['Recursos', 'Segurança', 'Planos', 'Ajuda'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold hover:text-mobills-yellow transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm font-bold hover:text-mobills-yellow transition-colors">
                            Entrar
                        </Link>
                        <Link to="/signup" className="px-6 py-2.5 bg-mobills-yellow hover:bg-mobills-yellow-hover text-[#2B1464] text-sm font-black rounded-full transition-all hover:scale-105 shadow-xl">
                            Teste Grátis
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center space-y-8 max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest"
                        >
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            <span>PROTOCOL NEXUS 2024 ACTIVE</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-[#2B1464]"
                        >
                            A melhor solução para uma <br />
                            <span className="text-mobills-purple">
                                vida financeira saudável.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
                        >
                            Conecte seus bancos via Open Finance, gerencie cartões virtuais em 3D
                            e tome decisões guiadas por nossa IA avançada. O próximo nível do seu patrimônio.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6"
                        >
                            <Link to="/signup" className="px-10 py-5 bg-mobills-yellow hover:bg-mobills-yellow-hover text-[#2B1464] font-black rounded-full transition-all transform hover:scale-105 shadow-2xl flex items-center gap-3">
                                <span className="uppercase tracking-widest text-xs">Começar Grátis</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button className="px-10 py-5 bg-white border-2 border-mobills-purple text-mobills-purple font-black rounded-full hover:bg-mobills-purple hover:text-white transition-all">
                                <span className="uppercase tracking-widest text-xs">Saiba Mais</span>
                            </button>
                        </motion.div>

                        {/* Social Proof */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="pt-12 flex flex-wrap justify-center items-center gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all"
                        >
                            <div className="flex items-center gap-2 font-bold text-xl"><Shield className="w-6 h-6" /> SEGURANÇA</div>
                            <div className="flex items-center gap-2 font-bold text-xl"><Zap className="w-6 h-6" /> VELOCIDADE</div>
                            <div className="flex items-center gap-2 font-bold text-xl"><Smartphone className="w-6 h-6" /> MOBILE</div>
                            <div className="flex items-center gap-2 font-bold text-xl"><Globe className="w-6 h-6" /> GLOBAL</div>
                        </motion.div>
                    </div>

                    {/* App Preview Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="mt-20 relative px-4"
                    >
                        <div className="max-w-5xl mx-auto bg-gray-50 rounded-[2.5rem] p-4 shadow-2xl border border-gray-100 overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000"
                                alt="App Dashboard Preview"
                                className="w-full h-full object-cover rounded-[2rem]"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="recursos" className="py-32 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20 space-y-4 text-center">
                        <h2 className="text-4xl font-black text-[#2B1464]">Controle suas finanças em um só lugar.</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">Cuidar do seu dinheiro pode ser simples. Com nosso gerenciador, você organiza e planeja sua vida financeira em um único lugar.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Globe className="w-8 h-8" />,
                                title: "Conecte suas contas",
                                desc: "Saiba exatamente para onde seu dinheiro está indo com nossa integração automática Open Finance."
                            },
                            {
                                icon: <TrendingUp className="w-8 h-8" />,
                                title: "Planeje seus gastos",
                                desc: "Faça orçamentos mensais, mantenha seus gastos sob controle para juntar dinheiro e alcançar seus sonhos."
                            },
                            {
                                icon: <Shield className="w-8 h-8" />,
                                title: "Segurança total",
                                desc: "Seus dados são protegidos com os mesmos padrões de segurança dos grandes bancos."
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100 group transition-all"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-mobills-purple/5 flex items-center justify-center text-mobills-purple mb-8 group-hover:bg-mobills-purple group-hover:text-white transition-all duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4 text-[#2B1464]">{feature.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="planos" className="py-32 bg-gray-900/20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                        <h2 className="text-4xl font-black">ESCOLHA SEU NIVEL.</h2>
                        <p className="text-gray-400">Comece sem custos ou escalone para o Pro e desbloqueie o poder da nossa IA financeira.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Free Tier */}
                        <div className="p-8 bg-gray-900/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                            <div className="mb-8">
                                <h3 className="text-xl font-bold">Standard</h3>
                                <p className="text-gray-400 text-sm">Essencial para sua base.</p>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black">Grátis</span>
                                    <span className="text-gray-500 text-sm">/sempre</span>
                                </div>
                            </div>
                            <div className="space-y-4 mb-8">
                                {['Até 3 contas bancárias', 'Dashboard básico', 'Exportação CSV', 'Suporte via Chat'].map(f => (
                                    <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {f}
                                    </div>
                                ))}
                            </div>
                            <Link to="/signup" className="block w-full py-4 bg-gray-800 text-center font-bold rounded-2xl hover:bg-gray-700 transition-colors">
                                Selecionar Plano
                            </Link>
                        </div>

                        {/* Pro Tier */}
                        <div className="p-8 bg-emerald-500 text-[#020617] rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-emerald-500/20 group">
                            <div className="absolute top-0 right-0 p-4">
                                <div className="bg-black/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/5">Mais Escolhido</div>
                            </div>
                            <div className="mb-8">
                                <h3 className="text-xl font-bold">Premium</h3>
                                <p className="text-[#020617]/70 text-sm">O arsenal completo.</p>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black">R$ 29</span>
                                    <span className="text-[#020617]/70 text-sm">/mês</span>
                                </div>
                            </div>
                            <div className="space-y-4 mb-8">
                                {[
                                    'Contas ilimitadas via Pluggy',
                                    'Análise Preditiva de IA (NEXUS)',
                                    'Dashboard Ultra-Consolidado',
                                    'Múltiplos Cartões Virtuais',
                                    'Suporte Prioritário 24/7'
                                ].map(f => (
                                    <div key={f} className="flex items-center gap-3 text-sm font-bold">
                                        <CheckCircle2 className="w-4 h-4 text-[#020617]" /> {f}
                                    </div>
                                ))}
                            </div>
                            <Link to="/signup" className="block w-full py-4 bg-gray-950 text-white text-center font-bold rounded-2xl hover:bg-black transition-colors shadow-xl">
                                Assinar Agora
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 px-4 bg-[#01040f]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="max-w-xs space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-[#020617]" />
                            </div>
                            <span className="font-bold text-lg">metafin</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            O hub definitivo para gestão de patrimônio inteligente.
                            Conecte, analise e cresça com o ecossistema financeiro do futuro.
                        </p>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-gray-900 border border-white/5 flex items-center justify-center hover:bg-emerald-500 transition-colors group cursor-pointer">
                                <Globe className="w-4 h-4 group-hover:text-black" />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-gray-900 border border-white/5 flex items-center justify-center hover:bg-emerald-500 transition-colors group cursor-pointer">
                                <Smartphone className="w-4 h-4 group-hover:text-black" />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-gray-900 border border-white/5 flex items-center justify-center hover:bg-emerald-500 transition-colors group cursor-pointer">
                                <Lock className="w-4 h-4 group-hover:text-black" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-6">Plataforma</h4>
                            <ul className="space-y-4 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-white transition-colors">Open Finance</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Segurança Bancária</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Nexus AI</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Download App</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-6">Companhia</h4>
                            <ul className="space-y-4 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">SAC / Ouvidoria</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} metafin. Feito com 💚 no Brasil.
                    </p>
                    <div className="flex items-center gap-6 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> São Paulo, Brasil</span>
                        <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> AWS SECURE CLOUD</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
