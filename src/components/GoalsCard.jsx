const goals = [
    { label: "Viagem Europa", current: 4200, target: 8000, color: "bg-violet-500" },
    { label: "Reserva Emergência", current: 12000, target: 15000, color: "bg-emerald-500" },
    { label: "Notebook Novo", current: 1800, target: 3500, color: "bg-blue-500" },
];

export default function GoalsCard() {
    return (
        <div className="rounded-2xl bg-[#0d0d15] border border-white/5 p-6 h-full">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold">Metas</h3>
                <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Ver todas</button>
            </div>

            <div className="space-y-5">
                {goals.map(({ label, current, target, color }) => {
                    const pct = Math.round((current / target) * 100);
                    return (
                        <div key={label}>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-white/70 font-medium">{label}</span>
                                <span className="text-white/30">{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${color} rounded-full transition-all duration-700`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs mt-1.5">
                                <span className="text-white/30">
                                    {current.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                                <span className="text-white/20">
                                    {target.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
