
import React, { useState, useEffect } from 'react';
import { AnalysisResult, SliderConfig } from './SimplePillarControl';

interface MicroSliderGridProps {
    analysisResult: AnalysisResult;
    onSubmit: (sliderConfig: SliderConfig) => Promise<void>;
}

interface SliderDefinition {
    id: number;
    slider_key: string;
    pillar: string;
    ui_title: string;
    ui_description: string;
    auto_default: number;
}

export const MicroSliderGrid: React.FC<MicroSliderGridProps> = ({
    analysisResult,
    onSubmit
}) => {

    // 27 sliders independientes
    const [sliderConfig, setSliderConfig] = useState<SliderConfig>(() => {
        // Inicializar desde auto_settings si existen
        const autoSettings = analysisResult?.auto_settings || {};
        const defaults: SliderConfig = {};

        // p1-p9: PHOTOSCALER
        for (let i = 1; i <= 9; i++) defaults[`p${i}`] = autoSettings[`p${i}`] ?? 5;
        // s1-s9: STYLESCALER
        for (let i = 1; i <= 9; i++) defaults[`s${i}`] = autoSettings[`s${i}`] ?? 5;
        // l1-l9: LIGHTSCALER
        for (let i = 1; i <= 9; i++) defaults[`l${i}`] = autoSettings[`l${i}`] ?? 5;

        return defaults;
    });

    // Definiciones de sliders desde BD (socket/API call al cargar)
    const [sliderDefinitions, setSliderDefinitions] = useState<SliderDefinition[]>([]);

    useEffect(() => {
        // Cargar definiciones de sliders desde backend
        // En un entorno real, esto vendría de Supabase directamente
        // Mocking for now based on the spec
        const mockDefinitions: SliderDefinition[] = [];
        const pillars = ['PHOTOSCALER', 'STYLESCALER', 'LIGHTSCALER'];
        const prefixes = { PHOTOSCALER: 'p', STYLESCALER: 's', LIGHTSCALER: 'l' };

        // We would fetch this effectively. For now, let's just use placeholder data 
        // or rely on the fact that keys represent the definition.
        // Ideally we fetch from supabase.
    }, []);

    const handleSliderChange = (sliderKey: string, value: number) => {
        setSliderConfig(prev => ({ ...prev, [sliderKey]: value }));
    };

    const handleSubmit = async () => {
        await onSubmit(sliderConfig);
    };

    const pillars = ['PHOTOSCALER', 'STYLESCALER', 'LIGHTSCALER'];
    const prefixes = { PHOTOSCALER: 'p', STYLESCALER: 's', LIGHTSCALER: 'l' };

    return (
        <div className="micro-slider-grid p-4 bg-gray-900 text-white rounded-lg">
            <h2 className="text-xl font-bold mb-6">Ingeniería Forense: 27 Sliders Crudos</h2>

            {pillars.map(pillar => (
                <div key={pillar} className="pillar-section mb-8 border-b border-gray-800 pb-6">
                    <h3 className="text-lg font-semibold mb-4 text-blue-400">{pillar}</h3>

                    <div className="slider-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => {
                            // @ts-ignore
                            const sliderKey = `${prefixes[pillar]}${i + 1}`;

                            // Mock title
                            const title = `${sliderKey.toUpperCase()} Control`;

                            return (
                                <div key={sliderKey} className="slider-card bg-gray-800 p-3 rounded hover:bg-gray-750 transition-colors">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="font-medium text-sm">{title}</label>
                                        <div className="text-xs bg-black px-2 py-0.5 rounded text-blue-300">
                                            {sliderConfig[sliderKey] ?? 5}/10
                                            {sliderConfig[sliderKey] === 0 && ' (OFF)'}
                                            {sliderConfig[sliderKey] > 0 && sliderConfig[sliderKey] <= 3 && ' (LOW)'}
                                            {sliderConfig[sliderKey] > 3 && sliderConfig[sliderKey] <= 6 && ' (MED)'}
                                            {sliderConfig[sliderKey] > 6 && sliderConfig[sliderKey] <= 9 && ' (HIGH)'}
                                            {sliderConfig[sliderKey] === 10 && ' (FORCE)'}
                                        </div>
                                    </div>

                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        value={sliderConfig[sliderKey] ?? 5}
                                        onChange={(e) => handleSliderChange(sliderKey, Number(e.target.value))}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <button
                onClick={handleSubmit}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors mt-2"
            >
                Generar Imagen (PRO_LUX)
            </button>
        </div>
    );
};
