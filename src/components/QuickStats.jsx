import { TrendingUp, TrendingDown, Wallet, PiggyBank, Eye, EyeOff } from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";
import { useVisibility } from "../hooks/useVisibility";
import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

function fmt(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

// Dados mock para os mini-gráficos (sparklines)
const generateMockTrend = () => Array.from({ length: 6 }, () => ({ val: Math.floor(Math.random() * 50) + 10 }));

export default function QuickStats() {
    const { transactions } = useTransactions();
    const { isVisible, toggleVisibility } = useVisibility();

    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const prevMonth = transactions.filter(t => {
            const d = new Date(t.date);
            const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
        });

        const receita = thisMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const gastos = thisMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const receitaPrev = prevMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const gastosPrev = prevMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

        const patrimonio = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
            - transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

        const reserva = transactions.filter(t =>
            t.category?.toLowerCase().includes("reserva") ||
            t.category?.toLowerCase().includes("emergencia") ||
            t.category?.toLowerCase().includes("emergência")
        ).reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

        const receitaChange = receitaPrev > 0 ? ((receita - receitaPrev) / receitaPrev) * 100 : null;
        const gastosChange = gastosPrev > 0 ? ((gastos - gastosPrev) / gastosPrev) * 100 : null;

        return [
            {
                label: "Receita Mensal",
                amount: receita,
                value: fmt(receita),
                change: receitaChange !== null ? `${receitaChange >= 0 ? "+" : ""}${receitaChange.toFixed(1)}% vs mês ant.` : "este mês",
                up: receitaChange === null ? true : receitaChange >= 0,
                hasData: receita > 0,
                icon: TrendingUp,
                color: "from-emerald-500/20 to-emerald-600/5",
                iconColor: "text-emerald-400",
                chartColor: "#10b981",
                border: "border-emerald-500/10",
                trend: generateMockTrend()
            },
            {
                label: "Gastos do Mês",
                amount: gastos,
                value: fmt(gastos),
                change: gastosChange !== null ? `${gastosChange >= 0 ? "+" : ""}${gastosChange.toFixed(1)}% vs mês ant.` : "este mês",
                up: gastosChange === null ? false : gastosChange <= 0,
                hasData: gastos > 0,
                icon: TrendingDown,
                color: "from-red-500/20 to-red-600/5",
                iconColor: "text-red-400",
                chartColor: "#ef4444",
                border: "border-red-500/10",
                trend: generateMockTrend()
            },
            {
                label: "Patrimônio",
                amount: Math.max(0, patrimonio),
                value: fmt(Math.max(0, patrimonio)),
                change: "acumulado",
                up: patrimonio >= 0,
                hasData: transactions.length > 0,
                icon: Wallet,
                color: "from-blue-500/20 to-blue-600/5",
                iconColor: "text-blue-400",
                chartColor: "#3b82f6",
                border: "border-blue-500/10",
                trend: generateMockTrend()
            },
            {
                label: "Reserva de Emergência",
                amount: Math.max(0, reserva),
                value: fmt(Math.max(0, reserva)),
                change: "acumulado",
                up: true,
                hasData: reserva > 0,
                icon: PiggyBank,
                color: "from-amber-500/20 to-amber-600/5",
                iconColor: "text-amber-400",
                chartColor: "#f59e0b",
                border: "border-amber-500/10",
                trend: generateMockTrend()
            },
        ];
    }, [transactions]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, _amount, value, change, up, hasData, icon: Icon, color, iconColor, chartColor, border, trend }) => (
                <div
                    key={label}
                    className={`rounded-2xl bg-gradient-to-br ${color} border ${border} p-5 hover:scale-[1.02] transition-all duration-300 cursor-default group overflow-hidden relative`}
                >
                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">{label}</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleVisibility(); }}
                                className="p-1.5 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                            >
                                {isVisible ? <EyeOff size={12} className="text-white/40" /> : <Eye size={12} className="text-white/40" />}
                            </button>
                            <Icon size={16} className={iconColor} />
                        </div>
                    </div>

                    <div className="relative z-10">
                        {hasData ? (
                            <>
                                <p className="text-white text-2xl font-bold tracking-tight">
                                    {isVisible ? value : "R$ ••••"}
                                </p>
                                <p className={`text-[11px] mt-1 font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
                                    {change}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-white/25 text-2xl font-bold select-none tracking-tight">R$ —</p>
                                <p className="text-[10px] mt-1 font-medium text-white/20 uppercase">Sem dados</p>
                            </>
                        )}
                    </div>

                    {/* Mini Sparkline Chart */}
                    <div className="absolute -bottom-1 left-0 right-0 h-12 opacity-40 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend}>
                                <Line
                                    type="monotone"
                                    dataKey="val"
                                    stroke={chartColor}
                                    strokeWidth={2}
                                    dot={false}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ))}
        </div>
    );
}

