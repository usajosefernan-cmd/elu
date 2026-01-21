import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Sliders, Crown, Zap, Lock, ChevronRight, 
  Camera, Palette, Sun, Cpu, Info, AlertCircle
} from 'lucide-react';
import { LuxMixer, LuxConfig } from '../types';

// =====================================================
// PROFILE TYPES & CONSTANTS
// =====================================================
export type UserProfileType = 'auto' | 'user' | 'pro' | 'prolux';

interface ProfileInfo {
  key: UserProfileType;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  requiredTokens: number;
}

const PROFILES: ProfileInfo[] = [
  { 
    key: 'auto', 
    name: 'AUTO', 
    icon: <Sparkles className="w-5 h-5" />,
    description: 'IA decide todo automáticamente',
    color: 'text-emerald-400',
    requiredTokens: 0
  },
  { 
    key: 'user', 
    name: 'USER', 
    icon: <Sliders className="w-5 h-5" />,
    description: '3 controles por pilar',
    color: 'text-blue-400',
    requiredTokens: 200
  },
  { 
    key: 'pro', 
    name: 'PRO', 
    icon: <Crown className="w-5 h-5" />,
    description: '9 macros temáticos',
    color: 'text-purple-400',
    requiredTokens: 1000
  },
  { 
    key: 'prolux', 
    name: 'PROLUX', 
    icon: <Zap className="w-5 h-5" />,
    description: '27 sliders + Code Execution',
    color: 'text-lumen-gold',
    requiredTokens: 5000
  }
];

// =====================================================
// AUTO PROFILE UI - No controls, just AI magic
// =====================================================
const AutoProfileUI: React.FC<{ onConfirm: (config: LuxConfig) => void }> = ({ onConfirm }) => {
  const handleGenerate = () => {
    onConfirm({
      userPrompt: '',
      mode: 'AUTO',
      mixer: {
        stylism: 5,
        atrezzo: 5,
        skin_bio: 5,
        lighting: 5,
        restoration: 5,
        upScaler: 1
      }
    });
  };

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-emerald-400 animate-pulse" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Modo Automático</h3>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Nuestra IA analizará tu imagen y aplicará los mejores ajustes automáticamente.
        Sin configuración necesaria.
      </p>
      <button
        onClick={handleGenerate}
        className="px-8 py-4 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 transition-all text-sm uppercase tracking-widest"
      >
        <Sparkles className="w-4 h-4 inline mr-2" />
        Generar con IA
      </button>
      <p className="text-[10px] text-gray-600 mt-4">
        Costo: 10 tokens · Preview con marca de agua
      </p>
    </div>
  );
};

// =====================================================
// USER PROFILE UI - 3 Pillar Controls
// =====================================================
const UserProfileUI: React.FC<{ 
  onConfirm: (config: LuxConfig) => void;
  initialMixer?: LuxMixer;
}> = ({ onConfirm, initialMixer }) => {
  const [pillars, setPillars] = useState({
    photo: initialMixer?.restoration || 5,
    style: initialMixer?.stylism || 5,
    light: initialMixer?.lighting || 5
  });

  const handleGenerate = () => {
    onConfirm({
      userPrompt: '',
      mode: 'USER',
      mixer: {
        stylism: pillars.style,
        atrezzo: pillars.style,
        skin_bio: pillars.style,
        lighting: pillars.light,
        restoration: pillars.photo,
        upScaler: 1
      }
    });
  };

  const PillarSlider = ({ 
    label, icon, value, onChange, color 
  }: { 
    label: string; 
    icon: React.ReactNode; 
    value: number; 
    onChange: (v: number) => void;
    color: string;
  }) => (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`${color}`}>{icon}</div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-lg font-mono font-bold text-white">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-lumen-gold"
      />
      <div className="flex justify-between text-[9px] text-gray-600 mt-1">
        <span>Sutil</span>
        <span>Intenso</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-1">Control por Pilares</h3>
        <p className="text-xs text-gray-400">Ajusta la intensidad de cada motor</p>
      </div>

      <PillarSlider
        label="PhotoScaler"
        icon={<Camera className="w-4 h-4" />}
        value={pillars.photo}
        onChange={(v) => setPillars(p => ({ ...p, photo: v }))}
        color="text-cyan-400"
      />
      
      <PillarSlider
        label="StyleScaler"
        icon={<Palette className="w-4 h-4" />}
        value={pillars.style}
        onChange={(v) => setPillars(p => ({ ...p, style: v }))}
        color="text-pink-400"
      />
      
      <PillarSlider
        label="LightScaler"
        icon={<Sun className="w-4 h-4" />}
        value={pillars.light}
        onChange={(v) => setPillars(p => ({ ...p, light: v }))}
        color="text-orange-400"
      />

      <button
        onClick={handleGenerate}
        className="w-full mt-6 px-6 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all text-sm uppercase tracking-widest"
      >
        Generar Preview
      </button>
      <p className="text-[10px] text-gray-600 text-center">
        Costo: 15 tokens · Preview sin marca de agua
      </p>
    </div>
  );
};

// =====================================================
// PRO PROFILE UI - 9 Macros Conceptuales (v28)
// Cada macro controla un subset semántico de sliders.
// =====================================================
const PRO_MACROS = {
  photoscaler: [
    {
      key: 'restauracion',
      name: 'Restauración',
      icon: '🛠️',
      sliders: ['limpieza_artefactos', 'geometria', 'chronos'],
    },
    {
      key: 'fidelidad',
      name: 'Fidelidad',
      icon: '🔍',
      sliders: ['resolucion', 'enfoque', 'sintesis_adn', 'senal_raw'],
    },
    {
      key: 'caracter',
      name: 'Carácter',
      icon: '🎞️',
      sliders: ['grano_filmico', 'optica'],
    },
  ],
  stylescaler: [
    {
      key: 'presencia',
      name: 'Presencia',
      icon: '👤',
      sliders: ['styling_piel', 'styling_pelo', 'maquillaje'],
    },
    {
      key: 'pulido',
      name: 'Pulido',
      icon: '🧼',
      sliders: ['styling_ropa', 'limpieza_entorno', 'reencuadre_ia'],
    },
    {
      key: 'cinematica',
      name: 'Cinemática',
      icon: '🎬',
      sliders: ['look_cine', 'atmosfera', 'materiales_pbr'],
    },
  ],
  lightscaler: [
    {
      key: 'volumen',
      name: 'Volumen',
      icon: '📐',
      sliders: ['key_light', 'fill_light', 'reflejos'],
    },
    {
      key: 'drama',
      name: 'Drama',
      icon: '🎭',
      sliders: ['contraste', 'sombras', 'rim_light'],
    },
    {
      key: 'atmosfera',
      name: 'Atmósfera',
      icon: '🌫️',
      sliders: ['volumetria', 'temperatura', 'estilo_autor'],
    },
  ],
} as const;

const ProProfileUI: React.FC<{ 
  onConfirm: (config: LuxConfig) => void;
}> = ({ onConfirm }) => {
  const [macroValues, setMacroValues] = useState<Record<string, number>>({
    restauracion: 5,
    fidelidad: 5,
    caracter: 5,
    presencia: 5,
    pulido: 5,
    cinematica: 5,
    volumen: 5,
    drama: 5,
    atmosfera: 5,
  });

  const allMacros = [
    ...PRO_MACROS.photoscaler,
    ...PRO_MACROS.stylescaler,
    ...PRO_MACROS.lightscaler,
  ];

  const handleGenerate = () => {
    // Build semantic slider config expected by prompt-compiler
    const buildPillar = (pillarKey: keyof typeof PRO_MACROS) => ({
      sliders: PRO_MACROS[pillarKey].flatMap(m =>
        m.sliders.map(s => ({ name: s, value: macroValues[m.key] ?? 0 }))
      )
    });

    const sliderConfig = {
      photoscaler: buildPillar('photoscaler'),
      stylescaler: buildPillar('stylescaler'),
      lightscaler: buildPillar('lightscaler'),
    };

    // We keep LuxConfig as carrier; App.tsx reads config.mode and config.mixer.
    // We'll pass sliderConfig through selectedPresetId to avoid adding new types.
    onConfirm({
      userPrompt: '',
      mode: 'PRO',
      selectedPresetId: JSON.stringify(sliderConfig),
      mixer: {
        stylism: macroValues.cinematica,
        atrezzo: macroValues.pulido,
        skin_bio: macroValues.presencia,
        lighting: Math.round((macroValues.volumen + macroValues.drama + macroValues.atmosfera) / 3),
        restoration: Math.round((macroValues.restauracion + macroValues.fidelidad) / 2),
        upScaler: 2
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white mb-1">PRO · 9 Macros Conceptuales</h3>
        <p className="text-xs text-gray-400">Cada macro controla un subset semántico de sliders</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">PhotoScaler · Motor de Realidad</p>
          {PRO_MACROS.photoscaler.map(m => (
            <div key={m.key} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider">{m.name}</div>
                    <div className="text-[10px] text-gray-500">{m.sliders.join(', ')}</div>
                  </div>
                </div>
                <div className="text-xs font-mono text-lumen-gold w-8 text-right">{macroValues[m.key] ?? 0}</div>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={macroValues[m.key] ?? 0}
                onChange={(e) => setMacroValues(v => ({ ...v, [m.key]: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-lumen-gold"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">StyleScaler · Director de Arte</p>
          {PRO_MACROS.stylescaler.map(m => (
            <div key={m.key} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider">{m.name}</div>
                    <div className="text-[10px] text-gray-500">{m.sliders.join(', ')}</div>
                  </div>
                </div>
                <div className="text-xs font-mono text-lumen-gold w-8 text-right">{macroValues[m.key] ?? 0}</div>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={macroValues[m.key] ?? 0}
                onChange={(e) => setMacroValues(v => ({ ...v, [m.key]: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-lumen-gold"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">LightScaler · Estudio de Luz</p>
          {PRO_MACROS.lightscaler.map(m => (
            <div key={m.key} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider">{m.name}</div>
                    <div className="text-[10px] text-gray-500">{m.sliders.join(', ')}</div>
                  </div>
                </div>
                <div className="text-xs font-mono text-lumen-gold w-8 text-right">{macroValues[m.key] ?? 0}</div>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={macroValues[m.key] ?? 0}
                onChange={(e) => setMacroValues(v => ({ ...v, [m.key]: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-lumen-gold"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className="w-full mt-2 px-6 py-4 bg-lumen-gold text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-widest"
      >
        Generar Preview (PRO)
      </button>
      <p className="text-[10px] text-gray-600 text-center">
        Costo: 15 tokens · Preview sin marca de agua
      </p>
    </div>
  );
};

// =====================================================
// PROLUX PROFILE UI - 27 Sliders
// =====================================================
const SLIDERS_27 = {
  photoscaler: [
    { key: 'limpieza_artefactos', name: 'Limpieza', short: 'CLN' },
    { key: 'grano_filmico', name: 'Grano', short: 'GRN' },
    { key: 'optica_nitidez', name: 'Nitidez', short: 'SHP' },
    { key: 'geometria_distorsion', name: 'Distorsión', short: 'DST' },
    { key: 'reencuadre_ia', name: 'Reencuadre', short: 'FRM' },
    { key: 'desenfoque_movimiento', name: 'Motion', short: 'MOT' },
    { key: 'detalle_texturas', name: 'Texturas', short: 'TXT' },
    { key: 'restauracion_danos', name: 'Restauración', short: 'RST' },
    { key: 'geometria_perspectiva', name: 'Perspectiva', short: 'PRS' }
  ],
  stylescaler: [
    { key: 'vibracion_saturacion', name: 'Saturación', short: 'SAT' },
    { key: 'paleta_tonos', name: 'Tonos', short: 'TON' },
    { key: 'dramatismo_contraste', name: 'Contraste', short: 'CNT' },
    { key: 'estilo_render', name: 'Render', short: 'RND' },
    { key: 'antiguedad_aged_look', name: 'Vintage', short: 'VNT' },
    { key: 'retoque_piel', name: 'Piel', short: 'SKN' },
    { key: 'dramatismo_vigneta', name: 'Viñeta', short: 'VIG' },
    { key: 'suavidad_bokeh', name: 'Bokeh', short: 'BOK' },
    { key: 'caracter_procesa', name: 'Carácter', short: 'CHR' }
  ],
  lightscaler: [
    { key: 'brillo_exposicion', name: 'Exposición', short: 'EXP' },
    { key: 'luz_relleno', name: 'Fill', short: 'FIL' },
    { key: 'profundidad_sombras', name: 'Sombras', short: 'SHD' },
    { key: 'iluminacion_dramatica', name: 'Drama', short: 'DRM' },
    { key: 'tonalidad_color', name: 'Temperatura', short: 'TMP' },
    { key: 'enfasis_ojos', name: 'Ojos', short: 'EYE' },
    { key: 'profundidad_dof', name: 'DOF', short: 'DOF' },
    { key: 'luces_especulares', name: 'Especular', short: 'SPC' },
    { key: 'balance_luminoso', name: 'Balance', short: 'BAL' }
  ]
};

const ProluxProfileUI: React.FC<{ 
  onConfirm: (config: LuxConfig) => void;
}> = ({ onConfirm }) => {
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.values(SLIDERS_27).flat().forEach(s => {
      initial[s.key] = 0;
    });
    return initial;
  });
  const [activePillar, setActivePillar] = useState<'photoscaler' | 'stylescaler' | 'lightscaler'>('photoscaler');

  const updateSlider = (key: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    onConfirm({
      userPrompt: '',
      mode: 'ADVANCED',
      mixer: {
        stylism: Math.round((sliderValues.vibracion_saturacion + sliderValues.paleta_tonos + sliderValues.estilo_render) / 3),
        atrezzo: Math.round((sliderValues.detalle_texturas + sliderValues.caracter_procesa) / 2),
        skin_bio: sliderValues.retoque_piel,
        lighting: Math.round((sliderValues.brillo_exposicion + sliderValues.iluminacion_dramatica + sliderValues.balance_luminoso) / 3),
        restoration: Math.round((sliderValues.limpieza_artefactos + sliderValues.restauracion_danos) / 2),
        upScaler: 2
      }
    });
  };

  const pillarColors = {
    photoscaler: 'cyan',
    stylescaler: 'pink',
    lightscaler: 'orange'
  };

  return (
    <div className="space-y-3">
      <div className="text-center mb-2">
        <h3 className="text-lg font-bold text-white mb-1">Control Total</h3>
        <p className="text-[10px] text-gray-400">27 parámetros de ajuste fino</p>
      </div>

      {/* Pillar Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1">
        {(['photoscaler', 'stylescaler', 'lightscaler'] as const).map(pillar => (
          <button
            key={pillar}
            onClick={() => setActivePillar(pillar)}
            className={`flex-1 py-2 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              activePillar === pillar
                ? `bg-${pillarColors[pillar]}-500/20 text-${pillarColors[pillar]}-400 border border-${pillarColors[pillar]}-500/50`
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {pillar === 'photoscaler' && <Camera className="w-3 h-3 inline mr-1" />}
            {pillar === 'stylescaler' && <Palette className="w-3 h-3 inline mr-1" />}
            {pillar === 'lightscaler' && <Sun className="w-3 h-3 inline mr-1" />}
            {pillar.replace('scaler', '')}
          </button>
        ))}
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2">
        {SLIDERS_27[activePillar].map(slider => (
          <div 
            key={slider.key}
            className="bg-white/5 rounded-lg p-2 border border-white/5 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-gray-500 uppercase">{slider.short}</span>
              <span className="text-[10px] font-mono text-white">{sliderValues[slider.key]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={sliderValues[slider.key]}
              onChange={(e) => updateSlider(slider.key, parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-lumen-gold"
            />
            <p className="text-[7px] text-gray-600 mt-1 truncate">{slider.name}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        className="w-full mt-2 px-6 py-3 bg-lumen-gold text-black font-bold rounded-xl hover:bg-white transition-all text-sm uppercase tracking-widest"
      >
        <Zap className="w-4 h-4 inline mr-2" />
        Generar PROLUX
      </button>
      <p className="text-[10px] text-gray-600 text-center">
        Costo: 15 tokens · Máxima calidad
      </p>
    </div>
  );
};

// =====================================================
// MAIN PROFILE SELECTOR COMPONENT
// =====================================================
interface ProfileConfigModalProps {
  isVisible: boolean;
  currentProfile: UserProfileType;
  availableTokens: number;
  totalTokensPurchased: number;
  imageUrl: string;
  initialMixer?: LuxMixer;
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
  onConfirm,
  onCancel,
  onUpgrade
}) => {
  const [selectedProfile, setSelectedProfile] = useState<UserProfileType>(currentProfile);

  useEffect(() => {
    setSelectedProfile(currentProfile);
  }, [currentProfile]);

  if (!isVisible) return null;

  const canAccessProfile = (profile: UserProfileType): boolean => {
    const profileInfo = PROFILES.find(p => p.key === profile);
    if (!profileInfo) return false;
    return totalTokensPurchased >= profileInfo.requiredTokens;
  };

  const renderProfileUI = () => {
    switch (selectedProfile) {
      case 'auto':
        return <AutoProfileUI onConfirm={onConfirm} />;
      case 'user':
        return <UserProfileUI onConfirm={onConfirm} />;
      case 'pro':
        return <ProProfileUI onConfirm={onConfirm} />;
      case 'prolux':
        return <ProluxProfileUI onConfirm={onConfirm} />;
      default:
        return <AutoProfileUI onConfirm={onConfirm} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onCancel} />
      
      <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
        
        {/* Header with Image Preview */}
        <div className="relative h-32 overflow-hidden">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover opacity-30 blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-widest">Configurar Proceso</h2>
              <p className="text-xs text-gray-400">Selecciona tu nivel de control</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-lumen-gold">{availableTokens}</p>
              <p className="text-[10px] text-gray-500 uppercase">tokens</p>
            </div>
          </div>
        </div>

        {/* Profile Selector Tabs */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex gap-2">
            {PROFILES.map(profile => {
              const canAccess = canAccessProfile(profile.key);
              const isSelected = selectedProfile === profile.key;
              
              return (
                <button
                  key={profile.key}
                  onClick={() => canAccess && setSelectedProfile(profile.key)}
                  disabled={!canAccess}
                  className={`flex-1 py-3 px-2 rounded-xl border transition-all relative ${
                    isSelected
                      ? `bg-white/10 border-white/30 ${profile.color}`
                      : canAccess
                        ? 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                        : 'bg-white/[0.02] border-white/5 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  {!canAccess && (
                    <Lock className="w-3 h-3 absolute top-2 right-2 text-gray-600" />
                  )}
                  <div className={`mb-1 ${isSelected ? profile.color : ''}`}>
                    {profile.icon}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider">{profile.name}</p>
                </button>
              );
            })}
          </div>
          
          {/* Upgrade CTA if profile locked */}
          {!canAccessProfile(selectedProfile) && selectedProfile !== currentProfile && (
            <div className="mt-3 p-3 bg-lumen-gold/10 border border-lumen-gold/30 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-lumen-gold" />
                <span className="text-xs text-lumen-gold">
                  Requiere {PROFILES.find(p => p.key === selectedProfile)?.requiredTokens} tokens comprados
                </span>
              </div>
              <button 
                onClick={onUpgrade}
                className="text-[10px] bg-lumen-gold text-black px-3 py-1.5 rounded font-bold uppercase"
              >
                Upgrade
              </button>
            </div>
          )}
        </div>

        {/* Profile-specific UI */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          {renderProfileUI()}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 flex justify-between items-center">
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-white text-xs uppercase tracking-wider"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <Info className="w-3 h-3" />
            <span>Los previews incluyen marca de agua en modo AUTO</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileConfigModal;
