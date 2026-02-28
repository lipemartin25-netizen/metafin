import {
 AreaChart, Area, XAxis, YAxis, CartesianGrid,
 Tooltip, ResponsiveContainer
} from "recharts";

const data = [
 { mes: "Ago", receitas: 7200, despesas: 3100 },
 { mes: "Set", receitas: 6800, despesas: 3800 },
 { mes: "Out", receitas: 7500, despesas: 2900 },
 { mes: "Nov", receitas: 8100, despesas: 4200 },
 { mes: "Dez", receitas: 9200, despesas: 5100 },
 { mes: "Jan", receitas: 7800, despesas: 3300 },
 { mes: "Fev", receitas: 8200, despesas: 3350 },
];

const CustomTooltip = ({ active, payload, label }) => {
 if (active && payload && payload.length) {
 return (
 <div className="bg-[#1a1a2e] border border-[var(--border)] rounded-xl p-3 shadow-elevated text-xs">
 <p className="text-content-primary/50 mb-2 font-medium">{label}</p>
 {payload.map((p) => (
 <div key={p.name} className="flex items-center gap-2 mb-1">
 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
 <span className="text-content-primary/60 capitalize">{p.name === "receitas" ? "Receitas" : "Despesas"}:</span>
 <span className="text-content-primary font-semibold">
 {p.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
 </span>
 </div>
 ))}
 </div>
 );
 }
 return null;
};

export default function SpendingChart() {
 return (
 <div className="rounded-2xl bg-[#0d0d15] border border-[var(--border)] p-6">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-content-primary font-semibold">Fluxo de Caixa</h3>
 <p className="text-content-primary/30 text-xs mt-0.5">Últimos 7 meses</p>
 </div>
 <div className="flex gap-2">
 {["7M", "6M", "1A"].map((p, i) => (
 <button
 key={p}
 className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${i === 0
 ? "bg-violet-500/20 text-violet-400 border border-violet-500/20"
 : "text-content-primary/30 hover:text-content-primary/60"
 }`}
 >
 {p}
 </button>
 ))}
 </div>
 </div>

 <ResponsiveContainer width="100%" height={220}>
 <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
 <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
 <XAxis
 dataKey="mes"
 tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
 axisLine={false}
 tickLine={false}
 />
 <YAxis
 tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }}
 axisLine={false}
 tickLine={false}
 tickFormatter={(v) => `${v / 1000}k`}
 />
 <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.05)" }} />
 <Area
 type="monotone"
 dataKey="receitas"
 stroke="#8b5cf6"
 strokeWidth={2}
 fill="url(#colorReceitas)"
 dot={false}
 activeDot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
 />
 <Area
 type="monotone"
 dataKey="despesas"
 stroke="#ef4444"
 strokeWidth={2}
 fill="url(#colorDespesas)"
 dot={false}
 activeDot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 );
}
