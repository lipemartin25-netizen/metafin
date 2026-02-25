import BalanceCard from "../components/BalanceCard";
import SpendingChart from "../components/SpendingChart";
import TransactionList from "../components/TransactionList";
import QuickStats from "../components/QuickStats";
import GoalsCard from "../components/GoalsCard";
import CreditCard from "../components/CreditCard";
import AIPromptCard from "../components/AIPromptCard";

export default function Dashboard() {
    return (
        <div className="space-y-6">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-auto pb-10">

                {/* Balance Card — ocupa 2 colunas */}
                <div className="xl:col-span-2">
                    <BalanceCard />
                </div>

                {/* Credit Card Visual */}
                <div className="xl:col-span-2">
                    <CreditCard />
                </div>

                {/* AI Prompt Card — 2 colunas */}
                <div className="xl:col-span-2 xl:row-span-2">
                    <AIPromptCard />
                </div>

                {/* Spending Chart — 2 colunas */}
                <div className="xl:col-span-2">
                    <SpendingChart />
                </div>

                {/* Goals — 1 coluna */}
                <div className="xl:col-span-1">
                    <GoalsCard />
                </div>

                {/* Quick Stats — 4 cards */}
                <div className="xl:col-span-4">
                    <QuickStats />
                </div>

                {/* Transactions — full width */}
                <div className="xl:col-span-4">
                    <TransactionList />
                </div>
            </div>
        </div>
    );
}
