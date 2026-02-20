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
    Crown,
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
        { to: '/app/budget', label: 'Orcamento', icon: PiggyBank },
        { to: '/app/goals', label: 'Metas', icon: Target },
        { to: '/app/networth', label: 'Patrimonio', icon: Landmark },
        { to: '/app/reports', label: 'Relatorios', icon: FileText },
        { to: '/app/health', label: 'Saude', icon: Heart },
        { to: '/app/api', label: 'Webhooks', icon: Code2 },
        { to: '/app/advisor', label: t('ai_assistant'), icon: Bot },
    ];

    const userInitial = user?.email?.[0]?.toUpperCase() || 'U';
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center h-16 px-4 border-b border-gray-200 dark:border-white/5 ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <Link to="/app" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
                    <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/30 transition-all duration-300">
                        <Wallet className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 tracking-tight whitespace-nowrap">
                            SmartFinance
                        </span>
                    )}
                </Link>

                {/* Mobile close */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="md:hidden ml-auto p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${collapsed ? 'justify-center' : ''
                            } ${isActive
                                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)] border border-brand-500/20'
                                : 'text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}

                {/* Upgrade / Pro badge */}
                <div className={`mt-4 ${collapsed ? 'px-1' : 'px-1'}`}>
                    {!isPro ? (
                        <Link
                            to="/app/upgrade"
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all ${collapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5'
                                }`}
                            title={collapsed ? 'Upgrade Pro' : undefined}
                        >
                            <Sparkles className="w-4 h-4 flex-shrink-0" />
                            {!collapsed && <span>DESBLOQUEAR PRO</span>}
                        </Link>
                    ) : (
                        <div className={`flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-surface-800 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-xs font-bold ${collapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5'
                            }`}>
                            <Crown className="w-4 h-4 flex-shrink-0 fill-current" />
                            {!collapsed && <span>PRO ATIVO</span>}
                        </div>
                    )}
                </div>
            </nav>

            {/* Bottom section */}
            <div className="border-t border-gray-200 dark:border-white/5 p-3 space-y-1">
                {/* Theme Toggle */}
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-3 py-1'}`}>
                    <ThemeToggle />
                </div>

                {/* Settings */}
                <NavLink
                    to="/app/settings"
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? t('settings') : undefined}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${collapsed ? 'justify-center' : ''
                        } ${isActive
                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
                        }`
                    }
                >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{t('settings')}</span>}
                </NavLink>

                {/* User info + Logout */}
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-surface-700 dark:to-surface-800 border border-white/20 dark:border-white/10 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-white flex-shrink-0">
                        {userInitial}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{userName}</p>
                            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSignOut}
                    title={collapsed ? t('logout') : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ${collapsed ? 'justify-center' : ''
                        }`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{t('logout')}</span>}
                </button>
            </div>

            {/* Collapse toggle (desktop only) */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex items-center justify-center h-10 border-t border-gray-200 dark:border-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className={`hidden md:flex flex-col fixed top-0 left-0 h-screen bg-white/95 dark:bg-surface-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-white/5 z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {sidebarContent}
            </aside>

            {/* Mobile sidebar */}
            <aside
                className={`md:hidden fixed top-0 left-0 h-screen w-72 bg-white dark:bg-surface-900 border-r border-gray-200 dark:border-white/5 z-40 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
