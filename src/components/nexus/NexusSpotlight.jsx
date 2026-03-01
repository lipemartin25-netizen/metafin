// src/components/nexus/NexusSpotlight.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Sparkles, Send, BrainCircuit, X, MessageSquare, Bot, AlertCircle, Trash2, Lock } from 'lucide-react';
import { tw } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { usePlan } from '../../hooks/usePlan';

export default function NexusSpotlight() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [model, setModel] = useState('gemini-1.5-flash');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const { user } = useAuth();
    const { planId } = usePlan();
    const isPro = planId === 'pro';

    // 1. Atalho Global (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 2. Carregar Histórico Inicial
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            fetchHistory();
        }
    }, [isOpen]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('supabase.auth.token');
            const resp = await fetch('/api/nexus/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            if (data.history) setMessages(data.history);
        } catch (error) {
            console.error('[nexus-history] Erro:', error);
        }
    };

    const clearHistory = async () => {
        if (!confirm('Deseja apagar TODO o histórico com o Nexus?')) return;
        try {
            const token = localStorage.getItem('supabase.auth.token');
            await fetch('/api/nexus/history', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessages([]);
        } catch (error) {
            console.error('[nexus-history] Erro ao deletar:', error);
        }
    };

    // 3. Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Placeholder para IA Assistant
        const assistantMsg = { role: 'assistant', content: '', model };
        setMessages(prev => [...prev, assistantMsg]);

        try {
            const token = localStorage.getItem('supabase.auth.token'); // Simplificado
            const response = await fetch('/api/nexus/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    model
                })
            });

            if (!response.ok) throw new Error('Falha no Nexus');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.content) {
                                fullContent += data.content;
                                setMessages(prev => {
                                    const next = [...prev];
                                    const last = next[next.length - 1];
                                    if (last.role === 'assistant') {
                                        last.content = fullContent;
                                    }
                                    return next;
                                });
                            }
                        } catch (e) {
                            console.error('SSE Parse Error:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[nexus-spotlight] Erro:', error);
            setMessages(prev => {
                const next = [...prev];
                next[next.length - 1].content = "Erro técnico. O Nexus perdeu a conexão temporariamente.";
                return next;
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Spotlight Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={tw(
                            "relative w-full max-w-2xl min-h-[500px] flex flex-col",
                            "bg-slate-900/80 backdrop-blur-3xl rounded-3xl border border-white/10",
                            "shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden"
                        )}
                    >
                        {/* Header / Seletor */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <BrainCircuit className="w-5 h-5 text-violet-400" />
                                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                                    {[
                                        { id: 'gemini-1.5-flash', label: 'Flash' },
                                        { id: 'gpt-4o', label: 'GPT-4o', pro: true },
                                        { id: 'claude-3-5-sonnet-20240620', label: 'Claude', pro: true }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            disabled={m.pro && !isPro}
                                            onClick={() => setModel(m.id)}
                                            className={tw(
                                                "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase flex items-center gap-1",
                                                model === m.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5',
                                                m.pro && !isPro ? 'opacity-30 cursor-not-allowed' : ''
                                            )}
                                        >
                                            {m.label}
                                            {m.pro && (
                                                isPro
                                                    ? <div className="w-1.5 h-1.5 rounded-full bg-violet-400 ml-1" />
                                                    : <Lock className="w-2.5 h-2.5 ml-1 text-gray-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {messages.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                        title="Limpar Histórico (Hard Delete)"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <X className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" onClick={() => setIsOpen(false)} />
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
                        >
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <Sparkles className="w-12 h-12 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Nexus Command Center</h3>
                                    <p className="text-sm max-w-xs">Pergunte qualquer coisa sobre suas finanças ou peça análises do Wealth Lab.</p>
                                </div>
                            )}

                            {messages.map((m, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={tw(
                                        "flex gap-4 max-w-[85%]",
                                        m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                                    )}
                                >
                                    <div className={tw(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10",
                                        m.role === 'user' ? 'bg-gray-800' : 'bg-violet-600/40'
                                    )}>
                                        {m.role === 'user' ? <MessageSquare className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={tw(
                                        "p-4 rounded-3xl text-sm leading-relaxed",
                                        m.role === 'user' ? 'bg-white/5 rounded-tr-none' : 'bg-violet-500/10 rounded-tl-none border border-violet-500/10'
                                    )}>
                                        {m.content || (loading && idx === messages.length - 1 ? <div className="flex gap-1"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" /></div> : '...')}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/5">
                            <div className="relative group">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Sua pergunta para o Nexus (ex: 'Como está minha meta de FIRE?')..."
                                    className={tw(
                                        "w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-sm text-white",
                                        "focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-gray-500"
                                    )}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-violet-600/20 text-violet-400 rounded-xl hover:bg-violet-600 hover:text-white transition-all disabled:opacity-30"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-3 flex items-center justify-between px-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1">
                                        <div className="px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800">⌘</div>
                                        <div className="px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800">K</div>
                                        <span className="ml-1">Shortcut</span>
                                    </div>
                                    <span className="self-center">Esc: Close</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Nexus Intelligence v3.0</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
