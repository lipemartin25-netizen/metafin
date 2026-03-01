import { tw } from '@/lib/theme';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Webhook, Zap, Target, Bell, RefreshCw, Heart, X, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

const WEBHOOK_EVENTS = [
 { id: 'transaction.created', label: 'Nova transação criada', icon: Zap, color: '#10B981', description: 'Disparado quando uma transação é adicionada' },
 { id: 'goal.reached', label: 'Meta financeira atingida', icon: Target, color: '#F59E0B', description: 'Quando o valor acumulado em uma meta atinge 100%' },
 { id: 'budget.exceeded', label: 'Limite de gasto ultrapassado', icon: Bell, color: '#EF4444', description: 'Quando uma categoria de orçamento ultrapassa o limite' },
 { id: 'sync.completed', label: 'Sincronização concluída', icon: RefreshCw, color: '#3B82F6', description: 'Após Open Finance terminar com sucesso' },
 { id: 'health.updated', label: 'Score de saúde atualizado', icon: Heart, color: '#EC4899', description: 'Quando o score financeiro é recalculado' },
];

export default function WebhookModal({ isOpen, onClose, onSuccess }) {
 const [name, setName] = useState('');
 const [url, setUrl] = useState('');
 const [events, setEvents] = useState([]);
 const [secret] = useState(crypto.randomUUID());
 const [loading, setLoading] = useState(false);
 const [copied, setCopied] = useState(false);
 const [error, setError] = useState('');

 if (!isOpen) return null;

 const toggleEvent = (eventId) => {
 setEvents(prev =>
 prev.includes(eventId)
 ? prev.filter(e => e !== eventId)
 : [...prev, eventId]
 );
 };

 const copySecret = () => {
 navigator.clipboard.writeText(secret);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');

 // Validações
 if (!name.trim()) return setError('Nome é obrigatório');
 if (!url.trim() || !url.startsWith('https://')) {
 return setError('URL deve começar com https://');
 }
 if (events.length === 0) return setError('Selecione pelo menos 1 evento');

 setLoading(true);

 try {
 const { data: { user } } = await supabase.auth.getUser();

 const { error: dbError } = await supabase
 .from('webhooks')
 .insert({
 user_id: user.id,
 name: name.trim(),
 url: url.trim(),
 events,
 secret,
 active: true,
 });

 if (dbError) throw dbError;

 // Reset form
 setName('');
 setUrl('');
 setEvents([]);

 onSuccess?.();
 onClose();
 } catch (err) {
 console.error('Erro ao criar webhook:', err);
 setError(err.message || 'Erro ao criar webhook');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div
 className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200"
 onClick={(e) => e.target === e.currentTarget && onClose()}
 >
 <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-elevated animate-in zoom-in-95 duration-200">

 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-[var(--border)] gap-4">
 <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
 <div className="p-2 bg-brand-glow/10 rounded-xl">
 <Webhook className="w-5 h-5 text-brand-glow" />
 </div>
 Novo Webhook
 </h2>
 <button
 onClick={onClose}
 className="text-gray-400 hover:text-[var(--text-primary)] transition-colors p-2 hover:bg-[var(--bg-surface)] rounded-xl self-end sm:self-auto"
 title="Fechar (ESC)"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Form */}
 <form onSubmit={handleSubmit} className="p-6 space-y-6">

 {/* Nome */}
 <div className="space-y-2">
 <label className="block text-sm font-semibold text-gray-300">
 Nome do Webhook
 </label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="Ex: Notificação Discord"
 className="w-full px-4 py-3 bg-black/20 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-glow/50 focus:border-brand-glow/50 transition-all font-medium"
 />
 </div>

 {/* URL */}
 <div className="space-y-2">
 <label className="block text-sm font-semibold text-gray-300 flex items-center justify-between">
 URL do Endpoint
 <span className="text-[10px] uppercase tracking-widest text-brand-glow font-bold bg-brand-glow/10 px-2 py-0.5 rounded-md">HTTPS Obrigatório</span>
 </label>
 <input
 type="url"
 value={url}
 onChange={(e) => setUrl(e.target.value)}
 placeholder="https://seu-servidor.com/webhook"
 className="w-full px-4 py-3 bg-black/20 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-glow/50 focus:border-brand-glow/50 transition-all font-mono text-sm"
 />
 </div>

 {/* Eventos */}
 <div className="space-y-3">
 <label className="block text-sm font-semibold text-gray-300">
 Eventos <span className="text-gray-500 font-normal">(selecione pelo menos 1)</span>
 </label>
 <div className="space-y-2">
 {WEBHOOK_EVENTS.map((evt) => {
 const selected = events.includes(evt.id);
 return (
 <label
 key={evt.id}
 className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all border ${selected
 ? 'bg-brand-glow/10 border-brand-glow/30'
 : 'bg-black/20 border-[var(--border)] hover:border-[var(--border)]'
 }`}
 >
 <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${selected
 ? 'bg-brand-glow border-brand-glow'
 : 'border-gray-500 bg-transparent'
 }`}>
 {selected && <CheckCircle className="w-3.5 h-3.5 text-[var(--text-primary)]" />}
 </div>
 <div className="flex-1 min-w-0 flex items-start gap-3">
 <div className="p-1.5 rounded-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: `${evt.color}15` }}>
 <evt.icon className="w-4 h-4" style={{ color: evt.color }} />
 </div>
 <div>
 <p className={`text-sm font-bold transition-colors ${selected ? 'text-[var(--text-primary)]' : 'text-gray-300'}`}>{evt.label}</p>
 <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{evt.description}</p>
 </div>
 </div>
 </label>
 );
 })}
 </div>
 </div>

 {/* Secret */}
 <div className="space-y-2 pt-2 border-t border-[var(--border)]">
 <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
 🔐 Secret Key <span className="text-xs text-brand-glow font-normal">(Gerado automaticamente)</span>
 </label>
 <div className="flex gap-2">
 <code className="flex-1 px-4 py-3 bg-black/30 border border-[var(--border)] rounded-xl text-fuchsia-300 text-sm font-mono truncate select-all">
 {secret}
 </code>
 <button
 type="button"
 onClick={copySecret}
 className="px-4 py-3 bg-[var(--bg-surface)] hover:bg-gray-800/40/10 border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2"
 >
 {copied ? <><CheckCircle className="w-4 h-4 text-brand-glow" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar</>}
 </button>
 </div>
 <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
 Este secret será usado para assinar os payloads. Valide a assinatura no seu servidor usando o header <code className="bg-gray-800/40/10 px-1 py-0.5 rounded text-fuchsia-300">X-Webhook-Secret</code>.
 </p>
 </div>

 {/* Erro */}
 {error && (
 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
 <AlertTriangle className="w-5 h-5 flex-shrink-0" />
 <p>{error}</p>
 </div>
 )}

 {/* Botões */}
 <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
 <button
 type="button"
 onClick={onClose}
 className="flex-1 px-4 py-3.5 bg-[var(--bg-surface)] hover:bg-gray-800/40/10 border border-[var(--border)] rounded-xl text-[var(--text-primary)] font-semibold transition-colors"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={loading}
 className="flex-1 px-4 py-3.5 bg-brand-glow hover:bg-brand-glow disabled:bg-[var(--bg-base)]uchsia-900/50 disabled:text-[var(--text-primary)]/50 disabled:cursor-not-allowed rounded-xl text-[var(--text-primary)] font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-glow/20"
 >
 {loading ? (
 <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando...</>
 ) : (
 <><Zap className="w-4 h-4" /> Criar Webhook</>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
