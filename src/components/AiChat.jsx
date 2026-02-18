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

            const financialContext = buildFinancialContext(transactions, adaptedSummary);

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
                    className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center hover:scale-110 transition-transform group animate-bounce-subtle"
                >
                    <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] md:w-[440px] h-[100dvh] sm:h-[650px] flex flex-col bg-[#0a0a0a] sm:rounded-2xl border border-white/10 shadow-2xl animate-slide-up overflow-hidden ring-1 ring-white/5">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gray-900/95 backdrop-blur-xl">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                                <Bot className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <span className="font-semibold text-white text-sm block">SmartFinance AI</span>
                                <span className="text-[10px] text-emerald-400 font-medium tracking-wide bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">PRO ATIVO</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleClear}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                                title="Limpar conversa"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Model Picker */}
                    <div className="px-4 py-2 border-b border-white/5 bg-black/20">
                        <button
                            onClick={() => setShowModelPicker(!showModelPicker)}
                            className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors w-full bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/5"
                        >
                            <span className="text-base">{currentModel?.icon}</span>
                            <span className="font-medium">{currentModel?.name}</span>
                            <span className="text-gray-500 ml-auto text-[10px] uppercase tracking-wider font-bold">{currentModel?.provider}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                        </button>

                        {showModelPicker && (
                            <div className="mt-2 space-y-1 pb-2 animate-fade-in max-h-48 overflow-y-auto custom-scrollbar">
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
                                            className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs transition-all ${isActive
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                                }`}
                                        >
                                            <span className="text-base">{m.icon}</span>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium flex items-center gap-2">
                                                    {m.name}
                                                    <span className="text-[10px] bg-white/5 px-1 rounded text-gray-500">{m.costTier}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-600 truncate max-w-[200px]">{m.description}</div>
                                            </div>
                                            {isActive && <Check className="w-3 h-3 text-emerald-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
                        {/* Empty State */}
                        {messages.length === 0 && (
                            <div className="text-center py-10 px-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10 border border-emerald-500/10">
                                    <Sparkles className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-white font-semibold mb-2">Olá! Vamos analisar suas finanças?</h3>
                                <p className="text-gray-500 text-xs mb-8 max-w-[260px] mx-auto leading-relaxed">
                                    Posso categorizar gastos, sugerir onde economizar ou criar um plano de orçamento personalizado.
                                </p>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {Object.entries(AI_ACTIONS).slice(0, 4).map(([key, action]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleSend(action.prompt)}
                                            className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-gray-300 hover:bg-white/[0.08] hover:text-white hover:border-emerald-500/30 transition-all text-left flex items-center gap-3 group"
                                        >
                                            <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity">{action.label.split(' ')[0]}</span>
                                            <span className="font-medium">{action.label.split(' ').slice(1).join(' ')}</span>
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
                                    <span className="text-[10px] text-gray-500 mb-1 px-1">
                                        {msg.role === 'user' ? 'Você' : msg.model || 'AI'}
                                    </span>

                                    <div
                                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-emerald-600 text-white rounded-tr-sm'
                                            : msg.isError
                                                ? 'bg-red-500/10 text-red-300 border border-red-500/20 rounded-tl-sm'
                                                : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-sm'
                                            }`}
                                    >
                                        {/* Content with basic markdown */}
                                        <div className="whitespace-pre-wrap break-words font-light">
                                            {msg.content}
                                        </div>
                                    </div>

                                    {/* Metadata / Actions */}
                                    <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {msg.role === 'assistant' && !msg.isError && (
                                            <>
                                                <span className="text-[10px] text-gray-600">
                                                    {(msg.latency / 1000).toFixed(1)}s
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                                                <button
                                                    onClick={() => handleCopy(msg.content, msg.id)}
                                                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors font-medium"
                                                >
                                                    {copiedId === msg.id ? (
                                                        <><Check className="w-3 h-3" /> Copiado</>
                                                    ) : (
                                                        <><Copy className="w-3 h-3" /> Copiar</>
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
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
                                    <span className="text-xs text-gray-400 ml-1 font-medium">
                                        {currentModel?.name} analisando...
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions (if chat active) */}
                    {messages.length > 0 && !loading && (
                        <div className="px-4 py-2 bg-gray-900 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
                            {Object.entries(AI_ACTIONS).map(([key, action]) => (
                                <button
                                    key={key}
                                    onClick={() => handleSend(action.prompt)}
                                    className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-emerald-500/30 transition-all whitespace-nowrap"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-white/5 bg-gray-900">
                        {error && (
                            <div className="text-xs text-red-400 mb-2 bg-red-500/10 border border-red-500/20 p-2 rounded-lg flex items-center gap-2">
                                <X className="w-3 h-3" /> {error}
                            </div>
                        )}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 focus-within:border-emerald-500/50 transition-colors shadow-inner"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pergunte sobre suas finanças..."
                                disabled={loading}
                                className="flex-1 px-3 py-2 bg-transparent text-white placeholder-gray-600 text-sm focus:outline-none disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </form>
                        <div className="text-[10px] text-gray-600 text-center mt-2 flex justify-center items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Ambiente criptografado & seguro
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
