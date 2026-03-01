import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex font-sans selection:bg-[var(--menta-soft)] selection:text-[var(--menta-dark)] transition-colors duration-500 relative overflow-hidden">
            {/* Background Effects 3D */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="tech-grid-bg opacity-[0.15] dark:opacity-25" />
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--brand-soft)] blur-[120px] opacity-20 animate-float" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] opacity-20 animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-base)] to-[var(--bg-base)] opacity-80" />
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
