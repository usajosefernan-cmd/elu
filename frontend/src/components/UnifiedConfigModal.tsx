import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
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
  onConfirm: (config: { mode: 'auto' | 'preset' | 'manual'; settings: any; customIntent?: string }) => void;
  onCancel: () => void;
  tokensRequired: number;
  userTokens: number;
}

// ===========================================
// SLIDER DEFINITIONS
// ===========================================
const PILLAR_CONFIG = {
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

const INTENSITY_LEVELS = [
  { key: 'minimal', label: 'Mínimo', mult: 0.3 },
  { key: 'subtle', label: 'Sutil', mult: 0.6 },
  { key: 'balanced', label: 'Balanceado', mult: 1.0 },
  { key: 'strong', label: 'Fuerte', mult: 1.3 },
  { key: 'maximum', label: 'Máximo', mult: 1.6 },
];

const PRESET_NAMES: Record<string, string> = {
  'preset_natural': 'Natural',
  'preset_editorial': 'Editorial',
  'preset_cinematic': 'Cine',
  'preset_portrait_pro': 'Retrato',
  'preset_real_estate': 'Inmueble',
  'preset_restoration': 'Restaurar'
};

// ===========================================
// HELPERS
// ===========================================
const applyMultiplier = (config: any, mult: number) => {
  const apply = (sliders: Array<{ name: string; value: number }>) =>
    sliders.map(s => ({ name: s.name, value: Math.min(10, Math.max(0, Math.round(s.value * mult))) }));
  
  return {
    photoscaler: { sliders: apply(config?.photoscaler?.sliders || []) },
    stylescaler: { sliders: apply(config?.stylescaler?.sliders || []) },
    lightscaler: { sliders: apply(config?.lightscaler?.sliders || []) }
  };
};

const autoSettingsToConfig = (autoSettings: any) => ({
  photoscaler: { sliders: Object.entries(autoSettings?.photoscaler || {}).map(([name, value]) => ({ name, value: value as number })) },
  stylescaler: { sliders: Object.entries(autoSettings?.stylescaler || {}).map(([name, value]) => ({ name, value: value as number })) },
  lightscaler: { sliders: Object.entries(autoSettings?.lightscaler || {}).map(([name, value]) => ({ name, value: value as number })) }
});

// ===========================================
// COMPONENT
// ===========================================
export const UnifiedConfigModal: React.FC<UnifiedConfigModalProps> = ({
  isVisible,
  imageUrl,
  analysis,
  onConfirm,
  onCancel,
  tokensRequired,
  userTokens,
}) => {
  // Mode: auto | preset | manual
  const [mode, setMode] = useState<'auto' | 'preset' | 'manual'>('auto');
  
  // Auto mode state
  const [intensity, setIntensity] = useState(2); // index into INTENSITY_LEVELS
  
  // Preset mode state
  const [presets, setPresets] = useState<SmartPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  
  // Manual mode state - 27 sliders
  const [manualConfig, setManualConfig] = useState<Record<string, Record<string, number>>>({
    photoscaler: {},
    stylescaler: {},
    lightscaler: {}
  });
  
  // UI state
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [expandedPillar, setExpandedPillar] = useState<string | null>('photoscaler');

  // Load presets
  useEffect(() => {
    getSystemPresets().then(setPresets);
  }, []);

  // Initialize manual config from auto_settings
  useEffect(() => {
    if (analysis?.auto_settings) {
      setManualConfig({
        photoscaler: { ...analysis.auto_settings.photoscaler },
        stylescaler: { ...analysis.auto_settings.stylescaler },
        lightscaler: { ...analysis.auto_settings.lightscaler }
      });
    }
  }, [analysis?.auto_settings]);

  if (!isVisible) return null;

  const hasEnoughTokens = userTokens >= tokensRequired;
  const tech = analysis?.technical_diagnosis;
  const production = analysis?.production_analysis;
  const alerts = analysis?.protocol_alerts || [];
  const category = analysis?.category || 'GENERAL';
  const identityLock = analysis?.category_rules?.identity_lock === 'strict';

  // Build final config based on mode
  const getFinalConfig = () => {
    if (mode === 'auto') {
      const baseConfig = autoSettingsToConfig(analysis?.auto_settings);
      return applyMultiplier(baseConfig, INTENSITY_LEVELS[intensity].mult);
    } else if (mode === 'preset' && selectedPresetId) {
      const preset = presets.find(p => p.id === selectedPresetId);
      if (preset) return presetToSliderConfig(preset);
    } else if (mode === 'manual') {
      return {
        photoscaler: { sliders: Object.entries(manualConfig.photoscaler).map(([name, value]) => ({ name, value })) },
        stylescaler: { sliders: Object.entries(manualConfig.stylescaler).map(([name, value]) => ({ name, value })) },
        lightscaler: { sliders: Object.entries(manualConfig.lightscaler).map(([name, value]) => ({ name, value })) }
      };
    }
    return autoSettingsToConfig(analysis?.auto_settings);
  };

  const handleConfirm = () => {
    const settings = getFinalConfig();
    onConfirm({ mode, settings });
  };

  const updateSlider = (pillar: string, sliderName: string, value: number) => {
    setManualConfig(prev => ({
      ...prev,
      [pillar]: { ...prev[pillar], [sliderName]: value }
    }));
  };

  const canConfirm = hasEnoughTokens && (mode !== 'preset' || selectedPresetId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/90" onClick={onCancel} />
      
      <div className="relative bg-neutral-950 border border-neutral-800 w-full max-w-md rounded-lg overflow-hidden flex flex-col" style={{ maxHeight: '88vh' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <img src={imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
            <div>
              <p className="text-xs font-medium text-white">{category}</p>
              {identityLock && <p className="text-[10px] text-neutral-500">Identidad protegida</p>}
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-neutral-800 rounded">
            <X size={16} className="text-neutral-400" />
          </button>
        </div>

        {/* Alert */}
        {alerts.length > 0 && (
          <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800">
            <p className="text-[11px] text-neutral-400">{alerts[0]}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Analysis Section - Collapsible */}
          <div className="border-b border-neutral-800">
            <button 
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-neutral-900/50"
            >
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Análisis</span>
              {showAnalysis ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
            </button>
            
            {showAnalysis && (
              <div className="px-4 pb-3 space-y-2">
                {production && (
                  <div className="space-y-1">
                    <p className="text-[11px] text-neutral-300">{production.target_vision}</p>
                    {production.gaps_detected && production.gaps_detected.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {production.gaps_detected.slice(0, 3).map((gap, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-neutral-800 text-neutral-400 text-[10px] rounded">
                            {gap.split(':')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {tech && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <div className="text-center">
                      <p className="text-[10px] text-neutral-500">Ruido</p>
                      <p className="text-xs font-medium text-neutral-300">{tech.noise_level}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-neutral-500">Blur</p>
                      <p className="text-xs font-medium text-neutral-300">{tech.blur_level}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-neutral-500">Comp.</p>
                      <p className="text-xs font-medium text-neutral-300">{tech.composition_score || 5}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-neutral-500">Luz</p>
                      <p className="text-xs font-medium text-neutral-300">{tech.lighting_type || 'natural'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mode Selector */}
          <div className="px-4 py-3 border-b border-neutral-800">
            <div className="flex rounded-md overflow-hidden border border-neutral-700">
              {(['auto', 'preset', 'manual'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-[11px] font-medium uppercase tracking-wide transition-colors ${
                    mode === m 
                      ? 'bg-white text-black' 
                      : 'bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  {m === 'auto' ? 'Auto' : m === 'preset' ? 'Preset' : 'Manual'}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Content */}
          <div className="px-4 py-3">
            
            {/* AUTO MODE */}
            {mode === 'auto' && (
              <div className="space-y-3">
                <p className="text-[11px] text-neutral-500">Intensidad de procesamiento</p>
                <div className="flex gap-1">
                  {INTENSITY_LEVELS.map((level, idx) => (
                    <button
                      key={level.key}
                      onClick={() => setIntensity(idx)}
                      className={`flex-1 py-2 rounded text-[10px] font-medium transition-colors ${
                        intensity === idx 
                          ? 'bg-white text-black' 
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-600">
                  Multiplicador: x{INTENSITY_LEVELS[intensity].mult}
                </p>
              </div>
            )}

            {/* PRESET MODE */}
            {mode === 'preset' && (
              <div className="space-y-2">
                <p className="text-[11px] text-neutral-500">Selecciona un preset</p>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`py-3 px-2 rounded text-[11px] font-medium transition-colors ${
                        selectedPresetId === preset.id 
                          ? 'bg-white text-black' 
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {PRESET_NAMES[preset.id] || preset.name}
                    </button>
                  ))}
                </div>
                {selectedPresetId && (
                  <p className="text-[10px] text-neutral-500 pt-1">
                    {presets.find(p => p.id === selectedPresetId)?.narrative_anchor}
                  </p>
                )}
              </div>
            )}

            {/* MANUAL MODE - 27 Sliders */}
            {mode === 'manual' && (
              <div className="space-y-1">
                {(Object.keys(PILLAR_CONFIG) as Array<keyof typeof PILLAR_CONFIG>).map(pillarKey => {
                  const pillar = PILLAR_CONFIG[pillarKey];
                  const isExpanded = expandedPillar === pillarKey;
                  
                  return (
                    <div key={pillarKey} className="border border-neutral-800 rounded">
                      <button
                        onClick={() => setExpandedPillar(isExpanded ? null : pillarKey)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-neutral-900/50"
                      >
                        <span className="text-[11px] font-medium text-neutral-300">{pillar.label}</span>
                        {isExpanded ? <ChevronUp size={12} className="text-neutral-500" /> : <ChevronDown size={12} className="text-neutral-500" />}
                      </button>
                      
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2">
                          {pillar.sliders.map(slider => {
                            const value = manualConfig[pillarKey]?.[slider.name] ?? 5;
                            return (
                              <div key={slider.name} className="flex items-center gap-3">
                                <span className="text-[10px] text-neutral-500 w-16 flex-shrink-0">{slider.label}</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  value={value}
                                  onChange={(e) => updateSlider(pillarKey, slider.name, parseInt(e.target.value))}
                                  className="flex-1 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                                <span className="text-[10px] text-neutral-400 w-5 text-right font-mono">{value}</span>
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
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-950">
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`w-full py-2.5 rounded text-sm font-medium transition-colors ${
              canConfirm 
                ? 'bg-white text-black hover:bg-neutral-200' 
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            Generar ({tokensRequired} tokens)
          </button>
          {!hasEnoughTokens && (
            <p className="text-[10px] text-neutral-500 text-center mt-1.5">
              Tokens insuficientes ({userTokens} disponibles)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedConfigModal;
