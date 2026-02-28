import { tw } from '@/lib/theme';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../hooks/useAnalytics';
import { runAgent } from '../lib/financialAgent';
import {
 Bot, Send, User, Loader2, TrendingUp, Wallet,
 PiggyBank, RotateCcw, Search, Calendar, Tag,
 ShoppingBag, Activity, ChevronRight,
} from 'lucide-react';



function fmt(v) {
 return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

// ── Chip que mostra qual tool foi executada ──
function ToolChip({ tool }) {
 const map = {
 searchByKeyword: { icon: Search, label: 'Busca por palavra', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
 searchByCategory: { icon: Tag, label: 'Busca por categoria', color: 'text-brand-glow bg-brand-primary/10 border-brand-primary/20' },
 topExpenses: { icon: TrendingUp, label: 'Maiores gastos', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
 summary: { icon: Activity, label: 'Resumo financeiro', color: 'text-brand-glow bg-brand-primary/10 border-brand-primary/20' },
 compare: { icon: Calendar, label: 'Comparativo', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
 recurring: { icon: RotateCcw, label: 'Recorrentes', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
 pending: { icon: ShoppingBag, label: 'Pendentes', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
 };
 const cfg = map[tool];
 if (!cfg) return null;
 const Icon = cfg.icon;
 return (
 <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium mb-2 ${cfg.color}`}>
 <Icon size={10} />
 <span>{cfg.label}</span>
 </div>
 );
}

// ── Renderiza markdown simples (negrito e listas) ──
function MsgText({ text }) {
 if (!text) return null;
 return (
 <div className="space-y-0.5 leading-relaxed">
 {text.split('\n').map((line, i) => {
 const parts = line.split(/\*\*(.*?)\*\*/g);
 return (
 <div key={i} className={line.startsWith('•') || /^\d+\./.test(line) ? 'ml-1' : ''}>
 {parts.map((p, j) =>
 j % 2 === 1
 ? <strong key={j} className="text-[var(--text-primary)] font-semibold">{p}</strong>
 : <span key={j}>{p}</span>
 )}
 </div>
 );
 })}
 </div>
 );
}

// ── Sugestões rápidas ──
const SUGGESTIONS = [
 { icon: '🛵', label: 'iFood essa semana', prompt: 'Quanto gastei no iFood essa semana?' },
 { icon: '💊', label: 'Saúde mês passado', prompt: 'Quais foram meus gastos com saúde e farmácia mês passado?' },
 { icon: '🚗', label: 'Transporte esse mês', prompt: 'Quanto gastei com transporte esse mês?' },
 { icon: '📊', label: 'Resumo do mês', prompt: 'Me dê um resumo financeiro desse mês' },
 { icon: '🏆', label: 'Maiores gastos', prompt: 'Quais foram meus maiores gastos do mês?' },
 { icon: '🔄', label: 'Assinaturas', prompt: 'Quais são meus gastos recorrentes e assinaturas?' },
 { icon: '📅', label: 'Mês passado vs atual', prompt: 'Compare meu mês passado com esse mês' },
 { icon: '⏳', label: 'Pendentes', prompt: 'Tenho transações pendentes de categorização?' },
];

const EXAMPLES = [
 'Quanto gastei no iFood essa semana?',
 'Gastos com saúde mês passado',
 'Maiores despesas esse mês',
 'Compare esse mês com o mês passado',
 'Quais são meus gastos recorrentes?',
];

export default function AIAssistant() {
 const { user } = useAuth();
 const { transactions, loading } = useTransactions();
 const [searchParams, setSearchParams] = useSearchParams();

 const [messages, setMessages] = useState([]);
 const [input, setInput] = useState('');
 const [isTyping, setIsTyping] = useState(false);

 const messagesEndRef = useRef(null);
 const inputRef = useRef(null);

 const displayName = user?.user_metadata?.full_name?.split(' ')[0] || 'você';

 const { totalIncome, savingsRate } = useMemo(() => {
 const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
 const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
 const rate = income > 0 ? ((income - expenses) / income * 100) : 0;
 return { totalIncome: income, savingsRate: rate };
 }, [transactions]);

 useEffect(() => { analytics.featureUsed('ai_assistant'); }, []);

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages, isTyping]);

 useEffect(() => {
 if (!loading) {
 const q = searchParams.get('q');
 if (q) {
 sendMessage(q);
 const p = new URLSearchParams(searchParams);
 p.delete('q');
 setSearchParams(p, { replace: true });
 }
 }
 }, [loading]); // eslint-disable-line

 const sendMessage = useCallback(async (text) => {
 if (!text?.trim() || isTyping) return;

 setMessages(prev => [...prev, {
 id: `user-${Date.now()}`,
 role: 'user',
 text: text.trim(),
 }]);
 setInput('');
 setIsTyping(true);

 // Latência natural
 await new Promise(r => setTimeout(r, 400 + Math.random() * 500));

 const result = runAgent(text, transactions);

 setMessages(prev => [...prev, {
 id: `ai-${Date.now()}`,
 role: 'assistant',
 text: result.text,
 tool: result.tool,
 dataCount: result.data?.length || 0,
 }]);
 setIsTyping(false);
 analytics.featureUsed('ai_agent_query');
 }, [transactions, isTyping]);

 if (loading) {
 return (
 <div className="flex items-center justify-center h-[70vh]">
 <div className="flex flex-col items-center gap-3">
 <Loader2 className="w-8 h-8 text-brand-glow animate-spin" />
 <p className="text-gray-500 text-sm">Carregando dados financeiros...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="py-6 flex flex-col h-[calc(100vh-80px)]">

 {/* ── Header ── */}
 <div className="flex items-center justify-between mb-4 flex-shrink-0">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] from-violet-500 via-brand-primary to-brand-glow flex items-center justify-center shadow-lg shadow-brand-primary/25">
 <Bot className="w-5 h-5 text-[var(--text-primary)]" />
 </div>
 <div>
 <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
 MetaFin Agent
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 tracking-wider">
 IA
 </span>
 </h1>
 <p className="text-xs text-gray-500">
 {transactions.length} transações · consultas em linguagem natural
 </p>
 </div>
 </div>

 {messages.length > 0 && (
 <button
 onClick={() => setMessages([])}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-[var(--text-primary)] hover:bg-gray-800/40/5 transition-all text-xs border border-[var(--border)]"
 >
 <RotateCcw size={12} /> Limpar
 </button>
 )}
 </div>

 {/* ── Stats Bar ── */}
 {transactions.length > 0 && (
 <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0 animate-fade-in">
 <div className={`\${tw.card} py-3 px-4 text-center`}>
 <TrendingUp className="w-4 h-4 text-brand-glow mx-auto mb-1" />
 <p className="text-[10px] text-gray-500 uppercase tracking-wider">Receita total</p>
 <p className="text-sm font-bold text-brand-glow">{fmt(totalIncome)}</p>
 </div>
 <div className={`\${tw.card} py-3 px-4 text-center`}>
 <PiggyBank className="w-4 h-4 text-violet-400 mx-auto mb-1" />
 <p className="text-[10px] text-gray-500 uppercase tracking-wider">Poupança</p>
 <p className="text-sm font-bold text-violet-400">{savingsRate.toFixed(0)}%</p>
 </div>
 <div className={`\${tw.card} py-3 px-4 text-center`}>
 <Wallet className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
 <p className="text-[10px] text-gray-500 uppercase tracking-wider">Transações</p>
 <p className="text-sm font-bold text-cyan-400">{transactions.length}</p>
 </div>
 </div>
 )}

 {/* ── Chat Area ── */}
 <div className="flex-1 overflow-y-auto glass rounded-2xl border border-[var(--border)] mb-4 min-h-0">

 {/* Empty State */}
 {messages.length === 0 && (
 <div className="p-6 h-full flex flex-col justify-between">
 {/* Welcome message */}
 <div className="flex items-start gap-3 mb-6">
 <div className="w-8 h-8 rounded-xl bg-[var(--bg-base)] from-violet-500 to-brand-glow flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/10">
 <Bot size={15} className="text-[var(--text-primary)]" />
 </div>
 <div className={`\${tw.card} flex-1 py-4 px-5`}>
 <p className="text-gray-200 text-sm leading-relaxed">
 Olá, <span className="text-[var(--text-primary)] font-semibold">{displayName}</span>! 👋{' '}
 Sou o <strong className="text-violet-400">MetaFin Agent</strong> — consulto suas
 transações em tempo real com linguagem natural.
 </p>
 <p className="text-gray-500 text-xs mt-2 mb-3">Experimente perguntar:</p>
 <div className="space-y-1">
 {EXAMPLES.map((ex, i) => (
 <button
 key={i}
 onClick={() => sendMessage(ex)}
 className="flex items-center gap-2 text-xs text-gray-500 hover:text-violet-400 transition-colors py-0.5 group w-full text-left"
 >
 <ChevronRight size={11} className="text-gray-300 group-hover:text-violet-400 flex-shrink-0" />
 <span>&quot;{ex}&quot;</span>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Suggestion grid */}
 <div>
 <p className="text-xs text-gray-600 mb-3 font-medium uppercase tracking-wider">Consultas rápidas</p>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
 {SUGGESTIONS.map((s) => (
 <button
 key={s.label}
 onClick={() => sendMessage(s.prompt)}
 className="flex flex-col items-start gap-1.5 p-3 rounded-xl bg-gray-800/40/[0.03] border border-[var(--border)] hover:bg-violet-500/5 hover:border-violet-500/20 transition-all text-left group"
 >
 <span className="text-xl">{s.icon}</span>
 <span className="text-xs text-gray-400 group-hover:text-[var(--text-primary)] transition-colors font-medium leading-tight">
 {s.label}
 </span>
 </button>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* Messages */}
 {messages.length > 0 && (
 <div className="p-4 space-y-5">
 {messages.map((msg) => (
 <div
 key={msg.id}
 className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
 >
 {msg.role === 'assistant' && (
 <div className="w-7 h-7 rounded-lg bg-[var(--bg-base)] from-violet-500 to-brand-glow flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-black/10">
 <Bot size={13} className="text-[var(--text-primary)]" />
 </div>
 )}

 <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
 {msg.tool && <ToolChip tool={msg.tool} />}

 <div className={`rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
 ? 'bg-violet-600/80 text-[var(--text-primary)] rounded-tr-sm border border-violet-500/30'
 : 'bg-gray-800/40/5 border border-[var(--border)] text-gray-200 rounded-tl-sm'
 }`}>
 <MsgText text={msg.text} />
 </div>

 {msg.role === 'assistant' && msg.dataCount > 0 && (
 <p className="text-[10px] text-gray-600 mt-1 px-1">
 {msg.dataCount} resultado(s)
 </p>
 )}
 </div>

 {msg.role === 'user' && (
 <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-1">
 <User size={13} className="text-violet-400" />
 </div>
 )}
 </div>
 ))}

 {/* Typing indicator */}
 {isTyping && (
 <div className="flex gap-3 items-start">
 <div className="w-7 h-7 rounded-lg bg-[var(--bg-base)] from-violet-500 to-brand-glow flex items-center justify-center flex-shrink-0">
 <Bot size={13} className="text-[var(--text-primary)]" />
 </div>
 <div className="bg-gray-800/40/5 border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
 {[0, 150, 300].map(d => (
 <div key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
 ))}
 <span className="text-xs text-gray-600 ml-1">consultando dados...</span>
 </div>
 </div>
 )}

 <div ref={messagesEndRef} />
 </div>
 )}
 </div>

 {/* ── Chips de sugestão (quando já tem mensagens) ── */}
 {messages.length > 0 && !isTyping && (
 <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0">
 {SUGGESTIONS.slice(0, 5).map((s) => (
 <button
 key={s.label}
 onClick={() => sendMessage(s.prompt)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs text-gray-400 hover:text-[var(--text-primary)] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all whitespace-nowrap flex-shrink-0"
 >
 <span>{s.icon}</span>
 <span>{s.label}</span>
 </button>
 ))}
 </div>
 )}

 {/* ── Input ── */}
 <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex-shrink-0">
 <div className="flex items-center gap-2 bg-gray-800/40/[0.03] border border-[var(--border)] rounded-2xl px-4 py-2 focus-within:border-violet-500/40 transition-colors">
 <Search size={15} className="text-gray-600 flex-shrink-0" />
 <input
 ref={inputRef}
 type="text"
 value={input}
 onChange={(e) => setInput(e.target.value)}
 placeholder='Ex: "Quanto gastei no iFood essa semana?"'
 disabled={isTyping}
 className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-gray-600 text-sm focus:outline-none py-2 disabled:opacity-50"
 />
 <button
 type="submit"
 disabled={!input.trim() || isTyping}
 className="p-2 rounded-xl bg-[var(--bg-base)] from-violet-500 to-brand-glow text-[var(--text-primary)] hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 flex-shrink-0"
 >
 <Send size={14} />
 </button>
 </div>
 <p className="text-center text-[10px] text-gray-300 mt-2">
 Consultas em linguagem natural · Dados em tempo real · 100% local
 </p>
 </form>
 </div>
 );
}
