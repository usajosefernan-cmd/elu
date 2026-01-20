import React, { useState } from 'react';
import { LuxButton } from './LuxButton';
import {
    Sparkles, Sliders, Crown, Check, X,
    Maximize, Palette, Home, User, Sun, ScanLine
} from 'lucide-react';
import { LuxMixer } from '../types';

interface MasterConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (settings: { mode: 'SIMPLE' | 'ADVANCED' | 'PRO'; mixer: LuxMixer; format: string }) => void;
    currentMixer?: LuxMixer;
}

type UserMode = 'SIMPLE' | 'ADVANCED' | 'PRO';

const MODE_CONFIG: Record<UserMode, { label: string; icon: any; title: string; subtitle: string; description: string; color: string; gradient: string }> = {
    'SIMPLE': {
        label: 'Simple',
        icon: Sparkles,
        title: 'AI MAGIC',
        subtitle: 'Auto-Mastering',
        description: 'Mejoras automáticas de piel y detalle. Formato WebP ligero.',
        color: 'text-emerald-400',
        gradient: 'from-emerald-600/20 to-emerald-900/20'
    },
    'ADVANCED': {
        label: 'Avanzado',
        icon: Sliders,
        title: 'CREATIVE',
        subtitle: 'Ajuste Fino',
        description: 'Edita los parámetros de producción antes del render final.',
        color: 'text-prismatic-blue',
        gradient: 'from-blue-600/20 to-blue-900/20'
    },
    'PRO': {
        label: 'Pro',
        icon: Crown,
        title: 'VFX RIG',
        subtitle: 'Formatos RAW',
        description: 'Salida de alta fidelidad (TIFF, EXR) para post-producción.',
        color: 'text-lumen-gold',
        gradient: 'from-amber-600/20 to-amber-900/20'
    },
};

const EngineSlider = ({ label, val, setter, icon: Icon, color, steps }: any) => (
    <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
            <label className={`text-[10px] font-bold uppercase flex items-center gap-2 ${color}`}>
                <Icon className="w-3 h-3" /> {label}
            </label>
            <span className="text-[10px] font-mono text-white bg-white/10 px-2 rounded opacity-70">{val}/10</span>
        </div>
        <input
            type="range" min="0" max="10" step="1"
            value={val}
            onChange={(e) => setter(Number(e.target.value))}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
        {steps && (
            <div className="flex justify-between text-[8px] text-gray-600 font-mono mt-1 px-1">
                <span>{steps[0]}</span>
                <span>{steps[1]}</span>
                <span>{steps[2]}</span>
            </div>
        )}
    </div>
);

export const MasterConfigModal: React.FC<MasterConfigModalProps> = ({ isOpen, onClose, onConfirm, currentMixer }) => {
    const [userMode, setUserMode] = useState<UserMode>('SIMPLE');
    const [outputFormat, setOutputFormat] = useState('WEBP');

    // State local para editar el mixer en modo avanzado
    const [localMixer, setLocalMixer] = useState<LuxMixer>(currentMixer || {
        stylism: 5, atrezzo: 5, skin_bio: 5, lighting: 5, restoration: 5, upScaler: 1, outputFormat: 'WEBP'
    });

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({
            mode: userMode,
            mixer: localMixer,
            format: outputFormat
        });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

            <div className="pointer-events-auto w-full max-w-md bg-void-black border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 relative animate-[slideUp_0.3s]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-1 flex items-center gap-2">
                    <Maximize className="w-5 h-5 text-lumen-gold" /> Master Config
                </h2>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-6">Configuración de Render 4K</p>


                {/* === MODE SELECTOR === */}
                <div className="flex flex-col gap-3 mb-6">
                    {(Object.keys(MODE_CONFIG) as UserMode[]).map((mode) => {
                        const cfg = MODE_CONFIG[mode];
                        const Icon = cfg.icon;
                        const isSelected = userMode === mode;
                        return (
                            <button
                                key={mode}
                                onClick={() => setUserMode(mode)}
                                className={`relative overflow-hidden group p-3 rounded-xl border transition-all duration-300 flex items-center gap-4 text-left ${isSelected
                                    ? `bg-gradient-to-r ${cfg.gradient} border-${cfg.color.split('-')[1]}-500/50`
                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform ${isSelected ? 'bg-white/10 scale-105' : 'bg-black/40'}`}>
                                    <Icon className={`w-4 h-4 ${isSelected ? cfg.color : 'text-gray-600'}`} />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                        {cfg.title}
                                    </h4>
                                    <p className={`text-[9px] mt-0.5 leading-tight ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {cfg.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* === ADVANCED MIXER === */}
                {userMode === 'ADVANCED' && (
                    <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/5 text-left animate-[fadeIn_0.3s]">
                        <EngineSlider
                            label="Estilismo" val={localMixer.stylism}
                            setter={(v: number) => setLocalMixer(p => ({ ...p, stylism: v }))}
                            icon={Palette} color="text-pink-400" steps={['Real', 'Art', 'Vogue']}
                        />
                        <EngineSlider
                            label="Iluminación" val={localMixer.lighting}
                            setter={(v: number) => setLocalMixer(p => ({ ...p, lighting: v }))}
                            icon={Sun} color="text-orange-400" steps={['Flat', 'Studio', 'Drama']}
                        />
                    </div>
                )}

                {/* === PRO FORMATS === */}
                {/* === PRO FORMATS (AHORA VARIABLES DE CONTROL) === */}
                {userMode === 'PRO' && (
                    <div className="mb-6 animate-[fadeIn_0.3s] space-y-6">
                        {/* Group 1: Art Direction */}
                        <div className="bg-white/5 p-4 rounded-lg border border-lumen-gold/20">
                            <h5 className="text-[10px] font-black uppercase text-lumen-gold mb-3 tracking-widest flex items-center gap-2">
                                <Palette className="w-3 h-3" /> Art Direction
                            </h5>
                            <EngineSlider
                                label="Stylism (Vibe)" val={localMixer.stylism}
                                setter={(v: number) => setLocalMixer(p => ({ ...p, stylism: v }))}
                                icon={Sparkles} color="text-pink-400" steps={['Real', 'Art', 'Vogue']}
                            />
                            <EngineSlider
                                label="Lighting (Drama)" val={localMixer.lighting}
                                setter={(v: number) => setLocalMixer(p => ({ ...p, lighting: v }))}
                                icon={Sun} color="text-orange-400" steps={['Flat', 'Studio', 'Cinematic']}
                            />
                        </div>

                        {/* Group 2: Technical Restoration */}
                        <div className="bg-white/5 p-4 rounded-lg border border-blue-500/20">
                            <h5 className="text-[10px] font-black uppercase text-blue-400 mb-3 tracking-widest flex items-center gap-2">
                                <ScanLine className="w-3 h-3" /> Technical Dept
                            </h5>
                            <EngineSlider
                                label="Atrezzo (Scene)" val={localMixer.atrezzo}
                                setter={(v: number) => setLocalMixer(p => ({ ...p, atrezzo: v }))}
                                icon={Home} color="text-emerald-400" steps={['Messy', 'Clean', 'New']}
                            />
                            <EngineSlider
                                label="Skin / Bio" val={localMixer.skin_bio}
                                setter={(v: number) => setLocalMixer(p => ({ ...p, skin_bio: v }))}
                                icon={User} color="text-rose-400" steps={['Natural', 'Retouch', 'Perfect']}
                            />
                            <EngineSlider
                                label="Forensic Restoration" val={localMixer.restoration}
                                setter={(v: number) => setLocalMixer(p => ({ ...p, restoration: v }))}
                                icon={ScanLine} color="text-cyan-400" steps={['Off', 'Denoise', 'Reconstruct']}
                            />
                        </div>
                    </div>
                )}

                <LuxButton onClick={handleConfirm} className="w-full py-4 text-sm shadow-lumen-glow rounded-xl">
                    <Check className="w-4 h-4 mr-2" /> GENERAR MASTER 4K
                </LuxButton>
            </div>
        </div>
    );
};
