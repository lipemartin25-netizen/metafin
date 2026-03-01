import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MetaFinLogo from '../components/MetaFinLogo';


export default function SignUp() {
    
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
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
        return () => observer.disconnect();
    }, []);

    const handleNextStep = (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Defina um nome para prosseguir.');
            return;
        }
        setStep(2);
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error: authError } = await signUp(email, password, name);
            if (authError) throw authError;

            setSuccess(true);
            setTimeout(() => navigate('/app'), 2000);
        } catch (err) {
            setError(err.message || 'Erro ao criar conta corporativa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans flex antialiased">

            {/* LEFT PANE - Tech Presentation (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-[var(--bg-[var(--bg-elevated)])] border-r border-[var(--border-subtle)] relative flex-col items-center justify-center overflow-hidden">
                {/* Background Grid */}
                <div className="tech-grid-bg opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-[var(--bg-elevated)])] via-transparent to-[var(--bg-[var(--bg-elevated)])] z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-[var(--bg-elevated)])] via-transparent to-[var(--bg-[var(--bg-elevated)])] z-10"></div>

                <div className="relative z-20 flex flex-col items-center text-center px-12 max-w-xl">
                    {/* Logo Badge */}
                    <div className="w-20 h-20 bg-[var(--menta-soft)] rounded-2xl flex items-center justify-center mb-8 border border-[var(--menta-border)] shadow-[0_0_30px_rgba(0,229,118,0.15)]">
                        <MetaFinLogo className="w-12 h-12 text-[var(--menta-dark)]" />
                    </div>

                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[var(--text-primary)] mb-4 tracking-tight">
                        MetaFin
                    </h2>
                    <p className="text-[var(--text-secondary)] text-lg mb-12 font-light">
                        Tecnologia financeira de próxima geração.<br />
                        Segura, inteligente e sofisticada.
                    </p>

                    {/* 2x2 Tech Badges */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="tech-card p-5 flex flex-col items-center justify-center">
                            <span className="text-[var(--menta-dark)] font-bold text-xl mb-1 font-playfair">256-bit</span>
                            <span className="text-[var(--text-muted)] text-sm">Encriptação</span>
                        </div>
                        <div className="tech-card p-5 flex flex-col items-center justify-center">
                            <span className="text-[var(--menta-dark)] font-bold text-xl mb-1 font-playfair">99.99%</span>
                            <span className="text-[var(--text-muted)] text-sm">Uptime</span>
                        </div>
                        <div className="tech-card p-5 flex flex-col items-center justify-center">
                            <span className="text-[var(--menta-dark)] font-bold text-xl mb-1 font-playfair">&lt; 50ms</span>
                            <span className="text-[var(--text-muted)] text-sm">Latência</span>
                        </div>
                        <div className="tech-card p-5 flex flex-col items-center justify-center">
                            <span className="text-[var(--menta-dark)] font-bold text-xl mb-1 font-playfair">SOC 2</span>
                            <span className="text-[var(--text-muted)] text-sm">Compliance</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANE - Form area */}
            <div className="flex-1 flex flex-col relative justify-center px-6 py-12 lg:px-24">

                {!success && (
                    <Link to="/" className="absolute top-8 left-6 lg:left-12 text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </Link>
                )}

                <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in">

                    {success ? (
                        <div className="text-center py-10 space-y-6">
                            <div className="w-20 h-20 bg-[var(--menta-soft)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                                <Sparkles className="w-10 h-10 text-[var(--menta-dark)]" />
                            </div>
                            <h2 className="text-3xl font-playfair font-bold text-[var(--text-primary)] tracking-tight">Bem-vindo, {name.split(' ')[0]}!</h2>
                            <p className="text-[var(--text-secondary)] font-medium text-balance">Configurando seu ambiente estruturado...</p>
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--menta-dark)] mx-auto mt-4" />
                        </div>
                    ) : (
                        <>
                            <div>
                                <h1 className="text-4xl font-playfair font-bold text-[var(--text-primary)] mb-2 tracking-tight">Crie sua conta</h1>
                                <p className="text-[var(--text-muted)] text-sm">
                                    {step === 1 ? 'Primeiro passo para o ecossistema MetaFin' : 'Defina suas credenciais de acesso'}
                                </p>
                            </div>

                            {error && (
                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-sm text-rose-400 text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    <motion.form
                                        key="s1"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        onSubmit={handleNextStep}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-[var(--text-primary)]">Nome Completo</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="ex: João Silva"
                                                required
                                                autoFocus
                                                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                            />
                                        </div>

                                        <button type="submit" className="w-full py-3.5 btn-brand tracking-wide flex justify-center items-center gap-2">
                                            Avançar <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </motion.form>
                                ) : (
                                    <motion.form
                                        key="s2"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        onSubmit={handleFinalSubmit}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-5">
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-medium text-[var(--text-primary)]">E-mail Corporativo</label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="ex: joao@empresa.com"
                                                    required
                                                    className="w-full px-4 py-3 rounded-lg bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-medium text-[var(--text-primary)]">Senha Forte</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Mínimo 6 caracteres"
                                                        required
                                                        className="w-full pl-4 pr-12 py-3 rounded-lg bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="px-5 py-3.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-[var(--bg-elevated)])] transition-all font-medium"
                                            >
                                                Voltar
                                            </button>
                                            <button type="submit" disabled={loading} className="flex-1 py-3.5 btn-brand flex justify-center items-center">
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : 'Criar Conta'}
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            <div className="mt-8 pt-8 border-t border-[var(--border-hover)] text-center">
                                <p className="text-[var(--text-muted)] text-sm">
                                    Já possui conta? <Link to="/login" className="text-[var(--text-primary)] hover:text-[var(--menta-dark)] transition-colors font-medium">Entrar no painel</Link>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
