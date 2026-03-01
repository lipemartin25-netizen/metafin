import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { tw } from '../lib/theme';
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
    Menu,
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function Sidebar() {
    const { user, signOut } = useAuth();
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
            <aside className={`${tw.sidebar} hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
                {/* Header / Logo */}
                <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--border-divider)]">
                    <NavLink to="/app" className="flex items-center gap-3">
                        <div className={`${tw.iconBox} shadow-lg shadow-[var(--menta-glow)]`}>
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-[var(--text-primary)] leading-none">MetaFin</span>
                                <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase">Finance Hub</span>
                            </div>
                        )}
                    </NavLink>
                    <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all">
                        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Pro Badge */}
                {!collapsed && (
                    <div className="px-4 pt-4 pb-2">
                        {isPro ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--menta-soft)] border border-[var(--menta-border)]">
                                <Crown className="w-4 h-4 text-[var(--menta-dark)]" />
                                <span className="text-xs font-semibold text-[var(--menta-dark)]">Plano Pro Ativo</span>
                            </div>
                        ) : (
                            <Link to="/app/upgrade" className={`${tw.btnPrimary} w-full text-xs font-bold gap-2`}>
                                <Sparkles className="w-3.5 h-3.5" />
                                Desbloquear Pro
                            </Link>
                        )}
                    </div>
                )}

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar scroll-smooth">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            title={collapsed ? item.label : undefined}
                            className={({ isActive }) => `${isActive ? tw.sidebarItemActive : tw.sidebarItem} ${collapsed ? 'justify-center' : ''}`}
                        >
                            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User & Logout */}
                <div className="border-t border-[var(--border-divider)] p-4">
                    <div className="flex items-center gap-3">
                        <div className={`${tw.iconBoxAlt} w-9 h-9 text-xs font-bold uppercase`}>
                            {displayName.charAt(0)}
                        </div>
                        {!collapsed && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{displayName}</p>
                                    <p className="text-[11px] text-[var(--text-muted)] truncate">{displayEmail}</p>
                                </div>
                                <button onClick={handleSignOut} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all shadow-sm">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* Mobile Navigation */}
            <MobileNav navItems={navItems} handleSignOut={handleSignOut} />
        </>
    );
}

function MobileNav({ navItems, handleSignOut }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const menuCategories = useMemo(() => [
        {
            title: 'Finanças',
            items: navItems.filter(i => ['Transações', 'Cartões', 'Contas a Pagar', 'Saldos & Bancos'].includes(i.label))
        },
        {
            title: 'Wealth & Crescimento',
            items: navItems.filter(i => ['Investimentos', 'Patrimônio', 'Saúde', 'Orçamento', 'Metas', 'Laboratório Wealth'].includes(i.label))
        },
        {
            title: 'Sistema',
            items: navItems.filter(i => ['Relatórios', 'Assistente IA', 'Webhooks', 'Configurações'].includes(i.label))
        }
    ], [navItems]);

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-subtle)] flex items-center overflow-x-auto hide-scrollbar safe-bottom bg-[var(--bg-navbar)] backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-1 px-4 py-2 min-w-full">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center min-w-[64px] h-[52px] gap-1 rounded-2xl transition-all ${isActive
                                    ? 'text-[var(--menta-dark)] bg-[var(--menta-soft)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-[9px] font-bold uppercase tracking-tighter truncate w-full text-center px-1">{item.label}</span>
                        </NavLink>
                    ))}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="flex flex-col items-center justify-center min-w-[64px] h-[52px] gap-1 text-[var(--text-muted)] font-bold uppercase"
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-[9px] tracking-tighter">Menu</span>
                    </button>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] animate-fade-in flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
                    <div className="relative w-full bg-[var(--bg-base)] rounded-t-[2.5rem] border-t border-[var(--border-subtle)] shadow-tech-card flex flex-col max-h-[92vh] animate-slide-up overflow-hidden">
                        <div className="w-12 h-1.5 bg-[var(--border-subtle)] rounded-full mx-auto mt-4 flex-shrink-0" />
                        <div className="p-6 border-b border-[var(--border-divider)] flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Menu</h2>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-1">Navegação Completa</p>
                            </div>
                            <button onClick={() => setIsMenuOpen(false)} className={`${tw.iconBox} w-10 h-10`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 pb-24">
                            <div className="space-y-10">
                                {menuCategories.map((cat, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-[var(--border-divider)]" />
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{cat.title}</p>
                                            <div className="h-px flex-1 bg-[var(--border-divider)]" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {cat.items.map((item) => (
                                                <NavLink
                                                    key={item.to}
                                                    to={item.to}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className={({ isActive }) =>
                                                        `flex flex-col items-center justify-center p-4 rounded-[2rem] border transition-all duration-300 group ${isActive
                                                            ? 'bg-[var(--menta-soft)] border-[var(--menta-border)] text-[var(--menta-dark)] shadow-sm'
                                                            : 'bg-[var(--bg-[var(--bg-elevated)])] border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
                                                        }`
                                                    }
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:-translate-y-px ${location.pathname === item.to ? 'bg-[var(--menta-soft)] shadow-inner' : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)]'}`}>
                                                        <item.icon className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-center leading-tight">{item.label}</span>
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-4">
                                    <button
                                        onClick={() => { setIsMenuOpen(false); handleSignOut(); }}
                                        className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-black active:scale-[0.98] transition-all"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Sair da Conta
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Efeito de fade no fundo do scroll */}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-[var(--bg-base)] from-[#0f172a] to-transparent pointer-events-none z-10" />
                    </div>
                </div>
            )}

        </>
    );
}
