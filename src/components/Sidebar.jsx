import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscription } from '../hooks/useSubscription';
import {
    LayoutDashboard,
    ArrowRightLeft,
    CreditCard,
    FileText,
    Landmark,
    Briefcase,
    Building2,
    HeartPulse,
    Calculator,
    Target,
    BarChart3,
    Sparkles,
    FlaskConical,
    Webhook,
    Settings,
    LogOut,
    TrendingUp,
    Crown,
    X,
    ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const { isPro } = useSubscription();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const displayName =
        user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
    const displayEmail = user?.email || '';

    const navItems = [
        { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/app/transactions', label: 'Transações', icon: ArrowRightLeft },
        { to: '/app/cards', label: 'Cartões', icon: CreditCard },
        { to: '/app/bills', label: 'Contas a Pagar', icon: FileText },
        { to: '/app/accounts', label: 'Saldos & Bancos', icon: Landmark },
        { to: '/app/investments', label: 'Investimentos', icon: Briefcase },
        { to: '/app/patrimony', label: 'Patrimônio', icon: Building2 },
        { to: '/app/health', label: 'Saúde', icon: HeartPulse },
        { to: '/app/budget', label: 'Orçamento', icon: Calculator },
        { to: '/app/goals', label: 'Metas', icon: Target },
        { to: '/app/reports', label: 'Relatórios', icon: BarChart3 },
        { to: '/app/advisor', label: 'Assistente IA', icon: Sparkles },
        { to: '/app/lab', label: 'Laboratório Wealth', icon: FlaskConical },
        { to: '/app/webhooks', label: 'Webhooks', icon: Webhook },
        { to: '/app/settings', label: 'Configurações', icon: Settings },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <>
            {/* Sidebar Desktop */}
            <aside
                className={`hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                    }`}
                style={{
                    background: 'linear-gradient(180deg, rgba(16,19,28,0.98) 0%, rgba(10,12,20,0.99) 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
                }}
            >
                {/* Header / Logo */}
                <div className="flex items-center justify-between px-5 h-16 border-b border-white/5">
                    <NavLink to="/app" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="text-base font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                    Meta
                                </span>
                                <span className="text-[10px] text-gray-500 -mt-0.5 tracking-wider uppercase">
                                    Finance Hub
                                </span>
                            </div>
                        )}
                    </NavLink>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Pro Badge */}
                {!collapsed && (
                    <div className="px-4 pt-4 pb-2">
                        {isPro ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                                <Crown className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-semibold text-emerald-400">Plano Pro Ativo</span>
                            </div>
                        ) : (
                            <Link
                                to="/app/upgrade"
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Desbloquear Pro
                            </Link>
                        )}
                    </div>
                )}

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            title={collapsed ? item.label : undefined}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive
                                    ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                                } ${collapsed ? 'justify-center' : ''}`
                            }
                        >
                            <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors`} />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User & Logout */}
                <div className="border-t border-white/5 p-4">
                    {!collapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-sm font-bold uppercase border border-white/10">
                                {displayName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                                <p className="text-[11px] text-gray-500 truncate">{displayEmail}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Sair"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleSignOut}
                            className="w-full p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex justify-center"
                            title="Sair"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </aside>

            {/* Mobile Bottom Bar (mantém acessibilidade mobile) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 px-2 py-2 flex items-center justify-around"
                style={{ background: 'rgba(10,12,20,0.95)', backdropFilter: 'blur(20px)' }}
            >
                {navItems.slice(0, 5).map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-medium transition-all ${isActive
                                ? 'text-emerald-400'
                                : 'text-gray-500 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </>
    );
}
