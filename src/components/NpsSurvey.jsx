import { tw } from '@/lib/theme';
import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { analytics } from '../hooks/useAnalytics';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function NpsSurvey({ onClose }) {
 const { user } = useAuth();
 const [score, setScore] = useState(null);
 const [comment, setComment] = useState('');
 const [submitted, setSubmitted] = useState(false);

 const handleSubmit = async () => {
 if (score === null) return;

 // Track em analytics
 analytics.npsFeedback(score, comment);

 // Salvar no Supabase (se configurado)
 if (isSupabaseConfigured && supabase) {
 await supabase.from('feedback').insert({
 user_id: user?.id !== 'demo' ? user?.id : null,
 score,
 comment,
 page: window.location.pathname,
 });
 }

 // Salvar localmente também
 const feedback = { score, comment, date: new Date().toISOString() };
 localStorage.setItem('sf_last_nps', JSON.stringify(feedback));

 setSubmitted(true);
 setTimeout(onClose, 2000);
 };

 const getEmoji = (n) => {
 if (n <= 3) return '😞';
 if (n <= 6) return '😐';
 if (n <= 8) return '🙂';
 return '🤩';
 };

 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 animate-fade-in">
 <div className={`\${tw.card} w-full max-w-md animate-slide-up`}>
 {submitted ? (
 <div className="text-center py-8">
 <div className="text-4xl mb-4">🎉</div>
 <h3 className="text-lg font-bold text-content-primary mb-2">
 Obrigado pelo feedback!
 </h3>
 <p className="text-gray-400 text-sm">
 Sua opinião nos ajuda a melhorar o MetaFin.
 </p>
 </div>
 ) : (
 <>
 {/* Header */}
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-bold text-content-primary">
 Sua experiência importa ❤️
 </h3>
 <button
 onClick={onClose}
 className="p-1.5 rounded-lg text-gray-500 hover:text-content-primary hover:bg-gray-800/40/10 transition-all"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Question */}
 <p className="text-gray-300 text-sm mb-4">
 Em uma escala de 0 a 10, qual a probabilidade de recomendar o
 MetaFin para um amigo?
 </p>

 {/* Score Grid */}
 <div className="grid grid-cols-11 gap-1 mb-2">
 {Array.from({ length: 11 }, (_, i) => (
 <button
 key={i}
 onClick={() => setScore(i)}
 className={`aspect-square rounded-lg text-xs font-medium transition-all ${score === i
 ? 'bg-brand-primary text-content-primary scale-110 shadow-lg shadow-brand-primary/30'
 : 'bg-gray-800/40/5 text-gray-400 hover:bg-gray-800/40/10 hover:text-content-primary'
 }`}
 >
 {i}
 </button>
 ))}
 </div>

 <div className="flex justify-between text-xs text-gray-600 mb-4">
 <span>Improvável</span>
 <span>Muito provável</span>
 </div>

 {/* Emoji Feedback */}
 {score !== null && (
 <div className="text-center mb-4 animate-fade-in">
 <span className="text-2xl">{getEmoji(score)}</span>
 </div>
 )}

 {/* Comment */}
 <textarea
 value={comment}
 onChange={(e) => setComment(e.target.value)}
 placeholder="O que podemos melhorar? (opcional)"
 rows={3}
 className="input-field resize-none mb-4"
 />

 {/* Submit */}
 <button
 onClick={handleSubmit}
 disabled={score === null}
 className="gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Send className="w-4 h-4" />
 Enviar Feedback
 </button>
 </>
 )}
 </div>
 </div>
 );
}
