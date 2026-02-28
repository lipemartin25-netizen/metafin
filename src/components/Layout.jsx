import { tw } from '@/lib/theme';
﻿import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
    return (
        <div className="min-h-screen bg-gray-950 flex font-sans selection:bg-purple-500/30">
            <Sidebar />
            <div className="flex-1 ml-0 md:ml-64 transition-all">
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 md:pb-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
