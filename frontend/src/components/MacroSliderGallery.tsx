import React, { useState, useEffect } from 'react';
import { Wrench, Search, Film, User, Droplet, Clapperboard, Ruler, Drama, Cloud } from 'lucide-react';

interface MacroSliderGalleryProps {
  analysisResult: any;
  userId: string;
  onSubmit: (sliderConfig: Record<string, number>) => Promise<void>;
}

/**
 * Componente para perfil PRO
 * 9 macros independientes, cada uno controla 3-4 sliders
 */
export const MacroSliderGallery: React.FC<MacroSliderGalleryProps> = ({
  analysisResult,
  userId,
  onSubmit
}) => {
  const [macroValues, setMacroValues] = useState({
    restauracion: 5,
    fidelidad: 5,
    caracter: 5,
    presencia: 5,
    pulido: 5,
    cinematica: 5,
    volumen: 5,
    drama: 5,
    atmosfera: 5
  });
  
  const [macroDefinitions, setMacroDefinitions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Cargar definiciones desde backend
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v41/macro-definitions/PRO`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setMacroDefinitions(data.macros);
        }
      })
      .catch(err => console.error('Error loading macros:', err));
  }, []);
  
  // Mapeo PRO hardcoded (fallback si no se carga desde backend)
  const PRO_MACRO_DEFINITIONS: Record<string, string[]> = {
    'restauracion': ['p1', 'p2', 'p8', 'p9'],
    'fidelidad': ['p3', 'p4', 'p6'],
    'caracter': ['p5', 'p7'],
    'presencia': ['s1', 's2', 's3'],
    'pulido': ['s4', 's5', 's6'],
    'cinematica': ['s7', 's8', 's9'],
    'volumen': ['l1', 'l2', 'l3'],
    'drama': ['l4', 'l5', 'l6'],
    'atmosfera': ['l7', 'l8', 'l9']
  };
  
  const handleSubmit = async () => {
    setIsGenerating(true);
    
    try {
      // Traducir 9 valores macro a 27 valores individuales
      const sliderConfig: Record<string, number> = {};
      
      Object.entries(macroValues).forEach(([macroKey, macroValue]) => {
        const slaveSliders = PRO_MACRO_DEFINITIONS[macroKey] || [];
        slaveSliders.forEach(sliderKey => {
          sliderConfig[sliderKey] = macroValue;
        });
      });
      
      await onSubmit(sliderConfig);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const macroGroups = [
    {
      pillar: 'PHOTOSCALER',
      icon: Wrench,
      color: 'cyan',
      items: [
        { key: 'restauracion', label: 'Restauración', desc: 'Corrige defectos y geometría', icon: Wrench },
        { key: 'fidelidad', label: 'Fidelidad', desc: 'Maximiza nitidez y texturas', icon: Search },
        { key: 'caracter', label: 'Carácter', desc: 'Grano fílmico y movimiento', icon: Film }
      ]
    },
    {
      pillar: 'STYLESCALER',
      icon: User,
      color: 'pink',
      items: [
        { key: 'presencia', label: 'Presencia', desc: 'Piel, cabello y styling', icon: User },
        { key: 'pulido', label: 'Pulido', desc: 'Makeup, fondo, composición', icon: Droplet },
        { key: 'cinematica', label: 'Cinemática', desc: 'Atmósfera, color, materiales', icon: Clapperboard }
      ]
    },
    {
      pillar: 'LIGHTSCALER',
      icon: Ruler,
      color: 'amber',
      items: [
        { key: 'volumen', label: 'Volumen', desc: 'Luces principal, relleno, recorte', icon: Ruler },
        { key: 'drama', label: 'Drama', desc: 'Rayos, temperatura, contraste', icon: Drama },
        { key: 'atmosfera', label: 'Atmósfera', desc: 'Sombras, estilo, brillo', icon: Cloud }
      ]
    }
  ];
  
  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Mesa de Mezclas Pro</h2>
        <p className="text-sm text-neutral-400">9 controles temáticos para control avanzado</p>
      </div>
      
      {/* Analysis Info */}
      {analysisResult && (
        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
          <p className="text-xs text-neutral-400">
            Categoría: <span className="text-white font-medium">{analysisResult.cat_code}</span>
            {analysisResult.detected_defects && analysisResult.detected_defects.length > 0 && (
              <span className="ml-3">
                Defectos: <span className="text-red-400">{analysisResult.detected_defects.join(', ')}</span>
              </span>
            )}
          </p>
        </div>
      )}
      
      {/* Macro Groups */}
      {macroGroups.map(group => {
        const colorClasses = {
          cyan: 'from-cyan-500 to-cyan-600',
          pink: 'from-pink-500 to-pink-600',
          amber: 'from-amber-500 to-amber-600'
        };
        
        return (
          <div key={group.pillar} className="space-y-4">
            <h3 className={`text-lg font-bold text-${group.color}-400 flex items-center gap-2`}>
              <group.icon size={20} />
              {group.pillar}
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              {group.items.map(item => {
                const Icon = item.icon;
                
                return (
                  <div key={item.key} className="bg-neutral-800/50 rounded-lg p-4 space-y-3 border border-neutral-700 hover:border-neutral-600 transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={`text-${group.color}-400`} />
                      <span className="font-semibold text-white text-sm">{item.label}</span>
                    </div>
                    
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                    
                    {/* Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 relative h-2">
                          <div className="absolute inset-0 bg-neutral-700 rounded-full" />
                          <div
                            className={`absolute left-0 h-full rounded-full bg-gradient-to-r ${colorClasses[group.color]}`}
                            style={{ width: `${(macroValues[item.key] / 10) * 100}%` }}
                          />
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={macroValues[item.key]}
                            onChange={(e) =>
                              setMacroValues({
                                ...macroValues,
                                [item.key]: Number(e.target.value)
                              })
                            }
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                          />
                        </div>
                        <span className="text-sm font-bold text-white w-6 text-right">
                          {macroValues[item.key]}
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-neutral-600 text-center">
                        {macroValues[item.key] === 0 && 'OFF'}
                        {macroValues[item.key] > 0 && macroValues[item.key] <= 3 && 'LOW'}
                        {macroValues[item.key] > 3 && macroValues[item.key] <= 6 && 'MED'}
                        {macroValues[item.key] > 6 && macroValues[item.key] <= 9 && 'HIGH'}
                        {macroValues[item.key] === 10 && 'FORCE'}
                      </div>
                    </div>
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
        className="w-full py-4 bg-white text-black rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-200 transition-all active:scale-[0.98]"
      >
        {isGenerating ? 'Generando con Nano Banana Pro...' : 'Generar Imagen'}
      </button>
    </div>
  );
};

export default MacroSliderGallery;
