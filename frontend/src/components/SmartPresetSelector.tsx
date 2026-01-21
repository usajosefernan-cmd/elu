import React, { useState, useEffect } from 'react';
import { 
  Bookmark, Zap, Film, Camera, User, Home, Wand2,
  ChevronRight, Lock, Unlock, Info
} from 'lucide-react';
import { getSystemPresets, SmartPreset, presetToSliderConfig } from '../services/smartPresetsService';

interface SmartPresetSelectorProps {
  onSelect: (preset: SmartPreset, sliderConfig: ReturnType<typeof presetToSliderConfig>) => void;
  autoSettings?: Record<string, Record<string, number>>;
  selectedPresetId?: string;
  compact?: boolean;
}

// Icons for each preset
const PRESET_ICONS: Record<string, React.ReactNode> = {
  'preset_natural': <Zap size={14} className="text-emerald-400" />,
  'preset_editorial': <Camera size={14} className="text-purple-400" />,
  'preset_cinematic': <Film size={14} className="text-amber-400" />,
  'preset_portrait_pro': <User size={14} className="text-pink-400" />,
  'preset_real_estate': <Home size={14} className="text-cyan-400" />,
  'preset_restoration': <Wand2 size={14} className="text-orange-400" />
};

// Colors for each preset
const PRESET_COLORS: Record<string, string> = {
  'preset_natural': 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-400/50',
  'preset_editorial': 'from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-400/50',
  'preset_cinematic': 'from-amber-500/20 to-amber-500/5 border-amber-500/30 hover:border-amber-400/50',
  'preset_portrait_pro': 'from-pink-500/20 to-pink-500/5 border-pink-500/30 hover:border-pink-400/50',
  'preset_real_estate': 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-400/50',
  'preset_restoration': 'from-orange-500/20 to-orange-500/5 border-orange-500/30 hover:border-orange-400/50'
};

// Selected state colors
const PRESET_SELECTED_COLORS: Record<string, string> = {
  'preset_natural': 'from-emerald-500/40 to-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/30',
  'preset_editorial': 'from-purple-500/40 to-purple-500/20 border-purple-400 ring-2 ring-purple-400/30',
  'preset_cinematic': 'from-amber-500/40 to-amber-500/20 border-amber-400 ring-2 ring-amber-400/30',
  'preset_portrait_pro': 'from-pink-500/40 to-pink-500/20 border-pink-400 ring-2 ring-pink-400/30',
  'preset_real_estate': 'from-cyan-500/40 to-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400/30',
  'preset_restoration': 'from-orange-500/40 to-orange-500/20 border-orange-400 ring-2 ring-orange-400/30'
};

export const SmartPresetSelector: React.FC<SmartPresetSelectorProps> = ({
  onSelect,
  autoSettings,
  selectedPresetId,
  compact = false
}) => {
  const [presets, setPresets] = useState<SmartPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

  useEffect(() => {
    const loadPresets = async () => {
      const systemPresets = await getSystemPresets();
      setPresets(systemPresets);
      setLoading(false);
    };
    loadPresets();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (compact) {
    // Horizontal scrollable list for compact mode
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-white/10">
        {presets.map(preset => {
          const isSelected = selectedPresetId === preset.id;
          const baseColor = PRESET_COLORS[preset.id] || PRESET_COLORS['preset_natural'];
          const selectedColor = PRESET_SELECTED_COLORS[preset.id] || PRESET_SELECTED_COLORS['preset_natural'];
          
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset, presetToSliderConfig(preset))}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-lg border transition-all
                bg-gradient-to-b ${isSelected ? selectedColor : baseColor}
              `}
            >
              <div className="flex items-center gap-1.5">
                {PRESET_ICONS[preset.id]}
                <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {preset.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Full grid layout
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Bookmark size={12} className="text-gray-400" />
        <span className="text-[10px] text-gray-400 uppercase font-bold">Smart Presets</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => {
          const isSelected = selectedPresetId === preset.id;
          const isHovered = hoveredPreset === preset.id;
          const baseColor = PRESET_COLORS[preset.id] || PRESET_COLORS['preset_natural'];
          const selectedColor = PRESET_SELECTED_COLORS[preset.id] || PRESET_SELECTED_COLORS['preset_natural'];
          
          // Count active sliders (value > 3)
          const activeSliders = Object.values(preset.slider_values).reduce((acc, pillar) => {
            return acc + Object.values(pillar).filter(v => v > 3).length;
          }, 0);
          
          // Count force sliders (value >= 9)
          const forceSliders = Object.values(preset.slider_values).reduce((acc, pillar) => {
            return acc + Object.values(pillar).filter(v => v >= 9).length;
          }, 0);

          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset, presetToSliderConfig(preset))}
              onMouseEnter={() => setHoveredPreset(preset.id)}
              onMouseLeave={() => setHoveredPreset(null)}
              className={`
                relative p-2.5 rounded-lg border transition-all text-left
                bg-gradient-to-b ${isSelected ? selectedColor : baseColor}
              `}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {PRESET_ICONS[preset.id]}
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                    {preset.name}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
              
              {/* Narrative anchor */}
              {preset.narrative_anchor && (
                <p className="text-[9px] text-gray-400 line-clamp-2 mb-1.5">
                  {preset.narrative_anchor}
                </p>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-2 text-[8px]">
                <span className="text-gray-500">
                  {activeSliders} activos
                </span>
                {forceSliders > 0 && (
                  <span className="text-amber-400 font-bold">
                    {forceSliders} FORCE
                  </span>
                )}
                {preset.smart_locks?.identity_lock === 'strict' && (
                  <Lock size={8} className="text-red-400" />
                )}
              </div>
              
              {/* Hover tooltip */}
              {isHovered && !isSelected && (
                <div className="absolute bottom-full left-0 mb-1 w-full p-2 bg-black/90 rounded-lg border border-white/10 text-[9px] z-10">
                  <p className="text-gray-300">{preset.narrative_anchor}</p>
                  {preset.smart_locks && Object.keys(preset.smart_locks).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(preset.smart_locks).map(([key, val]) => (
                        <span key={key} className="px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                          {key}: {val}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SmartPresetSelector;
