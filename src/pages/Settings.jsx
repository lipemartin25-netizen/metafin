import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext'; // We'll create this later if needed, but for now we mock it
import {
    Moon, Sun, Globe, Shield, Bell, Smartphone, Trash2, Key, Mail, Monitor, Smartphone as SmartphoneIcon,
    AlertCircle, CheckCircle
} from 'lucide-react';

const SECTIONS = [
    { id: 'preferences', label: 'Preferências', icon: Globe },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
];

export default function Settings() {
    const { user, requestPasswordReset, updateEmail } = useAuth(); // Assuming AuthContext has these methods or similar, otherwise we'll mock for now
    const { language, changeLanguage } = useLanguage();
    const [activeTab, setActiveTab] = useState('preferences');
    const [theme, setTheme] = useState('dark'); // 'light' or 'dark'
    const [currency, setCurrency] = useState('BRL');
    const [emailAlerts, setEmailAlerts] = useState({
        news: true,
        premium: true,
        financial: true,
    });
    const [message, setMessage] = useState('');

    const handleThemeToggle = (newTheme) => {
        setTheme(newTheme);
        // Here we would actually switch the global theme context/class
        // document.documentElement.classList.toggle('dark', newTheme === 'dark');
        setMessage(`Tema alterado para ${newTheme === 'dark' ? 'Escuro' : 'Claro'} (Simulação)`);
        setTimeout(() => setMessage(''), 3000);
    };

    const handlePasswordReset = async () => {
        try {
            if (user?.email) {
                await requestPasswordReset(user.email);
                setMessage('Email de redefinição de senha enviado!');
            }
        } catch (error) {
            setMessage('Erro ao enviar email de redefinição.');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleNotificationToggle = (key) => {
        setEmailAlerts(prev => ({ ...prev, [key]: !prev[key] }));
        // Save to backend logic here
    };

    const mockDevices = [
        { id: 1, name: 'Windows PC (Chrome)', lastActive: 'Agora', current: true, icon: Monitor },
        { id: 2, name: 'iPhone 13 (Safari)', lastActive: 'Há 2 horas', current: false, icon: SmartphoneIcon },
        { id: 3, name: 'Samsung S21 (App)', lastActive: 'Ontem', current: false, icon: SmartphoneIcon },
    ];

    return (
        <div className="py-8 space-y-6 animate-fade-in pb-24 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Configurações da Conta</h1>
            <p className="text-gray-400 mb-8">Gerencie suas preferências e segurança</p>

            {message && (
                <div className="fixed top-20 right-8 z-50 animate-fade-in p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center gap-2 shadow-xl backdrop-blur-md">
                    <CheckCircle className="w-5 h-5" />
                    {message}
                </div>
            )}

            <div className="grid md:grid-cols-[240px_1fr] gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveTab(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${activeTab === section.id
                                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <section.icon className={`w-5 h-5 ${activeTab === section.id ? 'text-brand-400' : 'text-gray-500'}`} />
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="glass-card min-h-[500px] p-8">

                    {/* ===== PREFERENCES TAB ===== */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-brand-400" /> Aparência e Idioma
                                </h2>

                                <div className="space-y-6">
                                    {/* Theme Selector */}
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div>
                                            <p className="font-medium text-white">Tema do Aplicativo</p>
                                            <p className="text-sm text-gray-400">Escolha entre modo claro e escuro</p>
                                        </div>
                                        <div className="flex bg-surface-900 rounded-lg p-1 border border-white/10">
                                            <button
                                                onClick={() => handleThemeToggle('light')}
                                                className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                <Sun className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleThemeToggle('dark')}
                                                className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                <Moon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Currency Selector */}
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div>
                                            <p className="font-medium text-white">Moeda Principal</p>
                                            <p className="text-sm text-gray-400">Moeda usada nos relatórios</p>
                                        </div>
                                        <select
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="bg-surface-900 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-brand-500/50"
                                        >
                                            <option value="BRL">BRL (R$)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== SECURITY TAB ===== */}
                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-brand-400" /> Segurança da Conta
                                </h2>

                                {/* Email & Password */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">Endereço de Email</p>
                                                <p className="text-sm text-gray-400">{user?.email}</p>
                                            </div>
                                        </div>
                                        <button className="text-sm text-brand-400 font-medium hover:text-brand-300 transition-colors">
                                            Alterar
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                                <Key className="w-5 h-5 text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">Senha de Acesso</p>
                                                <p className="text-sm text-gray-400">••••••••••••</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handlePasswordReset}
                                            className="text-sm text-brand-400 font-medium hover:text-brand-300 transition-colors"
                                        >
                                            Redefinir
                                        </button>
                                    </div>
                                </div>

                                {/* Active Devices */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Dispositivos Conectados</h3>
                                    <div className="space-y-3">
                                        {mockDevices.map((device) => (
                                            <div key={device.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 hover:bg-white/5 border border-white/5 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${device.current ? 'bg-brand-500/10 text-brand-400' : 'bg-white/5 text-gray-400'}`}>
                                                        <device.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-white text-sm">{device.name}</p>
                                                            {device.current && (
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/20">Este dispositivo</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {device.current ? 'Ativo agora' : `Último acesso: ${device.lastActive}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!device.current && (
                                                    <button
                                                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Remover dispositivo"
                                                        onClick={() => setMessage(`Dispositivo ${device.name} removido (Simulação)`)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== NOTIFICATIONS TAB ===== */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-brand-400" /> Preferências de Notificação
                                </h2>

                                <div className="space-y-6">
                                    {[
                                        {
                                            key: 'news',
                                            title: 'Novidades do Smart Finance Hub',
                                            desc: 'Novas funcionalidades e as melhores dicas para transformar sua vida financeira para melhor.'
                                        },
                                        {
                                            key: 'premium',
                                            title: 'Informações sobre o Premium',
                                            desc: 'Confirmação de pagamento, ativação do Premium, promoções e novidades dos planos.'
                                        },
                                        {
                                            key: 'financial',
                                            title: 'Alertas Financeiros',
                                            desc: 'Lembretes sobre datas de vencimento, gastos, transferências, pagamentos, desempenho e objetivos.'
                                        }
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-start justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-colors">
                                            <div className="pr-4">
                                                <p className="font-medium text-white mb-1">{item.title}</p>
                                                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer mt-1">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={emailAlerts[item.key]}
                                                    onChange={() => handleNotificationToggle(item.key)}
                                                />
                                                <div className="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-blue-400 mb-1">Importante</h4>
                                        <p className="text-xs text-blue-300/80">
                                            Notificações transacionais importantes (como redefinição de senha ou alertas de segurança) não podem ser desativadas para garantir a proteção da sua conta.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
