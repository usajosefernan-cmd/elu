
import React from 'react';
import { motion } from 'framer-motion';
import { ComparisonSlider } from './ComparisonSlider';
import { LucideIcon, ArrowRight } from 'lucide-react';

export interface ShowcaseExample {
    title: string;
    sub: string;
    icon: LucideIcon;
    before: string;
    after: string;
    focusPoint?: { x: number; y: number };
    layout?: 'full' | 'split' | 'detail' | 'hero';
    effectLabel?: string;
    detailCrop?: { x: number; y: number; zoom: number };
}

interface ProductShowcaseProps {
    title: string;
    subtitle: string;
    examples: ShowcaseExample[];
    onBack: () => void;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ title, subtitle, examples, onBack }) => {

    return (
        <div className="w-full bg-[#050505] text-[#FAFAFA] font-sans selection:bg-[#D4AF37] selection:text-black scrollbar-hide overflow-y-auto animate-[fadeIn_0.3s]">

            {/* HERO - Simplified */}
            <header className="relative py-16 md:py-24 flex flex-col justify-center items-center border-b border-white/5 px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-4 leading-none uppercase">
                        {title.split(' ')[0]}<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">{title.split(' ').slice(1).join(' ')}</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-gray-500 text-sm md:text-base">
                        {subtitle}
                    </p>
                </motion.div>

                <div className="absolute bottom-6 left-0 right-0 flex justify-center animate-bounce">
                    <ArrowRight className="w-5 h-5 rotate-90 text-white/20" />
                </div>
            </header>

            {/* SHOWCASE GRID - UNIFIED GOLD DESIGN */}
            <div className="space-y-0">
                {examples.map((ex, i) => {
                    const layout = ex.layout || 'full';

                    // UNIFIED THEME - Solo dorado
                    const theme = {
                        accent: '#D4AF37',
                        bg: 'bg-black',
                        headerBg: 'bg-black/90',
                        borderColor: 'border-[#D4AF37]/30',
                        textColor: 'text-[#D4AF37]',
                    };

                    // LAYOUT: DETAIL - Imagen + zoom de detalle
                    if (layout === 'detail') {
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className={`${theme.bg} p-4 md:p-8`}
                            >
                                {/* HEADER - Minimal */}
                                <div className="flex items-center gap-3 mb-4">
                                    <ex.icon className={`w-5 h-5 ${theme.textColor}`} />
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">{ex.title}</h3>
                                    <span className="text-xs text-gray-600">— {ex.sub}</span>
                                </div>

                                {/* GRID: Main + Detail */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div className="md:col-span-2 relative h-[40vh] md:h-[65vh] overflow-hidden border border-white/5">
                                        <ComparisonSlider
                                            originalImage={ex.before}
                                            processedImage={ex.after}
                                            style={{ height: '100%', width: '100%' }}
                                            objectFit="cover"
                                            focusPoint={ex.focusPoint || { x: 50, y: 35 }}
                                        />
                                    </div>

                                    {/* DETAIL ZOOM */}
                                    <div className="relative h-[40vh] md:h-[65vh] overflow-hidden border border-white/5">
                                        <img
                                            src={ex.after}
                                            alt="Detail"
                                            className="w-full h-full object-cover"
                                            style={{
                                                objectPosition: `${ex.detailCrop?.x || 30}% ${ex.detailCrop?.y || 30}%`,
                                                transform: `scale(${ex.detailCrop?.zoom || 2})`
                                            }}
                                        />
                                        <div className={`absolute bottom-2 left-2 text-[9px] font-mono ${theme.textColor} bg-black/80 px-2 py-1`}>
                                            {ex.detailCrop?.zoom || 2}x ZOOM
                                        </div>
                                    </div>
                                </div>
                                <div className={`h-px w-full mt-8 bg-gradient-to-r from-[#D4AF37]/20 to-transparent`} />
                            </motion.div>
                        );
                    }

                    // LAYOUT: SPLIT - Dos imágenes lado a lado
                    if (layout === 'split') {
                        const nextEx = examples[i + 1];
                        if (!nextEx) return null;

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className={theme.bg}
                            >
                                {/* HEADER */}
                                <div className={`flex items-center justify-between px-4 md:px-8 py-3 ${theme.headerBg} border-b border-white/5`}>
                                    <div className="flex items-center gap-3">
                                        <ex.icon className={`w-4 h-4 ${theme.textColor}`} />
                                        <span className="text-sm font-bold text-white uppercase">{ex.title}</span>
                                        <span className="text-gray-600 text-xs">vs</span>
                                        <span className="text-sm font-bold text-white uppercase">{nextEx.title}</span>
                                    </div>
                                </div>

                                {/* SPLIT VIEW */}
                                <div className="grid grid-cols-2 gap-px h-[50vh] md:h-[75vh] bg-white/5">
                                    <div className="relative overflow-hidden bg-black">
                                        <ComparisonSlider
                                            originalImage={ex.before}
                                            processedImage={ex.after}
                                            style={{ height: '100%', width: '100%' }}
                                            objectFit="cover"
                                            focusPoint={ex.focusPoint || { x: 50, y: 35 }}
                                        />
                                        <div className={`absolute bottom-3 left-3 text-[10px] font-bold uppercase ${theme.textColor} bg-black/80 px-2 py-1`}>
                                            {ex.title}
                                        </div>
                                    </div>
                                    <div className="relative overflow-hidden bg-black">
                                        <ComparisonSlider
                                            originalImage={nextEx.before}
                                            processedImage={nextEx.after}
                                            style={{ height: '100%', width: '100%' }}
                                            objectFit="cover"
                                            focusPoint={nextEx.focusPoint || { x: 50, y: 35 }}
                                        />
                                        <div className={`absolute bottom-3 left-3 text-[10px] font-bold uppercase ${theme.textColor} bg-black/80 px-2 py-1`}>
                                            {nextEx.title}
                                        </div>
                                    </div>
                                </div>
                                <div className={`h-px w-full bg-gradient-to-r from-[#D4AF37]/20 to-transparent`} />
                            </motion.div>
                        );
                    }

                    // LAYOUT: FULL (Default) - Imagen completa, diseño limpio
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, margin: "-5%" }}
                            transition={{ duration: 0.5 }}
                            className={`group ${theme.bg}`}
                        >
                            {/* HEADER BAR - Minimal */}
                            <div className={`flex items-center justify-between px-4 md:px-8 py-3 ${theme.headerBg} border-b border-white/5`}>
                                <div className="flex items-center gap-3">
                                    <ex.icon className={`w-4 h-4 ${theme.textColor}`} />
                                    <span className="text-sm font-bold uppercase tracking-wider text-white">{ex.title}</span>
                                    <span className="text-xs text-gray-600 hidden md:inline">— {ex.sub}</span>
                                </div>
                            </div>

                            {/* IMAGE CONTAINER */}
                            <div className="relative w-full h-[55vh] md:h-[80vh] overflow-hidden">
                                <ComparisonSlider
                                    originalImage={ex.before}
                                    processedImage={ex.after}
                                    style={{ height: '100%', width: '100%' }}
                                    objectFit="cover"
                                    focusPoint={ex.focusPoint || { x: 50, y: 35 }}
                                />

                                {/* CORNER DECORATORS - Subtle */}
                                <div className={`absolute top-2 left-2 w-4 h-4 border-t border-l pointer-events-none ${theme.borderColor}`} />
                                <div className={`absolute top-2 right-2 w-4 h-4 border-t border-r pointer-events-none ${theme.borderColor}`} />
                                <div className={`absolute bottom-2 left-2 w-4 h-4 border-b border-l pointer-events-none ${theme.borderColor}`} />
                                <div className={`absolute bottom-2 right-2 w-4 h-4 border-b border-r pointer-events-none ${theme.borderColor}`} />

                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                            </div>

                            {/* SECTION DIVIDER */}
                            <div className={`h-px w-full bg-gradient-to-r from-[#D4AF37]/20 to-transparent`} />
                        </motion.div>
                    );
                })}
            </div>


        </div>
    );
};
