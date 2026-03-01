import { tw } from '../lib/theme';
import { useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    Moon, Sun, Globe, Shield, Bell, Trash2, Key, Mail, Monitor,
    Smartphone as SmartphoneIcon, CheckCircle, HelpCircle, Zap,
    ChevronRight,
    ShieldCheck,
    X
} from 'lucide-react';

export default function Settings() {
    const { user, requestPasswordReset } = useAuth();
    const { theme, setTheme } = useTheme();

    const [activeTab, setActiveTab] = useState('preferences');
    const [currency, setCurrency] = usePersistentState('currency', 'BRL', { secure: false });
    const [emailAlerts, setEmailAlerts] = usePersistentState('notifications', {
        news: true,
        premium: true,
        financial: true
    }, { secure: false });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const [devices, setDevices] = useState([
        { id: 1, name: 'Windows PC (Chrome)', lastActive: 'Agora', current: true, icon: Monitor },
        { id: 2, name: 'iPhone 13 (Safari)', lastActive: '2h atrás', current: false, icon: SmartphoneIcon },
        { id: 3, name: 'Samsung S21 (App)', lastActive: '1 dia atrás', current: false, icon: SmartphoneIcon },
    ]);

    const showMsg = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(''), 3500);
    };

    const SECTIONS = [
        { id: 'preferences', label: 'Preferências', icon: Globe },
        { id: 'security', label: 'Segurança', icon: Shield },
        { id: 'notifications', label: 'Notificações', icon: Bell },
        { id: 'tutorial', label: 'Como Usar', icon: HelpCircle },
    ];

    return (
        <div className="py-8 space-y-6 animate-in pb-24 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className={`${tw.headingLg} uppercase tracking-tight`}>Configurações</h1>
                    <p className={`${tw.text} mt-1`}>Gerencie suas preferências e segurança da conta</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--menta-soft)] border border-[var(--menta-border)] text-[var(--menta-dark)] text-[10px] font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" />
                    Sincronização Ativa
                </div>
            </div>

            {/* Toast */}
            {message && (
                <div className={`fixed top-24 right-8 z-50 animate-in p-4 rounded-2xl flex items-center gap-3 shadow-elevated border ${messageType === 'success'
                    ? 'bg-[var(--menta-soft)] border-[var(--menta-border)] text-[var(--menta-dark)]'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold text-sm tracking-tight">{message}</span>
                    <button onClick={() => setMessage('')}><X className="w-4 h-4 opacity-50" /></button>
                </div>
            )}

            <div className="grid md:grid-cols-[240px_1fr] gap-8">
                {/* Sidebar Nav */}
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] px-4 mb-3">Módulos</p>
                    {SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveTab(section.id)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all border ${activeTab === section.id
                                ? 'bg-[var(--menta-soft)] text-[var(--menta-dark)] border-[var(--menta-border)] shadow-sm'
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] border-transparent'}`}
                        >
                            <div className="flex items-center gap-3">
                                <section.icon className={`w-4 h-4 ${activeTab === section.id ? 'text-[var(--menta-dark)]' : 'text-[var(--text-muted)]'}`} />
                                {section.label}
                            </div>
                            {activeTab === section.id && <ChevronRight className="w-3 h-3" />}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className={`${tw.card} p-8 min-h-[600px] border-[var(--border-subtle)]`}>

                    {/* 1. PREFERENCES */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-10 animate-in">
                            <div className="flex items-center gap-4 border-b border-[var(--border-divider)] pb-6">
                                <div className={tw.iconBox}>
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Experiência Visual</h2>
                                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-[0.15em] mt-1">Idioma & Aparência</p>
                                </div>
                            </div>

                            {/* Theme Selector */}
                            <div className="p-8 rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-[var(--bg-elevated)])] shadow-inset-3d">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div>
                                        <p className="text-lg font-bold text-[var(--text-primary)]">Tema da Interface</p>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1">Adapte o MetaFin ao seu ambiente de trabalho</p>
                                    </div>
                                    <div className="flex bg-[var(--bg-surface)] rounded-2xl p-1.5 border border-[var(--border-divider)] gap-1.5">
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all ${theme === 'light'
                                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-elevated border border-[var(--rosa-border)]'
                                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                        >
                                            <Sun className="w-4 h-4" /> Claro
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all ${theme === 'dark'
                                                ? 'bg-[#0B0E17] text-white shadow-lg border border-slate-700'
                                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                        >
                                            <Moon className="w-4 h-4" /> Escuro
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Currency Selector */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[2rem] border border-[var(--border-divider)] bg-[var(--bg-surface)]/30 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--menta-soft)] flex items-center justify-center border border-[var(--menta-border)]">
                                        <span className="text-[var(--menta-dark)] font-bold text-lg">{currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : '$'}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--text-primary)]">Moeda Regional</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Defina a moeda base do ecossistema</p>
                                    </div>
                                </div>
                                <select
                                    value={currency}
                                    onChange={(e) => { setCurrency(e.target.value); showMsg('Moeda atualizada!'); }}
                                    className="bg-[var(--bg-[var(--bg-elevated)])] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--menta)] cursor-pointer text-sm font-bold min-w-[140px]"
                                >
                                    <option value="BRL">BRL (R$)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* 2. SECURITY */}
                    {activeTab === 'security' && (
                        <div className="space-y-10 animate-in">
                            <div className="flex items-center gap-4 border-b border-[var(--border-divider)] pb-6">
                                <div className={tw.iconBoxRosa}>
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Segurança Global</h2>
                                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-[0.15em] mt-1">Proteção de Conta & Sessões</p>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="flex items-center justify-between p-6 rounded-3xl border border-[var(--border-divider)] bg-[var(--bg-surface)]/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-500">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text-primary)]">Email de Acesso</p>
                                            <p className="text-xs text-[var(--text-muted)] font-mono">{user?.email}</p>
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">Alterar</button>
                                </div>

                                <div className="flex items-center justify-between p-6 rounded-3xl border border-[var(--border-divider)] bg-[var(--bg-surface)]/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)]mber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                                            <Key className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text-primary)]">Autenticação</p>
                                            <p className="text-xs text-[var(--text-muted)]">Senha mestre criptografada</p>
                                        </div>
                                    </div>
                                    <button onClick={async () => { await requestPasswordReset(user.email); showMsg('Email enviado!'); }} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">Redefinir</button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Sessões Conectadas</h3>
                                <div className="space-y-3">
                                    {devices.map(device => (
                                        <div key={device.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border-divider)] bg-[var(--bg-[var(--bg-elevated)])] group">
                                            <div className="flex items-center gap-4">
                                                <device.icon className={`w-5 h-5 ${device.current ? 'text-[var(--menta)]' : 'text-[var(--text-muted)]'}`} />
                                                <div>
                                                    <p className="text-sm font-bold text-[var(--text-primary)]">{device.name}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)]">{device.current ? 'ATIVO NO MOMENTO' : `Último acesso: ${device.lastActive}`}</p>
                                                </div>
                                            </div>
                                            {!device.current && (
                                                <button onClick={() => { setDevices(prev => prev.filter(d => d.id !== device.id)); showMsg('Dispositivo removido'); }} className="p-2.5 rounded-xl bg-rose-500 text-rose-500/10 hover:bg-rose-500/10 transition-all">
                                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. NOTIFICATIONS */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-10 animate-in">
                            <div className="flex items-center gap-4 border-b border-[var(--border-divider)] pb-6">
                                <div className={tw.iconBox}>
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Alertas Inteligentes</h2>
                                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-[0.15em] mt-1">Push & Email Compliance</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { key: 'news', title: 'Roadmap & Evolução', desc: 'Receba insights sobre novas funcionalidades do ecossistema.' },
                                    { key: 'premium', title: 'Status do Plano Pro', desc: 'Alertas sobre sua assinatura e benefícios exclusivos.' },
                                    { key: 'financial', title: 'Sentinel AI', desc: 'Notificações preditivas sobre seus fluxos financeiros.' }
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-6 rounded-[2rem] border border-[var(--border-divider)] bg-[var(--bg-surface)]/20">
                                        <div className="max-w-[75%]">
                                            <p className="font-bold text-[var(--text-primary)] text-sm">{item.title}</p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1">{item.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer scale-90">
                                            <input type="checkbox" className="sr-only peer" checked={emailAlerts[item.key]} onChange={() => { setEmailAlerts(p => ({ ...p, [item.key]: !p[item.key] })); showMsg('Ajuste salvo!'); }} />
                                            <div className="w-12 h-6 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full peer peer-checked:bg-[var(--menta)] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[var(--text-muted)] peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. TUTORIAL / HELP */}
                    {activeTab === 'tutorial' && (
                        <div className="space-y-10 animate-in">
                            <div className="flex items-center gap-4 border-b border-[var(--border-divider)] pb-6">
                                <div className={tw.iconBoxAlt}>
                                    <HelpCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Suporte ao Ecossistema</h2>
                                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-[0.15em] mt-1">Central de Ajuda & Guia</p>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="p-8 rounded-[2.5rem] bg-[var(--bg-[var(--bg-elevated)])] border border-[var(--border-subtle)] text-center space-y-4">
                                    <div className="w-16 h-16 bg-[var(--menta-soft)] rounded-3xl flex items-center justify-center mx-auto mb-2 border border-[var(--menta-border)]">
                                        <Zap className="w-8 h-8 text-[var(--menta-dark)]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">MetaFin Pro Onboarding</h3>
                                    <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">Domine todas as ferramentas de inteligência patrimonial em menos de 5 minutos.</p>
                                    <button className={`${tw.btnPrimary} px-8 mt-4`}>Iniciar Guia Rápido</button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
