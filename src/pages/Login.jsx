import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { aiAPI } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import MetaFinLogo from '../components/MetaFinLogo'
import { ArrowRight, Lock } from 'lucide-react'
import { useForceDark } from '../hooks/useForceDark'

export default function Login() {
    useForceDark();
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
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden text-white font-sans selection:bg-emerald-500/30 antialiased">
            {/* Background elements matched with Landing Page */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-emerald-500/[0.04] blur-[160px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-500/[0.03] blur-[160px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>

            <div className="w-full max-w-md animate-fade-in z-10">
                {/* Logo Area */}
                <div className="text-center mb-10 space-y-4">
                    <div className="flex justify-center mb-4 transition-transform hover:scale-105 duration-300">
                        <MetaFinLogo className="h-10 w-auto" />
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-white/5 p-10 rounded-[3rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6)] backdrop-blur-3xl relative overflow-hidden">
                    {/* Interior glow for depth */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/[0.08] rounded-full blur-[80px] pointer-events-none" />

                    <div className="mb-10 relative z-10">
                        <h1 className="text-2xl font-bold text-white mb-2 text-center tracking-tight uppercase">Acesse sua conta</h1>
                        <p className="text-slate-400 text-sm font-medium text-center">Gestão patrimonial de elite em um só lugar.</p>
                    </div>

                    {/* Google Login Section */}
                    <div className="mb-10 relative z-10">
                        <div className="flex justify-center flex-col items-center">
                            <div className="w-full overflow-hidden rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-lg active:scale-[0.99] bg-black/20">
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
                            <div className="flex items-center gap-4 mt-8 w-full">
                                <span className="h-[1px] flex-1 bg-white/5"></span>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] whitespace-nowrap">
                                    Ou use seu ID MetaFin
                                </p>
                                <span className="h-[1px] flex-1 bg-white/5"></span>
                            </div>
                        </div>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label htmlFor="userId" className="block text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">
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
                                className="w-full px-6 py-4 rounded-2xl bg-slate-800/40 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/60 transition-all font-medium shadow-inner"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-5 py-3 text-xs font-bold text-rose-400 text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all active:scale-[0.98] shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                                    <span>Autenticando...</span>
                                </div>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Acessar Ecossistema <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center relative z-10">
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-[10px] font-black tracking-widest uppercase">
                            <Lock className="w-3.5 h-3.5 text-emerald-500/80" />
                            <span>Protocolo Nexus: 256-bit AES</span>
                        </div>
                    </div>
                </div>

                <p className="mt-10 text-center text-slate-500 text-xs font-bold">
                    Ainda não possui conta? <Link to="/signup" className="text-emerald-500 hover:text-emerald-400 transition-colors ml-1 uppercase tracking-wider">Cadastre-se para a elite</Link>
                </p>
            </div>
        </div>
    )
}
