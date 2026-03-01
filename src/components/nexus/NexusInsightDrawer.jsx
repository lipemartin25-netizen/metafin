// src/components/nexus/NexusInsightDrawer.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, TrendingUp, AlertCircle, Lightbulb, ChevronRight, Activity } from 'lucide-react';
import { tw } from '../../lib/utils';
import { auth } from '../../lib/supabase';

export default function NexusInsightDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && insights.length === 0) {
            const fetchInsights = async () => {
                setLoading(true);
                try {
                    const { data: { session } } = await auth.getSession();
                    const token = session?.access_token;
                    const resp = await fetch('/api/nexus/insights', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await resp.json();
                    setInsights(data.insights || []);
                } catch (error) {
                    console.error('[nexus-drawer] Erro:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchInsights();
        }
    }, [isOpen, insights.length]);

    return (
        <>
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={tw(
                    "fixed right-6 bottom-24 z-40 p-4 rounded-2xl flex items-center gap-2",
                    "bg-gradient-to-br from-violet-600/60 to-brand-primary/60 backdrop-blur-xl",
                    "border border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.3)]",
                    "text-white font-medium group transition-all"
                )}
            >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Nexus</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 overflow-hidden"
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        className={tw(
                            "fixed top-0 right-0 h-full w-full max-w-md z-50",
                            "bg-slate-900/80 backdrop-blur-3xl border-l border-white/10",
                            "shadow-[-10px_0_40px_rgba(0,0,0,0.5)] p-6 flex flex-col gap-6"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-500/20 rounded-lg">
                                    <Sparkles className="w-6 h-6 text-violet-400" />
                                </div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Nexus Insights</h2>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {loading && (
                                <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-60">
                                    <Activity className="w-10 h-10 animate-pulse text-violet-400" />
                                    <p className="text-sm font-medium">Nexus está sintonizando suas finanças...</p>
                                </div>
                            )}

                            {!loading && insights.map((insight, idx) => (
                                <motion.div
                                    key={insight.id || idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={tw(
                                        "p-4 rounded-2xl border border-white/10 transition-all cursor-default",
                                        "bg-gradient-to-br from-white/5 to-white/[0.02] hover:border-white/20 active:scale-[0.98]",
                                        insight.type === 'alert' ? 'border-red-500/20 hover:bg-red-500/[0.02]' : '',
                                        insight.type === 'suggestion' ? 'border-emerald-500/20 hover:bg-emerald-500/[0.02]' : ''
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={tw(
                                            "p-2 rounded-xl mt-1",
                                            insight.type === 'alert' ? 'bg-red-500/20 text-red-400' :
                                                insight.type === 'suggestion' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                                        )}>
                                            {insight.type === 'alert' ? <AlertCircle className="w-4 h-4" /> :
                                                insight.type === 'suggestion' ? <Lightbulb className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-semibold text-sm mb-1">{insight.title}</h3>
                                            <p className="text-gray-400 text-xs leading-relaxed">{insight.message}</p>
                                        </div>
                                    </div>

                                    {insight.action_link && (
                                        <a href={insight.action_link} className="mt-4 flex items-center justify-between text-[10px] font-bold tracking-wider text-violet-400 uppercase group/link">
                                            <span>Ação Recomendada</span>
                                            <ChevronRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                        </a>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Nexus V3.0 Live</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600 text-white font-bold uppercase">Pro Tier</span>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
