import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../hooks/useAnalytics';
import { Bot, Send, User, Loader2, Sparkles, TrendingUp, PiggyBank, AlertTriangle, RotateCcw } from 'lucide-react';
import categoriesData from '../data/data.json';

const categoryConfig = categoriesData.categories;

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ========== AI FINANCIAL ENGINE ==========
function analyzeTransactions(transactions) {
    if (!transactions.length) return null;

    const budgets = JSON.parse(localStorage.getItem('sf_budgets') || '[]');
    const goals = JSON.parse(localStorage.getItem('sf_goals') || '[]');

    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Category breakdown
    const categoryTotals = {};
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    });
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0];

    // Monthly trend
    const months = {};
    transactions.forEach((t) => {
        const m = t.date?.slice(0, 7);
        if (!m) return;
        if (!months[m]) months[m] = { income: 0, expense: 0 };
        if (t.type === 'income') months[m].income += Math.abs(t.amount);
        else months[m].expense += Math.abs(t.amount);
    });

    // Recurring expenses (same description appearing 2+ times)
    const descCounts = {};
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
        const key = t.description.toLowerCase().trim();
        if (!descCounts[key]) descCounts[key] = { count: 0, total: 0, desc: t.description };
        descCounts[key].count++;
        descCounts[key].total += Math.abs(t.amount);
    });
    const recurring = Object.values(descCounts).filter((d) => d.count >= 2).sort((a, b) => b.total - a.total);

    return {
        totalIncome, totalExpenses, balance, savingsRate,
        categoryTotals, sortedCategories, topCategory, months, recurring,
        count: transactions.length, budgets, goals
    };
}

// ========== AI RESPONSE GENERATOR ==========
function generateAIResponse(question, analysis) {
    const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (!analysis) {
        return {
            text: '📭 Você ainda não tem transações cadastradas. Importe um extrato CSV/Excel ou adicione transações manualmente na página **Transações** para que eu possa analisar suas finanças!',
            type: 'info',
        };
    }

    // Greeting
    if (q.match(/oi|ola|hey|bom dia|boa tarde|boa noite|hello/)) {
        return {
            text: `Olá! 👋 Sou seu assistente financeiro IA. Tenho acesso a **${analysis.count} transações** suas.\n\nPosso te ajudar com:\n• 📊 **Resumo financeiro** - visão geral\n• 💡 **Dicas de economia** - onde cortar gastos\n• 📈 **Análise de tendências** - evolução mensal\n• 🏷️ **Gastos por categoria** - onde seu dinheiro vai\n• 🔄 **Gastos recorrentes** - assinaturas e fixos\n• 🎯 **Metas** - planejamento\n\nO que quer saber?`,
            type: 'info',
        };
    }

    // Financial summary
    if (q.match(/resumo|geral|visao|panorama|como estou|como estao|situacao|status/)) {
        const emoji = analysis.balance >= 0 ? '✅' : '🚨';
        const healthEmoji = analysis.savingsRate >= 20 ? '🟢' : analysis.savingsRate >= 10 ? '🟡' : '🔴';
        return {
            text: `${emoji} **Resumo Financeiro**\n\n` +
                `💰 Receitas: **${fmt(analysis.totalIncome)}**\n` +
                `💸 Despesas: **${fmt(analysis.totalExpenses)}**\n` +
                `📊 Saldo: **${fmt(analysis.balance)}**\n` +
                `${healthEmoji} Taxa de poupança: **${analysis.savingsRate.toFixed(1)}%**\n\n` +
                (analysis.savingsRate >= 20
                    ? '🎉 Parabéns! Você está poupando mais de 20% — acima da recomendação geral.'
                    : analysis.savingsRate >= 10
                        ? '👍 Razoável, mas tente alcançar 20% de taxa de poupança.'
                        : '⚠️ Atenção! Sua taxa de poupança está baixa. Veja suas categorias de gastos para identificar cortes.'),
            type: analysis.savingsRate >= 20 ? 'success' : analysis.savingsRate >= 10 ? 'warning' : 'alert',
        };
    }

    // Category breakdown
    if (q.match(/categoria|gasto|onde|despesa|gasta|gastando|gastar/)) {
        let text = '🏷️ **Gastos por Categoria**\n\n';
        analysis.sortedCategories.forEach(([cat, total], i) => {
            const pct = ((total / analysis.totalExpenses) * 100).toFixed(1);
            const cfg = categoryConfig[cat];
            text += `${i + 1}. ${cfg?.icon || '📦'} **${cfg?.label || cat}**: ${fmt(total)} (${pct}%)\n`;
        });
        if (analysis.topCategory) {
            const topCfg = categoryConfig[analysis.topCategory[0]];
            const topPct = ((analysis.topCategory[1] / analysis.totalExpenses) * 100).toFixed(1);
            text += `\n💡 **Destaque:** ${topCfg?.icon || ''} ${topCfg?.label || analysis.topCategory[0]} representa **${topPct}%** dos seus gastos.`;
            if (parseFloat(topPct) > 30) {
                text += ' Considere estabelecer um teto para esta categoria.';
            }
        }
        return { text, type: 'info' };
    }

    // Tips / savings
    if (q.match(/dica|economizar|economia|cortar|reduzir|poupar|economis/)) {
        let tips = '💡 **Dicas Personalizadas de Economia**\n\n';
        const topExpenses = analysis.sortedCategories.slice(0, 3);

        topExpenses.forEach(([cat, total]) => {
            const cfg = categoryConfig[cat];
            const pct = ((total / analysis.totalExpenses) * 100).toFixed(0);
            switch (cat) {
                case 'alimentacao':
                    tips += `${cfg?.icon} **Alimentação** (${pct}% dos gastos):\n  → Planeje cardápio semanal e compre no atacado\n  → Reduza delivery e cozinhe mais em casa\n  → Use apps de cashback como Méliuz\n\n`;
                    break;
                case 'transporte':
                    tips += `${cfg?.icon} **Transporte** (${pct}% dos gastos):\n  → Compare apps de corrida vs transporte público\n  → Considere carona solidária\n  → Mantenha pneus calibrados (economia de combustível)\n\n`;
                    break;
                case 'moradia':
                    tips += `${cfg?.icon} **Moradia** (${pct}% dos gastos):\n  → Renegocie aluguel/condomínio\n  → Use lâmpadas LED e desligue aparelhos standby\n  → Compare planos de internet/celular\n\n`;
                    break;
                case 'entretenimento':
                    tips += `${cfg?.icon} **Entretenimento** (${pct}% dos gastos):\n  → Revise assinaturas: quantos streamings você realmente usa?\n  → Busque promoções e dias de desconto\n  → Alterne meses de assinatura\n\n`;
                    break;
                default:
                    tips += `${cfg?.icon || '📦'} **${cfg?.label || cat}** (${pct}% dos gastos):\n  → Analise se há gastos que podem ser reduzidos\n  → Estabeleça um teto mensal para esta categoria\n\n`;
            }
        });

        if (analysis.recurring.length > 0) {
            tips += `🔄 **Assinaturas e recorrentes** que você pode revisar:\n`;
            analysis.recurring.slice(0, 5).forEach((r) => {
                tips += `  • ${r.desc}: ${fmt(r.total / r.count)}/mês (${r.count}x)\n`;
            });
        }

        const potentialSavings = analysis.totalExpenses * 0.15;
        tips += `\n🎯 **Meta sugerida:** Reduzindo 15% dos gastos, você economizaria **${fmt(potentialSavings)}/mês** = **${fmt(potentialSavings * 12)}/ano**`;

        return { text: tips, type: 'success' };
    }

    // Budget
    if (q.match(/orcamento|limite|estour|budget/)) {
        if (!analysis.budgets || analysis.budgets.length === 0) {
            return { text: '📈 Você não definiu nenhum orçamento ainda. Vá até a seção **Orçamento** e defina limites para suas categorias!', type: 'info' };
        }

        let text = '🐖 **Status do seu Orçamento Mensal**\n\n';
        let overBudgetCount = 0;

        analysis.budgets.forEach(b => {
            const spent = analysis.categoryTotals[b.category] || 0;
            const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
            const over = spent > b.limit;

            text += `${categoryConfig[b.category]?.icon || '📦'} **${categoryConfig[b.category]?.label || b.category}**\n`;
            text += `Limite: ${fmt(b.limit)} | Gasto: ${fmt(spent)} (${pct.toFixed(0)}%)\n`;

            if (over) {
                text += `🚨 Estourou **${fmt(spent - b.limit)}** do orçamento!\n\n`;
                overBudgetCount++;
            } else {
                text += `✅ Sobram ${fmt(b.limit - spent)} neste mês.\n\n`;
            }
        });

        const type = overBudgetCount > 0 ? 'alert' : 'success';
        return { text, type };
    }

    // Trends
    if (q.match(/tendencia|trend|evolucao|mensal|mes|meses|historico/)) {
        const monthEntries = Object.entries(analysis.months).sort((a, b) => a[0].localeCompare(b[0]));
        if (monthEntries.length < 2) {
            return { text: '📈 Preciso de pelo menos 2 meses de dados para analisar tendências. Continue registrando!', type: 'info' };
        }
        let text = '📈 **Evolução Mensal**\n\n';
        monthEntries.forEach(([month, data]) => {
            const [y, m] = month.split('-');
            const bal = data.income - data.expense;
            text += `📅 **${m}/${y}**: Receita ${fmt(data.income)} | Despesa ${fmt(data.expense)} | Saldo ${bal >= 0 ? '✅' : '🔴'} ${fmt(bal)}\n`;
        });
        const last = monthEntries[monthEntries.length - 1][1];
        const prev = monthEntries[monthEntries.length - 2][1];
        const expenseChange = ((last.expense - prev.expense) / prev.expense) * 100;
        text += `\n${expenseChange > 0 ? '📈🔴' : '📉🟢'} Despesas ${expenseChange > 0 ? 'aumentaram' : 'diminuíram'} **${Math.abs(expenseChange).toFixed(1)}%** em relação ao mês anterior.`;
        return { text, type: expenseChange > 0 ? 'warning' : 'success' };
    }

    // Recurring
    if (q.match(/recorrente|assinatura|fixo|mensal|subscription|recorre/)) {
        if (analysis.recurring.length === 0) {
            return { text: '🔄 Não identifiquei gastos recorrentes ainda. Com mais dados mensais, poderei detectar padrões.', type: 'info' };
        }
        let text = '🔄 **Gastos Recorrentes Identificados**\n\n';
        analysis.recurring.forEach((r, i) => {
            text += `${i + 1}. **${r.desc}**: ${fmt(r.total / r.count)} × ${r.count} vezes = ${fmt(r.total)}\n`;
        });
        const totalRecurring = analysis.recurring.reduce((s, r) => s + r.total, 0);
        text += `\n💰 Total em recorrentes: **${fmt(totalRecurring)}** (${((totalRecurring / analysis.totalExpenses) * 100).toFixed(1)}% das despesas)`;
        return { text, type: 'info' };
    }

    // Goals
    if (q.match(/meta|objetivo|planejamento|planejar|futuro|reserva|emergencia/)) {
        let text = '🎯 **Metas e Planejamento**\n\n';

        if (analysis.goals && analysis.goals.length > 0) {
            text += '**Suas Metas Atuais:**\n';
            analysis.goals.forEach(g => {
                const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
                text += `• **${g.name}**: ${fmt(g.current)} de ${fmt(g.target)} (${pct.toFixed(0)}% concluída)\n`;
            });
            text += '\n';
        }

        const monthlyIncome = analysis.totalIncome / Math.max(Object.keys(analysis.months).length, 1);
        const emergencyFund = monthlyIncome * 6;

        text += `📊 Renda mensal média: **${fmt(monthlyIncome)}**\n\n` +
            `**Regra 50/30/20 sugerida para você:**\n` +
            `• 🏠 50% Necessidades: **${fmt(monthlyIncome * 0.5)}** (moradia, alimentação, transporte)\n` +
            `• 🎮 30% Desejos: **${fmt(monthlyIncome * 0.3)}** (entretenimento, compras)\n` +
            `• 💰 20% Poupança: **${fmt(monthlyIncome * 0.2)}** (investimentos, reserva)\n\n` +
            `**Dicas extras:**\n` +
            `1. 🚨 Focar na Reserva de emergência: alvo de **${fmt(emergencyFund)}**\n` +
            `2. 📈 Investir 20% da sua renda: **${fmt(monthlyIncome * 0.2)}/mês**\n` +
            `3. 🎯 Reduzir sua categoria mais cara (${categoryConfig[analysis.topCategory?.[0]]?.label || 'N/A'}) em 10%.\n`;

        return {
            text,
            type: 'success',
        };
    }

    // Default
    return {
        text: `🤔 Não entendi completamente, mas aqui está o que posso fazer:\n\n` +
            `• **"resumo"** — visão geral das finanças\n` +
            `• **"orçamento"** — status dos seus limites e orçamentos\n` +
            `• **"categorias"** — onde você mais gasta\n` +
            `• **"dicas"** — como economizar\n` +
            `• **"tendências"** — evolução mensal\n` +
            `• **"recorrentes"** — assinaturas e fixos\n` +
            `• **"metas"** — análise das suas metas financeiras\n\n` +
            `Tente uma dessas! 😊`,
        type: 'info',
    };
}

// ========== QUICK ACTIONS ==========
const QUICK_ACTIONS = [
    { label: '📊 Resumo', prompt: 'Me dê um resumo financeiro' },
    { label: '🐖 Orçamento', prompt: 'Como está meu orçamento?' },
    { label: '💡 Dicas', prompt: 'Quero dicas para economizar' },
    { label: '🏷️ Categorias', prompt: 'Onde estou gastando mais?' },
    { label: '📈 Tendências', prompt: 'Como está minha evolução mensal?' },
    { label: '🔄 Recorrentes', prompt: 'Quais são meus gastos recorrentes?' },
    { label: '🎯 Metas', prompt: 'Me detalhe sobre minhas metas financeiras' },
];

// ========== COMPONENT ==========
export default function AIAssistant() {
    const { user } = useAuth();
    const { transactions, loading } = useTransactions();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const analysis = analyzeTransactions(transactions);

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        analytics.featureUsed('ai_assistant');
        // Welcome message
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            text: `Olá${user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}! 👋\n\nSou seu **Assistente Financeiro IA**. Analiso suas transações em tempo real para oferecer insights personalizados.\n\n${analysis ? `📊 Tenho acesso a **${analysis.count} transações** — pronto para analisar!` : '📭 Importe transações para começar.'}\n\nUse os botões rápidos abaixo ou pergunte o que quiser!`,
            type: 'info',
        }]);
    }, [user, analysis?.count]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // Check for initial query only when loading is finished
        if (!loading) {
            const initialQuery = searchParams.get('q');
            const sessionPrompt = sessionStorage.getItem('sf_ai_initial_prompt');

            if (sessionPrompt) {
                sendMessage(sessionPrompt);
                sessionStorage.removeItem('sf_ai_initial_prompt');
            } else if (initialQuery) {
                sendMessage(initialQuery);
                // Clear param so it doesn't re-trigger on refresh
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('q');
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [loading, searchParams, setSearchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text) => {
        if (!text.trim()) return;
        const userMsg = { id: Date.now() + '-user', role: 'user', text: text.trim() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI thinking delay
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));

        const response = generateAIResponse(text, analysis);
        const aiMsg = { id: Date.now() + '-ai', role: 'assistant', text: response.text, type: response.type };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        analytics.featureUsed('ai_question');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleClear = () => {
        setMessages([{
            id: 'cleared',
            role: 'assistant',
            text: '🔄 Conversa reiniciada. Como posso ajudar?',
            type: 'info',
        }]);
    };

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;

    return (
        <div className="py-6 animate-fade-in flex flex-col h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            Assistente IA <Sparkles className="w-4 h-4 text-yellow-400" />
                        </h1>
                        <p className="text-xs text-gray-500">
                            {analysis ? `Analisando ${analysis.count} transações` : 'Aguardando dados'}
                        </p>
                    </div>
                </div>
                <button onClick={handleClear} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all" title="Reiniciar">
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {/* Stats Bar */}
            {analysis && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="glass-card py-3 px-4 text-center">
                        <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Receita</p>
                        <p className="text-sm font-bold text-emerald-400">{fmt(analysis.totalIncome)}</p>
                    </div>
                    <div className="glass-card py-3 px-4 text-center">
                        <PiggyBank className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Poupança</p>
                        <p className="text-sm font-bold text-violet-400">{analysis.savingsRate.toFixed(0)}%</p>
                    </div>
                    <div className="glass-card py-3 px-4 text-center">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Maior gasto</p>
                        <p className="text-sm font-bold text-amber-400 truncate">{categoryConfig[analysis.topCategory?.[0]]?.label || '—'}</p>
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <div className="glass-card flex-1 overflow-y-auto p-4 space-y-4 mb-4 custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-emerald-500/20 border border-emerald-500/20 text-emerald-100'
                            : msg.type === 'alert'
                                ? 'bg-red-500/10 border border-red-500/20 text-gray-200'
                                : msg.type === 'warning'
                                    ? 'bg-amber-500/10 border border-amber-500/20 text-gray-200'
                                    : msg.type === 'success'
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-gray-200'
                                        : 'bg-white/5 border border-white/10 text-gray-200'
                            }`}>
                            <div className="whitespace-pre-wrap">{msg.text.split('**').map((part, i) =>
                                i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
                            )}</div>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                                <User className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3 items-start">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
                {QUICK_ACTIONS.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => sendMessage(action.prompt)}
                        disabled={isTyping}
                        className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all whitespace-nowrap disabled:opacity-50"
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pergunte sobre suas finanças..."
                    disabled={isTyping}
                    className="input-field flex-1"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="gradient-btn px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
