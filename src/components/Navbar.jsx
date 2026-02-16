import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscription } from '../hooks/useSubscription';
import {
    LayoutDashboard,
    ArrowRightLeft,
    LogOut,
    TrendingUp,
    Menu,
    X,
    Sparkles,
    Banknote,
    Globe,
    Briefcase,
    Crown,
} from 'lucide-react';
import { useState } from 'react';

const FLAGS = {
    pt: '🇧🇷',
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    cn: '🇨🇳',
    hi: '🇮🇳',
};

const LANG_NAMES = {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    fr: 'Français',
    cn: '中文',
    hi: 'हिंदी',
};

export default function Navbar() {
    const { user, signOut, isDemo } = useAuth();
    const { language, changeLanguage, t } = useLanguage();
    const { isPro } = useSubscription();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);

    const navItems = [
        { to: '/app', label: t('dashboard'), icon: LayoutDashboard, end: true },
        { to: '/app/transactions', label: t('transactions'), icon: ArrowRightLeft },
        { to: '/app/accounts', label: t('accounts'), icon: Banknote },
        { to: '/app/investments', label: t('investments'), icon: Briefcase },
        { to: '/app/advisor', label: t('ai_assistant'), icon: Sparkles },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const displayName =
        user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

    return (
        <nav className="glass border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <NavLink to="/app" className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white hidden sm:block">
                            SmartFinance
                        </span>
                    </NavLink>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`
                                }
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        {/* Upgrade Button / Pro Badge */}
                        <div className="hidden sm:flex items-center">
                            {!isPro ? (
                                <Link
                                    to="/app/upgrade"
                                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-1"
                                >
                                    <Sparkles className="w-3 h-3" /> Upgrade
                                </Link>
                            ) : (
                                <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium flex items-center gap-1 border border-emerald-500/20">
                                    <Crown className="w-3 h-3" /> Pro
                                </span>
                            )}
                        </div>

                        {/* Language Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setLangMenuOpen(!langMenuOpen)}
                                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1"
                                title="Mudar Idioma"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="text-xs">{FLAGS[language]}</span>
                            </button>

                            {langMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-40 glass-card p-1 z-20 shadow-xl border border-white/10">
                                        {Object.keys(FLAGS).map(code => (
                                            <button
                                                key={code}
                                                onClick={() => { changeLanguage(code); setLangMenuOpen(false); }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10 transition-all ${language === code ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-300'
                                                    }`}
                                            >
                                                <span>{FLAGS[code]}</span>
                                                <span>{LANG_NAMES[code]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>


                        <span className="text-sm text-gray-400 hidden sm:block truncate max-w-[100px]">
                            {displayName}
                        </span>
                        <button
                            onClick={handleSignOut}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title={t('logout')}
                        >
                            <LogOut className="w-4 h-4" />
                        </button>

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            {mobileOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {mobileOpen && (
                    <div className="md:hidden pb-4 space-y-1 animate-fade-in border-t border-white/5 mt-2 pt-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`
                                }
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </NavLink>
                        ))}

                        {/* Mobile Upgrade Link */}
                        {!isPro && (
                            <Link
                                to="/app/upgrade"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-emerald-400 bg-emerald-500/10"
                            >
                                <Sparkles className="w-4 h-4" />
                                Desbloquear Pro
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
