import { tw } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import { useVisibility } from '../hooks/useVisibility';
import { Target, Eye, EyeOff } from 'lucide-react';

const goals = [
    { label: "Viagem Europa", current: 4200, target: 8000, color: "bg-violet-500", shadow: "shadow-violet-500/20" },
    { label: "Reserva Emergência", current: 12000, target: 15000, color: "bg-purple-500", shadow: "shadow-purple-500/20" },
    { label: "Notebook Novo", current: 1800, target: 3500, color: "bg-blue-500", shadow: "shadow-blue-500/20" },
];

export default function GoalsCard() {
    const navigate = useNavigate();
    const { isVisible, toggleVisibility } = useVisibility();

    return (
        <div className="rounded-2xl bg-[#0d0d15] border border-white/5 p-6 h-full group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Target size={18} className="text-violet-400" />
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">Metas</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => toggleVisibility()}
                        className="p-1.5 rounded-lg bg-gray-800/40/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-800/40/10"
                    >
                        {isVisible ? <EyeOff size={14} className="text-white/40" /> : <Eye size={14} className="text-white/40" />}
                    </button>
                    <button
                        onClick={() => navigate('/app/goals')}
                        className="text-[10px] font-black uppercase text-violet-400 hover:text-violet-300 transition-colors tracking-widest"
                    >
                        Ver todas
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {goals.map(({ label, current, target, color, shadow }) => {
                    const pct = Math.min(100, Math.round((current / target) * 100));
                    return (
                        <div key={label} className="relative">
                            <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-wider">
                                <span className="text-white/70">{label}</span>
                                <span className="text-white/40">{pct}%</span>
                            </div>
                            <div className="h-2 bg-gray-800/40/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                                <div
                                    className={`h-full ${color} rounded-full transition-all duration-1000 ${shadow} shadow-lg`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] mt-2 font-mono">
                                <span className="text-white/30">
                                    {isVisible ? current.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ ••••"}
                                </span>
                                <span className="text-white/10">
                                    {isVisible ? target.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ ••••"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
