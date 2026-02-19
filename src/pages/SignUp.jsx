import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, CheckCircle, Wallet, ArrowRight, Lock, Shield, UserPlus } from 'lucide-react';
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
    const strengthColor = ['bg-gray-600', 'bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-brand-500', 'bg-brand-400'][strength];

    const handleSubmit = async (e) => {
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

        if (isDemo) {
            navigate('/app');
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/[0.08] rounded-full blur-[120px] animate-float" />
                </div>

                <div className="w-full max-w-md text-center animate-fade-in z-10 glass-card border border-white/10 shadow-2xl p-8">
                    <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-brand-500/5 shadow-lg shadow-brand-500/20">
                        <CheckCircle className="w-10 h-10 text-brand-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                        Conta criada! 🎉
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-[80%] mx-auto leading-relaxed">
                        Enviamos um email de confirmação para <span className="text-white font-semibold">{email}</span>. Clique no link para ativar.
                    </p>
                    <Link
                        to="/login"
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 group"
                    >
                        <span>Fazer Login Agora</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/[0.05] rounded-full blur-[140px] animate-float" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/[0.05] rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[30%] right-[30%] w-[250px] h-[250px] bg-purple-500/[0.04] rounded-full blur-[100px] animate-pulse-slow" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.015]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">

                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center group-hover:scale-105 group-hover:shadow-brand-500/40 transition-all duration-300">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            SmartFinance
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Crie sua conta</h1>
                    <p className="text-gray-400">Junte-se a milhares de usuários no controle financeiro</p>
                </div>

                <div className="glass-card border border-white/10 shadow-2xl backdrop-blur-xl">

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 ml-1">Nome Completo</label>
                            <div className="relative group">
                                <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-400 transition-colors" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Como devemos te chamar?"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800/50 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 ml-1">Email</label>
                            <div className="relative group">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@melhoremail.com"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800/50 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 ml-1">Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-400 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-surface-800/50 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Password Strength Bar */}
                            {password.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-surface-700'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-[10px] font-medium ${strength <= 2 ? 'text-red-400' : strength <= 3 ? 'text-yellow-400' : 'text-brand-400'}`}>
                                        {strengthLabel}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Criando sua conta...</span>
                                </>
                            ) : (
                                <>
                                    <span>Começar Grátis</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-center text-gray-500 mt-6 px-4 leading-relaxed">
                        Ao se cadastrar, você concorda com nossos{' '}
                        <a href="#" className="text-gray-400 hover:text-white underline decoration-gray-700">Termos</a> e{' '}
                        <a href="#" className="text-gray-400 hover:text-white underline decoration-gray-700">Privacidade</a>.
                    </p>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Já possui uma conta?{' '}
                        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold hover:underline decoration-brand-500/30 underline-offset-4 transition-all">
                            Fazer Login
                        </Link>
                    </p>
                </div>

                {/* Trust badges */}
                <div className="mt-6 flex items-center justify-center gap-6 text-gray-600 text-xs">
                    <span className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> SSL 256-bit
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3" /> LGPD
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" /> 2FA Ready
                    </span>
                </div>
            </div>
        </div>
    );
}
