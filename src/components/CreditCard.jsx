import { Wifi, CreditCard as CardIcon } from "lucide-react";

export default function CreditCard() {
    return (
        <div className="rounded-2xl bg-[#0d0d15] border border-white/5 p-6 h-full min-h-[180px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <p className="text-white/40 text-xs font-medium tracking-widest uppercase">Meu Cartão</p>
                <div className="flex gap-1">
                    <div className="w-6 h-6 rounded-full bg-red-500/80" />
                    <div className="w-6 h-6 rounded-full bg-yellow-500/80 -ml-2" />
                </div>
            </div>

            {/* Card Visual */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-5 flex-1 min-h-[120px]">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center justify-between">
                        <div className="w-8 h-6 rounded-sm bg-gradient-to-br from-yellow-400 to-yellow-600 opacity-90" />
                        <Wifi size={18} className="text-white/30 rotate-90" />
                    </div>

                    <div>
                        <p className="text-white/40 text-xs tracking-[0.2em] mb-1">•••• •••• •••• 4892</p>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/30 text-[10px]">TITULAR</p>
                                <p className="text-white/80 text-xs font-medium">FELIPE MARTIN</p>
                            </div>
                            <div>
                                <p className="text-white/30 text-[10px]">VALIDADE</p>
                                <p className="text-white/80 text-xs font-medium">12/28</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Limit bar */}
            <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/40">Limite utilizado</span>
                    <span className="text-white/60">R$ 2.150 / R$ 8.000</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        style={{ width: "26.9%" }}
                    />
                </div>
            </div>
        </div>
    );
}
