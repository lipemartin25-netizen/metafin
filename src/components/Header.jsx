import { tw } from '@/lib/theme';
import { Menu, Bell, Search } from "lucide-react";

export default function Header({ onMenuClick }) {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

    return (
        <header className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-white/40 hover:text-white transition-colors"
                >
                    <Menu size={22} />
                </button>
                <div>
                    <h1 className="text-base font-semibold text-white/90">
                        {greeting}, Felipe 👋
                    </h1>
                    <p className="text-xs text-white/30">
                        {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="hidden md:flex items-center gap-2 bg-gray-800/40/5 border border-white/8 rounded-xl px-4 py-2 text-sm text-white/30 w-52 hover:border-white/15 transition-colors cursor-pointer">
                    <Search size={15} />
                    <span>Buscar...</span>
                    <span className="ml-auto text-xs bg-gray-800/40/10 px-1.5 py-0.5 rounded-md">⌘K</span>
                </div>

                {/* Notification */}
                <button className="relative w-9 h-9 rounded-xl bg-gray-800/40/5 border border-white/8 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all">
                    <Bell size={16} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full ring-2 ring-[#0a0a0f]"></span>
                </button>
            </div>
        </header>
    );
}
