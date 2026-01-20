import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Configuración de idiomas con banderas (emoji flags)
const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

interface LanguageSelectorProps {
    variant?: 'desktop' | 'mobile';
    className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    variant = 'desktop',
    className = ''
}) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLang = LANGUAGES.find(l => i18n.language.startsWith(l.code)) || LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setIsOpen(false);
    };

    if (variant === 'mobile') {
        return (
            <div className={`flex flex-wrap gap-2 ${className}`}>
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all ${currentLang.code === lang.code
                                ? 'bg-lumen-gold text-black'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <span className="text-base">{lang.flag}</span>
                        <span className="uppercase">{lang.code}</span>
                    </button>
                ))}
            </div>
        );
    }

    // Desktop: Dropdown discreto
    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-full transition-all"
            >
                <span className="text-base">{currentLang.flag}</span>
                <span className="text-[10px] font-bold text-gray-300 uppercase">{currentLang.code}</span>
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[120] animate-in fade-in slide-in-from-top-2 duration-200">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${currentLang.code === lang.code
                                    ? 'bg-lumen-gold/10 text-lumen-gold'
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="text-xs font-bold">{lang.name}</span>
                            {currentLang.code === lang.code && (
                                <span className="ml-auto text-[8px] text-lumen-gold font-bold uppercase tracking-widest">Active</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
