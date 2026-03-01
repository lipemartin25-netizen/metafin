import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { aiAPI } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import MetaFinLogo from '../components/MetaFinLogo'
import { ArrowLeft } from 'lucide-react'
import { useForceDark } from '../hooks/useForceDark'

export default function Login() {
    
    const navigate = useNavigate()
    const location = useLocation()
    const { user, loginWithToken } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (user) {
            const destination = location.state?.from || '/app'
            navigate(destination, { replace: true })
        }
    }, [user, navigate, location])

    async function handleLogin(e) {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        const formData = new FormData(e.target)
        const email = formData.get('email')?.trim()

        if (!email || email.length < 3) {
            setError('Por favor, insira um Email/ID válido.')
            setIsLoading(false)
            return
        }

        try {
            // In demo mode, we use the email string as the user ID for token generation
            const { token } = await aiAPI.getToken(email)
            loginWithToken(token)
            const destination = location.state?.from || '/app'
            navigate(destination, { replace: true })
        } catch (err) {
            setError(err.message || 'Falha na conexão com o servidor.')
        } finally {
            setIsLoading(false)
        }
    }

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

                <Link to="/" className="absolute top-8 left-6 lg:left-12 text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </Link>

                <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in">
                    <div>
                        <h1 className="text-4xl font-playfair font-bold text-[var(--text-primary)] mb-2 tracking-tight">Bem-vindo de volta</h1>
                        <p className="text-[var(--text-muted)] text-sm">Entre para acessar seu dashboard</p>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-sm text-rose-400 text-center">
                            {error}
                        </div>
                    )}

                    {/* Google Auth Button */}
                    <button
                        onClick={async () => {
                            setError('');
                            setIsLoading(true);
                            try {
                                const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: { redirectTo: `${window.location.origin}/app` }
                                });
                                if (error) throw error;
                            } catch (err) {
                                setError('Falha ao iniciar login com Google.');
                                setIsLoading(false);
                            }
                        }}
                        disabled={isLoading}
                        className="w-full py-3.5 bg-transparent border border-[var(--border-subtle)] hover:border-brand/40 hover:bg-[var(--bg-[var(--bg-elevated)])] text-[var(--text-primary)] font-medium rounded-lg transition-all flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar com Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-[var(--border-subtle)] flex-1"></div>
                        <span className="text-[var(--text-muted)] text-xs">ou</span>
                        <div className="h-px bg-[var(--border-subtle)] flex-1"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)]">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="text"
                                required
                                placeholder="seu@email.com"
                                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)]">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 btn-brand tracking-wide mt-2 flex justify-center items-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : "Entrar"}
                        </button>
                    </form>

                    <p className="text-center text-[var(--text-muted)] text-sm pt-4">
                        Não tem conta? <Link to="/signup" className="text-[var(--text-primary)] hover:text-[var(--menta-dark)] transition-colors font-medium">Criar conta</Link>
                    </p>
                </div>
            </div>

        </div>
    )
}
