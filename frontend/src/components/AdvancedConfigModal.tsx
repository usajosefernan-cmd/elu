
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuxConfig, LuxControlMode, SemanticAnalysis } from '../types';
import { Settings2, Zap, Sliders, Crown, Check, X, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { LuxButton } from './LuxButton';

interface AdvancedConfigModalProps {
    isVisible: boolean;
    imageUrl: string;
    analysis: SemanticAnalysis | null;
    onConfirm: (config: LuxConfig) => void;
    onCancel: () => void;
}

const MODES: { id: LuxControlMode; label: string; icon: React.FC<any>; desc: string }[] = [
    { id: 'AUTO', label: 'AUTO', icon: Zap, desc: 'IA decide todo. Forensic + Art + Light mix.' },
    { id: 'USER', label: 'USER', icon: Sliders, desc: 'Ajustes básicos de mejora.' },
    { id: 'ADVANCED', label: 'ADVANCED', icon: Settings2, desc: 'Control manual del LuxMixer.' },
    { id: 'PRO', label: 'PRO', icon: Crown, desc: 'Control total de cada variación. (Deep Params)' },
];

export const AdvancedConfigModal: React.FC<AdvancedConfigModalProps> = ({ isVisible, imageUrl, analysis, onConfirm, onCancel }) => {
    const [mode, setMode] = useState<LuxControlMode>('AUTO');
    const [batchSize, setBatchSize] = useState(6);

    // Config State
    const [style, setStyle] = useState('uni_enhance_v2'); // Default
    const [mixer, setMixer] = useState({
        stylism: 5,
        atrezzo: 5,
        skin_bio: 5,
        lighting: 5,
        upScaler: 0
    });

    // PRO VARS CONFIG (Placeholder for deep config)
    const [expandedVar, setExpandedVar] = useState<number | null>(null);

    // Initial Defaults based on Analysis
    useEffect(() => {
        if (analysis) {
            // Smart defaults could go here
        }
    }, [analysis]);

    if (!isVisible) return null;

    const handleGenerate = () => {
        const config: LuxConfig = {
            mode,
            userPrompt: '',
            mixer: {
                stylism: mixer.stylism,
                atrezzo: mixer.atrezzo,
                skin_bio: mixer.skin_bio,
                lighting: mixer.lighting,
                restoration: 0, // Default for manual
                upScaler: mixer.upScaler
            },
            batchSize // NEW: Dynamic Batch
        };
        onConfirm(config);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                        onClick={onCancel}
                    />

                    {/* SHEET MODAL */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F] border-t border-white/10 rounded-t-3xl z-[70] max-h-[90vh] overflow-y-auto flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
                    >
                        {/* HANDLE */}
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />

                        <div className="p-6 pb-32">
                            {/* HEADER */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-white italic tracking-tighter">
                                        STUDIO CONFIG <span className="text-lumen-gold">v2.5</span>
                                    </h2>
                                    <p className="text-xs text-gray-400 font-mono">
                                        {analysis?.classification ? `${analysis.classification.master_category} DETECTED` : 'ANALYSIS PENDING'}
                                    </p>
                                </div>
                                <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            {/* MODE TABS (SLIDER) */}
                            <div className="flex bg-white/5 p-1 rounded-xl mb-8 relative overflow-hidden">
                                {MODES.map((m) => {
                                    const isActive = mode === m.id;
                                    const Icon = m.icon;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setMode(m.id)}
                                            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-lg transition-all relative z-10 ${isActive ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-black' : ''}`} />
                                            <span className="text-[10px] font-bold tracking-widest">{m.label}</span>

                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute inset-0 bg-lumen-gold rounded-lg -z-10 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* DYNAMIC CONTENT AREA */}
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">

                                {/* DESCRIPTION */}
                                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-3 items-start">
                                    <Info className="w-5 h-5 text-lumen-gold shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        {MODES.find(m => m.id === mode)?.desc}
                                    </p>
                                </div>

                                {/* BATCH SIZE SLIDER (NEW feature) */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <span>Cantidad de Variaciones</span>
                                        <span className="text-lumen-gold font-mono text-lg">{batchSize}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="6"
                                        step="1"
                                        value={batchSize}
                                        onChange={(e) => setBatchSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lumen-gold"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                                        <span>1 (Test)</span>
                                        <span>6 (Full Scan)</span>
                                    </div>
                                </div>

                                {/* ADVANCED MIXER */}
                                {(mode === 'ADVANCED' || mode === 'PRO') && (
                                    <div className="space-y-4 pt-4 border-t border-white/10">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">LuxMixer™ Manual</h3>

                                        {[
                                            { key: 'stylism', label: 'Creatividad (Style)', color: 'text-pink-400' },
                                            { key: 'lighting', label: 'Complejidad Luz', color: 'text-orange-400' },
                                            { key: 'skin_bio', label: 'Fidelidad Bio (Skin)', color: 'text-prismatic-blue' },
                                            { key: 'atrezzo', label: 'Escenario / Atrezzo', color: 'text-green-400' }
                                        ].map(control => (
                                            <div key={control.key} className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                                    <span className={control.color}>{control.label}</span>
                                                    <span className="text-white">{(mixer as any)[control.key]}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="10"
                                                    value={(mixer as any)[control.key]}
                                                    onChange={(e) => setMixer({ ...mixer, [control.key]: parseInt(e.target.value) })}
                                                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* PRO MODE ACCORDION (Placeholder for Deep Params phase) */}
                                {mode === 'PRO' && (
                                    <div className="space-y-2 pt-4">
                                        <h3 className="text-xs font-bold text-lumen-gold uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Crown className="w-3 h-3" /> Configuración Individual
                                        </h3>
                                        {Array.from({ length: batchSize }).map((_, i) => (
                                            <div key={`var-${i}`} className="border border-white/10 rounded-lg overflow-hidden bg-black/20">
                                                <button
                                                    onClick={() => setExpandedVar(expandedVar === i ? null : i)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                                                >
                                                    <span className="text-xs font-bold text-gray-300">Variación {String.fromCharCode(65 + i)}</span>
                                                    {expandedVar === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                </button>
                                                {/* Expanded Content would go here */}
                                                {expandedVar === i && (
                                                    <div className="p-3 bg-black/40 text-[10px] text-gray-500 font-mono">
                                                        Deep Parameters (Focus, ISO, Texture) coming in next update.
                                                        Currently inherits Global Mixer.
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* FLOATING ACTION BAR */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent pt-12">
                            <button
                                onClick={handleGenerate}
                                className="w-full py-4 bg-lumen-gold text-black text-sm font-black uppercase tracking-[0.2em] rounded-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4 fill-current" />
                                Inicializar Estudio
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
