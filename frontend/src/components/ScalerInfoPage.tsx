
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanLine, Palette, Sun, Maximize, Play, Check } from 'lucide-react';
import { LuxButton } from './LuxButton';
import { PHOTOSCALER_EXAMPLES, STYLESCALER_EXAMPLES, LIGHTSCALER_EXAMPLES, UPSCALER_EXAMPLES } from '../constants/showcaseData';
import { ComparisonSlider } from './ComparisonSlider';

interface ScalerInfoPageProps {
    mode: 'FORENSIC' | 'ART' | 'STUDIO_LIGHT' | 'UPSCALE';
    onBack: () => void;
}

export const ScalerInfoPage: React.FC<ScalerInfoPageProps> = ({ mode, onBack }) => {
    const navigate = useNavigate();

    const config = {
        FORENSIC: {
            title: "PhotoScaler™",
            subtitle: "Reconstrucción Forense de Geometría",
            icon: ScanLine,
            color: "text-prismatic-blue",
            bg: "bg-prismatic-blue/10",
            border: "border-prismatic-blue/20",
            desc: "Nuestro motor insignia analiza la topología facial y reconstruye píxeles perdidos basándose en modelos de anatomía real. Ideal para selfies borrosas, fotos antiguas o baja iluminación.",
            features: [
                "Recuperación de textura de piel real",
                "Corrección de aberración de lente",
                "Eliminación de ruido ISO inteligente",
                "Enfoque de iris y reconstrucción dental"
            ],
            data: PHOTOSCALER_EXAMPLES
        },
        ART: {
            title: "StyleScaler™",
            subtitle: "Transferencia de Estilo & Vibe",
            icon: Palette,
            color: "text-pink-400",
            bg: "bg-pink-500/10",
            border: "border-pink-500/20",
            desc: "Transforma la realidad. Aplica estéticas cinematográficas, pictorialistas o futuristas manteniendo la identidad del sujeto. No es un filtro, es una reiluminación semántica.",
            features: [
                "Etalonaje de Cine (Color Grading)",
                "Transferencia de Materiales (Piel de Oro, Cibernética)",
                "Restauración Artística",
                "Fusión de Conceptos Abstractos"
            ],
            data: STYLESCALER_EXAMPLES
        },
        STUDIO_LIGHT: {
            title: "LightScaler™",
            subtitle: "Iluminación Volumétrica Virtual",
            icon: Sun,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            desc: "Cambia la luz después de tomar la foto. Nuestro motor de 'Relighting' genera mapas de profundidad para insertar fuentes de luz virtuales realistas.",
            features: [
                "Relighting 3D",
                "Sombras Suaves (Softbox Simulation)",
                "Rim Light (Luz de Contorno)",
                "Atmósfera Volumétrica"
            ],
            data: LIGHTSCALER_EXAMPLES
        },
        UPSCALE: {
            title: "UpScaler™",
            subtitle: "Ampliación 8K Sin Pérdida",
            icon: Maximize,
            color: "text-lumen-gold",
            bg: "bg-lumen-gold/10",
            border: "border-lumen-gold/20",
            desc: "Escalado fractal que inventa detalle plausible donde no existe. Convierte imágenes de 1MP en obras maestras de 50MP listas para imprimir.",
            features: [
                "Escalado 2x, 4x, 8x",
                "Reducción de artefactos JPEG",
                "Nitidez perceptual adaptativa",
                "Salida para impresión Fine Art"
            ],
            data: UPSCALER_EXAMPLES
        }
    }[mode];

    return (
        <div className="min-h-screen bg-void-black text-white pt-20 pb-24">
            {/* HER0 SECTION */}
            <div className="max-w-4xl mx-auto px-6">
                <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Estudio
                </button>

                <div className="flex flex-col md:flex-row gap-8 items-start mb-16">
                    <div className={`p-6 rounded-2xl ${config.bg} ${config.border} border-2`}>
                        <config.icon className={`w-12 h-12 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                        <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 ${config.color}`}>
                            {config.title}
                        </h1>
                        <h2 className="text-xl text-gray-300 font-light mb-6">
                            {config.subtitle}
                        </h2>
                        <p className="text-gray-400 leading-relaxed mb-8 max-w-2xl">
                            {config.desc}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {config.features.map((feat, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                                    <Check className={`w-4 h-4 ${config.color}`} />
                                    <span className="text-sm font-bold text-gray-200">{feat}</span>
                                </div>
                            ))}
                        </div>

                        <LuxButton onClick={() => navigate('/')} className="px-8 py-4 text-sm">
                            <Play className="w-4 h-4 mr-2" fill="currentColor" />
                            PROBAR AHORA
                        </LuxButton>
                    </div>
                </div>

                {/* SHOWCASE GRID */}
                <h3 className="text-2xl font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4">
                    Galería de Muestras
                </h3>

                <div className="space-y-24">
                    {config.data.map((item: any, idx: number) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-full md:w-1/2 aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                                <ComparisonSlider
                                    originalImage={item.before}
                                    processedImage={item.after}
                                    objectFit="cover"
                                />
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] uppercase font-bold text-white border border-white/20">
                                    Desliza para Comparar
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-8 ${config.bg.replace('/10', '')} rounded-full`} />
                                    <h4 className="text-xl font-bold uppercase">{item.title || `Ejemplo ${idx + 1}`}</h4>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {item.desc || "Observa la mejora dramática en definición y textura. Nuestro algoritmo recupera información perdida utilizando modelos generativos avanzados."}
                                </p>
                                <div className="bg-[#0A0A0F] p-4 rounded-xl border border-white/5 font-mono text-xs text-gray-500">
                                    <div className="flex justify-between mb-1">
                                        <span>Model:</span> <span className="text-white">Lux-Flux v1.4</span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span>Steps:</span> <span className="text-white">25 Inference</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Upscale:</span> <span className="text-white">4x Native</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
