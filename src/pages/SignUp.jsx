import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Lock, Sparkles, ArrowRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MetaFinLogo from '../components/MetaFinLogo';

export default function SignUp() {
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
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

    const handleNextStep = (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Defina um nome para prosseguir.');
            return;
        }
        setStep(2);
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error: authError } = await signUp(email, password, name);
            if (authError) throw authError;

            setSuccess(true);
            setTimeout(() => navigate('/app'), 2000);
        } catch (err) {
            setError(err.message || 'Erro ao criar conta corporativa.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white font-sans">
                <div className="w-full max-w-md text-center animate-fade-in clean-card">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Sparkles className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Bem-vindo, {name.split(' ')[0]}!</h2>
                    <p className="text-slate-400 mb-8 font-medium">Configurando seu ambiente de alta performance...</p>
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden text-white font-sans">
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md z-10 animate-fade-in">
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <MetaFinLogo className="h-10 w-auto" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">
                        {step === 1 ? 'Como deseja ser chamado?' : 'Falta apenas um passo.'}
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        {step === 1 ? 'Inicie sua jornada para a elite financeira.' : 'Proteja seu acesso com credenciais seguras.'}
                    </p>
                </div>

                <div className="clean-card bg-[#0a0f1e] shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="s1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onSubmit={handleNextStep}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="ex: João Silva"
                                        required
                                        className="input-clean"
                                    />
                                </div>
                                <button type="submit" className="w-full btn-clean-primary">
                                    Continuar <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="s2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onSubmit={handleFinalSubmit}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 ml-1">E-mail Corporativo</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="ex: joao@empresa.com"
                                            required
                                            className="input-clean"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 ml-1">Senha de Acesso</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Mínimo 6 caracteres"
                                                required
                                                className="input-clean pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-6 py-4 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"
                                    >
                                        Voltar
                                    </button>
                                    <button type="submit" disabled={loading} className="flex-1 btn-clean-primary">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar Conta'}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px] font-bold tracking-wide">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span>CADASTRO EM AMBIENTE CRIPTOGRAFADO</span>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-500 text-xs font-medium">
                    Já possui acesso? <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-bold">Faça Login</Link>
                </p>
            </div>
        </div>
    );
}
