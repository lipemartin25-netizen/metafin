import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

const stats = [
    {
        label: "Receita Mensal",
        value: "R$ 8.200",
        change: "+12%",
        up: true,
        icon: TrendingUp,
        color: "from-emerald-500/20 to-emerald-600/5",
        iconColor: "text-emerald-400",
        border: "border-emerald-500/10",
    },
    {
        label: "Gastos do Mês",
        value: "R$ 3.350",
        change: "-5%",
        up: false,
        icon: TrendingDown,
        color: "from-red-500/20 to-red-600/5",
        iconColor: "text-red-400",
        border: "border-red-500/10",
    },
    {
        label: "Patrimônio",
        value: "R$ 87.400",
        change: "+3.2%",
        up: true,
        icon: Wallet,
        color: "from-blue-500/20 to-blue-600/5",
        iconColor: "text-blue-400",
        border: "border-blue-500/10",
    },
    {
        label: "Reserva de Emergência",
        value: "R$ 12.000",
        change: "Meta: R$ 15k",
        up: true,
        icon: PiggyBank,
        color: "from-amber-500/20 to-amber-600/5",
        iconColor: "text-amber-400",
        border: "border-amber-500/10",
    },
];

export default function QuickStats() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, change, up, icon: Icon, color, iconColor, border }) => (
                <div
                    key={label}
                    className={`rounded-2xl bg-gradient-to-br ${color} border ${border} p-5 hover:scale-[1.02] transition-transform duration-200 cursor-default`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-white/40 text-xs font-medium">{label}</p>
                        <Icon size={16} className={iconColor} />
                    </div>
                    <p className="text-white text-xl font-bold">{value}</p>
                    <p className={`text-xs mt-1 font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
                        {change} este mês
                    </p>
                </div>
            ))}
        </div>
    );
}
