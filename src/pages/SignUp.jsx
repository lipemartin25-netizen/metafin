import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Lock, Sparkles, MoveRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analytics } from '../hooks/useAnalytics';

export default function SignUp() {
    const { signUp, isDemo } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState(1); // 1 = Name, 2 = Credentials

    // Password strength
    const getStrength = (pwd) => {
        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 10) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strength = getStrength(password);
    const strengthLabel = ['', 'Fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'][strength] || '';
    const strengthColor = ['bg-gray-400 dark:bg-gray-600', 'bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-brand-500', 'bg-brand-400'][strength];

    const handleNextStep = (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Por favor, defina um nome.');
            return;
        }
        setStep(2);
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
        }

        const { error: authError } = await signUp(email, password, name);

        if (authError) {
            setError(authError.message || 'Erro ao criar conta');
            setLoading(false);
            return;
        }

        analytics.signUp(isDemo ? 'demo' : 'email');

        // Frictionless: Mostra sucesso na tela e depois leva pr'o app
        setSuccess(true);
        setLoading(false);

        // Auto-redirect para o dashboard cortando login (simulando que está authed logado)
        setTimeout(() => {
            navigate('/app');
        }, 2000);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/[0.08] rounded-full blur-[120px] animate-float" />
                </div>

                <div className="w-full max-w-md text-center animate-fade-in z-10 glass-card bg-white/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-2xl p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10, stiffness: 100 }} className="w-24 h-24 bg-gradient-to-tr from-brand-600 to-accent rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-brand-500/10 shadow-[0_0_40px_rgba(57,255,20,0.4)] relative z-10">
                        <Sparkles className="w-12 h-12 text-surface-950" />
                    </motion.div>
                    <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight drop-shadow-sm">
                        Bem-vindo, {name.split(' ')[0]}!
                    </motion.h2>
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-gray-500 dark:text-gray-400 mb-8 max-w-[80%] mx-auto leading-relaxed">
                        Sua conta de alta-performance está montada. Entrando no painel...
                    </motion.p>

                    <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Preparando seu setup</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Animated Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-100">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/[0.05] rounded-full blur-[140px] animate-float" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/[0.05] rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[30%] right-[30%] w-[250px] h-[250px] bg-purple-500/[0.04] rounded-full blur-[100px] animate-pulse-slow" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.015]" style={{
                    backgroundImage: 'linear-gradient(rgba(100,100,100,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">

                {/* Header */}
                <div className="text-center mb-8 relative z-10">
                    <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(57,255,20,0.3)] group-hover:scale-105 transition-all duration-300 border border-brand-500/30 bg-black/50">
                            <img src="/metafin-logo.png" alt="MetaFin Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xl font-black text-gray-900 dark:text-white bg-clip-text text-transparent dark:bg-gradient-to-r dark:from-white dark:to-gray-400 tracking-tight">
                            MetaFin
                        </span>
                    </Link>

                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight drop-shadow-sm">
                        {step === 1 ? 'Como te chamamos?' : `Ótimo nome, ${name.split(' ')[0]}!`}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium max-w-[280px] mx-auto leading-relaxed text-sm">
                        {step === 1 ? 'O primeiro passo para dominar seu futuro financeiro.' : 'Falta pouco. Proteja sua conta corporativa.'}
                    </p>
                </div>

                <div className="glass-card bg-white/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_-10px_rgba(6,182,212,0.1)] backdrop-blur-2xl p-8 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-colors" />

                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-shake mb-6">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="relative overflow-hidden min-h-[180px]">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.form
                                    key="step1"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    onSubmit={handleNextStep}
                                    className="space-y-6 absolute w-full"
                                >
                                    <div className="space-y-2">
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Nome Completo ou Apelido"
                                                required
                                                autoFocus
                                                autoComplete="name"
                                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-surface-900 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all font-medium shadow-inner dark:shadow-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-bold tracking-wide shadow-lg border-2 border-transparent transition-all flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <span>Continuar</span>
                                        <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.form>
                            )}

                            {step === 2 && (
                                <motion.form
                                    key="step2"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    onSubmit={handleFinalSubmit}
                                    className="space-y-5 absolute w-full"
                                >
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Seu melhor E-mail logável"
                                                required
                                                autoFocus
                                                autoComplete="email"
                                                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-surface-900 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all font-medium shadow-inner dark:shadow-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="relative group">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Escolha sua senha forte"
                                                    required
                                                    minLength={6}
                                                    autoComplete="new-password"
                                                    className="w-full pl-5 pr-12 py-3.5 rounded-2xl bg-gray-50 dark:bg-surface-900 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all font-medium shadow-inner dark:shadow-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            {/* Password Strength Indicator */}
                                            {password.length > 0 && (
                                                <div className="pt-1">
                                                    <div className="flex gap-1.5 h-1.5 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-surface-800">
                                                        <div className={`h-full transition-all duration-300 ${strength >= 1 ? strengthColor : 'transparent'}`} style={{ width: '20%' }} />
                                                        <div className={`h-full transition-all duration-300 ${strength >= 2 ? strengthColor : 'transparent'}`} style={{ width: '20%' }} />
                                                        <div className={`h-full transition-all duration-300 ${strength >= 3 ? strengthColor : 'transparent'}`} style={{ width: '20%' }} />
                                                        <div className={`h-full transition-all duration-300 ${strength >= 4 ? strengthColor : 'transparent'}`} style={{ width: '20%' }} />
                                                        <div className={`h-full transition-all duration-300 ${strength >= 5 ? strengthColor : 'transparent'}`} style={{ width: '20%' }} />
                                                    </div>
                                                    <p className={`text-[10px] uppercase font-bold tracking-wider mt-2 flex justify-between ${strength <= 2 ? 'text-red-500 dark:text-red-400' : strength <= 3 ? 'text-yellow-500 dark:text-yellow-400' : 'text-brand-600 dark:text-brand-400'}`}>
                                                        <span>{strengthLabel}</span>
                                                        {strength >= 4 && <span className="text-brand-500">✓ Perfeita</span>}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-4 py-4 rounded-2xl bg-gray-100 dark:bg-surface-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-accent hover:from-brand-500 hover:to-accent text-surface-950 font-black tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(57,255,20,0.5)] border border-brand-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-surface-950" />
                                            ) : (
                                                <>
                                                    <span className="uppercase">Acessar Painel</span>
                                                    <Lock className="w-4 h-4 text-surface-950 opacity-50" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="mt-8 text-center animate-fade-in relative z-10">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        Já tem acesso corporativo?{' '}
                        <Link to="/login" className="text-brand-600 dark:text-brand-400 font-bold hover:text-brand-500 dark:hover:text-brand-300 hover:underline decoration-brand-500/30 underline-offset-4 transition-all">
                            Faça Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
