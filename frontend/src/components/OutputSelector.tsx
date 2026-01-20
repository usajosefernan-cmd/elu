import React from 'react';
import { LuxButton } from './LuxButton';
import { Crown, FileText, X } from 'lucide-react';
import { OutputFormat } from '../types';

interface OutputSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (resolution: string, format: OutputFormat, refinePrompt?: string) => void;
}

export const OutputSelector: React.FC<OutputSelectorProps> = ({ isOpen, onClose, onConfirm }) => {
    const [resolution, setResolution] = React.useState('4K');
    const [format, setFormat] = React.useState<OutputFormat>('PNG16');
    const [refinePrompt, setRefinePrompt] = React.useState('');

    if (!isOpen) return null;

    const resolutions = [
        { id: '2K', label: '2K Digital', desc: 'Social Media', cost: 25 },
        { id: '4K', label: '4K Ultra', desc: 'Print / Display', cost: 50 },
        { id: '8K', label: '8K Master', desc: 'Large Format', cost: 100 },
    ];

    const formats: OutputFormat[] = ['WEBP', 'PNG16', 'TIFF32', 'EXR'];

    return (
        <>
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200]" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[210] w-[90%] max-w-sm bg-void-black border border-white/10 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 h-[80vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-lumen-gold/20 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-lumen-gold" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase">Master Print</h3>
                        <p className="text-xs text-gray-400">Configuración de Salida</p>
                    </div>
                </div>

                {/* RESOLUTION */}
                <div className="mb-6">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Resolución</label>
                    <div className="flex flex-col gap-2">
                        {resolutions.map(res => (
                            <button
                                key={res.id}
                                onClick={() => setResolution(res.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${resolution === res.id
                                    ? 'bg-lumen-gold/10 border-lumen-gold'
                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className="text-left">
                                    <div className={`text-sm font-black ${resolution === res.id ? 'text-lumen-gold' : 'text-white'}`}>
                                        {res.label}
                                    </div>
                                    <div className="text-[10px] text-gray-500">{res.desc}</div>
                                </div>
                                <div className="text-xs font-mono font-bold text-gray-300 bg-black/40 px-2 py-1 rounded">
                                    {res.cost} Lm
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* REFINE NOTE (AI ASSIST) */}
                <div className="mb-6">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <FileText className="w-3 h-3 text-lumen-gold" /> Nota Refinamiento (Ops)
                    </label>
                    <textarea
                        value={refinePrompt}
                        onChange={(e) => setRefinePrompt(e.target.value)}
                        placeholder="Ej: Quitar cinta del pelo, mejorar contraste, borrar persona del fondo..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:border-lumen-gold outline-none resize-none h-20"
                    />
                    <p className="text-[9px] text-gray-500 mt-2 text-right opacity-70">
                        La IA interpretará esta nota durante el escalado 4K.
                    </p>
                </div>

                {/* FORMAT */}
                <div className="mb-8">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Formato</label>
                    <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
                        {formats.map(fmt => (
                            <button
                                key={fmt}
                                onClick={() => setFormat(fmt)}
                                className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all ${format === fmt
                                    ? 'bg-white text-black shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                </div>

                <LuxButton
                    onClick={() => onConfirm(resolution, format, refinePrompt)}
                    className="w-full py-4 text-sm shadow-lumen-glow"
                >
                    PROCESAR MASTER
                </LuxButton>
            </div>
        </>
    );
};
