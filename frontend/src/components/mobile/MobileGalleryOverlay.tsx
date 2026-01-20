import React from 'react';
import { X, Sparkles, Zap, Lock, ScanLine } from 'lucide-react';

interface PhotoItem {
    id: string;
    url: string;
    isEnhanced: boolean; // True = LuxScaler Enhanced, False = Standard
    date: string;
}

// MOCK DATA for Simulation
const MOCK_GALLERY: PhotoItem[] = [
    { id: '1', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop', isEnhanced: true, date: 'Just now' },
    { id: '2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop', isEnhanced: true, date: 'Today' },
    { id: '3', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop', isEnhanced: false, date: 'Yesterday' },
    { id: '4', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop', isEnhanced: false, date: 'Yesterday' },
    { id: '5', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop', isEnhanced: false, date: 'Last Week' },
    { id: '6', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop', isEnhanced: true, date: 'Last Week' },
    { id: '7', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=600&auto=format&fit=crop', isEnhanced: false, date: 'Last Month' },
    { id: '8', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop', isEnhanced: false, date: 'Last Month' },
    { id: '9', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop', isEnhanced: false, date: 'Last Month' },
];

interface MobileGalleryOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileGalleryOverlay: React.FC<MobileGalleryOverlayProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-[slideUp_0.3s_ease-out]">
            {/* HEADER */}
            <div className="flex justify-between items-center p-4 pt-12 bg-gradient-to-b from-black/90 to-transparent">
                <h2 className="text-white font-bold text-lg tracking-wider flex items-center gap-2">
                    <ScanLine className="w-5 h-5 text-lumen-gold" />
                    GALLERY
                </h2>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full active:scale-95 transition-transform">
                    <X className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* GRID */}
            <div className="flex-1 overflow-y-auto px-1 pb-24">
                <div className="grid grid-cols-3 gap-1">
                    {MOCK_GALLERY.map((photo) => (
                        <div
                            key={photo.id}
                            className={`relative aspect-square overflow-hidden group active:scale-95 transition-transform cursor-pointer
                                ${photo.isEnhanced ? 'border-2 border-[#D4AF37]' : 'grayscale brightness-50 contrast-125'}
                            `}
                        >
                            <img src={photo.url} alt="Gallery item" className="w-full h-full object-cover" />

                            {/* BADGES */}
                            {photo.isEnhanced ? (
                                <div className="absolute top-1 right-1 bg-[#D4AF37] text-black text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1">
                                    <Sparkles className="w-2 h-2" /> LUX
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                    <div className="flex flex-col items-center gap-1">
                                        <Zap className="w-6 h-6 text-[#D4AF37] animate-pulse" />
                                        <span className="text-[8px] text-white font-bold uppercase">Mejorar</span>
                                    </div>
                                </div>
                            )}

                            {!photo.isEnhanced && (
                                <div className="absolute top-1 left-1">
                                    <Lock className="w-3 h-3 text-white/50" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* FOOTER UPSELL PROMPT */}
                <div className="mt-8 px-6 text-center">
                    <p className="text-white/40 text-xs mb-2">You have 128 photos ready to enhance.</p>
                    <button className="w-full bg-[#D4AF37]/10 border border-[#D4AF37] text-[#D4AF37] py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors">
                        Enhance All (Bulk)
                    </button>
                </div>
            </div>
        </div>
    );
};
