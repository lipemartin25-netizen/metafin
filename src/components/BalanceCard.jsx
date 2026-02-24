import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function BalanceCard() {
    const [visible, setVisible] = useState(true);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 h-full min-h-[180px]">
            {/* Glow orbs */}
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-5 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />

            {/* Grid pattern */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: "28px 28px",
                }}
            />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Saldo Total</p>
                        <div className="flex items-center gap-3 mt-2">
                            <h2 className="text-3xl font-bold text-white">
                                {visible ? "R$ 24.850,00" : "R$ ••••••"}
                            </h2>
                            <button
                                onClick={() => setVisible(!visible)}
                                className="text-white/40 hover:text-white/80 transition-colors"
                            >
                                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white border border-white/20">
                        <TrendingUp size={13} />
                        +8,4%
                    </div>
                </div>

                <div className="flex items-center gap-6 mt-6">
                    <div>
                        <p className="text-white/50 text-xs">Receitas</p>
                        <p className="text-white font-semibold text-sm mt-0.5">R$ 8.200</p>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div>
                        <p className="text-white/50 text-xs">Despesas</p>
                        <p className="text-white font-semibold text-sm mt-0.5">R$ 3.350</p>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div>
                        <p className="text-white/50 text-xs">Investido</p>
                        <p className="text-white font-semibold text-sm mt-0.5">R$ 13.300</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
