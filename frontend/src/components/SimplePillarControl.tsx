import React, { useState } from 'react';
import { Camera, Palette, Sun } from 'lucide-react';

interface SimplePillarControlProps {
  analysisResult: any;
  onSubmit: (sliderConfig: Record<string, number>) => Promise<void>;
}

/**
 * Componente para perfil USER
 * 3 sliders macro que controlan 9 sliders cada uno
 */
export const SimplePillarControl: React.FC<SimplePillarControlProps> = ({
  analysisResult,
  onSubmit
}) => {
  // Estado: un slider por pilar
  const [photoscalerValue, setPhotoscalerValue] = useState(5);
  const [stylescalerValue, setStylescalerValue] = useState(5);
  const [lightscalerValue, setLightscalerValue] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Mapeo USER: cada pillar controla 9 sliders
  const USER_PILLAR_SLAVES = {
    photoscaler: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'],
    stylescaler: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'],
    lightscaler: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9']
  };
  
  const handleSubmit = async () => {
    setIsGenerating(true);
    
    try {
      // Traducir 3 valores macro a 27 valores individuales
      const sliderConfig: Record<string, number> = {};
      
      // Cada slider esclavo recibe el valor del pillar maestro
      USER_PILLAR_SLAVES.photoscaler.forEach(key => {
        sliderConfig[key] = photoscalerValue;
      });
      
      USER_PILLAR_SLAVES.stylescaler.forEach(key => {
        sliderConfig[key] = stylescalerValue;
      });
      
      USER_PILLAR_SLAVES.lightscaler.forEach(key => {
        sliderConfig[key] = lightscalerValue;
      });
      
      await onSubmit(sliderConfig);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const pillars = [
    {
      key: 'photoscaler',
      label: 'Calidad Imagen',
      icon: Camera,
      color: 'cyan',
      value: photoscalerValue,
      setValue: setPhotoscalerValue,
      description: 'Mejora ruido, nitidez, y definición técnica'
    },
    {
      key: 'stylescaler',
      label: 'Estética IA',
      icon: Palette,
      color: 'pink',
      value: stylescalerValue,
      setValue: setStylescalerValue,
      description: 'Retoque de piel, colores vibrantes, efecto cinematográfico'
    },
    {
      key: 'lightscaler',
      label: 'Iluminación Pro',
      icon: Sun,
      color: 'amber',
      value: lightscalerValue,
      setValue: setLightscalerValue,
      description: 'Exposición, contraste, drama y atmósfera'
    }
  ];
  
  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Ajusta los 3 Pilares Principales</h2>
        <p className="text-sm text-neutral-400">Controles simples para transformar tu imagen</p>
      </div>
      
      {/* Pillars */}
      {pillars.map(pillar => {
        const Icon = pillar.icon;
        const colorClasses = {
          cyan: 'from-cyan-500 to-cyan-600',
          pink: 'from-pink-500 to-pink-600',
          amber: 'from-amber-500 to-amber-600'
        };
        
        return (
          <div key={pillar.key} className="space-y-3">
            {/* Label */}
            <div className="flex items-center gap-2">
              <Icon size={20} className={`text-${pillar.color}-400`} />
              <span className="font-semibold text-white">{pillar.label}</span>
            </div>
            
            {/* Slider */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative h-3">
                  <div className="absolute inset-0 bg-neutral-800 rounded-full" />
                  <div
                    className={`absolute left-0 h-full rounded-full bg-gradient-to-r ${colorClasses[pillar.color]}`}
                    style={{ width: `${(pillar.value / 10) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={pillar.value}
                    onChange={(e) => pillar.setValue(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-lg font-bold text-white w-8 text-right">
                  {pillar.value}
                </span>
              </div>
              
              <p className="text-xs text-neutral-500">{pillar.description}</p>
            </div>
          </div>
        );
      })}
      
      {/* Generate Button */}
      <button
        onClick={handleSubmit}
        disabled={isGenerating}
        className="w-full py-4 bg-white text-black rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-200 transition-all active:scale-[0.98]"
      >
        {isGenerating ? 'Generando...' : 'Generar Imagen'}
      </button>
      
      {/* Info */}
      {analysisResult && (
        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
          <p className="text-xs text-neutral-400">
            Categoría detectada: <span className="text-white font-medium">{analysisResult.cat_code}</span>
          </p>
          {analysisResult.visual_summary && (
            <p className="text-xs text-neutral-500 mt-1">{analysisResult.visual_summary}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SimplePillarControl;
