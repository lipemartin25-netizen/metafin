import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
    Moon, Sun, Globe, Shield, Bell, Trash2, Key, Mail, Monitor,
    Smartphone as SmartphoneIcon, AlertCircle, CheckCircle, Save
} from 'lucide-react';

export default function Settings() {
    const { user, requestPasswordReset, updateEmail } = useAuth();
    const { language, changeLanguage, t } = useLanguage();

    const [activeTab, setActiveTab] = useState('preferences');

    // Tema persistente
    const [theme, setTheme] = useState(() => localStorage.getItem('sf_theme') || 'dark');
    // Moeda persistente
    const [currency, setCurrency] = useState(() => localStorage.getItem('sf_currency') || 'BRL');
    // Notificações persistentes
    const [emailAlerts, setEmailAlerts] = useState(() => {
        const stored = localStorage.getItem('sf_notifications');
        if (stored) {
            try { return JSON.parse(stored); } catch { /* ignore */ }
        }
        return { news: true, premium: true, financial: true };
    });

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); // 'success' | 'error'

    // Salvar tema
    useEffect(() => {
        localStorage.setItem('sf_theme', theme);
        // Aplicar classe no document (preparação futura para light mode)
        if (theme === 'light') {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        }
    }, [theme]);

    // Salvar moeda
    useEffect(() => {
        localStorage.setItem('sf_currency', currency);
    }, [currency]);

    // Salvar notificações
    useEffect(() => {
        localStorage.setItem('sf_notifications', JSON.stringify(emailAlerts));
    }, [emailAlerts]);

    const showMsg = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(''), 3500);
    };

    const handleThemeToggle = (newTheme) => {
        setTheme(newTheme);
        showMsg(`${t('theme_changed')} ${newTheme === 'dark' ? t('dark') : t('light')}`);
    };

    const handleCurrencyChange = (e) => {
        setCurrency(e.target.value);
        showMsg(t('saved'));
    };

    const handlePasswordReset = async () => {
        try {
            if (user?.email && requestPasswordReset) {
                await requestPasswordReset(user.email);
                showMsg(t('password_reset_sent'));
            } else {
                showMsg(t('password_reset_sent') + ' (demo)');
            }
        } catch {
            showMsg(t('password_reset_error'), 'error');
        }
    };

    const handleNotificationToggle = (key) => {
        setEmailAlerts(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            return updated;
        });
        showMsg(t('saved'));
    };

    const SECTIONS = [
        { id: 'preferences', label: t('preferences'), icon: Globe },
        { id: 'security', label: t('security'), icon: Shield },
        { id: 'notifications', label: t('notifications'), icon: Bell },
    ];

    const mockDevices = [
        { id: 1, name: 'Windows PC (Chrome)', lastActive: t('active_now'), current: true, icon: Monitor },
        { id: 2, name: 'iPhone 13 (Safari)', lastActive: '2h', current: false, icon: SmartphoneIcon },
        { id: 3, name: 'Samsung S21 (App)', lastActive: '1d', current: false, icon: SmartphoneIcon },
    ];

    return (
        <div className="py-8 space-y-6 animate-fade-in pb-24 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">{t('account_settings')}</h1>
            <p className="text-gray-400 mb-8">{t('manage_preferences')}</p>

            {/* Toast */}
            {message && (
                <div className={`fixed top-20 right-8 z-50 animate-fade-in p-4 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-md border ${messageType === 'success'
                        ? 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
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
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
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
                                    <Globe className="w-5 h-5 text-brand-400" /> {t('appearance_language')}
                                </h2>

                                <div className="space-y-6">
                                    {/* Theme Selector */}
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div>
                                            <p className="font-medium text-white">{t('app_theme')}</p>
                                            <p className="text-sm text-gray-400">{t('theme_desc')}</p>
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
                                            <p className="font-medium text-white">{t('main_currency')}</p>
                                            <p className="text-sm text-gray-400">{t('currency_desc')}</p>
                                        </div>
                                        <select
                                            value={currency}
                                            onChange={handleCurrencyChange}
                                            className="bg-surface-900 text-white border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-brand-500/50 cursor-pointer"
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
                                    <Shield className="w-5 h-5 text-brand-400" /> {t('account_security')}
                                </h2>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{t('email_address')}</p>
                                                <p className="text-sm text-gray-400">{user?.email}</p>
                                            </div>
                                        </div>
                                        <button className="text-sm text-brand-400 font-medium hover:text-brand-300 transition-colors">
                                            {t('change')}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                                <Key className="w-5 h-5 text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{t('access_password')}</p>
                                                <p className="text-sm text-gray-400">••••••••••••</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handlePasswordReset}
                                            className="text-sm text-brand-400 font-medium hover:text-brand-300 transition-colors"
                                        >
                                            {t('reset')}
                                        </button>
                                    </div>
                                </div>

                                {/* Active Devices */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{t('connected_devices')}</h3>
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
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/20">{t('this_device')}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {device.current ? t('active_now') : `${t('last_access')}: ${device.lastActive}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!device.current && (
                                                    <button
                                                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                        title={t('remove_device')}
                                                        onClick={() => showMsg(`${t('device_removed')}: ${device.name} (${t('simulation')})`)}
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
                                    <Bell className="w-5 h-5 text-brand-400" /> {t('notification_prefs')}
                                </h2>

                                <div className="space-y-6">
                                    {[
                                        { key: 'news', title: t('news_title'), desc: t('news_desc') },
                                        { key: 'premium', title: t('premium_title'), desc: t('premium_desc') },
                                        { key: 'financial', title: t('financial_alerts_title'), desc: t('financial_alerts_desc') },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-start justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-colors">
                                            <div className="pr-4">
                                                <p className="font-medium text-white mb-1">{item.title}</p>
                                                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={emailAlerts[item.key]}
                                                    onChange={() => handleNotificationToggle(item.key)}
                                                />
                                                <div className="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500" />
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-blue-400 mb-1">{t('important')}</h4>
                                        <p className="text-xs text-blue-300/80">{t('security_notice')}</p>
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
