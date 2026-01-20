import React from 'react';
import { PhotoScalerConfig, StyleScalerConfig, LightScalerConfig, LightArchetype } from '../types';
import {
    Aperture, User, Sparkles, Sun, Maximize, Droplet,
    Layers, Zap, ScanFace, Scissors, Eraser,
    PaintBucket, Wand2, Ruler, Focus, Film, Palette
} from 'lucide-react';

type EngineType = 'PHOTO' | 'STYLE' | 'LIGHT';

interface ProEngineControlsProps {
    engine: EngineType;
    config: any;
    onChange: (key: string, value: any) => void;
}

const ProSlider = ({ label, value, onChange, icon: Icon, color, min = 0, max = 10, step = 1 }: any) => (
    <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
            <label className={`text-[9px] font-bold uppercase flex items-center gap-2 ${color}`}>
                {Icon && <Icon className="w-3 h-3" />} {label}
            </label>
            <span className="text-[9px] font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">{value}</span>
        </div>
        <div className="relative h-4 flex items-center">
            <input
                type="range" min={min} max={max} step={step}
                value={value || 0}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:bg-lumen-gold transition-all"
            />
        </div>
    </div>
);

const ProToggle = ({ label, value, onChange, icon: Icon, color }: any) => (
    <button
        onClick={() => onChange(!value)}
        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all mb-2 ${value ? 'bg-white/10 border-lumen-gold/50' : 'bg-black/20 border-white/5 hover:bg-white/5'
            }`}
    >
        <div className="flex items-center gap-2">
            {Icon && <Icon className={`w-3 h-3 ${value ? color : 'text-gray-500'}`} />}
            <span className={`text-[9px] font-bold uppercase ${value ? 'text-white' : 'text-gray-500'}`}>{label}</span>
        </div>
        <div className={`w-6 h-3 rounded-full relative transition-colors ${value ? 'bg-lumen-gold' : 'bg-gray-800'}`}>
            <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
        </div>
    </button>
);

const ProSelect = ({ label, value, options, onChange, icon: Icon, color }: any) => (
    <div className="mb-4">
        <label className={`text-[9px] font-bold uppercase flex items-center gap-2 mb-2 ${color}`}>
            {Icon && <Icon className="w-3 h-3" />} {label}
        </label>
        <div className="grid grid-cols-2 gap-1">
            {options.map((opt: string) => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`py-2 px-1 text-[8px] font-bold uppercase rounded border transition-all truncate ${value === opt
                            ? 'bg-lumen-gold text-black border-lumen-gold'
                            : 'bg-black border-white/10 text-gray-500 hover:border-white/30'
                        }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

export const ProEngineControls: React.FC<ProEngineControlsProps> = ({ engine, config, onChange }) => {

    // === PHOTO SCALER (Technical & Optical) ===
    if (engine === 'PHOTO') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-gradient-to-br from-blue-900/10 to-transparent p-4 rounded-lg border border-blue-500/20 mb-4">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                        <Aperture className="w-4 h-4" /> Optical Stack
                    </h4>
                    <ProSlider label="Analogue Noise Reduction" value={config.noise_reduction} onChange={(v: any) => onChange('noise_reduction', v)} icon={Eraser} color="text-blue-300" />
                    <ProSlider label="Optical Definition (Focus)" value={config.definition} onChange={(v: any) => onChange('definition', v)} icon={Focus} color="text-blue-300" />
                    <ProSlider label="Lens Distortion Fix" value={config.lens_fix} onChange={(v: any) => onChange('lens_fix', v)} icon={Maximize} color="text-blue-300" />
                    <ProSlider label="Tone Recovery (Ansel)" value={config.tone_recovery} onChange={(v: any) => onChange('tone_recovery', v)} icon={Sun} color="text-blue-300" />
                    <ProSlider label="Depth of Field Bias" value={config.depth_of_field} onChange={(v: any) => onChange('depth_of_field', v)} icon={Layers} color="text-blue-300" />
                    <ProSlider label="Film Grain Simulation" value={config.film_grain} onChange={(v: any) => onChange('film_grain', v)} icon={Film} color="text-blue-300" />
                    <ProSlider label="Color Science (Matrix)" value={config.color_science} onChange={(v: any) => onChange('color_science', v)} icon={Palette} color="text-blue-300" />
                </div>
            </div>
        );
    }

    // === STYLE SCALER (Creative & Semantic) ===
    if (engine === 'STYLE') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-gradient-to-br from-pink-900/10 to-transparent p-4 rounded-lg border border-pink-500/20 mb-4">
                    <h4 className="text-[10px] font-black text-pink-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                        <Wand2 className="w-4 h-4" /> Semantic Sculpting
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <ProSlider label="Skin Physics (SSS)" value={config.skin_physics} onChange={(v: any) => onChange('skin_physics', v)} icon={User} color="text-pink-300" />
                            <ProSlider label="Eye & Hair Reconstruct" value={config.eye_hair_reconstruct} onChange={(v: any) => onChange('eye_hair_reconstruct', v)} icon={ScanFace} color="text-pink-300" />
                            <ProSlider label="Fabric Topology" value={config.fabric_topology} onChange={(v: any) => onChange('fabric_topology', v)} icon={Ruler} color="text-pink-300" />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <ProToggle label="Virtual Ironing" value={config.virtual_ironing} onChange={(v: any) => onChange('virtual_ironing', v)} icon={Scissors} color="text-pink-300" />
                        </div>
                        <div className="col-span-2 space-y-2 pt-2 border-t border-white/5">
                            <ProSlider label="Intelligent Declutter" value={config.declutter} onChange={(v: any) => onChange('declutter', v)} icon={Eraser} color="text-purple-300" />
                            <ProSlider label="Material Transmutation" value={config.material_transmutation} onChange={(v: any) => onChange('material_transmutation', v)} icon={Sparkles} color="text-purple-300" />
                            <ProSlider label="Reality Injection (CGI)" value={config.reality_inject} onChange={(v: any) => onChange('reality_inject', v)} icon={Zap} color="text-purple-300" />
                            <ProSlider label="Historical Damage Fill" value={config.damage_fill} onChange={(v: any) => onChange('damage_fill', v)} icon={PaintBucket} color="text-red-300" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // === LIGHT SCALER (Volumetric & Relighting) ===
    if (engine === 'LIGHT') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-gradient-to-br from-amber-900/10 to-transparent p-4 rounded-lg border border-amber-500/20 mb-4">
                    <h4 className="text-[10px] font-black text-amber-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                        <Sun className="w-4 h-4" /> Volumetric Studio
                    </h4>

                    <ProSelect
                        label="Light Archetype (Relighting)"
                        value={config.light_archetype}
                        onChange={(v: any) => onChange('light_archetype', v)}
                        options={['NATURAL', 'BUTTERFLY', 'REMBRANDT', 'SPLIT', 'LOOP', 'PARAMOUNT', 'BROAD', 'SHORT', 'RIM', 'FLAT']}
                        icon={Sun}
                        color="text-amber-300"
                    />

                    <div className="space-y-4 mt-6">
                        <ProSlider label="Source Intensity" value={config.intensity} onChange={(v: any) => onChange('intensity', v)} icon={Zap} color="text-amber-300" />
                        <ProSlider label="Volumetric Fog density" value={config.volumetrics} onChange={(v: any) => onChange('volumetrics', v)} icon={Droplet} color="text-amber-300" />
                        <ProSlider label="Relighting Strength" value={config.relighting_strength} onChange={(v: any) => onChange('relighting_strength', v)} icon={Layers} color="text-amber-300" />
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
