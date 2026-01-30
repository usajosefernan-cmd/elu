
import React, { useState } from 'react';
import { AnalysisResult, SliderConfig } from './SimplePillarControl'; // Reuse types

interface MacroSliderGalleryProps {
    analysisResult: AnalysisResult;
    onSubmit: (sliderConfig: SliderConfig) => Promise<void>;
}

export const MacroSliderGallery: React.FC<MacroSliderGalleryProps> = ({
    analysisResult,
    onSubmit
}) => {

    // Estado: 9 macros independientes
    const [macroValues, setMacroValues] = useState<Record<string, number>>({
        restauracion: 5,      // PHOTOSCALER
        fidelidad: 5,         // PHOTOSCALER
        caracter: 5,          // PHOTOSCALER
        presencia: 5,         // STYLESCALER
        pulido: 5,            // STYLESCALER
        cinematica: 5,        // STYLESCALER
        volumen: 5,           // LIGHTSCALER
        drama: 5,             // LIGHTSCALER
        atmosfera: 5          // LIGHTSCALER
    });

    // Mapeo PRO: Cada macro controla 3-4 sliders
    const PRO_MACRO_DEFINITIONS: Record<string, string[]> = {
        // PHOTOSCALER
        'restauracion': ['p1', 'p2', 'p8', 'p9'],
        'fidelidad': ['p3', 'p4', 'p6'],
        'caracter': ['p5', 'p7'],
        // STYLESCALER
        'presencia': ['s1', 's2', 's3'],
        'pulido': ['s4', 's5', 's6'],
        'cinematica': ['s7', 's8', 's9'],
        // LIGHTSCALER
        'volumen': ['l1', 'l2', 'l3'],
        'drama': ['l4', 'l5', 'l6'],
        'atmosfera': ['l7', 'l8', 'l9']
    };

    const handleSubmit = async () => {
        // Traducir 9 valores macro a 27 valores de slider
        const sliderConfig: SliderConfig = {};

        Object.entries(macroValues).forEach(([macroKey, macroValue]) => {
            const slaveSliders = PRO_MACRO_DEFINITIONS[macroKey] || [];
            slaveSliders.forEach(sliderKey => {
                sliderConfig[sliderKey] = macroValue;
            });
        });

        await onSubmit(sliderConfig);
    };

    const macroGroups = [
        {
            pillar: 'PHOTOSCALER',
            icon: '🛠️',
            items: [
                { key: 'restauracion', label: 'Restauración', desc: 'Corrige defectos y geometría' },
                { key: 'fidelidad', label: 'Fidelidad', desc: 'Maximiza nitidez y texturas' },
                { key: 'caracter', label: 'Carácter', desc: 'Grano fílmico y movimiento' }
            ]
        },
        {
            pillar: 'STYLESCALER',
            icon: '✨',
            items: [
                { key: 'presencia', label: 'Presencia', desc: 'Piel y color vibrante' },
                { key: 'pulido', label: 'Pulido', desc: 'Contraste y suavidad' },
                { key: 'cinematica', label: 'Cinemática', desc: 'Look de película' }
            ]
        },
        {
            pillar: 'LIGHTSCALER',
            icon: '💡',
            items: [
                { key: 'volumen', label: 'Volumen', desc: 'Luces altas y relleno' },
                { key: 'drama', label: 'Drama', desc: 'Sombras y dramatismo' },
                { key: 'atmosfera', label: 'Atmósfera', desc: 'Temperatura y ambiente' }
            ]
        }
    ];

    return (
        <div className="macro-gallery p-4 bg-gray-900 text-white rounded-lg">
            <h2 className="text-xl font-bold mb-6">Mesa de Mezclas Pro</h2>

            {macroGroups.map(group => (
                <div key={group.pillar} className="pillar-section mb-8">
                    <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                        <span>{group.icon}</span> {group.pillar}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {group.items.map(item => (
                            <div key={item.key} className="macro-slider bg-gray-800 p-3 rounded">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="font-medium">{item.label}</label>
                                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{macroValues[item.key]}/10</span>
                                </div>
                                <p className="text-gray-400 text-xs mb-2 h-8">{item.desc}</p>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                    value={macroValues[item.key]}
                                    onChange={(e) =>
                                        setMacroValues({
                                            ...macroValues,
                                            [item.key]: Number(e.target.value)
                                        })
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={handleSubmit}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded transition-colors mt-4"
            >
                Generar Imagen
            </button>
        </div>
    );
};
