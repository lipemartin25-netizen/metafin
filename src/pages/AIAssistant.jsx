import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import { tw } from '../lib/theme';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/supabase';
import { analytics } from '../hooks/useAnalytics';
import {
    Bot, Send, User, Loader2, TrendingUp, Wallet,
    PiggyBank, RotateCcw, Search, Calendar, Tag,
    ShoppingBag, Activity, ChevronRight, Sparkles
} from 'lucide-react';

function fmt(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

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

export default function AIAssistant() {
    const { user } = useAuth();
    const { transactions, loading } = useTransactions();
    const [searchParams, setSearchParams] = useSearchParams();
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const { messages: chatMessages, input: chatInput, handleInputChange, handleSubmit, setMessages: setChatMessages, isLoading: isTyping } = useChat({
        api: '/api/advisor',
        initialMessages: [
            { id: 'welcome', role: 'assistant', content: `Olá, **${user?.user_metadata?.full_name?.split(' ')[0] || 'você'}**! 👋 Sou o **MetaFin Agent** — seu consultor financeiro pessoal. Como posso te ajudar hoje?` }
        ],
        onFinish: () => {
            analytics.featureUsed('ai_agent_query');
        }
    });

    const onSend = async (e, customText = null) => {
        if (e) e.preventDefault();
        const text = (customText || chatInput).trim();
        if (!text) return;

        const token = await auth.getAccessToken();

        handleSubmit(e, {
            body: { token },
            options: {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        });
    };

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
    }, [chatMessages, isTyping]);

    useEffect(() => {
        if (!loading) {
            const q = searchParams.get('q');
            if (q) {
                onSend(null, q);
                const p = new URLSearchParams(searchParams);
                p.delete('q');
                setSearchParams(p, { replace: true });
            }
        }
    }, [loading]); // eslint-disable-line

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

            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] from-violet-500 via-brand-primary to-brand-glow flex items-center justify-center shadow-lg shadow-brand-primary/25">
                        <Bot className="w-5 h-5 text-[var(--text-primary)]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 text-glow">
                            MetaFin Agent
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 tracking-wider">
                                IA
                            </span>
                        </h1>
                        <p className="text-xs text-gray-500">
                            {transactions.length} transações · consultando dados reais
                        </p>
                    </div>
                </div>

                {chatMessages.length > 1 && (
                    <button
                        onClick={() => setChatMessages([{ id: 'welcome', role: 'assistant', content: `Chat reiniciado. Como posso ajudar agora?` }])}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all text-xs border border-[var(--border)]"
                    >
                        <RotateCcw size={12} /> Limpar
                    </button>
                )}
            </div>

            {/* Stats Bar */}
            {transactions.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0 animate-fade-in">
                    <div className={`${tw.card} py-3 px-4 text-center glass`}>
                        <TrendingUp className="w-4 h-4 text-brand-glow mx-auto mb-1" />
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Receita total</p>
                        <p className="text-sm font-bold text-brand-glow">{fmt(totalIncome)}</p>
                    </div>
                    <div className={`${tw.card} py-3 px-4 text-center glass`}>
                        <PiggyBank className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Poupança</p>
                        <p className="text-sm font-bold text-violet-400">{savingsRate.toFixed(0)}%</p>
                    </div>
                    <div className={`${tw.card} py-3 px-4 text-center glass`}>
                        <Wallet className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Transações</p>
                        <p className="text-sm font-bold text-cyan-400">{transactions.length}</p>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto glass rounded-2xl border border-[var(--border)] mb-4 min-h-0 custom-scrollbar">
                <div className="p-4 space-y-6">
                    {chatMessages.map((msg) => (
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
                                <div className={`rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                                    ? 'bg-brand-primary text-[var(--text-primary)] rounded-tr-sm border border-brand-primary/30 shadow-md'
                                    : 'bg-[var(--bg-surface)] border border-[var(--border)] text-gray-200 rounded-tl-sm shadow-xl'
                                    }`}>
                                    <ReactMarkdown className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-brand-glow">
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-7 h-7 rounded-lg bg-brand-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <User size={13} className="text-brand-glow" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
                        <div className="flex gap-3 items-start animate-fade-in">
                            <div className="w-7 h-7 rounded-lg bg-[var(--bg-base)] from-violet-500 to-brand-glow flex items-center justify-center flex-shrink-0">
                                <Bot size={13} className="text-[var(--text-primary)]" />
                            </div>
                            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand-glow animate-spin" />
                                <span className="text-xs text-gray-500 italic">Analisando suas finanças...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Suggestions */}
            {chatMessages.length < 5 && !isTyping && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0 hide-scrollbar scroll-smooth">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s.label}
                            onClick={() => onSend(null, s.prompt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs text-gray-400 hover:text-[var(--text-primary)] hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all whitespace-nowrap flex-shrink-0 active:scale-95"
                        >
                            <span>{s.icon}</span>
                            <span>{s.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Input form */}
            <form onSubmit={onSend} className="flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-800/20 backdrop-blur-md border border-[var(--border)] rounded-2xl px-4 py-2 focus-within:border-brand-primary/40 focus-within:ring-1 focus-within:ring-brand-primary/20 transition-all">
                    <Search size={15} className="text-gray-600 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={chatInput}
                        onChange={handleInputChange}
                        placeholder='Ex: "Quanto gastei no iFood essa semana?"'
                        disabled={isTyping}
                        className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-gray-600 text-sm focus:outline-none py-2 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!chatInput.trim() || isTyping}
                        className="p-2 rounded-xl bg-brand-primary text-white hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 flex-shrink-0"
                    >
                        {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </div>
                <p className="text-center text-[10px] text-gray-500 mt-3 flex items-center justify-center gap-1 opacity-80">
                    <Sparkles size={10} className="text-brand-glow" />
                    Nexus Advisor v3.0 · Powered by OpenAI
                </p>
            </form>
        </div>
    );
}
