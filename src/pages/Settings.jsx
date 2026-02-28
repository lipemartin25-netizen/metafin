import { tw } from '@/lib/theme';
﻿import { useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
 Moon, Sun, Globe, Shield, Bell, Trash2, Key, Mail, Monitor,
 Smartphone as SmartphoneIcon, AlertCircle, CheckCircle, HelpCircle, FileSpreadsheet, Zap
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

 // ✅ State para dispositivos (permite remover)
 const [devices, setDevices] = useState(() => [
 { id: 1, name: 'Windows PC (Chrome)', lastActive: 'Agora', current: true, icon: Monitor },
 { id: 2, name: 'iPhone 13 (Safari)', lastActive: '2h atrás', current: false, icon: SmartphoneIcon },
 { id: 3, name: 'Samsung S21 (App)', lastActive: '1 dia atrás', current: false, icon: SmartphoneIcon },
 ]);

 const showMsg = (text, type = 'success') => {
 setMessage(text);
 setMessageType(type);
 setTimeout(() => setMessage(''), 3500);
 };

 const handleThemeToggle = (newTheme) => {
 setTheme(newTheme);
 showMsg(`Tema alterado para ${newTheme === 'dark' ? 'Escuro' : 'Claro'}`);
 };

 const handleCurrencyChange = (e) => {
 const val = e.target.value;
 setCurrency(val);
 showMsg('Preferências salvas!');
 };

 const handlePasswordReset = async () => {
 try {
 if (user?.email && requestPasswordReset) {
 await requestPasswordReset(user.email);
 showMsg('E-mail de redefinição enviado!');
 } else {
 showMsg('E-mail de redefinição enviado! (demo)');
 }
 } catch {
 showMsg('Erro ao enviar e-mail. Tente novamente.', 'error');
 }
 };

 const handleNotificationToggle = (key) => {
 const newState = { ...emailAlerts, [key]: !emailAlerts[key] };
 setEmailAlerts(newState);
 showMsg('Preferências salvas!');
 };

 // ✅ Remover dispositivo com state real
 const handleRemoveDevice = (deviceId, deviceName) => {
 if (window.confirm(`Desconectar dispositivo "${deviceName}"?`)) {
 setDevices(prev => prev.filter(d => d.id !== deviceId));
 showMsg(`Dispositivo "${deviceName}" desconectado.`);
 }
 };

 const SECTIONS = [
 { id: 'preferences', label: 'Preferências', icon: Globe },
 { id: 'security', label: 'Segurança', icon: Shield },
 { id: 'notifications', label: 'Notificações', icon: Bell },
 { id: 'tutorial', label: 'Como Usar', icon: HelpCircle },
 ];

 return (
 <div className="py-8 space-y-6 animate-fade-in pb-24 max-w-5xl mx-auto">
 <h1 className="text-3xl font-bold text-content-primary mb-2">Configurações</h1>
 <p className="text-content-secondary mb-8">Gerencie suas preferências e segurança da conta</p>

 {/* Toast */}
 {message && (
 <div className={`fixed top-20 right-8 z-50 animate-fade-in p-4 rounded-xl flex items-center gap-2 shadow-elevated border ${messageType === 'success'
 ? 'bg-violet-500/10 border-violet-500/20 text-violet-300'
 : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
 <CheckCircle className="w-5 h-5" />
 {message}
 </div>
 )}

 <div className="grid md:grid-cols-[240px_1fr] gap-8">
 {/* Sidebar Nav */}
 <div className="space-y-2">
 {SECTIONS.map((section) => (
 <button
 key={section.id}
 onClick={() => setActiveTab(section.id)}
 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${activeTab === section.id
 ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
 : 'text-content-secondary hover:bg-gray-800/40/5 hover:text-slate-200 border border-transparent'}`}
 >
 <section.icon className={`w-5 h-5 ${activeTab === section.id ? 'text-violet-400' : 'text-content-muted'}`} />
 {section.label}
 </button>
 ))}
 </div>

 {/* Content */}
 <div className={`\${tw.card} min-h-[500px] p-8`}>

 {/* PREFERENCES */}
 {activeTab === 'preferences' && (
 <div className="space-y-8 animate-fade-in">
 <h2 className="text-xl font-bold text-content-primary mb-6 flex items-center gap-2">
 <Globe className="w-5 h-5 text-violet-400" /> Aparência e Idioma
 </h2>
 <div className="space-y-4">
 {/* Theme Toggle */}
 <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40/5 border border-[var(--border)]">
 <div>
 <p className="font-medium text-content-primary">Tema do App</p>
 <p className="text-sm text-content-secondary mt-0.5">Escolha entre tema escuro ou claro</p>
 </div>
 <div className="flex bg-gray-800/40/5 rounded-xl p-1 border border-[var(--border)] gap-1">
 <button
 onClick={() => handleThemeToggle('light')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'light'
 ? 'bg-gray-800/40 text-slate-900 shadow-lg'
 : 'text-content-secondary hover:text-slate-200'}`}
 >
 <Sun className="w-4 h-4" /> Claro
 </button>
 <button
 onClick={() => handleThemeToggle('dark')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'dark'
 ? 'bg-violet-600 text-content-primary shadow-lg shadow-violet-500/20'
 : 'text-content-secondary hover:text-slate-200'}`}
 >
 <Moon className="w-4 h-4" /> Escuro
 </button>
 </div>
 </div>

 {/* Currency */}
 <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40/5 border border-[var(--border)]">
 <div>
 <p className="font-medium text-content-primary">Moeda Principal</p>
 <p className="text-sm text-content-secondary mt-0.5">Moeda usada para exibir valores</p>
 </div>
 <select
 value={currency}
 onChange={handleCurrencyChange}
 className="bg-gray-800/40/10 text-content-primary border border-[var(--border)] rounded-xl px-4 py-2 outline-none focus:border-violet-500 cursor-pointer text-sm"
 >
 <option value="BRL" className="bg-[#0d1424]">BRL (R$)</option>
 <option value="USD" className="bg-[#0d1424]">USD ($)</option>
 <option value="EUR" className="bg-[#0d1424]">EUR (€)</option>
 </select>
 </div>
 </div>
 </div>
 )}

 {/* SECURITY */}
 {activeTab === 'security' && (
 <div className="space-y-8 animate-fade-in">
 <h2 className="text-xl font-bold text-content-primary mb-6 flex items-center gap-2">
 <Shield className="w-5 h-5 text-violet-400" /> Segurança da Conta
 </h2>
 <div className="space-y-4 mb-8">
 <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40/5 border border-[var(--border)]">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
 <Mail className="w-5 h-5 text-blue-400" />
 </div>
 <div>
 <p className="font-medium text-content-primary">Endereço de E-mail</p>
 <p className="text-sm text-content-secondary">{user?.email || 'não informado'}</p>
 </div>
 </div>
 <button className="text-sm text-violet-400 font-medium hover:text-violet-300 hover:underline transition-colors">
 Alterar
 </button>
 </div>
 <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40/5 border border-[var(--border)]">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
 <Key className="w-5 h-5 text-orange-400" />
 </div>
 <div>
 <p className="font-medium text-content-primary">Senha de Acesso</p>
 <p className="text-sm text-content-secondary">••••••••••••</p>
 </div>
 </div>
 <button onClick={handlePasswordReset} className="text-sm text-violet-400 font-medium hover:text-violet-300 hover:underline transition-colors">
 Redefinir
 </button>
 </div>
 </div>

 {/* ✅ Dispositivos com state real e lixeira funcional */}
 <div>
 <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-4">
 Dispositivos Conectados
 </h3>
 <div className="space-y-3">
 {devices.map((device) => (
 <div key={device.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-800/40/5 hover:bg-gray-800/40/[0.07] border border-[var(--border)] transition-colors group">
 <div className="flex items-center gap-4">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${device.current ? 'bg-violet-500/10 text-violet-400' : 'bg-gray-800/40/5 text-content-secondary'}`}>
 <device.icon className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <p className="font-medium text-content-primary text-sm">{device.name}</p>
 {device.current && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/20">
 Este dispositivo
 </span>
 )}
 </div>
 <p className="text-xs text-content-muted mt-0.5">
 {device.current ? '🟢 Ativo agora' : `Último acesso: ${device.lastActive}`}
 </p>
 </div>
 </div>
 {!device.current && (
 <button
 onClick={() => handleRemoveDevice(device.id, device.name)}
 className="p-2 rounded-lg text-content-muted hover:text-red-400 hover:bg-red-500/10 transition-all opacity-60 group-hover:opacity-100"
 title="Desconectar dispositivo"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 ))}
 {devices.filter(d => !d.current).length === 0 && (
 <p className="text-sm text-content-muted text-center py-4">Nenhum outro dispositivo conectado.</p>
 )}
 </div>
 </div>
 </div>
 )}

 {/* NOTIFICATIONS */}
 {activeTab === 'notifications' && (
 <div className="space-y-8 animate-fade-in">
 <h2 className="text-xl font-bold text-content-primary mb-6 flex items-center gap-2">
 <Bell className="w-5 h-5 text-violet-400" /> Preferências de Notificação
 </h2>
 <div className="space-y-4">
 {[
 { key: 'news', title: 'Novidades e Atualizações', desc: 'Receba e-mails sobre novas funcionalidades e melhorias do MetaFin.' },
 { key: 'premium', title: 'Ofertas Premium', desc: 'Promoções exclusivas e benefícios do plano Pro.' },
 { key: 'financial', title: 'Alertas Financeiros', desc: 'Notificações sobre metas, limites de orçamento e insights da IA.' },
 ].map((item) => (
 <div key={item.key} className="flex items-start justify-between p-4 rounded-xl bg-gray-800/40/5 border border-[var(--border)] hover:bg-gray-800/40/[0.07] transition-colors">
 <div className="pr-4">
 <p className="font-medium text-content-primary mb-1">{item.title}</p>
 <p className="text-sm text-content-secondary leading-relaxed">{item.desc}</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
 <input type="checkbox" className="sr-only peer" checked={emailAlerts[item.key]} onChange={() => handleNotificationToggle(item.key)} />
 <div className="w-11 h-6 bg-gray-800/40/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-800/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500" />
 </label>
 </div>
 ))}
 </div>
 <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3 mt-6">
 <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
 <div>
 <h4 className="text-sm font-medium text-blue-400 mb-1">Importante</h4>
 <p className="text-xs text-blue-300/70">Notificações de segurança (acesso não reconhecido, alterações de senha) serão sempre enviadas independente das preferências acima.</p>
 </div>
 </div>
 </div>
 )}

 {/* TUTORIAL */}
 {activeTab === 'tutorial' && (
 <div className="space-y-6 animate-fade-in">
 <h2 className="text-xl font-bold text-content-primary mb-6 flex items-center gap-2">
 <HelpCircle className="w-5 h-5 text-violet-400" /> Como Usar o MetaFin
 </h2>
 <div className={`\${tw.card} p-5 border-l-4 border-l-violet-500`}>
 <h3 className="text-base font-bold text-content-primary mb-2">Visão Geral</h3>
 <p className="text-sm text-content-secondary leading-relaxed">O MetaFin é o seu copiloto inteligente para gerenciar suas finanças. Monitore transações, crie planos de orçamento, acompanhe seu patrimônio líquido e use IA avançada para analisar sua saúde financeira de maneira automática.</p>
 </div>
 <div className={`\${tw.card} p-5`}>
 <h3 className="text-base font-bold text-content-primary mb-4 flex items-center gap-2">
 <FileSpreadsheet className="w-5 h-5 text-brand-glow" /> Importando Documentos
 </h3>
 <ol className="text-sm text-content-secondary space-y-2 pl-4 list-decimal">
 <li>Vá até a aba <strong className="text-slate-200">Transações</strong> no menu lateral.</li>
 <li>Clique em <strong className="text-slate-200">Importar Arquivo</strong> (Smart Import Multi-Formato).</li>
 <li>Selecione arquivos CSV, Excel ou outros suportados.</li>
 <li>A plataforma identificará automaticamente as colunas e categorizará as despesas.</li>
 <li>Certifique-se que os arquivos possuam colunas: <code className="bg-gray-800/40/5 px-1 rounded">data</code>, <code className="bg-gray-800/40/5 px-1 rounded">valor</code>, <code className="bg-gray-800/40/5 px-1 rounded">descricao</code>.</li>
 </ol>
 </div>
 <div className={`\${tw.card} p-5 bg-brand-glow/5 border border-brand-glow/10`}>
 <h3 className="text-base font-bold text-content-primary mb-4 flex items-center gap-2">
 <Zap className="w-5 h-5 text-brand-glow" /> Conectando Webhooks e Automações
 </h3>
 <p className="text-sm text-content-secondary leading-relaxed mb-3">Integre o MetaFin com <strong className="text-slate-200">Zapier, Make, n8n</strong> para receber transações automaticamente (ex: MercadoPago, Stripe).</p>
 <ol className="text-sm text-content-secondary space-y-2 pl-4 list-decimal">
 <li>Vá em <strong className="text-slate-200">Webhooks</strong> no menu (ícone <code className="bg-gray-800/40/5 px-1 rounded">&lt;/&gt;</code>).</li>
 <li>Clique em <strong className="text-slate-200">Gerar API Key</strong>.</li>
 <li>Copie a chave e configure na sua plataforma de automação preferida via <code className="bg-gray-800/40/5 px-1 rounded">POST</code>.</li>
 </ol>
 </div>
 <div className={`\${tw.card} p-5`}>
 <h3 className="text-base font-bold text-content-primary mb-3 flex items-center gap-2">
 <Globe className="w-5 h-5 text-blue-400" /> Consultor IA
 </h3>
 <p className="text-sm text-content-secondary leading-relaxed">A IA tem acesso às suas transações, metas e orçamentos para fornecer insights precisos. Experimente: <em className="text-content-secondary">&quot;A IA detecta algum padrão onde posso economizar?&quot;</em></p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
