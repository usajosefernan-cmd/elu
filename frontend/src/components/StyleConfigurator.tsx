
import React, { useState } from 'react';
import { LuxButton } from './LuxButton';
import { LuxConfig, LuxMixer } from '../types';
import { RotateCcw, Info, Sliders, Check, Maximize, Palette, Sun, ScanLine, User, Home } from 'lucide-react';

interface StyleConfiguratorProps {
    onConfirm: (config: LuxConfig) => void;
    onCancel: () => void;
}

const DEFAULT_MIXER: LuxMixer = {
    stylism: 5,
    atrezzo: 5,
    skin_bio: 5,
    lighting: 5,
    restoration: 5,
    upScaler: 0
};

const DEFAULT_CONFIG: LuxConfig = {
    userPrompt: '',
    correction_enabled: true,
    mixer: DEFAULT_MIXER
};

export const StyleConfigurator: React.FC<StyleConfiguratorProps> = ({ onConfirm, onCancel }) => {
    const [config, setConfig] = useState<LuxConfig>(DEFAULT_CONFIG);

    const handleMixerChange = (key: keyof LuxMixer, value: number) => {
        setConfig(prev => ({
            ...prev,
            mixer: { ...prev.mixer!, [key]: value }
        }));
    };

    const LuxSlider = ({ label, value, onChange, minLabel, maxLabel, icon: Icon, stepsDescription }: any) => (
        <div className="group relative mb-6">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-3 h-3 text-lumen-gold" />}
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{label}</label>
                </div>
                <span className="text-[10px] font-mono text-lumen-gold bg-lumen-gold/10 px-2 py-0.5 rounded border border-lumen-gold/20">{value}/10</span>
            </div>

            <div className="relative h-6 flex items-center">
                <input
                    type="range" min="0" max="10" step="1"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lumen-gold"
                />
            </div>

            <div className="flex justify-between text-[8px] text-gray-600 font-mono uppercase mt-1">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>

            {stepsDescription && (
                <div className="mt-2 text-[9px] text-lumen-gold/80 italic text-center bg-white/5 py-1 rounded border border-white/5 min-h-[26px] flex items-center justify-center">
                    {value <= 2 && stepsDescription[0]}
                    {value > 2 && value <= 6 && stepsDescription[1]}
                    {value > 6 && stepsDescription[2]}
                </div>
            )}
        </div>
    );

    const ResolutionSelector = ({ value, onChange }: any) => (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <Maximize className="w-3 h-3 text-prismatic-blue" />
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">UpScaler (Output)</label>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {['2K', '4K', '8K', '16K'].map((res, idx) => (
                    <button
                        key={res}
                        onClick={() => onChange(idx)}
                        className={`py-2 text-[10px] font-bold uppercase rounded border transition-all ${value === idx
                                ? 'bg-prismatic-blue text-black border-prismatic-blue shadow-[0_0_10px_rgba(74,158,255,0.4)]'
                                : 'bg-black border-white/10 text-gray-500 hover:border-white/30'
                            }`}
                    >
                        {res}
                    </button>
                ))}
            </div>
            <p className="mt-2 text-[8px] text-gray-500 text-center font-mono">
                {value === 3 ? "WARNING: 16K Generates massive files. Detail hallucination active." : "Higher resolution increases processing time."}
            </p>
        </div>
    );

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col h-[85vh] bg-[#0A0A0F] border border-white/10 rounded-sm shadow-2xl overflow-hidden relative animate-[fadeIn_0.3s]">

            {/* HEADER */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-lumen-gold/10 rounded-full flex items-center justify-center border border-lumen-gold/20">
                        <Sliders className="w-4 h-4 text-lumen-gold" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-sm uppercase tracking-widest">Master Console</h2>
                        <p className="text-[9px] text-gray-500 font-mono">4-Channel Engine</p>
                    </div>
                </div>
                <button onClick={() => setConfig(DEFAULT_CONFIG)} className="flex items-center gap-1 text-[9px] uppercase font-bold text-gray-500 hover:text-white px-3 py-1.5 border border-white/5 rounded transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
            </div>

            {/* MAIN BODY */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                {/* 1. USER INTENT */}
                <div>
                    <label className="text-[10px] uppercase text-gray-500 font-bold block mb-2 tracking-widest">Directiva Manual (Opcional)</label>
                    <input
                        type="text"
                        value={config.userPrompt}
                        onChange={(e) => setConfig({ ...config, userPrompt: e.target.value })}
                        placeholder="Ej: 'Haz que el neón sea rosa'..."
                        className="w-full bg-black/50 border border-white/10 rounded-sm p-3 text-white text-xs focus:border-lumen-gold focus:outline-none transition-colors placeholder-gray-700"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {/* CHANNEL 1: ATREZZO (Scenography) */}
                    <LuxSlider
                        label="Atrezzo (Scenography)"
                        icon={Home}
                        value={config.mixer?.atrezzo}
                        onChange={(v: number) => handleMixerChange('atrezzo', v)}
                        minLabel="Messy" maxLabel="Pristine"
                        stepsDescription={["Sin Corrección (Original)", "Limpieza de Estudio", "Reconstrucción Geométrica Total"]}
                    />

                    {/* CHANNEL 2: BIO (Skin) */}
                    <LuxSlider
                        label="Biology (Skin/Bio)"
                        icon={User}
                        value={config.mixer?.skin_bio}
                        onChange={(v: number) => handleMixerChange('skin_bio', v)}
                        minLabel="Natural" maxLabel="Perfect"
                        stepsDescription={["Natural", "Retoque Editorial", "Perfección Biológica"]}
                    />

                    {/* CHANNEL 3: STYLISM (Vibe) */}
                    <LuxSlider
                        label="Stylism (Vibe)"
                        icon={Palette}
                        value={config.mixer?.stylism}
                        onChange={(v: number) => handleMixerChange('stylism', v)}
                        minLabel="Subtle" maxLabel="Extreme"
                        stepsDescription={["Sutil", "Balanceado", "Inmersión Total"]}
                    />

                    {/* CHANNEL 4: LIGHTING */}
                    <LuxSlider
                        label="Lighting (Drama)"
                        icon={Sun}
                        value={config.mixer?.lighting}
                        onChange={(v: number) => handleMixerChange('lighting', v)}
                        minLabel="Natural" maxLabel="Cinematic"
                        stepsDescription={["Luz Disponible", "Técnica Fotográfica", "Humo Volumétrico / Neones"]}
                    />

                    {/* CHANNEL 5: UPSCALER */}
                    <div className="md:col-span-2">
                        <ResolutionSelector
                            value={config.mixer?.upScaler}
                            onChange={(v: number) => handleMixerChange('upScaler', v)}
                        />
                    </div>
                </div>

            </div>

            {/* FOOTER */}
            <div className="h-20 border-t border-white/10 flex items-center justify-center px-6 bg-void-black shrink-0 z-10 gap-4">
                <button onClick={onCancel} className="text-gray-500 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors">
                    Cancel
                </button>
                <LuxButton onClick={() => onConfirm(config)} className="px-8 shadow-lumen-glow">
                    <Check className="w-4 h-4 mr-2" />
                    ENGAGE CORE
                </LuxButton>
            </div>

        </div>
    );
};
