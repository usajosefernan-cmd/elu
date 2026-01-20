
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Search, Loader2, Maximize, Hand, Minimize, Info, Database, Copy, Zap, Brain } from 'lucide-react';
import { ComparisonSlider } from './ComparisonSlider';

interface ImageInspectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    processedImage: string;
    originalImage?: string;
    title?: string;
    initialFocus?: { x: number, y: number }; // x,y percentages (0-100)
    variation?: any;
    generation?: any;
    onGenerateMaster?: (variationId: string, settings: any) => Promise<void>;
    isProcessing?: boolean;
}

export const ImageInspectorModal: React.FC<ImageInspectorModalProps> = ({
    isOpen,
    onClose,
    processedImage,
    originalImage,
    title = "Inspection Mode",
    initialFocus,
    variation,
    generation,
    onGenerateMaster,
    isProcessing = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [imgNativeSize, setImgNativeSize] = useState({ w: 1, h: 1 });
    const [showHud, setShowHud] = useState(false);
    const [showInfo, setShowInfo] = useState(true);

    // Master Settings
    const [masterSettings, setMasterSettings] = useState({
        resolution: '4K',
        format: 'PNG',
        engine: 'Nano Banana Pro'
    });

    // TRANSFORM STATE
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [fitScale, setFitScale] = useState(1);

    // PINCH STATE
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

    // INITIALIZATION
    useEffect(() => {
        if (isOpen && processedImage) {
            setIsLoading(true);
            const img = new Image();
            img.src = processedImage;

            img.onload = () => {
                setImgNativeSize({ w: img.naturalWidth, h: img.naturalHeight });
                setIsLoading(false);

                // Calculate Fit Scale initially
                if (containerRef.current) {
                    const { clientWidth, clientHeight } = containerRef.current;
                    const scaleX = clientWidth / img.naturalWidth;
                    const scaleY = clientHeight / img.naturalHeight;
                    const newFitScale = Math.min(scaleX, scaleY, 1); // Never larger than 1 initially
                    setFitScale(newFitScale);

                    // Start at Fit Scale
                    setScale(newFitScale);

                    // Center it
                    const displayW = img.naturalWidth * newFitScale;
                    const displayH = img.naturalHeight * newFitScale;
                    setTranslate({
                        x: (clientWidth - displayW) / 2,
                        y: (clientHeight - displayH) / 2
                    });
                }
            };
            img.onerror = () => setIsLoading(false);
        }
    }, [isOpen, processedImage]);

    // Handle Window Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && imgNativeSize.w > 1) {
                const { clientWidth, clientHeight } = containerRef.current;
                const scaleX = clientWidth / imgNativeSize.w;
                const scaleY = clientHeight / imgNativeSize.h;
                const newFitScale = Math.min(scaleX, scaleY, 1);
                setFitScale(newFitScale);
                // Ideally we'd adjust current scale if it was at fit, but simple re-calc is safer
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [imgNativeSize]);

    // --- ZOOM LOGIC (Wheel) ---
    const handleWheel = (e: React.WheelEvent) => {
        if (isLoading) return;

        // Prevent default scrolling of document
        // Note: in React passive events might prevent preventDefault, so we might need ref listener if this fails
        // but typically stopping propagation works for UI

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const delta = -e.deltaY * 0.0015; // Sensitivity
        let newScale = scale + delta;

        // Limits: Fit Scale (Lower) to 1.0 (Native)
        // Allowing slight overzoom (1.5) for pixel peeping, but prompt asked for limit 100% (1.0).
        // Let's stick to 1.0 as max strict per prompt.
        newScale = Math.min(3.0, Math.max(fitScale * 0.8, newScale));

        // Calculate focus point relative to image
        // We want to zoom towards the mouse
        const mouseX = e.clientX - rect.left - translate.x;
        const mouseY = e.clientY - rect.top - translate.y;

        const scaleRatio = newScale / scale;

        const newTranslateX = e.clientX - rect.left - (mouseX * scaleRatio);
        const newTranslateY = e.clientY - rect.top - (mouseY * scaleRatio);

        setScale(newScale);
        clampAndSetTranslate(newTranslateX, newTranslateY, newScale);
    };

    // --- PAN LOGIC ---
    const handleMouseDown = (e: React.MouseEvent) => {
        // Only pan if zoomed in (scale > fitScale) OR if user just wants to move the image around
        // Don't interfere if clicking controls (handled by z-index usually)
        setIsDragging(true);
        setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        clampAndSetTranslate(newX, newY, scale);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (containerRef.current) containerRef.current.style.cursor = scale > fitScale ? 'grab' : 'default';
    };

    // --- TOUCH LOGIC (Pinch & Pan) ---
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch Start
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            setLastTouchDistance(dist);
        } else if (e.touches.length === 1) {
            // Pan Start
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - translate.x,
                y: e.touches[0].clientY - translate.y
            });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isLoading) return;

        if (e.touches.length === 2) {
            // Pinch Zoom
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            if (lastTouchDistance) {
                const delta = dist - lastTouchDistance;
                const zoomFactor = delta * 0.005; // Sensitivity
                let newScale = scale + zoomFactor;
                newScale = Math.min(3.0, Math.max(fitScale * 0.8, newScale));

                // Center pinch zoom (simplified: zoom towards center of viewport)
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;

                    const imgX = centerX - translate.x;
                    const imgY = centerY - translate.y;

                    const scaleRatio = newScale / scale;

                    const newTx = centerX - (imgX * scaleRatio);
                    const newTy = centerY - (imgY * scaleRatio);

                    setScale(newScale);
                    clampAndSetTranslate(newTx, newTy, newScale);
                }
            }
            setLastTouchDistance(dist);

        } else if (e.touches.length === 1 && isDragging) {
            // Pan
            const newX = e.touches[0].clientX - dragStart.x;
            const newY = e.touches[0].clientY - dragStart.y;
            clampAndSetTranslate(newX, newY, scale);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        setLastTouchDistance(null);
    };

    // --- BOUNDARY CHECKS ---
    const clampAndSetTranslate = (x: number, y: number, currentScale: number) => {
        if (!containerRef.current) return;
        const { clientWidth, clientHeight } = containerRef.current;
        const imgW = imgNativeSize.w * currentScale;
        const imgH = imgNativeSize.h * currentScale;

        // X Axis
        let newX = x;
        if (imgW <= clientWidth) {
            // If image is smaller than container, center it
            newX = (clientWidth - imgW) / 2;
        } else {
            // If larger, clamp edges
            // Allow some panning over the edge for "bounce" feel or full inspection
            // Standard approach: don't let the image fly off screen completely
            const minX = clientWidth - imgW;
            const maxX = 0;
            newX = Math.min(maxX + 100, Math.max(newX, minX - 100)); // 100px bounce buffer
        }

        // Y Axis
        let newY = y;
        if (imgH <= clientHeight) {
            newY = (clientHeight - imgH) / 2;
        } else {
            const minY = clientHeight - imgH;
            const maxY = 0;
            newY = Math.min(maxY + 100, Math.max(newY, minY - 100));
        }

        setTranslate({ x: newX, y: newY });
    };

    // --- RESET / MAXIMIZE ---
    const toggleZoom = () => {
        if (scale >= 0.99) {
            // Reset to Fit
            setScale(fitScale);
            // Re-center
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const displayW = imgNativeSize.w * fitScale;
                const displayH = imgNativeSize.h * fitScale;
                setTranslate({
                    x: (clientWidth - displayW) / 2,
                    y: (clientHeight - displayH) / 2
                });
            }
        } else {
            // Zoom to 100%
            setScale(1);
            // Center in view (roughly)
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setTranslate({
                    x: (clientWidth - imgNativeSize.w) / 2,
                    y: (clientHeight - imgNativeSize.h) / 2
                });
            }
        }
    };

    const currentPercentage = Math.round(scale * 100);

    if (!isOpen || !processedImage) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-[fadeIn_0.3s]">

            {/* --- CONTROLS HEADER --- */}
            <div className="absolute top-0 left-0 right-0 z-[210] p-6 flex justify-between items-start pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full pointer-events-auto flex items-center gap-4">
                    <p className="text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-2">
                        <Search className="w-3 h-3 text-lumen-gold" /> {title}
                        <span className="text-gray-500">|</span>
                        <span className="text-lumen-gold font-mono">{currentPercentage}%</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-400 font-mono">{imgNativeSize.w}x{imgNativeSize.h}px</span>
                    </p>
                </div>

                <div className="flex gap-3 pointer-events-auto ml-auto">
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className={`h-10 px-4 rounded-full border flex items-center gap-2 text-xs font-bold uppercase transition-all shadow-lg backdrop-blur-md ${showInfo
                            ? 'bg-prismatic-blue text-white border-prismatic-blue'
                            : 'bg-black/60 text-white border-white/20 hover:border-prismatic-blue'
                            }`}
                    >
                        <Database className="w-4 h-4" /> INFO
                    </button>

                    <button
                        onClick={() => setShowHud(!showHud)}
                        className={`h-10 px-4 rounded-full border flex items-center gap-2 text-xs font-bold uppercase transition-all shadow-lg backdrop-blur-md ${showHud
                            ? 'bg-lumen-gold text-black border-lumen-gold'
                            : 'bg-black/60 text-white border-white/20 hover:border-lumen-gold'
                            }`}
                    >
                        <Info className="w-4 h-4" /> HUD
                    </button>

                    <button
                        onClick={toggleZoom}
                        className={`h-10 px-4 rounded-full border flex items-center gap-2 text-xs font-bold uppercase transition-all shadow-lg backdrop-blur-md ${scale >= 0.99
                            ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                            : 'bg-black/60 text-white border-white/20 hover:border-lumen-gold'
                            }`}
                        disabled={isLoading}
                    >
                        {scale >= 0.99 ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        {scale >= 0.99 ? 'Fit' : '1:1'}
                    </button>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-crimson-glow hover:border-crimson-glow hover:text-white transition-all shadow-lg backdrop-blur-md"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* --- INFO PANEL (SIDEBAR) --- */}
            {showInfo && variation && (
                <div className="absolute top-[100px] left-6 bottom-6 w-80 z-[210] flex flex-col gap-4 animate-[slideInLeft_0.3s] pointer-events-none">
                    {/* TELEMETRY CARD */}
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden flex flex-col shadow-2xl pointer-events-auto max-h-[60%] border-l-4 border-l-prismatic-blue">
                        <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                <Database className="w-3 h-3 text-prismatic-blue" /> VariaciÃ³n Telemetry
                            </h4>
                            <span className="text-[9px] font-mono text-gray-500">#{variation.id?.substring(0, 8)}</span>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
                            <div>
                                <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Archetype</label>
                                <div className="text-[10px] text-lumen-gold font-mono bg-white/5 p-2 rounded border border-white/5">
                                    {variation.style_id}
                                </div>
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Prompts Utilizados</label>
                                <div className="space-y-2">
                                    <div className="bg-black/40 p-2 rounded border border-white/5">
                                        <span className="text-[7px] text-gray-600 uppercase block mb-1">User Intent:</span>
                                        <p className="text-[9px] text-gray-300 italic line-clamp-2">{generation?.semantic_analysis?.telemetry?.input_settings?.userPrompt || 'N/A'}</p>
                                    </div>
                                    <div className="bg-black/40 p-2 rounded border border-white/5 relative group">
                                        <span className="text-[7px] text-prismatic-blue uppercase block mb-1 font-bold">Engine Payload:</span>
                                        <p className="text-[9px] text-gray-400 font-mono line-clamp-4 leading-relaxed">{variation.prompt_payload?.prompt || 'N/A'}</p>
                                        <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigator.clipboard.writeText(variation.prompt_payload?.prompt)}>
                                            <Copy className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Mixer Settings</label>
                                    <div className="text-[9px] text-gray-400 font-mono bg-white/5 p-2 rounded flex flex-col gap-0.5">
                                        <span>STY: {variation.settings_production_style || generation?.semantic_analysis?.telemetry?.input_settings?.mixer?.stylism || '5'}</span>
                                        <span>LIT: {variation.settings_lighting_complexity || generation?.semantic_analysis?.telemetry?.input_settings?.mixer?.lighting || '5'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Coste Estimado</label>
                                    <div className="text-[9px] text-emerald-400 font-bold font-mono bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                                        ${(variation.cost_cogs || 0).toFixed(4)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MASTER ACTION CARD */}
                    <div className="bg-black/90 backdrop-blur-2xl border border-lumen-gold/30 rounded-lg overflow-hidden flex flex-col shadow-[0_0_30px_rgba(255,215,0,0.1)] pointer-events-auto border-l-4 border-l-lumen-gold">
                        <div className="p-3 bg-lumen-gold/10 border-b border-lumen-gold/20 flex items-center gap-2">
                            <Brain className="w-4 h-4 text-lumen-gold" />
                            <h4 className="text-[10px] font-black text-lumen-gold uppercase tracking-tighter">Master Sculptor v19.1</h4>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">ResoluciÃ³n</label>
                                    <select
                                        className="w-full bg-black border border-white/10 rounded p-1.5 text-[10px] text-white focus:border-lumen-gold outline-none font-bold"
                                        value={masterSettings.resolution}
                                        onChange={e => setMasterSettings(prev => ({ ...prev, resolution: e.target.value }))}
                                    >
                                        <option value="4K">ULTRA 4K</option>
                                        <option value="8K">HYPER 8K</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Formato</label>
                                    <select
                                        className="w-full bg-black border border-white/10 rounded p-1.5 text-[10px] text-white focus:border-lumen-gold outline-none font-bold"
                                        value={masterSettings.format}
                                        onChange={e => setMasterSettings(prev => ({ ...prev, format: e.target.value }))}
                                    >
                                        <option value="PNG">PNG 16-BIT</option>
                                        <option value="JPEG">JPEG 100%</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={() => onGenerateMaster && onGenerateMaster(variation.id, masterSettings)}
                                disabled={isProcessing || !onGenerateMaster}
                                className={`w-full py-3 rounded-md font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isProcessing
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-lumen-gold to-yellow-600 text-black hover:scale-[1.02] shadow-lg shadow-lumen-gold/20 active:scale-95'
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Esculpiendo...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" /> Crear Master Final
                                    </>
                                )}
                            </button>
                            <p className="text-[7px] text-gray-500 text-center uppercase font-bold opacity-50">Nano Banana Pro | 1-Step Direct Master</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN VIEWPORT --- */}
            <div
                ref={containerRef}
                className="flex-1 w-full h-full bg-checkered overflow-hidden cursor-grab active:cursor-grabbing touch-none relative"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center space-y-4 w-full h-full">
                        <Loader2 className="w-10 h-10 text-lumen-gold animate-spin" />
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Decoding Master File...</p>
                    </div>
                ) : (
                    <>
                        <div
                            style={{
                                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                                width: imgNativeSize.w,
                                height: imgNativeSize.h,
                                transformOrigin: '0 0',
                                willChange: 'transform'
                            }}
                            className="relative"
                        >
                            {originalImage ? (
                                <ComparisonSlider
                                    originalImage={originalImage}
                                    processedImage={processedImage}
                                    isLocked={false}
                                    objectFit="cover" // Always cover inside the exact-sized container
                                    enableNativeScrolling={false} // Disable internal pan, allow parent to handle
                                />
                            ) : (
                                <img
                                    src={processedImage}
                                    className="w-full h-full object-cover"
                                    alt="Inspection"
                                    draggable={false}
                                />
                            )}

                            {/* HUD OVERLAY ON IMAGE SURFACE (Moves with image) */}
                            {showHud && (
                                <div className="absolute inset-0 pointer-events-none border border-lumen-gold/30">
                                    {/* Rule of Thirds Grid */}
                                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                                        <div className="border-r border-b border-lumen-gold"></div>
                                        <div className="border-r border-b border-lumen-gold"></div>
                                        <div className="border-b border-lumen-gold"></div>
                                        <div className="border-r border-b border-lumen-gold"></div>
                                        <div className="border-r border-b border-lumen-gold"></div>
                                        <div className="border-b border-lumen-gold"></div>
                                        <div className="border-r border-lumen-gold"></div>
                                        <div className="border-r border-lumen-gold"></div>
                                    </div>

                                    {/* Tech Data Floating */}
                                    <div className="absolute bottom-4 left-4 bg-black/80 text-[10px] font-mono text-lumen-gold p-2 border border-lumen-gold/30 rounded backdrop-blur">
                                        <p>RES: {imgNativeSize.w}x{imgNativeSize.h}</p>
                                        <p>ASP: {(imgNativeSize.w / imgNativeSize.h).toFixed(2)}</p>
                                        <p>ZOM: {scale.toFixed(2)}x</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* INSTRUCTIONS TOAST */}
            {!isLoading && scale < 0.99 && !showHud && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none animate-pulse flex flex-col items-center gap-2 z-[220]">
                    <span className="text-[9px] text-white/70 uppercase tracking-widest font-bold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-2">
                        <Hand className="w-3 h-3" /> Scroll/Pinch to Zoom
                    </span>
                </div>
            )}
        </div>
    );
};
