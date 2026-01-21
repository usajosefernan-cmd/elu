import React, { useState, useEffect } from 'react';
import { X, Lock, Zap, Sparkles, Camera, Sun, Palette, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { getSystemPresets, SmartPreset } from '../services/smartPresetsService';

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
      <span className={`text-[8px] w-12 truncate ${locked ? 'text-neutral-600' : 'text-neutral-400'}`}>
        {label}
      </span>
      {locked && <Lock size={8} className="text-neutral-600 flex-shrink-0" />}
      <div className="flex-1 relative h-4 flex items-center">
        <div className="absolute inset-x-0 h-1 bg-neutral-800 rounded-full" />
        <div 
          className={`absolute left-0 h-1 rounded-full transition-all ${locked ? 'bg-neutral-700' : colorClasses[color]}`}
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
        {/* Thumb indicator */}
        <div 
          className={`absolute w-2.5 h-2.5 rounded-full border-2 transform -translate-x-1/2 transition-all
            ${locked ? 'bg-neutral-700 border-neutral-600' : `${colorClasses[color]} border-white`}
            ${!locked && 'group-hover:scale-125'}
          `}
          style={{ left: `${value * 10}%` }}
        />
      </div>
      <span className={`text-[9px] w-3 text-right font-mono ${
        value >= 9 ? 'text-red-400' : value >= 7 ? 'text-amber-400' : locked ? 'text-neutral-600' : 'text-neutral-400'
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
  onConfirm,
  onCancel,
  tokensRequired,
  userTokens,
}) => {
  // State
  const [activeProfile, setActiveProfile] = useState<'auto' | 'user' | 'pro' | 'prolux'>(userProfile);
  const [intensity, setIntensity] = useState(2);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [activePillar, setActivePillar] = useState<PillarKey>('photoscaler');
  const [sliderValues, setSliderValues] = useState<Record<string, Record<string, number>>>({
    photoscaler: {},
    stylescaler: {},
    lightscaler: {}
  });
  const [presets, setPresets] = useState<SmartPreset[]>([]);

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
    } else {
      // Default values
      const defaults: Record<string, Record<string, number>> = { photoscaler: {}, stylescaler: {}, lightscaler: {} };
      for (const [pillar, config] of Object.entries(PILLAR_CONFIG)) {
        for (const slider of config.sliders) {
          defaults[pillar][slider.name] = 5;
        }
      }
      setSliderValues(defaults);
    }
  }, [analysis?.auto_settings]);

  // When preset is selected, load its locked values
  useEffect(() => {
    if (selectedPresetId) {
      const preset = presets.find(p => p.id === selectedPresetId);
      if (preset) {
        const lockedSliders = PRESET_LOCKED_SLIDERS[selectedPresetId] || [];
        const presetConfig = preset.slider_values;
        
        setSliderValues(prev => {
          const updated = { ...prev };
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
      lightscaler: { sliders: Object.entries(finalValues.lightescaler).map(([name, value]) => ({ name, value })) }
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

  // Count active sliders per pillar
  const countActiveInPillar = (pillarKey: PillarKey): number => {
    const pillar = PILLAR_CONFIG[pillarKey];
    return pillar.sliders.filter(s => {
      const val = sliderValues[pillarKey]?.[s.name] ?? 5;
      return val !== 5 && visibleSliders.includes(s.name);
    }).length;
  };

  // Pillar tabs
  const pillars: PillarKey[] = ['photoscaler', 'stylescaler', 'lightscaler'];
  const currentPillarIndex = pillars.indexOf(activePillar);

  const navigatePillar = (direction: -1 | 1) => {
    const newIndex = (currentPillarIndex + direction + 3) % 3;
    setActivePillar(pillars[newIndex]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2" data-testid="unified-config-modal">
      <div className="absolute inset-0 bg-black/95" onClick={onCancel} />
      
      <div className="relative bg-neutral-950 border border-neutral-800 w-full max-w-lg rounded-xl overflow-hidden flex flex-col shadow-2xl" style={{ maxHeight: '85vh' }}>
        
        {/* Header con imagen y categoría */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
          <img src={imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover ring-1 ring-white/10" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">{category}</span>
              {tech?.has_person && <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">Persona</span>}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-neutral-500">
              <span>R:{tech?.noise_level ?? '?'}</span>
              <span>B:{tech?.blur_level ?? '?'}</span>
              {tech?.face_count && <span>Caras:{tech.face_count}</span>}
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
              {/* Presets */}
              <div className="px-4 py-3 border-b border-neutral-800/50">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-2">Preset base</p>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setSelectedPresetId(null)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-medium transition-all ${
                      !selectedPresetId 
                        ? 'bg-white text-black' 
                        : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700/50'
                    }`}
                  >
                    Manual
                  </button>
                  {Object.entries(PRESET_NAMES).map(([id, name]) => (
                    <button
                      key={id}
                      onClick={() => setSelectedPresetId(id)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-medium transition-all ${
                        selectedPresetId === id 
                          ? 'bg-white text-black' 
                          : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700/50'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pillar tabs */}
              {showSliders && (
                <div className="px-4 py-2 border-b border-neutral-800/50">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => navigatePillar(-1)}
                      className="p-1.5 hover:bg-neutral-800 rounded-lg"
                    >
                      <ChevronLeft size={14} className="text-neutral-500" />
                    </button>
                    
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
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-all ${
                            isActive 
                              ? `bg-${pillar.color}-500/20 text-${pillar.color}-400 ring-1 ring-${pillar.color}-500/30` 
                              : 'text-neutral-500 hover:bg-neutral-800/50'
                          }`}
                          style={isActive ? { 
                            backgroundColor: pillar.color === 'cyan' ? 'rgba(6,182,212,0.15)' : 
                                           pillar.color === 'pink' ? 'rgba(236,72,153,0.15)' : 
                                           'rgba(245,158,11,0.15)',
                            color: pillar.color === 'cyan' ? '#22d3ee' : 
                                   pillar.color === 'pink' ? '#f472b6' : 
                                   '#fbbf24'
                          } : {}}
                        >
                          <Icon size={12} />
                          {pillar.label}
                          {activeCount > 0 && (
                            <span className="text-[8px] px-1 py-0.5 bg-white/10 rounded">
                              {activeCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    
                    <button 
                      onClick={() => navigatePillar(1)}
                      className="p-1.5 hover:bg-neutral-800 rounded-lg"
                    >
                      <ChevronRight size={14} className="text-neutral-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* Sliders for active pillar - ALL VISIBLE AT ONCE */}
              {showSliders && (
                <div className="px-4 py-3 space-y-2">
                  {PILLAR_CONFIG[activePillar].sliders
                    .filter(s => visibleSliders.includes(s.name))
                    .map(slider => {
                      const value = sliderValues[activePillar]?.[slider.name] ?? 5;
                      const locked = isSliderLocked(slider.name);
                      
                      return (
                        <CompactSlider
                          key={slider.name}
                          label={slider.label}
                          value={value}
                          locked={locked}
                          color={PILLAR_CONFIG[activePillar].color}
                          onChange={(v) => updateSlider(activePillar, slider.name, v)}
                        />
                      );
                    })}
                  
                  {/* Quick stats */}
                  <div className="pt-2 mt-2 border-t border-neutral-800/50 flex justify-between text-[9px] text-neutral-600">
                    <span>
                      {PILLAR_CONFIG[activePillar].sliders.filter(s => visibleSliders.includes(s.name)).length} sliders
                    </span>
                    <span>
                      {selectedPresetId && `${(PRESET_LOCKED_SLIDERS[selectedPresetId] || []).length} bloqueados`}
                    </span>
                  </div>
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
