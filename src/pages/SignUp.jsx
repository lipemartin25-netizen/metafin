import { useState, useEffect } from 'react';
import { tw } from '@/lib/theme';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MetaFinLogo from '../components/MetaFinLogo';
import { useForceDark } from '../hooks/useForceDark';

export default function SignUp() {
 useForceDark();
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
 <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6 text-[var(--text-primary)] font-sans selection:bg-brand-primary/30 antialiased">
 <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
 <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-brand-primary/[0.04] blur-[160px] rounded-full" />
 <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
 </div>

 <div className={`w-full max-w-md text-center animate-fade-in p-12 ${tw.card} shadow-elevated z-10`}>
 <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
 <Sparkles className="w-10 h-10 text-brand-primary" />
 </div>
 <h2 className="text-3xl font-bold mb-4 tracking-tight">Bem-vindo, {name.split(' ')[0]}!</h2>
 <p className="text-[var(--text-secondary)] mb-10 font-medium text-balance">Configurando seu ambiente de alta performance...</p>
 <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6 relative overflow-hidden text-[var(--text-primary)] font-sans selection:bg-brand-primary/30 antialiased">
 {/* Background elements matched with Landing Page */}
 <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
 <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-brand-primary/[0.04] blur-[160px] rounded-full" />
 <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-500/[0.03] blur-[160px] rounded-full" />
 <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
 </div>

 <div className="w-full max-w-md z-10 animate-fade-in py-10">
 <div className="text-center mb-10">
 <div className="flex justify-center mb-8 hover:-translate-y-px transition-transform transition-transform duration-300">
 <MetaFinLogo className="h-10 w-auto" />
 </div>
 <h1 className="text-2xl font-bold mb-3 tracking-tight uppercase">
 {step === 1 ? 'Cadastre-se' : 'Segurança'}
 </h1>
 <p className="text-[var(--text-secondary)] text-sm font-medium px-4">
 {step === 1 ? 'Ponto de partida ideal para a elite.' : 'Criptografia institucional Nexus ativa.'}
 </p>
 </div>

 <div className={`p-10 ${tw.card} relative overflow-hidden`}>
 {/* Interior glow for depth */}
 <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/[0.08] rounded-full blur-[80px] pointer-events-none" />

 {error && (
 <div className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center animate-shake relative z-10">
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
 className="space-y-8 relative z-10"
 >
 <div className="space-y-3">
 <label className="text-[10px] font-black text-[var(--text-muted)] ml-1 uppercase tracking-widest">Nome Completo ou Razão</label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="ex: João Silva"
 required
 autoFocus
 className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-slate-600 focus:outline-none focus:border-brand-primary/50 focus:bg-[var(--bg-elevated)] transition-all font-medium shadow-inner"
 />
 </div>
 <button type="submit" className="w-full py-4 bg-brand-primary hover:bg-brand-glow text-slate-950 font-black rounded-2xl transition-all active:scale-[0.98] shadow-elevated shadow-brand-primary/20 flex items-center justify-center gap-2 group">
 Avançar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
 </button>
 </motion.form>
 ) : (
 <motion.form
 key="s2"
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 10 }}
 onSubmit={handleFinalSubmit}
 className="space-y-8 relative z-10"
 >
 <div className="space-y-5">
 <div className="space-y-3">
 <label className="text-[10px] font-black text-[var(--text-muted)] ml-1 uppercase tracking-widest">E-mail Corporativo</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="ex: joao@empresa.com"
 required
 className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-slate-600 focus:outline-none focus:border-brand-primary/50 focus:bg-[var(--bg-elevated)] transition-all font-medium shadow-inner"
 />
 </div>
 <div className="space-y-3">
 <label className="text-[10px] font-black text-[var(--text-muted)] ml-1 uppercase tracking-widest">Chave de Acesso</label>
 <div className="relative">
 <input
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Mínimo 6 caracteres"
 required
 className="w-full pl-6 pr-14 py-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-slate-600 focus:outline-none focus:border-brand-primary/50 focus:bg-[var(--bg-elevated)] transition-all font-medium shadow-inner"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
 >
 {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
 </button>
 </div>
 </div>
 </div>

 <div className="flex gap-4">
 <button
 type="button"
 onClick={() => setStep(1)}
 className="px-6 py-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all font-bold"
 >
 Voltar
 </button>
 <button type="submit" disabled={loading} className="flex-1 py-4 bg-brand-primary hover:bg-brand-glow text-slate-950 font-black rounded-2xl transition-all active:scale-[0.98] shadow-elevated shadow-brand-primary/20 flex items-center justify-center">
 {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-950" /> : 'Confirmar e Criar'}
 </button>
 </div>
 </motion.form>
 )}
 </AnimatePresence>

 <div className="mt-12 pt-8 border-t border-[var(--border)] text-center relative z-10">
 <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-[10px] font-black tracking-[0.2em] uppercase">
 <Lock className="w-4 h-4 text-brand-primary/80" />
 <span>Segurança de Dados NEXUS</span>
 </div>
 </div>
 </div>

 <p className="mt-10 text-center text-[var(--text-muted)] text-xs font-bold leading-relaxed">
 Já possui acesso estratégico? <Link to="/login" className="text-brand-primary hover:text-brand-glow transition-colors ml-1 uppercase tracking-wider">Entrar no Painel</Link>
 </p>
 </div>
 </div>
 );
}
