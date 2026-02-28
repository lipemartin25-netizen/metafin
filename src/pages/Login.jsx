import { tw } from '@/lib/theme';
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { aiAPI } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import MetaFinLogo from '../components/MetaFinLogo'
import { ArrowRight, Lock } from 'lucide-react'
import { useForceDark } from '../hooks/useForceDark'

export default function Login() {
    useForceDark();
    const navigate = useNavigate()
    const location = useLocation()
    const { user, loginWithToken } = useAuth()
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



    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden text-white font-sans selection:bg-purple-500/30 antialiased">
            {/* Background elements matched with Landing Page */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-purple-500/[0.04] blur-[160px] rounded-full" />
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
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/[0.08] rounded-full blur-[80px] pointer-events-none" />

                    <div className="mb-10 relative z-10">
                        <h1 className="text-2xl font-bold text-white mb-2 text-center tracking-tight uppercase">Acesse sua conta</h1>
                        <p className="text-slate-400 text-sm font-medium text-center">Gestão patrimonial de elite em um só lugar.</p>
                    </div>

                    {/* Custom Google Login Section */}
                    <div className="mb-10 relative z-10">
                        <div className="flex justify-center flex-col items-center">
                            <button
                                onClick={async () => {
                                    setError('');
                                    setIsLoading(true);
                                    try {
                                        const { error } = await supabase.auth.signInWithOAuth({
                                            provider: 'google',
                                            options: {
                                                redirectTo: `${window.location.origin}/app`
                                            }
                                        });
                                        if (error) throw error;
                                    } catch (err) {
                                        setError('Falha ao iniciar login com Google.');
                                        console.error(err);
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading}
                                className="w-full py-4 bg-gray-800/40 hover:bg-slate-100 text-slate-900 font-extrabold rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-white/5 flex items-center justify-center gap-3 group mb-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                <span>Continuar com Google</span>
                            </button>

                            <div className="flex items-center gap-4 mt-8 w-full">
                                <span className="h-[1px] flex-1 bg-gray-800/40/5"></span>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] whitespace-nowrap">
                                    Ou use seu ID MetaFin
                                </p>
                                <span className="h-[1px] flex-1 bg-gray-800/40/5"></span>
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
                                className="w-full px-6 py-4 rounded-2xl bg-slate-800/40 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-slate-800/60 transition-all font-medium shadow-inner"
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
                            className="w-full py-4 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black rounded-2xl transition-all active:scale-[0.98] shadow-2xl shadow-purple-500/20 flex items-center justify-center gap-2 group"
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
                            <Lock className="w-3.5 h-3.5 text-purple-500/80" />
                            <span>Protocolo Nexus: 256-bit AES</span>
                        </div>
                    </div>
                </div>

                <p className="mt-10 text-center text-slate-500 text-xs font-bold">
                    Ainda não possui conta? <Link to="/signup" className="text-purple-500 hover:text-purple-400 transition-colors ml-1 uppercase tracking-wider">Cadastre-se para a elite</Link>
                </p>
            </div>
        </div>
    )
}
