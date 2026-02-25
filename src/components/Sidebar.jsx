import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscription } from '../hooks/useSubscription';
import {
    LayoutDashboard,
    ArrowRightLeft,
    Wallet,
    PieChart,
    Bot,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    X,
    CreditCard,
    CalendarDays,
    Target,
    Heart,
    FileText,
    Code2,
    PiggyBank,
    Landmark
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import MetaFinLogo from './MetaFinLogo';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const { isPro } = useSubscription();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const navItems = [
        { to: '/app', label: t('dashboard'), icon: LayoutDashboard, end: true },
        { to: '/app/transactions', label: t('transactions'), icon: ArrowRightLeft },
        { to: '/app/accounts', label: 'Saldos & Bancos', icon: Wallet },
        { to: '/app/cards', label: 'Cartões', icon: CreditCard },
        { to: '/app/bills', label: 'Contas a Pagar', icon: CalendarDays },
        { to: '/app/investments', label: t('investments'), icon: PieChart },
        { to: '/app/budget', label: 'Orçamento', icon: PiggyBank },
        { to: '/app/goals', label: 'Metas', icon: Target },
        { to: '/app/wealth', label: 'Laboratório Wealth', icon: Sparkles },
        { to: '/app/networth', label: 'Patrimônio', icon: Landmark },
        { to: '/app/reports', label: 'Relatórios', icon: FileText },
        { to: '/app/health', label: 'Saúde', icon: Heart },
        { to: '/app/api', label: 'Webhooks', icon: Code2 },
        { to: '/app/advisor', label: t('ai_assistant'), icon: Bot },
    ];

    const userInitial = user?.email?.[0]?.toUpperCase() || 'U';
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    const sidebarContent = (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0a0f1e] text-slate-900 dark:text-white">
            {/* Logo Section */}
            <div className={`flex items-center h-20 px-6 border-b border-black/5 dark:border-white/5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
                <Link to="/app" className="flex items-center gap-3">
                    <MetaFinLogo className="h-8 w-auto flex-shrink-0" />
                </Link>

                {!collapsed && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden p-1.5 rounded-lg text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${collapsed ? 'justify-center' : ''
                            } ${isActive
                                ? 'bg-violet-500/10 dark:bg-gradient-to-r dark:from-violet-500/20 dark:to-indigo-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-lg shadow-violet-500/5'
                                : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${isActive ? 'text-violet-400' : 'text-white/30 group-hover:text-white/60'}`} />
                                {!collapsed && <span>{item.label}</span>}
                                {!collapsed && isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Settings Items (Image 1 style) */}
                <NavLink
                    to="/app/settings"
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? t('settings') : undefined}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${collapsed ? 'justify-center' : ''
                        } ${isActive
                            ? 'bg-violet-500/10 dark:bg-gradient-to-r dark:from-violet-500/20 dark:to-indigo-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-lg shadow-violet-500/5'
                            : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <Settings className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${isActive ? 'text-violet-400' : 'text-white/30 group-hover:text-white/60'}`} />
                            {!collapsed && <span>{t('settings')}</span>}
                            {!collapsed && isActive && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                            )}
                        </>
                    )}
                </NavLink>

                {/* Pro Badge */}
                {!isPro && !collapsed && (
                    <div className="mt-4 px-2">
                        <Link
                            to="/app/upgrade"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-400 transition-all shadow-lg shadow-violet-500/20"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>DESBLOQUEAR PRO</span>
                        </Link>
                    </div>
                )}
            </nav>

            {/* Bottom Section - User Profile */}
            <div className="px-3 pb-6 border-t border-black/5 dark:border-white/5 pt-4">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group relative cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-violet-500/20 flex-shrink-0">
                        {userInitial}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white/90 truncate">{userName}</p>
                            <p className="text-xs text-slate-500 dark:text-white/30 truncate">{user?.email}</p>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            onClick={handleSignOut}
                            className="text-white/20 hover:text-red-400 transition-colors"
                            title={t('logout')}
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>

                {/* Theme Toggle Button - Integrated nicely */}
                {!collapsed && (
                    <div className="mt-2 flex justify-center">
                        <ThemeToggle />
                    </div>
                )}

                {/* Collapse Control (Desktop) */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex items-center justify-center w-full mt-2 py-2 text-white/20 hover:text-white/60 transition-colors"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop aside */}
            <aside
                className={`hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-300 border-r border-black/5 dark:border-white/5 ${collapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {sidebarContent}
            </aside>

            {/* Mobile aside */}
            <aside
                className={`md:hidden fixed top-0 left-0 h-screen w-72 z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
