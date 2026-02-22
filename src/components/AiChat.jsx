import { useState, useRef, useEffect } from 'react';
import {
    Send, X, Loader2, Bot,
    ChevronDown, Sparkles, Lock, RotateCcw, Copy, Check,
} from 'lucide-react';
import { AI_MODELS, AI_ACTIONS, callAI, buildFinancialContext } from '../lib/aiProviders';
import { usePlan } from '../hooks/usePlan';
import { useTransactions } from '../hooks/useTransactions';
import { analytics } from '../hooks/useAnalytics';

export default function AiChat() {
    const { isPro, limits } = usePlan();
    const { transactions, summary } = useTransactions();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-flash');
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const availableModels = limits?.aiModels || [];

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const handleSend = async (customPrompt) => {
        const text = customPrompt || input.trim();
        if (!text || loading) return;

        if (!isPro) return;

        setError('');
        const userMessage = { id: Date.now(), role: 'user', content: text };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        analytics.featureUsed(`ai_chat_${selectedModel}`);

        try {
            // Build context
            // Note: useTransactions returns summary object { income, expense, balance } but buildFinancialContext expects { totalIncome, totalExpenses... }
            // Let's adapt here
            const adaptedSummary = {
                income: summary.income || 0,
                expense: summary.expense || 0,
                balance: summary.balance || 0,
                count: transactions.length
            };

            // Send goals and budgets to AI Context
            const budgets = JSON.parse(localStorage.getItem('sf_budgets') || '[]');
            const goals = JSON.parse(localStorage.getItem('sf_goals') || '[]');

            const financialContext = buildFinancialContext(transactions, adaptedSummary, { budgets, goals });

            const chatMessages = [
                { role: 'system', content: `Você é o SmartFinance AI.\n\n${financialContext}` },
                ...messages.map((m) => ({ role: m.role, content: m.content })),
                { role: 'user', content: text },
            ];

            const response = await callAI(selectedModel, chatMessages);

            const aiMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.content,
                model: response.modelName,
                provider: response.provider,
                latency: response.latency,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            console.error('AI Error:', err);
            setError(err.message);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `❌ Erro: ${err.message}\n\nVerifique se a API key do provedor está configurada corretamente no .env.local`,
                    isError: true,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleClear = () => {
        setMessages([]);
        setError('');
    };

    const currentModel = AI_MODELS[selectedModel];

    // ========== PAYWALL OVERLAY ==========
    if (!isPro) {
        return (
            <>
                {/* FAB Button (Locked) */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 shadow-lg flex items-center justify-center hover:scale-110 transition-transform border border-white/10"
                >
                    <Lock className="w-6 h-6 text-gray-400" />
                </button>

                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="glass-card w-full max-w-md text-center animate-slide-up relative overflow-hidden bg-gray-900 border-emerald-500/30">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/5">
                                <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">
                                IA Financeira <span className="text-emerald-400">Pro</span>
                            </h2>

                            <p className="text-gray-400 text-sm mb-8 leading-relaxed px-4">
                                Acesse <strong className="text-white">7 modelos de IA</strong> (GPT-5, Gemini, Claude, DeepSeek...)
                                para análises financeiras inteligentes, categorização automática
                                e insights personalizados sobre seu dinheiro.
                            </p>

                            <div className="grid grid-cols-2 gap-2 mb-8 text-left text-xs text-gray-300 px-4">
                                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> GPT-5 & Claude Sonnet</div>
                                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Categorização Auto</div>
                                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> DeepSeek & Grok</div>
                                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dicas de Investimento</div>
                            </div>

                            <div className="flex flex-col gap-3 px-4">
                                <button className="gradient-btn w-full py-3 text-sm font-bold shadow-lg shadow-emerald-500/20">
                                    💎 Assinar Pro — R$ 29/mês
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs text-gray-500 hover:text-white transition-colors"
                                >
                                    Continuar no plano Gratuito
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // ========== FULL CHAT (PRO) ==========
    return (
        <>
            {/* FAB Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-xl bg-black border border-accent flex items-center justify-center hover:scale-110 transition-transform group shadow-[0_0_20px_rgba(57,255,20,0.4)] animate-pulse"
                >
                    <div className="absolute inset-0 bg-accent/20 blur-md pointer-events-none" />
                    <Bot className="w-6 h-6 text-accent group-hover:animate-ping relative z-10" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] md:w-[440px] h-[100dvh] sm:h-[650px] flex flex-col bg-black sm:rounded-none sm:border-2 border-t-2 border-accent shadow-2xl animate-slide-up overflow-hidden ring-1 ring-accent/30 font-mono">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b-2 border-accent bg-black">
                        <div className="flex items-center gap-3">
                            <div className="bg-accent/10 border border-accent/50 p-1.5 rounded-sm">
                                <Bot className="w-5 h-5 text-accent animate-pulse" />
                            </div>
                            <div>
                                <span className="font-black text-white text-sm block tracking-widest uppercase">Nexus AI_Link</span>
                                <span className="text-[9px] text-accent font-black tracking-widest bg-accent/10 px-1.5 py-0.5 border border-accent/20 uppercase">SECURE connection</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleClear}
                                className="p-1.5 rounded-sm border border-red-500/50 text-red-500 hover:text-white hover:bg-red-500 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-1"
                                title="Limpar conversa"
                            >
                                <RotateCcw className="w-3 h-3" /> WIPE
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 border border-accent/50 text-accent hover:bg-accent hover:text-black transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Model Picker */}
                    <div className="px-4 py-2 border-b border-white/10 bg-black/50">
                        <button
                            onClick={() => setShowModelPicker(!showModelPicker)}
                            className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-brand-400 hover:text-brand-300 transition-colors w-full bg-black border border-brand-500/30 hover:border-brand-500 p-2 rounded-none"
                        >
                            <span className="text-base">{currentModel?.icon}</span>
                            <span>{currentModel?.name}</span>
                            <span className="text-gray-500 ml-auto opacity-50">{currentModel?.provider}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                        </button>

                        {showModelPicker && (
                            <div className="mt-2 space-y-1 pb-2 animate-fade-in max-h-48 overflow-y-auto custom-scrollbar border border-white/10 p-1 bg-black">
                                {availableModels.map((modelId) => {
                                    const m = AI_MODELS[modelId];
                                    if (!m) return null;
                                    const isActive = selectedModel === modelId;
                                    return (
                                        <button
                                            key={modelId}
                                            onClick={() => {
                                                setSelectedModel(modelId);
                                                setShowModelPicker(false);
                                            }}
                                            className={`flex items-center gap-3 w-full px-3 py-2 text-xs transition-all ${isActive
                                                ? 'bg-brand-500/20 text-brand-400 border border-brand-500'
                                                : 'text-gray-500 hover:bg-white/10 hover:text-white border border-transparent'
                                                }`}
                                        >
                                            <span className="text-base">{m.icon}</span>
                                            <div className="flex-1 text-left">
                                                <div className="font-bold uppercase flex items-center gap-2 tracking-widest">
                                                    {m.name}
                                                    <span className="text-[9px] bg-white/10 px-1 text-gray-400 border border-white/20">{m.costTier}</span>
                                                </div>
                                                <div className="text-[9px] text-gray-600 truncate max-w-[200px] normal-case font-sans">{m.description}</div>
                                            </div>
                                            {isActive && <Check className="w-3 h-3 text-brand-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PG1hdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')]">
                        {/* Empty State */}
                        {messages.length === 0 && (
                            <div className="text-center py-10 px-4">
                                <div className="w-16 h-16 bg-black border-2 border-accent flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(57,255,20,0.3)] animate-pulse">
                                    <Bot className="w-8 h-8 text-accent" />
                                </div>
                                <h3 className="text-white font-black mb-2 uppercase tracking-widest text-lg">AI_CORE STATUS: WAITING</h3>
                                <p className="text-gray-500 text-xs mb-8 max-w-[260px] mx-auto leading-relaxed">
                                    Init command sequence or ask for direct financial extraction.
                                </p>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {Object.entries(AI_ACTIONS).slice(0, 4).map(([key, action]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleSend(action.prompt)}
                                            className="p-3 bg-black border border-white/10 text-xs text-brand-400 hover:bg-brand-500/10 hover:border-brand-500 transition-all text-left flex items-center gap-3 group uppercase tracking-widest shadow-inner"
                                        >
                                            <span className="text-lg opacity-50 group-hover:opacity-100 transition-opacity">&gt;_</span>
                                            <span className="font-bold">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Message Bubbles */}
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                                    {/* Name Label */}
                                    <span className="text-[9px] font-bold text-gray-500 mb-1 px-1 uppercase tracking-widest">
                                        {msg.role === 'user' ? 'OPERATOR' : msg.model || 'NEXUS_AI'}
                                    </span>

                                    <div
                                        className={`px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-accent/10 border-r-4 border-r-accent border-y border-l border-white/10 text-accent shadow-[0_0_10px_rgba(57,255,20,0.1)]'
                                            : msg.isError
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                : 'bg-black border-l-4 border-l-brand-500 border-y border-r border-white/10 text-gray-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap break-words font-medium">
                                            {msg.content}
                                        </div>
                                    </div>

                                    {/* Metadata / Actions */}
                                    <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {msg.role === 'assistant' && !msg.isError && (
                                            <>
                                                <span className="text-[9px] text-gray-600 font-bold">
                                                    {(msg.latency / 1000).toFixed(1)}s LATENCY
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                                                <button
                                                    onClick={() => handleCopy(msg.content, msg.id)}
                                                    className="text-[9px] uppercase tracking-widest text-brand-400 font-black hover:text-brand-300 flex items-center gap-1 transition-colors"
                                                >
                                                    {copiedId === msg.id ? (
                                                        <><Check className="w-3 h-3" /> EXPORTED</>
                                                    ) : (
                                                        <><Copy className="w-3 h-3" /> EXPORT</>
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading */}
                        {loading && (
                            <div className="flex justify-start animate-fade-in">
                                <div className="bg-black border border-accent/50 px-4 py-3 flex items-center gap-3">
                                    <Bot className="w-4 h-4 text-accent animate-pulse" />
                                    <span className="text-xs text-accent uppercase tracking-widest font-black">
                                        Processing<span className="animate-pulse">_</span>
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions (if chat active) */}
                    {messages.length > 0 && !loading && (
                        <div className="px-4 py-2 bg-black border-t border-white/10 flex gap-2 overflow-x-auto custom-scrollbar">
                            {Object.entries(AI_ACTIONS).map(([key, action]) => (
                                <button
                                    key={key}
                                    onClick={() => handleSend(action.prompt)}
                                    className="shrink-0 px-3 py-1.5 border border-brand-500/30 text-[9px] uppercase tracking-widest font-bold text-gray-400 hover:text-brand-400 hover:bg-brand-500/10 hover:border-brand-500 transition-all whitespace-nowrap"
                                >
                                    [&gt;] {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t-2 border-accent bg-black">
                        {error && (
                            <div className="text-xs text-red-500 font-bold uppercase tracking-widest mb-2 bg-red-500/10 border border-red-500 p-2 flex items-center gap-2">
                                <X className="w-3 h-3" /> {error}
                            </div>
                        )}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex items-center gap-2 bg-black p-1 border border-white/20 focus-within:border-accent transition-colors shadow-inner"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="&gt; AWAITING COMMAND..."
                                disabled={loading}
                                className="flex-1 px-3 py-2 bg-transparent text-accent font-bold placeholder-gray-600 text-sm focus:outline-none disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="p-2.5 bg-accent text-black font-black hover:bg-white hover:shadow-[0_0_15px_rgba(57,255,20,0.6)] transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                            </button>
                        </form>
                        <div className="text-[9px] uppercase tracking-widest font-black text-gray-700 text-center mt-2 flex justify-center items-center gap-1">
                            <Lock className="w-2 h-2" /> ENCRYPTED NEURAL NETWORK
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
