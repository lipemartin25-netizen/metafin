import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Eye, EyeOff, Loader2 } from 'lucide-react';
import { analytics } from '../hooks/useAnalytics';

export default function Login() {
    const { signIn, signInWithGoogle, isDemo } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: authError } = await signIn(email, password);

        if (authError) {
            setError(authError.message || 'Erro ao fazer login');
            setLoading(false);
            return;
        }

        analytics.login(isDemo ? 'demo' : 'email');
        navigate('/app');
    };

    const handleGoogleLogin = async () => {
        setError('');
        const { error: authError } = await signInWithGoogle();
        if (authError) {
            console.error('Full Google Auth Error:', authError);
            setError(`Erro Google: ${authError.message}`);
        } else {
            analytics.login('google');
        }
    };

    const handleDemoLogin = async () => {
        setLoading(true);
        await signIn('demo@smartfinance.com', 'demo');
        analytics.login('demo');
        navigate('/app');
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">SmartFinance</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Entre na sua conta para continuar
                    </p>
                </div>

                <div className="glass-card">
                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="input-field pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-sm text-gray-600">ou</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Google */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm font-medium mb-3"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continuar com Google
                    </button>

                    {/* Demo mode */}
                    <button
                        onClick={handleDemoLogin}
                        className="w-full py-3 rounded-xl border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5 transition-all text-sm font-medium"
                    >
                        🚀 Entrar em Modo Demo
                    </button>
                </div>

                {/* Sign up link */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Não tem conta?{' '}
                    <Link
                        to="/signup"
                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                        Criar conta grátis
                    </Link>
                </p>
            </div>
        </div>
    );
}
