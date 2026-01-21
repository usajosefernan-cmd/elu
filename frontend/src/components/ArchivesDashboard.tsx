
import React, { useState, useEffect, useMemo } from 'react';
import { getGenerations, deleteGeneration, submitVariationFeedback } from '../services/historyService';
import { GenerationSession, ArchivedVariation } from '../types';
import { Trash2, ArrowLeft, FolderOpen, Activity, Crown, ZoomIn, Layers, Loader2, Check, Sliders, Cpu, Grid, Sparkles, ShieldCheck, Microscope, Info, Copy, ScanLine, Palette, Sun, Maximize, RefreshCw, Home, User, Camera, ChevronRight } from 'lucide-react';
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

// Componente para mostrar barra de ajuste
const MixerBar: React.FC<{ label: string; value: number; color: string; icon: any }> = ({ label, value, color, icon: Icon }) => (
    <div className="flex items-center gap-2">
        <Icon className={`w-3 h-3 ${color} opacity-60`} />
        <span className="text-[8px] text-gray-500 w-14 uppercase">{label}</span>
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
                className={`h-full ${color.replace('text-', 'bg-')} opacity-70 transition-all`} 
                style={{ width: `${(value / 10) * 100}%` }} 
            />
        </div>
        <span className={`text-[9px] font-mono ${color}`}>{value}</span>
    </div>
);

// Función para generar URL de thumbnail pequeño
const getSmallThumb = (url: string) => {
    if (!url) return '';
    // Supabase storage transform para thumbnail pequeño
    if (url.includes('supabase.co')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=300&quality=60`;
    }
    return url;
};

// Función para generar URL de preview mediano
const getMediumPreview = (url: string) => {
    if (!url) return '';
    if (url.includes('supabase.co')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=800&quality=75`;
    }
    return url;
};

export const ArchivesDashboard: React.FC<ArchivesDashboardProps> = ({ onBack }) => {
    const [sessions, setSessions] = useState<GenerationSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<ArchivedVariation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'thumb' | 'compare' | 'full'>('thumb');

    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isMasterConfigOpen, setIsMasterConfigOpen] = useState(false);

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
            setViewMode('thumb'); // Reset to thumbnail when selecting new variation
        }
    }, [selectedVariation]);

    const handleConfirmMaster = async (config: any) => {
        if (!selectedVariation || !currentSession) return;
        setIsMasterConfigOpen(false);
        setIsProcessingMatrix(true);
        setProcessingStatus("Generando Master 4K...");
        // ... rest of master generation logic
    };

    const copyConfigToClipboard = () => {
        if (selectedVariation?.prompt_payload) {
            navigator.clipboard.writeText(JSON.stringify(selectedVariation.prompt_payload, null, 2));
        }
    };

    // Extraer ajustes de la variación seleccionada
    const getSliderSettings = () => {
        if (!selectedVariation?.prompt_payload) return null;
        const payload = selectedVariation.prompt_payload;
        
        // Intentar obtener sliderConfig del selectedPresetId
        if (payload.selectedPresetId) {
            try {
                return JSON.parse(payload.selectedPresetId);
            } catch { }
        }
        
        // Fallback al mixer
        return payload.mixer ? { mixer: payload.mixer } : null;
    };

    const sliderSettings = getSliderSettings();

    return (
        <div className="w-full h-full flex flex-col max-w-[1600px] mx-auto px-4 md:px-6">
            <ImageInspectorModal
                isOpen={isZoomModalOpen}
                onClose={() => setIsZoomModalOpen(false)}
                processedImage={getMasterUrl(selectedVariation?.image_path || '')}
                originalImage={getMediumPreview(currentSession?.original_image_path || '')}
                title={isMaster ? "Master 4K" : "Preview 2K"}
                variation={selectedVariation}
                generation={currentSession}
                onGenerateMaster={handleConfirmMaster}
                isProcessing={isProcessingMatrix}
            />

            <MasterConfigModal
                isOpen={isMasterConfigOpen}
                onClose={() => setIsMasterConfigOpen(false)}
                onConfirm={handleConfirmMaster}
                variationId={selectedVariation?.id || ''}
                baseConfig={selectedVariation?.prompt_payload?.mixer as LuxMixer}
            />

            {/* Header */}
            <div className="flex items-center justify-between py-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tight">Archivo</h1>
                        <p className="text-[10px] text-gray-500">{sessions.length} sesiones</p>
                    </div>
                </div>
                <button onClick={loadSessions} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-lumen-gold animate-spin" />
                </div>
            ) : sessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                    <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm">No hay sesiones guardadas</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
                    
                    {/* Left: Lista de sesiones (thumbnails pequeños) */}
                    <div className="col-span-3 bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-white/5 bg-black/20">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Sesiones</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {sessions.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => {
                                        setSelectedSessionId(session.id);
                                        setSelectedVariation(session.variations?.[0] || null);
                                    }}
                                    className={`w-full p-2 rounded-lg transition-all flex items-center gap-3 ${
                                        selectedSessionId === session.id 
                                            ? 'bg-lumen-gold/10 border border-lumen-gold/30' 
                                            : 'bg-white/5 border border-transparent hover:border-white/10'
                                    }`}
                                >
                                    {/* Thumbnail pequeño - carga rápida */}
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
                                        <img 
                                            src={getSmallThumb(session.original_image_path)} 
                                            alt="" 
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-xs text-white font-medium truncate">
                                            {new Date(session.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            {session.variations?.length || 0} variaciones
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Center: Vista principal */}
                    <div className="col-span-6 bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden flex flex-col">
                        {currentSession && selectedVariation ? (
                            <>
                                {/* Toolbar */}
                                <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setViewMode('thumb')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                viewMode === 'thumb' ? 'bg-lumen-gold text-black' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Vista Rápida
                                        </button>
                                        <button
                                            onClick={() => setViewMode('compare')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                viewMode === 'compare' ? 'bg-lumen-gold text-black' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Comparar
                                        </button>
                                        <button
                                            onClick={() => setViewMode('full')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                viewMode === 'full' ? 'bg-lumen-gold text-black' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            1:1
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setIsZoomModalOpen(true)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Maximize className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>

                                {/* Image View */}
                                <div className="flex-1 flex items-center justify-center p-4 bg-[#0a0a0a] relative overflow-hidden">
                                    {viewMode === 'thumb' && (
                                        // Vista rápida: Solo thumbnail mediano
                                        <img 
                                            src={getMediumPreview(selectedVariation.image_path)} 
                                            alt="" 
                                            className="max-w-full max-h-full object-contain rounded-lg"
                                            loading="lazy"
                                        />
                                    )}
                                    
                                    {viewMode === 'compare' && (
                                        // Comparación: Slider siempre centrado
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ComparisonSlider 
                                                originalImage={getMediumPreview(currentSession.original_image_path)} 
                                                processedImage={getMediumPreview(selectedVariation.image_path)} 
                                                isLocked={false} 
                                                objectFit="contain"
                                            />
                                        </div>
                                    )}
                                    
                                    {viewMode === 'full' && (
                                        // 1:1: Imagen a tamaño real con scroll
                                        <div className="w-full h-full overflow-auto flex items-center justify-center">
                                            <img 
                                                src={getDisplayUrl(selectedVariation.image_path)} 
                                                alt="" 
                                                className="max-w-none"
                                                style={{ imageRendering: 'crisp-edges' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Variaciones de esta sesión */}
                                <div className="p-3 border-t border-white/5 bg-black/20">
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {currentSession.variations?.map((v, idx) => (
                                            <button
                                                key={v.id}
                                                onClick={() => setSelectedVariation(v)}
                                                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                                                    selectedVariation?.id === v.id 
                                                        ? 'border-lumen-gold' 
                                                        : 'border-transparent hover:border-white/30'
                                                }`}
                                            >
                                                <img 
                                                    src={getSmallThumb(v.image_path)} 
                                                    alt={`Var ${idx + 1}`} 
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                                <Camera className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-xs">Selecciona una sesión</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Panel de información */}
                    <div className="col-span-3 bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-white/5 bg-black/20">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Ajustes Usados</span>
                        </div>
                        
                        {selectedVariation ? (
                            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                                {/* Info básica */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-500">Tipo</span>
                                        <span className="text-white font-medium">{selectedVariation.type}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-500">Fecha</span>
                                        <span className="text-white">{new Date(selectedVariation.created_at).toLocaleString('es-ES')}</span>
                                    </div>
                                    {selectedVariation.prompt_payload?.mode && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500">Modo</span>
                                            <span className="text-lumen-gold font-bold">{selectedVariation.prompt_payload.mode}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Mixer/Ajustes visuales */}
                                {selectedVariation.prompt_payload?.mixer && (
                                    <div className="space-y-2 pt-3 border-t border-white/5">
                                        <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2">Parámetros</p>
                                        <MixerBar label="Estilo" value={selectedVariation.prompt_payload.mixer.stylism || 5} color="text-pink-400" icon={Palette} />
                                        <MixerBar label="Entorno" value={selectedVariation.prompt_payload.mixer.atrezzo || 5} color="text-blue-400" icon={Home} />
                                        <MixerBar label="Piel" value={selectedVariation.prompt_payload.mixer.skin_bio || 5} color="text-teal-400" icon={User} />
                                        <MixerBar label="Luz" value={selectedVariation.prompt_payload.mixer.lighting || 5} color="text-orange-400" icon={Sun} />
                                        <MixerBar label="Restaurar" value={selectedVariation.prompt_payload.mixer.restoration || 5} color="text-green-400" icon={Sparkles} />
                                    </div>
                                )}

                                {/* Intent/Style usado */}
                                {selectedVariation.prompt_payload?.meta_style_vibe && (
                                    <div className="pt-3 border-t border-white/5">
                                        <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2">Intent</p>
                                        <p className="text-xs text-gray-300 italic leading-relaxed bg-white/5 p-2 rounded-lg">
                                            "{selectedVariation.prompt_payload.meta_style_vibe}"
                                        </p>
                                    </div>
                                )}

                                {/* Botón copiar config */}
                                <button
                                    onClick={copyConfigToClipboard}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-400 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Copy className="w-3 h-3" />
                                    Copiar configuración
                                </button>

                                {/* Producir Master */}
                                {!isMaster && (
                                    <button
                                        onClick={() => setIsMasterConfigOpen(true)}
                                        disabled={isProcessingMatrix}
                                        className="w-full py-3 bg-lumen-gold text-black rounded-lg text-xs font-bold uppercase hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Crown className="w-4 h-4" />
                                        Generar Master 4K
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-600">
                                <p className="text-[10px]">Sin selección</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
