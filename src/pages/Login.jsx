import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, Wallet, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { error: err } = await signIn(email, password);
            if (err) throw err;
            navigate('/app');
        } catch (err) {
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setGoogleLoading(true);
        setError('');
        try {
            await signInWithGoogle(credentialResponse.credential);
            navigate('/app');
        } catch (err) {
            console.error('Erro no Login Google:', err);
            setError(err.message || 'Erro ao entrar com Google');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] bg-brand-500/[0.08] rounded-full blur-[150px] animate-float" />
                <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] bg-blue-500/[0.08] rounded-full blur-[150px] animate-float" style={{ animationDelay: '3s' }} />
                <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-cyan-500/[0.05] rounded-full blur-[120px] animate-pulse-slow" />
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
                    <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta!</h1>
                    <p className="text-gray-400">Entre para gerenciar suas finanças</p>
                </div>

                <div className="glass-card border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">

                    {/* Google Sign-In */}
                    <div className="mb-6">
                        {googleLoading ? (
                            <div className="w-full py-3 rounded-xl bg-white/5 flex items-center justify-center gap-2 text-gray-400 text-sm animate-pulse border border-white/10">
                                <Loader2 className="w-4 h-4 animate-spin" /> Conectando Google...
                            </div>
                        ) : (
                            <div className="w-full flex justify-center google-btn-wrapper">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Erro no login com Google')}
                                    theme="filled_black"
                                    size="large"
                                    text="signin_with"
                                    shape="pill"
                                    locale="pt-BR"
                                    width="100%"
                                />
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">ou continue com email</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-400 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800/50 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 ml-1">Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-400 transition-colors" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface-800/50 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Entrar na Plataforma</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            Não tem uma conta?{' '}
                            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-semibold hover:underline decoration-brand-500/30 underline-offset-4 transition-all">
                                Criar conta grátis
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Trust badges */}
                <div className="mt-8 flex items-center justify-center gap-6 text-gray-600 text-xs">
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
