import { NavLink, useNavigate } from 'react-router-dom';
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
    ChevronDown,
    LogOut,
    Sparkles
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const FLAGS = {
    pt: '🇧🇷',
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    cn: '🇨🇳',
    hi: '🇮🇳',
};

export default function Navbar() {
    const { user, signOut } = useAuth();
    const { language, changeLanguage, t } = useLanguage();
    const { isPro } = useSubscription();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const profileRef = useRef(null);
    const langRef = useRef(null);

    // Fechar dropdowns ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
            if (langRef.current && !langRef.current.contains(event.target)) {
                setLangOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    // Itens de navegação resumidos para o topo (apenas os principais)
    const navItems = [
        { to: '/app', label: 'Início', icon: LayoutDashboard, end: true },
        { to: '/app/advisor', label: 'IA Advisor', icon: Bot },
    ];

    const userInitial = user?.email?.[0]?.toUpperCase() || 'U';
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

    return (
        <nav className="sticky top-0 z-30 w-full border-b border-gray-200/50 dark:border-white/5 bg-white/70 dark:bg-surface-900/60 backdrop-blur-md transition-all duration-300">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">

                    {/* Left Side: Breadcrumbs / Path Info */}
                    <div className="flex items-center gap-4">
                        <div className="flex md:hidden">
                            {/* No mobile menu button here, handled by sidebar mobile */}
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive
                                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`
                                    }
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Language, Pro, Profile */}
                    <div className="flex items-center gap-3">

                        {/* Language Selector */}
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className="text-base">{FLAGS[language]}</span>
                            </button>

                            {langOpen && (
                                <div className="absolute right-0 mt-2 w-48 py-1 rounded-xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/10 shadow-xl animate-fade-in origin-top-right ring-1 ring-black/5">
                                    {Object.entries(FLAGS).map(([code, flag]) => (
                                        <button
                                            key={code}
                                            onClick={() => { changeLanguage(code); setLangOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${language === code ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/5' : 'text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <span className="text-lg">{flag}</span>
                                            <span className="capitalize">{code === 'pt' ? 'Português' : code === 'en' ? 'English' : code}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pro Badge */}
                        <div className="hidden sm:block">
                            {isPro ? (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-[10px] font-bold">
                                    <Crown className="w-3 h-3 fill-current" />
                                    PRO
                                </span>
                            ) : (
                                <NavLink
                                    to="/app/upgrade"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-[10px] font-bold shadow-sm hover:bg-brand-600 transition-all"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    UPGRADE
                                </NavLink>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-surface-800 border border-gray-300 dark:border-white/10 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-white">
                                    {userInitial}
                                </div>
                                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-surface-900 border border-gray-100 dark:border-white/10 shadow-2xl py-1.5 animate-fade-in origin-top-right ring-1 ring-black/5">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>

                                    <NavLink
                                        to="/app/settings"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        {t('settings')}
                                    </NavLink>

                                    <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />

                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('logout')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
