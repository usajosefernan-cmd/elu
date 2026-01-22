
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getGenerations } from '../services/historyService';
import { GenerationSession, ArchivedVariation } from '../types';
import { ArrowLeft, FolderOpen, Crown, Loader2, Sparkles, Copy, Palette, Sun, RefreshCw, Home, User, Camera, ZoomIn, ZoomOut, Move, Save, X, Check } from 'lucide-react';
import { getDisplayUrl, getThumbnailUrl } from '../utils/imageUtils';
import { MasterConfigModal } from './MasterConfigModal';
import { LuxMixer } from '../types';
import { saveUserPreset } from '../services/smartPresetsService';

interface ArchivesDashboardProps {
    onBack: () => void;
    userId?: string;
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

export const ArchivesDashboard: React.FC<ArchivesDashboardProps> = ({ onBack, userId }) => {
    const [sessions, setSessions] = useState<GenerationSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<ArchivedVariation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isMasterConfigOpen, setIsMasterConfigOpen] = useState(false);
    const [isProcessingMatrix, setIsProcessingMatrix] = useState(false);

    // Save Preset state
    const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [isSavingPreset, setIsSavingPreset] = useState(false);
    const [savePresetSuccess, setSavePresetSuccess] = useState(false);

    // Comparador state
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);
    
    // Zoom/Pan state
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    
    // Track both image dimensions for proper alignment
    const [afterImgSize, setAfterImgSize] = useState({ w: 0, h: 0 });
    const [beforeImgSize, setBeforeImgSize] = useState({ w: 0, h: 0 });
    const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

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
            setAfterImgSize({ w: 0, h: 0 });
            setBeforeImgSize({ w: 0, h: 0 });
            setDisplaySize({ w: 0, h: 0 });
        }
    }, [selectedVariation]);

    // Fit image to container
    const fitToContainer = useCallback(() => {
        if (!containerRef.current || !displaySize.w) return;
        const { clientWidth, clientHeight } = containerRef.current;
        const scaleX = clientWidth / displaySize.w;
        const scaleY = clientHeight / displaySize.h;
        const fitScale = Math.min(scaleX, scaleY, 1);
        setScale(fitScale);
        setTranslate({
            x: (clientWidth - displaySize.w * fitScale) / 2,
            y: (clientHeight - displaySize.h * fitScale) / 2
        });
    }, [displaySize]);

    // Calculate display size when both images are loaded - use the AFTER image as reference
    const calculateDisplaySize = useCallback(() => {
        if (afterImgSize.w > 0 && afterImgSize.h > 0) {
            setDisplaySize({ w: afterImgSize.w, h: afterImgSize.h });
            setIsImageLoaded(true);
            
            // Auto-fit on initial load
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const scaleX = clientWidth / afterImgSize.w;
                const scaleY = clientHeight / afterImgSize.h;
                const fitScale = Math.min(scaleX, scaleY, 1);
                setScale(fitScale);
                setTranslate({
                    x: (clientWidth - afterImgSize.w * fitScale) / 2,
                    y: (clientHeight - afterImgSize.h * fitScale) / 2
                });
            }
        }
    }, [afterImgSize]);

    useEffect(() => {
        calculateDisplaySize();
    }, [calculateDisplaySize]);

    // Image load handlers
    const handleAfterImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setAfterImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    }, []);

    const handleBeforeImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setBeforeImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    }, []);

    // Wheel zoom - SIEMPRE centrado en la imagen
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!isImageLoaded || !containerRef.current) return;
        e.preventDefault();
        
        const rect = containerRef.current.getBoundingClientRect();
        
        // Calcular el CENTRO de la imagen visible (no el cursor)
        const imageWidth = displaySize.w || afterImgSize.w;
        const imageHeight = displaySize.h || afterImgSize.h;
        const imageCenterX = translate.x + (imageWidth * scale) / 2;
        const imageCenterY = translate.y + (imageHeight * scale) / 2;
        
        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(4, Math.max(0.1, scale + delta * scale));
        
        // Zoom hacia el centro de la imagen
        const scaleRatio = newScale / scale;
        const newTranslateX = imageCenterX - (imageCenterX - translate.x) * scaleRatio;
        const newTranslateY = imageCenterY - (imageCenterY - translate.y) * scaleRatio;
        
        setScale(newScale);
        setTranslate({ x: newTranslateX, y: newTranslateY });
    }, [isImageLoaded, scale, translate, displaySize, afterImgSize]);

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
            // Calcular posición relativa a la IMAGEN transformada, no al contenedor
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            
            // Convertir coordenadas del mouse a coordenadas de la imagen
            // Teniendo en cuenta translate y scale
            const imageX = (mouseX - translate.x) / scale;
            
            // Calcular porcentaje basado en el ancho real de la imagen
            const imageWidth = displaySize.w || afterImgSize.w || rect.width;
            const percentage = Math.max(0, Math.min(100, (imageX / imageWidth) * 100));
            
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

    // Zoom controls - centrado en la imagen
    const zoomIn = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const imageWidth = displaySize.w || afterImgSize.w;
        const imageHeight = displaySize.h || afterImgSize.h;
        
        const newScale = Math.min(4, scale * 1.3);
        const scaleRatio = newScale / scale;
        
        // Centro del contenedor
        const containerCenterX = rect.width / 2;
        const containerCenterY = rect.height / 2;
        
        // Ajustar translate para mantener centrado
        const newTranslateX = containerCenterX - (containerCenterX - translate.x) * scaleRatio;
        const newTranslateY = containerCenterY - (containerCenterY - translate.y) * scaleRatio;
        
        setScale(newScale);
        setTranslate({ x: newTranslateX, y: newTranslateY });
    };
    
    const zoomOut = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        
        const newScale = Math.max(0.1, scale / 1.3);
        const scaleRatio = newScale / scale;
        
        // Centro del contenedor
        const containerCenterX = rect.width / 2;
        const containerCenterY = rect.height / 2;
        
        // Ajustar translate para mantener centrado
        const newTranslateX = containerCenterX - (containerCenterX - translate.x) * scaleRatio;
        const newTranslateY = containerCenterY - (containerCenterY - translate.y) * scaleRatio;
        
        setScale(newScale);
        setTranslate({ x: newTranslateX, y: newTranslateY });
    };

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

    // Toggle para mostrar/ocultar panel de info
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div className="w-full h-screen flex flex-col bg-[#0a0a0a]">
            <MasterConfigModal
                isOpen={isMasterConfigOpen}
                onClose={() => setIsMasterConfigOpen(false)}
                onConfirm={handleConfirmMaster}
                variationId={selectedVariation?.id || ''}
                baseConfig={selectedVariation?.prompt_payload?.mixer as LuxMixer}
            />

            {/* Header compacto */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <span className="text-sm font-bold text-white">Archivo</span>
                    <span className="text-[10px] text-gray-500">({sessions.length})</span>
                </div>
                <div className="flex items-center gap-2">
                    {selectedVariation && (
                        <button 
                            onClick={() => setShowInfo(!showInfo)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                showInfo ? 'bg-lumen-gold text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                        >
                            INFO
                        </button>
                    )}
                    <button onClick={loadSessions} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                        <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
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
                <div className="flex-1 flex min-h-0 overflow-hidden">
                    
                    {/* Sidebar izquierdo minimalista - Solo thumbnails */}
                    <div className="w-20 bg-black/40 border-r border-white/5 overflow-y-auto py-2 px-1.5 space-y-1.5">
                        {sessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => {
                                    setSelectedSessionId(session.id);
                                    setSelectedVariation(session.variations?.[0] || null);
                                }}
                                className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                    selectedSessionId === session.id 
                                        ? 'border-lumen-gold' 
                                        : 'border-transparent hover:border-white/20'
                                }`}
                                title={new Date(session.created_at).toLocaleDateString('es-ES')}
                            >
                                <img 
                                    src={getSmallThumb(session.original_image_path)} 
                                    alt="" 
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </button>
                        ))}
                    </div>

                    {/* Visor principal - Maximizado */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {currentSession && selectedVariation ? (
                            <>
                                {/* Toolbar de zoom minimalista */}
                                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-black/20">
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={zoomOut} className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
                                            <ZoomOut className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-[10px] text-gray-400 font-mono w-10 text-center">{zoomPercentage}%</span>
                                        <button onClick={zoomIn} className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white">
                                            <ZoomIn className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={fitToContainer} className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[9px] px-1.5">
                                            FIT
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-gray-500">
                                        <Move className="w-3 h-3" />
                                        <span className="hidden sm:inline">Arrastra para mover</span>
                                    </div>
                                </div>

                                {/* Visor de comparación */}
                                <div 
                                    ref={containerRef}
                                    className="flex-1 bg-[#050505] relative overflow-hidden select-none"
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
                                            width: displaySize.w || 'auto',
                                            height: displaySize.h || 'auto',
                                        }}
                                    >
                                        {/* Imagen DESPUÉS (base) */}
                                        <img
                                            src={getDisplayUrl(selectedVariation.image_path)}
                                            alt="Después"
                                            onLoad={handleAfterImageLoad}
                                            className="absolute inset-0"
                                            style={{ 
                                                width: displaySize.w || '100%', 
                                                height: displaySize.h || '100%',
                                                objectFit: 'contain'
                                            }}
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
                                                onLoad={handleBeforeImageLoad}
                                                style={{ 
                                                    width: displaySize.w || '100%', 
                                                    height: displaySize.h || '100%',
                                                    objectFit: 'contain'
                                                }}
                                                draggable={false}
                                            />
                                        </div>
                                        
                                        {/* Línea del slider */}
                                        <div 
                                            className="slider-handle absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize z-20"
                                            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                                        >
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur rounded-full flex items-center justify-center border border-white/50">
                                                <span className="text-white text-sm">⟷</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Labels */}
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-white font-bold z-10">
                                        ANTES
                                    </div>
                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-lumen-gold font-bold z-10">
                                        DESPUÉS
                                    </div>
                                </div>

                                {/* Variaciones - Strip horizontal abajo */}
                                {currentSession.variations && currentSession.variations.length > 1 && (
                                    <div className="flex items-center gap-1.5 px-3 py-2 border-t border-white/5 bg-black/40">
                                        <span className="text-[9px] text-gray-500 uppercase mr-2">Variaciones:</span>
                                        {currentSession.variations.map((v, idx) => (
                                            <button
                                                key={v.id}
                                                onClick={() => setSelectedVariation(v)}
                                                className={`w-10 h-10 rounded overflow-hidden border-2 transition-all flex-shrink-0 ${
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
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                                <Camera className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-xs">Selecciona una sesión</p>
                            </div>
                        )}
                    </div>

                    {/* Panel de info - Colapsable */}
                    {showInfo && selectedVariation && (
                        <div className="w-64 bg-black/40 border-l border-white/5 overflow-y-auto p-3 space-y-3">
                            {/* Info básica */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Tipo</span>
                                    <span className="text-white font-medium">{selectedVariation.type}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Fecha</span>
                                    <span className="text-white">{new Date(selectedVariation.created_at).toLocaleDateString('es-ES')}</span>
                                </div>
                                {selectedVariation.prompt_payload?.mode && (
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-gray-500">Modo</span>
                                        <span className="text-lumen-gold font-bold">{selectedVariation.prompt_payload.mode}</span>
                                    </div>
                                )}
                            </div>

                            {/* 27 Sliders from selectedPresetId */}
                            {selectedVariation.prompt_payload?.selectedPresetId && (() => {
                                try {
                                    const config = JSON.parse(selectedVariation.prompt_payload.selectedPresetId);
                                    
                                    // Función para extraer slider_values del config
                                    const extractSliderValues = () => {
                                        const values: Record<string, Record<string, number>> = {
                                            photoscaler: {},
                                            stylescaler: {},
                                            lightscaler: {}
                                        };
                                        if (config.photoscaler?.sliders) {
                                            for (const s of config.photoscaler.sliders) {
                                                values.photoscaler[s.name] = s.value;
                                            }
                                        }
                                        if (config.stylescaler?.sliders) {
                                            for (const s of config.stylescaler.sliders) {
                                                values.stylescaler[s.name] = s.value;
                                            }
                                        }
                                        if (config.lightscaler?.sliders) {
                                            for (const s of config.lightscaler.sliders) {
                                                values.lightscaler[s.name] = s.value;
                                            }
                                        }
                                        return values;
                                    };
                                    
                                    return (
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            {/* Botón Guardar como Preset */}
                                            {userId && (
                                                <button
                                                    onClick={() => {
                                                        setPresetName('');
                                                        setSavePresetSuccess(false);
                                                        setShowSavePresetDialog(true);
                                                    }}
                                                    className="w-full py-2 px-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg flex items-center justify-center gap-2 text-green-400 text-[10px] font-semibold transition-all"
                                                >
                                                    <Save size={12} />
                                                    Guardar como Preset
                                                </button>
                                            )}
                                            
                                            {/* PhotoScaler */}
                                            {config.photoscaler?.sliders && (
                                                <div>
                                                    <p className="text-[9px] text-cyan-400 uppercase font-bold mb-1">📷 PhotoScaler</p>
                                                    <div className="space-y-0.5">
                                                        {config.photoscaler.sliders.map((s: {name: string, value: number}) => (
                                                            <div key={s.name} className="flex justify-between text-[9px]">
                                                                <span className="text-gray-500 truncate">{s.name.replace(/_/g, ' ')}</span>
                                                                <span className={`font-mono ${s.value > 7 ? 'text-amber-400' : s.value > 4 ? 'text-white' : 'text-gray-600'}`}>{s.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* StyleScaler */}
                                            {config.stylescaler?.sliders && (
                                                <div>
                                                    <p className="text-[9px] text-pink-400 uppercase font-bold mb-1">🎨 StyleScaler</p>
                                                    <div className="space-y-0.5">
                                                        {config.stylescaler.sliders.map((s: {name: string, value: number}) => (
                                                            <div key={s.name} className="flex justify-between text-[9px]">
                                                                <span className="text-gray-500 truncate">{s.name.replace(/_/g, ' ')}</span>
                                                                <span className={`font-mono ${s.value > 7 ? 'text-amber-400' : s.value > 4 ? 'text-white' : 'text-gray-600'}`}>{s.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* LightScaler */}
                                            {config.lightscaler?.sliders && (
                                                <div>
                                                    <p className="text-[9px] text-orange-400 uppercase font-bold mb-1">☀️ LightScaler</p>
                                                    <div className="space-y-0.5">
                                                        {config.lightscaler.sliders.map((s: {name: string, value: number}) => (
                                                            <div key={s.name} className="flex justify-between text-[9px]">
                                                                <span className="text-gray-500 truncate">{s.name.replace(/_/g, ' ')}</span>
                                                                <span className={`font-mono ${s.value > 7 ? 'text-amber-400' : s.value > 4 ? 'text-white' : 'text-gray-600'}`}>{s.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                } catch {
                                    return null;
                                }
                            })()}

                            {/* Fallback: Mixer resumen si no hay sliders */}
                            {!selectedVariation.prompt_payload?.selectedPresetId && selectedVariation.prompt_payload?.mixer && (
                                <div className="space-y-1.5 pt-2 border-t border-white/5">
                                    <p className="text-[9px] text-gray-600 uppercase">Parámetros</p>
                                    <MixerBar label="Estilo" value={selectedVariation.prompt_payload.mixer.stylism || 5} color="text-pink-400" icon={Palette} />
                                    <MixerBar label="Entorno" value={selectedVariation.prompt_payload.mixer.atrezzo || 5} color="text-blue-400" icon={Home} />
                                    <MixerBar label="Piel" value={selectedVariation.prompt_payload.mixer.skin_bio || 5} color="text-teal-400" icon={User} />
                                    <MixerBar label="Luz" value={selectedVariation.prompt_payload.mixer.lighting || 5} color="text-orange-400" icon={Sun} />
                                </div>
                            )}

                            {/* Prompt compilado COMPLETO */}
                            {selectedVariation.prompt_payload?.compiledPrompt && (
                                <div className="pt-2 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-[9px] text-purple-400 uppercase font-bold">📝 Prompt Completo</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedVariation.prompt_payload?.compiledPrompt || '');
                                            }}
                                            className="text-[8px] text-gray-500 hover:text-white px-1.5 py-0.5 bg-white/5 rounded"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    <div className="bg-black/60 rounded p-2 max-h-[400px] overflow-y-auto border border-white/5">
                                        <pre className="text-[8px] text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                                            {selectedVariation.prompt_payload.compiledPrompt}
                                        </pre>
                                    </div>
                                    <div className="flex justify-between mt-1 text-[8px] text-gray-600">
                                        <span>{selectedVariation.prompt_payload.compiledPrompt.length} chars</span>
                                        <span>~{Math.ceil(selectedVariation.prompt_payload.compiledPrompt.length / 4)} tokens</span>
                                    </div>
                                </div>
                            )}

                            {/* Debug Info - Vetos, Sanitization */}
                            {selectedVariation.prompt_payload?.debugInfo && (
                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-[9px] text-red-400 uppercase font-bold mb-1">🔧 Debug Info</p>
                                    
                                    {/* Vetos aplicados */}
                                    {selectedVariation.prompt_payload.debugInfo.vetos_applied?.length > 0 && (
                                        <div className="mb-2">
                                            <p className="text-[8px] text-amber-400 mb-0.5">Vetos aplicados:</p>
                                            {selectedVariation.prompt_payload.debugInfo.vetos_applied.map((v: any, i: number) => (
                                                <div key={i} className="text-[7px] text-gray-500 ml-1">
                                                    • {v.rule_name}
                                                    {v.actions?.map((a: any, j: number) => (
                                                        <div key={j} className="ml-2 text-gray-600">
                                                            {a.slider_name}: {a.original_value} → {a.forced_value}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Sanitization stats */}
                                    {selectedVariation.prompt_payload.debugInfo.sanitization && (
                                        <div className="text-[7px] text-gray-600">
                                            Redundancias: {selectedVariation.prompt_payload.debugInfo.sanitization.redundancies_removed || 0}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Metadata del compilador */}
                            {selectedVariation.prompt_payload?.metadata && (
                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-[9px] text-blue-400 uppercase font-bold mb-1">📊 Metadata v{selectedVariation.prompt_payload.metadata.version || '28.0'}</p>
                                    <div className="grid grid-cols-2 gap-1 text-[8px]">
                                        <div className="text-gray-500">Sliders activos:</div>
                                        <div className="text-white font-mono">{selectedVariation.prompt_payload.metadata.active_sliders || 0}</div>
                                        <div className="text-gray-500">Force (=10):</div>
                                        <div className="text-amber-400 font-mono">{selectedVariation.prompt_payload.metadata.force_sliders || 0}</div>
                                        <div className="text-gray-500">Identity Lock:</div>
                                        <div className="text-cyan-400 font-mono">{selectedVariation.prompt_payload.metadata.identity_lock_level || 'N/A'}</div>
                                        <div className="text-gray-500">Cache usado:</div>
                                        <div className={`font-mono ${selectedVariation.prompt_payload.metadata.cache_used ? 'text-green-400' : 'text-gray-600'}`}>
                                            {selectedVariation.prompt_payload.metadata.cache_used ? 'Sí' : 'No'}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* DNA Anchor info */}
                            {selectedVariation.prompt_payload?.dnaAnchor && (
                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-[9px] text-green-400 uppercase font-bold mb-1">🧬 DNA Anchor</p>
                                    <div className="text-[8px]">
                                        <span className="text-gray-500">Detectado: </span>
                                        <span className={selectedVariation.prompt_payload.dnaAnchor.detected ? 'text-green-400' : 'text-gray-600'}>
                                            {selectedVariation.prompt_payload.dnaAnchor.detected ? 'Sí' : 'No'}
                                        </span>
                                        {selectedVariation.prompt_payload.dnaAnchor.strength && (
                                            <>
                                                <span className="text-gray-500 ml-2">Fuerza: </span>
                                                <span className="text-amber-400">{selectedVariation.prompt_payload.dnaAnchor.strength}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Tokens estimados */}
                            {selectedVariation.prompt_payload?.tokensEstimate && (
                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-[9px] text-purple-400 uppercase font-bold mb-1">🎟️ Tokens</p>
                                    <div className="grid grid-cols-2 gap-1 text-[8px]">
                                        <div className="text-gray-500">Total estimado:</div>
                                        <div className="text-white font-mono">{selectedVariation.prompt_payload.tokensEstimate.total_estimated || 0}</div>
                                        {selectedVariation.prompt_payload.tokensEstimate.system_cached > 0 && (
                                            <>
                                                <div className="text-gray-500">System cached:</div>
                                                <div className="text-green-400 font-mono">{selectedVariation.prompt_payload.tokensEstimate.system_cached}</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Acciones */}
                            <div className="pt-2 border-t border-white/5 space-y-2">
                                <button
                                    onClick={copyConfigToClipboard}
                                    className="w-full py-1.5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-gray-400 flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <Copy className="w-3 h-3" />
                                    Copiar config
                                </button>
                                {!isMaster && (
                                    <button
                                        onClick={() => setIsMasterConfigOpen(true)}
                                        disabled={isProcessingMatrix}
                                        className="w-full py-2 bg-lumen-gold text-black rounded text-[10px] font-bold uppercase hover:bg-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        <Crown className="w-3 h-3" />
                                        Master 4K
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
