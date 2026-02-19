import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    Moon, Sun, Globe, Shield, Bell, Trash2, Key, Mail, Monitor,
    Smartphone as SmartphoneIcon, AlertCircle, CheckCircle
} from 'lucide-react';

export default function Settings() {
    const { user, requestPasswordReset, updateEmail } = useAuth();
    const { t } = useLanguage();
    const { theme, setTheme } = useTheme();

    const [activeTab, setActiveTab] = useState('preferences');

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
    const [messageType, setMessageType] = useState('success');

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
        const val = e.target.value;
        setCurrency(val);
        localStorage.setItem('sf_currency', val);
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
        const newState = { ...emailAlerts, [key]: !emailAlerts[key] };
        setEmailAlerts(newState);
        localStorage.setItem('sf_notifications', JSON.stringify(newState));
        showMsg(t('saved'));
    };

    const SECTIONS = [
        { id: 'preferences', label: t('preferences'), icon: Globe },
        { id: 'security', label: t('security'), icon: Shield },
        { id: 'notifications', label: t('notifications'), icon: Bell },
    ];

    const mockDevices = useMemo(() => [
        { id: 1, name: 'Windows PC (Chrome)', lastActive: t('active_now'), current: true, icon: Monitor },
        { id: 2, name: 'iPhone 13 (Safari)', lastActive: '2h', current: false, icon: SmartphoneIcon },
        { id: 3, name: 'Samsung S21 (App)', lastActive: '1d', current: false, icon: SmartphoneIcon },
    ], [t]);

    return (
        <div className="py-8 space-y-6 animate-fade-in pb-24 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('account_settings')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{t('manage_preferences')}</p>

            {/* Toast */}
            {message && (
                <div className={`fixed top-20 right-8 z-50 animate-fade-in p-4 rounded-xl flex items-center gap-2 shadow-xl backdrop-blur-md border ${messageType === 'success'
                        ? 'bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
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
                                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <section.icon className={`w-5 h-5 ${activeTab === section.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`} />
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-brand-500" /> {t('appearance_language')}
                                </h2>

                                <div className="space-y-6">
                                    {/* Theme Selector */}
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{t('app_theme')}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('theme_desc')}</p>
                                        </div>
                                        <div className="flex bg-gray-200 dark:bg-surface-900 rounded-lg p-1 border border-gray-300 dark:border-white/10">
                                            <button
                                                onClick={() => handleThemeToggle('light')}
                                                className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                            >
                                                <Sun className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleThemeToggle('dark')}
                                                className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-brand-600 text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                            >
                                                <Moon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Currency Selector */}
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{t('main_currency')}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('currency_desc')}</p>
                                        </div>
                                        <select
                                            value={currency}
                                            onChange={handleCurrencyChange}
                                            className="bg-white dark:bg-surface-900 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:border-brand-500 cursor-pointer"
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-brand-500" /> {t('account_security')}
                                </h2>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{t('email_address')}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                                            </div>
                                        </div>
                                        <button className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline transition-colors">
                                            {t('change')}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center">
                                                <Key className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{t('access_password')}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">••••••••••••</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handlePasswordReset}
                                            className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline transition-colors"
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
                                            <div key={device.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-surface-800/50 hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${device.current ? 'bg-brand-100 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'bg-gray-200 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
                                                        <device.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{device.name}</p>
                                                            {device.current && (
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20">{t('this_device')}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {device.current ? t('active_now') : `${t('last_access')}: ${device.lastActive}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!device.current && (
                                                    <button
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
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
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-brand-500" /> {t('notification_prefs')}
                                </h2>

                                <div className="space-y-6">
                                    {[
                                        { key: 'news', title: t('news_title'), desc: t('news_desc') },
                                        { key: 'premium', title: t('premium_title'), desc: t('premium_desc') },
                                        { key: 'financial', title: t('financial_alerts_title'), desc: t('financial_alerts_desc') },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-start justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors">
                                            <div className="pr-4">
                                                <p className="font-medium text-gray-900 dark:text-white mb-1">{item.title}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={emailAlerts[item.key]}
                                                    onChange={() => handleNotificationToggle(item.key)}
                                                />
                                                <div className="w-11 h-6 bg-gray-300 dark:bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500" />
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">{t('important')}</h4>
                                        <p className="text-xs text-blue-600 dark:text-blue-300/80">{t('security_notice')}</p>
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
