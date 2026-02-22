import { useState, useEffect } from 'react';
import { Activity, Target, Shield, ArrowRight, Sparkles, TrendingUp, TrendingDown, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Mocked questions for the onboarding flow
const QUESTIONS = [
    {
        id: 'step1',
        title: 'Qual é a sua renda mensal aproximada?',
        subtitle: 'Isso nos ajuda a calcular sua capacidade de poupança.',
        type: 'currency',
        key: 'income',
        icon: <TrendingUp className="w-8 h-8 text-emerald-500 mb-4" />
    },
    {
        id: 'step2',
        title: 'Quais são seus gastos fixos e variáveis mensais?',
        subtitle: 'Contas, aluguel, mercado, lazer, etc.',
        type: 'currency',
        key: 'expenses',
        icon: <TrendingDown className="w-8 h-8 text-red-500 mb-4" />
    },
    {
        id: 'step3',
        title: 'Qual o valor total das suas dívidas hoje?',
        subtitle: 'Cartão de crédito rotativo, empréstimos, financiamentos. (Coloque 0 se não tiver)',
        type: 'currency',
        key: 'debts',
        icon: <Target className="w-8 h-8 text-orange-500 mb-4" />
    },
    {
        id: 'step4',
        title: 'Qual o valor total que você já tem investido ou guardado?',
        subtitle: 'Poupança, CDBs, Ações, Cripto, etc.',
        type: 'currency',
        key: 'investments',
        icon: <Shield className="w-8 h-8 text-blue-500 mb-4" />
    }
];

export default function XRayDiagnosis({ onComplete, onClose }) {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({
        income: 5000,
        expenses: 3000,
        debts: 0,
        investments: 10000
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Block scrolling on body when active
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handleNext = () => {
        if (step < QUESTIONS.length - 1) {
            setStep(step + 1);
        } else {
            calculateXRay();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleChange = (val) => {
        const key = QUESTIONS[step].key;
        setAnswers({ ...answers, [key]: Number(val) });
    };

    const calculateXRay = async () => {
        setLoading(true);

        // Algoritmo de Pontuação de Saúde Financeira (0 a 100)
        let score = 50; // Base score
        const { income, expenses, debts, investments } = answers;

        // 1. Ratio of Expenses to Income (Lower is better)
        const expenseRatio = income > 0 ? expenses / income : 1;
        if (expenseRatio <= 0.5) score += 20;
        else if (expenseRatio <= 0.7) score += 10;
        else if (expenseRatio >= 0.9) score -= 20;

        // 2. Emergency Fund Check (Investments vs Expenses)
        const monthsOfSurvival = expenses > 0 ? investments / expenses : 0;
        if (monthsOfSurvival >= 6) score += 20;
        else if (monthsOfSurvival >= 3) score += 10;
        else if (monthsOfSurvival < 1) score -= 10;

        // 3. Debt burden
        const debtRatioToIncome = income > 0 ? debts / income : 0;
        if (debts === 0) score += 10;
        else if (debtRatioToIncome > 5) score -= 20; // High debt

        // Clamp between 0 and 100
        score = Math.max(0, Math.min(100, Math.round(score)));

        // Determine AI tip based on score
        let tip = '';
        let status = '';
        let color = '';
        if (score >= 80) {
            status = 'Excelente';
            color = 'text-emerald-500';
            tip = 'Suas finanças estão formidáveis. Você tem boa capacidade de poupança e reservas sólidas. Seu foco agora deve ser otimização tributária e aceleração do F.I.R.E.';
        } else if (score >= 50) {
            status = 'Atenção';
            color = 'text-yellow-500';
            tip = 'Você está sobrevivendo, mas a linha é tênue. O ideal é reduzir suas despesas fixas para aumentar sua taxa de poupança mensal e construir um colchão de segurança de pelo menos 6 meses.';
        } else {
            status = 'Risco Crítico';
            color = 'text-red-500';
            tip = 'Seu orçamento está sufocado. O primeiro passo é renegociar qualquer dívida cara (cartão/cheque especial) e cortar gastos variáveis imediatamente. Não invista antes de quitar as pendências.';
        }

        const finalResult = { score, tip, status, color, raw: answers };

        // Save to Supabase User Profile / Preferences
        if (user) {
            try {
                // We'll store it in a custom format or directly in user metadata depending on architecture.
                // Assuming `user_preferences` table or similar auth metadata updates. For now we use auth updates.
                const { error } = await supabase.auth.updateUser({
                    data: { financial_health_score: score, financial_health_status: status }
                });
                if (error) console.error("Could not save X-Ray score", error);

                // Also trigger a local storage update so dashboard picks it up immediately
                const storedScores = JSON.parse(localStorage.getItem('sf_xray_history') || '[]');
                storedScores.push({ date: new Date().toISOString(), score, status });
                localStorage.setItem('sf_xray_history', JSON.stringify(storedScores));
                localStorage.setItem('sf_xray_latest', JSON.stringify(finalResult));

            } catch (err) {
                console.error(err);
            }
        }

        // Simulate AI thinking delay for effect
        setTimeout(() => {
            setResult(finalResult);
            setLoading(false);
        }, 2000);
    };

    const finishDiagnosis = () => {
        if (onComplete) {
            onComplete(result);
        } else {
            if (onClose) onClose(result);
        }
    };

    // Render logic
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-2xl bg-white dark:bg-surface-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Close Button if applicable */}
                {onClose && (
                    <button onClick={() => onClose(null)} className="absolute top-6 right-6 z-20 p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}

                {/* Header Progress */}
                {!result && !loading && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 dark:bg-surface-800">
                        <div
                            className="h-full bg-brand-500 transition-all duration-500 ease-out"
                            style={{ width: `${((step) / QUESTIONS.length) * 100}%` }}
                        />
                    </div>
                )}

                <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-fade-in text-gray-900 dark:text-white">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-xl animate-pulse" />
                                <Activity className="w-16 h-16 text-brand-500 animate-[bounce_2s_infinite]" />
                            </div>
                            <h3 className="text-2xl font-black mb-2 flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5 text-brand-500" />
                                Processando Raio-X
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">A Inteligência Estratégica AI está analisando seus padrões financeiros...</p>
                        </div>
                    ) : result ? (
                        <div className="flex flex-col h-full py-4 animate-fade-in text-center">
                            <div className="mb-8 flex justify-center">
                                <div className="relative w-48 h-48 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90 absolute inset-0">
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-surface-800" />
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="552.92" strokeDashoffset={552.92 - (552.92 * result.score) / 100} className={`${result.color} transition-all duration-1500 ease-out`} />
                                    </svg>
                                    <div className="flex flex-col items-center justify-center z-10">
                                        <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">{result.score}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${result.color} px-2 py-1 bg-${result.color.split('-')[1]}-500/10 rounded-lg`}>
                                            {result.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Seu Diagnóstico Financeiro</h2>
                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 mb-8 max-w-lg mx-auto text-left shadow-inner">
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm font-medium">
                                    {result.tip}
                                </p>
                            </div>

                            <button onClick={finishDiagnosis} className="mx-auto flex items-center justify-center gap-2 gradient-btn w-full max-w-md py-4 rounded-xl text-white font-bold shadow-lg shadow-brand-500/30">
                                Ir para o Dashboard <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full py-8 text-center animate-fade-in">
                            <div className="flex justify-center mb-6">{QUESTIONS[step].icon}</div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                                {QUESTIONS[step].title}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-lg mx-auto text-sm md:text-base">
                                {QUESTIONS[step].subtitle}
                            </p>

                            <div className="max-w-xs mx-auto w-full relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-gray-400 dark:text-gray-500 text-xl">R$</span>
                                <input
                                    type="number"
                                    value={answers[QUESTIONS[step].key] || ''}
                                    onChange={(e) => handleChange(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full bg-gray-50 dark:bg-black/20 border-2 border-gray-200 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 text-2xl md:text-3xl font-black text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition-all shadow-inner"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {!result && !loading && (
                    <div className="p-6 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                        {step > 0 ? (
                            <button onClick={handleBack} className="px-6 py-3 rounded-xl font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                Voltar
                            </button>
                        ) : (
                            <div className="px-6" /> // spacer
                        )}
                        <button onClick={handleNext} className="gradient-btn px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20">
                            {step === QUESTIONS.length - 1 ? 'Analisar Perfil' : 'Continuar'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
