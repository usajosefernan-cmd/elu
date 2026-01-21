import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Sliders, Crown, Zap, Lock, 
  Camera, Palette, Sun, ChevronDown, ChevronUp
} from 'lucide-react';
import { LuxMixer, LuxConfig } from '../types';

// =====================================================
// TYPES
// =====================================================
export type UserProfileType = 'auto' | 'user' | 'pro' | 'prolux';

interface ProfileInfo {
  key: UserProfileType;
  name: string;
  icon: React.ReactNode;
  color: string;
  requiredTokens: number;
}

const PROFILES: ProfileInfo[] = [
  { key: 'auto', name: 'AUTO', icon: <Sparkles className="w-4 h-4" />, color: 'emerald', requiredTokens: 0 },
  { key: 'user', name: 'USER', icon: <Sliders className="w-4 h-4" />, color: 'blue', requiredTokens: 200 },
  { key: 'pro', name: 'PRO', icon: <Crown className="w-4 h-4" />, color: 'purple', requiredTokens: 1000 },
  { key: 'prolux', name: 'PROLUX', icon: <Zap className="w-4 h-4" />, color: 'yellow', requiredTokens: 5000 },
];

// =====================================================
// SLIDER DEFINITIONS - Los 27 sliders organizados
// =====================================================
const SLIDERS = {
  photoscaler: [
    { key: 'limpieza_artefactos', name: 'Limpieza' },
    { key: 'geometria', name: 'Geometría' },
    { key: 'optica', name: 'Óptica' },
    { key: 'chronos', name: 'Movimiento' },
    { key: 'senal_raw', name: 'Rango Din.' },
    { key: 'sintesis_adn', name: 'Síntesis' },
    { key: 'grano_filmico', name: 'Grano' },
    { key: 'enfoque', name: 'Nitidez' },
    { key: 'resolucion', name: 'Resolución' }
  ],
  stylescaler: [
    { key: 'styling_piel', name: 'Piel' },
    { key: 'styling_pelo', name: 'Pelo' },
    { key: 'styling_ropa', name: 'Ropa' },
    { key: 'maquillaje', name: 'Maquillaje' },
    { key: 'limpieza_entorno', name: 'Entorno' },
    { key: 'reencuadre_ia', name: 'Encuadre' },
    { key: 'atmosfera', name: 'Atmósfera' },
    { key: 'look_cine', name: 'Cine' },
    { key: 'materiales_pbr', name: 'Materiales' }
  ],
  lightscaler: [
    { key: 'key_light', name: 'Key Light' },
    { key: 'fill_light', name: 'Fill Light' },
    { key: 'rim_light', name: 'Rim Light' },
    { key: 'volumetria', name: 'Volumetría' },
    { key: 'temperatura', name: 'Temperatura' },
    { key: 'contraste', name: 'Contraste' },
    { key: 'sombras', name: 'Sombras' },
    { key: 'estilo_autor', name: 'Estilo' },
    { key: 'reflejos', name: 'Reflejos' }
  ]
};

// =====================================================
// COMPACT SLIDER COMPONENT
// =====================================================
const CompactSlider: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => {
  const color = value <= 3 ? 'bg-gray-500' : value <= 6 ? 'bg-blue-500' : value <= 8 ? 'bg-purple-500' : 'bg-amber-500';
  
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-16 text-[10px] text-gray-400 truncate">{label}</span>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500"
      />
      <div className="flex gap-0.5">
        {[1, 5, 10].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`w-5 h-5 rounded text-[8px] font-bold transition-all ${
              value === v ? `${color} text-white` : 'bg-white/5 text-gray-500 hover:bg-white/10'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <span className="w-5 text-[10px] font-mono text-amber-500 text-right">{value}</span>
    </div>
  );
};

// =====================================================
// PILLAR GROUP COMPONENT
// =====================================================
const PillarGroup: React.FC<{
  name: string;
  icon: React.ReactNode;
  color: string;
  sliders: { key: string; name: string }[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  showAll?: boolean;
}> = ({ name, icon, color, sliders, values, onChange, collapsed, onToggle, showAll = true }) => {
  const avg = Math.round(sliders.reduce((sum, s) => sum + (values[s.key] || 5), 0) / sliders.length);
  
  const setAllInPillar = (v: number) => {
    sliders.forEach(s => onChange(s.key, v));
  };

  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={color}>{icon}</div>
          <span className="text-xs font-bold text-white uppercase">{name}</span>
          <span className="text-[10px] text-gray-500">avg: {avg}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 5, 10].map(v => (
              <button
                key={v}
                onClick={(e) => { e.stopPropagation(); setAllInPillar(v); }}
                className="w-5 h-5 rounded text-[8px] font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                {v}
              </button>
            ))}
          </div>
          {collapsed !== undefined && (
            collapsed ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronUp className="w-3 h-3 text-gray-500" />
          )}
        </div>
      </button>
      
      {(!collapsed || showAll) && (
        <div className="px-3 py-1.5 bg-black/20 space-y-0">
          {sliders.map(s => (
            <CompactSlider
              key={s.key}
              label={s.name}
              value={values[s.key] || 5}
              onChange={(v) => onChange(s.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// =====================================================
// UNIFIED SLIDER UI FOR ALL PROFILES
// =====================================================
const SliderUI: React.FC<{
  mode: UserProfileType;
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  onSetAll: (v: number) => void;
}> = ({ mode, values, onChange, onSetAll }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    photoscaler: mode === 'user',
    stylescaler: mode === 'user', 
    lightscaler: mode === 'user'
  });

  // Para USER: solo mostrar promedio de cada pilar
  // Para PRO: mostrar pilares expandibles
  // Para PROLUX: mostrar todo expandido

  const togglePillar = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-2">
      {/* Quick actions */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500 uppercase">Ajuste rápido:</span>
        <div className="flex gap-1">
          {[1, 3, 5, 7, 10].map(v => (
            <button
              key={v}
              onClick={() => onSetAll(v)}
              className="px-2 py-1 text-[9px] font-bold bg-white/5 text-gray-400 rounded hover:bg-white/10 hover:text-white"
            >
              {v === 1 ? 'MIN' : v === 10 ? 'MAX' : v}
            </button>
          ))}
        </div>
      </div>

      {/* Pillar groups */}
      <PillarGroup
        name="PhotoScaler"
        icon={<Camera className="w-3.5 h-3.5" />}
        color="text-cyan-400"
        sliders={SLIDERS.photoscaler}
        values={values}
        onChange={onChange}
        collapsed={mode === 'user' ? collapsed.photoscaler : false}
        onToggle={mode !== 'prolux' ? () => togglePillar('photoscaler') : undefined}
        showAll={mode === 'prolux' || !collapsed.photoscaler}
      />

      <PillarGroup
        name="StyleScaler"
        icon={<Palette className="w-3.5 h-3.5" />}
        color="text-pink-400"
        sliders={SLIDERS.stylescaler}
        values={values}
        onChange={onChange}
        collapsed={mode === 'user' ? collapsed.stylescaler : false}
        onToggle={mode !== 'prolux' ? () => togglePillar('stylescaler') : undefined}
        showAll={mode === 'prolux' || !collapsed.stylescaler}
      />

      <PillarGroup
        name="LightScaler"
        icon={<Sun className="w-3.5 h-3.5" />}
        color="text-orange-400"
        sliders={SLIDERS.lightscaler}
        values={values}
        onChange={onChange}
        collapsed={mode === 'user' ? collapsed.lightscaler : false}
        onToggle={mode !== 'prolux' ? () => togglePillar('lightscaler') : undefined}
        showAll={mode === 'prolux' || !collapsed.lightscaler}
      />
    </div>
  );
};

// =====================================================
// MAIN MODAL COMPONENT
// =====================================================
interface ProfileConfigModalProps {
  isVisible: boolean;
  currentProfile: UserProfileType;
  availableTokens: number;
  totalTokensPurchased: number;
  imageUrl: string;
  initialMixer?: LuxMixer;
  initialSuggestedSettings?: Record<string, number>;
  onConfirm: (config: LuxConfig) => void;
  onCancel: () => void;
  onUpgrade: () => void;
}

export const ProfileConfigModal: React.FC<ProfileConfigModalProps> = ({
  isVisible,
  currentProfile,
  availableTokens,
  totalTokensPurchased,
  imageUrl,
  initialMixer,
  initialSuggestedSettings,
  onConfirm,
  onCancel,
  onUpgrade
}) => {
  const [selectedProfile, setSelectedProfile] = useState<UserProfileType>(currentProfile);
  
  // Initialize slider values from auto_settings or defaults
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    const defaultVal = 5;
    
    // Set all sliders to default first
    [...SLIDERS.photoscaler, ...SLIDERS.stylescaler, ...SLIDERS.lightscaler].forEach(s => {
      initial[s.key] = defaultVal;
    });
    
    // Override with auto_settings if available
    if (initialSuggestedSettings) {
      Object.entries(initialSuggestedSettings).forEach(([pillar, vals]) => {
        if (typeof vals === 'object') {
          Object.entries(vals as Record<string, number>).forEach(([k, v]) => {
            initial[k] = v;
          });
        }
      });
    }
    
    return initial;
  });

  useEffect(() => {
    setSelectedProfile(currentProfile);
  }, [currentProfile]);

  if (!isVisible) return null;

  const updateSlider = (key: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [key]: value }));
  };

  const setAllSliders = (value: number) => {
    const newValues: Record<string, number> = {};
    Object.keys(sliderValues).forEach(k => { newValues[k] = value; });
    setSliderValues(newValues);
  };

  const canAccessProfile = (profile: UserProfileType): boolean => {
    const profileInfo = PROFILES.find(p => p.key === profile);
    if (!profileInfo) return false;
    return totalTokensPurchased >= profileInfo.requiredTokens;
  };

  const handleGenerate = () => {
    // Build slider config
    const buildPillar = (sliders: { key: string; name: string }[]) => ({
      sliders: sliders.map(s => ({ name: s.key, value: sliderValues[s.key] || 5 }))
    });

    const sliderConfig = {
      photoscaler: buildPillar(SLIDERS.photoscaler),
      stylescaler: buildPillar(SLIDERS.stylescaler),
      lightscaler: buildPillar(SLIDERS.lightscaler),
    };

    // Calculate mixer values from sliders
    const avgPhoto = Math.round(SLIDERS.photoscaler.reduce((sum, s) => sum + (sliderValues[s.key] || 5), 0) / 9);
    const avgStyle = Math.round(SLIDERS.stylescaler.reduce((sum, s) => sum + (sliderValues[s.key] || 5), 0) / 9);
    const avgLight = Math.round(SLIDERS.lightscaler.reduce((sum, s) => sum + (sliderValues[s.key] || 5), 0) / 9);

    onConfirm({
      userPrompt: '',
      mode: selectedProfile.toUpperCase() as any,
      selectedPresetId: JSON.stringify(sliderConfig),
      mixer: {
        stylism: avgStyle,
        atrezzo: sliderValues.limpieza_entorno || 5,
        skin_bio: sliderValues.styling_piel || 5,
        lighting: avgLight,
        restoration: avgPhoto,
        upScaler: selectedProfile === 'prolux' ? 4 : selectedProfile === 'pro' ? 2 : 1
      }
    });
  };

  const tokenCost = selectedProfile === 'auto' ? 10 : selectedProfile === 'user' ? 15 : selectedProfile === 'pro' ? 25 : 50;
  const hasEnoughTokens = availableTokens >= tokenCost;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onCancel} />
      
      <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex flex-col">
        
        {/* Header con imagen */}
        <div className="relative h-20 overflow-hidden flex-shrink-0">
          <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <button
            onClick={onCancel}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black/50 rounded-full text-white/60 hover:text-white text-xs"
          >
            ✕
          </button>
          <div className="absolute bottom-2 left-3">
            <span className="text-[10px] text-gray-400">Configuración de perfil</span>
          </div>
        </div>

        {/* Profile tabs */}
        <div className="flex border-b border-white/5 flex-shrink-0">
          {PROFILES.map(p => {
            const isLocked = !canAccessProfile(p.key);
            const isSelected = selectedProfile === p.key;
            const colorClass = p.color === 'emerald' ? 'text-emerald-400' : 
                              p.color === 'blue' ? 'text-blue-400' : 
                              p.color === 'purple' ? 'text-purple-400' : 'text-amber-400';
            
            return (
              <button
                key={p.key}
                onClick={() => !isLocked && setSelectedProfile(p.key)}
                disabled={isLocked}
                className={`flex-1 py-2 px-1 flex flex-col items-center gap-0.5 transition-all relative ${
                  isSelected 
                    ? `bg-white/5 ${colorClass}` 
                    : isLocked 
                      ? 'opacity-40 cursor-not-allowed text-gray-600' 
                      : 'text-gray-500 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                {isLocked && <Lock className="w-2.5 h-2.5 absolute top-1 right-1" />}
                <div className={isSelected ? colorClass : ''}>{p.icon}</div>
                <span className="text-[9px] font-bold uppercase">{p.name}</span>
                {isSelected && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  p.color === 'emerald' ? 'bg-emerald-400' : 
                  p.color === 'blue' ? 'bg-blue-400' : 
                  p.color === 'purple' ? 'bg-purple-400' : 'bg-amber-400'
                }`} />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {selectedProfile === 'auto' ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Modo Automático</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                La IA aplicará la mejor configuración basada en el análisis de tu imagen.
              </p>
            </div>
          ) : (
            <SliderUI
              mode={selectedProfile}
              values={sliderValues}
              onChange={updateSlider}
              onSetAll={setAllSliders}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-black/40 flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={!hasEnoughTokens}
            className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              hasEnoughTokens
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-90'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Generar · {tokenCost} tokens
          </button>
          {!hasEnoughTokens && (
            <p className="text-[10px] text-red-400 text-center mt-1">
              Tokens insuficientes ({availableTokens} disponibles)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileConfigModal;
