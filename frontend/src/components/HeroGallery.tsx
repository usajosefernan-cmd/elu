
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { ComparisonSlider } from './ComparisonSlider';
import {
    ArrowRight, Fingerprint, Palette, Sun, Scan, Zap,
    Camera, Code, Layers, Smartphone, Monitor, Settings,
    Aperture
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeroGalleryProps {
    onCtaClick?: () => void;
    onBatchClick?: () => void;  // NEW: Batch upload
    onMotorClick?: (motorId: string) => void;
    previewThemes?: Record<string, any>;
}

// Base URL for images
const HOME_BASE = "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing";

// Only showcase pairs using the girl (homeXX)
const SHOWCASE_PAIRS = [
    { before: `${HOME_BASE}/home01.webp`, after: `${HOME_BASE}/home02.webp` },
    { before: `${HOME_BASE}/home02.webp`, after: `${HOME_BASE}/home03.webp` },
    { before: `${HOME_BASE}/home03.webp`, after: `${HOME_BASE}/home04.webp` },
    { before: `${HOME_BASE}/home04.webp`, after: `${HOME_BASE}/home05.webp` },
    { before: `${HOME_BASE}/home01.webp`, after: `${HOME_BASE}/home05.webp` },
    { before: `${HOME_BASE}/home02.webp`, after: `${HOME_BASE}/home04.webp` },
    { before: `${HOME_BASE}/home03.webp`, after: `${HOME_BASE}/home05.webp` },
];

// Define interface for Motors
interface MotorConfig {
    id: string;
    name: string;
    tagline: string;
    desc: string;
    before: string;
    after: string;
    bgTone: string;
    accentColor: string;
    icon: any;
    isZoom?: boolean;
}

// Merge DB themes with defaults
const mergeThemes = (defaults: MotorConfig[], dbThemes: Record<string, any>) => {
    return defaults.map(motor => {
        const dbData = dbThemes[motor.id];
        if (!dbData) return motor;
        return { ...motor, ...dbData };
    });
};

// ========== INTRO ANIMATION COMPONENT ==========
const SpectacularIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [currentPair, setCurrentPair] = useState(0);
    const [showBefore, setShowBefore] = useState(true);
    const [introPhase, setIntroPhase] = useState<'showcase' | 'logo' | 'done'>('showcase');

    useEffect(() => {
        if (introPhase !== 'showcase') return;

        // Ultra-rapid toggle (100ms)
        const toggleInterval = setInterval(() => {
            setShowBefore(prev => !prev);
        }, 100);

        // Change pair every 350ms (very fast)
        const pairInterval = setInterval(() => {
            setCurrentPair(prev => {
                if (prev >= SHOWCASE_PAIRS.length - 1) {
                    setIntroPhase('logo');
                    return prev;
                }
                return prev + 1;
            });
        }, 350);

        return () => {
            clearInterval(toggleInterval);
            clearInterval(pairInterval);
        };
    }, [introPhase]);

    useEffect(() => {
        if (introPhase === 'logo') {
            const timer = setTimeout(() => {
                setIntroPhase('done');
                onComplete();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [introPhase, onComplete]);

    if (introPhase === 'done') return null;

    const pair = SHOWCASE_PAIRS[currentPair];

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {introPhase === 'showcase' && (
                <>
                    {/* Full Screen Alternating - No opacity, instant switch */}
                    <div className="absolute inset-0">
                        {/* Before */}
                        <motion.div
                            className="absolute inset-0"
                            animate={{ opacity: showBefore ? 1 : 0 }}
                            transition={{ duration: 0.02 }}
                        >
                            <img src={pair.before} className="w-full h-full object-cover" alt="" />
                            <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 text-3xl md:text-6xl font-black text-white/90">
                                BEFORE
                            </div>
                        </motion.div>

                        {/* After */}
                        <motion.div
                            className="absolute inset-0"
                            animate={{ opacity: !showBefore ? 1 : 0 }}
                            transition={{ duration: 0.02 }}
                        >
                            <img src={pair.after} className="w-full h-full object-cover" alt="" />
                            <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 text-3xl md:text-6xl font-black text-[#D4AF37]">
                                AFTER
                            </div>
                        </motion.div>
                    </div>

                    {/* Progress */}
                    <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
                        {SHOWCASE_PAIRS.map((_, i) => (
                            <div
                                key={i}
                                className={`w-3 md:w-6 h-1 rounded-full transition-colors duration-100 ${i <= currentPair ? 'bg-[#D4AF37]' : 'bg-white/30'}`}
                            />
                        ))}
                    </div>
                </>
            )}

            {introPhase === 'logo' && (
                <motion.div
                    className="relative z-10 text-center px-4"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.div
                        className="absolute inset-0 -m-20 bg-[#D4AF37]/10 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.h1
                        className="text-6xl md:text-[10rem] font-black tracking-tighter text-white"
                        initial={{ y: 30 }}
                        animate={{ y: 0 }}
                    >
                        LUX<span className="text-[#D4AF37]">SCALER</span>
                    </motion.h1>
                    <motion.p
                        className="text-sm md:text-xl text-white/60 tracking-[0.2em] uppercase mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Professional Photo Enhancement
                    </motion.p>
                </motion.div>
            )}
        </motion.div>
    );
};

// ========== FEATURE CAROUSEL COMPONENT (The "Header") ==========
const FeatureCarousel: React.FC<{ onCtaClick?: () => void }> = ({ onCtaClick }) => {
    const { t } = useTranslation();
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        // Slide 1: App Experience (Camera Interface with UI Mockups)
        {
            id: 'app',
            content: (() => {
                const [appScreen, setAppScreen] = useState(0);

                useEffect(() => {
                    const interval = setInterval(() => {
                        setAppScreen(prev => (prev + 1) % 3);
                    }, 3500);
                    return () => clearInterval(interval);
                }, []);

                // Different UI screens - App Store style mockups
                const renderScreen = (index: number) => {
                    switch (index) {
                        case 0: // Camera Viewfinder with sample photo
                            return (
                                <div className="absolute inset-0 flex flex-col bg-black">
                                    {/* Status Bar */}
                                    <div className="flex justify-between items-center px-4 pt-6 pb-2">
                                        <span className="text-[9px] text-white/50 font-mono">9:41</span>
                                        <div className="flex gap-1">
                                            <div className="w-4 h-2 bg-white/30 rounded-sm" />
                                            <div className="w-4 h-2 bg-white/30 rounded-sm" />
                                            <div className="w-6 h-3 bg-green-500/80 rounded-sm" />
                                        </div>
                                    </div>
                                    {/* Viewfinder with photo */}
                                    <div className="flex-1 relative mx-3 rounded-xl overflow-hidden border border-white/10">
                                        <img src={`${HOME_BASE}/home02.webp`} className="absolute inset-0 w-full h-full object-cover" />
                                        {/* Grid overlay */}
                                        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '33.33% 33.33%' }} />
                                        {/* Focus indicator */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-[#D4AF37] rounded-sm" />
                                        {/* RAW badge */}
                                        <div className="absolute top-3 right-3 bg-[#D4AF37]/90 px-2 py-0.5 rounded text-[8px] font-bold text-black">RAW</div>
                                    </div>
                                    {/* Controls */}
                                    <div className="flex items-center justify-between px-6 py-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-white/60" />
                                        </div>
                                        <div className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center">
                                            <div className="w-14 h-14 bg-white rounded-full" />
                                        </div>
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20">
                                            <img src={`${HOME_BASE}/home03.webp`} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                </div>
                            );
                        case 1: // 6 Variations Grid
                            return (
                                <div className="absolute inset-0 flex flex-col bg-black p-3">
                                    <div className="flex justify-between items-center pt-4 mb-3">
                                        <span className="text-[10px] text-white/50">← Back</span>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Select Style</span>
                                        <Zap className="w-4 h-4 text-[#D4AF37]" />
                                    </div>
                                    {/* 6 Variations Grid */}
                                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                                        {[2, 3, 4, 5, 2, 3].map((n, i) => (
                                            <div key={i} className={`relative rounded-lg overflow-hidden ${i === 0 ? 'ring-2 ring-[#D4AF37]' : ''}`}>
                                                <img src={`${HOME_BASE}/home0${n}.webp`} className="w-full h-full object-cover" />
                                                {i === 0 && <div className="absolute top-1 right-1 bg-[#D4AF37] w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-black font-bold">✓</div>}
                                                <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[7px] text-white font-mono">V{i + 1}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Action */}
                                    <div className="mt-3 bg-[#D4AF37] text-black text-[10px] font-bold uppercase py-3 rounded-lg text-center">
                                        Generate 4K Master (50 TKN)
                                    </div>
                                </div>
                            );
                        case 2: // Gallery with enhanced photos
                            return (
                                <div className="absolute inset-0 flex flex-col bg-black p-3">
                                    <div className="flex justify-between items-center pt-4 mb-3">
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">Library</span>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] text-[#D4AF37] font-mono">12 Enhanced</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-3 gap-1 overflow-hidden">
                                        {[2, 3, 4, 5, 2, 3, 4, 5, 2].map((n, i) => (
                                            <div key={i} className="relative aspect-square rounded-sm overflow-hidden">
                                                <img src={`${HOME_BASE}/home0${n}.webp`} className="w-full h-full object-cover" />
                                                {i < 4 && <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-[#D4AF37] rounded-full flex items-center justify-center text-[6px] text-black font-bold">★</div>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <div className="flex-1 bg-white/5 py-2 rounded-lg text-center text-[9px] text-white/50 border border-white/10">All</div>
                                        <div className="flex-1 bg-[#D4AF37]/10 py-2 rounded-lg text-center text-[9px] text-[#D4AF37] border border-[#D4AF37]/30">Enhanced</div>
                                        <div className="flex-1 bg-white/5 py-2 rounded-lg text-center text-[9px] text-white/50 border border-white/10">RAW</div>
                                    </div>
                                </div>
                            );
                        default:
                            return null;
                    }
                };

                return (
                    <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-6xl mx-auto">
                        <div className="md:w-1/2 text-left">
                            <div className="inline-flex items-center gap-2 text-[#D4AF37] border border-[#D4AF37]/30 rounded-full px-3 py-1 mb-6">
                                <Smartphone className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest font-bold">{t('landing.hero.badge', 'Official App')}</span>
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black leading-none mb-6">
                                {t('landing.hero.title_part1', 'Studio in')} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-yellow-200">{t('landing.hero.title_part2', 'Your Pocket')}</span>
                            </h2>
                            <p className="text-gray-400 text-lg mb-8 max-w-md">
                                {t('landing.hero.subtitle', 'The complete LuxScaler engine on iOS and Android. RAW capture. Professional editing interface. Full pipeline control from your device.')}
                            </p>
                            <div className="flex gap-4">
                                <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg flex items-center gap-3 transition-colors border border-white/10">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" className="h-8" alt="App Store" />
                                </button>
                                <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg flex items-center gap-3 transition-colors border border-white/10">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-8" alt="Google Play" />
                                </button>
                            </div>
                        </div>
                        <div className="md:w-1/2 relative">
                            {/* PHONE MOCKUP WITH UI SCREENS */}
                            <div className="relative h-[500px] w-full max-w-[280px] mx-auto bg-[#0a0a0a] rounded-[3rem] border-4 border-gray-700 overflow-hidden shadow-2xl">
                                {/* Notch */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20" />

                                {/* Screen Content */}
                                <div className="absolute inset-0 overflow-hidden">
                                    {renderScreen(appScreen)}
                                </div>
                            </div>

                            {/* Screen Indicators */}
                            <div className="flex justify-center gap-2 mt-6">
                                {['Viewfinder', 'Tokens', 'Gallery'].map((label, i) => (
                                    <div
                                        key={i}
                                        className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-wider transition-all ${i === appScreen ? 'bg-[#D4AF37] text-black font-bold' : 'bg-white/5 text-white/40'}`}
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()
        },
        // Slide 2: API & Defect Configurator
        {
            id: 'api',
            content: (
                <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-6xl mx-auto">
                    <div className="md:w-1/2 text-left order-2 md:order-1">
                        {/* DEFECT CONFIGURATOR PANEL */}
                        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-5 shadow-2xl">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                <span className="text-xs font-bold text-white uppercase tracking-widest">Defect Correction</span>
                                <span className="text-[10px] text-blue-400 font-mono">API CONFIG</span>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: 'Motion Blur', value: 8, enabled: true },
                                    { name: 'Missed Focus', value: 6, enabled: true },
                                    { name: 'Lens Distortion', value: 4, enabled: true },
                                    { name: 'Chromatic Aberration', value: 7, enabled: true },
                                    { name: 'Sensor Noise', value: 5, enabled: true },
                                    { name: 'JPEG Artifacts', value: 0, enabled: false },
                                    { name: 'Vignetting', value: 3, enabled: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded border ${item.enabled ? 'bg-blue-500 border-blue-500' : 'border-gray-600'} flex items-center justify-center`}>
                                            {item.enabled && <span className="text-[8px] text-white">✓</span>}
                                        </div>
                                        <span className={`text-[10px] flex-1 ${item.enabled ? 'text-white' : 'text-gray-600'}`}>{item.name}</span>
                                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.value * 10}%` }} />
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-500 w-6 text-right">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-[9px] text-gray-500">
                                <span>Enabled: 6/7</span>
                                <span className="text-blue-400">Apply via API</span>
                            </div>
                        </div>
                    </div>
                    <div className="md:w-1/2 text-left order-1 md:order-2">
                        <div className="inline-flex items-center gap-2 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1 mb-6">
                            <Code className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest font-bold">{t('landing.api.badge', 'Developer API')}</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black leading-none mb-6">
                            {t('landing.api.title_part1', 'Programmable')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">{t('landing.api.title_part2', 'Defect Control')}</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-md">
                            {t('landing.api.subtitle', 'Every photo defect is a parameter. Motion blur, missed focus, noise, distortion. Enable, disable, or dial intensity from 0-10. Full programmatic control.')}
                        </p>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('lux-navigate', { detail: 'API_DOCS' }))}
                            className="text-white border-b border-[#D4AF37] hover:text-[#D4AF37] transition-colors pb-1"
                        >
                            {t('landing.api.link', 'View Documentation >')}
                        </button>
                    </div>
                </div>
            )
        },
        // Slide 3: Total Control Configurator
        {
            id: 'control',
            content: (
                <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-6xl mx-auto">
                    <div className="md:w-1/2 text-left">
                        <div className="inline-flex items-center gap-2 text-[#D4AF37] border border-[#D4AF37]/30 rounded-full px-3 py-1 mb-6">
                            <Settings className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest font-bold">Total Control</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black leading-none mb-6">
                            From Subtle <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-white">to Cinematic</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-md">
                            One unified engine. Dial the intensity from a five-second touch-up
                            to a Hollywood-grade pipeline outputting at 16K cinema resolution.
                            You decide how far to push.
                        </p>
                        <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-gray-600">
                            <span className="px-3 py-1 border border-white/10 rounded">Social</span>
                            <span className="px-3 py-1 border border-white/10 rounded">E-Commerce</span>
                            <span className="px-3 py-1 border border-white/10 rounded">Print</span>
                            <span className="px-3 py-1 border border-[#D4AF37]/50 text-[#D4AF37] rounded">Feature Film</span>
                        </div>
                    </div>
                    <div className="md:w-1/2">
                        {/* INTERACTIVE CONFIGURATOR MOCKUP */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                <span className="text-xs font-bold text-white uppercase tracking-widest">LuxMixer</span>
                                <span className="text-[10px] text-[#D4AF37] font-mono">PRO MODE</span>
                            </div>

                            {/* Sliders */}
                            <div className="space-y-6">
                                {[
                                    { name: 'PHOTOSCALER', value: 7, color: '#D4AF37', desc: 'Optics Simulation' },
                                    { name: 'STYLESCALER', value: 5, color: '#ec4899', desc: 'Color Science' },
                                    { name: 'LIGHTSCALER', value: 8, color: '#f97316', desc: 'Volumetric Light' },
                                    { name: 'UPSCALER', value: 4, color: '#8b5cf6', desc: 'Resolution' },
                                ].map((slider, i) => (
                                    <div key={slider.name} className="group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{slider.name}</span>
                                            <span className="text-xs font-mono text-white bg-white/10 px-2 py-0.5 rounded">{slider.value}/10</span>
                                        </div>
                                        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${slider.value * 10}%`,
                                                    background: `linear-gradient(90deg, ${slider.color}40, ${slider.color})`
                                                }}
                                            />
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white bg-black shadow-lg transition-all duration-1000"
                                                style={{ left: `calc(${slider.value * 10}% - 8px)` }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-gray-600 mt-1">{slider.desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Output Preview */}
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase">Estimated Output</p>
                                        <p className="text-xl font-black text-white">4K <span className="text-[#D4AF37]">Master</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 uppercase">Processing</p>
                                        <p className="text-lg font-mono text-gray-300">~45s</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        // Slide 4: Professional Grade Specs
        {
            id: 'pro',
            content: (
                <div className="flex flex-col md:flex-row items-start gap-12 w-full max-w-6xl mx-auto px-4">
                    <div className="md:w-1/2 text-left pt-8">
                        <div className="inline-flex items-center gap-2 text-purple-400 border border-purple-500/30 rounded-full px-3 py-1 mb-6 bg-purple-500/5">
                            <Aperture className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest font-bold">Professional Grade</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black leading-tight mb-6">
                            32-BIT <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">RAW Pipeline</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-md leading-relaxed">
                            Architecture designed for archival and VFX workflows.
                            Floating-point precision preserves dynamic range through every transformation.
                            Direct integration with industry-standard editing software.
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-500">
                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded">EXR / TIFF-32 Output</span>
                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded">No Gamma Loss</span>
                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded">ICC Profile Support</span>
                        </div>
                    </div>
                    <div className="md:w-1/2 w-full space-y-8">
                        {/* LIGHTROOM PLUGIN MOCKUP (Enhanced) */}
                        <div className="bg-[#181818] border border-white/10 rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-b-4 border-b-purple-500/50">
                            {/* Plugin Header */}
                            <div className="bg-[#2a2a2a] px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">Lr</div>
                                    <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">LuxScaler Connect</span>
                                </div>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/30" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/30" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                </div>
                            </div>

                            {/* Plugin Body */}
                            <div className="p-5 space-y-6">
                                {/* Mode Selector */}
                                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                                    <button className="bg-purple-600 text-white text-[9px] font-bold py-1.5 rounded shadow-sm">RESTORATION</button>
                                    <button className="text-gray-500 text-[9px] font-bold py-1.5">UPSCALE</button>
                                    <button className="text-gray-500 text-[9px] font-bold py-1.5">CREX</button>
                                </div>

                                {/* Precision Sliders */}
                                <div className="space-y-4">
                                    {[
                                        { n: 'Optics Recovery', v: 85, c: 'purple-400' },
                                        { n: 'Dynamic Range', v: 92, c: 'blue-400' },
                                        { n: 'Texture Synthesis', v: 64, c: 'emerald-400' }
                                    ].map((s) => (
                                        <div key={s.n} className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] uppercase tracking-widest text-gray-400">
                                                <span>{s.n}</span>
                                                <span className="text-white font-mono">{s.v}%</span>
                                            </div>
                                            <div className="h-1 bg-black/60 rounded-full relative">
                                                <div className={`absolute left-0 top-0 h-full bg-${s.c} rounded-full`} style={{ width: `${s.v}%` }} />
                                                <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg" style={{ left: `calc(${s.v}% - 4px)` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Main Button */}
                                <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase py-3 rounded-lg shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                                    <Zap className="w-3 h-3" /> Execute Pipeline
                                </button>
                            </div>
                        </div>

                        {/* Thumbnail Grid Overlaying an Image */}
                        <div className="relative rounded-xl overflow-hidden aspect-video border border-white/10 group">
                            <img src={`${HOME_BASE}/home05.webp`} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-5000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                    <p className="text-[10px] text-gray-400">Source: Sony A7R IV</p>
                                    <p className="text-xs font-bold text-white uppercase italic">Full Frame Simulation</p>
                                </div>
                                <div className="bg-purple-500 px-3 py-1.5 rounded text-[10px] font-bold text-white shadow-xl">STUDIO OUTPUT</div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        // Slide 5: 4-Engine Pipeline
        {
            id: 'pipeline',
            content: (
                <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-6xl mx-auto">
                    <div className="md:w-1/2 text-left">
                        <div className="inline-flex items-center gap-2 text-green-400 border border-green-500/30 rounded-full px-3 py-1 mb-6">
                            <Layers className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest font-bold">The Pipeline</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black leading-none mb-6">
                            4 Engines <br />
                            <span className="text-white">One Result</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-md">
                            A sequential processing chain that mimics a professional studio workflow.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-gray-300"><Fingerprint className="text-[#D4AF37]" /> <span className="font-bold">{t('landing.motors.photo.name', 'PhotoScaler')}</span>: {t('landing.motors.photo.short_desc', 'Optics Simulation')}</li>
                            <li className="flex items-center gap-3 text-gray-300"><Palette className="text-[#D4AF37]" /> <span className="font-bold">{t('landing.motors.style.name', 'StyleScaler')}</span>: {t('landing.motors.style.short_desc', 'Color Grading')}</li>
                            <li className="flex items-center gap-3 text-gray-300"><Sun className="text-[#D4AF37]" /> <span className="font-bold">{t('landing.motors.light.name', 'LightScaler')}</span>: {t('landing.motors.light.short_desc', 'Volumetric Lighting')}</li>
                            <li className="flex items-center gap-3 text-gray-300"><Scan className="text-[#D4AF37]" /> <span className="font-bold">{t('landing.motors.up.name', 'UpScaler')}</span>: {t('landing.motors.up.short_desc', 'Print Resolution')}</li>
                        </ul>
                    </div>
                    <div className="md:w-1/2 grid grid-cols-2 gap-4">
                        <img src={`${HOME_BASE}/home02.webp`} className="rounded-2xl opacity-60 hover:opacity-100 transition-opacity duration-500" />
                        <img src={`${HOME_BASE}/home03.webp`} className="rounded-2xl opacity-60 hover:opacity-100 transition-opacity duration-500" />
                        <img src={`${HOME_BASE}/home04.webp`} className="rounded-2xl opacity-60 hover:opacity-100 transition-opacity duration-500" />
                        <img src={`${HOME_BASE}/home05.webp`} className="rounded-2xl opacity-80 hover:opacity-100 transition-opacity duration-500 border border-[#D4AF37]" />
                    </div>
                </div>
            )
        },
        // Slide 6: CTA
        {
            id: 'cta',
            content: (
                <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto">
                    <h2 className="text-5xl md:text-8xl font-black leading-none mb-8 tracking-tighter">
                        {t('landing.cta.title_part1', 'READY TO')} <span className="text-[#D4AF37]">{t('landing.cta.title_part2', 'SCALE')}</span>?
                    </h2>
                    <p className="text-xl text-gray-400 mb-12 max-w-lg">
                        {t('landing.cta.subtitle', 'Join thousands of photographers using LuxScaler to save their shots and enhance their portfolio.')}
                    </p>
                    <button
                        onClick={onCtaClick}
                        className="bg-[#D4AF37] text-black px-12 py-6 text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                    >
                        {t('landing.cta.button', 'GET 60 FREE TOKENS')}
                    </button>
                    <div className="mt-8 flex gap-8 text-gray-600 text-sm uppercase tracking-widest">
                        <span>{t('landing.cta.features.tokens', '60 Free Tokens')}</span>
                        <span>•</span>
                        <span>{t('landing.cta.features.pay', 'Pay Per Use')}</span>
                        <span>•</span>
                        <span>{t('landing.cta.features.subs', 'No Subscriptions')}</span>
                    </div>
                </div>
            )
        }
    ];

    const [isPaused, setIsPaused] = useState(false);

    // Auto-advance (pauses on interaction)
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length, isPaused]);

    const goToSlide = (index: number) => {
        setIsPaused(true);
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        setIsPaused(true);
        setCurrentSlide(prev => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setIsPaused(true);
        setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    };

    return (
        <div
            className="relative w-full min-h-screen bg-black flex items-start justify-center overflow-hidden px-4 pt-32 pb-20"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    key={currentSlide}
                    className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-[#D4AF37]/5 rounded-full blur-[120px]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                />
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all"
            >
                <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all"
            >
                <ArrowRight className="w-5 h-5" />
            </button>

            {/* Slides */}
            <div className="relative z-10 w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="w-full flex items-center justify-center"
                    >
                        {slides[currentSlide].content}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goToSlide(i)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-[#D4AF37] w-8' : 'bg-gray-700 hover:bg-gray-500'}`}
                    />
                ))}
            </div>
        </div>
    );
};


// ========== MOTOR SECTION COMPONENT ==========
const MotorSection: React.FC<{
    motor: any;
    index: number;
    onMotorClick?: (id: string) => void;
}> = ({ motor, index, onMotorClick }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, margin: "-20%" });
    const isEven = index % 2 === 0;
    const Icon = motor.icon;

    return (
        <motion.section
            id={`motor-${motor.id.toLowerCase()}`}
            ref={ref}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0.3 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col lg:flex-row items-center justify-center gap-6 md:gap-8 px-4 md:px-16 py-16 md:py-24"
            style={{ backgroundColor: motor.bgTone }}
        >
            {/* Content */}
            <motion.div
                className={`lg:w-1/3 text-center lg:text-left ${isEven ? 'lg:order-1' : 'lg:order-2'}`}
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <div className="flex items-center gap-3 mb-4 justify-center lg:justify-start">
                    <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.3em] font-bold">Engine {index + 1}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">{motor.name}</h2>
                <p className="text-lg md:text-xl text-white/60 italic mb-4">{motor.tagline}</p>
                <p className="text-xs md:text-sm text-gray-400 leading-relaxed mb-6">{motor.desc}</p>
                <button
                    onClick={() => onMotorClick?.(motor.id)}
                    className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-white transition-colors text-sm uppercase tracking-widest"
                >
                    Learn More <ArrowRight className="w-4 h-4" />
                </button>
            </motion.div>

            {/* Image - Zoomed ComparisonSlider for Upscaler */}
            <motion.div
                className={`lg:w-2/3 w-full h-[40vh] md:h-[70vh] relative ${isEven ? 'lg:order-2' : 'lg:order-1'}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                <div className="w-full h-full relative border border-white/10 overflow-hidden">
                    {motor.isZoom ? (
                        // Upscaler: Zoomed ComparisonSlider focused on eye (100% Pixel View)
                        <div className="w-full h-full overflow-hidden">
                            <ComparisonSlider
                                originalImage={motor.before}
                                processedImage={motor.after}
                                objectFit="none"
                            />
                        </div>
                    ) : (
                        <ComparisonSlider
                            originalImage={motor.before}
                            processedImage={motor.after}
                            objectFit="contain" // Explicit default
                        />
                    )}
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-4 md:w-6 h-4 md:h-6 border-t border-l border-[#D4AF37] opacity-50" />
                <div className="absolute bottom-0 right-0 w-4 md:w-6 h-4 md:h-6 border-b border-r border-[#D4AF37] opacity-50" />

                {motor.isZoom && (
                    <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 text-[10px] text-white/50 uppercase tracking-widest flex items-center gap-2 bg-black/50 px-2 py-1 rounded">
                        <Scan className="w-3 h-3" /> Eye Detail (100% View)
                    </div>
                )}
            </motion.div>
        </motion.section>
    );
};


// ========== MAIN HERO GALLERY COMPONENT ==========
export const HeroGallery: React.FC<HeroGalleryProps> = ({ onCtaClick, onBatchClick, onMotorClick, previewThemes }) => {
    const { t } = useTranslation();

    // Default Motors Configuration (Moved inside to use t)
    const DEFAULT_MOTORS = [
        {
            id: 'photo',
            name: t('landing.motors.photo.name', 'PHOTOSCALER™'),
            tagline: t('landing.motors.photo.tagline', 'The Virtual Camera'),
            desc: t('landing.motors.photo.desc', "Simulates high-end optics. Replaces mobile distortion with portrait telephoto physics."),
            before: `${HOME_BASE}/home01.webp`,
            after: `${HOME_BASE}/home02.webp`,
            bgTone: '#080808',
            accentColor: '#D4AF37',
            icon: Fingerprint
        },
        {
            id: 'style',
            name: t('landing.motors.style.name', 'STYLESCALER'),
            tagline: t('landing.motors.style.tagline', 'The Color Lab'),
            desc: t('landing.motors.style.desc', "Cinema-grade color science. Simulates film stocks and unifies atmosphere."),
            before: `${HOME_BASE}/home02.webp`,
            after: `${HOME_BASE}/home03.webp`,
            bgTone: '#050505',
            accentColor: '#D4AF37',
            icon: Palette
        },
        {
            id: 'light',
            name: t('landing.motors.light.name', 'LIGHTSCALER'),
            tagline: t('landing.motors.light.tagline', 'The Lighting Rig'),
            desc: t('landing.motors.light.desc', "Simulates studio equipment. Adds Key, Fill, and Rim lights for professional volume."),
            before: `${HOME_BASE}/home03.webp`,
            after: `${HOME_BASE}/home04.webp`,
            bgTone: '#080808',
            accentColor: '#D4AF37',
            icon: Sun
        },
        {
            id: 'up',
            name: t('landing.motors.up.name', 'UPSCALER'),
            tagline: t('landing.motors.up.tagline', 'The Print Master'),
            desc: t('landing.motors.up.desc', "Resolution enhancement. Injects plausible texture consistent with 150MP sensors."),
            before: `${HOME_BASE}/home051.webp`,
            after: `${HOME_BASE}/home052.webp`,
            bgTone: '#050505',
            accentColor: '#D4AF37',
            icon: Scan,
            isZoom: true
        }
    ];

    const [showIntro, setShowIntro] = useState(() => {
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('lux_intro_seen');
        }
        return true;
    });

    const handleIntroComplete = () => {
        setShowIntro(false);
        localStorage.setItem('lux_intro_seen', 'true');
    };

    const [motors, setMotors] = useState(DEFAULT_MOTORS);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    useEffect(() => {
        if (previewThemes) {
            setMotors(mergeThemes(DEFAULT_MOTORS, previewThemes));
        }
    }, [previewThemes]);

    return (
        <>
            <AnimatePresence>
                {showIntro && <SpectacularIntro onComplete={handleIntroComplete} />}
            </AnimatePresence>

            <div className="w-full h-full bg-black text-white font-sans overflow-y-auto overflow-x-hidden">

                {/* NEW 5-SLIDE CAROUSEL HERO */}
                <FeatureCarousel onCtaClick={onCtaClick} />

                {/* SCROLL INDICATOR */}
                <div className="text-center py-6 md:py-8 bg-black">
                    <div className="text-[10px] text-gray-600 uppercase tracking-[0.3em] mb-2">Scroll to explore engines</div>
                    <div className="w-px h-6 md:h-8 bg-gradient-to-b from-[#D4AF37] to-transparent mx-auto animate-pulse" />
                </div>

                {/* 4 MOTORS */}
                {motors.map((motor, i) => (
                    <MotorSection key={motor.id} motor={motor} index={i} onMotorClick={onMotorClick} />
                ))}

                {/* FINAL COMBINED - SPECTACULAR REVEAL */}
                <section className="min-h-screen bg-black flex flex-col justify-center relative overflow-hidden py-24">
                    {/* Background Glow */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[#D4AF37]/5 rounded-full blur-[150px]" />
                    </div>

                    <div className="relative z-10 px-4 mb-16 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1 }}
                            className="mb-8"
                        >
                            <span className="text-[#D4AF37] uppercase tracking-[0.5em] text-sm md:text-lg font-bold">{t('landing.reveal.definitive', 'The Definitive')}</span>
                            <h2 className="text-6xl md:text-[8rem] leading-[0.9] font-black text-white tracking-tighter mt-4 mb-2">
                                LUX<span className="text-[#D4AF37]">SCALER</span>
                            </h2>
                            <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-8 text-xl md:text-3xl text-gray-400 font-light tracking-widest uppercase">
                                <span>{t('landing.reveal.editor', 'Editor')}</span>
                                <span className="hidden md:inline text-[#D4AF37]">•</span>
                                <span>{t('landing.reveal.photographer', 'Photographer')}</span>
                                <span className="hidden md:inline text-[#D4AF37]">•</span>
                                <span>{t('landing.reveal.producer', 'Producer')}</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* MASSIVE FINAL RESULT */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="w-full h-[70vh] md:h-[90vh] relative border-y border-[#D4AF37]/30"
                    >
                        <ComparisonSlider
                            originalImage={`${HOME_BASE}/home01.webp`}
                            processedImage={`${HOME_BASE}/home05.webp`}
                        />

                        {/* Overlay Labels */}
                        <div className="absolute bottom-8 left-8 text-white/50 text-xs md:text-sm uppercase tracking-widest pointer-events-none">
                            {t('landing.reveal.input', 'Original Input')}
                        </div>
                        <div className="absolute bottom-8 right-8 text-[#D4AF37] text-xs md:text-sm uppercase tracking-widest pointer-events-none font-bold">
                            {t('landing.reveal.master', 'LuxScaler Master')}
                        </div>
                    </motion.div>
                </section>



                {/* Progress Bar */}
                <motion.div
                    className="fixed top-0 left-0 right-0 h-1 bg-[#D4AF37] origin-left z-40"
                    style={{ scaleX }}
                />
            </div>
        </>
    );
};

export default HeroGallery;
