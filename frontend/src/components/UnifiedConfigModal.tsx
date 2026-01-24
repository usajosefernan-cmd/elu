import React, { useState, useEffect, useCallback } from 'react';
import { X, Lock, Zap, Sparkles, Camera, Sun, Palette, ChevronLeft, ChevronRight, AlertTriangle, Save, Trash2, FolderOpen } from 'lucide-react';
import { getSystemPresets, getUserPresets, saveUserPreset, deleteUserPreset, SmartPreset } from '../services/smartPresetsService';

// ===========================================
// TYPES
// ===========================================
interface VisionAnalysis {
  category?: string;
  category_rules?: { identity_lock: string };
  production_analysis?: {
    current_quality: string;
    target_vision: string;
    gaps_detected?: string[];
  };
  auto_settings?: {
    primary_intent_used: string;
    photoscaler: Record<string, number>;
    stylescaler: Record<string, number>;
    lightscaler: Record<string, number>;
  };
  technical_diagnosis?: {
    noise_level: number;
    blur_level: number;
    exposure_issues?: string;
    has_person?: boolean;
    face_count?: number;
    lighting_type?: string;
    composition_score?: number;
  };
  protocol_alerts?: string[];
}

interface UnifiedConfigModalProps {
  isVisible: boolean;
  imageUrl: string;
  analysis: VisionAnalysis | null;
  userProfile: 'auto' | 'user' | 'pro' | 'prolux';
  userId?: string;
  onConfirm: (config: { mode: string; settings: any; preset?: string }) => void;
  onCancel: () => void;
  tokensRequired: number;
  userTokens: number;
  // Batch mode props
  batchMode?: boolean;
  batchFiles?: File[];
  // Original image base64 for preset thumbnail
  imageBase64?: string;
}

// ===========================================
// SLIDER DEFINITIONS - 27 SLIDERS
// ===========================================
type PillarKey = 'photoscaler' | 'stylescaler' | 'lightscaler';

const PILLAR_CONFIG: Record<PillarKey, { label: string; icon: React.ElementType; color: string; sliders: { name: string; label: string; desc: string }[] }> = {
  photoscaler: {
    label: 'Imagen',
    icon: Camera,
    color: 'cyan',
    sliders: [
      { name: 'limpieza_artefactos', label: 'Limpieza', desc: 'Ruido/artefactos' },
      { name: 'geometria', label: 'Geometría', desc: 'Distorsión lente' },
      { name: 'optica', label: 'Óptica', desc: 'Nitidez general' },
      { name: 'chronos', label: 'Chronos', desc: 'Motion blur' },
      { name: 'senal_raw', label: 'Raw', desc: 'Rango dinámico' },
      { name: 'sintesis_adn', label: 'Textura', desc: 'Detalle IA' },
      { name: 'grano_filmico', label: 'Grano', desc: 'Film grain' },
      { name: 'enfoque', label: 'Enfoque', desc: 'Sharpness' },
      { name: 'resolucion', label: 'Escala', desc: 'Upscale' },
    ]
  },
  stylescaler: {
    label: 'Estilo',
    icon: Palette,
    color: 'pink',
    sliders: [
      { name: 'styling_piel', label: 'Piel', desc: 'Retoque facial' },
      { name: 'styling_pelo', label: 'Cabello', desc: 'Pelo perfecto' },
      { name: 'styling_ropa', label: 'Ropa', desc: 'Textiles' },
      { name: 'maquillaje', label: 'Makeup', desc: 'Maquillaje IA' },
      { name: 'limpieza_entorno', label: 'Fondo', desc: 'Cleanup BG' },
      { name: 'reencuadre_ia', label: 'Encuadre', desc: 'Composición' },
      { name: 'atmosfera', label: 'Atmósfera', desc: 'Niebla/haze' },
      { name: 'look_cine', label: 'Cinema', desc: 'Color grade' },
      { name: 'materiales_pbr', label: 'PBR', desc: 'Materiales 3D' },
    ]
  },
  lightscaler: {
    label: 'Luz',
    icon: Sun,
    color: 'amber',
    sliders: [
      { name: 'key_light', label: 'Principal', desc: 'Luz clave' },
      { name: 'fill_light', label: 'Relleno', desc: 'Fill light' },
      { name: 'rim_light', label: 'Contorno', desc: 'Backlight' },
      { name: 'volumetria', label: 'Volumen', desc: 'Rayos luz' },
      { name: 'temperatura', label: 'Temp', desc: 'Cálido/frío' },
      { name: 'contraste', label: 'Contraste', desc: 'B&W range' },
      { name: 'sombras', label: 'Sombras', desc: 'Profundidad' },
      { name: 'estilo_autor', label: 'Estilo', desc: 'Autor look' },
      { name: 'reflejos', label: 'Brillo', desc: 'Highlights' },
    ]
  }
};

// Sliders visibles por perfil
const PROFILE_VISIBLE_SLIDERS: Record<string, string[] | 'all'> = {
  auto: [],
  user: ['limpieza_artefactos', 'enfoque', 'styling_piel', 'limpieza_entorno', 'key_light', 'contraste'],
  pro: [
    'limpieza_artefactos', 'geometria', 'optica', 'enfoque', 'resolucion',
    'styling_piel', 'styling_pelo', 'limpieza_entorno', 'atmosfera', 'look_cine',
    'key_light', 'fill_light', 'contraste', 'temperatura', 'estilo_autor'
  ],
  prolux: 'all'
};

const INTENSITY_LEVELS = [
  { key: 'minimal', label: 'Min', mult: 0.3 },
  { key: 'subtle', label: 'Sutil', mult: 0.6 },
  { key: 'balanced', label: 'Normal', mult: 1.0 },
  { key: 'strong', label: 'Fuerte', mult: 1.3 },
  { key: 'maximum', label: 'Max', mult: 1.6 },
];

// ===========================================
// COMPACT SLIDER COMPONENT
// ===========================================
const CompactSlider: React.FC<{
  label: string;
  value: number;
  locked: boolean;
  color: string;
  onChange: (v: number) => void;
}> = ({ label, value, locked, color, onChange }) => {
  const colorClasses: Record<string, string> = {
    cyan: 'bg-cyan-500',
    pink: 'bg-pink-500',
    amber: 'bg-amber-500',
  };
  
  return (
    <div className="flex items-center gap-1.5 group">
      <span className={`text-[9px] w-14 truncate ${locked ? 'text-neutral-600' : 'text-neutral-400'}`}>
        {label}
      </span>
      {locked && <Lock size={8} className="text-neutral-600 flex-shrink-0" />}
      <div className="flex-1 relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1.5 bg-neutral-800 rounded-full" />
        <div 
          className={`absolute left-0 h-1.5 rounded-full transition-all ${locked ? 'bg-neutral-700' : colorClasses[color]}`}
          style={{ width: `${value * 10}%` }}
        />
        <input
          type="range"
          min="0"
          max="10"
          value={value}
          disabled={locked}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div 
          className={`absolute w-3 h-3 rounded-full border-2 transform -translate-x-1/2 transition-all
            ${locked ? 'bg-neutral-700 border-neutral-600' : `${colorClasses[color]} border-white`}
            ${!locked && 'group-hover:scale-125'}
          `}
          style={{ left: `${value * 10}%` }}
        />
      </div>
      <span className={`text-[10px] w-4 text-right font-mono ${
        value >= 9 ? 'text-red-400 font-bold' : value >= 7 ? 'text-amber-400' : locked ? 'text-neutral-600' : 'text-neutral-400'
      }`}>
        {value}
      </span>
    </div>
  );
};

// ===========================================
// MAIN COMPONENT
// ===========================================
export const UnifiedConfigModal: React.FC<UnifiedConfigModalProps> = ({
  isVisible,
  imageUrl,
  analysis,
  userProfile = 'auto',
  userId,
  onConfirm,
  onCancel,
  tokensRequired,
  userTokens,
  batchMode = false,
  batchFiles = [],
  imageBase64,
}) => {
  // State
  const [activeProfile, setActiveProfile] = useState<'auto' | 'user' | 'pro' | 'prolux'>(userProfile);
  const [intensity, setIntensity] = useState(2);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [activePillar, setActivePillar] = useState<PillarKey>('photoscaler');
  const [batchPreviews, setBatchPreviews] = useState<string[]>([]);
  const [sliderValues, setSliderValues] = useState<Record<string, Record<string, number>>>({
    photoscaler: {},
    stylescaler: {},
    lightscaler: {}
  });
  
  // 🔒 Locked sliders state - sliders que NO se pueden editar cuando hay preset cargado
  const [lockedSliders, setLockedSliders] = useState<string[]>([]);
  const [presetThumbnail, setPresetThumbnail] = useState<string | null>(null);
  
  // Presets state
  const [systemPresets, setSystemPresets] = useState<SmartPreset[]>([]);
  const [userPresets, setUserPresets] = useState<SmartPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // 🖼️ Preset viewer state
  const [viewingPreset, setViewingPreset] = useState<SmartPreset | null>(null);
  const [viewingPresetIndex, setViewingPresetIndex] = useState<number>(-1);

  // Load presets
  useEffect(() => {
    const loadPresets = async () => {
      console.log('Loading presets... userId:', userId);
      
      const system = await getSystemPresets();
      console.log('System presets loaded:', system.length);
      setSystemPresets(system);
      
      if (userId) {
        const user = await getUserPresets(userId);
        console.log('User presets loaded:', user.length, user);
        setUserPresets(user);
      }
    };
    loadPresets();
  }, [userId, isVisible]); // Also reload when modal opens

  // Generate batch previews
  useEffect(() => {
    if (batchMode && batchFiles.length > 0) {
      const generatePreviews = async () => {
        const previews: string[] = [];
        for (const file of batchFiles.slice(0, 6)) { // Max 6 previews
          const url = URL.createObjectURL(file);
          previews.push(url);
        }
        setBatchPreviews(previews);
      };
      generatePreviews();
      
      // Cleanup
      return () => {
        batchPreviews.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [batchMode, batchFiles]);

  // Initialize slider values
  useEffect(() => {
    if (analysis?.auto_settings) {
      setSliderValues({
        photoscaler: { ...analysis.auto_settings.photoscaler },
        stylescaler: { ...analysis.auto_settings.stylescaler },
        lightscaler: { ...analysis.auto_settings.lightscaler }
      });
    } else {
      // Default values = 5
      const defaults: Record<string, Record<string, number>> = { photoscaler: {}, stylescaler: {}, lightscaler: {} };
      for (const [pillar, config] of Object.entries(PILLAR_CONFIG)) {
        for (const slider of config.sliders) {
          defaults[pillar][slider.name] = 5;
        }
      }
      setSliderValues(defaults);
    }
  }, [analysis?.auto_settings]);

  // Load preset values when selected
  const loadPreset = useCallback((preset: SmartPreset) => {
    const newValues: Record<string, Record<string, number>> = {
      photoscaler: {},
      stylescaler: {},
      lightscaler: {}
    };
    
    // Get slider values from preset (could be in slider_values or sliders_config)
    const sliderSource = preset.sliders_config || preset.slider_values || {};
    
    for (const pillar of ['photoscaler', 'stylescaler', 'lightscaler'] as PillarKey[]) {
      const presetPillar = sliderSource[pillar] || {};
      // Merge with defaults
      for (const slider of PILLAR_CONFIG[pillar].sliders) {
        newValues[pillar][slider.name] = presetPillar[slider.name] ?? 5;
      }
    }
    
    setSliderValues(newValues);
    setSelectedPresetId(preset.id);
    setShowUserPresets(false);
    
    // 🔒 Load locked sliders from preset
    const presetLocked = preset.locked_sliders || preset.slider_values?._v40_meta?.locked_sliders || [];
    setLockedSliders(presetLocked);
    
    // 🖼️ Load thumbnail from preset
    const thumbnail = preset.thumbnail_base64 || preset.slider_values?._v40_meta?.thumbnail_base64;
    setPresetThumbnail(thumbnail ? `data:image/webp;base64,${thumbnail}` : null);
    
    console.log(`[Preset] Loaded "${preset.name}" with ${presetLocked.length} locked sliders`);
  }, []);

  // Save current config as user preset
  const handleSavePreset = async () => {
    if (!userId || !newPresetName.trim()) return;
    
    setIsSaving(true);
    try {
      const result = await saveUserPreset(
        userId,
        newPresetName.trim(),
        sliderValues as SmartPreset['slider_values'],
        [],
        newPresetDescription.trim() || undefined,
        imageBase64 || imageUrl  // Use base64 first, fallback to URL
      );
      
      if (result) {
        setUserPresets(prev => [...prev, result]);
        setShowSaveDialog(false);
        setNewPresetName('');
        setNewPresetDescription('');
      }
    } catch (e) {
      console.error('Error saving preset:', e);
    }
    setIsSaving(false);
  };
  
  // Navigate presets in viewer
  const navigatePreset = (direction: 'prev' | 'next') => {
    if (!viewingPreset || userPresets.length === 0) return;
    
    const currentIndex = userPresets.findIndex(p => p.id === viewingPreset.id);
    let newIndex = currentIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : userPresets.length - 1;
    } else {
      newIndex = currentIndex < userPresets.length - 1 ? currentIndex + 1 : 0;
    }
    
    setViewingPreset(userPresets[newIndex]);
    setViewingPresetIndex(newIndex);
  };
  
  // Keyboard navigation for preset viewer
  useEffect(() => {
    if (!viewingPreset) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigatePreset('prev');
      if (e.key === 'ArrowRight') navigatePreset('next');
      if (e.key === 'Escape') setViewingPreset(null);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingPreset, userPresets]);

  // Delete user preset
  const handleDeletePreset = async (presetId: string) => {
    if (!userId) return;
    
    const success = await deleteUserPreset(userId, presetId);
    if (success) {
      setUserPresets(prev => prev.filter(p => p.id !== presetId));
      if (selectedPresetId === presetId) {
        setSelectedPresetId(null);
      }
    }
  };

  if (!isVisible) return null;

  const hasEnoughTokens = userTokens >= tokensRequired;
  const tech = analysis?.technical_diagnosis;
  const alerts = analysis?.protocol_alerts || [];
  const category = analysis?.category || 'GENERAL';

  // Get visible sliders for current profile
  const getVisibleSliders = (): string[] => {
    const config = PROFILE_VISIBLE_SLIDERS[activeProfile];
    if (config === 'all') {
      return Object.values(PILLAR_CONFIG).flatMap(p => p.sliders.map(s => s.name));
    }
    return config;
  };

  // Update slider value
  const updateSlider = (pillar: PillarKey, sliderName: string, value: number) => {
    setSliderValues(prev => ({
      ...prev,
      [pillar]: { ...prev[pillar], [sliderName]: value }
    }));
    // Clear preset selection when manually changing
    setSelectedPresetId(null);
    // Clear locked sliders when user modifies manually
    setLockedSliders([]);
    setPresetThumbnail(null);
  };

  // Build final config
  const buildFinalConfig = () => {
    let finalValues = { ...sliderValues };
    
    if (activeProfile === 'auto') {
      const mult = INTENSITY_LEVELS[intensity].mult;
      for (const pillar of ['photoscaler', 'stylescaler', 'lightscaler'] as PillarKey[]) {
        finalValues[pillar] = {};
        for (const [name, value] of Object.entries(sliderValues[pillar] || {})) {
          finalValues[pillar][name] = Math.min(10, Math.max(0, Math.round((value as number) * mult)));
        }
      }
    }
    
    return {
      photoscaler: { sliders: Object.entries(finalValues.photoscaler).map(([name, value]) => ({ name, value })) },
      stylescaler: { sliders: Object.entries(finalValues.stylescaler).map(([name, value]) => ({ name, value })) },
      lightscaler: { sliders: Object.entries(finalValues.lightscaler).map(([name, value]) => ({ name, value })) }
    };
  };

  const handleConfirm = () => {
    const settings = buildFinalConfig();
    onConfirm({ 
      mode: activeProfile.toUpperCase(), 
      settings,
      preset: selectedPresetId || undefined
    });
  };

  const visibleSliders = getVisibleSliders();
  const showSliders = activeProfile !== 'auto' && visibleSliders.length > 0;

  // Count active sliders per pillar (different from 5)
  const countActiveInPillar = (pillarKey: PillarKey): number => {
    const pillar = PILLAR_CONFIG[pillarKey];
    return pillar.sliders.filter(s => {
      const val = sliderValues[pillarKey]?.[s.name] ?? 5;
      return val !== 5 && visibleSliders.includes(s.name);
    }).length;
  };

  // Pillar tabs
  const pillars: PillarKey[] = ['photoscaler', 'stylescaler', 'lightscaler'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2" data-testid="unified-config-modal">
      <div className="absolute inset-0 bg-black/95" onClick={onCancel} />
      
      <div className="relative bg-neutral-950 border border-neutral-800 w-full max-w-lg rounded-xl overflow-hidden flex flex-col shadow-2xl" style={{ maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
          {batchMode && batchPreviews.length > 0 ? (
            // Batch mode: Show multiple thumbnails
            <div className="flex -space-x-2">
              {batchPreviews.slice(0, 4).map((url, idx) => (
                <img 
                  key={idx} 
                  src={url} 
                  alt="" 
                  className="w-10 h-10 rounded-lg object-cover ring-2 ring-neutral-900 border border-purple-500/50" 
                />
              ))}
              {batchFiles.length > 4 && (
                <div className="w-10 h-10 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center ring-2 ring-neutral-900">
                  <span className="text-xs font-bold text-purple-300">+{batchFiles.length - 4}</span>
                </div>
              )}
            </div>
          ) : (
            // Single mode: Show single image
            <img src={imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover ring-1 ring-white/10" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {batchMode ? (
                <>
                  <span className="text-xs font-semibold text-purple-400">MODO LOTE</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">{batchFiles.length} fotos</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-semibold text-white">{category}</span>
                  {tech?.has_person && <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">Persona</span>}
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-neutral-500">
              {batchMode ? (
                <span>El mismo estilo se aplicará a todas las fotos</span>
              ) : (
                <>
                  <span>R:{tech?.noise_level ?? '?'}</span>
                  <span>B:{tech?.blur_level ?? '?'}</span>
                  {tech?.face_count && <span>Caras:{tech.face_count}</span>}
                </>
              )}
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <X size={18} className="text-neutral-400" />
          </button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
            <p className="text-[10px] text-amber-400 truncate">{alerts[0]}</p>
          </div>
        )}

        {/* Mode selector */}
        <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900/30">
          <div className="flex rounded-lg overflow-hidden border border-neutral-700/50">
            {(['auto', 'user', 'pro', 'prolux'] as const).map(p => (
              <button
                key={p}
                onClick={() => setActiveProfile(p)}
                data-testid={`mode-${p}`}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeProfile === p 
                    ? 'bg-white text-black' 
                    : 'bg-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                }`}
              >
                {p === 'auto' && <Zap size={10} className="inline mr-1" />}
                {p === 'prolux' && <Sparkles size={10} className="inline mr-1" />}
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* AUTO: Intensity selector */}
          {activeProfile === 'auto' && (
            <div className="px-4 py-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-3">Intensidad de mejora</p>
              <div className="flex gap-1">
                {INTENSITY_LEVELS.map((level, idx) => (
                  <button
                    key={level.key}
                    onClick={() => setIntensity(idx)}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-semibold transition-all ${
                      intensity === idx 
                        ? 'bg-white text-black scale-105 shadow-lg' 
                        : 'bg-neutral-800/50 text-neutral-500 hover:bg-neutral-700/50'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-neutral-600 text-center mt-3">
                IA detectará automáticamente los ajustes óptimos
              </p>
            </div>
          )}

          {/* Non-AUTO: Presets + Sliders */}
          {activeProfile !== 'auto' && (
            <>
              {/* Presets Section - TODOS VISIBLES */}
              <div className="px-4 py-3 border-b border-neutral-800/50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Presets</p>
                  {userId && (
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      className="px-2 py-1 rounded text-[9px] bg-green-500/20 text-green-400 hover:bg-green-500/30 flex items-center gap-1 transition-all"
                    >
                      <Save size={10} />
                      Guardar actual
                    </button>
                  )}
                </div>
                
                {/* Mis Presets - Con miniaturas */}
                {userPresets.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[9px] text-blue-400 mb-2 uppercase font-semibold flex items-center gap-1">
                      <FolderOpen size={10} />
                      Mis Estilos ({userPresets.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {userPresets.map(preset => {
                        const thumbnail = preset.thumbnail_base64 || preset.slider_values?._v40_meta?.thumbnail_base64;
                        const thumbnailUrl = thumbnail ? `data:image/webp;base64,${thumbnail}` : null;
                        
                        return (
                          <div key={preset.id} className="relative group">
                            {/* Preset Card con miniatura */}
                            <button
                              onClick={() => loadPreset(preset)}
                              className={`w-full aspect-square rounded-lg overflow-hidden transition-all relative ${
                                selectedPresetId === preset.id 
                                  ? 'ring-2 ring-blue-500 scale-[1.02]' 
                                  : 'ring-1 ring-neutral-700 hover:ring-blue-500/50'
                              }`}
                            >
                              {thumbnailUrl ? (
                                <img 
                                  src={thumbnailUrl} 
                                  alt={preset.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center">
                                  <span className="text-2xl opacity-30">📸</span>
                                </div>
                              )}
                              
                              {/* Overlay con nombre */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                                <span className="text-[9px] font-medium text-white truncate w-full">
                                  {preset.name}
                                </span>
                              </div>
                              
                              {/* Badge de selección */}
                              {selectedPresetId === preset.id && (
                                <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>
                            
                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePreset(preset.id);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500/90 hover:bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              title="Eliminar"
                            >
                              <Trash2 size={10} className="text-white" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Presets de Fábrica */}
                <div>
                  <p className="text-[9px] text-neutral-500 mb-1.5 uppercase font-semibold">
                    Presets LuxScaler ({systemPresets.length})
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedPresetId(null);
                        setLockedSliders([]);
                        setPresetThumbnail(null);
                        // Reset to defaults
                        const defaults: Record<string, Record<string, number>> = { photoscaler: {}, stylescaler: {}, lightscaler: {} };
                        for (const [pillar, config] of Object.entries(PILLAR_CONFIG)) {
                          for (const slider of config.sliders) {
                            defaults[pillar][slider.name] = 5;
                          }
                        }
                        setSliderValues(defaults);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-medium transition-all ${
                        !selectedPresetId 
                          ? 'bg-white text-black' 
                          : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700/50'
                      }`}
                    >
                      Manual
                    </button>
                    {systemPresets.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => loadPreset(preset)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-medium transition-all ${
                          selectedPresetId === preset.id 
                            ? 'bg-white text-black' 
                            : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700/50'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Preset Dialog */}
              {showSaveDialog && (
                <div className="px-4 py-3 bg-green-500/5 border-b border-green-500/20">
                  <p className="text-[10px] text-green-400 uppercase mb-2">Guardar configuración actual</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="Nombre del preset..."
                      className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-green-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSavePreset}
                      disabled={!newPresetName.trim() || isSaving}
                      className="px-4 py-2 bg-green-500 text-black rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-400 transition-all"
                    >
                      {isSaving ? '...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => { setShowSaveDialog(false); setNewPresetName(''); }}
                      className="px-3 py-2 bg-neutral-800 text-neutral-400 rounded-lg text-sm hover:bg-neutral-700 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Preset Locked Sliders Info Banner */}
              {lockedSliders.length > 0 && selectedPresetId && (
                <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2">
                  <Lock size={12} className="text-yellow-500 flex-shrink-0" />
                  <p className="text-[10px] text-yellow-400">
                    Este preset tiene <span className="font-bold">{lockedSliders.length} slider{lockedSliders.length > 1 ? 's' : ''} bloqueado{lockedSliders.length > 1 ? 's' : ''}</span> para mantener el estilo
                  </p>
                </div>
              )}

              {/* Pillar tabs */}
              {showSliders && (
                <div className="px-4 py-2 border-b border-neutral-800/50">
                  <div className="flex items-center gap-1">
                    {pillars.map(pillarKey => {
                      const pillar = PILLAR_CONFIG[pillarKey];
                      const Icon = pillar.icon;
                      const activeCount = countActiveInPillar(pillarKey);
                      const isActive = activePillar === pillarKey;
                      
                      return (
                        <button
                          key={pillarKey}
                          onClick={() => setActivePillar(pillarKey)}
                          data-testid={`pillar-tab-${pillarKey}`}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-medium transition-all ${
                            isActive 
                              ? 'ring-1' 
                              : 'text-neutral-500 hover:bg-neutral-800/50'
                          }`}
                          style={isActive ? { 
                            backgroundColor: pillar.color === 'cyan' ? 'rgba(6,182,212,0.15)' : 
                                           pillar.color === 'pink' ? 'rgba(236,72,153,0.15)' : 
                                           'rgba(245,158,11,0.15)',
                            color: pillar.color === 'cyan' ? '#22d3ee' : 
                                   pillar.color === 'pink' ? '#f472b6' : 
                                   '#fbbf24',
                            borderColor: pillar.color === 'cyan' ? 'rgba(6,182,212,0.3)' : 
                                        pillar.color === 'pink' ? 'rgba(236,72,153,0.3)' : 
                                        'rgba(245,158,11,0.3)'
                          } : {}}
                        >
                          <Icon size={12} />
                          {pillar.label}
                          {activeCount > 0 && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded-full">
                              {activeCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sliders for active pillar */}
              {showSliders && (
                <div className="px-4 py-3 space-y-1.5">
                  {PILLAR_CONFIG[activePillar].sliders
                    .filter(s => visibleSliders.includes(s.name))
                    .map(slider => {
                      const value = sliderValues[activePillar]?.[slider.name] ?? 5;
                      const isLocked = lockedSliders.includes(slider.name);
                      
                      return (
                        <CompactSlider
                          key={slider.name}
                          label={slider.label}
                          value={value}
                          locked={isLocked}
                          color={PILLAR_CONFIG[activePillar].color}
                          onChange={(v) => updateSlider(activePillar, slider.name, v)}
                        />
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-900/50">
          <button
            onClick={handleConfirm}
            disabled={!hasEnoughTokens}
            data-testid="generate-button"
            className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${
              hasEnoughTokens 
                ? 'bg-white text-black hover:bg-neutral-200 active:scale-[0.98]' 
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            Generar • {tokensRequired} tokens
          </button>
          {!hasEnoughTokens && (
            <p className="text-[9px] text-red-400 text-center mt-1.5">
              Tokens insuficientes (tienes {userTokens})
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedConfigModal;
