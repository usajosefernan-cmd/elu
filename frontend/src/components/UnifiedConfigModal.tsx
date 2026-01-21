import React, { useState, useEffect } from 'react';
import { X, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { getSystemPresets, SmartPreset, presetToSliderConfig } from '../services/smartPresetsService';

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
  onConfirm: (config: { mode: string; settings: any; preset?: string }) => void;
  onCancel: () => void;
  tokensRequired: number;
  userTokens: number;
}

// ===========================================
// SLIDER DEFINITIONS
// ===========================================
type PillarKey = 'photoscaler' | 'stylescaler' | 'lightscaler';

const PILLAR_CONFIG: Record<PillarKey, { label: string; sliders: { name: string; label: string }[] }> = {
  photoscaler: {
    label: 'Imagen',
    sliders: [
      { name: 'limpieza_artefactos', label: 'Limpieza' },
      { name: 'geometria', label: 'Geometría' },
      { name: 'optica', label: 'Óptica' },
      { name: 'chronos', label: 'Movimiento' },
      { name: 'senal_raw', label: 'Rango Din.' },
      { name: 'sintesis_adn', label: 'Textura' },
      { name: 'grano_filmico', label: 'Grano' },
      { name: 'enfoque', label: 'Enfoque' },
      { name: 'resolucion', label: 'Escala' },
    ]
  },
  stylescaler: {
    label: 'Estilo',
    sliders: [
      { name: 'styling_piel', label: 'Piel' },
      { name: 'styling_pelo', label: 'Cabello' },
      { name: 'styling_ropa', label: 'Ropa' },
      { name: 'maquillaje', label: 'Maquillaje' },
      { name: 'limpieza_entorno', label: 'Fondo' },
      { name: 'reencuadre_ia', label: 'Encuadre' },
      { name: 'atmosfera', label: 'Atmósfera' },
      { name: 'look_cine', label: 'Cinema' },
      { name: 'materiales_pbr', label: 'Materiales' },
    ]
  },
  lightscaler: {
    label: 'Luz',
    sliders: [
      { name: 'key_light', label: 'Principal' },
      { name: 'fill_light', label: 'Relleno' },
      { name: 'rim_light', label: 'Contorno' },
      { name: 'volumetria', label: 'Volumen' },
      { name: 'temperatura', label: 'Temp.' },
      { name: 'contraste', label: 'Contraste' },
      { name: 'sombras', label: 'Sombras' },
      { name: 'estilo_autor', label: 'Estilo' },
      { name: 'reflejos', label: 'Brillo' },
    ]
  }
};

// Sliders visibles por perfil de usuario
const PROFILE_VISIBLE_SLIDERS: Record<string, string[]> = {
  auto: [], // AUTO no muestra sliders, solo intensidad
  user: ['limpieza_artefactos', 'enfoque', 'styling_piel', 'limpieza_entorno', 'key_light', 'contraste'], // 6 básicos
  pro: [
    'limpieza_artefactos', 'geometria', 'optica', 'enfoque', 'resolucion',
    'styling_piel', 'styling_pelo', 'limpieza_entorno', 'atmosfera', 'look_cine',
    'key_light', 'fill_light', 'contraste', 'temperatura', 'estilo_autor'
  ], // 15 sliders
  prolux: 'all' // Todos los 27
};

// Presets con sliders bloqueados
const PRESET_LOCKED_SLIDERS: Record<string, string[]> = {
  'preset_natural': ['grano_filmico', 'look_cine', 'atmosfera'],
  'preset_editorial': ['look_cine', 'styling_piel', 'styling_pelo', 'contraste'],
  'preset_cinematic': ['look_cine', 'grano_filmico', 'atmosfera', 'contraste', 'estilo_autor'],
  'preset_portrait_pro': ['styling_piel', 'styling_pelo', 'maquillaje', 'key_light', 'fill_light'],
  'preset_real_estate': ['geometria', 'limpieza_entorno', 'key_light', 'fill_light'],
  'preset_restoration': ['limpieza_artefactos', 'enfoque', 'sintesis_adn', 'resolucion']
};

const PRESET_NAMES: Record<string, string> = {
  'preset_natural': 'Natural',
  'preset_editorial': 'Editorial',
  'preset_cinematic': 'Cine',
  'preset_portrait_pro': 'Retrato',
  'preset_real_estate': 'Inmueble',
  'preset_restoration': 'Restaurar'
};

const INTENSITY_LEVELS = [
  { key: 'minimal', label: 'Mínimo', mult: 0.3 },
  { key: 'subtle', label: 'Sutil', mult: 0.6 },
  { key: 'balanced', label: 'Normal', mult: 1.0 },
  { key: 'strong', label: 'Fuerte', mult: 1.3 },
  { key: 'maximum', label: 'Máximo', mult: 1.6 },
];

// ===========================================
// COMPONENT
// ===========================================
export const UnifiedConfigModal: React.FC<UnifiedConfigModalProps> = ({
  isVisible,
  imageUrl,
  analysis,
  userProfile = 'auto',
  onConfirm,
  onCancel,
  tokensRequired,
  userTokens,
}) => {
  // State
  const [activeProfile, setActiveProfile] = useState<'auto' | 'user' | 'pro' | 'prolux'>(userProfile);
  const [intensity, setIntensity] = useState(2);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [sliderValues, setSliderValues] = useState<Record<string, Record<string, number>>>({
    photoscaler: {},
    stylescaler: {},
    lightscaler: {}
  });
  const [presets, setPresets] = useState<SmartPreset[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [expandedPillar, setExpandedPillar] = useState<PillarKey | null>(null);

  // Load presets
  useEffect(() => {
    getSystemPresets().then(setPresets);
  }, []);

  // Initialize slider values from analysis
  useEffect(() => {
    if (analysis?.auto_settings) {
      setSliderValues({
        photoscaler: { ...analysis.auto_settings.photoscaler },
        stylescaler: { ...analysis.auto_settings.stylescaler },
        lightscaler: { ...analysis.auto_settings.lightscaler }
      });
    }
  }, [analysis?.auto_settings]);

  // When preset is selected, load its values for locked sliders
  useEffect(() => {
    if (selectedPresetId) {
      const preset = presets.find(p => p.id === selectedPresetId);
      if (preset) {
        const lockedSliders = PRESET_LOCKED_SLIDERS[selectedPresetId] || [];
        const presetConfig = preset.slider_values;
        
        setSliderValues(prev => {
          const updated = { ...prev };
          // Only update locked sliders from preset
          for (const pillar of ['photoscaler', 'stylescaler', 'lightscaler'] as PillarKey[]) {
            updated[pillar] = { ...prev[pillar] };
            for (const [sliderName, value] of Object.entries(presetConfig[pillar] || {})) {
              if (lockedSliders.includes(sliderName)) {
                updated[pillar][sliderName] = value;
              }
            }
          }
          return updated;
        });
      }
    }
  }, [selectedPresetId, presets]);

  if (!isVisible) return null;

  const hasEnoughTokens = userTokens >= tokensRequired;
  const tech = analysis?.technical_diagnosis;
  const production = analysis?.production_analysis;
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

  // Check if slider is locked by preset
  const isSliderLocked = (sliderName: string): boolean => {
    if (!selectedPresetId) return false;
    return (PRESET_LOCKED_SLIDERS[selectedPresetId] || []).includes(sliderName);
  };

  // Update slider value
  const updateSlider = (pillar: PillarKey, sliderName: string, value: number) => {
    if (isSliderLocked(sliderName)) return;
    setSliderValues(prev => ({
      ...prev,
      [pillar]: { ...prev[pillar], [sliderName]: value }
    }));
  };

  // Build final config
  const buildFinalConfig = () => {
    let finalValues = { ...sliderValues };
    
    // Apply intensity multiplier for AUTO mode
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
    console.log('[LuxScaler] Profile:', activeProfile);
    console.log('[LuxScaler] Preset:', selectedPresetId);
    console.log('[LuxScaler] Settings:', JSON.stringify(settings).slice(0, 500));
    onConfirm({ 
      mode: activeProfile.toUpperCase(), 
      settings,
      preset: selectedPresetId || undefined
    });
  };

  const visibleSliders = getVisibleSliders();
  const showSliders = activeProfile !== 'auto' && visibleSliders.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-black/90" onClick={onCancel} />
      
      <div className="relative bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-lg overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <img src={imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
            <div>
              <p className="text-xs font-medium text-neutral-200">{category}</p>
              <p className="text-[10px] text-neutral-500">{production?.target_vision?.slice(0, 40) || 'Procesamiento profesional'}...</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-neutral-800 rounded">
            <X size={16} className="text-neutral-400" />
          </button>
        </div>

        {/* Alert */}
        {alerts.length > 0 && (
          <div className="px-4 py-2 bg-neutral-900/50 border-b border-neutral-800">
            <p className="text-[10px] text-neutral-400">{alerts[0]}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Analysis Toggle */}
          {tech && (
            <div className="border-b border-neutral-800">
              <button 
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full px-4 py-2 flex items-center justify-between hover:bg-neutral-900/30"
              >
                <span className="text-[10px] text-neutral-500 uppercase tracking-wide">Diagnóstico</span>
                <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                  <span>R:{tech.noise_level}</span>
                  <span>B:{tech.blur_level}</span>
                  <span>C:{tech.composition_score || 5}</span>
                  {showAnalysis ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </button>
              {showAnalysis && production?.gaps_detected && (
                <div className="px-4 pb-2 flex flex-wrap gap-1">
                  {production.gaps_detected.map((gap, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-neutral-800 text-neutral-400 text-[9px] rounded">
                      {gap.split(':')[0]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Selector */}
          <div className="px-4 py-3 border-b border-neutral-800">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-2">Modo</p>
            <div className="flex rounded overflow-hidden border border-neutral-700">
              {(['auto', 'user', 'pro', 'prolux'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setActiveProfile(p)}
                  className={`flex-1 py-2 text-[10px] font-medium uppercase tracking-wide transition-colors ${
                    activeProfile === p 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* AUTO: Intensity */}
          {activeProfile === 'auto' && (
            <div className="px-4 py-3 border-b border-neutral-800">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-2">Intensidad</p>
              <div className="flex gap-1">
                {INTENSITY_LEVELS.map((level, idx) => (
                  <button
                    key={level.key}
                    onClick={() => setIntensity(idx)}
                    className={`flex-1 py-2 rounded text-[9px] font-medium transition-colors ${
                      intensity === idx 
                        ? 'bg-white text-black' 
                        : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Presets (available for all modes except auto) */}
          {activeProfile !== 'auto' && (
            <div className="px-4 py-3 border-b border-neutral-800">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-2">
                Preset base <span className="text-neutral-600">(opcional)</span>
              </p>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setSelectedPresetId(null)}
                  className={`px-3 py-1.5 rounded text-[9px] font-medium transition-colors ${
                    !selectedPresetId 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  Ninguno
                </button>
                {presets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`px-3 py-1.5 rounded text-[9px] font-medium transition-colors ${
                      selectedPresetId === preset.id 
                        ? 'bg-white text-black' 
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {PRESET_NAMES[preset.id] || preset.name}
                  </button>
                ))}
              </div>
              {selectedPresetId && (
                <p className="text-[9px] text-neutral-500 mt-2">
                  Sliders bloqueados: {(PRESET_LOCKED_SLIDERS[selectedPresetId] || []).length}
                </p>
              )}
            </div>
          )}

          {/* Sliders (for USER, PRO, PROLUX) */}
          {showSliders && (
            <div className="px-4 py-3">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-2">Ajustes</p>
              
              {(Object.keys(PILLAR_CONFIG) as PillarKey[]).map(pillarKey => {
                const pillar = PILLAR_CONFIG[pillarKey];
                const pillarSliders = pillar.sliders.filter(s => visibleSliders.includes(s.name));
                
                if (pillarSliders.length === 0) return null;
                
                const isExpanded = expandedPillar === pillarKey;
                
                return (
                  <div key={pillarKey} className="mb-1 border border-neutral-800 rounded overflow-hidden">
                    <button
                      onClick={() => setExpandedPillar(isExpanded ? null : pillarKey)}
                      className="w-full px-3 py-2 flex items-center justify-between bg-neutral-900/30 hover:bg-neutral-900/50"
                    >
                      <span className="text-[10px] font-medium text-neutral-300">{pillar.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-neutral-600">{pillarSliders.length}</span>
                        {isExpanded ? <ChevronUp size={12} className="text-neutral-500" /> : <ChevronDown size={12} className="text-neutral-500" />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-3 py-2 space-y-2 bg-neutral-950">
                        {pillarSliders.map(slider => {
                          const value = sliderValues[pillarKey]?.[slider.name] ?? 5;
                          const locked = isSliderLocked(slider.name);
                          
                          return (
                            <div key={slider.name} className="flex items-center gap-2">
                              <span className={`text-[9px] w-14 flex-shrink-0 ${locked ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                {slider.label}
                              </span>
                              {locked && <Lock size={8} className="text-neutral-600 flex-shrink-0" />}
                              <input
                                type="range"
                                min="0"
                                max="10"
                                value={value}
                                disabled={locked}
                                onChange={(e) => updateSlider(pillarKey, slider.name, parseInt(e.target.value))}
                                className={`flex-1 h-1 rounded-full appearance-none cursor-pointer
                                  ${locked ? 'bg-neutral-800' : 'bg-neutral-700'}
                                  [&::-webkit-slider-thumb]:appearance-none 
                                  [&::-webkit-slider-thumb]:w-2.5 
                                  [&::-webkit-slider-thumb]:h-2.5 
                                  [&::-webkit-slider-thumb]:rounded-full
                                  ${locked 
                                    ? '[&::-webkit-slider-thumb]:bg-neutral-600' 
                                    : '[&::-webkit-slider-thumb]:bg-white'
                                  }
                                `}
                              />
                              <span className={`text-[9px] w-4 text-right font-mono ${locked ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                {value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-950">
          <button
            onClick={handleConfirm}
            disabled={!hasEnoughTokens}
            className={`w-full py-2.5 rounded text-xs font-medium transition-colors ${
              hasEnoughTokens 
                ? 'bg-white text-black hover:bg-neutral-200' 
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            Generar ({tokensRequired} tokens)
          </button>
          {!hasEnoughTokens && (
            <p className="text-[9px] text-neutral-500 text-center mt-1.5">
              Tokens insuficientes ({userTokens})
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedConfigModal;
