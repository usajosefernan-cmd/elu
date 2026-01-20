import React from 'react';
import {
    Settings, Scissors, Play, Layers, Check, Upload, Download,
    ImageIcon, Terminal, ArrowRight, Loader2, FlaskConical, Ruler
} from 'lucide-react';
import { getSupabaseClient } from '../services/authService';
import { UpscalerTileCalculator } from '../utils/luxScalerCalculator';
import { getReadableTimestamp } from '../utils/timestamps';

export interface LuxScalerState {
    isMasterProcessing: boolean;
    imageData: string | null;
    imageMime: string;
    imagePreview: string | null;
    targetRes: string;
    gridCols: number;
    gridRows: number;
    imgWidth: number;
    imgHeight: number;
    tiles: Record<string, { status: string; data: string | null; debug?: any }>;
    processing: boolean;
    progress: number;
    logs: string[];
    step: number;
    croppedTiles: Record<string, string>;
    sessionFolder: string | null;
    finalStitchedImage: string | null;
}

interface LuxScalerProProps {
    state: LuxScalerState;
    setState: React.Dispatch<React.SetStateAction<LuxScalerState>>; // Or partial if state structure matches
    onRun: () => void;
    onReassemble: () => void;
    onLog: (msg: string) => void;
    calculateGrid: (w: number, h: number, scale: string) => { cols: number, rows: number };
    onOpenLab: () => void; // To switch tab
}

export const LuxScalerPro: React.FC<LuxScalerProProps> = ({
    state, setState, onRun, onReassemble, onLog, calculateGrid, onOpenLab
}) => {
    const supabase = getSupabaseClient();

    return (
        <div className="flex-1 flex overflow-hidden animate-[fadeIn_0.3s] bg-[#0A0A0F]">
            {/* --- LEFT SIDEBAR: CONTROLS & STEPS (Fixed Width) --- */}
            <div className="w-64 flex flex-col border-r border-white/10 bg-black/20 shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-gray-900 to-black">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-lumen-gold animate-pulse" />
                                UPSCALER™ v4.2
                            </h3>
                            <p className="text-[9px] text-gray-500 font-mono mt-1">Virtual Optics Engine</p>
                        </div>
                        {/* Mobile/Open Lab Button if needed in header */}
                    </div>
                    <button
                        onClick={onOpenLab}
                        className="mt-3 w-full px-3 py-1.5 bg-crimson-glow/10 text-crimson-glow border border-crimson-glow/30 rounded text-[9px] font-bold hover:bg-crimson-glow hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <FlaskConical className="w-3 h-3" /> OPEN FORENSIC LAB
                    </button>
                </div>

                {/* Step Progress */}
                <div className="flex flex-col p-2 gap-1 bg-black/40">
                    {[
                        { id: 0, label: "1. CONFIG", icon: Settings },
                        { id: 1, label: "2. SEGMENTAR", icon: Scissors },
                        { id: 2, label: "3. GENERAR", icon: Play },
                        { id: 3, label: "4. UNIR", icon: Layers },
                        { id: 4, label: "LISTO", icon: Check }
                    ].map((s) => (
                        <div
                            key={s.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-[10px] uppercase font-bold transition-all ${state.step === s.id
                                ? 'bg-lumen-gold/20 text-lumen-gold border border-lumen-gold/30'
                                : state.step > s.id
                                    ? 'text-green-500 opacity-50'
                                    : 'text-gray-600 opacity-30'
                                }`}
                        >
                            <s.icon className="w-3 h-3" />
                            {s.label}
                        </div>
                    ))}
                    {/* Botón Restaurar - visible si step > 0 */}
                    {state.step > 0 && (
                        <button
                            onClick={() => {
                                setState((prev: any) => ({
                                    ...prev,
                                    step: 0,
                                    tiles: {},
                                    croppedTiles: {},
                                    sessionFolder: null,
                                    finalStitchedImage: null,
                                    processing: false,
                                    progress: 0
                                }));
                                onLog('🔄 Proceso reiniciado. Configura de nuevo.');
                            }}
                            className="mx-2 mt-1 w-[calc(100%-16px)] py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold uppercase rounded text-[8px] tracking-wider transition-all flex items-center justify-center gap-1"
                        >
                            🔄 RESTAURAR
                        </button>
                    )}
                </div>

                {/* ACTIVE STEP CONTROLS */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* CONTROLS FOR STEP 0 (CONFIG) */}
                    {state.step === 0 && (
                        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
                            {/* Upload */}
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-2">1. Imagen Base</h4>
                                <div
                                    className="border border-dashed border-white/10 rounded p-4 text-center hover:border-lumen-gold/50 cursor-pointer transition-all bg-black/40"
                                    onClick={() => document.getElementById('luxscaler-upload')?.click()}
                                >
                                    <input type="file" id="luxscaler-upload" className="hidden" accept="image/*" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                const result = ev.target?.result as string;
                                                const img = new Image();
                                                img.onload = () => {
                                                    // Reset state on new upload
                                                    const { cols, rows } = calculateGrid(img.width, img.height, state.targetRes);
                                                    setState((prev: any) => ({
                                                        ...prev,
                                                        step: 0, // Reset step
                                                        tiles: {},
                                                        croppedTiles: {},
                                                        imageData: result.split(',')[1],
                                                        imageMime: file.type,
                                                        imagePreview: result,
                                                        imgWidth: img.width,
                                                        imgHeight: img.height,
                                                        gridCols: cols,
                                                        gridRows: rows
                                                    }));
                                                };
                                                img.src = result;
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }} />
                                    {state.imagePreview ? (
                                        <div className="text-[9px] text-green-400 font-mono">
                                            ✅ Loaded<br />{state.imgWidth}x{state.imgHeight}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 text-[9px] flex flex-col items-center gap-2">
                                            <Upload className="w-4 h-4" />
                                            Click para subir
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Scale Selector */}
                            <div>
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-2">2. Factor de Escala</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {['x1.5', 'x2', 'x3', 'x4'].map(scale => (
                                        <button
                                            key={scale}
                                            onClick={() => {
                                                const { cols, rows } = calculateGrid(state.imgWidth, state.imgHeight, scale);
                                                setState((prev: any) => ({ ...prev, targetRes: scale, gridCols: cols, gridRows: rows }));
                                            }}
                                            className={`p-2 rounded border text-center transition-all ${state.targetRes === scale
                                                ? 'bg-lumen-gold text-black font-bold'
                                                : 'bg-black border-white/10 text-gray-400 hover:border-white/30'
                                                }`}
                                        >
                                            <div className="text-xs">{scale}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Verify & Confirm */}
                            {state.imageData && (
                                <button
                                    onClick={() => setState((prev: any) => ({ ...prev, step: 1 }))}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase rounded text-[10px] tracking-wider shadow-lg shadow-blue-900/20"
                                >
                                    CONFIRMAR GRID
                                </button>
                            )}
                        </div>
                    )}

                    {/* CONTROLS FOR STEP 1 (CROP) */}
                    {state.step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in">
                            {/* CHECK: ¿Falta imagen? */}
                            {!state.imageData || !state.imagePreview ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-[10px] text-red-200 font-mono">
                                        <div className="font-bold mb-1">⚠️ IMAGEN NO DISPONIBLE</div>
                                        <div>La sesión se restauró pero la imagen base no se guardó.</div>
                                        <div className="mt-1 text-red-300">Por favor, re-sube la imagen original.</div>
                                    </div>
                                    <div
                                        className="border border-dashed border-red-500/30 rounded p-4 text-center hover:border-lumen-gold/50 cursor-pointer transition-all bg-black/40"
                                        onClick={() => document.getElementById('luxscaler-reupload-step1')?.click()}
                                    >
                                        <input type="file" id="luxscaler-reupload-step1" className="hidden" accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    const result = ev.target?.result as string;
                                                    const img = new Image();
                                                    img.onload = () => {
                                                        const { cols, rows } = calculateGrid(img.width, img.height, state.targetRes);
                                                        setState((prev: any) => ({
                                                            ...prev,
                                                            imageData: result.split(',')[1],
                                                            imageMime: file.type,
                                                            imagePreview: result,
                                                            imgWidth: img.width,
                                                            imgHeight: img.height,
                                                            gridCols: cols,
                                                            gridRows: rows
                                                        }));
                                                        onLog('✅ Imagen re-subida correctamente. Puedes continuar.');
                                                    };
                                                    img.src = result;
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                        <div className="text-red-400 text-[9px] flex flex-col items-center gap-2">
                                            <Upload className="w-5 h-5" />
                                            RE-SUBIR IMAGEN
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setState((prev: any) => ({ ...prev, step: 0, tiles: {}, croppedTiles: {}, sessionFolder: null }))}
                                        className="w-full py-2 bg-gray-800 text-gray-400 font-bold uppercase rounded text-[9px] hover:bg-gray-700"
                                    >
                                        🔄 REINICIAR PROCESO
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-[10px] text-yellow-200 font-mono">
                                        <div className="font-bold mb-1">READY TO SLICE</div>
                                        <div>Total Tiles: {state.gridCols * state.gridRows}</div>
                                        <div>Grid: {state.gridCols}x{state.gridRows}</div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setState((prev: any) => ({ ...prev, processing: true }));
                                            onLog(`✂️ Iniciando segmentación Sliding Window...`);

                                            const imgSource = state.imagePreview || `data:image/png;base64,${state.imageData}`;
                                            const img = new Image();
                                            img.crossOrigin = "anonymous";
                                            img.onload = async () => {
                                                const naturalW = img.naturalWidth;
                                                const naturalH = img.naturalHeight;
                                                const result = UpscalerTileCalculator.calculate(naturalW, naturalH, Math.max(naturalW, naturalH) * parseFloat(state.targetRes.replace('x', '')));

                                                const scale = parseFloat(state.targetRes.replace('x', '')) || 2;

                                                // FIX CRÍTICO: Calcular tamaño de corte basado en target REAL (mantiene ratio original)
                                                // NO usar tile.w/tile.h que fuerza el aspect ratio del tile
                                                const targetW = Math.round(naturalW * scale);
                                                const targetH = Math.round(naturalH * scale);

                                                // Dividir el target entre el grid para obtener tamaño de cada tile en OUTPUT
                                                const outputTileW = Math.ceil(targetW / state.gridCols);
                                                const outputTileH = Math.ceil(targetH / state.gridRows);

                                                // Tamaño del corte en INPUT = output / scale
                                                const inputTileW = Math.ceil(outputTileW / scale);
                                                const inputTileH = Math.ceil(outputTileH / scale);

                                                const overlap = UpscalerTileCalculator.OVERLAP_PCT;
                                                const stepW = inputTileW * (1 - overlap);
                                                const stepH = inputTileH * (1 - overlap);

                                                const newCroppedTiles: any = {};

                                                const { data: { session } } = await supabase.auth.getSession();
                                                // RLS: Anónimos solo pueden subir a guest_analysis/
                                                const isAuthenticated = !!session?.user;
                                                const userPrefix = isAuthenticated
                                                    ? `upscaler/${session.user.email?.split('@')[0] || session.user.id}`
                                                    : 'guest_analysis';
                                                const folder = `${userPrefix}/${getReadableTimestamp()}`;
                                                setState((prev: any) => ({ ...prev, sessionFolder: folder }));
                                                onLog(isAuthenticated
                                                    ? `🔐 Subiendo como usuario: ${session.user.email}`
                                                    : `👤 Subiendo como invitado a guest_analysis/`);

                                                for (let r = 0; r < state.gridRows; r++) {
                                                    for (let c = 0; c < state.gridCols; c++) {
                                                        let x = (c === state.gridCols - 1) ? naturalW - inputTileW : Math.floor(c * stepW);
                                                        if (x < 0) x = 0;
                                                        let y = (r === state.gridRows - 1) ? naturalH - inputTileH : Math.floor(r * stepH);
                                                        if (y < 0) y = 0;

                                                        const finalW = Math.min(inputTileW, naturalW - x);
                                                        const finalH = Math.min(inputTileH, naturalH - y);

                                                        const cvs = document.createElement('canvas');
                                                        cvs.width = finalW; cvs.height = finalH;
                                                        const ctx = cvs.getContext('2d');
                                                        if (ctx) ctx.drawImage(img, x, y, finalW, finalH, 0, 0, finalW, finalH);

                                                        const blob = await new Promise<Blob | null>(res => cvs.toBlob(res, 'image/png'));
                                                        if (blob) {
                                                            const path = `${folder}/CORTE_${r}_${c}.png`;
                                                            await supabase.storage.from('lux-storage').upload(path, blob);
                                                            const { data } = supabase.storage.from('lux-storage').getPublicUrl(path);
                                                            newCroppedTiles[`${r}-${c}`] = data.publicUrl;
                                                            onLog(`✅ Tile [${r},${c}] subido.`);
                                                        }
                                                        await new Promise(r => setTimeout(r, 20));
                                                    }
                                                }

                                                setState((prev: any) => ({
                                                    ...prev,
                                                    step: 2,
                                                    processing: false,
                                                    croppedTiles: { ...prev.croppedTiles, ...newCroppedTiles }
                                                }));
                                            };
                                            img.src = imgSource;
                                        }}
                                        disabled={state.processing}
                                        className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase rounded text-[10px] tracking-wider shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {state.processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scissors className="w-3 h-3" />}
                                        EJECUTAR CORTE
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* CONTROLS FOR STEP 2 (GENERATE) */}
                    {state.step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in">
                            {/* CHECK: ¿Falta imagen? (Sesión restaurada sin base64) */}
                            {!state.imageData ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-[10px] text-red-200 font-mono">
                                        <div className="font-bold mb-1">⚠️ IMAGEN NO DISPONIBLE</div>
                                        <div>La sesión se restauró pero la imagen base no se guardó.</div>
                                        <div className="mt-1 text-red-300">Por favor, re-sube la imagen original.</div>
                                    </div>
                                    <div
                                        className="border border-dashed border-red-500/30 rounded p-4 text-center hover:border-lumen-gold/50 cursor-pointer transition-all bg-black/40"
                                        onClick={() => document.getElementById('luxscaler-reupload')?.click()}
                                    >
                                        <input type="file" id="luxscaler-reupload" className="hidden" accept="image/*" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    const result = ev.target?.result as string;
                                                    const img = new Image();
                                                    img.onload = () => {
                                                        setState((prev: any) => ({
                                                            ...prev,
                                                            imageData: result.split(',')[1],
                                                            imageMime: file.type,
                                                            imagePreview: result,
                                                            imgWidth: img.width,
                                                            imgHeight: img.height,
                                                        }));
                                                        onLog('✅ Imagen re-subida correctamente. Puedes continuar.');
                                                    };
                                                    img.src = result;
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                        <div className="text-red-400 text-[9px] flex flex-col items-center gap-2">
                                            <Upload className="w-5 h-5" />
                                            RE-SUBIR IMAGEN
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setState((prev: any) => ({ ...prev, step: 0, tiles: {}, croppedTiles: {}, sessionFolder: null }))}
                                        className="w-full py-2 bg-gray-800 text-gray-400 font-bold uppercase rounded text-[9px] hover:bg-gray-700"
                                    >
                                        🔄 REINICIAR PROCESO
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-3 bg-green-900/20 border border-green-500/30 rounded text-[10px] text-green-200 font-mono">
                                        <div className="font-bold mb-1">READY TO UPSCALE</div>
                                        <div>Method: AI Pro</div>
                                        <div>Grid: {state.gridCols}×{state.gridRows} = {state.gridCols * state.gridRows} tiles</div>
                                        <div className="mt-1 text-cyan-300">
                                            Entrada: {state.imgWidth}×{state.imgHeight}px
                                        </div>
                                        <div className="text-lumen-gold">
                                            Salida: {Math.round(state.imgWidth * parseFloat(state.targetRes.replace('x', '')))}×{Math.round(state.imgHeight * parseFloat(state.targetRes.replace('x', '')))}px ({state.targetRes})
                                        </div>
                                        <div className="text-gray-400 text-[8px] mt-1">
                                            Tile aprox: {Math.round(state.imgWidth / state.gridCols)}×{Math.round(state.imgHeight / state.gridRows)}px → {Math.round((state.imgWidth / state.gridCols) * parseFloat(state.targetRes.replace('x', '')))}×{Math.round((state.imgHeight / state.gridRows) * parseFloat(state.targetRes.replace('x', '')))}px
                                        </div>
                                    </div>
                                    {state.gridCols * state.gridRows === 1 && (
                                        <div className="p-2 bg-yellow-900/30 border border-yellow-500/40 rounded text-[9px] text-yellow-300">
                                            ⚠️ Solo 1 tile. Imagen pequeña, se procesará completa.
                                        </div>
                                    )}
                                    <button
                                        onClick={onRun}
                                        disabled={state.processing}
                                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold uppercase rounded text-[10px] tracking-wider shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {state.processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                        INICIAR PROCESO
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* CONTROLS FOR STEP 3 (MERGE) */}
                    {state.step === 3 && (
                        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in">
                            <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded text-[10px] text-purple-200 font-mono">
                                <div className="font-bold mb-1">FINAL TEXTURE</div>
                                <div>Fragments Ready.</div>
                            </div>
                            <button
                                onClick={onReassemble}
                                disabled={state.processing}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase rounded text-[10px] tracking-wider shadow-lg flex items-center justify-center gap-2"
                            >
                                {state.processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                                RE-ENSAMBLAR
                            </button>
                        </div>
                    )}

                    {/* CONTROLS FOR STEP 4 (DONE) */}
                    {state.step === 4 && (
                        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in">
                            <a
                                href={state.finalStitchedImage!}
                                target="_blank"
                                download="master_upscale.png"
                                className="w-full py-3 bg-lumen-gold text-black font-bold uppercase rounded text-[10px] tracking-wider shadow-lg flex items-center justify-center gap-2"
                            >
                                <Download className="w-3 h-3" /> DESCARGAR
                            </a>
                            <button
                                onClick={() => setState((prev: any) => ({ ...prev, step: 0, tiles: {}, croppedTiles: {}, finalStitchedImage: null, sessionFolder: null }))}
                                className="w-full py-2 bg-white/10 text-gray-400 font-bold uppercase rounded text-[9px] hover:bg-white/20"
                            >
                                NUEVA TAREA
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* --- CENTER MAIN: VIEWPORT (Flex Grow) --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#050505] relative">
                {/* Navbar / Info Bar */}
                <div className="h-10 border-b border-white/10 bg-black/40 flex items-center justify-between px-4">
                    <span className="text-[10px] text-gray-500 font-mono uppercase">Viewport: {state.imgWidth}x{state.imgHeight}px</span>
                    {state.processing && (
                        <div className="w-32 h-1 bg-gray-800 rounded overflow-hidden">
                            <div className="h-full bg-lumen-gold transition-all duration-300" style={{ width: `${state.progress}%` }} />
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex items-center justify-center p-8 relative">
                    {/* BACKGROUND GRID */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    />

                    {/* Main Image / Grid */}
                    {state.imagePreview ? (
                        <div className="relative max-w-full max-h-full shadow-2xl border border-white/10">
                            {!state.finalStitchedImage ? (
                                <>
                                    <img
                                        src={state.imagePreview}
                                        className="max-w-full max-h-[calc(100vh-150px)] object-contain opacity-50 block"
                                    />
                                    {/* GRID OVERLAY */}
                                    <div
                                        className="absolute inset-0 grid border border-white/20"
                                        style={{
                                            gridTemplateColumns: `repeat(${state.gridCols}, 1fr)`,
                                            gridTemplateRows: `repeat(${state.gridRows}, 1fr)`
                                        }}
                                    >
                                        {Array.from({ length: state.gridCols * state.gridRows }).map((_, i) => (
                                            <div key={i} className="border border-lumen-gold/20 flex items-center justify-center text-[8px] text-lumen-gold/50 font-mono hover:bg-lumen-gold/10 transition-colors">
                                                {i}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <img
                                    src={state.finalStitchedImage}
                                    className="max-w-full max-h-[calc(100vh-150px)] object-contain shadow-[0_0_50px_rgba(0,255,100,0.2)]"
                                />
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-600">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-xs uppercase tracking-widest">No Image Loaded</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- RIGHT SIDEBAR: INSPECTOR (Fixed Width) --- */}
            <div className="w-80 flex flex-col border-l border-white/10 bg-black/20 shrink-0">
                <div className="p-2 bg-black border-b border-white/10 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> INSPECTOR
                    </span>
                    <span className="text-[8px] text-gray-600 font-mono">
                        {state.sessionFolder ? 'REC: ON' : 'IDLE'}
                    </span>
                </div>

                {/* TILE LIST */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-black/50">
                    {Object.keys(state.tiles).length === 0 ? (
                        <div className="text-[10px] text-gray-700 text-center py-10">Esperando tareas...</div>
                    ) : (
                        Object.entries(state.tiles).map(([key, tile]) => {
                            const [r, c] = key.split('-');
                            // Need to calculate tile dimensions roughly for preview
                            const scale = parseFloat(state.targetRes.replace('x', '')) || 2;
                            const targetW = Math.round(state.imgWidth * scale);
                            const targetH = Math.round(state.imgHeight * scale);
                            const baseW = Math.floor(targetW / state.gridCols);
                            const baseH = Math.floor(targetH / state.gridRows);
                            // Simple approx

                            return (
                                <div key={key} className="flex gap-2 p-1.5 bg-black/40 border border-white/5 rounded hover:border-white/20 transition-all group">
                                    {/* Mini Preview */}
                                    <div className="w-8 h-8 bg-black rounded border border-white/10 overflow-hidden relative">
                                        {tile.debug?.outputUrl ? (
                                            <img src={tile.debug.outputUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`w-full h-full ${tile.status === 'processing' ? 'bg-blue-500/20 animate-pulse' : 'bg-gray-800'}`} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-gray-300 font-mono">TILE [{r},{c}]</span>
                                            <span className={`text-[8px] uppercase font-bold ${tile.status === 'done' ? 'text-green-500' :
                                                tile.status === 'error' ? 'text-red-500' :
                                                    tile.status === 'processing' ? 'text-blue-500' : 'text-gray-600'
                                                }`}>{tile.status}</span>
                                        </div>
                                        <div className="text-[7px] text-gray-600 truncate">
                                            {tile.debug?.status || 'Waiting...'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* LOG CONSOLE (Bottom Dock) */}
                <div className="h-32 bg-black border-t border-white/10 flex flex-col font-mono text-[8px]">
                    <div className="px-2 py-1 bg-white/5 text-gray-500 text-[9px] font-bold uppercase">System Logs</div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-gray-400">
                        {state.logs.slice().reverse().map((log, i) => (
                            <div key={i} className="truncate hover:text-white transition-colors">
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
