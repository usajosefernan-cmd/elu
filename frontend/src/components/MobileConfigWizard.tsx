import React, { useState, useEffect } from 'react';
import { LuxButton } from './LuxButton';
import {
    Upload, ArrowLeft, Terminal, Check, SlidersHorizontal, Sliders, BrainCircuit, Contrast, Hexagon,
    ScanFace, Crown, ExternalLink, Zap, Settings2, Sparkles, Lock, ArrowRight, Wallet, Download,
    Camera, Image as ImageIcon, Loader2, Hourglass, AlertTriangle, Search, X, ZoomIn, Activity,
    Wifi, WifiOff, RefreshCw, Grid, FileText, ScanLine, Palette, Sun, Maximize, Smartphone,
    Save, Bookmark, Trash2, User, Briefcase, Stethoscope, Utensils, Home, Mountain, PawPrint,
    RotateCcw, AlertOctagon, Settings, ChevronDown, ChevronUp, Tag, Layers, ShieldCheck, Target, Hash
} from 'lucide-react';
import { getUserPresets, saveUserPreset, UserPreset, deleteUserPreset } from '../services/presetService';
import { getCurrentUserProfile } from '../services/authService';
import {
    LuxConfig, LuxMixer, LuxShotType, SemanticAnalysis, OutputFormat, LuxControlMode,
    PhotoScalerConfig, StyleScalerConfig, LightScalerConfig
} from '../types';
import { ProEngineControls } from './ProEngineControls';

interface MobileConfigWizardProps {
    isOpen?: boolean; // Made optional to support legacy usage
    isVisible?: boolean; // Supported legacy prop
    imageUrl?: string; // Supported legacy prop
    onConfirm?: (config: LuxConfig) => void;
    onGenerate?: (config: LuxConfig) => void;
    onCancel?: () => void;
    onClose?: () => void;
    analysis: SemanticAnalysis | null;
    isGenerating?: boolean;
}

// === CATEGORÍAS Y TAGS ===
const MASTER_CATEGORIES = {
    'HUMAN': { label: 'Personas', icon: User, color: 'text-lumen-gold', tags: ['Retrato', 'Editorial', 'Corporativo', 'Clínico', 'Selfie'] },
    'PRODUCT': { label: 'Producto', icon: Camera, color: 'text-prismatic-blue', tags: ['E-Commerce', 'Lifestyle', 'Packshot', 'Joyería', 'Tech'] },
    'FOOD': { label: 'Gastronomía', icon: Utensils, color: 'text-orange-400', tags: ['Plato', 'Bebida', 'Ingredientes', 'Chef', 'Ambiente'] },
    'ARCH': { label: 'Arquitectura', icon: Home, color: 'text-indigo-400', tags: ['Exterior', 'Interior', 'Detalle', 'Inmobiliaria', 'Arte'] },
    'LANDSCAPE': { label: 'Paisaje', icon: Mountain, color: 'text-green-400', tags: ['Naturaleza', 'Urbano', 'Aéreo', 'Nocturno', 'Viaje'] },
    'PET': { label: 'Mascotas', icon: PawPrint, color: 'text-yellow-400', tags: ['Perro', 'Gato', 'Exótico', 'Acción', 'Estudio'] },
};

// === MODOS DE OPERACIÓN ===
const MODE_CONFIG: Record<LuxControlMode, { label: string; icon: any; title: string; subtitle: string; description: string; color: string; gradient: string }> = {
    'AUTO': {
        label: 'Auto', icon: Sparkles, title: 'AI MAGIC', subtitle: 'Swarm Intelligence',
        description: 'AI decide todo. 6 variaciones rápidas.',
        color: 'text-emerald-400', gradient: 'from-emerald-600/20 to-emerald-900/20'
    },
    'USER': {
        label: 'User', icon: User, title: 'CUSTOM', subtitle: 'Control Básico',
        description: 'Categoría, Estilo y Cantidad.',
        color: 'text-blue-400', gradient: 'from-blue-600/20 to-blue-900/20'
    },
    'ADVANCED': {
        label: 'Adv', icon: Sliders, title: 'MIXER PRO', subtitle: 'Production Values',
        description: 'Ajuste fino de Stylism, Light y Atrezzo.',
        color: 'text-purple-400', gradient: 'from-purple-600/20 to-purple-900/20'
    },
    'PRO': {
        label: 'Pro', icon: Crown, title: 'DEEP PHYSICS', subtitle: 'Control Total',
        description: 'Acceso directo a Motores Ópticos.',
        color: 'text-lumen-gold', gradient: 'from-amber-600/20 to-amber-900/20'
    },
};

export const MobileConfigWizard: React.FC<MobileConfigWizardProps> = (props) => {
    // Normalize props (Legacy support)
    const isVisible = props.isOpen || props.isVisible || false;
    const confirmFn = props.onGenerate || props.onConfirm || (() => { });
    const closeFn = props.onClose || props.onCancel || (() => { });
    const { analysis } = props;

    // 1. STATE CONFIG
    const [userMode, setUserMode] = useState<LuxControlMode>('AUTO');
    const [activeEngineTab, setActiveEngineTab] = useState<'PHOTO' | 'STYLE' | 'LIGHT'>('PHOTO');

    // Selection State (USER Mode)
    const [selectedRoles, setSelectedRoles] = useState<LuxShotType[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<keyof typeof MASTER_CATEGORIES | null>(null);

    // Phase 5: Production Mixer
    const [mixer, setMixer] = useState<LuxMixer>({
        stylism: 5, atrezzo: 5, skin_bio: 5, lighting: 5, restoration: 8, upScaler: 2
    });

    // Deep Physics Engines
    const [photoConfig, setPhotoConfig] = useState<PhotoScalerConfig>({
        noise_reduction: 5, definition: 6, lens_fix: 4, tone_recovery: 5,
        depth_of_field: 3, film_grain: 2, color_science: 7,
        // PRO Defaults
        fractality: 5, chromatism: 2, focus_plane: 5, sensor_noise: 3
    });

    const [styleConfig, setStyleConfig] = useState<StyleScalerConfig>({
        skin_physics: 5, material_transmutation: 2, damage_fill: 8,
        eye_hair_reconstruct: 5, fabric_topology: 0, virtual_ironing: false,
        declutter: 0, reality_inject: 5,
        // PRO Defaults
        abstract_detail: 3, composition_weight: 5
    });

    const [lightConfig, setLightConfig] = useState<LightScalerConfig>({
        intensity: 4, volumetrics: 3, light_archetype: 'NATURAL', relighting_strength: 0
    });

    // Presets
    const [presets, setPresets] = useState<UserPreset[]>([]);
    const [newPresetName, setNewPresetName] = useState('');
    const [showSavePreset, setShowSavePreset] = useState(false);

    // 2. AUTO-DETECT
    useEffect(() => {
        if (isVisible && analysis && analysis.classification) {
            // Mapping logic
            const mapping: Record<string, keyof typeof MASTER_CATEGORIES> = {
                'PORTRAIT': 'HUMAN', 'PRODUCT': 'PRODUCT', 'FOOD': 'FOOD',
                'ARCHITECTURE': 'ARCH', 'LANDSCAPE': 'LANDSCAPE', 'ANIMAL': 'PET',
                'HUMAN': 'HUMAN'
            };

            // Safe check for includes
            const cls = analysis.classification.master_category || '';
            const foundKey = Object.keys(mapping).find(k => cls.includes(k));

            if (foundKey) {
                const cat = mapping[foundKey];
                setSelectedCategory(cat);
                if (selectedRoles.length === 0) setSelectedRoles([cat as LuxShotType]);
            } else if (selectedCategory === null) {
                setSelectedCategory('HUMAN');
            }
        }
        if (isVisible) {
            loadPresets();
        }
    }, [isVisible, analysis]);

    const loadPresets = async () => {
        try {
            const user = await getCurrentUserProfile();
            if (user) {
                const loaded = await getUserPresets(user.id);
                setPresets(loaded);
            }
        } catch (e) { console.error(e); }
    };

    const handleConfirm = () => {
        const config: LuxConfig = {
            userPrompt: '',
            correction_enabled: true,
            shotType: selectedRoles,
            selectedTags: selectedTags,
            mode: userMode,
            mixer: (userMode === 'AUTO' || userMode === 'USER') ? {
                stylism: 5, atrezzo: 5, skin_bio: 5, lighting: 5, restoration: 5,
                upScaler: mixer.upScaler
            } : mixer,
            photoScaler: userMode === 'PRO' ? photoConfig : undefined,
            styleScaler: userMode === 'PRO' ? styleConfig : undefined,
            lightScaler: userMode === 'PRO' ? lightConfig : undefined
        };
        confirmFn(config);
    };

    if (!isVisible) return null;

    const CurrentIcon = MODE_CONFIG[userMode].icon;
    const availableTags = selectedCategory ? MASTER_CATEGORIES[selectedCategory].tags : [];
    const categories = Object.keys(MASTER_CATEGORIES).map(key => ({
        id: key as LuxShotType,
        ...MASTER_CATEGORIES[key as keyof typeof MASTER_CATEGORIES]
    }));

    return (
        <div className="fixed inset-0 bg-void-black/95 z-[100] flex flex-col backdrop-blur-sm animate-in fade-in slide-in-from-bottom-10 duration-300">
            {/* HEADER */}
            <div className="pt-safe px-4 pb-2 bg-void-black border-b border-white/5 sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-lumen-gold" />
                        <span className="text-xs font-black tracking-[0.2em] text-white">STUDIO CONFIG</span>
                    </div>
                    <button onClick={closeFn} className="p-2 -mr-2 text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* MODE SLIDER */}
                <div className="flex bg-white/5 p-1 rounded-xl mb-2 relative">
                    <div
                        className="absolute top-1 bottom-1 bg-white/10 rounded-lg transition-all duration-300 ease-out"
                        style={{
                            left: `${['AUTO', 'USER', 'ADVANCED', 'PRO'].indexOf(userMode) * 25}%`,
                            width: '24%'
                        }}
                    />
                    {(['AUTO', 'USER', 'ADVANCED', 'PRO'] as LuxControlMode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => setUserMode(m)}
                            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg relative z-10 transition-all ${userMode === m ? MODE_CONFIG[m].color : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {React.createElement(MODE_CONFIG[m].icon, { className: "w-4 h-4 mb-0.5" })}
                            <span className="text-[9px] font-black uppercase tracking-wider">{MODE_CONFIG[m].label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

                {/* INFO CARD */}
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${MODE_CONFIG[userMode].gradient} border border-white/5 relative overflow-hidden group`}>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                            {MODE_CONFIG[userMode].title}
                        </h2>
                        <p className={`text-xs font-bold uppercase tracking-widest ${MODE_CONFIG[userMode].color} mb-2`}>
                            {MODE_CONFIG[userMode].subtitle}
                        </p>
                        <p className="text-xs text-gray-300 max-w-[80%] leading-relaxed">
                            {MODE_CONFIG[userMode].description}
                        </p>
                    </div>
                </div>

                {/* AUTO */}
                {userMode === 'AUTO' && (
                    <div className="text-center py-10 opacity-50">
                        <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-pulse" />
                        <p className="text-sm text-gray-400">Todo listo. La IA tomará el control.</p>
                    </div>
                )}

                {/* USER SELECTORS */}
                {(userMode === 'USER' || userMode === 'ADVANCED' || userMode === 'PRO') && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100">
                        <div>
                            <SectionHeader icon={Grid} title="Categoría" />
                            <div className="grid grid-cols-3 gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            if (userMode === 'USER') setSelectedRoles([cat.id]);
                                            else {
                                                if (selectedRoles.includes(cat.id)) setSelectedRoles(p => p.filter(r => r !== cat.id));
                                                else setSelectedRoles(p => [...p, cat.id]);
                                            }
                                            setSelectedCategory(cat.id as any);
                                        }}
                                        className={`p-3 rounded-xl border text-left transition-all ${selectedRoles.includes(cat.id) ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-400'}`}
                                    >
                                        <div className="font-bold text-xs">{cat.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <SectionHeader icon={Hash} title="Etiquetas" />
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            if (selectedTags.includes(tag)) setSelectedTags(p => p.filter(t => t !== tag));
                                            else setSelectedTags(p => [...p, tag]);
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all ${selectedTags.includes(tag) ? 'bg-lumen-gold text-black' : 'border-white/10 text-gray-500'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ADVANCED MIXER */}
                {userMode === 'ADVANCED' && (
                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 delay-200">
                        <SectionHeader icon={Sliders} title="Production Mixer" />
                        <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                            <RangeControl label="Stylism" value={mixer.stylism} onChange={(v) => setMixer(p => ({ ...p, stylism: v }))} color="text-pink-400" />
                            <RangeControl label="Lighting" value={mixer.lighting} onChange={(v) => setMixer(p => ({ ...p, lighting: v }))} color="text-orange-400" />
                            <RangeControl label="Atrezzo" value={mixer.atrezzo} onChange={(v) => setMixer(p => ({ ...p, atrezzo: v }))} color="text-prismatic-blue" />
                            <RangeControl label="Restoration" value={mixer.restoration} onChange={(v) => setMixer(p => ({ ...p, restoration: v }))} color="text-emerald-400" />
                        </div>
                    </div>
                )}

                {/* PRO ENGINE CONTROLS */}
                {userMode === 'PRO' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-200">
                        <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-lg">
                            {[{ id: 'PHOTO', label: 'Optics', icon: Camera }, { id: 'STYLE', label: 'Style', icon: Palette }, { id: 'LIGHT', label: 'Light', icon: Sun }].map((tab: any) => (
                                <button key={tab.id} onClick={() => setActiveEngineTab(tab.id)} className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-2 ${activeEngineTab === tab.id ? 'bg-lumen-gold text-black font-bold' : 'text-gray-400'}`}>
                                    <tab.icon className="w-3 h-3" /> <span className="text-[10px] uppercase">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                        {activeEngineTab === 'PHOTO' && (
                            <div className="space-y-4 border-l-2 border-prismatic-blue pl-4">
                                <SectionHeader icon={Target} title="Focus & Optics" />
                                <RangeControl label="Focus Plane" value={photoConfig.focus_plane || 5} onChange={(v) => setPhotoConfig(p => ({ ...p, focus_plane: v }))} color="text-cyan-400" />
                                <RangeControl label="Depth Field" value={photoConfig.depth_of_field} onChange={(v) => setPhotoConfig(p => ({ ...p, depth_of_field: v }))} />
                                <RangeControl label="Lens Fix" value={photoConfig.lens_fix} onChange={(v) => setPhotoConfig(p => ({ ...p, lens_fix: v }))} />
                                <RangeControl label="Chromatism" value={photoConfig.chromatism || 0} onChange={(v) => setPhotoConfig(p => ({ ...p, chromatism: v }))} color="text-red-400" />

                                <div className="h-px bg-white/5 my-2" />
                                <SectionHeader icon={Activity} title="Sensor & Physics" />
                                <RangeControl label="Definition" value={photoConfig.definition} onChange={(v) => setPhotoConfig(p => ({ ...p, definition: v }))} />
                                <RangeControl label="Fractality" value={photoConfig.fractality || 5} onChange={(v) => setPhotoConfig(p => ({ ...p, fractality: v }))} color="text-purple-400" />
                                <RangeControl label="Sensor Noise" value={photoConfig.sensor_noise || 0} onChange={(v) => setPhotoConfig(p => ({ ...p, sensor_noise: v }))} />
                            </div>
                        )}
                        {activeEngineTab === 'STYLE' && (
                            <div className="space-y-4 border-l-2 border-pink-500 pl-4">
                                <SectionHeader icon={ScanFace} title="Biological & Material" />
                                <RangeControl label="Skin Physics" value={styleConfig.skin_physics} onChange={(v) => setStyleConfig(p => ({ ...p, skin_physics: v }))} color="text-pink-400" />
                                <RangeControl label="Materials" value={styleConfig.material_transmutation} onChange={(v) => setStyleConfig(p => ({ ...p, material_transmutation: v }))} color="text-pink-400" />
                                <RangeControl label="Damage Fill" value={styleConfig.damage_fill} onChange={(v) => setStyleConfig(p => ({ ...p, damage_fill: v }))} color="text-pink-400" />

                                <div className="h-px bg-white/5 my-2" />
                                <SectionHeader icon={BrainCircuit} title="Abstraction" />
                                <RangeControl label="Abstract Detail" value={styleConfig.abstract_detail || 3} onChange={(v) => setStyleConfig(p => ({ ...p, abstract_detail: v }))} color="text-violet-400" />
                                <RangeControl label="Composition" value={styleConfig.composition_weight || 5} onChange={(v) => setStyleConfig(p => ({ ...p, composition_weight: v }))} color="text-violet-400" />
                            </div>
                        )}
                        {activeEngineTab === 'LIGHT' && (
                            <div className="space-y-4 border-l-2 border-orange-500 pl-4">
                                <RangeControl label="Intensity" value={lightConfig.intensity} onChange={(v) => setLightConfig(p => ({ ...p, intensity: v }))} color="text-orange-400" />
                                <RangeControl label="Volumetrics" value={lightConfig.volumetrics} onChange={(v) => setLightConfig(p => ({ ...p, volumetrics: v }))} color="text-orange-400" />
                                <RangeControl label="Relighting" value={lightConfig.relighting_strength} onChange={(v) => setLightConfig(p => ({ ...p, relighting_strength: v }))} color="text-yellow-400" />
                            </div>
                        )}
                    </div>
                )}
                <div className="h-24"></div>
            </div>

            {/* ACTION BUTTON */}
            <div className="p-4 bg-void-black border-t border-white/10">
                <LuxButton onClick={handleConfirm} className="w-full py-4 text-sm shadow-lumen-glow">
                    <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" /> <span>GENERAR (4K READY)</span>
                    </div>
                </LuxButton>
            </div>
        </div>
    );
};

// HELPERS
const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
        <Icon className="w-3 h-3 text-lumen-gold" /> {title}
    </h3>
);

const RangeControl = ({ label, value, onChange, color = 'text-gray-300' }: { label: string, value: number, onChange: (v: number) => void, color?: string }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className={color}>{label}</span>
            <span className="text-white">{value}</span>
        </div>
        <input type="range" min="0" max="10" step="1" value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-lumen-gold" />
    </div>
);
