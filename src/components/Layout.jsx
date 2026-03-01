import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex font-sans selection:bg-[var(--menta-soft)] selection:text-[var(--menta-dark)] transition-colors duration-500 relative overflow-hidden">
            {/* Landing Page Pattern Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="tech-grid-bg opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-base)] to-[var(--bg-base)] opacity-70" />
            </div>

            <Sidebar />
            <div className="flex-1 ml-0 md:ml-64 transition-all relative z-10">
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 md:pb-8 relative z-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
