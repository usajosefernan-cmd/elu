import React from 'react';
import { ArrowLeft, Mail, Twitter, Github, Shield, Lock, FileText } from 'lucide-react';

interface InfoLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onBack: () => void;
    currentView: string;
    actions?: React.ReactNode;
}

export const InfoLayout: React.FC<InfoLayoutProps> = ({
    title,
    subtitle,
    children,
    onBack,
    currentView,
    actions
}) => {
    return (
        <div className="min-h-screen bg-void-black text-chalk-white font-sans selection:bg-lumen-gold/30 selection:text-lumen-gold flex flex-col">
            {/* STICKY HEADER */}
            <header className="fixed top-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-xl border-b border-white/5 h-16 md:h-20 flex items-center justify-between px-6 md:px-12">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 group text-gray-500 hover:text-white transition-all"
                    >
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden md:block">Volver</span>
                    </button>

                    <div className="w-px h-8 bg-white/10 hidden md:block" />

                    <div className="flex flex-col">
                        <h1 className="text-sm md:text-lg font-black text-white tracking-tighter uppercase leading-none">
                            LUX<span className="text-lumen-gold">SCALER</span>
                        </h1>
                        <span className="text-[9px] md:text-[10px] text-lumen-gold font-bold tracking-[0.3em] uppercase mt-1">
                            {title}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {actions}
                    <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">API Status: Online</span>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 pt-32 pb-24 px-6 relative z-10 w-full max-w-5xl mx-auto">
                {subtitle && (
                    <div className="mb-16">
                        <h2 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">{title}</h2>
                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl font-light leading-relaxed">{subtitle}</p>
                    </div>
                )}

                <div className="relative">
                    {children}
                </div>
            </main>

            {/* SHARED PREMIUM FOOTER */}
            <footer className="border-t border-white/5 bg-[#050505] pt-20 pb-12 px-8 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-lumen-gold/20 to-transparent" />

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-xl font-black text-white mb-4 tracking-tighter">
                            LUX<span className="text-lumen-gold">SCALER</span>
                        </h3>
                        <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
                            Professional optics simulation and resolution enhancement. Engineered for
                            the highest fidelity in photographic restoration and cinema-grade upscaling.
                        </p>
                        <div className="flex gap-4">
                            <button className="p-2 border border-white/10 rounded-full hover:bg-white/5 transition-colors text-gray-400">
                                <Twitter className="w-4 h-4" />
                            </button>
                            <button className="p-2 border border-white/10 rounded-full hover:bg-white/5 transition-colors text-gray-400">
                                <Github className="w-4 h-4" />
                            </button>
                            <button className="p-2 border border-white/10 rounded-full hover:bg-white/5 transition-colors text-gray-400">
                                <Mail className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-6">Resources</h4>
                        <ul className="space-y-3 text-xs text-gray-500 uppercase tracking-widest">
                            <li className="hover:text-lumen-gold cursor-pointer transition-colors" onClick={() => window.dispatchEvent(new CustomEvent('lux-navigate', { detail: 'FAQ' }))}>FAQ</li>
                            <li className="hover:text-lumen-gold cursor-pointer transition-colors" onClick={() => window.dispatchEvent(new CustomEvent('lux-navigate', { detail: 'API_DOCS' }))}>API Docs</li>
                            <li className="hover:text-lumen-gold cursor-pointer transition-colors" onClick={() => window.dispatchEvent(new CustomEvent('lux-navigate', { detail: 'CONTACT' }))}>Contact</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-6">Legal</h4>
                        <ul className="space-y-3 text-xs text-gray-500 uppercase tracking-widest">
                            <li className="hover:text-lumen-gold cursor-pointer transition-colors" onClick={() => window.dispatchEvent(new CustomEvent('lux-navigate', { detail: 'LEGAL' }))}>Terms</li>
                            <li className="hover:text-lumen-gold cursor-pointer transition-colors" onClick={() => window.dispatchEvent(new CustomEvent('lux-navigate', { detail: 'LEGAL' }))}>Privacy</li>
                            <li className="hover:text-lumen-gold cursor-pointer transition-colors" onClick={() => window.dispatchEvent(new CustomEvent('lux-navigate', { detail: 'LEGAL' }))}>Cookies</li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em]">
                        &copy; 2026 LUXSCALER. ALL RIGHTS RESERVED.
                    </p>
                    <div className="flex items-center gap-6 text-[9px] text-gray-600 uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-1.5"><Shield className="w-2.5 h-2.5" /> Forensic Integrity</span>
                        <span className="flex items-center gap-1.5"><Lock className="w-2.5 h-2.5" /> Privacy First</span>
                        <span className="flex items-center gap-1.5"><FileText className="w-2.5 h-2.5" /> EU Compliance</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
