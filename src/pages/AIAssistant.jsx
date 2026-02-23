import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../hooks/useAnalytics';
import { Bot, Send, User, Loader2, RotateCcw } from 'lucide-react';
import categoriesData from '../data/data.json';
import { toCents, fromCents, add, formatBRL as fmt } from '../lib/financialMath';
import { secureStorage } from '../lib/secureStorage';

const categoryConfig = categoriesData.categories;

// ========== AI FINANCIAL ENGINE ==========
function analyzeTransactions(transactions) {
    if (!transactions.length) return null;

    const budgets = secureStorage.get('budgets', []);
    const goals = secureStorage.get('goals', []);

    const totalIncomeCents = transactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + toCents(Math.abs(t.amount)), 0);

    const totalExpensesCents = transactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + toCents(Math.abs(t.amount)), 0);

    const totalIncome = fromCents(totalIncomeCents);
    const totalExpenses = fromCents(totalExpensesCents);
    const balance = add(totalIncome, -totalExpenses);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Category breakdown using cents
    const categoryTotalsCents = {};
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
        categoryTotalsCents[t.category] = (categoryTotalsCents[t.category] || 0) + toCents(Math.abs(t.amount));
    });

    const categoryTotals = {};
    Object.keys(categoryTotalsCents).forEach(cat => {
        categoryTotals[cat] = fromCents(categoryTotalsCents[cat]);
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

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-12 h-12 text-accent animate-spin" /></div>;

    return (
        <div className="py-6 animate-fade-in flex flex-col h-[calc(100vh-120px)] relative z-0">
            {/* Cyberpunk Grid Background */}
            <div className="absolute inset-0 pointer-events-none z-[-1] opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PG1hdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDYsMTgyLDIxMiwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+')]"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 bg-black/50 border border-accent/20 p-4 rounded-xl shadow-[0_0_15px_rgba(57,255,20,0.1)] backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.2)]">
                        <Bot className="w-6 h-6 text-accent animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-widest font-mono">
                            NEXUS AI <span className="text-accent">{'//'} TERMINAL</span>
                        </h1>
                        <p className="text-xs text-brand-400 font-mono tracking-wider flex items-center gap-1 mt-1">
                            {analysis ? `[ SYS.ONLINE : ${analysis.count} NODES CONNECTED ]` : '[ SYS.WAITING_DATA ]'}
                        </p>
                    </div>
                </div>
                <button onClick={handleClear} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 font-mono text-xs uppercase tracking-widest hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2" title="Wipe Memory">
                    <RotateCcw className="w-3 h-3" /> Purge Memory
                </button>
            </div>

            {/* Stats Bar */}
            {analysis && (
                <div className="grid grid-cols-3 gap-3 mb-4 font-mono">
                    <div className="bg-black/40 border border-brand-500/20 py-3 px-4 text-center rounded-lg shadow-[inset_0_0_20px_rgba(6,182,212,0.05)] relative overflow-hidden group hover:border-brand-500/50 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-500" />
                        <p className="text-[10px] text-brand-400/70 uppercase tracking-widest mb-1">Total_In</p>
                        <p className="text-sm font-black text-brand-400">{fmt(analysis.totalIncome)}</p>
                    </div>
                    <div className="bg-black/40 border border-accent/20 py-3 px-4 text-center rounded-lg shadow-[inset_0_0_20px_rgba(57,255,20,0.05)] relative overflow-hidden group hover:border-accent/50 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-accent" />
                        <p className="text-[10px] text-accent/70 uppercase tracking-widest mb-1">Defense_Net</p>
                        <p className="text-sm font-black text-accent">{analysis.savingsRate.toFixed(0)}%</p>
                    </div>
                    <div className="bg-black/40 border border-red-500/20 py-3 px-4 text-center rounded-lg shadow-[inset_0_0_20px_rgba(239,68,68,0.05)] relative overflow-hidden group hover:border-red-500/50 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500" />
                        <p className="text-[10px] text-red-400/70 uppercase tracking-widest mb-1">Leak_Source</p>
                        <p className="text-sm font-black text-red-400 truncate">{categoryConfig[analysis.topCategory?.[0]]?.label || '—'}</p>
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 custom-scrollbar bg-black/60 border border-white/10 rounded-xl relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md">

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded bg-black border border-accent/50 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(57,255,20,0.2)]">
                                <Bot className="w-4 h-4 text-accent" />
                            </div>
                        )}
                        <div className={`max-w-[85%] rounded px-4 py-3 text-sm leading-relaxed font-mono shadow-sm ${msg.role === 'user'
                            ? 'bg-brand-500/10 border border-brand-500/40 text-brand-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : msg.type === 'alert'
                                ? 'bg-red-500/10 border-l-2 border-l-red-500 border-y border-r border-y-white/5 border-r-white/5 text-gray-300'
                                : msg.type === 'warning'
                                    ? 'bg-amber-500/10 border-l-2 border-l-amber-500 border-y border-r border-y-white/5 border-r-white/5 text-gray-300'
                                    : msg.type === 'success'
                                        ? 'bg-accent/5 border-l-2 border-l-accent border-y border-r border-y-white/5 border-r-white/5 text-gray-300 shadow-[0_0_15px_rgba(57,255,20,0.05)]'
                                        : 'bg-black/50 border-l-2 border-l-brand-500 border-y border-r border-y-white/5 border-r-white/5 text-gray-300'
                            }`}>
                            {msg.role === 'assistant' && (
                                <div className="text-[9px] uppercase tracking-widest text-accent mb-2 border-b border-accent/20 pb-1 w-max">Response_Packet_Received</div>
                            )}
                            <div className="whitespace-pre-wrap">{msg.text.split('**').map((part, i) =>
                                i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part
                            )}</div>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded bg-black border border-brand-500/50 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                <User className="w-4 h-4 text-brand-400" />
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded bg-black border border-accent/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(57,255,20,0.2)] animate-pulse">
                            <Bot className="w-4 h-4 text-accent" />
                        </div>
                        <div className="bg-black/50 border-l-2 border-l-accent border-y border-r border-y-white/5 border-r-white/5 text-accent font-mono text-xs px-4 py-3 flex items-center gap-2">
                            <span>Processing_Query</span>
                            <div className="flex gap-1">
                                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions (Console Commands) */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar font-mono">
                {QUICK_ACTIONS.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => sendMessage(action.prompt)}
                        disabled={isTyping}
                        className="px-3 py-1.5 rounded border border-brand-500/30 bg-black/40 text-[10px] uppercase tracking-widest text-brand-400 hover:text-white hover:border-accent hover:bg-accent/20 hover:shadow-[0_0_15px_rgba(57,255,20,0.3)] transition-all whitespace-nowrap disabled:opacity-50"
                    >
                        [&gt;_ {action.label.replace(/[^a-zA-ZÀ-ÿ0-9 ]/g, '').trim()} ]
                    </button>
                ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-mono text-sm pointer-events-none font-bold">&gt;</div>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="ENTER QUERY STATEMENT..."
                    disabled={isTyping}
                    className="w-full bg-black/60 border border-white/20 rounded-lg pl-8 pr-16 py-3.5 text-accent font-mono text-sm outline-none focus:border-accent focus:shadow-[0_0_20px_rgba(57,255,20,0.15)] disabled:opacity-50 transition-all uppercase placeholder:text-gray-700 placeholder:normal-case"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded bg-accent text-black font-black hover:bg-white hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Transmit"
                >
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </form>
        </div>
    );
}
