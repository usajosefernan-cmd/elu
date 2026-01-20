
import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const accepted = localStorage.getItem('luxscaler_cookies_accepted');
        if (!accepted) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('luxscaler_cookies_accepted', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[300] animate-[slideUp_0.5s_ease-out]">
            <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-6 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shrink-0">
                        <Cookie className="w-5 h-5 text-lumen-gold" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-2">
                            Cookies & Privacidad
                        </h4>
                        <p className="text-[10px] text-white/50 leading-relaxed mb-4">
                            Utilizamos cookies esenciales para el funcionamiento del laboratorio y analíticas anónimas para mejorar la precisión de nuestros motores de IA.
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAccept}
                                className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-6 py-2.5 rounded-sm hover:bg-lumen-gold transition-colors"
                            >
                                Aceptar Todo
                            </button>
                            <button
                                onClick={handleAccept}
                                className="text-white/30 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-colors"
                            >
                                Solo Esenciales
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setIsVisible(false)} className="text-white/20 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
