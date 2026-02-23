// src/pages/Login.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { aiAPI } from '../lib/apiClient'
import { useAuth } from '../contexts/AuthContext'
import { GoogleLogin } from '@react-oauth/google'

export default function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const { loginWithToken, signInWithGoogle } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // Destruir Vercel Toolbar (estética hacker/clean)
    useEffect(() => {
        const removeVercelToolbar = () => {
            const toolbars = document.querySelectorAll('vercel-live-feedback, #__vercel-toolbar');
            toolbars.forEach(el => el.remove());
        };
        removeVercelToolbar();
        // Repete após load para garantir
        window.addEventListener('load', removeVercelToolbar);
        return () => window.removeEventListener('load', removeVercelToolbar);
    }, []);

    // Se já tem token válido, redireciona
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
            // Obtém token do servidor
            const { token } = await aiAPI.getToken(userId)
            loginWithToken(token)

            // Redireciona para a página que tentou acessar ou dashboard
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
        <div className="min-h-screen bg-bg-deep flex items-center justify-center p-6 relative overflow-hidden meta-sober-grid">
            {/* Immersive Background */}
            <div className="mesh-bg opacity-30" />
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-500/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-sapphire-600/5 blur-[120px] rounded-full" />

            <div className="meta-card w-full max-w-md !p-10 border-white/5 shadow-2xl animate-fade-in relative z-10">
                {/* Logo / Header */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-brand-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-600/30 animate-float border-4 border-white/10 relative group">
                        <div className="absolute inset-[-8px] rounded-[3rem] border border-brand-500/10 animate-spin" style={{ animationDuration: '12s' }} />
                        <span className="text-white font-display font-black text-3xl italic tracking-tighter">MF</span>
                    </div>
                    <h1 className="text-4xl font-black meta-gradient-text tracking-tighter mb-2">MetaFin</h1>
                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.3em]">
                        Intelligence & Assets Control
                    </p>
                </div>

                {/* Google Login Section */}
                <div className="mb-8">
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Erro ao conectar com Google')}
                            useOneTap
                            theme="filled_black"
                            shape="pill"
                            width="100%"
                            text="signin_with"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div className="relative flex items-center gap-4 mb-8">
                    <div className="flex-1 h-[1px] bg-white/5" />
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Ou utilize credenciais</span>
                    <div className="flex-1 h-[1px] bg-white/5" />
                </div>

                {/* Formulário */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label
                            htmlFor="userId"
                            className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1"
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
                            placeholder="USERID / E-MAIL"
                            className="meta-input !bg-white/5 !border-white/10 focus:!border-brand-500/50 text-sm font-bold tracking-widest placeholder-gray-700"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Mensagem de erro */}
                    {error && (
                        <div
                            role="alert"
                            className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-5 py-4
                text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-3 animate-shake overflow-hidden relative"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full meta-btn-primary hover:scale-105 active:scale-95 py-5 text-surface-950 font-black"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-4 border-surface-950/20 border-t-surface-950 rounded-full animate-spin" />
                                <span className="uppercase tracking-widest text-xs">Acessando Nucleo...</span>
                            </div>
                        ) : (
                            <span className="uppercase tracking-[0.2em] text-xs">Inicializar Sistema</span>
                        )}
                    </button>
                </form>

                {/* Rodapé com LGPD */}
                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase tracking-widest">
                        Protocolo de Segurança Ativo <span className="text-brand-500 px-2">•</span> <span className="text-white">LGPD 2024</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
