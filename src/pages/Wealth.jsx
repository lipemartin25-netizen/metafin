import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getFinancialSummary } from '../lib/analytics';
import { format, subDays } from 'date-fns';
import { Rocket, Lightbulb, Wallet, Calculator, Play, GraduationCap } from 'lucide-react';
import FIRESimulator from '../components/FIRESimulator';
import RetirementSimulator from '../components/RetirementSimulator';
import InvestmentSimulator from '../components/InvestmentSimulator';
import TaxPlanner from '../components/TaxPlanner';
import FinancialEducation from '../components/FinancialEducation';

export default function Wealth() {
    const [activeTab, setActiveTab] = useState('fire');
    const [financialData, setFinancialData] = useState({ income: 8000, expenses: 5000, investments: 100000 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Em um cenário real, poderiamos calcular a media de receitas/despesas
                const endDate = new Date();
                const startDate = subDays(endDate, 30);

                const { data: transactions } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('date', format(startDate, 'yyyy-MM-dd'))
                    .lte('date', format(endDate, 'yyyy-MM-dd'));

                const { data: accounts } = await supabase
                    .from('accounts')
                    .select('*')
                    .eq('user_id', user.id);

                const summary = getFinancialSummary(transactions || [], accounts || []);

                setFinancialData({
                    income: summary.income || 8000,
                    expenses: summary.expenses || 5000,
                    investments: summary.balance || 100000 // Usando saldo como proxy de investimento inicial para o teste
                });
            } catch (err) {
                console.error("Erro ao carregar dados:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    const tabs = [
        { id: 'fire', label: 'Independência FIRE', icon: <Rocket className="w-4 h-4" /> },
        { id: 'retirement', label: 'Aposentadoria Segura', icon: <Wallet className="w-4 h-4" /> },
        { id: 'investments', label: 'Rendimentos', icon: <Calculator className="w-4 h-4" /> },
        { id: 'tax', label: 'Dedução de IR', icon: <Play className="w-4 h-4" /> },
        { id: 'education', label: 'Academia', icon: <GraduationCap className="w-4 h-4" /> },
    ];

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center pt-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pt-16 lg:pt-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Lightbulb className="h-8 w-8 text-yellow-500" />
                        Laboratório Wealth
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Poderosos simuladores com IA para acelerar a sua libertação financeira.
                    </p>
                </div>
            </div>

            {/* Navegação Secundária (Tabs) */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all font-medium text-sm
                            ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-gray-100/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* View Ativa */}
            <div className="animate-fade-in transition-all">
                {activeTab === 'fire' && <FIRESimulator financialData={financialData} />}
                {activeTab === 'retirement' && <RetirementSimulator financialData={financialData} />}
                {activeTab === 'investments' && <InvestmentSimulator financialData={financialData} />}
                {activeTab === 'tax' && <TaxPlanner financialData={financialData} />}
                {activeTab === 'education' && <FinancialEducation />}
            </div>
        </div>
    );
}
