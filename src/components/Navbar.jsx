import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscription } from '../hooks/useSubscription';
import { useTransactions } from '../hooks/useTransactions';
import { parseISO, isSameMonth } from 'date-fns';
import {
    LayoutDashboard, ArrowRightLeft, Wallet, PieChart, Bot, Crown, Settings,
    ChevronDown, LogOut, Menu, X, Sparkles, CreditCard, CalendarDays,
    Target, Heart, Landmark, FileText, Code2, PiggyBank, Bell
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import ThemeToggle from './ThemeToggle';

const FLAGS = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', cn: '🇨🇳', hi: '🇮🇳' };

export default function Navbar() {
    const { user, signOut } = useAuth();
    const { language, changeLanguage, t } = useLanguage();
    const { isPro } = useSubscription();
    const { transactions } = useTransactions();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const profileRef = useRef(null);
    const langRef = useRef(null);
    const notifRef = useRef(null);

    // Fechar dropdowns ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
            if (langRef.current && !langRef.current.contains(event.target)) setLangOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    // Calculate Budget Notifications
    const notifications = useMemo(() => {
        const notifs = [];
        try {
            const budgets = JSON.parse(localStorage.getItem('sf_category_budgets') || '{}');
            if (Object.keys(budgets).length === 0) return notifs;

            const now = new Date();
            const currentMonthTxs = transactions.filter(t => t.type === 'expense' && t.status !== 'pending' && isSameMonth(parseISO(t.date), now));
            const catTotals = {};

            currentMonthTxs.forEach(t => {
                const c = t.category || 'outros';
                catTotals[c] = (catTotals[c] || 0) + Math.abs(t.amount);
            });

            Object.entries(budgets).forEach(([cat, limit]) => {
                const spent = catTotals[cat] || 0;
                if (spent > limit) {
                    notifs.push({
                        id: `over_${cat}`,
                        title: 'Orçamento Excedido!',
                        message: `Você gastou R$ ${spent.toFixed(2)} em ${cat.toUpperCase()}, ultrapassando o limite de R$ ${limit.toFixed(2)}.`,
                        type: 'danger'
                    });
                } else if (spent >= limit * 0.8) {
                    notifs.push({
                        id: `warn_${cat}`,
                        title: 'Aviso de Orçamento',
                        message: `Atenção: Você consumiu ${((spent / limit) * 100).toFixed(0)}% do limite planejado para ${cat.toUpperCase()}.`,
                        type: 'warning'
                    });
                }
            });
        } catch (e) { console.error(e); }
        return notifs;
    }, [transactions]);

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
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-white/5 bg-white/90 dark:bg-surface-900/80 backdrop-blur-xl transition-all duration-300">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo Area */}
                    <div className="flex items-center gap-8">
                        <Link to="/app" className="flex items-center gap-2.5 group">
                            <div className="relative w-9 h-9 flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/30 transition-all duration-300">
                                <Wallet className="w-5 h-5 text-white" strokeWidth={2.5} />
                                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-600 to-gray-500 dark:from-white dark:to-gray-400 tracking-tight">
                                SmartFinance
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                        }`
                                    }
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Notifications Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-surface-900 shadow-sm" />
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/10 shadow-2xl dark:shadow-black/50 py-2 animate-fade-in origin-top-right ring-1 ring-black/5">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5">
                                        <h3 className="font-bold text-gray-900 dark:text-white">Notificações</h3>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-500">Nenhum alerta recente.</div>
                                        ) : notifications.map(n => (
                                            <div key={n.id} className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'danger' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-yellow-500'}`} />
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{n.title}</p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-snug">{n.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-4 py-2 border-t border-gray-100 dark:border-white/5 mt-1 text-center">
                                        <Link to="/app/health" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">Ir para Metas de Orçamento</Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Language Selector */}
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className="text-lg">{FLAGS[language]}</span>
                            </button>

                            {langOpen && (
                                <div className="absolute right-0 mt-2 w-48 py-1 rounded-xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/10 shadow-xl dark:shadow-black/50 animate-fade-in origin-top-right ring-1 ring-black/5">
                                    {Object.entries(FLAGS).map(([code, flag]) => (
                                        <button
                                            key={code}
                                            onClick={() => { changeLanguage(code); setLangOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${language === code ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/5' : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <span className="text-lg">{flag}</span>
                                            <span className="capitalize">{code === 'pt' ? 'Português' : code === 'en' ? 'English' : code}</span>
                                            {language === code && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pro Badge / Upgrade Button */}
                        <div className="hidden sm:block">
                            {!isPro ? (
                                <Link
                                    to="/app/upgrade"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all transform hover:-translate-y-0.5"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>DESBLOQUEAR PRO</span>
                                </Link>
                            ) : (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-surface-800 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-xs font-bold shadow-glow-sm">
                                    <Crown className="w-3.5 h-3.5 fill-current" />
                                    <span>PRO ATIVO</span>
                                </span>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors truncate max-w-[100px]">
                                        {userName}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400 transition-colors">
                                        {isPro ? 'Membro Pro' : 'Plano Grátis'}
                                    </p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-surface-700 dark:to-surface-800 border border-white/20 dark:border-white/10 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-white shadow-inner group-hover:border-brand-500/50 transition-colors">
                                    {userInitial}
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-surface-900 border border-gray-100 dark:border-white/10 shadow-2xl dark:shadow-black/50 py-1.5 animate-fade-in origin-top-right ring-1 ring-black/5">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>

                                    <Link
                                        to="/app/settings"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        {t('settings')}
                                    </Link>

                                    <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />

                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('logout')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 top-16 z-40 bg-white/95 dark:bg-surface-950/95 backdrop-blur-xl animate-fade-in border-t border-gray-200 dark:border-white/10">
                    <div className="p-4 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${isActive
                                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        ))}

                        <div className="h-px bg-gray-100 dark:bg-white/10 my-4" />

                        {!isPro && (
                            <Link
                                to="/app/upgrade"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold shadow-lg shadow-brand-500/25 mb-4"
                            >
                                <Sparkles className="w-4 h-4" />
                                Desbloquear Pro
                            </Link>
                        )}

                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-3.5 w-full rounded-xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            {t('logout')}
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
