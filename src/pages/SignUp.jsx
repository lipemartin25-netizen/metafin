import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
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
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center animate-fade-in">
                    <div className="glass-card">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">
                            Conta criada com sucesso!
                        </h2>
                        <p className="text-gray-400 mb-6">
                            Enviamos um email de confirmação para{' '}
                            <span className="text-white font-medium">{email}</span>. Clique
                            no link para ativar sua conta.
                        </p>
                        <Link
                            to="/login"
                            className="gradient-btn inline-block"
                        >
                            Ir para Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">SmartFinance</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Criar sua conta</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Comece a controlar suas finanças hoje
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
                            <label className="block text-sm text-gray-400 mb-1">Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome completo"
                                required
                                className="input-field"
                            />
                        </div>

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
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
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
                                    Criando conta...
                                </>
                            ) : (
                                'Criar Conta Grátis'
                            )}
                        </button>
                    </form>

                    {/* Terms */}
                    <p className="text-xs text-gray-600 mt-4 text-center">
                        Ao criar conta, você concorda com os{' '}
                        <span className="text-gray-400 cursor-pointer hover:text-white">
                            Termos de Uso
                        </span>{' '}
                        e{' '}
                        <span className="text-gray-400 cursor-pointer hover:text-white">
                            Política de Privacidade
                        </span>
                    </p>
                </div>

                {/* Login link */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Já tem conta?{' '}
                    <Link
                        to="/login"
                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                        Fazer login
                    </Link>
                </p>
            </div>
        </div>
    );
}
