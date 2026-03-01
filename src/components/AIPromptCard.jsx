import { tw } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';

export default function AIPromptCard() {
 const navigate = useNavigate();
 const [query, setQuery] = useState('');

 const suggestions = [
 "Quanto gastei no iFood essa semana?",
 "Qual foi meu maior gasto do mês?",
 "Compare esse mês com o anterior"
 ];

 const handleSearch = (e) => {
 e.preventDefault();
 if (query.trim()) {
 navigate(`/app/advisor?q=${encodeURIComponent(query)}`);
 }
 };

 return (
 <div className={`${tw.card} p-6 border-violet-500/20 bg-[var(--bg-base)] from-violet-500/5 via-transparent to-brand-glow/5 group`}>
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
 <Bot className="w-5 h-5 text-violet-400" />
 </div>
 <div>
 <h3 className="font-bold text-[var(--text-primary)] text-lg flex items-center gap-2">
 Assistente Nexus IA
 <Sparkles className="w-4 h-4 text-violet-400" />
 </h3>
 <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-widest">Inteligência Preditiva</p>
 </div>
 </div>
 </div>

 <form onSubmit={handleSearch} className="relative mb-6">
 <input
 type="text"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Pergunte qualquer coisa sobre seus dados..."
 className="w-full bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all font-medium"
 />
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
 <button
 type="submit"
 className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-violet-500 hover:bg-violet-400 rounded-xl transition-all shadow-lg shadow-violet-500/20"
 >
 <ChevronRight className="w-4 h-4 text-[var(--text-primary)]" />
 </button>
 </form>

 <div className="space-y-2">
 <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3 px-1">Consultas Sugeridas</p>
 {suggestions.map((text, i) => (
 <button
 key={i}
 onClick={() => navigate(`/app/advisor?q=${encodeURIComponent(text)}`)}
 className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-800/40/[0.02] border border-[var(--border)] hover:bg-violet-500/5 hover:border-violet-500/20 transition-all text-left group/item"
 >
 <span className="text-xs text-[var(--text-secondary)] group-hover/item:text-slate-200 transition-colors font-medium">{text}</span>
 <ChevronRight className="w-3 h-3 text-slate-700 group-hover/item:text-violet-400" />
 </button>
 ))}
 </div>
 </div>
 );
}
