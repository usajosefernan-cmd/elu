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
const AutoProfileUI: React.FC<{ 
  onConfirm: (config: LuxConfig) => void;
  initialMixer?: LuxMixer;
}> = ({ onConfirm, initialMixer }) => {
  const handleGenerate = () => {
    onConfirm({
      userPrompt: '',
      mode: 'AUTO',
      mixer: {
        stylism: initialMixer?.stylism ?? 5,
        atrezzo: initialMixer?.atrezzo ?? 5,
        skin_bio: initialMixer?.skin_bio ?? 5,
        lighting: initialMixer?.lighting ?? 5,
        restoration: initialMixer?.restoration ?? 5,
        upScaler: initialMixer?.upScaler ?? 1
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
  initialMixer?: LuxMixer;
  useAutoAll?: boolean;
  onAutoAll?: () => void;
}> = ({ onConfirm, initialMixer, useAutoAll = true, onAutoAll }) => {
  const defaults = {
    restauracion: initialMixer?.restoration ?? 5,
    fidelidad: initialMixer?.restoration ?? 5,
    caracter: initialMixer?.restoration ?? 5,
    presencia: initialMixer?.skin_bio ?? 5,
    pulido: initialMixer?.stylism ?? 5,
    cinematica: initialMixer?.stylism ?? 5,
    volumen: initialMixer?.lighting ?? 5,
    drama: initialMixer?.lighting ?? 5,
    atmosfera: initialMixer?.lighting ?? 5,
  };

  const [macroValues, setMacroValues] = useState<Record<string, number>>(defaults);

  useEffect(() => {
    if (useAutoAll) {
      setMacroValues(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useAutoAll, initialMixer?.restoration, initialMixer?.skin_bio, initialMixer?.stylism, initialMixer?.lighting]);

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
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onAutoAll}
          className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-[10px] text-gray-200 uppercase tracking-widest hover:bg-white/10"
        >
          Auto en todo
        </button>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">
          Estado: {useAutoAll ? 'AUTO' : 'MANUAL'}
        </div>
      </div>

      <div className="text-center mb-2">
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
// PROLUX PROFILE UI - 27 Sliders con UI Compacta
// =====================================================
// Definiciones con nombres legibles y descripciones
const SLIDER_DEFINITIONS = {
  photoscaler: {
    name: '📷 Cámara & Óptica',
    description: 'Control del equipo de cámara virtual',
    sliders: [
      { key: 'limpieza_artefactos', name: 'Limpieza Digital', desc: 'Elimina ruido, manchas y artefactos de compresión' },
      { key: 'geometria', name: 'Corrección Geométrica', desc: 'Endereza líneas y corrige distorsión de lente' },
      { key: 'optica', name: 'Calidad Óptica', desc: 'Simula lentes profesionales de alta gama' },
      { key: 'chronos', name: 'Control de Movimiento', desc: 'Congela el movimiento y elimina desenfoque' },
      { key: 'senal_raw', name: 'Rango Dinámico', desc: 'Recupera detalles en sombras y luces' },
      { key: 'sintesis_adn', name: 'Síntesis de Detalle', desc: 'Genera texturas y detalles de alta resolución' },
      { key: 'grano_filmico', name: 'Grano de Película', desc: 'Añade textura cinematográfica tipo film' },
      { key: 'enfoque', name: 'Nitidez', desc: 'Aumenta la definición de bordes y detalles' },
      { key: 'resolucion', name: 'Resolución', desc: 'Escala la imagen a mayor resolución' }
    ]
  },
  stylescaler: {
    name: '🎨 Dirección de Arte',
    description: 'Control del departamento artístico',
    sliders: [
      { key: 'styling_piel', name: 'Tratamiento de Piel', desc: 'Retoque profesional de piel y textura' },
      { key: 'styling_pelo', name: 'Estilismo de Cabello', desc: 'Mejora brillo, volumen y definición del pelo' },
      { key: 'styling_ropa', name: 'Estilismo de Ropa', desc: 'Mejora texturas y pliegues de la ropa' },
      { key: 'maquillaje', name: 'Maquillaje Virtual', desc: 'Aplica o mejora el maquillaje existente' },
      { key: 'limpieza_entorno', name: 'Limpieza de Fondo', desc: 'Elimina distracciones y ordena el entorno' },
      { key: 'reencuadre_ia', name: 'Reencuadre Inteligente', desc: 'Recompone la imagen con reglas profesionales' },
      { key: 'atmosfera', name: 'Atmósfera', desc: 'Añade niebla, humo o efectos ambientales' },
      { key: 'look_cine', name: 'Look Cinematográfico', desc: 'Aplica gradación de color tipo película' },
      { key: 'materiales_pbr', name: 'Realismo de Materiales', desc: 'Mejora reflejos y texturas de superficies' }
    ]
  },
  lightscaler: {
    name: '💡 Iluminación',
    description: 'Control del equipo de iluminación',
    sliders: [
      { key: 'key_light', name: 'Luz Principal', desc: 'Controla la fuente de luz dominante' },
      { key: 'fill_light', name: 'Luz de Relleno', desc: 'Suaviza las sombras con luz secundaria' },
      { key: 'rim_light', name: 'Contraluz', desc: 'Añade separación del fondo con luz trasera' },
      { key: 'volumetria', name: 'Luz Volumétrica', desc: 'Crea rayos de luz visibles y atmósfera' },
      { key: 'temperatura', name: 'Temperatura de Color', desc: 'Ajusta entre tonos cálidos y fríos' },
      { key: 'contraste', name: 'Contraste', desc: 'Controla la diferencia entre luces y sombras' },
      { key: 'sombras', name: 'Profundidad de Sombras', desc: 'Ajusta la intensidad de las zonas oscuras' },
      { key: 'estilo_autor', name: 'Estilo de Autor', desc: 'Aplica esquemas de luz de maestros del cine' },
      { key: 'reflejos', name: 'Brillo y Reflejos', desc: 'Controla especularidad y brillos de piel' }
    ]
  }
};

const ProluxProfileUI: React.FC<{ 
  onConfirm: (config: LuxConfig) => void;
  onCancel?: () => void;
  initialMixer?: LuxMixer;
  initialSettings?: any;
}> = ({ onConfirm, onCancel, initialMixer, initialSettings }) => {
  // Inicializar con valores de auto_settings si existen
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    
    // Usar auto_settings si están disponibles
    if (initialSettings) {
      Object.entries(initialSettings.photoscaler || {}).forEach(([k, v]) => { initial[k] = v as number; });
      Object.entries(initialSettings.stylescaler || {}).forEach(([k, v]) => { initial[k] = v as number; });
      Object.entries(initialSettings.lightscaler || {}).forEach(([k, v]) => { initial[k] = v as number; });
    } else {
      // Fallback a valores por defecto
      SLIDER_DEFINITIONS.photoscaler.sliders.forEach(s => { initial[s.key] = initialMixer?.restoration ?? 5; });
      SLIDER_DEFINITIONS.stylescaler.sliders.forEach(s => { initial[s.key] = initialMixer?.stylism ?? 5; });
      SLIDER_DEFINITIONS.lightscaler.sliders.forEach(s => { initial[s.key] = initialMixer?.lighting ?? 5; });
    }
    return initial;
  });
  
  const [activePillar, setActivePillar] = useState<'photoscaler' | 'stylescaler' | 'lightscaler'>('photoscaler');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  const updateSlider = (key: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    const buildPillar = (pillarKey: 'photoscaler' | 'stylescaler' | 'lightscaler') => ({
      sliders: SLIDER_DEFINITIONS[pillarKey].sliders.map(s => ({
        name: s.key,
        value: sliderValues[s.key] ?? 5
      }))
    });

    const sliderConfig = {
      photoscaler: buildPillar('photoscaler'),
      stylescaler: buildPillar('stylescaler'),
      lightscaler: buildPillar('lightscaler'),
    };

    onConfirm({
      userPrompt: '',
      mode: 'PROLUX',
      selectedPresetId: JSON.stringify(sliderConfig),
      mixer: {
        stylism: Math.round((sliderValues.atmosfera + sliderValues.look_cine + sliderValues.materiales_pbr) / 3),
        atrezzo: Math.round((sliderValues.limpieza_entorno + sliderValues.styling_ropa) / 2),
        skin_bio: sliderValues.styling_piel,
        lighting: Math.round((sliderValues.key_light + sliderValues.volumetria + sliderValues.contraste) / 3),
        restoration: Math.round((sliderValues.limpieza_artefactos + sliderValues.optica) / 2),
        upScaler: 2
      }
    });
  };

  // Contar sliders activos (valor > 3)
  const activeCount = Object.values(sliderValues).filter(v => v > 3).length;
  const currentPillar = SLIDER_DEFINITIONS[activePillar];

  // Compact slider component
  const CompactSlider: React.FC<{ slider: typeof SLIDER_DEFINITIONS.photoscaler.sliders[0] }> = ({ slider }) => {
    const value = sliderValues[slider.key] ?? 5;
    const isActive = value > 3;
    const color = value <= 3 ? 'bg-gray-600' : value <= 6 ? 'bg-blue-500' : value <= 8 ? 'bg-purple-500' : 'bg-lumen-gold';
    
    return (
      <div className={`p-2 rounded-lg border transition-all ${isActive ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5'}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[11px] font-medium truncate ${isActive ? 'text-white' : 'text-gray-500'}`} title={slider.desc}>
            {slider.name}
          </span>
          <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-lumen-gold' : 'text-gray-600'}`}>{value}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => updateSlider(slider.key, parseInt(e.target.value))}
          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-lumen-gold"
        />
        <div className="flex justify-between mt-1">
          {[1, 5, 10].map(v => (
            <button
              key={v}
              onClick={() => updateSlider(slider.key, v)}
              className={`w-5 h-5 rounded text-[8px] font-bold transition-all ${
                value === v ? `${color} text-black` : 'bg-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header con botón volver */}
      <div className="flex items-center justify-between">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Volver
          </button>
        )}
        <div className="text-right">
          <span className="text-[10px] text-gray-500">{activeCount}/27 activos</span>
        </div>
      </div>

      {/* Pillar Tabs - Compactos */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
        {(['photoscaler', 'stylescaler', 'lightscaler'] as const).map(pillar => {
          const info = SLIDER_DEFINITIONS[pillar];
          const isActive = activePillar === pillar;
          return (
            <button
              key={pillar}
              onClick={() => setActivePillar(pillar)}
              className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-lumen-gold text-black' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {info.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Pillar description */}
      <div className="text-center">
        <p className="text-sm font-bold text-white">{currentPillar.name}</p>
        <p className="text-[10px] text-gray-500">{currentPillar.description}</p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        <button
          onClick={() => setViewMode('compact')}
          className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold uppercase transition-all ${
            viewMode === 'compact' 
              ? 'bg-lumen-gold text-black' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Compacto
        </button>
        <button
          onClick={() => setViewMode('detailed')}
          className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold uppercase transition-all ${
            viewMode === 'detailed' 
              ? 'bg-lumen-gold text-black' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Detallado
        </button>
      </div>

      {/* Sliders Grid - Compact Mode */}
      {viewMode === 'compact' ? (
        <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
          {currentPillar.sliders.map(slider => (
            <CompactSlider key={slider.key} slider={slider} />
          ))}
        </div>
      ) : (
        {/* Detailed Mode - Original accordion style */}
        <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
          {currentPillar.sliders.map(slider => {
            const value = sliderValues[slider.key] ?? 5;
            const isActive = value > 3;
            
            return (
              <div 
                key={slider.key}
                className={`p-3 rounded-lg border transition-all ${
                  isActive 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {slider.name}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-0.5">{slider.desc}</p>
                  </div>
                  <span className={`text-xs font-mono font-bold ml-2 ${isActive ? 'text-lumen-gold' : 'text-gray-600'}`}>
                    {value}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={value}
                    onChange={(e) => updateSlider(slider.key, parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-lumen-gold"
                  />
                  <div className="flex gap-1">
                    {[1, 5, 10].map(v => (
                      <button
                        key={v}
                        onClick={() => updateSlider(slider.key, v)}
                        className={`w-6 h-6 rounded text-[9px] font-bold transition-all ${
                          value === v 
                            ? 'bg-lumen-gold text-black' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick presets */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const reset: Record<string, number> = {};
            Object.values(SLIDER_DEFINITIONS).forEach(p => p.sliders.forEach(s => { reset[s.key] = 5; }));
            setSliderValues(reset);
          }}
          className="flex-1 py-2 px-3 bg-white/5 text-gray-400 text-[10px] font-bold uppercase rounded-lg hover:bg-white/10 transition-all"
        >
          Reset a 5
        </button>
        <button
          onClick={() => {
            const max: Record<string, number> = {};
            Object.values(SLIDER_DEFINITIONS).forEach(p => p.sliders.forEach(s => { max[s.key] = 10; }));
            setSliderValues(max);
          }}
          className="flex-1 py-2 px-3 bg-white/5 text-gray-400 text-[10px] font-bold uppercase rounded-lg hover:bg-white/10 transition-all"
        >
          Todo al Máximo
        </button>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        className="w-full py-4 bg-gradient-to-r from-lumen-gold to-yellow-500 text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-lumen-gold/20"
      >
        <Zap className="w-5 h-5" />
        Generar con Control Total
      </button>
      <p className="text-[10px] text-gray-600 text-center">
        15 tokens · Máxima calidad y control
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
  // TODOS los hooks DEBEN estar ANTES de cualquier return condicional
  const [selectedProfile, setSelectedProfile] = useState<UserProfileType>(currentProfile);
  const [useAutoAll, setUseAutoAll] = useState(true);

  useEffect(() => {
    setSelectedProfile(currentProfile);
  }, [currentProfile]);

  // Ahora podemos hacer el return condicional
  if (!isVisible) return null;

  const applyAutoToAll = () => {
    setUseAutoAll(true);
  };

  const canAccessProfile = (profile: UserProfileType): boolean => {
    const profileInfo = PROFILES.find(p => p.key === profile);
    if (!profileInfo) return false;
    return totalTokensPurchased >= profileInfo.requiredTokens;
  };

  const renderProfileUI = () => {
    switch (selectedProfile) {
      case 'auto':
        return <AutoProfileUI onConfirm={onConfirm} initialMixer={initialMixer} />;
      case 'user':
        return <UserProfileUI onConfirm={onConfirm} initialMixer={initialMixer} />;
      case 'pro':
        return <ProProfileUI onConfirm={onConfirm} initialMixer={initialMixer} useAutoAll={useAutoAll} onAutoAll={applyAutoToAll} />;
      case 'prolux':
        return <ProluxProfileUI 
          onConfirm={onConfirm} 
          onCancel={onCancel}
          initialMixer={initialMixer} 
          initialSettings={initialSuggestedSettings}
        />;
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
