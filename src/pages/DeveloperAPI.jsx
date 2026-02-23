import { useState, useEffect } from 'react';
import { Code2, Key, Copy, Check, RefreshCw, Zap, Server, Shield } from 'lucide-react';

export default function DeveloperAPI() {
    const [apiKey, setApiKey] = useState('');
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('sf_api_key');
        if (stored) {
            setApiKey(stored);
        }
    }, []);

    const generateKey = () => {
        setGenerating(true);
        setTimeout(() => {
            const newKey = 'sf_' + crypto.randomUUID().replace(/-/g, '') + '_live';
            localStorage.setItem('sf_api_key', newKey);
            setApiKey(newKey);
            setGenerating(false);
        }, 800);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webhookUrl = "https://metafin.vercel.app/api/webhooks/transactions";

    const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Authorization: Bearer ${apiKey || 'SUA_API_KEY_AQUI'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "date": "2026-03-01",
    "description": "Pagamento recebido (via Webhook)",
    "amount": 2500.00,
    "category": "freelance",
    "type": "income",
    "status": "categorized"
  }'`;

    return (
        <div className="py-6 space-y-6 animate-fade-in max-w-4xl pb-20">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Code2 className="w-6 h-6 text-fuchsia-500" />
                    Webhooks & API
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Conecte o MetaFin a qualquer plataforma (Zapier, Make, n8n).</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* API Key Section */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                                <Key className="w-5 h-5 text-fuchsia-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">API Key Pessoal</h2>
                                <p className="text-sm text-gray-500">Use esta chave para autenticar suas requisições HTTP.</p>
                            </div>
                        </div>

                        {apiKey ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 p-3 rounded-xl font-mono text-sm text-gray-700 dark:text-gray-300 break-all select-all">
                                        {apiKey}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(apiKey)}
                                        className="p-3 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 transition-all"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Nunca compartilhe sua chave publica.</span>
                                    <button onClick={generateKey} disabled={generating} className="text-fuchsia-500 hover:text-fuchsia-400 font-medium flex items-center gap-1">
                                        {generating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                        Gerar nova chave
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-gray-300 dark:border-white/10 rounded-xl">
                                <p className="text-sm text-gray-500 mb-4">Você ainda não gerou uma chave de API.</p>
                                <button onClick={generateKey} disabled={generating} className="gradient-btn-fuchsia flex items-center gap-2 mx-auto">
                                    {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                    Gerar API Key
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Code Example */}
                    <div className="glass-card p-6 border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Server className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Endpoint de Transações</h2>
                                <p className="text-sm text-gray-500">Crie transações enviando um POST para nosso Webhook HTTP.</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-[#0d1117] rounded-xl overflow-hidden ring-1 ring-white/10">
                                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono">cURL Example</span>
                                    <button onClick={() => copyToClipboard(curlExample)} className="text-gray-400 hover:text-white transition-colors">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                                <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
                                    <code>{curlExample}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Automation Cards */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Casos de Uso Comuns</h3>

                    <div className="glass-card p-4 hover:border-orange-500/30 transition-colors cursor-pointer group">
                        <div className="flex items-start gap-3">
                            <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500"><Zap className="w-5 h-5" /></div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-orange-500 transition-colors">Zapier & Make</h4>
                                <p className="text-[11px] text-gray-500 mt-1">Sempre que uma compra for aprovada no Mercado Pago, registre como despesa aqui.</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-4 hover:border-emerald-500/30 transition-colors cursor-pointer group">
                        <div className="flex items-start gap-3">
                            <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500"><Code2 className="w-5 h-5" /></div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-emerald-500 transition-colors">Sistema Interno</h4>
                                <p className="text-[11px] text-gray-500 mt-1">Dispare eventos do seu backend direto para o seu dashboard do MetaFin.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-6">
                        <p className="text-xs text-blue-400 font-medium">✨ Dica PRO</p>
                        <p className="text-[11px] text-gray-400 mt-1">Ao enviar pelo webhook, a IA integrativa rodará por trás classificando e identificando onde o gasto se encaixa no seu Orçamento Mensal.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
