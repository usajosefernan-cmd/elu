
import React, { useState } from 'react';

// Common Types (Ideally in a types.ts file)
export type SliderConfig = Record<string, number>;

export interface AnalysisResult {
    cat_code: string;
    detected_defects: string[];
    visual_summary: string;
    reasoning: string;
    auto_settings?: Record<string, any>;
    severity_score: number;
}

interface SimplePillarControlProps {
    analysisResult: AnalysisResult;  // Resultado de vision-orchestrator
    onSubmit: (sliderConfig: SliderConfig) => Promise<void>;
}

export const SimplePillarControl: React.FC<SimplePillarControlProps> = ({
    analysisResult,
    onSubmit
}) => {

    // Estado local: un slider por pilar
    const [photoscalerValue, setPhotoscalerValue] = useState(5);
    const [stylescalerValue, setStylescalerValue] = useState(5);
    const [lightscalerValue, setLightscalerValue] = useState(5);

    const { macroDefs } = useImageStore();

    // Dynamically build user mappings from Store (Maestro Compliance)
    const getUserSlaves = (pillarKey: string): string[] => {
        // Find macro with ui_title corresponding to the pillar concept
        // In Maestro DB:
        // 'calidad_imagen' (USER) -> p1..p9 (Concept: Photoscaler)
        // 'estetica_ia' (USER) -> s1..s9 (Concept: Stylescaler)
        // 'iluminacion_pro' (USER) -> l1..l9 (Concept: Lightscaler)

        // We match by the known keys in DB
        const keyMap: Record<string, string> = {
            photoscaler: 'calidad_imagen',
            stylescaler: 'estetica_ia',
            lightscaler: 'iluminacion_pro'
        };

        const macroKey = keyMap[pillarKey];
        const macro = macroDefs[macroKey];
        return macro?.slave_sliders || [];
    };

    const handleSubmit = async () => {
        const sliderConfig: SliderConfig = {};

        // Photoscaler
        getUserSlaves('photoscaler').forEach(key => sliderConfig[key] = photoscalerValue);
        // Stylescaler
        getUserSlaves('stylescaler').forEach(key => sliderConfig[key] = stylescalerValue);
        // Lightscaler
        getUserSlaves('lightscaler').forEach(key => sliderConfig[key] = lightscalerValue);

        await onSubmit(sliderConfig);
    };

    return (
        <div className="pillar-control p-4 bg-gray-900 text-white rounded-lg">
            <h2 className="text-xl font-bold mb-4">Ajusta los 3 Pilares Principales</h2>

            {/* PHOTOSCALER Slider */}
            <div className="pillar-group mb-6">
                <div className="flex justify-between mb-2">
                    <label className="font-semibold">💎 Calidad de Imagen</label>
                    <span>{photoscalerValue}/10</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="10"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    value={photoscalerValue}
                    onChange={(e) => setPhotoscalerValue(Number(e.target.value))}
                />
                <p className="text-gray-400 text-sm mt-1">Mejora ruido, nitidez, y definición técnica</p>
            </div>

            {/* STYLESCALER Slider */}
            <div className="pillar-group mb-6">
                <div className="flex justify-between mb-2">
                    <label className="font-semibold">✨ Estética IA</label>
                    <span>{stylescalerValue}/10</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="10"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    value={stylescalerValue}
                    onChange={(e) => setStylescalerValue(Number(e.target.value))}
                />
                <p className="text-gray-400 text-sm mt-1">Retoque de piel, colores vibrantes, efecto cinematográfico</p>
            </div>

            {/* LIGHTSCALER Slider */}
            <div className="pillar-group mb-6">
                <div className="flex justify-between mb-2">
                    <label className="font-semibold">💡 Iluminación Pro</label>
                    <span>{lightscalerValue}/10</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="10"
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    value={lightscalerValue}
                    onChange={(e) => setLightscalerValue(Number(e.target.value))}
                />
                <p className="text-gray-400 text-sm mt-1">Exposición, contraste, drama y atmósfera</p>
            </div>

            <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                Generar Imagen
            </button>
        </div>
    );
};
