import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, Mail, Shield, Lock, FileText } from 'lucide-react';

interface GlobalFooterProps {
    onNavigate?: (view: string) => void;
}

export const GlobalFooter: React.FC<GlobalFooterProps> = ({ onNavigate }) => {
    const handleNavigate = (view: string) => {
        if (onNavigate) {
            onNavigate(view);
        } else {
            window.dispatchEvent(new CustomEvent('lux-navigate', { detail: view }));
        }
    };

    return (
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
                        <li className="hover:text-lumen-gold cursor-pointer transition-colors"><Link to="/tutorial">Tutorial</Link></li>
                        <li className="hover:text-lumen-gold cursor-pointer transition-colors"><Link to="/api-docs">API Docs</Link></li>
                        <li className="hover:text-lumen-gold cursor-pointer transition-colors"><Link to="/pricing">Pricing</Link></li>
                        <li className="hover:text-lumen-gold cursor-pointer transition-colors"><Link to="/faq">FAQ</Link></li>
                        <li className="hover:text-lumen-gold cursor-pointer transition-colors"><Link to="/contact">Contact</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-6">Legal</h4>
                    <ul className="space-y-3 text-xs text-gray-500 uppercase tracking-widest">
                        <li className="hover:text-lumen-gold cursor-pointer transition-colors"><Link to="/terms">Terms</Link></li>
                        <li className="hover:text-lumen-gold cursor-pointer transition-colors"><Link to="/privacy">Privacy</Link></li>
                        <li className="hover:text-lumen-gold cursor-pointer transition-colors"><Link to="/cookies">Cookies</Link></li>
                        <li className="hover:text-lumen-gold cursor-pointer transition-colors"><Link to="/legal">Legal Notice</Link></li>
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
    );
};
