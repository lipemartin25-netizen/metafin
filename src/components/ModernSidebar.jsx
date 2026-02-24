import { X, LayoutDashboard, ArrowLeftRight, CreditCard, PieChart, Target, Settings, LogOut, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import MetaFinLogo from "./MetaFinLogo";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true, to: "/app" },
    { icon: ArrowLeftRight, label: "Transações", to: "/app/transactions" },
    { icon: CreditCard, label: "Cartões", to: "/app/cards" },
    { icon: PieChart, label: "Relatórios", to: "/app/reports" },
    { icon: Target, label: "Metas", to: "/app/goals" },
    { icon: Settings, label: "Configurações", to: "/app/settings" },
];

export default function Sidebar({ open, onClose }) {
    return (
        <>
            {/* Overlay mobile */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64
          bg-[#030712] border-r border-white/5
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
                    <Link to="/" className="flex items-center gap-3">
                        <MetaFinLogo className="h-9 w-auto" />
                    </Link>
                    <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-6 space-y-1">
                    {navItems.map(({ icon: Icon, label, active, to }) => (
                        <Link
                            key={label}
                            to={to}
                            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200 group
                ${active
                                    ? "bg-gradient-to-r from-violet-500/20 to-indigo-500/10 text-violet-400 border border-violet-500/20"
                                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                                }
              `}
                        >
                            <Icon size={18} className={active ? "text-violet-400" : "text-white/30 group-hover:text-white/60"} />
                            {label}
                            {active && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* User */}
                <div className="px-3 pb-6 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-sm font-bold">
                            F
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/90 truncate">Felipe</p>
                            <p className="text-xs text-white/30 truncate">felipe@metafin.com</p>
                        </div>
                        <LogOut size={15} className="text-white/20 hover:text-red-400 transition-colors" />
                    </div>
                </div>
            </aside>
        </>
    );
}
