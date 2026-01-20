import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Zap, Image, Shield, AlertTriangle, Scale, Mail, CreditCard, Search } from 'lucide-react';

interface FAQProps {
    onBack: () => void;
}

type FAQCategory = 'general' | 'ai' | 'technical' | 'pricing' | 'privacy' | 'troubleshooting' | 'legal' | 'support';

const CATEGORIES: { id: FAQCategory; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: HelpCircle },
    { id: 'ai', label: 'AI & Results', icon: Zap },
    { id: 'technical', label: 'Technical', icon: Image },
    { id: 'pricing', label: 'Pricing', icon: CreditCard },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'troubleshooting', label: 'Troubleshoot', icon: AlertTriangle },
    { id: 'legal', label: 'Legal', icon: Scale },
    { id: 'support', label: 'Support', icon: Mail },
];

const FAQ_DATA: Record<FAQCategory, { q: string; a: string | React.ReactNode }[]> = {
    general: [
        { q: 'What is LuxScaler?', a: 'LuxScaler is an AI-powered image upscaling and enhancement service that transforms photos into stunning 8K resolutions using advanced artificial intelligence analysis and generation.' },
        { q: 'How does LuxScaler work?', a: 'It follows a three-step process: 1) Upload & Analysis, 2) Preview Generation (6 creative variations), and 3) High-Resolution Output (4K/8K final generation).' },
        { q: 'What file formats do you support?', a: 'We accept JPEG, PNG, WebP, and TIFF up to 50MB. Outputs are available in JPEG, PNG, or WebP.' },
        { q: 'Can I generate multiple variations?', a: 'Yes! Our preview generation creates 6 different creative variations by default (Forensic, Balanced, Trend, Studio, Creative, Max Sharpness).' },
    ],
    ai: [
        { q: 'Will the 4K output match my preview exactly?', a: 'No, probably not perfectly. The preview and 4K output use different AI processes. Variations in color, detail, and facial features are intentional parts of the creative upscaling process.' },
        { q: 'What is "creative upscaling"?', a: 'Unlike traditional resizing, creative upscaling analyzes the image content to add realistic details, enhance lighting, and improve clarity, effectively "reimagining" the image at higher resolution.' },
        { q: 'Will AI change facial features?', a: 'Possibly. We aim for "Identity Preservation", but the AI may smooth skin, alter lighting, or slightly change expressions. For critical identity accuracy, generate multiple times and pick the best result.' },
        { q: 'Can I use previews as final output?', a: 'No. Previews are low-resolution references. You must generate the 4K/8K version for usable quality.' },
    ],
    technical: [
        { q: 'What is the difference between 4K and 8K?', a: '4K (~3840×2160) is ideal for displays and standard printing. 8K (~7680×4320) is for large format printing and archival. Most users only need 4K.' },
        { q: 'How long does generation take?', a: 'Previews: 15-30s. 4K: 30-90s. 8K: 60-120s. Times vary based on image complexity and server load.' },
        { q: 'Why is the file size so large?', a: '8K images contain huge amounts of data. A 4K PNG can be 30-100MB, and an 8K PNG up to 300MB. Use JPEG or WebP if file size is a concern.' },
    ],
    pricing: [
        { q: 'How does the credit system work?', a: 'Previews cost 1 credit. 4K upscaling costs 3 credits. 8K upscaling costs 6 credits. Credit packages start at €10.' },
        { q: 'Are credits refundable?', a: 'No, purchased credits are non-refundable and do not expire.' },
        { q: 'Can I get a refund for failed generations?', a: 'Yes, if the failure is technical (corrupted file, system error). Subjective dissatisfaction or expected AI variations are not bounds for refund.' },
    ],
    privacy: [
        { q: 'What happens to my images?', a: 'Images are processed securely and deleted from our active backup systems after 30 days. We do not inspect user images manually.' },
        { q: 'Do you train AI models on my images?', a: 'No. Your images are used solely for inference (processing) and are not used to train our AI models.' },
        { q: 'Is my data secure?', a: 'Yes, we use TLS 1.3 encryption in transit and AES-256 at rest.' },
    ],
    troubleshooting: [
        { q: 'Why does my image look blurry?', a: 'If the original was very blurry, the AI struggled. Also check if you downloaded the full resolution file and not a thumbnail.' },
        { q: 'What if my image fails to upload?', a: 'Check file size (<50MB) and format. Ensure your internet connection is stable.' },
        { q: 'Can I cancel a generation?', a: 'Yes, if it hangs for too long, you can cancel and credits will be refunded.' },
    ],
    legal: [
        { q: 'Do I own the outputs?', a: 'Yes, you receive full commercial rights to the AI-generated images, subject to our Terms of Service.' },
        { q: 'What is your liability?', a: 'Our liability is limited to the fees you paid. We are not liable for copyright claims arising from your use of the outputs.' },
        { q: 'Indemnification?', a: 'You agree to indemnify LuxScaler against claims arising from your use of our services.' },
    ],
    support: [
        { q: 'How do I contact support?', a: 'Email support@luxscaler.com. We typically respond within 48 business hours.' },
        { q: 'Do you have a status page?', a: 'Yes, visit luxscaler.com/status for service updates.' },
    ],
};

export const FAQInteractive: React.FC<FAQProps> = ({ onBack }) => {
    const [activeCategory, setActiveCategory] = useState<FAQCategory>('general');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleQuestion = (idx: number) => {
        setExpandedIndex(expandedIndex === idx ? null : idx);
    };

    const filteredQuestions = searchTerm
        ? Object.entries(FAQ_DATA).flatMap(([cat, items]) =>
            items.map(item => ({ ...item, category: cat })).filter(item =>
                item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (typeof item.a === 'string' && item.a.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        )
        : FAQ_DATA[activeCategory];

    return (
        <div className="w-full min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#111] text-white">
            {/* Header */}
            <header className="bg-gradient-to-r from-[#1a6478] to-[#0f3d4a] py-12 px-6 text-center rounded-b-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">📚 Knowledge Base</h1>
                    <p className="text-lg text-white/80">Respuestas rápidas a tus dudas sobre LuxScaler</p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto mt-6 relative">
                        <input
                            type="text"
                            placeholder="Buscar pregunta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-12 text-white placeholder-white/50 focus:outline-none focus:border-[#D4AF37] focus:bg-white/20 transition-all"
                        />
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-white/50" />
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-8">

                {/* Categorías (Hidden if searching) */}
                {!searchTerm && (
                    <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-10">
                        {CATEGORIES.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => { setActiveCategory(id); setExpandedIndex(null); }}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${activeCategory === id
                                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                            </button>
                        ))}
                    </nav>
                )}

                {/* Lista de Preguntas */}
                <div className="space-y-4 animate-fadeIn">
                    {searchTerm && filteredQuestions.length === 0 ? (
                        <div className="text-center py-12 text-white/50">
                            <p>No se encontraron resultados para "{searchTerm}"</p>
                        </div>
                    ) : (
                        filteredQuestions.map((item: any, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
                                <button
                                    onClick={() => toggleQuestion(idx)}
                                    className="w-full flex items-center justify-between p-5 text-left"
                                >
                                    <h3 className="text-lg font-medium text-white/90 pr-4">{item.q}</h3>
                                    <ChevronDown
                                        className={`w-5 h-5 text-[#D4AF37] transition-transform duration-300 ${expandedIndex === idx ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <div
                                    className={`
                                        overflow-hidden transition-all duration-300 ease-in-out
                                        ${expandedIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                                    `}
                                >
                                    <div className="p-5 pt-0 text-white/70 border-t border-white/5">
                                        {item.category && searchTerm && (
                                            <span className="text-xs uppercase tracking-widest text-[#D4AF37] mb-2 block">{CATEGORIES.find(c => c.id === item.category)?.label}</span>
                                        )}
                                        {item.a}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="text-center py-8 text-white/40 text-xs border-t border-white/10 mt-12">
                <p>¿Tus dudas persisten? Contáctanos en <a href="mailto:support@luxscaler.com" className="text-[#D4AF37] hover:underline">support@luxscaler.com</a></p>
            </footer>

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

export default FAQInteractive;
