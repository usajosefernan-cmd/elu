import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Sliders, Crown, Zap, Lock, 
  Camera, Palette, Sun, HelpCircle, Info
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
  desc: string;
}

const PROFILES: ProfileInfo[] = [
  { key: 'auto', name: 'AUTO', icon: <Sparkles className="w-4 h-4" />, color: 'emerald', requiredTokens: 0, desc: 'IA decide todo' },
  { key: 'user', name: 'USER', icon: <Sliders className="w-4 h-4" />, color: 'blue', requiredTokens: 200, desc: '3 controles simples' },
  { key: 'pro', name: 'PRO', icon: <Crown className="w-4 h-4" />, color: 'purple', requiredTokens: 1000, desc: '9 grupos temáticos' },
  { key: 'prolux', name: 'PROLUX', icon: <Zap className="w-4 h-4" />, color: 'amber', requiredTokens: 5000, desc: '27 sliders completos' },
];

// =====================================================
// SLIDER DEFINITIONS con nombres amigables y descripciones
// =====================================================
const SLIDERS = {
  photoscaler: {
    label: 'Calidad de Imagen',
    emoji: '📷',
    color: 'cyan',
    items: [
      { key: 'limpieza_artefactos', name: 'Limpieza', desc: 'Elimina ruido, manchas y artefactos de compresión' },
      { key: 'geometria', name: 'Geometría', desc: 'Corrige distorsiones y endereza líneas' },
      { key: 'optica', name: 'Lente', desc: 'Simula calidad de lentes profesionales' },
      { key: 'chronos', name: 'Nitidez Mov.', desc: 'Reduce desenfoque por movimiento' },
      { key: 'senal_raw', name: 'Rango', desc: 'Recupera detalles en sombras y luces' },
      { key: 'sintesis_adn', name: 'Detalle', desc: 'Genera texturas de alta resolución' },
      { key: 'grano_filmico', name: 'Grano', desc: 'Añade textura cinematográfica' },
      { key: 'enfoque', name: 'Enfoque', desc: 'Aumenta la definición de bordes' },
      { key: 'resolucion', name: 'Escala', desc: 'Aumenta la resolución de la imagen' }
    ]
  },
  stylescaler: {
    label: 'Estilo Visual',
    emoji: '🎨',
    color: 'pink',
    items: [
      { key: 'styling_piel', name: 'Piel', desc: 'Suaviza y perfecciona la textura de piel' },
      { key: 'styling_pelo', name: 'Cabello', desc: 'Mejora brillo y definición del pelo' },
      { key: 'styling_ropa', name: 'Ropa', desc: 'Mejora texturas de telas y vestimenta' },
      { key: 'maquillaje', name: 'Makeup', desc: 'Realza o añade maquillaje sutil' },
      { key: 'limpieza_entorno', name: 'Fondo', desc: 'Limpia y mejora el entorno' },
      { key: 'reencuadre_ia', name: 'Encuadre', desc: 'Ajusta composición automáticamente' },
      { key: 'atmosfera', name: 'Atmósfera', desc: 'Añade profundidad ambiental' },
      { key: 'look_cine', name: 'Cinema', desc: 'Aplica estética cinematográfica' },
      { key: 'materiales_pbr', name: 'Texturas', desc: 'Mejora realismo de materiales' }
    ]
  },
  lightscaler: {
    label: 'Iluminación',
    emoji: '☀️',
    color: 'orange',
    items: [
      { key: 'key_light', name: 'Principal', desc: 'Luz principal del sujeto' },
      { key: 'fill_light', name: 'Relleno', desc: 'Suaviza sombras duras' },
      { key: 'rim_light', name: 'Contorno', desc: 'Luz de borde/separación' },
      { key: 'volumetria', name: 'Volumen', desc: 'Crea sensación de profundidad' },
      { key: 'temperatura', name: 'Temp.', desc: 'Cálido (amarillo) o frío (azul)' },
      { key: 'contraste', name: 'Contraste', desc: 'Diferencia entre luces y sombras' },
      { key: 'sombras', name: 'Sombras', desc: 'Intensidad de áreas oscuras' },
      { key: 'estilo_autor', name: 'Autor', desc: 'Estilo de iluminación artístico' },
      { key: 'reflejos', name: 'Reflejos', desc: 'Brillos y highlights especulares' }
    ]
  }
};

// PRO Macros - agrupaciones conceptuales
const PRO_MACROS = {
  photoscaler: [
    { key: 'restauracion', name: 'Restauración', desc: 'Limpieza y reparación general', sliders: ['limpieza_artefactos', 'geometria', 'chronos'] },
    { key: 'fidelidad', name: 'Fidelidad', desc: 'Detalle y resolución', sliders: ['resolucion', 'enfoque', 'sintesis_adn', 'senal_raw'] },
    { key: 'caracter', name: 'Carácter', desc: 'Textura cinematográfica', sliders: ['grano_filmico', 'optica'] }
  ],
  stylescaler: [
    { key: 'presencia', name: 'Presencia', desc: 'Retoque de persona', sliders: ['styling_piel', 'styling_pelo', 'maquillaje'] },
    { key: 'pulido', name: 'Pulido', desc: 'Limpieza de escena', sliders: ['styling_ropa', 'limpieza_entorno', 'reencuadre_ia'] },
    { key: 'cinematica', name: 'Cinemática', desc: 'Look de película', sliders: ['look_cine', 'atmosfera', 'materiales_pbr'] }
  ],
  lightscaler: [
    { key: 'volumen', name: 'Volumen', desc: 'Luces principales', sliders: ['key_light', 'fill_light', 'reflejos'] },
    { key: 'drama', name: 'Drama', desc: 'Contraste dramático', sliders: ['contraste', 'sombras', 'rim_light'] },
    { key: 'ambiente', name: 'Ambiente', desc: 'Atmósfera de luz', sliders: ['volumetria', 'temperatura', 'estilo_autor'] }
  ]
};

// =====================================================
// TOOLTIP COMPONENT
// =====================================================
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <div className="group relative inline-flex">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black border border-white/20 rounded text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      {text}
    </div>
  </div>
);

// =====================================================
// COMPACT SLIDER with tooltip
// =====================================================
const SliderWithTooltip: React.FC<{
  name: string;
  desc: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}> = ({ name, desc, value, onChange, color }) => {
  const bgColor = color === 'cyan' ? 'bg-cyan-500' : color === 'pink' ? 'bg-pink-500' : 'bg-orange-500';
  
  return (
    <div className="flex items-center gap-2 py-0.5 group">
      <Tooltip text={desc}>
        <span className="w-14 text-[9px] text-gray-400 truncate cursor-help flex items-center gap-0.5">
          {name}
          <HelpCircle size={8} className="opacity-0 group-hover:opacity-50" />
        </span>
      </Tooltip>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500`}
      />
      <div className="flex gap-px">
        {[1, 5, 10].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`w-4 h-4 rounded text-[7px] font-bold transition-all ${
              value === v ? `${bgColor} text-white` : 'bg-white/5 text-gray-600 hover:bg-white/10'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <span className="w-4 text-[9px] font-mono text-amber-500 text-right">{value}</span>
    </div>
  );
};

// =====================================================
// USER UI - Simple: 3 pilares, 1 control cada uno
// =====================================================
const UserUI: React.FC<{
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}> = ({ values, onChange }) => {
  // Promedios por pilar
  const getAvg = (pillar: 'photoscaler' | 'stylescaler' | 'lightscaler') => {
    const items = SLIDERS[pillar].items;
    return Math.round(items.reduce((sum, s) => sum + (values[s.key] || 5), 0) / items.length);
  };

  const setAll = (pillar: 'photoscaler' | 'stylescaler' | 'lightscaler', val: number) => {
    SLIDERS[pillar].items.forEach(s => onChange(s.key, val));
  };

  const pillars = [
    { key: 'photoscaler' as const, label: 'Calidad', emoji: '📷', color: 'cyan', desc: 'Nitidez, limpieza y resolución' },
    { key: 'stylescaler' as const, label: 'Estilo', emoji: '🎨', color: 'pink', desc: 'Retoque, ambiente y look' },
    { key: 'lightscaler' as const, label: 'Luz', emoji: '☀️', color: 'orange', desc: 'Iluminación y contraste' }
  ];

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-gray-500 text-center">Ajusta la intensidad de cada motor</p>
      
      {pillars.map(p => {
        const avg = getAvg(p.key);
        const bgColor = p.color === 'cyan' ? 'bg-cyan-500' : p.color === 'pink' ? 'bg-pink-500' : 'bg-orange-500';
        const textColor = p.color === 'cyan' ? 'text-cyan-400' : p.color === 'pink' ? 'text-pink-400' : 'text-orange-400';
        
        return (
          <div key={p.key} className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <Tooltip text={p.desc}>
                <div className={`flex items-center gap-2 ${textColor} cursor-help`}>
                  <span className="text-base">{p.emoji}</span>
                  <span className="text-xs font-bold uppercase">{p.label}</span>
                </div>
              </Tooltip>
              <span className="text-sm font-mono font-bold text-white">{avg}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={avg}
              onChange={(e) => setAll(p.key, parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between mt-2">
              {[1, 3, 5, 7, 10].map(v => (
                <button
                  key={v}
                  onClick={() => setAll(p.key, v)}
                  className={`w-8 h-6 rounded text-[9px] font-bold transition-all ${
                    avg === v ? `${bgColor} text-white` : 'bg-white/5 text-gray-500 hover:bg-white/10'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =====================================================
// PRO UI - Medio: 9 macros agrupados por concepto
// =====================================================
const ProUI: React.FC<{
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}> = ({ values, onChange }) => {
  // Calcula promedio de un macro
  const getMacroAvg = (sliderKeys: string[]) => {
    return Math.round(sliderKeys.reduce((sum, k) => sum + (values[k] || 5), 0) / sliderKeys.length);
  };

  const setMacro = (sliderKeys: string[], val: number) => {
    sliderKeys.forEach(k => onChange(k, val));
  };

  const pillars = [
    { key: 'photoscaler', label: 'Calidad', emoji: '📷', color: 'cyan', macros: PRO_MACROS.photoscaler },
    { key: 'stylescaler', label: 'Estilo', emoji: '🎨', color: 'pink', macros: PRO_MACROS.stylescaler },
    { key: 'lightscaler', label: 'Luz', emoji: '☀️', color: 'orange', macros: PRO_MACROS.lightscaler }
  ];

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-500 text-center">9 grupos de control conceptual</p>
      
      {pillars.map(p => {
        const textColor = p.color === 'cyan' ? 'text-cyan-400' : p.color === 'pink' ? 'text-pink-400' : 'text-orange-400';
        const bgColor = p.color === 'cyan' ? 'bg-cyan-500' : p.color === 'pink' ? 'bg-pink-500' : 'bg-orange-500';
        
        return (
          <div key={p.key} className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
            <div className={`flex items-center gap-1.5 mb-2 ${textColor}`}>
              <span className="text-sm">{p.emoji}</span>
              <span className="text-[10px] font-bold uppercase">{p.label}</span>
            </div>
            <div className="space-y-1.5">
              {p.macros.map(m => {
                const avg = getMacroAvg(m.sliders);
                return (
                  <div key={m.key} className="flex items-center gap-2">
                    <Tooltip text={m.desc}>
                      <span className="w-20 text-[9px] text-gray-400 truncate cursor-help">{m.name}</span>
                    </Tooltip>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={avg}
                      onChange={(e) => setMacro(m.sliders, parseInt(e.target.value))}
                      className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex gap-px">
                      {[1, 5, 10].map(v => (
                        <button
                          key={v}
                          onClick={() => setMacro(m.sliders, v)}
                          className={`w-4 h-4 rounded text-[7px] font-bold ${
                            avg === v ? `${bgColor} text-white` : 'bg-white/5 text-gray-600'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <span className="w-4 text-[9px] font-mono text-amber-500">{avg}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =====================================================
// PROLUX UI - Completo: 27 sliders individuales
// =====================================================
const ProluxUI: React.FC<{
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}> = ({ values, onChange }) => {
  const pillars = ['photoscaler', 'stylescaler', 'lightscaler'] as const;
  
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-500 text-center">Control total: 27 parámetros</p>
      
      {pillars.map(pillarKey => {
        const pillar = SLIDERS[pillarKey];
        const textColor = pillar.color === 'cyan' ? 'text-cyan-400' : pillar.color === 'pink' ? 'text-pink-400' : 'text-orange-400';
        
        return (
          <div key={pillarKey} className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
            <div className={`flex items-center gap-1.5 mb-1.5 ${textColor}`}>
              <span className="text-sm">{pillar.emoji}</span>
              <span className="text-[10px] font-bold uppercase">{pillar.label}</span>
            </div>
            <div className="space-y-0">
              {pillar.items.map(s => (
                <SliderWithTooltip
                  key={s.key}
                  name={s.name}
                  desc={s.desc}
                  value={values[s.key] || 5}
                  onChange={(v) => onChange(s.key, v)}
                  color={pillar.color}
                />
              ))}
            </div>
          </div>
        );
      })}
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
  initialSuggestedSettings?: Record<string, any>;
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
  
  // Initialize all 27 sliders
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    
    // Default all to 5
    ['photoscaler', 'stylescaler', 'lightscaler'].forEach(pillar => {
      SLIDERS[pillar as keyof typeof SLIDERS].items.forEach(s => {
        initial[s.key] = 5;
      });
    });
    
    // Override with auto_settings if available
    if (initialSuggestedSettings) {
      ['photoscaler', 'stylescaler', 'lightscaler'].forEach(pillar => {
        const pillarData = initialSuggestedSettings[pillar];
        if (pillarData && typeof pillarData === 'object') {
          Object.entries(pillarData).forEach(([k, v]) => {
            if (typeof v === 'number') initial[k] = v;
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
    return profileInfo ? totalTokensPurchased >= profileInfo.requiredTokens : false;
  };

  const handleGenerate = () => {
    const buildPillar = (pillarKey: keyof typeof SLIDERS) => ({
      sliders: SLIDERS[pillarKey].items.map(s => ({ name: s.key, value: sliderValues[s.key] || 5 }))
    });

    const sliderConfig = {
      photoscaler: buildPillar('photoscaler'),
      stylescaler: buildPillar('stylescaler'),
      lightscaler: buildPillar('lightscaler'),
    };

    const avgPhoto = Math.round(SLIDERS.photoscaler.items.reduce((sum, s) => sum + (sliderValues[s.key] || 5), 0) / 9);
    const avgStyle = Math.round(SLIDERS.stylescaler.items.reduce((sum, s) => sum + (sliderValues[s.key] || 5), 0) / 9);
    const avgLight = Math.round(SLIDERS.lightscaler.items.reduce((sum, s) => sum + (sliderValues[s.key] || 5), 0) / 9);

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
      
      <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md max-h-[85vh] overflow-hidden rounded-xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="relative h-16 flex-shrink-0">
          <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          <button onClick={onCancel} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black/50 rounded-full text-white/60 hover:text-white text-xs">✕</button>
        </div>

        {/* Profile tabs */}
        <div className="flex border-b border-white/5 flex-shrink-0">
          {PROFILES.map(p => {
            const isLocked = !canAccessProfile(p.key);
            const isSelected = selectedProfile === p.key;
            const colors: Record<string, string> = {
              emerald: 'text-emerald-400',
              blue: 'text-blue-400',
              purple: 'text-purple-400',
              amber: 'text-amber-400'
            };
            const bgColors: Record<string, string> = {
              emerald: 'bg-emerald-400',
              blue: 'bg-blue-400',
              purple: 'bg-purple-400',
              amber: 'bg-amber-400'
            };
            
            return (
              <Tooltip key={p.key} text={p.desc}>
                <button
                  onClick={() => !isLocked && setSelectedProfile(p.key)}
                  disabled={isLocked}
                  className={`flex-1 py-2 px-1 flex flex-col items-center gap-0.5 transition-all relative ${
                    isSelected ? `bg-white/5 ${colors[p.color]}` : isLocked ? 'opacity-30 cursor-not-allowed text-gray-600' : 'text-gray-500 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  {isLocked && <Lock className="w-2 h-2 absolute top-1 right-1" />}
                  <div className={isSelected ? colors[p.color] : ''}>{p.icon}</div>
                  <span className="text-[8px] font-bold uppercase">{p.name}</span>
                  {isSelected && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${bgColors[p.color]}`} />}
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-center gap-1 py-2 border-b border-white/5 flex-shrink-0">
          <span className="text-[9px] text-gray-600 mr-1">Todo a:</span>
          {[1, 3, 5, 7, 10].map(v => (
            <button
              key={v}
              onClick={() => setAllSliders(v)}
              className="px-2 py-0.5 text-[8px] font-bold bg-white/5 text-gray-500 rounded hover:bg-white/10 hover:text-white"
            >
              {v}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {selectedProfile === 'auto' ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Modo Automático</h3>
              <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
                La IA aplicará la configuración óptima basada en el análisis de tu imagen.
              </p>
            </div>
          ) : selectedProfile === 'user' ? (
            <UserUI values={sliderValues} onChange={updateSlider} />
          ) : selectedProfile === 'pro' ? (
            <ProUI values={sliderValues} onChange={updateSlider} />
          ) : (
            <ProluxUI values={sliderValues} onChange={updateSlider} />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-black/40 flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={!hasEnoughTokens}
            className={`w-full py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              hasEnoughTokens
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-90'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Generar · {tokenCost} tokens
          </button>
          {!hasEnoughTokens && (
            <p className="text-[9px] text-red-400 text-center mt-1">
              Insuficiente ({availableTokens} disponibles)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileConfigModal;
