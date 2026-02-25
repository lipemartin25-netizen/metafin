import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme } = useTheme();

    return (
        <div className={`${theme} min-h-screen transition-colors duration-300`}>
            <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#020617] text-white'} flex overflow-hidden`}>
                {/* Mesh Background */}
                <div className="fixed inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                </div>

                <Sidebar
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                />

                {mobileOpen && (
                    <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
                )}

                <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 overflow-hidden ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                    {/* Mobile top bar */}
                    <div className={`md:hidden sticky top-0 z-20 flex items-center h-16 px-6 backdrop-blur-xl border-b ${theme === 'light' ? 'bg-white/90 border-black/5' : 'bg-[#0a0f1e]/80 border-white/5'}`}>
                        <button onClick={() => setMobileOpen(true)} className={`p-2 -ml-2 rounded-lg transition-all ${theme === 'light' ? 'text-slate-600 hover:bg-black/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <span className={`ml-3 text-lg font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>MetaFin</span>
                    </div>

                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
