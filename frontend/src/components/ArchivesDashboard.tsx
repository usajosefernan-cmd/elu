
import React, { useState, useEffect, useMemo } from 'react';
import { getGenerations, deleteGeneration, submitVariationFeedback } from '../services/historyService';
import { GenerationSession, ArchivedVariation } from '../types';
import { Trash2, ArrowLeft, FolderOpen, Activity, Crown, ZoomIn, Layers, Loader2, Check, Sliders, Cpu, Grid, Sparkles, ShieldCheck, Microscope, Info, Copy, ScanLine, Palette, Sun, Maximize, RefreshCw, Home, User } from 'lucide-react';
import { ComparisonSlider } from './ComparisonSlider';
import { ImageInspectorModal } from './ImageInspectorModal';
import { getDisplayUrl, getMasterUrl, getThumbnailUrl } from '../utils/imageUtils';
import { generateMaster } from '../services/geminiService';
import { spendLumens } from '../services/paymentService';
import { MasterConfigModal } from './MasterConfigModal';
import { LuxMixer } from '../types';

interface ArchivesDashboardProps {
    onBack: () => void;
}

export const ArchivesDashboard: React.FC<ArchivesDashboardProps> = ({ onBack }) => {
    const [sessions, setSessions] = useState<GenerationSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<ArchivedVariation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');

    const [isProcessingMatrix, setIsProcessingMatrix] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');

    const currentSession = useMemo(() =>
        sessions.find(s => s.id === selectedSessionId),
        [sessions, selectedSessionId]);

    const isMaster = useMemo(() =>
        selectedVariation?.type.includes('master') || selectedVariation?.type.includes('upscale') || selectedVariation?.type.includes('matrix'),
        [selectedVariation]);

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            const data = await getGenerations();
            setSessions(data);
        } catch (e) {
            console.error("Failed to load sessions");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (selectedVariation) {
            setFeedbackText(selectedVariation.feedback || '');
            setIsProcessingMatrix(false);
            setProcessingStatus('');
        }
    }, [selectedVariation]);

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("ADVERTENCIA: ¿Purgar este dataset experimental?")) {
            await deleteGeneration(id);
            await loadSessions();
            if (selectedSessionId === id) {
                setSelectedSessionId(null);
                setSelectedVariation(null);
            }
        }
    };

    const [isMasterConfigOpen, setIsMasterConfigOpen] = useState(false);

    // Updated: Triggered by Modal Confirm
    const handleConfirmMaster = async (settings: any) => {
        setIsMasterConfigOpen(false);
        if (!selectedVariation || !currentSession) return;

        setIsProcessingMatrix(true);
        setProcessingStatus("Conectando con Edge...");

        try {
            const success = await spendLumens(5, "Master Print Generation (Lab)");
            if (!success) {
                alert("Saldo insuficiente.");
                setIsProcessingMatrix(false);
                return;
            }
            setProcessingStatus("Esculpiendo Master 4K...");

            // Pass UI settings to backend
            await generateMaster(selectedVariation.id, settings);

            await loadSessions();
            alert("Master 4K Generado Exitosamente.");
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setIsProcessingMatrix(false);
            setProcessingStatus("");
        }
    };

    const handleSaveFeedback = async () => {
        if (!selectedVariation) return;
        try {
            await submitVariationFeedback(selectedVariation.id, feedbackText);
            alert("Nota guardada.");
        } catch (e) { alert("Error al guardar."); }
    };

    const copyConfigToClipboard = () => {
        if (!selectedVariation) return;
        const mixer = selectedVariation.prompt_payload?.mixer || {};
        const configStr = `STYLE: ${selectedVariation.prompt_payload?.meta_style_name}\nMIXER: Stylism:${mixer.stylism} Atrezzo:${mixer.atrezzo} Bio:${mixer.skin_bio} Light:${mixer.lighting}`;
        navigator.clipboard.writeText(configStr);
        alert("Configuración copiada.");
    };

    const MixerBar = ({ label, value, color, icon: Icon }: any) => (
        <div className="flex items-center gap-2 mb-2">
            {Icon && <Icon className={`w-3 h-3 ${color}`} />}
            <span className="text-[9px] font-bold text-gray-500 w-16">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{ width: `${(value / 10) * 100}%` }}></div>
            </div>
            <span className="text-[9px] font-mono text-white w-4 text-right">{value}</span>
        </div>
    );

    if (!selectedSessionId) {
        return (
            <div className="w-full h-full flex flex-col animate-[fadeIn_0.5s_ease-out] max-w-7xl mx-auto px-4 md:px-0">
                <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter mb-1">ARCHIVO DE <span className="text-lumen-gold">DATOS</span></h2>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Resultados Experimentales & Análisis Semántico</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={loadSessions} className="p-2 bg-white/5 hover:bg-white/10 text-lumen-gold rounded border border-white/10 transition-colors">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs uppercase font-bold group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Salir
                        </button>
                    </div>
                </div>

                {isLoading && sessions.length === 0 ? (
                    <div className="py-32 flex justify-center"><Loader2 className="w-8 h-8 text-lumen-gold animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className="group relative bg-void-black border border-white/10 rounded-sm cursor-pointer hover:border-lumen-gold transition-all duration-300 hover:-translate-y-1 shadow-lg"
                            >
                                <div className="aspect-[4/5] bg-gray-900 relative overflow-hidden border-b border-white/5">
                                    <img src={getThumbnailUrl(session.original_image_thumbnail || session.original_image_path)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 grayscale group-hover:grayscale-0" />
                                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur text-[9px] text-lumen-gold border border-lumen-gold/30 px-2 py-1 uppercase font-mono tracking-widest">
                                        {session.variations.some(v => v.type.includes('master')) ? '4K MASTER' : '2K PREVIEWS'}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-xs font-bold text-white uppercase truncate mb-2">
                                        {session.semantic_analysis?.classification?.sub_type || 'Sujeto Desconocido'}
                                    </h3>
                                    <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
                                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                        <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{session.variations.length} VARS</span>
                                    </div>
                                </div>
                                <button onClick={(e) => handleDeleteSession(e, session.id)} className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-crimson-glow transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (!currentSession) return null;

    return (
        <div className="w-full h-full flex flex-col animate-[fadeIn_0.5s_ease-out] max-w-[1600px] mx-auto px-4 md:px-6">
            <ImageInspectorModal
                isOpen={isZoomModalOpen}
                onClose={() => setIsZoomModalOpen(false)}
                processedImage={getMasterUrl(selectedVariation?.image_path || '')}
                originalImage={currentSession.original_image_path}
                title={isMaster ? "4K Master Inspection" : "2K Proxy Inspection"}
                variation={selectedVariation}
                generation={currentSession}
                onGenerateMaster={handleConfirmMaster}
                isProcessing={isProcessingMatrix}
            />

            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => { setSelectedSessionId(null); setSelectedVariation(null); }} className="p-2 border border-white/10 rounded-sm hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-bold uppercase text-gray-400 hover:text-white">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                    <div className="h-6 w-[1px] bg-white/10"></div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                        {currentSession.semantic_analysis?.classification?.sub_type || 'Sin Clasificar'}
                    </h2>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
                {/* Left Col (Thumbnails) */}
                <div className="lg:col-span-2 bg-void-black border-r border-white/10 flex flex-col overflow-hidden">
                    <div className="p-3 bg-white/5 border-b border-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Especímenes</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {currentSession.variations.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedVariation(item)}
                                className={`relative aspect-square cursor-pointer rounded-sm overflow-hidden border-2 transition-all group ${selectedVariation?.id === item.id ? 'border-lumen-gold ring-2 ring-lumen-gold/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            >
                                <img src={getThumbnailUrl(item.image_path)} className="w-full h-full object-cover" alt="thumb" />
                                <div className="absolute top-1 left-1 bg-black/50 backdrop-blur text-white text-[8px] font-bold px-1 rounded border border-white/10">
                                    {item.type.includes('master') ? '4K' : '2K'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle Col (Viewer) */}
                <div className="lg:col-span-7 bg-black relative flex flex-col border border-white/10 rounded-sm overflow-hidden group/main">
                    {selectedVariation ? (
                        <>
                            <div className="absolute top-4 right-4 z-20 flex gap-2">
                                <button
                                    onClick={() => setIsZoomModalOpen(true)}
                                    className="px-4 py-2 bg-black/60 backdrop-blur-md border border-lumen-gold/30 rounded-full hover:bg-lumen-gold hover:text-black text-lumen-gold transition-all flex items-center gap-2 shadow-2xl"
                                >
                                    <Maximize className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Enlarge Photo</span>
                                </button>
                            </div>
                            <div className="flex-1 flex items-center justify-center bg-checkered relative">
                                <div className="w-full h-full relative">
                                    {isMaster ? (
                                        <img src={getDisplayUrl(selectedVariation.image_path)} className="w-full h-full object-cover" />
                                    ) : (
                                        <ComparisonSlider originalImage={currentSession.original_image_path} processedImage={getDisplayUrl(selectedVariation.image_path)} isLocked={false} objectFit="cover" />
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                            <Activity className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-xs uppercase tracking-widest font-mono">Selecciona un espécimen</p>
                        </div>
                    )}
                </div>

                {/* Right Col (Controls) */}
                <div className="lg:col-span-3 bg-white/5 border border-white/5 rounded-sm flex flex-col">
                    <div className="p-4 border-b border-white/5 bg-void-black/50">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Layers className="w-3 h-3 text-lumen-gold" /> Panel de Ingeniería
                        </h3>
                    </div>

                    {selectedVariation ? (
                        <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                            {/* DNA CARD */}
                            <div className="bg-black/40 border border-white/10 p-4 rounded-sm relative group/dna">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-sm font-black text-lumen-gold uppercase tracking-tight leading-none mb-1">
                                            {selectedVariation.prompt_payload?.meta_style_name || selectedVariation.style_id}
                                        </h4>
                                        <span className="text-[9px] text-gray-500 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded">
                                            {selectedVariation.prompt_payload?.meta_tech_base || 'GENERIC'}
                                        </span>
                                    </div>
                                    <button onClick={copyConfigToClipboard} className="text-gray-500 hover:text-white transition-colors p-1">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>

                                <p className="text-[10px] text-gray-400 italic leading-relaxed mb-4 border-l-2 border-white/10 pl-2">
                                    "{selectedVariation.prompt_payload?.meta_style_vibe || '...'}"
                                </p>

                                {/* Mixer Viz */}
                                {selectedVariation.prompt_payload?.mixer && (
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-2">Parámetros del Motor</p>
                                        <MixerBar label="STYLISM" value={selectedVariation.prompt_payload.mixer.stylism} color="text-pink-400" icon={Palette} />
                                        <MixerBar label="ATREZZO" value={selectedVariation.prompt_payload.mixer.atrezzo} color="text-prismatic-blue" icon={Home} />
                                        <MixerBar label="SKIN/BIO" value={selectedVariation.prompt_payload.mixer.skin_bio} color="text-teal-400" icon={User} />
                                        <MixerBar label="LIGHT" value={selectedVariation.prompt_payload.mixer.lighting} color="text-orange-400" icon={Sun} />
                                    </div>
                                )}
                            </div>

                            {/* 4K ACTION MODULE */}
                            {!isMaster && (
                                <div className="p-4 bg-lumen-gold/5 border border-lumen-gold/20 rounded-sm">
                                    <h4 className="text-[10px] text-lumen-gold uppercase font-bold mb-2 flex items-center gap-2">
                                        <Crown className="w-3 h-3" /> Producción Final
                                    </h4>
                                    <button
                                        onClick={() => setIsMasterConfigOpen(true)}
                                        disabled={isProcessingMatrix}
                                        className="w-full py-3 bg-lumen-gold text-black rounded-sm text-[10px] font-black uppercase hover:bg-white hover:shadow-[0_0_15px_rgba(230,199,139,0.4)] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isProcessingMatrix ? <Loader2 className="w-3 h-3 animate-spin" /> : <Grid className="w-3 h-3" />}
                                        {isProcessingMatrix ? processingStatus || 'Procesando...' : 'CREAR MASTER 4K'}
                                    </button>
                                </div>
                            )}

                            {/* MASTER CONFIG MODAL */}
                            <MasterConfigModal
                                isOpen={isMasterConfigOpen}
                                onClose={() => setIsMasterConfigOpen(false)}
                                onConfirm={handleConfirmMaster}
                                currentMixer={selectedVariation?.prompt_payload?.mixer}
                            />

                            {/* NOTES */}
                            <div className="flex-1 flex flex-col border-t border-white/5 pt-4 mt-auto">
                                <h4 className="text-[10px] text-gray-400 uppercase font-bold mb-2">Notas de Sesión</h4>
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Anota detalles..."
                                    className="w-full bg-black/40 border border-white/10 rounded-sm p-2 text-xs text-white focus:border-lumen-gold focus:outline-none resize-none min-h-[60px]"
                                />
                                <button onClick={handleSaveFeedback} className="mt-2 text-[10px] text-lumen-gold hover:underline self-end">
                                    Guardar Nota
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                            <p className="text-xs">Selecciona un elemento.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
