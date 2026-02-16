export default function StatusChip({ status }) {
    const config = {
        categorized: {
            label: 'Categorizado',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400',
            dot: 'bg-emerald-400',
        },
        pending: {
            label: 'Pendente',
            bg: 'bg-amber-500/10',
            text: 'text-amber-400',
            dot: 'bg-amber-400',
        },
        processing: {
            label: 'Processando',
            bg: 'bg-blue-500/10',
            text: 'text-blue-400',
            dot: 'bg-blue-400',
        },
        error: {
            label: 'Erro',
            bg: 'bg-red-500/10',
            text: 'text-red-400',
            dot: 'bg-red-400',
        },
    };

    const c = config[status] || config.pending;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${c.bg} ${c.text}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}
