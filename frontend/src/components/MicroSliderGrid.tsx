import React, { useState, useEffect } from 'react';
import { Camera, Palette, Sun } from 'lucide-react';

interface MicroSliderGridProps {
  analysisResult: any;
  userId: string;
  onSubmit: (sliderConfig: Record<string, number>) => Promise<void>;
}

/**
 * Componente para perfil PRO_LUX
 * 27 sliders individuales - Control total
 */
export const MicroSliderGrid: React.FC<MicroSliderGridProps> = ({
  analysisResult,
  userId,
  onSubmit
}) => {
  const [sliderConfig, setSliderConfig] = useState<Record<string, number>>(() => {
    const autoSettings = analysisResult?.auto_settings || {};
    const defaults: Record<string, number> = {};
    
    // Inicializar 27 sliders
    for (let i = 1; i <= 9; i++) {
      defaults[`p${i}`] = autoSettings[`p${i}`] || 5;
      defaults[`s${i}`] = autoSettings[`s${i}`] || 5;
      defaults[`l${i}`] = autoSettings[`l${i}`] || 5;
    }
    
    return defaults;
  });
  
  const [sliderDefinitions, setSliderDefinitions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Cargar definiciones desde backend
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/slider-definitions`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSliderDefinitions(data.definitions);
        }
      })
      .catch(err => console.error('Error loading sliders:', err));
  }, []);
  
  const handleSliderChange = (key: string, value: number) => {
    setSliderConfig(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSubmit = async () => {
    setIsGenerating(true);
    try {
      await onSubmit(sliderConfig);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const pillars = [
    { key: 'PHOTOSCALER', prefix: 'p', label: 'Imagen', icon: Camera, color: 'cyan' },
    { key: 'STYLESCALER', prefix: 's', label: 'Estilo', icon: Palette, color: 'pink' },
    { key: 'LIGHTSCALER', prefix: 'l', label: 'Luz', icon: Sun, color: 'amber' }
  ];
  
  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Ingeniería Forense: 27 Sliders</h2>
        <p className="text-sm text-neutral-400">Control total sobre cada dimensión</p>
      </div>
      
      {/* Pillars */}
      {pillars.map(pillar => {
        const Icon = pillar.icon;
        
        return (
          <div key={pillar.key} className="space-y-3">
            <h3 className={`text-lg font-bold text-${pillar.color}-400 flex items-center gap-2`}>
              <Icon size={18} />
              {pillar.key}
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => {
                const sliderKey = `${pillar.prefix}${i + 1}`;
                const def = sliderDefinitions.find(d => d.slider_key === sliderKey);
                const value = sliderConfig[sliderKey] || 5;
                
                return (
                  <div key={sliderKey} className="bg-neutral-800/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">
                        {def?.ui_title || sliderKey.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-white">{value}</span>
                    </div>
                    
                    <div className="relative h-2">
                      <div className="absolute inset-0 bg-neutral-700 rounded-full" />
                      <div
                        className={`absolute left-0 h-full rounded-full bg-${pillar.color}-500`}
                        style={{ width: `${(value / 10) * 100}%` }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={value}
                        onChange={(e) => handleSliderChange(sliderKey, Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                    </div>
                    
                    <p className="text-[9px] text-neutral-500 truncate">
                      {def?.ui_description?.substring(0, 30) || '...'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {/* Generate Button */}
      <button
        onClick={handleSubmit}
        disabled={isGenerating}
        className="w-full py-4 bg-white text-black rounded-lg font-bold text-lg disabled:opacity-50 hover:bg-neutral-200 transition-all"
      >
        {isGenerating ? 'Generando 4K...' : 'Generar Imagen'}
      </button>
    </div>
  );
};

export default MicroSliderGrid;