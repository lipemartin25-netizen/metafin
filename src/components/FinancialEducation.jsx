import { tw } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Brain, TrendingUp, Shield, Rocket, ArrowRight } from 'lucide-react';

export default function FinancialEducation() {
 const navigate = useNavigate();

 const tracks = [
 {
 id: 'investments_101',
 title: 'Investimentos do Zero',
 icon: <TrendingUp className="w-8 h-8 text-blue-500" />,
 color: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
 description: 'Entenda a diferença entre Selic, IPCA+, CDB e Poupança e por que você deve sair dos grandes bancos.',
 prompt: 'Atue como meu consultor financeiro. Me explique de forma simples e pragmática, em tópicos, a diferença entre Tesouro Selic, Tesouro IPCA+ e CDBs. Ao final, me diga qual é indicado para Reserva de Emergência e qual é para Aposentadoria.'
 },
 {
 id: 'tax_optimization',
 title: 'Hacker de Imposto (PGBL)',
 icon: <Shield className="w-8 h-8 text-brand-primary" />,
 color: 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary dark:text-brand-glow',
 description: 'Como usar a Previdência Privada PGBL para receber restituição gorda todo ano.',
 prompt: 'Atue como um exímio planejador tributário do Brasil. Me explique o hack do PGBL: como investir até 12% da renda bruta tributável nele devolve parte do imposto na Restituição, e por que a tabela regressiva de IR compensa em 10 anos.'
 },
 {
 id: 'fire_math',
 title: 'A Matemática do F.I.R.E.',
 icon: <Rocket className="w-8 h-8 text-brand-500" />,
 color: 'bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400',
 description: 'Desmistificando a Regra dos 4% e como o juros composto trará sua independência.',
 prompt: 'Atue como um especialista do movimento FIRE. Me explique a Regra dos 4% (Estudo Trinity) adaptada ao Brasil (inflação alta). Mostre um cálculo simples de como R$ 100 mil viram muito dinheiro em 10 anos a 10% a.a. acima da inflação.'
 },
 {
 id: 'behavioral',
 title: 'Psicologia do Dinheiro',
 icon: <Brain className="w-8 h-8 text-brand-primary" />,
 color: 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary dark:text-brand-glow',
 description: 'Vieses cognitivos, inflação do estilo de vida e como blindar sua mente contra gastos impulsivos.',
 prompt: 'Com base no livro "Psicologia Financeira" de Morgan Housel, resuma as 3 lições mais valiosas sobre como a nossa mente sabota a criação de riqueza, foque na "inflação do estilo de vida" e na "força bruta das taxas de poupança".'
 }
 ];

 const handleStartTrack = (prompt) => {
 // Guarda o prompt no sessionStorage para a IA saber o que ler quando abrir a página /advisor
 sessionStorage.setItem('sf_ai_initial_prompt', prompt);
 navigate('/app/advisor');
 };

 return (
 <div className="space-y-6 animate-fade-in">
 <div className="relative overflow-hidden flex flex-col items-center justify-center rounded-[2.5rem] bg-surface-primary from-gray-900 via-indigo-950 to-black p-10 md:p-14 text-content-primary shadow-card border border-[var(--border)] text-center group perspective-1000">
 {/* Efeitos 3D Internos */}
 <div className="absolute inset-x-0 -bottom-20 h-64 bg-surface-primary from-brand-dark/20 to-transparent blur-2xl" />
 <div className="absolute -left-20 -top-20 w-80 h-80 bg-brand-500/10 rounded-full mix-blend-screen filter blur-[40px] opacity-60 group-hover:-translate-y-px transition-transform transition-transform duration-1000 ease-out" />
 <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full mix-blend-screen filter blur-[40px] opacity-60 group-hover:-translate-x-10 transition-transform duration-1000 ease-out delay-100" />
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PG1hdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')] opacity-20" />

 <div className="relative z-10 p-5 bg-gray-800/40/5 rounded-[2rem] shadow-inner border border-[var(--border)] mb-6 group-hover:-translate-y-px group-hover:rotate-3 transition-transform duration-500">
 <GraduationCap className="w-16 h-16 text-brand-400 drop-shadow-card animate-bounce-slow" />
 </div>

 <h2 className="text-4xl md:text-5xl font-black mb-4 relative z-10 tracking-tight drop-shadow-lg scale-100 group-hover:scale-[1.02] transition-transform duration-500 text-transparent bg-clip-text bg-surface-primary from-gray-100 via-gray-300 to-gray-500">
 Academy W1
 </h2>
 <p className="text-gray-300 text-base md:text-lg font-medium max-w-2xl relative z-10 leading-relaxed px-4">
 Transforme conhecimento em patrimônio real. Trilhas de aprendizado intensivas e hiper-personalizadas, rodando em parceria com a nossa <strong className="text-brand-400">Inteligência Estratégica AI</strong>.
 </p>

 {/* Decorative scanning line */}
 <div className="absolute inset-x-0 h-[2px] bg-surface-primary from-transparent via-brand-500 to-transparent top-0 opacity-0 group-hover:opacity-100 animate-[scan_3s_ease-in-out_infinite] shadow-card" />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pt-4">
 {tracks.map(track => (
 <div key={track.id} className={`\${tw.card} p-6 flex flex-col group hover:-translate-y-px transition-all duration-300`}>
 <div className="flex items-start justify-between mb-4">
 <div className={`p-4 rounded-2xl border ${track.color} transition-all group-hover:-translate-y-px transition-transform shadow-lg shadow-black/10`}>
 {track.icon}
 </div>
 <div className="text-[10px] uppercase tracking-widest font-black text-gray-400 flex items-center gap-1 bg-gray-800/40 dark:bg-gray-800/40/5 px-2 py-1 rounded-md">
 <BookOpen className="w-3 h-3" /> Trilha IA
 </div>
 </div>

 <h3 className="text-xl font-bold text-content-primary dark:text-content-primary mb-2 group-hover:text-brand-500 transition-colors">
 {track.title}
 </h3>

 <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 pr-4">
 {track.description}
 </p>

 <button
 onClick={() => handleStartTrack(track.prompt)}
 className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-gray-800/30 dark:bg-gray-800/40/5 border border-gray-700/40 dark:border-[var(--border)] text-sm font-bold text-gray-300 dark:text-gray-300 hover:bg-gray-800/40 dark:hover:bg-gray-800/40/10 hover:border-brand-500/50 hover:text-brand-500 transition-all"
 >
 <span>Iniciar Aula com a IA</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 </div>
 );
}
