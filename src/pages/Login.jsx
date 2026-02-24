import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { aiAPI } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import MetaFinLogo from '../components/MetaFinLogo'
import { Shield, Sparkles } from 'lucide-react'

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
            setError('Digite um ID de usuário válido (mínimo 3 caracteres)')
            setIsLoading(false)
            return
        }

        try {
            const { token } = await aiAPI.getToken(userId)
            loginWithToken(token)
            const destination = location.state?.from || '/app'
            navigate(destination, { replace: true })
        } catch (err) {
            setError(err.message || 'Erro ao fazer login. Verifique sua conexão.')
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
            setError('Falha na autenticação Google. Tente novamente.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden text-white">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-500/5 blur-[150px] rounded-full" />
            </div>

            <div className="w-full max-w-md bg-[#0a0f1e]/80 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] shadow-2xl relative z-10 animate-fade-in">
                {/* Logo / Header */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-8">
                        <MetaFinLogo className="h-12 w-auto" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                        <span>Secure Nexus Login</span>
                    </div>
                </div>

                {/* Google Login Section */}
                <div className="mb-8">
                    <div className="flex justify-center flex-col items-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Erro ao conectar com Google')}
                            useOneTap
                            theme="filled_black"
                            shape="pill"
                            width="100%"
                            text="signin_with"
                        />
                        <p className="text-[9px] text-slate-400 mt-4 uppercase font-black tracking-widest flex items-center gap-2">
                            <Shield className="w-3 h-3 text-emerald-500/50" /> Suporte a login nativo seguro
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="relative flex items-center gap-4 mb-8">
                    <div className="flex-1 h-[1px] bg-white/5" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ou ID de acesso</span>
                    <div className="flex-1 h-[1px] bg-white/5" />
                </div>

                {/* Formulário */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                        <label
                            htmlFor="userId"
                            className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1"
                        >
                            Identificação Pessoal
                        </label>
                        <input
                            id="userId"
                            name="userId"
                            type="text"
                            required
                            minLength={3}
                            maxLength={100}
                            autoComplete="username"
                            placeholder="DIRETO / E-MAIL"
                            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm font-bold tracking-widest"
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest text-rose-400 animate-shake">
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black transition-all hover:scale-[1.02] shadow-xl shadow-emerald-500/10"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                <span className="uppercase tracking-widest text-xs">Authenticating...</span>
                            </div>
                        ) : (
                            <span className="uppercase tracking-[0.2em] text-xs font-black">Inicializar Sistema</span>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest">
                        Protocolo de Segurança Ativo <span className="text-emerald-500 mx-2">•</span> 256-BIT AES
                    </p>
                </div>
            </div>
        </div>
    )
}
