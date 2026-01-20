import React, { useState } from 'react';
import { Slider } from './ui/slider';
import { Diamond, Sparkles, Lightbulb } from 'lucide-react';

export default function UserMacroControl({ onUpdate }) {
  const [values, setValues] = useState({ quality: 5, aesthetics: 5, light: 5 });

  const handleChange = (key, val) => {
    const newValues = { ...values, [key]: val[0] };
    setValues(newValues);
    onUpdate(newValues);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
        <h2 className="text-3xl font-serif text-white mb-12 text-center">Ajustes Maestros</h2>
        
        <div className="space-y-12">
            <div className="bg-card/30 p-8 rounded-lg border border-white/5">
                <div className="flex items-center gap-4 mb-4">
                    <Diamond className="text-blue-400" size={24} />
                    <div>
                        <h3 className="text-lg font-medium text-white">Calidad de Imagen</h3>
                        <p className="text-xs text-muted-foreground">Limpieza, resolución y reconstrucción</p>
                    </div>
                </div>
                <Slider 
                    value={[values.quality]} 
                    max={10} step={1} 
                    onValueChange={(v) => handleChange('quality', v)}
                    className="py-4"
                />
            </div>

            <div className="bg-card/30 p-8 rounded-lg border border-white/5">
                <div className="flex items-center gap-4 mb-4">
                    <Sparkles className="text-purple-400" size={24} />
                    <div>
                        <h3 className="text-lg font-medium text-white">Estética IA</h3>
                        <p className="text-xs text-muted-foreground">Estilo, belleza y composición</p>
                    </div>
                </div>
                <Slider 
                    value={[values.aesthetics]} 
                    max={10} step={1} 
                    onValueChange={(v) => handleChange('aesthetics', v)}
                    className="py-4"
                />
            </div>

            <div className="bg-card/30 p-8 rounded-lg border border-white/5">
                <div className="flex items-center gap-4 mb-4">
                    <Lightbulb className="text-yellow-400" size={24} />
                    <div>
                        <h3 className="text-lg font-medium text-white">Iluminación Pro</h3>
                        <p className="text-xs text-muted-foreground">Volumen, contraste y atmósfera</p>
                    </div>
                </div>
                <Slider 
                    value={[values.light]} 
                    max={10} step={1} 
                    onValueChange={(v) => handleChange('light', v)}
                    className="py-4"
                />
            </div>
        </div>
    </div>
  );
}
