import { tw } from '@/lib/theme';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
            <aside
                className={`hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
            >
                {/* Header / Logo */}
                <div className="flex items-center justify-between px-5 h-16 border-b border-white/5">
                    <NavLink to="/app" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-glow rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="text-base font-bold bg-gradient-to-r from-brand-glow to-brand-glow bg-clip-text text-transparent">
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
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800/40/5 transition-all"
                    >
                        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Pro Badge */}
                {!collapsed && (
                    <div className="px-4 pt-4 pb-2">
                        {isPro ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-primary/10 to-brand-glow/10 border border-brand-primary/20">
                                <Crown className="w-4 h-4 text-brand-glow" />
                                <span className="text-xs font-semibold text-brand-glow">Plano Pro Ativo</span>
                            </div>
                        ) : (
                            <Link
                                to="/app/upgrade"
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-glow text-white text-xs font-bold hover:shadow-lg hover:shadow-brand-primary/25 transition-all"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Desbloquear Pro
                            </Link>
                        )}
                    </div>
                )}

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar scroll-smooth">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            title={collapsed ? item.label : undefined}
                            aria-label={item.label}
                            aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive
                                    ? 'bg-gradient-to-r from-brand-primary/15 to-brand-glow/10 text-brand-glow border border-brand-primary/20 shadow-lg shadow-black/10 shadow-brand-primary/5'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/40/[0.04] border border-transparent'
                                } ${collapsed ? 'justify-center' : ''}`
                            }
                        >
                            <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors`} aria-hidden="true" />
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

            {/* Mobile Navigation */}
            <MobileNav navItems={navItems} handleSignOut={handleSignOut} />
        </>
    );
}

function MobileNav({ navItems, handleSignOut }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    // Categorias para o menu "Mais"
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
            {/* Bottom Bar — Scrollable showing all items */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 flex items-center overflow-x-auto hide-scrollbar safe-bottom"
                style={{ background: 'rgba(10,12,20,0.98)', backdropFilter: 'blur(30px)' }}
            >
                <div className="flex items-center gap-1 px-4 py-2 min-w-full">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center min-w-[64px] h-[52px] gap-1 rounded-2xl transition-all ${isActive
                                    ? 'text-brand-glow bg-brand-primary/10'
                                    : 'text-gray-500 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center px-1">{item.label}</span>
                        </NavLink>
                    ))}

                    {/* Botão para abrir o menu expandido (opcional, mantendo por segurança) */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="flex flex-col items-center justify-center min-w-[64px] h-[52px] gap-1 text-gray-400 font-black uppercase"
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-[9px] tracking-tighter">Menu</span>
                    </button>
                </div>
            </div>

            {/* Slide-up Menu */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] animate-fade-in flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
                    <div className="relative w-full bg-[#0f172a] rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] animate-slide-up overflow-hidden">
                        {/* Puxador para o menu */}
                        <div className="w-12 h-1.5 bg-gray-800/40/20 rounded-full mx-auto mt-4 flex-shrink-0" />

                        <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-white">Ecossistema</h2>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Acesso a todos os módulos</p>
                            </div>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2.5 bg-gray-800/40/5 hover:bg-gray-800/40/10 rounded-2xl text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 pb-24">
                            <div className="space-y-10">
                                {menuCategories.map((cat, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{cat.title}</p>
                                            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {cat.items.map((item) => (
                                                <NavLink
                                                    key={item.to}
                                                    to={item.to}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className={({ isActive }) =>
                                                        `flex flex-col items-center justify-center p-4 rounded-[2rem] border transition-all duration-300 group ${isActive
                                                            ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-glow shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]'
                                                            : 'bg-gray-800/40/[0.03] border-white/5 text-gray-400 hover:bg-gray-800/40/[0.08] hover:border-white/10'
                                                        }`
                                                    }
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${location.pathname === item.to ? 'bg-brand-primary/20' : 'bg-gray-800/40/5 animate-pulse-slow'
                                                        }`}>
                                                        <item.icon className="w-6 h-6" />
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
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none z-10" />
                    </div>
                </div>
            )}

        </>
    );
}
