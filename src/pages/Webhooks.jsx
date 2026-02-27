import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Webhook, Plus, Bell, Target, Zap, RefreshCw, Heart, ArrowRight, Copy, CheckCircle } from 'lucide-react';

const WEBHOOK_EVENTS = [
    { id: 'transaction.created', label: 'Nova transação criada', icon: Zap, color: '#10B981', description: 'Disparado quando uma transação é adicionada (manual ou importação).' },
    { id: 'goal.reached', label: 'Meta financeira atingida', icon: Target, color: '#F59E0B', description: 'Quando o valor acumulado em uma meta atinge 100%.' },
    { id: 'budget.exceeded', label: 'Limite de gasto ultrapassado', icon: Bell, color: '#EF4444', description: 'Quando uma categoria de orçamento ultrapassa o limite definido.' },
    { id: 'sync.completed', label: 'Sincronização bancária concluída', icon: RefreshCw, color: '#3B82F6', description: 'Após uma sincronização Open Finance terminar com sucesso.' },
    { id: 'health.updated', label: 'Score de saúde atualizado', icon: Heart, color: '#EC4899', description: 'Quando o score de saúde financeira é recalculado.' },
];

export default function Webhooks() {
    const [webhooks] = useState([]);
    const [copied, setCopied] = useState(false);

    const samplePayload = `{
  "event": "transaction.created",
  "data": {
    "id": "uuid",
    "description": "Supermercado",
    "amount": -150.00,
    "category": "alimentacao",
    "date": "2026-02-27"
  },
  "timestamp": "${new Date().toISOString()}"
}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(samplePayload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="py-8 space-y-8 animate-fade-in pb-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                        <Webhook className="w-8 h-8 text-fuchsia-400" />
                        Webhooks
                    </h1>
                    <p className="text-gray-400 text-sm">Integre o MetaFin com serviços externos via webhooks HTTP.</p>
                </div>
                <Link
                    to="/app/settings"
                    className="gradient-btn text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Novo Webhook
                </Link>
            </div>

            {webhooks.length === 0 ? (
                <div className="glass-card p-10 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center mx-auto">
                        <Webhook className="w-8 h-8 text-fuchsia-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Nenhum webhook configurado</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                        Configure webhooks para receber notificações quando transações forem criadas,
                        metas forem atingidas ou limites forem ultrapassados.
                    </p>
                    <Link
                        to="/app/settings"
                        className="gradient-btn text-sm inline-flex mx-auto"
                    >
                        Criar Primeiro Webhook
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : null}

            {/* Eventos Suportados */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Eventos Suportados</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {WEBHOOK_EVENTS.map((evt) => (
                        <div key={evt.id} className="glass-card !p-4 flex items-start gap-3 border border-white/5 hover:border-fuchsia-500/20 transition-all group">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${evt.color}15` }}>
                                <evt.icon className="w-5 h-5" style={{ color: evt.color }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white group-hover:text-fuchsia-300 transition-colors">{evt.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{evt.description}</p>
                                <code className="text-[10px] text-fuchsia-400/60 font-mono mt-1 block">{evt.id}</code>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Exemplo de Payload */}
            <div className="glass-card space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Exemplo de Payload</h3>
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                        {copied ? <><CheckCircle className="w-3 h-3 text-emerald-400" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
                    </button>
                </div>
                <pre className="bg-black/30 rounded-xl p-4 text-xs text-emerald-300 font-mono overflow-x-auto border border-white/5">
                    {samplePayload}
                </pre>
                <p className="text-[11px] text-gray-500">
                    O MetaFin envia um POST com este formato para a URL configurada. Inclua o header
                    <code className="bg-white/5 px-1.5 py-0.5 rounded mx-1">X-Webhook-Secret</code>
                    para validar a autenticidade.
                </p>
            </div>
        </div>
    );
}
