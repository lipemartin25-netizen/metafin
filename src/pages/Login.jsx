import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { aiAPI } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import MetaFinLogo from '../components/MetaFinLogo'
import { Shield, Sparkles, Lock } from 'lucide-react'

export default function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const { loginWithToken, signInWithGoogle } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
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

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('mf_auth_token')
        if (token) {
            const destination = location.state?.from || '/app'
            navigate(destination, { replace: true })
        }
    }, [navigate, location])

    async function handleLogin(e) {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        const formData = new FormData(e.target)
        const userId = formData.get('userId')?.trim()

        if (!userId || userId.length < 3) {
            setError('Por favor, insira uma identificação válida.')
            setIsLoading(false)
            return
        }

        try {
            const { token } = await aiAPI.getToken(userId)
            loginWithToken(token)
            const destination = location.state?.from || '/app'
            navigate(destination, { replace: true })
        } catch (err) {
            setError(err.message || 'Falha na conexão com o servidor.')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleGoogleSuccess(response) {
        setError('')
        setIsLoading(true)
        try {
            await signInWithGoogle(response.credential)
            const destination = location.state?.from || '/app'
            navigate(destination, { replace: true })
        } catch (err) {
            setError('Não foi possível autenticar com o Google.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden text-white font-sans">
            {/* Subtle high-end background */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md animate-fade-in z-10">
                {/* Logo Area */}
                <div className="text-center mb-10 space-y-4">
                    <div className="flex justify-center mb-4">
                        <MetaFinLogo className="h-10 w-auto" />
                    </div>
                </div>

                <div className="bg-[#0a0f1e] border border-white/10 p-10 rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2 text-center">Acesse sua conta</h1>
                        <p className="text-slate-400 text-sm font-medium text-center">Bem-vindo ao ecossistema MetaFin.</p>
                    </div>

                    {/* Google Login Section */}
                    <div className="mb-8">
                        <div className="flex justify-center flex-col items-center">
                            <div className="w-full overflow-hidden rounded-xl border border-white/10 hover:border-white/20 transition-all">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Erro na conexão com o Google')}
                                    useOneTap
                                    theme="filled_black"
                                    shape="square"
                                    width="100%"
                                    text="continue_with"
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-6">
                                <span className="h-[1px] w-8 bg-white/10"></span>
                                <p className="text-[11px] text-slate-500 uppercase font-bold tracking-[0.1em]">
                                    Ou use seu ID de acesso
                                </p>
                                <span className="h-[1px] w-8 bg-white/10"></span>
                            </div>
                        </div>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="userId" className="block text-xs font-bold text-slate-300 ml-1">
                                Identificação (E-mail ou ID)
                            </label>
                            <input
                                id="userId"
                                name="userId"
                                type="text"
                                required
                                minLength={3}
                                maxLength={100}
                                autoComplete="username"
                                placeholder="ex: usuario.metafin"
                                className="input-clean"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-5 py-3 text-xs font-bold text-rose-400 text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-clean-primary"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                                    <span>Verificando...</span>
                                </div>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Acessar Plataforma <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px] font-bold tracking-wide">
                            <Lock className="w-3.5 h-3.5 text-emerald-500" />
                            <span>PROTOCOLO DE SEGURANÇA NEXUS ATIVO</span>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-500 text-xs font-medium">
                    Ainda não possui conta? <Link to="/signup" className="text-emerald-500 hover:text-emerald-400 font-bold transition-colors">Cadastre-se grátis</Link>
                </p>
            </div>
        </div>
    )
}
