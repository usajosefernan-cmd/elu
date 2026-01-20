import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Check, X, Zap, Image, Settings, AlertTriangle, HelpCircle, Lightbulb, BookOpen, Play, Pause } from 'lucide-react';

interface TutorialProps {
    onBack: () => void;
}

// Navegación por secciones
type Section = 'getting-started' | 'workflow' | 'by-type' | 'settings' | 'issues' | 'checklist' | 'faq' | 'tips';

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'getting-started', label: 'Empezar', icon: Zap },
    { id: 'workflow', label: 'Workflow', icon: Play },
    { id: 'by-type', label: 'Por Tipo', icon: Image },
    { id: 'settings', label: 'Ajustes', icon: Settings },
    { id: 'issues', label: 'Problemas', icon: AlertTriangle },
    { id: 'checklist', label: 'Checklist', icon: Check },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'tips', label: 'Tips', icon: Lightbulb },
];

// Tipos de imagen para guía de optimización
type ImageType = 'portraits' | 'landscapes' | 'products' | 'food' | 'architecture' | 'text';

const IMAGE_TYPES: { id: ImageType; emoji: string; title: string; desc: string }[] = [
    { id: 'portraits', emoji: '👤', title: 'Retratos', desc: 'Caras, selfies, headshots' },
    { id: 'landscapes', emoji: '🏞️', title: 'Paisajes', desc: 'Naturaleza, viajes' },
    { id: 'products', emoji: '📦', title: 'Productos', desc: 'Joyería, electrónica' },
    { id: 'food', emoji: '🍕', title: 'Comida', desc: 'Platos, bebidas' },
    { id: 'architecture', emoji: '🏢', title: 'Arquitectura', desc: 'Edificios, interiores' },
    { id: 'text', emoji: '📄', title: 'Texto/Gráficos', desc: 'Capturas, logos' },
];

const IMAGE_TYPE_SETTINGS: Record<ImageType, { creativity: string; fractality: string; boost: string; presets: string; avoid?: string }> = {
    portraits: { creativity: '2-4', fractality: '6-7', boost: 'Light +2 a +3', presets: 'Studio Lighting, Balanced Polish', avoid: 'Max Sharpness (puede verse artificial)' },
    landscapes: { creativity: '5-7', fractality: '8-9', boost: 'Color +2 a +4', presets: 'Cinematic Teal, Creative Reality, Max Sharpness' },
    products: { creativity: '4-6', fractality: '9-10', boost: 'Material Glow +3 a +5', presets: 'Balanced Polish, Max Sharpness' },
    food: { creativity: '3-5', fractality: '7-8', boost: 'Color +3 a +5, Warmth +2', presets: 'Trend (redes), Balanced Polish (web)', avoid: 'Max Sharpness (puede verse clínico)' },
    architecture: { creativity: '5-7', fractality: '8-9', boost: 'Contrast +3 a +4, Coolness +1', presets: 'Balanced Polish, Max Sharpness' },
    text: { creativity: '0-1', fractality: '4-5', boost: 'Sin cambios de contenido', presets: 'Forensic Recovery' },
};

export const TutorialInteractive: React.FC<TutorialProps> = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState<Section>('getting-started');
    const [expandedType, setExpandedType] = useState<ImageType | null>(null);

    // Sliders interactivos
    const [creativity, setCreativity] = useState(5);
    const [fractality, setFractality] = useState(5);
    const [lightBoost, setLightBoost] = useState(0);
    const [colorBoost, setColorBoost] = useState(0);

    // FAQ expandidos
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const toggleFaq = (idx: number) => setExpandedFaq(expandedFaq === idx ? null : idx);
    const toggleImageType = (type: ImageType) => setExpandedType(expandedType === type ? null : type);

    return (
        <div className="w-full min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#111] text-white">
            {/* Header */}
            <header className="bg-gradient-to-r from-[#1a6478] to-[#0f3d4a] py-12 px-6 text-center rounded-b-xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">🎯 LuxScaler Tutorial</h1>
                <p className="text-lg text-white/80">Obtén upscales 4K/8K de máxima calidad en 3 pasos</p>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Navegación */}
                <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-10">
                    {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveSection(id)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${activeSection === id
                                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                        </button>
                    ))}
                </nav>

                {/* Sección: Getting Started */}
                {activeSection === 'getting-started' && (
                    <section className="animate-fadeIn space-y-8">
                        <h2 className="text-2xl font-bold border-b border-[#D4AF37]/30 pb-4">🚀 Empezando</h2>

                        <div className="bg-white/5 border-l-4 border-[#D4AF37] p-6 rounded-r-xl">
                            <h3 className="text-xl font-semibold mb-4">¿Qué es LuxScaler?</h3>
                            <p className="text-white/70 mb-4">LuxScaler es una plataforma de <strong className="text-white">mejora de imagen con IA</strong> que:</p>
                            <ul className="space-y-2 text-white/70">
                                <li className="flex items-center gap-2"><span className="text-lg">📸</span> <strong className="text-white">Upscala</strong> imágenes a resolución 4K/8K</li>
                                <li className="flex items-center gap-2"><span className="text-lg">🎨</span> <strong className="text-white">Mejora</strong> calidad, claridad y color</li>
                                <li className="flex items-center gap-2"><span className="text-lg">🧠</span> <strong className="text-white">Analiza inteligentemente</strong> el tipo de imagen</li>
                                <li className="flex items-center gap-2"><span className="text-lg">⚡</span> <strong className="text-white">Genera 6 variaciones</strong> en segundos (Preview)</li>
                                <li className="flex items-center gap-2"><span className="text-lg">💎</span> <strong className="text-white">Produce masterpieces 4K</strong> (Master mode)</li>
                            </ul>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full bg-white/5 rounded-xl overflow-hidden">
                                <thead className="bg-[#D4AF37] text-black">
                                    <tr>
                                        <th className="p-4 text-left font-bold">Término</th>
                                        <th className="p-4 text-left font-bold">Significado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    <tr className="hover:bg-white/5"><td className="p-4 font-semibold">Preview</td><td className="p-4 text-white/70">Vista previa rápida de 6 estilos IA (30 seg)</td></tr>
                                    <tr className="hover:bg-white/5"><td className="p-4 font-semibold">Master</td><td className="p-4 text-white/70">Output final 4K/8K ultra-calidad (15-45 seg)</td></tr>
                                    <tr className="hover:bg-white/5"><td className="p-4 font-semibold">Creativity</td><td className="p-4 text-white/70">Cuánto "reimagina" vs "preserva" la IA</td></tr>
                                    <tr className="hover:bg-white/5"><td className="p-4 font-semibold">Fractality</td><td className="p-4 text-white/70">Nivel de nitidez (0=suave, 10=hiper-nítido)</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Sección: Workflow */}
                {activeSection === 'workflow' && (
                    <section className="animate-fadeIn space-y-8">
                        <h2 className="text-2xl font-bold border-b border-[#D4AF37]/30 pb-4">🔄 El Workflow de LuxScaler</h2>

                        {[
                            {
                                step: 1, title: 'Sube tu Imagen ⬆️', content: (
                                    <div className="space-y-4">
                                        <p className="text-white/70"><strong className="text-white">¿Qué ocurre internamente?</strong></p>
                                        <ul className="list-disc list-inside text-white/70 space-y-1">
                                            <li>Tu imagen es analizada por la Vision AI de LuxScaler</li>
                                            <li>Formato: JPEG, PNG (máx 4MB)</li>
                                            <li>Resolución: Cualquiera (incluso fotos de móvil pequeñas)</li>
                                        </ul>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="bg-green-500/10 border-l-4 border-green-500 p-4 rounded-r-lg">
                                                <p className="font-semibold text-green-400 mb-2">✅ HAZ:</p>
                                                <ul className="text-sm text-white/70 space-y-1">
                                                    <li>• Usa la fuente de mayor calidad</li>
                                                    <li>• Asegura buena iluminación</li>
                                                    <li>• Retrato: Cara claramente visible</li>
                                                </ul>
                                            </div>
                                            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                                                <p className="font-semibold text-red-400 mb-2">❌ EVITA:</p>
                                                <ul className="text-sm text-white/70 space-y-1">
                                                    <li>• Imágenes muy comprimidas</li>
                                                    <li>• Fotos totalmente oscuras o quemadas</li>
                                                    <li>• Stock photos con marca de agua</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                step: 2, title: 'Ve las 6 Variaciones Preview 🎬', content: (
                                    <div className="space-y-4">
                                        <ol className="list-decimal list-inside text-white/70 space-y-2">
                                            <li><strong className="text-white">Vision Analysis:</strong> Detecta tipo de imagen, problemas de calidad, iluminación</li>
                                            <li><strong className="text-white">AI Generation:</strong> Crea 6 estilos de mejora diferentes</li>
                                            <li><strong className="text-white">Comparar:</strong> Ve todas las variaciones lado a lado</li>
                                        </ol>
                                        <div className="bg-white/5 p-4 rounded-xl mt-4 space-y-2">
                                            <p className="font-semibold text-[#D4AF37]">Los 6 Estilos:</p>
                                            <p className="text-sm text-white/70">1. <strong>Forensic Recovery</strong> — Arregla daño, blur, ruido</p>
                                            <p className="text-sm text-white/70">2. <strong>Balanced Polish</strong> — Look comercial profesional</p>
                                            <p className="text-sm text-white/70">3. <strong>Trend</strong> — Estilo popular actual (ej. "Cinematic Teal")</p>
                                            <p className="text-sm text-white/70">4. <strong>Studio Lighting</strong> — Luces de estudio profesional</p>
                                            <p className="text-sm text-white/70">5. <strong>Creative Reality</strong> — Añade detalles realistas</p>
                                            <p className="text-sm text-white/70">6. <strong>Max Sharpness</strong> — Ultra-detallado, hiper-limpio</p>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                step: 3, title: 'Elige y Upscala a 4K 👑', content: (
                                    <div className="space-y-4 text-white/70">
                                        <ul className="list-disc list-inside space-y-2">
                                            <li>Tu preview elegida se usa como <strong className="text-white">referencia de estilo</strong></li>
                                            <li>La imagen original se upscala <strong className="text-white">preservando identidad</strong></li>
                                            <li>Se genera output nativo 4K/8K</li>
                                            <li>Tarda 15-45 segundos según resolución</li>
                                        </ul>
                                    </div>
                                )
                            },
                        ].map(({ step, title, content }) => (
                            <div key={step} className="flex gap-6">
                                <div className="flex-shrink-0 w-14 h-14 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-2xl font-bold">
                                    {step}
                                </div>
                                <div className="flex-1 bg-white/5 border-l-4 border-[#D4AF37] p-6 rounded-r-xl">
                                    <h3 className="text-xl font-semibold mb-4">{title}</h3>
                                    {content}
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* Sección: Por Tipo de Imagen */}
                {activeSection === 'by-type' && (
                    <section className="animate-fadeIn space-y-8">
                        <h2 className="text-2xl font-bold border-b border-[#D4AF37]/30 pb-4">🎨 Optimización por Tipo de Imagen</h2>
                        <p className="text-white/60">Haz clic en un tipo de imagen para ver los ajustes recomendados.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {IMAGE_TYPES.map(({ id, emoji, title, desc }) => (
                                <div key={id}>
                                    <button
                                        onClick={() => toggleImageType(id)}
                                        className={`w-full text-left p-5 rounded-xl border-t-4 transition-all ${expandedType === id
                                                ? 'bg-[#D4AF37]/20 border-[#D4AF37]'
                                                : 'bg-white/5 border-white/20 hover:bg-white/10 hover:-translate-y-1'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">{emoji}</span>
                                            <h4 className="text-lg font-semibold">{title}</h4>
                                            <ChevronDown className={`w-5 h-5 ml-auto transition-transform ${expandedType === id ? 'rotate-180' : ''}`} />
                                        </div>
                                        <p className="text-sm text-white/50">{desc}</p>
                                    </button>

                                    {expandedType === id && (
                                        <div className="mt-2 p-5 bg-white/5 rounded-xl border-l-4 border-[#D4AF37] animate-fadeIn">
                                            <h4 className="font-semibold text-[#D4AF37] mb-3">Ajustes Recomendados:</h4>
                                            <ul className="space-y-2 text-sm text-white/70">
                                                <li>🎯 <strong className="text-white">Creativity:</strong> {IMAGE_TYPE_SETTINGS[id].creativity}</li>
                                                <li>🎯 <strong className="text-white">Fractality:</strong> {IMAGE_TYPE_SETTINGS[id].fractality}</li>
                                                <li>🎯 <strong className="text-white">Boost:</strong> {IMAGE_TYPE_SETTINGS[id].boost}</li>
                                            </ul>
                                            <p className="mt-3 text-sm"><strong className="text-white">Mejores Presets:</strong> <span className="text-white/60">{IMAGE_TYPE_SETTINGS[id].presets}</span></p>
                                            {IMAGE_TYPE_SETTINGS[id].avoid && (
                                                <p className="mt-2 text-sm text-yellow-400/80">⚠️ Evitar: {IMAGE_TYPE_SETTINGS[id].avoid}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Sección: Ajustes Avanzados */}
                {activeSection === 'settings' && (
                    <section className="animate-fadeIn space-y-8">
                        <h2 className="text-2xl font-bold border-b border-[#D4AF37]/30 pb-4">🎛️ Ajustes Avanzados</h2>
                        <p className="text-white/60">Experimenta con los sliders para entender cómo afectan al resultado.</p>

                        {/* Slider: Creativity */}
                        <div className="bg-white/5 p-6 rounded-xl border-l-4 border-[#D4AF37]">
                            <h3 className="text-lg font-semibold mb-4">1. Creativity (0-10)</h3>
                            <div className="bg-black/20 p-4 rounded-lg">
                                <input
                                    type="range" min={0} max={10} value={creativity}
                                    onChange={(e) => setCreativity(Number(e.target.value))}
                                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                                />
                                <p className="text-center mt-2 text-xl font-bold text-[#D4AF37]">{creativity}/10</p>
                            </div>
                            <ul className="mt-4 text-sm text-white/70 space-y-1">
                                <li><strong className="text-white">0:</strong> Restauración 1:1 perfecta (sin cambios)</li>
                                <li><strong className="text-white">5:</strong> Equilibrado (algo de mejora, preserva original)</li>
                                <li><strong className="text-white">10:</strong> Reimaginación total (muy artístico, puede cambiar apariencia)</li>
                            </ul>
                        </div>

                        {/* Slider: Fractality */}
                        <div className="bg-white/5 p-6 rounded-xl border-l-4 border-[#D4AF37]">
                            <h3 className="text-lg font-semibold mb-4">2. Fractality (0-10)</h3>
                            <div className="bg-black/20 p-4 rounded-lg">
                                <input
                                    type="range" min={0} max={10} value={fractality}
                                    onChange={(e) => setFractality(Number(e.target.value))}
                                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                                />
                                <p className="text-center mt-2 text-xl font-bold text-[#D4AF37]">{fractality}/10</p>
                            </div>
                            <ul className="mt-4 text-sm text-white/70 space-y-1">
                                <li><strong className="text-white">0:</strong> Muy suave, estilo pintura</li>
                                <li><strong className="text-white">5:</strong> Nivel de detalle normal</li>
                                <li><strong className="text-white">10:</strong> Hiper-nítido, cada detalle visible</li>
                            </ul>
                        </div>

                        {/* Slider: Light Boost */}
                        <div className="bg-white/5 p-6 rounded-xl border-l-4 border-[#D4AF37]">
                            <h3 className="text-lg font-semibold mb-4">3. Light Boost (-5 a +5)</h3>
                            <div className="bg-black/20 p-4 rounded-lg">
                                <input
                                    type="range" min={-5} max={5} value={lightBoost}
                                    onChange={(e) => setLightBoost(Number(e.target.value))}
                                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                                />
                                <p className="text-center mt-2 text-xl font-bold text-[#D4AF37]">{lightBoost > 0 ? '+' : ''}{lightBoost}</p>
                            </div>
                            <ul className="mt-4 text-sm text-white/70 space-y-1">
                                <li><strong className="text-white">-5:</strong> Oscurecer sombras, añadir drama</li>
                                <li><strong className="text-white">0:</strong> Mantener iluminación original</li>
                                <li><strong className="text-white">+5:</strong> Iluminar, revelar detalle en áreas oscuras</li>
                            </ul>
                        </div>

                        {/* Slider: Color Boost */}
                        <div className="bg-white/5 p-6 rounded-xl border-l-4 border-[#D4AF37]">
                            <h3 className="text-lg font-semibold mb-4">4. Color Boost (-5 a +5)</h3>
                            <div className="bg-black/20 p-4 rounded-lg">
                                <input
                                    type="range" min={-5} max={5} value={colorBoost}
                                    onChange={(e) => setColorBoost(Number(e.target.value))}
                                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                                />
                                <p className="text-center mt-2 text-xl font-bold text-[#D4AF37]">{colorBoost > 0 ? '+' : ''}{colorBoost}</p>
                            </div>
                            <ul className="mt-4 text-sm text-white/70 space-y-1">
                                <li><strong className="text-white">-5:</strong> Desaturar (B&N, look apagado)</li>
                                <li><strong className="text-white">0:</strong> Mantener colores originales</li>
                                <li><strong className="text-white">+5:</strong> Hiper-vibrante, colores saturados</li>
                            </ul>
                        </div>
                    </section>
                )}

                {/* Sección: Problemas Comunes */}
                {activeSection === 'issues' && (
                    <section className="animate-fadeIn space-y-6">
                        <h2 className="text-2xl font-bold border-b border-[#D4AF37]/30 pb-4">🛠️ Problemas Comunes y Soluciones</h2>

                        {[
                            { title: '❌ Mi cara se ve diferente en el output 4K', why: 'Creativity estaba demasiado alto (&gt;5) o la IA enfatizó rasgos faciales', solutions: ['Usa Creativity 2-4 para retratos', 'Elige la preview que mejor coincida con tu cara', 'Usa el preset "Balanced Polish" (estilo conservador)'] },
                            { title: '❌ La imagen está muy borrosa/suave', why: 'Fractality estaba demasiado bajo (&lt;4) o la imagen original era muy baja resolución', solutions: ['Aumenta Fractality a 7-8', 'Usa la preview "Max Sharpness"', 'Prueba "Forensic Recovery" si el original está dañado'] },
                            { title: '❌ Los colores se ven sobresaturados/falsos', why: 'Color Boost estaba demasiado alto (&gt;+4) o la imagen ya tenía color grading', solutions: ['Reduce Color Boost a +2 o 0', 'Usa "Balanced Polish" (color conservador)', 'Usa "Trend" si quieres colores artísticos'] },
                            { title: '❌ La iluminación se ve rara/artificial', why: 'Light Boost estaba demasiado extremo (&gt;+4 o &lt;-4) o la iluminación original era inconsistente', solutions: ['Mantén Light Boost entre -2 y +3', 'Usa "Studio Lighting" (balance profesional)', 'Elige una preview que coincida con tu estilo'] },
                            { title: '❌ El texto/detalles se ven generados por IA', why: 'Creativity estaba demasiado alto (la IA "imaginó" detalles) o tipo de imagen complejo (texto + foto)', solutions: ['Pon Creativity a 0-1 para documentos', 'Usa "Forensic Recovery" (seguro, cambios mínimos)', 'Evita "Creative Reality" o "Max Sharpness"'] },
                        ].map((issue, idx) => (
                            <div key={idx} className="bg-white/5 border-l-4 border-red-500 p-6 rounded-r-xl">
                                <h3 className="text-lg font-semibold text-red-400 mb-2">{issue.title}</h3>
                                <p className="text-sm text-white/60 mb-3"><strong>Por qué:</strong> {issue.why}</p>
                                <p className="text-sm font-semibold text-white mb-2">Solución:</p>
                                <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                                    {issue.solutions.map((sol, i) => <li key={i}>{sol}</li>)}
                                </ul>
                            </div>
                        ))}
                    </section>
                )}

                {/* Sección: Checklist */}
                {activeSection === 'checklist' && (
                    <section className="animate-fadeIn space-y-8">
                        <h2 className="text-2xl font-bold border-b border-[#D4AF37]/30 pb-4">✅ Checklist de Calidad</h2>

                        {[
                            { title: 'Antes de Subir', items: ['Imagen de la mayor resolución posible', 'Sujeto principal enfocado', 'Iluminación razonable (no completamente oscuro)', 'Imagen no muy comprimida/pixelada'] },
                            { title: 'Después de Generar Preview', items: ['Las 6 variaciones se ven razonables', 'Al menos una coincide con lo que querías', 'Sin artefactos obvios (extremidades extra, texturas raras)', 'Puedes ver qué preset coincide mejor con tu estilo'] },
                            { title: 'Después de Upscalar a 4K', items: ['Imagen más nítida que la preview', 'Colores naturales (no sobresaturados)', 'Cara (si hay) se parece a ti (variación ±5-10% es normal)', 'Texto (si hay) es legible', 'Sin patrones raros ni alucinaciones'] },
                            { title: 'Si Algo Se Ve Mal', items: ['Re-ejecuta con diferentes ajustes', 'Prueba un estilo de preview diferente', 'Baja Creativity para output más conservador', 'Consulta FAQ o contacta soporte'] },
                        ].map((group, gIdx) => (
                            <div key={gIdx} className="bg-white/5 p-6 rounded-xl">
                                <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">{group.title}</h3>
                                <ul className="space-y-3">
                                    {group.items.map((item, iIdx) => (
                                        <li key={iIdx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border-l-4 border-[#D4AF37]/50">
                                            <span className="text-lg">☐</span>
                                            <span className="text-white/80">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </section>
                )}

                {/* Sección: FAQ */}
                {activeSection === 'faq' && (
                    <section className="animate-fadeIn space-y-4">
                        <h2 className="text-2xl font-bold border-b border-[#D4AF37]/30 pb-4">📚 Preguntas Frecuentes</h2>

                        {[
                            { q: '¿Cuál es la diferencia entre Preview y Master?', a: 'Preview: 6 estilos IA diferentes, baja resolución, rápido (30s). Master: Tu estilo elegido upscalado a 4K, lento (15-45s). Piensa en Preview como "probar opciones" y Master como "plato final".' },
                            { q: '¿Puedo editar ajustes después de la preview?', a: '¡Sí! Cada preview se calcula con ajustes específicos. Puedes ajustar todos los sliders antes de hacer clic en Preview, ver el resultado en 30 segundos, y probar diferentes ajustes otra vez si quieres.' },
                            { q: '¿Qué resolución tendrá mi imagen final?', a: '4K: 3840 × 2160 píxeles (o upscale equivalente). 8K: 7680 × 4320 píxeles (o upscale equivalente). Tu ratio de aspecto original se preserva.' },
                            { q: '¿Puedo upscalar múltiples imágenes?', a: '¡Sí! Sube múltiples imágenes, genera previews para cada una, luego upscala individualmente o en lote.' },
                            { q: '¿Qué formatos acepta LuxScaler?', a: '✅ JPEG, ✅ PNG, ❌ WebP (próximamente), ❌ GIF animado (solo imágenes estáticas). Output siempre es PNG (sin pérdida) o JPEG (a tu elección).' },
                            { q: '¿Cuánto tarda el upscaling a 4K?', a: 'Imágenes pequeñas (<2MB): 15-20 segundos. Medianas (2-4MB): 20-30 segundos. Grandes (4MB+): 30-45 segundos. Preview siempre ~30 segundos sin importar tamaño.' },
                            { q: '¿Qué pasa si no me gusta el resultado 4K?', a: 'Ver nuestra Política de Reembolso en Términos de Servicio: ¿Diferente de la preview? Prueba nuevos ajustes (preview gratis). ¿Error técnico? Contacta soporte. ¿Simplemente no te gustó? Sin reembolso (viste la preview primero).' },
                            { q: '¿Se almacena mi imagen después del upscaling?', a: 'Tu upload original: Eliminado después de 30 días (o bajo petición). Tu output 4K: Tuyo para descargar, mantenemos backup encriptado por 1 año. Ver Política de Privacidad para detalles completos.' },
                            { q: '¿Puedo usar la imagen 4K comercialmente?', a: '¡Sí! Eres dueño de todos los outputs. Ver Términos de Servicio para derechos comerciales completos.' },
                        ].map((faq, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full flex items-center justify-between p-4 bg-[#D4AF37] text-black font-semibold hover:bg-[#c9a432] transition-colors"
                                >
                                    <span>Q: {faq.q}</span>
                                    <ChevronDown className={`w-5 h-5 transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedFaq === idx && (
                                    <div className="p-4 bg-white/5 text-white/70 animate-fadeIn">
                                        <p><strong>A:</strong> {faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* Sección: Tips Avanzados */}
                {activeSection === 'tips' && (
                    <section className="animate-fadeIn space-y-6">
                        <h2 className="text-2xl font-bold border-b border-[#D4AF37]/30 pb-4">💡 Tips Avanzados</h2>

                        {[
                            { title: 'Tip 1: Ajustes por Capas', content: 'No maximices todos los sliders. En su lugar: 1) Pon Creativity según tipo de imagen (bajo para retratos, alto para paisajes). 2) Pon Fractality según nivel de detalle deseado. 3) Solo ajusta Light/Color Boost si el original lo necesita. ✅ Bueno: Creativity 4, Fractality 7, Light +1. ❌ Malo: Creativity 10, Fractality 10, Light +5, Color +5.' },
                            { title: 'Tip 2: La Preview Te Dice Todo', content: 'Las 6 variaciones usan los mismos ajustes base pero diferentes "direcciones creativas". La preview que mejor se vea es tu respuesta. Si #1 (Forensic) se ve mejor → La imagen tiene daño que arreglar. Si #3 (Trend) se ve mejor → La imagen se beneficia de estilo artístico. Si #6 (Max Sharpness) se ve mejor → La imagen necesita máximo detalle.' },
                            { title: 'Tip 3: Guarda Tus Ajustes', content: 'Si encuentras ajustes que te gustan (ej. "Creativity 4, Fractality 7, Light +2"), anótalos. Puedes usar los mismos para imágenes similares.' },
                            { title: 'Tip 4: Usa Modo Batch para Consistencia', content: 'Si upscalas múltiples fotos (ej. catálogo de productos, sesión de fotos): 1) Usa los mismos ajustes para todas las imágenes. 2) Asegura estilo consistente en toda tu colección. 3) Resultados profesionales para galerías/portfolios.' },
                        ].map((tip, idx) => (
                            <div key={idx} className="bg-white/5 border-l-4 border-[#D4AF37] p-6 rounded-r-xl">
                                <h3 className="text-lg font-semibold text-[#D4AF37] mb-3">{tip.title}</h3>
                                <p className="text-white/70 whitespace-pre-line">{tip.content}</p>
                            </div>
                        ))}

                        <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent p-8 rounded-xl text-center">
                            <h3 className="text-2xl font-bold mb-4">🚀 Próximos Pasos</h3>
                            <ol className="inline-block text-left space-y-2 text-white/80">
                                <li>✅ Sube tu primera imagen</li>
                                <li>✅ Prueba las 6 previews</li>
                                <li>✅ Compara resultados</li>
                                <li>✅ Elige tu favorita</li>
                                <li>✅ Upscala a 4K</li>
                                <li>✅ ¡Descarga y disfruta!</li>
                            </ol>
                            <p className="mt-6 text-[#D4AF37] text-xl">Happy upscaling! 🎉</p>
                        </div>
                    </section>
                )}
            </div>

            {/* Footer */}
            <footer className="text-center py-8 text-white/40 text-xs border-t border-white/10 mt-12">
                <p>Última actualización: Enero 12, 2026</p>
                <p className="mt-1">¿Preguntas? Email support@luxscaler.com</p>
            </footer>

            {/* Animación fadeIn */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default TutorialInteractive;
