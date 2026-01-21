import React, { useState, useEffect } from 'react';
import { 
  X, Wand2, Edit3, Zap, AlertTriangle, Shield, 
  Bookmark, Wrench, Sparkles, Palette, Camera, Film, User, Home,
  Eye, Thermometer, Focus, Users, Aperture, Sun
} from 'lucide-react';
import { getSystemPresets, SmartPreset, presetToSliderConfig } from '../services/smartPresetsService';

// ===========================================
// TYPES
// ===========================================
interface VisionAnalysis {
  category?: string;
  category_confidence?: number;
  category_rules?: {
    priority_sliders: string[];
    max_reencuadre: number;
    identity_lock: string;
  };
  production_analysis?: {
    current_quality: string;
    target_vision: string;
    gaps_detected?: string[];
  };
  intents_detected?: string[];
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
    dominant_colors?: string[];
  };
  semantic_anchors?: string[];
  protocol_alerts?: string[];
  aspect_ratio?: number;
}

interface VisionConfirmModalProps {
  isVisible: boolean;
  imageUrl: string;
  analysis: VisionAnalysis | null;
  onConfirm: (config: { mode: 'auto' | 'intent' | 'custom'; intentIndex?: number; customIntent?: string; settings?: any }) => void;
  onCustomize: () => void;
  onCancel: () => void;
  tokensRequired: number;
  userTokens: number;
}

// ===========================================
// CONSTANTS
// ===========================================
type IntentLevel = 'fix' | 'polished' | 'creative' | 'stylized' | 'aggressive';

const INTENT_CONFIG: Record<IntentLevel, { label: string; desc: string; color: string; mult: number }> = {
  fix: { label: 'FIX', desc: 'Mínimo', color: 'emerald', mult: 0.3 },
  polished: { label: 'PULIDO', desc: 'Pro', color: 'blue', mult: 0.6 },
  creative: { label: 'CREATIVO', desc: 'Arte', color: 'purple', mult: 1.0 },
  stylized: { label: 'ESTILO', desc: 'Look', color: 'amber', mult: 1.3 },
  aggressive: { label: 'RADICAL', desc: 'Total', color: 'red', mult: 1.6 },
};

const CATEGORY_COLORS: Record<string, string> = {
  SELFIE: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  PORTRAIT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  GROUP: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  REAL_ESTATE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PRODUCT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  FOOD: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  LANDSCAPE: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  OTHER: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

const CATEGORY_TO_PRESET: Record<string, string> = {
  SELFIE: 'preset_portrait_pro',
  PORTRAIT: 'preset_portrait_pro',
  GROUP: 'preset_natural',
  REAL_ESTATE: 'preset_real_estate',
  PRODUCT: 'preset_editorial',
  FOOD: 'preset_editorial',
  LANDSCAPE: 'preset_cinematic',
  EVENT: 'preset_natural',
  DOCUMENT: 'preset_restoration',
  PET: 'preset_natural',
  ART: 'preset_cinematic',
  OTHER: 'preset_natural'
};

const PRESET_ICONS: Record<string, React.ReactNode> = {
  'preset_natural': <Sparkles size={12} className="text-emerald-400" />,
  'preset_editorial': <Camera size={12} className="text-purple-400" />,
  'preset_cinematic': <Film size={12} className="text-amber-400" />,
  'preset_portrait_pro': <User size={12} className="text-pink-400" />,
  'preset_real_estate': <Home size={12} className="text-cyan-400" />,
  'preset_restoration': <Wrench size={12} className="text-orange-400" />
};

// ===========================================
// HELPER
// ===========================================
const applyIntentToSliders = (config: any, intent: IntentLevel) => {
  const mult = INTENT_CONFIG[intent].mult;
  const apply = (sliders: Array<{ name: string; value: number }>) =>
    sliders.map(s => ({ name: s.name, value: Math.min(10, Math.max(0, Math.round(s.value * mult))) }));
  
  return {
    photoscaler: { sliders: apply(config?.photoscaler?.sliders || []) },
    stylescaler: { sliders: apply(config?.stylescaler?.sliders || []) },
    lightscaler: { sliders: apply(config?.lightscaler?.sliders || []) }
  };
};

// Mini progress bar
const MiniBar: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => (
  <div className="flex items-center gap-2">
    <span className="text-[9px] text-gray-500 w-16">{label}</span>
    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${(value / 10) * 100}%` }} />
    </div>
    <span className="text-[9px] text-gray-400 w-4 text-right">{value}</span>
  </div>
);

// ===========================================
// COMPONENT
// ===========================================
export const VisionConfirmModal: React.FC<VisionConfirmModalProps> = ({
  isVisible,
  imageUrl,
  analysis,
  onConfirm,
  onCustomize,
  onCancel,
  tokensRequired,
  userTokens,
}) => {
  const [mode, setMode] = useState<'auto' | 'preset' | 'custom'>('auto');
  const [intentLevel, setIntentLevel] = useState<IntentLevel>('creative');
  const [customIntent, setCustomIntent] = useState('');
  const [allPresets, setAllPresets] = useState<SmartPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<SmartPreset | null>(null);
  const [suggestedPresetId, setSuggestedPresetId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const presets = await getSystemPresets();
      setAllPresets(presets);
    };
    load();
  }, []);

  useEffect(() => {
    if (analysis?.category && allPresets.length > 0) {
      const suggestedId = CATEGORY_TO_PRESET[analysis.category] || 'preset_natural';
      setSuggestedPresetId(suggestedId);
      if (mode === 'preset' && !selectedPreset) {
        const preset = allPresets.find(p => p.id === suggestedId);
        if (preset) setSelectedPreset(preset);
      }
    }
  }, [analysis?.category, allPresets, mode]);

  if (!isVisible) return null;

  const hasEnoughTokens = userTokens >= tokensRequired;
  const category = analysis?.category || 'OTHER';
  const tech = analysis?.technical_diagnosis;
  const autoSettings = analysis?.auto_settings;
  const protocolAlerts = analysis?.protocol_alerts || [];
  const identityLock = analysis?.category_rules?.identity_lock === 'strict';
  const production = analysis?.production_analysis;

  const handleGenerate = () => {
    let finalSettings: any;
    
    if (mode === 'auto') {
      const autoConfig = {
        photoscaler: { sliders: Object.entries(autoSettings?.photoscaler || {}).map(([name, value]) => ({ name, value: value as number })) },
        stylescaler: { sliders: Object.entries(autoSettings?.stylescaler || {}).map(([name, value]) => ({ name, value: value as number })) },
        lightscaler: { sliders: Object.entries(autoSettings?.lightscaler || {}).map(([name, value]) => ({ name, value: value as number })) }
      };
      finalSettings = applyIntentToSliders(autoConfig, intentLevel);
    } else if (mode === 'preset' && selectedPreset) {
      // PRESET mode: use preset values directly WITHOUT intensity modifier
      finalSettings = presetToSliderConfig(selectedPreset);
    } else if (mode === 'custom' && customIntent.trim()) {
      onConfirm({ mode: 'custom', customIntent: customIntent.trim() });
      return;
    }
    
    onConfirm({ 
      mode: mode === 'preset' ? 'intent' : 'auto', 
      settings: finalSettings,
      customIntent: selectedPreset?.narrative_anchor
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onCancel} />
      
      <div className="relative bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        
        {/* ===== HEADER ===== */}
        <div className="relative h-14 flex-shrink-0">
          <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
          <button onClick={onCancel} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70">
            <X size={14} className="text-white/70" />
          </button>
          <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5">
            <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 border text-[9px] font-bold ${CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER}`}>
              {category}
            </div>
            {identityLock && (
              <div className="px-1.5 py-0.5 bg-red-500/20 border border-red-500/30 rounded-full flex items-center gap-1">
                <Shield size={8} className="text-red-400" />
                <span className="text-[7px] font-bold text-red-400">ID LOCK</span>
              </div>
            )}
          </div>
        </div>

        {/* ===== PROTOCOL ALERTS ===== */}
        {protocolAlerts.length > 0 && (
          <div className="px-2.5 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex-shrink-0">
            <div className="flex items-start gap-1.5">
              <AlertTriangle size={10} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-300">{protocolAlerts[0]}</p>
            </div>
          </div>
        )}

        {/* ===== SCROLLABLE CONTENT ===== */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-0">
          
          {/* ===== VISION ANALYSIS - TODOS LOS DATOS ===== */}
          <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Eye size={12} className="text-cyan-400" />
              <span className="text-[10px] text-cyan-400 uppercase font-bold">Análisis de Visión</span>
            </div>
            
            {/* Production Analysis */}
            {production && (
              <div className="space-y-1">
                <p className="text-[9px] text-gray-300">
                  <span className="text-gray-500">Estado:</span> {production.current_quality}
                </p>
                <p className="text-[9px] text-white font-medium">
                  <span className="text-gray-500">Objetivo:</span> {production.target_vision}
                </p>
                {production.gaps_detected && production.gaps_detected.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {production.gaps_detected.map((gap, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[8px] rounded">
                        {gap.split(':')[0] || gap}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Technical Diagnosis */}
            {tech && (
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <p className="text-[8px] text-gray-500 uppercase">Diagnóstico Técnico</p>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <MiniBar value={tech.noise_level || 0} label="Ruido" color={tech.noise_level > 6 ? 'bg-red-500' : tech.noise_level > 3 ? 'bg-yellow-500' : 'bg-green-500'} />
                  <MiniBar value={tech.blur_level || 0} label="Blur" color={tech.blur_level > 6 ? 'bg-red-500' : tech.blur_level > 3 ? 'bg-yellow-500' : 'bg-green-500'} />
                  <MiniBar value={tech.composition_score || 5} label="Composición" color="bg-purple-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 w-16">Exposición</span>
                    <span className={`text-[9px] font-bold ${
                      tech.exposure_issues === 'none' ? 'text-green-400' : 
                      tech.exposure_issues === 'underexposed' ? 'text-blue-400' : 'text-orange-400'
                    }`}>
                      {tech.exposure_issues === 'none' ? 'OK' : tech.exposure_issues === 'underexposed' ? 'Oscura' : 'Clara'}
                    </span>
                  </div>
                </div>
                
                {/* Additional info */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tech.has_person && (
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] rounded flex items-center gap-1">
                      <Users size={8} /> {tech.face_count || 1} persona{(tech.face_count || 1) > 1 ? 's' : ''}
                    </span>
                  )}
                  {tech.lighting_type && (
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[8px] rounded flex items-center gap-1">
                      <Sun size={8} /> {tech.lighting_type}
                    </span>
                  )}
                  {tech.dominant_colors && tech.dominant_colors.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-pink-500/20 text-pink-400 text-[8px] rounded flex items-center gap-1">
                      <Palette size={8} /> {tech.dominant_colors.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Auto Settings Summary */}
            {autoSettings && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-[8px] text-gray-500 uppercase mb-1">Configuración Sugerida (AUTO)</p>
                <p className="text-[9px] text-emerald-400 font-medium">{autoSettings.primary_intent_used}</p>
              </div>
            )}
          </div>

          {/* ===== MODE SELECTOR ===== */}
          <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg">
            {[
              { key: 'auto', icon: <Zap size={10} />, label: 'AUTO' },
              { key: 'preset', icon: <Bookmark size={10} />, label: 'PRESET' },
              { key: 'custom', icon: <Edit3 size={10} />, label: 'CUSTOM' }
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key as any)}
                className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center gap-1 text-[9px] font-bold transition-all ${
                  mode === m.key 
                    ? 'bg-amber-500 text-black' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {/* ===== AUTO MODE: Intensity Spectrum ===== */}
          {mode === 'auto' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">MODO AUTOMÁTICO</span>
              </div>
              
              <p className="text-[9px] text-gray-400">Intensidad de transformación:</p>
              
              <div className="flex gap-0.5">
                {(Object.keys(INTENT_CONFIG) as IntentLevel[]).map(key => {
                  const cfg = INTENT_CONFIG[key];
                  const isSelected = intentLevel === key;
                  const colorClasses: Record<string, string> = {
                    emerald: 'bg-emerald-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
                    amber: 'bg-amber-500', red: 'bg-red-500'
                  };
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setIntentLevel(key)}
                      className={`flex-1 py-1.5 px-0.5 rounded text-center transition-all ${
                        isSelected ? `${colorClasses[cfg.color]} text-white` : 'bg-white/5 text-gray-500 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-[8px] font-bold block">{cfg.label}</span>
                      {isSelected && <span className="text-[6px] opacity-75">{cfg.desc}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== PRESET MODE: Grid only, NO intensity ===== */}
          {mode === 'preset' && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Bookmark size={12} className="text-purple-400" />
                <span className="text-[10px] font-bold text-purple-400">PRESETS</span>
                {suggestedPresetId && (
                  <span className="text-[8px] text-gray-500">• Sugerido: {allPresets.find(p => p.id === suggestedPresetId)?.name}</span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                {allPresets.map(preset => {
                  const isSelected = selectedPreset?.id === preset.id;
                  const isSuggested = preset.id === suggestedPresetId;
                  
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset)}
                      className={`p-1.5 rounded-lg border transition-all text-left ${
                        isSelected 
                          ? 'bg-purple-500/30 border-purple-400 ring-1 ring-purple-400/30' 
                          : isSuggested
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {PRESET_ICONS[preset.id]}
                        <span className={`text-[8px] font-bold truncate ${isSelected ? 'text-purple-300' : 'text-gray-300'}`}>
                          {preset.name.split(' ')[0]}
                        </span>
                      </div>
                      {isSuggested && !isSelected && (
                        <span className="text-[6px] text-amber-400">★</span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {selectedPreset && (
                <p className="text-[9px] text-gray-400 pt-1 border-t border-white/5">
                  {selectedPreset.narrative_anchor}
                </p>
              )}
            </div>
          )}

          {/* ===== CUSTOM MODE ===== */}
          {mode === 'custom' && (
            <div className="bg-slate-500/10 border border-slate-500/20 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Edit3 size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400">DESCRIPCIÓN PERSONALIZADA</span>
              </div>
              <textarea
                value={customIntent}
                onChange={(e) => setCustomIntent(e.target.value)}
                placeholder="Describe el look que quieres lograr..."
                className="w-full h-16 px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div className="p-2.5 border-t border-white/5 bg-black/40 flex-shrink-0 space-y-1.5">
          <button
            onClick={handleGenerate}
            disabled={!hasEnoughTokens || (mode === 'custom' && !customIntent.trim()) || (mode === 'preset' && !selectedPreset)}
            className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              hasEnoughTokens && (mode !== 'custom' || customIntent.trim()) && (mode !== 'preset' || selectedPreset)
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-90'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Wand2 size={14} />
            Generar · {tokensRequired} tokens
          </button>
          
          <button
            onClick={onCustomize}
            className="w-full py-1 text-[9px] text-gray-500 hover:text-amber-400 transition-colors"
          >
            Control avanzado (27 sliders)
          </button>

          {!hasEnoughTokens && (
            <p className="text-[8px] text-red-400 text-center">
              Tokens insuficientes ({userTokens} disponibles)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisionConfirmModal;
