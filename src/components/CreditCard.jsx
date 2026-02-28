import { tw } from '@/lib/theme';
import { Wifi, Eye, EyeOff } from "lucide-react";
import { useVisibility } from "../hooks/useVisibility";

function fmt(v) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}

export default function CreditCard() {
    const { isVisible, toggleVisibility } = useVisibility();

    return (
        <div className="rounded-2xl bg-[#0d0d15] border border-white/5 p-6 h-full min-h-[180px] flex flex-col justify-between group relative overflow-hidden">
            {/* Ambient Background Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-3xl -mr-10 -mt-10" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Meu Cartão Virtual</p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => toggleVisibility()}
                        className="p-1.5 rounded-lg bg-gray-800/40/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-800/40/10"
                    >
                        {isVisible ? <EyeOff size={14} className="text-white/40" /> : <Eye size={14} className="text-white/40" />}
                    </button>
                    <div className="flex gap-1">
                        <div className="w-6 h-6 rounded-full bg-red-500/80" />
                        <div className="w-6 h-6 rounded-full bg-yellow-500/80 -ml-2" />
                    </div>
                </div>
            </div>

            {/* Card Visual */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-5 flex-1 min-h-[120px] shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-gray-800/40/5 rounded-full blur-xl" />

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center justify-between">
                        <div className="w-8 h-6 rounded-sm bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-90 shadow-lg shadow-black/10" />
                        <Wifi size={18} className="text-white/30 rotate-90" />
                    </div>

                    <div>
                        <p className="text-white font-mono text-sm tracking-[0.2em] mb-1">
                            {isVisible ? "•••• •••• •••• 4892" : "•••• •••• •••• ••••"}
                        </p>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/30 text-[8px] uppercase font-bold tracking-tighter">Titular</p>
                                <p className="text-white/80 text-[10px] font-bold uppercase truncate max-w-[100px]">Felipe Martin</p>
                            </div>
                            <div>
                                <p className="text-white/30 text-[8px] uppercase font-bold tracking-tighter">Validade</p>
                                <p className="text-white/80 text-[10px] font-bold">12/28</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Limit bar - Enhanced Visualization */}
            <div className="mt-4 relative z-10">
                <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-wider">
                    <span className="text-white/40">Limite utilizado</span>
                    <span className="text-white/60">
                        {isVisible ? `${fmt(2150)} / ${fmt(8000)}` : "R$ •••• / R$ ••••"}
                    </span>
                </div>
                <div className="h-2 bg-gray-800/40/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                        style={{ width: "26.9%" }}
                    />
                </div>
                <div className="flex justify-between mt-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[9px] text-brand-glow font-bold">Limite Disponível: {isVisible ? fmt(5850) : "R$ ••••"}</p>
                    <p className="text-[9px] text-white/20 font-medium italic">Vence em 12 dias</p>
                </div>
            </div>
        </div>
    );
}
