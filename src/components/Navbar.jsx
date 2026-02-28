import { tw } from '@/lib/theme';
// Removing unused theme import
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { useState } from 'react';

const FLAGS = {
    pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', cn: '🇨🇳', hi: '🇮🇳',
};
const LANG_NAMES = {
    pt: 'Português', en: 'English', es: 'Español', fr: 'Français', cn: '中文', hi: 'हिंदी',
};

export default function Navbar() {
    const { isDemo } = useAuth();
    const { language, changeLanguage } = useLanguage();
    const [langMenuOpen, setLangMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-30 border-b border-white/5 h-14 flex items-center justify-end px-4 sm:px-6"
            style={{ background: 'rgba(10,12,20,0.8)', backdropFilter: 'blur(16px)' }}
        >
            <div className="flex items-center gap-3">
                {isDemo && (
                    <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-medium">
                        Demo
                    </span>
                )}

                {/* Language Selector */}
                <div className="relative">
                    <button
                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/40/5 transition-all flex items-center gap-1"
                        title="Mudar Idioma"
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-xs">{FLAGS[language]}</span>
                    </button>

                    {langMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
                            <div className="absolute right-0 mt-2 w-40 ${tw.card} p-1 z-20 shadow-xl border border-white/10">
                                {Object.keys(FLAGS).map((code) => (
                                    <button
                                        key={code}
                                        onClick={() => { changeLanguage(code); setLangMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-800/40 transition-all ${language === code ? 'text-purple-400 bg-purple-500/10' : 'text-gray-300'
                                            }`}
                                    >
                                        <span>{FLAGS[code]}</span>
                                        <span>{LANG_NAMES[code]}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
