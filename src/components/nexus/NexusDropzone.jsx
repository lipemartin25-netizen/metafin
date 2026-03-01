// src/components/nexus/NexusDropzone.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth } from '../../lib/supabase';

export default function NexusDropzone() {
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error

    const handleFile = async (file) => {
        if (!file || status === 'uploading') return;

        setStatus('uploading');
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result;
                const { data: { session } } = await auth.getSession();
                const token = session?.access_token;

                const resp = await fetch('/api/nexus/vision', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        fileB64: base64,
                        taskType: file.type.includes('pdf') ? 'statement_pdf' : 'receipt_ocr'
                    })
                });

                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || 'Falha no Vision');

                setStatus('success');
                setTimeout(() => setStatus('idle'), 5000);
            };
        } catch (error) {
            console.error('[nexus-vision] Erro:', error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <div className="relative group">
            <motion.div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    handleFile(file);
                }}
                className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-8 gap-4 text-center cursor-pointer ${isDragging ? "border-violet-500 bg-violet-500/10 scale-[1.02]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    } ${status === 'uploading' ? "pointer-events-none opacity-80" : ""}`}
            >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center"
                        >
                            <div className="p-4 bg-white/5 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
                                <Upload className="w-8 h-8 text-violet-400" />
                            </div>
                            <h4 className="text-white font-bold text-sm">Nexus Vision Drop</h4>
                            <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Arraste PDF ou Foto de Cupom</p>
                        </motion.div>
                    )}

                    {status === 'uploading' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
                            <p className="text-sm font-medium text-white">Nexus está lendo os dados...</p>
                            <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">Processamento Multimodal</p>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center text-emerald-400"
                        >
                            <CheckCircle2 className="w-10 h-10 mb-4" />
                            <p className="text-sm font-bold">Processado com Sucesso</p>
                            <p className="text-[10px] uppercase mt-2">Dados extraídos para o MetaFin</p>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center text-red-400"
                        >
                            <AlertCircle className="w-10 h-10 mb-4" />
                            <p className="text-sm font-bold">Falha no Processamento</p>
                            <p className="text-[10px] uppercase mt-2">Tente um arquivo mais nítido</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Invisível */}
                <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => handleFile(e.target.files[0])}
                    accept="image/*,.pdf"
                />
            </motion.div>

            {/* Hint Flutuante */}
            <div className="absolute -top-3 -right-3 px-3 py-1 bg-violet-600 rounded-full text-[8px] font-black text-white uppercase shadow-lg border border-white/20">
                Nexus v3 Vision
            </div>
        </div>
    );
}
