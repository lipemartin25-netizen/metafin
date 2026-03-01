import { tw } from '@/lib/theme';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
 Send, X, Loader2, Bot,
 ChevronDown, Sparkles, Lock, RotateCcw, Copy, Check,
} from 'lucide-react';
import { AI_MODELS, AI_ACTIONS, callAI, buildFinancialContext } from '../lib/aiService';
import { usePlan } from '../hooks/usePlan';
import { useTransactions } from '../hooks/useTransactions';
import { useAnalyticsEvent } from '../hooks/useAnalyticsEvent';
import { useClipboard } from '../hooks/useClipboard';
import { useRateLimit } from '../hooks/useRateLimit';
import DOMPurify from 'dompurify';

// Configuração do DOMPurify
const PURIFY_CONFIG = {
 ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre'],
 ALLOWED_ATTR: [],
};

export default function AiChat() {
 const { isPro, limits } = usePlan();
 const { transactions, summary } = useTransactions();
 const { trackFeature } = useAnalyticsEvent();
 const { copy, isCopied } = useClipboard(2000);
 const { checkLimit, recordAction } = useRateLimit(1000);

 const [isOpen, setIsOpen] = useState(false);
 const [messages, setMessages] = useState([]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const [selectedModel, setSelectedModel] = useState('gemini-flash');
 const [showModelPicker, setShowModelPicker] = useState(false);
 const [error, setError] = useState('');

 const messagesEndRef = useRef(null);
 const inputRef = useRef(null);

 const availableModels = limits?.aiModels || ['gemini-flash'];
 const currentModel = AI_MODELS[selectedModel];

 // Contexto financeiro memoizado
 const financialContext = useMemo(() => {
 if (!transactions.length) return null;

 const adaptedSummary = {
 income: summary.income || 0,
 expense: summary.expense || 0,
 balance: summary.balance || 0,
 count: transactions.length,
 };

 return buildFinancialContext(transactions, adaptedSummary);
 }, [transactions, summary]);

 // Auto scroll
 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages]);

 // Focus input when chat opens
 useEffect(() => {
 if (isOpen) inputRef.current?.focus();
 }, [isOpen]);

 // Handler de envio com rate limiting
 const handleSend = useCallback(async (customPrompt) => {
 const text = customPrompt || input.trim();
 if (!text || loading) return;

 // Se não for pro e tentar enviar algo, mostramos o overlay ou travamos
 if (!isPro && messages.length >= 1) return;

 // Verificar rate limit
 const limitCheck = checkLimit();
 if (!limitCheck.allowed) {
 setError(limitCheck.message);
 return;
 }

 recordAction();
 setError('');
 const userMessage = { id: Date.now(), role: 'user', content: text };
 setMessages((prev) => [...prev, userMessage]);
 setInput('');
 setLoading(true);

 trackFeature(`ai_chat_${selectedModel}`);

 try {
 const chatMessages = [
 { role: 'system', content: `Você é o MetaFin AI.\n\n${financialContext || 'Sem dados financeiros disponíveis.'}` },
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
 content: `❌ Erro: ${err.message}\n\nO serviço de IA está temporariamente indisponível ou você atingiu o limite do plano.`,
 isError: true,
 },
 ]);
 } finally {
 setLoading(false);
 }
 }, [input, loading, isPro, checkLimit, recordAction, selectedModel, financialContext, messages, trackFeature]);

 const handleCopy = useCallback((text, id) => {
 copy(text, id);
 }, [copy]);

 const handleClear = useCallback(() => {
 setMessages([]);
 setError('');
 }, []);

 const handleSubmit = useCallback((e) => {
 e.preventDefault();
 handleSend();
 }, [handleSend]);

 // Sanitizar conteúdo da mensagem
 const sanitizeContent = useCallback((content) => {
 return DOMPurify.sanitize(content, PURIFY_CONFIG);
 }, []);

 // ========== PAYWALL OVERLAY ==========
 if (!isPro) {
 return (
 <>
 {/* FAB Button (Locked) */}
 <button
 onClick={() => setIsOpen(true)}
 className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[var(--bg-base)] from-gray-700 to-gray-800 shadow-lg flex items-center justify-center hover:-translate-y-px transition-transform transition-transform border border-[var(--border)]"
 aria-label="Abrir chat IA (bloqueado)"
 >
 <Lock className="w-6 h-6 text-gray-400" />
 </button>

 {isOpen && (
 <div
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in"
 onClick={() => setIsOpen(false)}
 >
 <div
 className={`\${tw.card} w-full max-w-md text-center animate-slide-up relative overflow-hidden bg-gray-900 border-brand-primary/30`}
 onClick={(e) => e.stopPropagation()}
 >
 <button
 onClick={() => setIsOpen(false)}
 className="absolute top-4 right-4 text-gray-500 hover:text-[var(--text-primary)]"
 aria-label="Fechar"
 >
 <X className="w-5 h-5" />
 </button>

 <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/5">
 <Sparkles className="w-10 h-10 text-brand-glow animate-pulse" />
 </div>

 <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
 Inteligência Financeira <span className="text-brand-glow">Pro</span>
 </h2>

 <p className="text-gray-400 text-sm mb-8 leading-relaxed px-4">
 Acesse <strong className="text-[var(--text-primary)]">7 modelos de IA</strong> para análises profundas do seu dinheiro.
 </p>

 <div className="grid grid-cols-2 gap-2 mb-8 text-left text-xs text-gray-300 px-4 animate-fade-in">
 <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-glow" /> GPT-4o & Gemini Pro</div>
 <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-glow" /> Categorização Auto</div>
 <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-glow" /> DeepSeek & Claude 3.5</div>
 <div className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-glow" /> Planejamento de Gastos</div>
 </div>

 <div className="flex flex-col gap-3 px-4 pb-6">
 <button className="gradient-btn w-full py-3 text-sm font-bold shadow-lg shadow-brand-primary/20">
 💎 Assinar Pro — R$ 29,90/mês
 </button>
 <button
 onClick={() => setIsOpen(false)}
 className="text-xs text-gray-500 hover:text-[var(--text-primary)] transition-colors"
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
 className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[var(--bg-base)] from-brand-primary to-brand-glow shadow-lg shadow-brand-primary/25 flex items-center justify-center hover:-translate-y-px transition-transform transition-transform group"
 aria-label="Abrir chat IA"
 >
 <Sparkles className="w-6 h-6 text-[var(--text-primary)] group-hover:rotate-12 transition-transform" />
 </button>
 )}

 {/* Chat Panel */}
 {isOpen && (
 <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] md:w-[440px] h-[100dvh] sm:h-[650px] flex flex-col bg-[#0a0a0a] sm:rounded-2xl border border-[var(--border)] shadow-elevated animate-slide-up overflow-hidden ring-1 ring-white/5">

 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-gray-900/95 ">
 <div className="flex items-center gap-2">
 <div className="bg-brand-primary/10 p-1.5 rounded-lg">
 <Bot className="w-4 h-4 text-brand-glow" />
 </div>
 <div>
 <span className="font-semibold text-[var(--text-primary)] text-sm block">MetaFin AI</span>
 <span className="text-[10px] text-brand-glow font-medium tracking-wide bg-brand-primary/10 px-1.5 py-0.5 rounded uppercase">PRO ATIVO</span>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={handleClear}
 className="p-1.5 rounded-lg text-gray-500 hover:text-[var(--text-primary)] hover:bg-gray-800/40/10 transition-all"
 title="Limpar conversa"
 aria-label="Limpar conversa"
 >
 <RotateCcw className="w-4 h-4" />
 </button>
 <button
 onClick={() => setIsOpen(false)}
 className="p-1.5 rounded-lg text-gray-500 hover:text-[var(--text-primary)] hover:bg-gray-800/40/10 transition-all"
 aria-label="Fechar chat"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Model Picker */}
 <div className="px-4 py-2 border-b border-[var(--border)] bg-black/20">
 <button
 onClick={() => setShowModelPicker(!showModelPicker)}
 className="flex items-center gap-2 text-xs text-gray-300 hover:text-[var(--text-primary)] transition-colors w-full bg-[var(--bg-surface)] hover:bg-gray-800/40/10 p-2 rounded-lg border border-[var(--border)]"
 aria-expanded={showModelPicker}
 >
 <span className="text-base">{currentModel?.icon}</span>
 <span className="font-medium text-[11px] truncate">{currentModel?.name || 'Selecionar Modelo'}</span>
 <span className="text-gray-500 ml-auto text-[9px] uppercase tracking-wider font-bold">{currentModel?.provider}</span>
 <ChevronDown className={`w-3 h-3 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
 </button>

 {showModelPicker && (
 <div className="mt-2 space-y-1 pb-2 animate-fade-in max-h-48 overflow-y-auto no-scrollbar">
 {Object.keys(AI_MODELS).map((modelId) => {
 const m = AI_MODELS[modelId];
 const isAvailable = availableModels.includes(modelId) || m.costTier === 'free';
 const isActive = selectedModel === modelId;

 return (
 <button
 key={modelId}
 onClick={() => {
 if (isAvailable) {
 setSelectedModel(modelId);
 setShowModelPicker(false);
 }
 }}
 disabled={!isAvailable}
 className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs transition-all ${isActive
 ? 'bg-brand-primary/10 text-brand-glow border border-brand-primary/20'
 : isAvailable
 ? 'text-gray-400 hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] border border-transparent'
 : 'opacity-40 cursor-not-allowed text-gray-600'
 }`}
 >
 <span className="text-base">{m.icon}</span>
 <div className="flex-1 text-left">
 <div className="font-medium flex items-center gap-2">
 {m.name}
 <span className={`text-[9px] px-1 rounded ${m.costTier === 'free' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-[var(--bg-surface)] text-gray-500'}`}>
 {m.costTier.toUpperCase()}
 </span>
 </div>
 <div className="text-[10px] text-gray-600 truncate max-w-[200px]">{m.description}</div>
 </div>
 {isActive && <Check className="w-3 h-3 text-brand-primary" />}
 {!isAvailable && <Lock className="w-3 h-3 text-gray-300" />}
 </button>
 );
 })}
 </div>
 )}
 </div>

 {/* Messages */}
 <div id="main-content" className="flex-1 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar bg-[var(--bg-base)] from-[#0a0a0a] to-[#050505]">
 {/* Empty State */}
 {messages.length === 0 && (
 <div className="text-center py-10 px-4">
 <div className="w-16 h-16 bg-[var(--bg-base)] from-brand-primary/20 to-brand-glow/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-primary/10 border border-brand-primary/10">
 <Sparkles className="w-8 h-8 text-brand-glow" />
 </div>
 <h3 className="text-[var(--text-primary)] font-semibold mb-2">Olá! Vamos analisar suas finanças?</h3>
 <p className="text-gray-500 text-[11px] mb-8 max-w-[260px] mx-auto leading-relaxed">
 Posso categorizar gastos, sugerir onde economizar ou criar um plano de orçamento personalizado.
 </p>
 <div className="grid grid-cols-1 gap-2.5 animate-fade-in">
 {Object.entries(AI_ACTIONS).slice(0, 4).map(([key, action]) => (
 <button
 key={key}
 onClick={() => handleSend(action.prompt)}
 className="p-3 rounded-xl bg-gray-800/40/[0.03] border border-[var(--border)] text-xs text-gray-300 hover:bg-gray-800/40/[0.08] hover:text-[var(--text-primary)] hover:border-brand-primary/30 transition-all text-left flex items-center gap-3 group"
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
 className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}
 >
 <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
 {/* Name Label */}
 <span className="text-[10px] text-gray-500 mb-1 px-1">
 {msg.role === 'user' ? 'Você' : msg.model || 'MetaFin AI'}
 </span>

 <div
 className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg shadow-black/10 ${msg.role === 'user'
 ? 'bg-brand-primary text-[var(--text-primary)] rounded-tr-sm'
 : msg.isError
 ? 'bg-red-500/10 text-red-300 border border-red-500/20 rounded-tl-sm'
 : 'bg-[var(--bg-surface)] text-gray-200 border border-[var(--border)] rounded-tl-sm'
 }`}
 >
 {/* Content - sanitizado se for da IA */}
 <div
 className="whitespace-pre-wrap break-words font-light"
 dangerouslySetInnerHTML={
 msg.role === 'assistant'
 ? { __html: sanitizeContent(msg.content) }
 : undefined
 }
 >
 {msg.role === 'user' ? msg.content : undefined}
 </div>
 </div>

 {/* Metadata / Actions */}
 <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
 {msg.role === 'assistant' && !msg.isError && (
 <>
 <span className="text-[10px] text-gray-600">
 {((msg.latency || 0) / 1000).toFixed(1)}s
 </span>
 <div className="w-1 h-1 rounded-full bg-gray-700"></div>
 <button
 onClick={() => handleCopy(msg.content, msg.id)}
 className="text-[10px] text-brand-glow hover:text-purple-300 flex items-center gap-1 transition-colors font-medium"
 >
 {isCopied(msg.id) ? (
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
 <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
 <div className="w-2 h-2 bg-brand-glow rounded-full animate-bounce"></div>
 <div className="w-2 h-2 bg-brand-glow rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
 <div className="w-2 h-2 bg-brand-glow rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
 <span className="text-[11px] text-gray-400 ml-1 font-medium">
 {currentModel?.name} analisando...
 </span>
 </div>
 </div>
 )}

 <div ref={messagesEndRef} />
 </div>

 {/* Quick Actions (if chat active) */}
 {messages.length > 0 && !loading && (
 <div className="px-4 py-2 bg-gray-900 border-t border-[var(--border)] flex gap-2 overflow-x-auto no-scrollbar">
 {Object.entries(AI_ACTIONS).map(([key, action]) => (
 <button
 key={key}
 onClick={() => handleSend(action.prompt)}
 className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[10px] text-gray-400 hover:text-[var(--text-primary)] hover:bg-gray-800/40/10 hover:border-brand-primary/30 transition-all whitespace-nowrap"
 >
 {action.label}
 </button>
 ))}
 </div>
 )}

 {/* Input */}
 <div className="p-4 border-t border-[var(--border)] bg-gray-900">
 {error && (
 <div className="text-[11px] text-red-400 mb-2 bg-red-500/10 border border-red-500/20 p-2 rounded-lg flex items-center gap-2">
 <X className="w-3 h-3" /> {error}
 </div>
 )}
 <form
 onSubmit={handleSubmit}
 className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-[var(--border)] focus-within:border-brand-primary/50 transition-colors shadow-inner"
 >
 <input
 ref={inputRef}
 type="text"
 value={input}
 onChange={(e) => setInput(e.target.value)}
 placeholder="Pergunte sobre seu dinheiro..."
 disabled={loading}
 className="flex-1 px-3 py-2 bg-transparent text-[var(--text-primary)] placeholder-gray-600 text-sm focus:outline-none disabled:opacity-50"
 />
 <button
 type="submit"
 disabled={loading || !input.trim()}
 className="p-2.5 rounded-xl bg-brand-primary text-[var(--text-primary)] hover:bg-brand-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20"
 aria-label="Enviar mensagem"
 >
 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
 </button>
 </form>
 <div className="text-[9px] text-gray-600 text-center mt-2 flex justify-center items-center gap-1 uppercase tracking-tighter">
 <Lock className="w-2.5 h-2.5" /> Ambiente criptografado & seguro
 </div>
 </div>
 </div>
 )}
 </>
 );
}
