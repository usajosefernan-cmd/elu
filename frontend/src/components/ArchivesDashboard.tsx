
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getGenerations } from '../services/historyService';
import { GenerationSession, ArchivedVariation } from '../types';
import { ArrowLeft, FolderOpen, Crown, Loader2, Sparkles, Copy, Palette, Sun, RefreshCw, Home, User, Camera, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { getDisplayUrl, getThumbnailUrl } from '../utils/imageUtils';
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
    if (url.includes('supabase.co')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=300&quality=60`;
    }
    return url;
};

export const ArchivesDashboard: React.FC<ArchivesDashboardProps> = ({ onBack }) => {
    const [sessions, setSessions] = useState<GenerationSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<ArchivedVariation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isMasterConfigOpen, setIsMasterConfigOpen] = useState(false);
    const [isProcessingMatrix, setIsProcessingMatrix] = useState(false);

    // Comparador state
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);
    
    // Zoom/Pan state
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const currentSession = useMemo(() =>
        sessions.find(s => s.id === selectedSessionId),
        [sessions, selectedSessionId]);

    const isMaster = useMemo(() =>
        selectedVariation?.type.includes('master') || selectedVariation?.type.includes('upscale'),
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

    useEffect(() => { loadSessions(); }, []);

    useEffect(() => {
        if (selectedVariation) {
            setIsImageLoaded(false);
            setScale(1);
            setTranslate({ x: 0, y: 0 });
            setSliderPosition(50);
        }
    }, [selectedVariation]);

    // Fit image to container
    const fitToContainer = useCallback(() => {
        if (!containerRef.current || !imgSize.w) return;
        const { clientWidth, clientHeight } = containerRef.current;
        const scaleX = clientWidth / imgSize.w;
        const scaleY = clientHeight / imgSize.h;
        const fitScale = Math.min(scaleX, scaleY, 1);
        setScale(fitScale);
        setTranslate({
            x: (clientWidth - imgSize.w * fitScale) / 2,
            y: (clientHeight - imgSize.h * fitScale) / 2
        });
    }, [imgSize]);

    // Image load handler
    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
        setIsImageLoaded(true);
        
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            const scaleX = clientWidth / img.naturalWidth;
            const scaleY = clientHeight / img.naturalHeight;
            const fitScale = Math.min(scaleX, scaleY, 1);
            setScale(fitScale);
            setTranslate({
                x: (clientWidth - img.naturalWidth * fitScale) / 2,
                y: (clientHeight - img.naturalHeight * fitScale) / 2
            });
        }
    }, []);

    // Wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!isImageLoaded || !containerRef.current) return;
        e.preventDefault();
        
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(4, Math.max(0.1, scale + delta * scale));
        
        // Zoom hacia el punto del cursor
        const scaleRatio = newScale / scale;
        const newTranslateX = mouseX - (mouseX - translate.x) * scaleRatio;
        const newTranslateY = mouseY - (mouseY - translate.y) * scaleRatio;
        
        setScale(newScale);
        setTranslate({ x: newTranslateX, y: newTranslateY });
    }, [isImageLoaded, scale, translate]);

    // Pan handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Solo click izquierdo
        
        // Check if clicking on slider handle
        const target = e.target as HTMLElement;
        if (target.closest('.slider-handle')) {
            setIsDraggingSlider(true);
            return;
        }
        
        setIsDragging(true);
        setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }, [translate]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        
        if (isDraggingSlider) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            setSliderPosition(percentage);
            return;
        }
        
        if (isDragging) {
            setTranslate({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    }, [isDragging, isDraggingSlider, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsDraggingSlider(false);
    }, []);

    // Zoom controls
    const zoomIn = () => setScale(s => Math.min(4, s * 1.3));
    const zoomOut = () => setScale(s => Math.max(0.1, s / 1.3));

    const handleConfirmMaster = async (config: any) => {
        setIsMasterConfigOpen(false);
        setIsProcessingMatrix(true);
    };

    const copyConfigToClipboard = () => {
        if (selectedVariation?.prompt_payload) {
            navigator.clipboard.writeText(JSON.stringify(selectedVariation.prompt_payload, null, 2));
        }
    };

    const zoomPercentage = Math.round(scale * 100);

    return (
        <div className="w-full h-full flex flex-col max-w-[1600px] mx-auto px-4 md:px-6">
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
                    
                    {/* Left: Lista de sesiones */}
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

                    {/* Center: Visor con zoom y comparación */}
                    <div className="col-span-6 bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden flex flex-col">
                        {currentSession && selectedVariation ? (
                            <>
                                {/* Toolbar con controles de zoom */}
                                <div className="p-2 border-b border-white/5 bg-black/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button onClick={zoomOut} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
                                            <ZoomOut className="w-4 h-4" />
                                        </button>
                                        <span className="text-[10px] text-gray-400 font-mono w-12 text-center">{zoomPercentage}%</span>
                                        <button onClick={zoomIn} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
                                            <ZoomIn className="w-4 h-4" />
                                        </button>
                                        <button onClick={fitToContainer} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] px-2">
                                            FIT
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <Move className="w-3 h-3" />
                                        Arrastra para mover
                                    </div>
                                </div>

                                {/* Visor principal */}
                                <div 
                                    ref={containerRef}
                                    className="flex-1 bg-[#080808] relative overflow-hidden select-none"
                                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                                    onWheel={handleWheel}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                >
                                    {!isImageLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            <Loader2 className="w-6 h-6 text-lumen-gold animate-spin" />
                                        </div>
                                    )}
                                    
                                    {/* Contenedor de imágenes con transformación */}
                                    <div
                                        className="absolute"
                                        style={{
                                            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                                            transformOrigin: '0 0',
                                            width: imgSize.w || 'auto',
                                            height: imgSize.h || 'auto',
                                        }}
                                    >
                                        {/* Imagen DESPUÉS (base) */}
                                        <img
                                            src={getDisplayUrl(selectedVariation.image_path)}
                                            alt="Después"
                                            onLoad={handleImageLoad}
                                            className="absolute inset-0 w-full h-full"
                                            draggable={false}
                                        />
                                        
                                        {/* Imagen ANTES (overlay con clip) */}
                                        <div 
                                            className="absolute inset-0"
                                            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                                        >
                                            <img
                                                src={getDisplayUrl(currentSession.original_image_path)}
                                                alt="Antes"
                                                className="w-full h-full"
                                                style={{ width: imgSize.w, height: imgSize.h }}
                                                draggable={false}
                                            />
                                        </div>
                                        
                                        {/* Línea del slider */}
                                        <div 
                                            className="slider-handle absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-20"
                                            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                                        >
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border-2 border-white">
                                                <span className="text-white text-lg">⟷</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Labels */}
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-bold z-10">
                                        ANTES
                                    </div>
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 rounded text-[10px] text-lumen-gold font-bold z-10">
                                        DESPUÉS
                                    </div>
                                </div>

                                {/* Variaciones */}
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
