import React from 'react';
import { Wrench, Sparkles, Palette, Wand2, Zap } from 'lucide-react';

export type IntentLevel = 'fix' | 'polished' | 'creative' | 'stylized' | 'aggressive';

interface IntentSpectrumProps {
  selected: IntentLevel;
  onSelect: (level: IntentLevel) => void;
  compact?: boolean;
}

interface IntentConfig {
  key: IntentLevel;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  multiplier: number; // Multiplier for slider values
}

const INTENT_LEVELS: IntentConfig[] = [
  {
    key: 'fix',
    label: 'FIX',
    desc: 'Corrección mínima',
    icon: <Wrench size={12} />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500',
    multiplier: 0.3
  },
  {
    key: 'polished',
    label: 'PULIDO',
    desc: 'Retoque profesional',
    icon: <Sparkles size={12} />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
    multiplier: 0.6
  },
  {
    key: 'creative',
    label: 'CREATIVO',
    desc: 'Mejora artística',
    icon: <Palette size={12} />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500',
    multiplier: 1.0
  },
  {
    key: 'stylized',
    label: 'ESTILIZADO',
    desc: 'Look definido',
    icon: <Wand2 size={12} />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500',
    multiplier: 1.3
  },
  {
    key: 'aggressive',
    label: 'AGRESIVO',
    desc: 'Transformación total',
    icon: <Zap size={12} />,
    color: 'text-red-400',
    bgColor: 'bg-red-500',
    multiplier: 1.6
  }
];

// Helper to get multiplier for a given intent level
export const getIntentMultiplier = (intent: IntentLevel): number => {
  const config = INTENT_LEVELS.find(i => i.key === intent);
  return config?.multiplier || 1.0;
};

// Apply intent multiplier to slider config
export const applyIntentToSliders = (
  sliderConfig: {
    photoscaler: { sliders: Array<{ name: string; value: number }> };
    stylescaler: { sliders: Array<{ name: string; value: number }> };
    lightscaler: { sliders: Array<{ name: string; value: number }> };
  },
  intent: IntentLevel
): typeof sliderConfig => {
  const multiplier = getIntentMultiplier(intent);
  
  const applyToSliders = (sliders: Array<{ name: string; value: number }>) => {
    return sliders.map(s => ({
      name: s.name,
      value: Math.min(10, Math.max(0, Math.round(s.value * multiplier)))
    }));
  };
  
  return {
    photoscaler: { sliders: applyToSliders(sliderConfig.photoscaler?.sliders || []) },
    stylescaler: { sliders: applyToSliders(sliderConfig.stylescaler?.sliders || []) },
    lightscaler: { sliders: applyToSliders(sliderConfig.lightscaler?.sliders || []) }
  };
};

export const IntentSpectrum: React.FC<IntentSpectrumProps> = ({
  selected,
  onSelect,
  compact = false
}) => {
  const selectedIdx = INTENT_LEVELS.findIndex(i => i.key === selected);
  
  if (compact) {
    // Ultra-compact: just colored dots
    return (
      <div className="flex items-center gap-1.5">
        {INTENT_LEVELS.map((intent, idx) => {
          const isSelected = intent.key === selected;
          const isPast = idx <= selectedIdx;
          
          return (
            <button
              key={intent.key}
              onClick={() => onSelect(intent.key)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all
                ${isSelected ? `${intent.bgColor} ring-2 ring-offset-1 ring-offset-black ring-white/30` : ''}
                ${isPast && !isSelected ? intent.bgColor + '/40' : ''}
                ${!isPast ? 'bg-white/10' : ''}
              `}
              title={`${intent.label}: ${intent.desc}`}
            />
          );
        })}
        <span className={`ml-1 text-[8px] font-bold ${INTENT_LEVELS[selectedIdx].color}`}>
          {INTENT_LEVELS[selectedIdx].label}
        </span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-400 uppercase font-bold">Intensidad de Transformación</p>
      
      {/* Progress bar */}
      <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${INTENT_LEVELS[selectedIdx].bgColor}`}
          style={{ width: `${((selectedIdx + 1) / INTENT_LEVELS.length) * 100}%` }}
        />
      </div>
      
      {/* Buttons */}
      <div className="flex gap-1">
        {INTENT_LEVELS.map((intent, idx) => {
          const isSelected = intent.key === selected;
          
          return (
            <button
              key={intent.key}
              onClick={() => onSelect(intent.key)}
              className={`
                flex-1 py-1.5 px-1 rounded text-center transition-all
                ${isSelected 
                  ? `${intent.bgColor} text-white` 
                  : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                }
              `}
            >
              <div className="flex flex-col items-center gap-0.5">
                {intent.icon}
                <span className="text-[8px] font-bold">{intent.label}</span>
                {isSelected && (
                  <span className="text-[7px] opacity-75">{intent.desc}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Selected description */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] text-gray-500">
          Multiplicador: <span className={INTENT_LEVELS[selectedIdx].color}>×{INTENT_LEVELS[selectedIdx].multiplier}</span>
        </span>
        <span className={`text-[9px] ${INTENT_LEVELS[selectedIdx].color}`}>
          {INTENT_LEVELS[selectedIdx].desc}
        </span>
      </div>
    </div>
  );
};

export default IntentSpectrum;
