import { tw } from '@/lib/theme';
import { useState, useEffect } from 'react';
import { Webhook, Plus, Bell, Target, Zap, RefreshCw, Heart, Copy, CheckCircle, Trash2, Power, PowerOff } from 'lucide-react';
import WebhookModal from '../components/WebhookModal';
import { supabase } from '../lib/supabase'; // Assuming path based on standard structure

const WEBHOOK_EVENTS = [
 { id: 'transaction.created', label: 'Nova transação criada', icon: Zap, color: '#10B981', description: 'Disparado quando uma transação é adicionada (manual ou importação).' },
 { id: 'goal.reached', label: 'Meta financeira atingida', icon: Target, color: '#F59E0B', description: 'Quando o valor acumulado em uma meta atinge 100%.' },
 { id: 'budget.exceeded', label: 'Limite de gasto ultrapassado', icon: Bell, color: '#EF4444', description: 'Quando uma categoria de orçamento ultrapassa o limite definido.' },
 { id: 'sync.completed', label: 'Sincronização bancária concluída', icon: RefreshCw, color: '#3B82F6', description: 'Após uma sincronização Open Finance terminar com sucesso.' },
 { id: 'health.updated', label: 'Score de saúde atualizado', icon: Heart, color: '#EC4899', description: 'Quando o score de saúde financeira é recalculado.' },
];

function WebhookCard({ webhook, onToggle, onDelete }) {
 const eventsDetails = webhook.events.map(eventId => WEBHOOK_EVENTS.find(e => e.id === eventId)).filter(Boolean);

 return (
 <div className={`${tw.glass-card} p-5 space-y-4 border ${webhook.active ? 'border-brand-glow/30 shadow-glass-card' : 'border-[var(--border)] opacity-70'}`}>
 <div className="flex justify-between items-start gap-4">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <div className={`w-2.5 h-2.5 rounded-full ${webhook.active ? 'bg-brand-primary shadow-glass-card animate-pulse' : 'bg-gray-500'}`} />
 <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">{webhook.name}</h3>
 </div>
 <p className="text-xs font-mono text-gray-400 truncate bg-black/20 p-1.5 rounded-md inline-block max-w-full">
 {webhook.url}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => onToggle(webhook.id, !webhook.active)}
 className={`p-2 rounded-xl transition-colors ${webhook.active ? 'text-brand-glow hover:bg-brand-primary/10' : 'text-gray-400 hover:bg-gray-500/10'}`}
 title={webhook.active ? "Desativar Webhook" : "Ativar Webhook"}
 >
 {webhook.active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
 </button>
 <button
 onClick={() => onDelete(webhook.id)}
 className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
 title="Excluir Webhook"
 >
 <Trash2 className="w-5 h-5" />
 </button>
 </div>
 </div>

 <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
 {eventsDetails.map(evt => (
 <span key={evt.id} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-glow/10 text-fuchsia-300 border border-brand-glow/20 flex items-center gap-1.5">
 <evt.icon className="w-3 h-3" style={{ color: evt.color }} />
 {evt.id}
 </span>
 ))}
 </div>
 </div>
 );
}

export default function Webhooks() {
 const [webhooks, setWebhooks] = useState([]);
 const [copied, setCopied] = useState(false);
 const [showModal, setShowModal] = useState(false);
 const [loading, setLoading] = useState(true);

 const fetchWebhooks = async () => {
 setLoading(true);
 try {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 const { data, error } = await supabase
 .from('webhooks')
 .select('*')
 .eq('user_id', user.id)
 .order('created_at', { ascending: false });

 if (error) throw error;
 setWebhooks(data || []);
 } catch (error) {
 console.error('Erro ao buscar webhooks:', error);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchWebhooks();
 }, []);

 const handleToggle = async (id, newStatus) => {
 try {
 // Optimistic update
 setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: newStatus } : w));

 const { error } = await supabase
 .from('webhooks')
 .update({ active: newStatus })
 .eq('id', id);

 if (error) {
 // Revert on error
 setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !newStatus } : w));
 throw error;
 }
 } catch (error) {
 console.error('Erro ao alternar status do webhook:', error);
 alert('Erro ao atualizar webhook. Tente novamente.');
 }
 };

 const handleDelete = async (id) => {
 if (!window.confirm('Tem certeza que deseja excluir permanentemente este webhook?')) return;

 try {
 const { error } = await supabase
 .from('webhooks')
 .delete()
 .eq('id', id);

 if (error) throw error;
 setWebhooks(prev => prev.filter(w => w.id !== id));
 } catch (error) {
 console.error('Erro ao excluir webhook:', error);
 alert('Erro ao excluir webhook. Tente novamente.');
 }
 };

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
 <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3 mb-2">
 <Webhook className="w-8 h-8 text-brand-glow" />
 Webhooks {webhooks.length > 0 && <span className="text-xl text-gray-500 font-normal">({webhooks.length})</span>}
 </h1>
 <p className="text-gray-400 text-sm">Integre o MetaFin com serviços externos via webhooks HTTP.</p>
 </div>
 <button
 onClick={() => setShowModal(true)}
 className="gradient-btn text-sm px-4 py-2 flex items-center justify-center gap-2"
 >
 <Plus className="w-4 h-4" />
 Novo Webhook
 </button>
 </div>

 {loading ? (
 <div className="flex justify-center items-center py-20">
 <RefreshCw className="w-8 h-8 text-brand-glow animate-spin" />
 </div>
 ) : webhooks.length === 0 ? (
 <div className={`\${tw.glass-card} p-10 text-center space-y-4`}>
 <div className="w-16 h-16 rounded-2xl bg-brand-glow/10 flex items-center justify-center mx-auto">
 <Webhook className="w-8 h-8 text-brand-glow" />
 </div>
 <h3 className="text-lg font-bold text-[var(--text-primary)]">Nenhum webhook configurado</h3>
 <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
 Configure webhooks para receber notificações quando transações forem criadas,
 metas forem atingidas ou limites forem ultrapassados.
 </p>
 <button
 onClick={() => setShowModal(true)}
 className="gradient-btn text-sm inline-flex mx-auto flex items-center gap-2"
 >
 Criar Primeiro Webhook
 <Plus className="w-4 h-4" />
 </button>
 </div>
 ) : (
 <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
 {webhooks.map(webhook => (
 <WebhookCard
 key={webhook.id}
 webhook={webhook}
 onToggle={handleToggle}
 onDelete={handleDelete}
 />
 ))}
 </div>
 )}

 {/* Eventos Suportados */}
 <div className="space-y-4 pt-4">
 <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Eventos Suportados</h2>
 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
 {WEBHOOK_EVENTS.map((evt) => (
 <div key={evt.id} className={`\${tw.glass-card} !p-4 flex items-start gap-3 border border-[var(--border)] hover:border-brand-glow/20 transition-all group`}>
 <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${evt.color}15` }}>
 <evt.icon className="w-5 h-5" style={{ color: evt.color }} />
 </div>
 <div className="min-w-0">
 <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-fuchsia-300 transition-colors">{evt.label}</p>
 <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{evt.description}</p>
 <code className="text-[10px] text-brand-glow/60 font-mono mt-1 block">{evt.id}</code>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Exemplo de Payload */}
 <div className={`\${tw.glass-card} space-y-3`}>
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Exemplo de Payload</h3>
 <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded-lg hover:bg-gray-800/40/5">
 {copied ? <><CheckCircle className="w-3 h-3 text-brand-glow" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
 </button>
 </div>
 <pre className="bg-black/30 rounded-xl p-4 text-xs text-purple-300 font-mono overflow-x-auto border border-[var(--border)]">
 {samplePayload}
 </pre>
 <p className="text-[11px] text-gray-500">
 O MetaFin envia um POST com este formato para a URL configurada. Inclua o header
 <code className="bg-gray-800/40/5 px-1.5 py-0.5 rounded mx-1">X-Webhook-Secret</code>
 para validar a autenticidade.
 </p>
 </div>

 <WebhookModal
 isOpen={showModal}
 onClose={() => setShowModal(false)}
 onSuccess={fetchWebhooks}
 />
 </div>
 );
}
