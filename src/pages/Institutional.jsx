import { tw } from '@/lib/theme';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    Lock,
    BookOpen,
    MessageSquare,
    Globe,
    Zap,
    Smartphone,
    Monitor,
    Scale,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Activity
} from 'lucide-react';
import MetaFinLogo from '../components/MetaFinLogo';

const CONTENT = {
    ecosistema: {
        title: "Ecossistema MetaFin",
        subtitle: "A convergência tecnológica para sua liberdade financeira.",
        icon: <Globe className="w-12 h-12 text-purple-500" />,
        body: (
            <div className="space-y-6 text-slate-300">
                <p>O ecossistema MetaFin não é apenas um aplicativo, é uma infraestrutura completa projetada para unir Instituições Financeiras, Inteligência Artificial e o usuário final em uma camada única de inteligência.</p>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                        <h4 className="text-white font-bold mb-2">Nexus Core IA</h4>
                        <p className="text-sm">O motor por trás de toda a predição e categorização, processando bilhões de pontos de dados para antecipar seu fluxo de caixa.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                        <h4 className="text-white font-bold mb-2">Open Finance Hub</h4>
                        <p className="text-sm">Integrações diretas via API com os principais bancos do Brasil, garantindo que seus dados estejam sempre atualizados.</p>
                    </div>
                </div>
            </div>
        )
    },
    seguranca: {
        title: "Segurança de Nível Bancário",
        subtitle: "Criptografia de 256 bits e protocolos de isolamento de dados.",
        icon: <ShieldCheck className="w-12 h-12 text-purple-500" />,
        body: (
            <div className="space-y-6 text-slate-300">
                <p>Na MetaFin, a segurança não é um recurso, é o nosso alicerce. Utilizamos os mesmos padrões exigidos pelas instituições financeiras globais.</p>
                <ul className="space-y-4">
                    <li className="flex gap-3 items-start">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 mt-1" />
                        <div>
                            <strong className="text-white">Criptografia em Repouso (AES-256)</strong>
                            <p className="text-sm">Todos os seus dados sensíveis são armazenados com criptografia de nível militar.</p>
                        </div>
                    </li>
                    <li className="flex gap-3 items-start">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 mt-1" />
                        <div>
                            <strong className="text-white">TLS 1.3 em Trânsito</strong>
                            <p className="text-sm">Toda comunicação entre seu dispositivo e nossos servidores é protegida pelo protocolo mais moderno do mercado.</p>
                        </div>
                    </li>
                </ul>
            </div>
        )
    },
    ajuda: {
        title: "Central de Ajuda",
        subtitle: "Tudo o que você precisa para dominar a plataforma.",
        icon: <BookOpen className="w-12 h-12 text-purple-500" />,
        body: (
            <div className="space-y-6 text-slate-300">
                <p>Nossa base de conhecimento foi criada para resolver suas dúvidas em segundos. Desde o primeiro login até o uso avançado da API.</p>
                <div className="grid gap-3">
                    {["Como conectar minha conta XP?", "Configurando metas dinâmicas", "Entendendo os insights do Nexus IA", "Exportação de relatórios para IR"].map(q => (
                        <div key={q} className="p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer transition-all">
                            <span className="text-sm font-medium text-white">{q}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    contatos: {
        title: "Canais de Comunicação",
        subtitle: "Estamos disponíveis 24/7 para usuários Elite.",
        icon: <MessageSquare className="w-12 h-12 text-purple-500" />,
        body: (
            <div className="space-y-6 text-slate-300">
                <p>Escolha o canal mais adequado para sua necessidade. Nosso tempo médio de resposta é de 15 minutos para solicitações críticas.</p>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-white/5">
                        <span className="text-sm">Suporte via Chat</span>
                        <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded">Disponível</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-white/5">
                        <span className="text-sm">E-mail: support@metafin.com.br</span>
                        <span className="text-xs text-slate-500">Resposta em até 2h</span>
                    </div>
                </div>
            </div>
        )
    },
    plataforma: {
        title: "Plataforma de Alta Performance",
        subtitle: "Tecnologia que escala com seu patrimônio.",
        icon: <Zap className="w-12 h-12 text-purple-500" />,
        body: (
            <div className="space-y-6 text-slate-300">
                <p>A arquitetura MetaFin foi desenhada para suportar multi-moedas, multi-bancos e alta volumetria de transações sem perda de performance.</p>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                        <Smartphone className="w-6 h-6 text-purple-500 mb-4" />
                        <h4 className="text-white font-bold mb-2">Cross-Platform</h4>
                        <p className="text-sm">Experiência idêntica em Desktop, iOS e Android, com sincronização em tempo real.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                        <Monitor className="w-6 h-6 text-purple-500 mb-4" />
                        <h4 className="text-white font-bold mb-2">Painel de Analista</h4>
                        <p className="text-sm">Ferramentas avançadas de visualização e filtros para usuários que precisam de granularidade.</p>
                    </div>
                </div>
            </div>
        )
    },
    status: {
        title: "Uptime & Status do Sistema",
        subtitle: "Transparência total sobre nossa infraestrutura global.",
        icon: <Activity className="w-12 h-12 text-purple-500" />,
        body: (
            <div className="space-y-6 text-slate-300">
                <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex items-center gap-4">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-purple-500 font-bold uppercase tracking-widest text-sm">Operacional: Todos os sistemas</span>
                </div>
                <div className="space-y-3">
                    {[
                        { n: "API Gateway", v: "99.99%" },
                        { n: "Sync Bancário", v: "99.95%" },
                        { n: "Nexus IA Engine", v: "100%" },
                        { n: "Dashboard Web", v: "99.98%" }
                    ].map(s => (
                        <div key={s.n} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-white/5">
                            <span className="text-sm">{s.n}</span>
                            <span className="text-sm font-mono text-white">{s.v}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    privacidade: {
        title: "Política de Privacidade",
        subtitle: "Seus dados são seus. Ponto final.",
        icon: <Lock className="w-12 h-12 text-purple-500" />,
        body: (
            <div className="space-y-6 text-slate-300 prose prose-invert max-w-none">
                <p>A MetaFin valoriza sua privacidade acima de tudo. Coletamos apenas os dados estritamente necessários para a prestação de nossos serviços de inteligência financeira.</p>
                <h4 className="text-white">1. Coleta de Dados</h4>
                <p className="text-sm">Coletamos informações de contato e credenciais de acesso via Open Finance, sempre sob seu consentimento explícito.</p>
                <h4 className="text-white">2. Uso de Dados</h4>
                <p className="text-sm">Seus dados são usados exclusivamente para categorização, análise de gastos e geração de insights preditivos. Jamais os vendemos a terceiros.</p>
            </div>
        )
    },
    termos: {
        title: "Termos de Uso",
        subtitle: "Regras claras para uma relação de confiança.",
        icon: <Scale className="w-12 h-12 text-purple-500" />,
        body: (
            <div className="space-y-6 text-slate-300">
                <p>Ao utilizar a MetaFin, você concorda com os termos de prestação de serviços de agregação de dados e inteligência financeira.</p>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                        <p className="text-xs">Uso Pessoal vs Corporativo: Alguns planos são limitados a uso individual e não podem ser compartilhados por múltiplos usuários corporativos.</p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                        <p className="text-xs">Responsabilidade: O usuário é responsável pela manutenção do sigilo de suas senhas e tokens de acesso bancário.</p>
                    </div>
                </div>
            </div>
        )
    },
    lgpd: {
        title: "Conformidade LGPD",
        subtitle: "Lei Geral de Proteção de Dados (L13.709/18).",
        icon: <ShieldCheck className="w-12 h-12 text-purple-500" />,
        body: (
            <div className="space-y-6 text-slate-300">
                <p>Estamos em total conformidade com a LGPD Brasil, garantindo que o titular dos dados tenha controle pleno sobre suas informações.</p>
                <div className="grid gap-3">
                    {["Direito ao Acesso", "Direito à Portabilidade", "Direito à Exclusão (Esquecimento)", "Direito à Revogação de Consentimento"].map(d => (
                        <div key={d} className="flex gap-3 items-center p-3 bg-slate-900/50 rounded-xl border border-white/5">
                            <CheckCircle2 className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">{d}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    bacen: {
        title: "Resolução BACEN & Open Finance",
        subtitle: "Regulação Conjunta CMN/BCB nº 1/2020.",
        icon: <Globe className="w-12 h-12 text-purple-500" />,
        body: (
            <div className="space-y-6 text-slate-300">
                <p>O ecossistema MetaFin opera sob as diretrizes do Banco Central do Brasil para o compartilhamento de dados financeiros.</p>
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-purple-500" />
                        <p className="text-sm font-bold text-white">Transparência no Consentimento</p>
                    </div>
                    <p className="text-sm leading-relaxed indent-4">O compartilhamento de dados no Open Finance exige o consentimento explícito do cliente, que deve indicar quais dados serão compartilhados, com qual instituição e por qual período.</p>
                </div>
            </div>
        )
    }
};

export default function Institutional() {
    const { slug } = useParams();
    const page = CONTENT[slug] || {
        title: "Página não encontrada",
        subtitle: "Desculpe, a seção que você procura não existe ou foi movida.",
        icon: <AlertCircle className="w-12 h-12 text-rose-500" />,
        body: <p className="text-slate-400">Verifique o endereço e tente novamente.</p>
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            {/* Background Subtle elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-500/[0.03] blur-[160px] rounded-full" />
            </div>

            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 py-4">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <MetaFinLogo className="h-7 w-auto" />
                    </Link>
                    <Link to="/" className="text-[13px] font-bold text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </Link>
                </div>
            </header>

            <main className="relative z-10 pt-48 pb-32 px-6">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16 text-center md:text-left"
                    >
                        <div className="mb-8 inline-block p-4 bg-slate-900/50 rounded-3xl border border-white/5 shadow-2xl">
                            {page.icon}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{page.title}</h1>
                        <p className="text-xl text-slate-400 font-medium">{page.subtitle}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-slate-900/40 border border-white/5 p-8 md:p-12 rounded-[3rem] backdrop-blur-3xl shadow-2xl"
                    >
                        {page.body}
                    </motion.div>

                    <div className="mt-16 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                        <Link to="/signup" className="px-10 py-4 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-purple-500/10 active:scale-95">
                            Começar Agora Gratuitamente
                        </Link>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocolo de Segurança Nexus Ativo</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
