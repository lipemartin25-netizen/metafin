import { useState } from "react";
import Sidebar from "../components/ModernSidebar";
import Header from "../components/Header";
import BalanceCard from "../components/BalanceCard";
import SpendingChart from "../components/SpendingChart";
import TransactionList from "../components/TransactionList";
import QuickStats from "../components/QuickStats";
import GoalsCard from "../components/GoalsCard";
import CreditCard from "../components/CreditCard";

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#020617] text-white overflow-hidden">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-auto">

                        {/* Balance Card — ocupa 2 colunas */}
                        <div className="xl:col-span-2">
                            <BalanceCard />
                        </div>

                        {/* Credit Card Visual */}
                        <div className="xl:col-span-2">
                            <CreditCard />
                        </div>

                        {/* Quick Stats — 4 cards */}
                        <div className="xl:col-span-4">
                            <QuickStats />
                        </div>

                        {/* Spending Chart — 3 colunas */}
                        <div className="xl:col-span-3">
                            <SpendingChart />
                        </div>

                        {/* Goals — 1 coluna */}
                        <div className="xl:col-span-1">
                            <GoalsCard />
                        </div>

                        {/* Transactions — full width */}
                        <div className="xl:col-span-4">
                            <TransactionList />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
