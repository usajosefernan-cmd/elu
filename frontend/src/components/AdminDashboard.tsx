
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient, supabaseUrl } from '../services/authService';
import { deleteGeneration } from '../services/historyService';
import {
    ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Brain, Check, CheckSquare, ChevronLeft, ChevronRight, Copy, Database, DollarSign, Download, FileText, FlaskConical, Folder, HardDrive, Images, LayoutGrid, List, Loader2, Maximize, Palette, Play, RefreshCw, Save, ScanLine, Scissors, Server, Settings, ShieldAlert, Ticket, Trash2, Users, Zap, ZoomIn, Info, Layers, Fingerprint, Eye, Scan, Target, Grid, Shield, Clock, Sun, PenTool, Box, Activity, Terminal, LayoutDashboard, Microscope, LogOut, Smartphone, X, Key, Mail, Upload
} from 'lucide-react';
import { ComparisonSlider } from './ComparisonSlider';
import { ImageInspectorModal } from './ImageInspectorModal';
import { ForensicLab } from './ForensicLab';
import ThemeDesigner from './admin/ThemeDesigner';
import { AdminUserManagement } from './admin/AdminUserManagement';
import { AdminMarketing } from './admin/AdminMarketing';
import { AdminInfrastructure } from './admin/AdminInfrastructure';
import { LuxScalerPro } from './LuxScalerPro'; // NEW IMPORT
import { AdminStripe } from './admin/AdminStripe'; // NEW IMPORT
import { AdminGodMode } from './admin/AdminGodMode'; // GOD MODE IMPORT
import { ProductShowcase, ShowcaseExample } from './ProductShowcase';
import { AdminLayout } from './admin/layout/AdminLayout'; // NEW IMPORT
import { AdminLuxCanvas } from './admin/luxcanvas/AdminLuxCanvas'; // LUX CANVAS IMPORT
import { useTranslation } from 'react-i18next'; // IMPORT I18N
import { getDisplayUrl, getMasterUrl, getThumbnailUrl } from '../utils/imageUtils';
import { compressAndResizeImage, uploadImageToStorage, generatePreviewGrid, analyzeImage, generateMaster } from '../services/geminiService';
import { PHOTOSCALER_EXAMPLES } from '../constants/showcaseData';
import { UpscalerTileCalculator } from '../utils/luxScalerCalculator';



interface AdminDashboardProps {
    onBack: () => void;
    standAloneMode?: boolean; // NEW: If true, hides sidebar and admin tabs
    defaultShowcase?: boolean; // NEW: If true, starts in showcase mode
}

type TabView = 'RESUMEN' | 'USUARIOS' | 'MARKETING' | 'INFRAESTRUCTURA' | 'LISTA_ESPERA' | 'REGISTRO_DATOS' | 'CONFIG_VIVA' | 'ALMACENAMIENTO' | 'LABORATORIO' | 'LUXSCALER' | 'THEME_DESIGNER' | 'STRIPE' | 'GOD_MODE' | 'LUXCANVAS';
// TABS
type Tab = 'REGISTRO_DATOS' | 'ALMACENAMIENTO' | 'LABORATORIO' | 'LUXSCALER' | 'THEME_DESIGNER';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, standAloneMode = false, defaultShowcase = false }) => {
    const { t } = useTranslation(); // HOOK INIT
    const navigate = useNavigate(); // For LuxCanvas redirection
    const [currentTab, setCurrentTab] = useState<TabView>(standAloneMode ? 'LUXSCALER' : 'RESUMEN');
    const supabase = getSupabaseClient(); // Fix: Initialize Supabase Client
    const [showcaseMode, setShowcaseMode] = useState<'NONE' | 'LUXSCALER' | 'STYLE' | 'LIGHT'>(defaultShowcase ? 'LUXSCALER' : 'NONE');
    const [stats, setStats] = useState({ users: 0, generations: 0, variations: 0, waitlist: 0, total_cost: 0 });
    const [luxScalerSection, setLuxScalerSection] = useState<'WORKSTATION' | 'SHOWCASE'>('WORKSTATION');

    const [generationsList, setGenerationsList] = useState<any[]>([]);
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 10;
    const [totalRecords, setTotalRecords] = useState(0);

    // Detailed Selection
    const [selectedGenId, setSelectedGenId] = useState<string | null>(null);
    const [activeGenDetails, setActiveGenDetails] = useState<any | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [selectedVariation, setSelectedVariation] = useState<any | null>(null);

    // Inspector
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    // Config State
    const [stylesConfig, setStylesConfig] = useState<any[]>([]);
    const [systemConfig, setSystemConfig] = useState<any[]>([]);
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    // --- STORAGE STATE ---
    const [storageBucket, setStorageBucket] = useState('lux-storage');
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>('grid');
    const [thumbnailSize, setThumbnailSize] = useState<number>(180); // Default px width
    const [renamingFile, setRenamingFile] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [isMoving, setIsMoving] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ column: 'name' | 'created_at' | 'size', order: 'asc' | 'desc' }>({ column: 'created_at', order: 'desc' });
    const [isStorageLoading, setIsStorageLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationProgress, setOptimizationProgress] = useState({ current: 0, total: 0 });
    const [optimizingItems, setOptimizingItems] = useState<Set<string>>(new Set());
    // NEW: Create Folder & Upload
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    // --- LAB STATE ---
    const [benchBaseImage, setBenchBaseImage] = useState<string>('https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/pruebas_original01.webp');
    const [benchPrompt, setBenchPrompt] = useState<string>(`Motor de reconstrucción generativa de ultra-alta fidelidad...
FASE 1: ANCLA DE IDENTIDAD
FASE 2: MOTOR DE ALUCINACIÓN DE TEXTURA
FASE 3: SIMULACIÓN ÓPTICA
FASE 4: REILUMINACIÓN VOLUMÉTRICA`);
    const [benchResults, setBenchResults] = useState<Record<string, string>>({});
    const [benchLoading, setBenchLoading] = useState<Record<string, boolean>>({});
    const [benchActiveResult, setBenchActiveResult] = useState<string | null>(null);

    // --- LUXSCALER STATE ---

    const [luxScalerState, setLuxScalerState] = useState<{
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
    }>({
        isMasterProcessing: false,
        imageData: null,
        imageMime: 'image/png',
        imagePreview: null,
        targetRes: 'x2',
        gridCols: 1,
        gridRows: 1,
        imgWidth: 0,
        imgHeight: 0,
        tiles: {},
        processing: false,
        progress: 0,
        logs: [],
        step: 0, // 0=idle, 1=confirm_grid, 2=cropping, 3=generating, 4=done
        croppedTiles: {} as Record<string, string>,
        sessionFolder: null,
        finalStitchedImage: null
    });

    // --- PERSISTENCE (AUTO-SAVE) ---
    // --- PERSISTENCE (AUTO-SAVE) ---
    useEffect(() => {
        const saved = localStorage.getItem('lux_session_v4');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.step > 0) {
                    // Restore safe state only
                    setLuxScalerState(prev => ({
                        ...prev,
                        step: parsed.step,
                        gridCols: parsed.gridCols,
                        gridRows: parsed.gridRows,
                        targetRes: parsed.targetRes,
                        sessionFolder: parsed.sessionFolder,
                        croppedTiles: parsed.croppedTiles || {},
                        // Do NOT restore base64 images to prevent quota crash
                    }));
                    addLuxLog('💾 Sesión restaurada (Metadata). Re-sube la imagen si es necesario.');
                }
            } catch (e) {
                console.error("Failed to load session", e);
            }
        }
    }, []);

    useEffect(() => {
        if (luxScalerState.step > 0) {
            // SAFE SAVE: Exclude heavy Base64 data
            const { imageData, imagePreview, tiles, finalStitchedImage, ...safeState } = luxScalerState;
            // Also sanitize tiles - remove base64 data
            const safeTiles: any = {};
            Object.keys(luxScalerState.tiles).forEach(k => {
                const t = luxScalerState.tiles[k];
                safeTiles[k] = { ...t, data: null }; // Strip data
            });

            const payload = { ...safeState, tiles: safeTiles };

            try {
                localStorage.setItem('lux_session_v4', JSON.stringify(payload));
            } catch (e) {
                console.error("Quota Exceeded - disabling auto-save for this session", e);
            }
        }
    }, [luxScalerState]);

    const addLuxLog = (msg: string) => {
        setLuxScalerState(prev => ({ ...prev, logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${msg}`] }));
    };

    const getTileCoordinates = (row: number, col: number, rows: number, cols: number, totalW: number = 1000, totalH: number = 1000) => {
        // v4.1 PIXEL PERFECT LOGIC (Base + Remainder Distribution)
        // 1. Calculate Base Size and Remainder
        const baseW = Math.floor(totalW / cols);
        const remW = totalW % cols;
        const baseH = Math.floor(totalH / rows);
        const remH = totalH % rows;

        // 2. Calculate x0 (Sum of previous widths)
        // For columns 0 to col-1, how many had +1 pixel? (Those where c < remW)
        // Count of cols < col that allow +1 is: Math.min(col, remW)
        const x0 = (baseW * col) + Math.min(col, remW);

        // 3. Calculate Width of current tile
        // Current tile gets +1 if col < remW
        const w = (col < remW) ? baseW + 1 : baseW;
        const x1 = x0 + w;

        // 4. Calculate y0 (Same logic for rows)
        const y0 = (baseH * row) + Math.min(row, remH);

        // 5. Calculate Height of current tile
        const h = (row < remH) ? baseH + 1 : baseH;
        const y1 = y0 + h;

        const edges = [];
        if (row > 0) edges.push('ARRIBA');
        if (row < rows - 1) edges.push('ABAJO');
        if (col > 0) edges.push('IZQUIERDA');
        if (col < cols - 1) edges.push('DERECHA');

        return {
            x0, y0, x1, y1,
            xStartPct: ((x0 / totalW) * 100).toFixed(1),
            xEndPct: ((x1 / totalW) * 100).toFixed(1),
            yStartPct: ((y0 / totalH) * 100).toFixed(1),
            yEndPct: ((y1 / totalH) * 100).toFixed(1),
            edgeInfo: edges.join(', ') || 'ESQUINA'
        };
    };

    const calculateDynamicGrid = (w: number, h: number, scaleStr: string) => {
        // Use LuxScaler v4.0 Logic
        // Fix: Parse scale string ('x2') to number and calculate absolute target resolution (Max Dimension)
        const scale = parseFloat(scaleStr.replace('x', '')) || 2;
        const targetResPx = Math.max(w, h) * scale;

        const result = UpscalerTileCalculator.calculate(w, h, targetResPx);
        // Log optimized strategy
        console.log(`[LuxScaler v4.1] Strategy: ${result.tile_name} (${result.tile_info.w}x${result.tile_info.h}) -> Grid ${result.grid_h}x${result.grid_v}`);

        // Return grid AND tile dimensions for verification if needed
        return { cols: result.grid_h, rows: result.grid_v };
    };

    const handleReassemble = async () => {
        setLuxScalerState(prev => ({ ...prev, processing: true }));
        addLuxLog('🧩 Iniciando REENSAMBLAJE (Stitcher)...');

        const scale = parseFloat(luxScalerState.targetRes.replace('x', '')) || 2;
        const targetW = Math.round(luxScalerState.imgWidth * scale);
        const targetH = Math.round(luxScalerState.imgHeight * scale);

        const mainCanvas = document.createElement('canvas');
        mainCanvas.width = targetW;
        mainCanvas.height = targetH;
        const mainCtx = mainCanvas.getContext('2d');

        if (!mainCtx) {
            addLuxLog('❌ Error: No se pudo crear el contexto del canvas maestro.');
            setLuxScalerState(prev => ({ ...prev, processing: false }));
            return;
        }

        mainCtx.imageSmoothingEnabled = false;

        const tileKeys = Object.keys(luxScalerState.tiles);
        addLuxLog(`🧩 Recomponiendo ${tileKeys.length} segmentos...`);

        for (const key of tileKeys) {
            const tile = luxScalerState.tiles[key];
            if (tile.status !== 'done' || (!tile.data && !tile.debug?.outputUrl)) {
                addLuxLog(`⚠️ [${key}] Segmento incompleto. Saltando...`);
                continue;
            }

            const [row, col] = key.split('-').map(Number);

            // FIX: Usar getTileCoordinates() para slots pixel-perfect
            const dst = getTileCoordinates(row, col, luxScalerState.gridRows, luxScalerState.gridCols, targetW, targetH);
            const x = dst.x0;
            const y = dst.y0;
            const slotW = dst.x1 - dst.x0;
            const slotH = dst.y1 - dst.y0;

            try {
                const img = new Image();
                img.crossOrigin = "anonymous";
                const src = tile.debug?.outputUrl || `data:image/png;base64,${tile.data}`;

                await new Promise((res, rej) => {
                    img.onload = res;
                    img.onerror = rej;
                    img.src = src;
                });

                // CRITICAL FIX: Cover Crop usando naturalWidth/naturalHeight (no width/height que pueden ser 0)
                const iw = img.naturalWidth || img.width;
                const ih = img.naturalHeight || img.height;

                const slotRatio = slotW / slotH;
                const imgRatio = iw / ih;

                let srcX = 0, srcY = 0, srcW = iw, srcH = ih;

                if (imgRatio > slotRatio) {
                    // Imagen más ancha que slot → recortar lados
                    srcW = ih * slotRatio;
                    srcX = (iw - srcW) / 2;
                } else if (imgRatio < slotRatio) {
                    // Imagen más alta que slot → recortar arriba/abajo
                    srcH = iw / slotRatio;
                    srcY = (ih - srcH) / 2;
                }

                // Dibujar: recorte (srcX,srcY,srcW,srcH) del pliego → slot (x,y,slotW,slotH) del canvas
                mainCtx.drawImage(img, srcX, srcY, srcW, srcH, x, y, slotW, slotH);
                addLuxLog(`🧩 [${row},${col}] Pegado en ${x},${y} (${slotW}x${slotH}) | src: ${iw}x${ih} → crop: ${Math.round(srcW)}x${Math.round(srcH)}`);
            } catch (err) {
                addLuxLog(`❌ Error pegando segmento [${row},${col}]: ${err}`);
            }
        }

        addLuxLog(`📥 Generando archivo final (${targetW}x${targetH})...`);
        const finalBlob = await new Promise<Blob | null>(r => mainCanvas.toBlob(r, 'image/png'));

        if (finalBlob && luxScalerState.sessionFolder) {
            const path = `${luxScalerState.sessionFolder}/RESULTADO_MAESTRO.png`;
            addLuxLog('📤 Subiendo resultado maestro a Storage...');
            const { error: uploadError } = await supabase.storage.from('lux-storage').upload(path, finalBlob, { upsert: true });

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('lux-storage').getPublicUrl(path);
                addLuxLog('🔥 ¡REENSAMBLAJE COMPLETADO!');
                addLuxLog(`🔗 URL: ${publicUrl}`);
                setLuxScalerState(prev => ({ ...prev, finalStitchedImage: publicUrl, processing: false, step: 4 }));
            } else {
                addLuxLog(`âŒ Error subiendo maestro: ${uploadError.message}`);
                setLuxScalerState(prev => ({ ...prev, processing: false }));
            }
        } else {
            addLuxLog('âŒ No se pudo generar el Bloque Final.');
            setLuxScalerState(prev => ({ ...prev, processing: false }));
        }
    };
    const runLuxScaler = async () => {
        if (!luxScalerState.imageData) {
            alert('Por favor sube una imagen primero');
            return;
        }

        // Initialize processing without clearing previous steps (crops, logs)
        setLuxScalerState(prev => ({
            ...prev,
            processing: true,
            progress: 0,
            // Reset tiles status to processing only if not done (optional, or just keep them)
            // We want to keep done tiles if re-running partially? No, assume full run for now but keep crops.
            // Actually, we should keep 'tiles' object structure but reset their content if we are re-generating?
            // If we are in step 3, we just want to update status.
            // Let's reset 'tiles' data but keep keys if they exist, or just start fresh with tiles.
            // BETTER: Don't clear logs completely, maybe append separator?
            // Since we have a 'step' workflow, we assume 'croppedTiles' exists.
            tiles: prev.tiles, // Keep existing tiles (maybe partially done or empty)
        }));
        addLuxLog(`🚀 Iniciando upscale ${luxScalerState.targetRes} (${luxScalerState.gridCols}×${luxScalerState.gridRows})`);

        // Get session for Edge Function auth
        const supabase = getSupabaseClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        // DEBUG: Log session status
        console.log('[LuxScaler Debug] Session check:', {
            hasSession: !!session,
            user: session?.user?.email,
            error: sessionError
        });

        if (!session) {
            addLuxLog(`❌ Error: Sesión no encontrada. Por favor haz login.`);
            if (sessionError) {
                addLuxLog(`⚠️ Auth error: ${sessionError.message}`);
            }
            setLuxScalerState(prev => ({ ...prev, processing: false }));
            return;
        }

        addLuxLog(`🔑 Sesión OK: ${session.user?.email}`);

        const total = luxScalerState.gridCols * luxScalerState.gridRows;
        let completed = 0;

        for (let row = 0; row < luxScalerState.gridRows; row++) {
            for (let col = 0; col < luxScalerState.gridCols; col++) {
                const tileKey = `${row}-${col}`;
                setLuxScalerState(prev => ({
                    ...prev,
                    tiles: {
                        ...prev.tiles,
                        [tileKey]: {
                            ...prev.tiles[tileKey],
                            status: 'processing'
                        }
                    }
                }));
                addLuxLog(`â³ Generando tile (${row},${col})...`);

                try {
                    // Update: Pass real image dimensions for accurate pixel cropping
                    const coords = getTileCoordinates(row, col, luxScalerState.gridRows, luxScalerState.gridCols, luxScalerState.imgWidth, luxScalerState.imgHeight);
                    // Orchestration: Prompt is now generated in backend by Gemini Flash
                    const tileKey = `${row}-${col}`;
                    const storedTileUrl = luxScalerState.croppedTiles[tileKey];
                    const bodyPayload: any = {
                        imageMime: luxScalerState.imageMime,
                        // CRITICAL: Send the FULL original image as context reference
                        contextData: luxScalerState.imageData, // Imagen entera para referencia de estilo/continuidad
                        tileInfo: {
                            row, col,
                            gridCols: luxScalerState.gridCols,
                            gridRows: luxScalerState.gridRows,
                            x0: coords.x0,
                            y0: coords.y0,
                            x1: coords.x1,
                            y1: coords.y1,
                            xStartPct: coords.xStartPct,
                            xEndPct: coords.xEndPct,
                            yStartPct: coords.yStartPct,
                            yEndPct: coords.yEndPct,
                            edgeInfo: coords.edgeInfo
                        },
                        storageFolder: luxScalerState.sessionFolder
                    };

                    if (storedTileUrl && storedTileUrl.startsWith('http')) {
                        // El corte especÃ­fico se descargarÃ¡ desde Storage
                        bodyPayload.tileUrl = storedTileUrl;
                        addLuxLog(`📤 [${row},${col}] Enviando: corte URL + referencia entera`);
                    } else {
                        // FIX: Generate Crop On-The-Fly (Canvas)
                        // This prevents sending the full image as a tile, which caused the "zoomed out" generation issue.
                        addLuxLog(`âœ‚ï¸ [${row},${col}] Generando recorte en tiempo real...`);

                        try {
                            // Ensure we have raw base64 (strip header if present) for Context
                            const rawContext = luxScalerState.imageData.includes('base64,')
                                ? luxScalerState.imageData.split('base64,')[1]
                                : luxScalerState.imageData;
                            bodyPayload.contextData = rawContext;

                            // Calculate dimensions
                            const scale = parseFloat(luxScalerState.targetRes.replace('x', '')) || 2; // Original logic used scale? No, crop should be original resolution.
                            // The coords.x0 etc are based on ORIGINAL image dimensions or display?
                            // getTileCoordinates usually returns coords relative to original.
                            // We need to crop from the ORIGINAL image data.

                            // Helper function usage (defined outside or inline? Inline via Promise for now to keep context)
                            const cropBase64 = await new Promise<string>((resolve, reject) => {
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const tW = coords.x1 - coords.x0;
                                    const tH = coords.y1 - coords.y0;
                                    canvas.width = tW;
                                    canvas.height = tH;
                                    const ctx = canvas.getContext('2d');
                                    ctx?.drawImage(img, coords.x0, coords.y0, tW, tH, 0, 0, tW, tH);
                                    resolve(canvas.toDataURL('image/png').split(',')[1]); // Send RAW base64
                                };
                                img.onerror = reject;
                                img.src = luxScalerState.imageData;
                            });

                            bodyPayload.imageData = cropBase64;

                            // v4.0 STRICT REQUIREMENT: Context Image (Full Ref) MUST be < 19.5MP
                            // "admite cualquier tamaño... si excede la reduce a 19,5MP max"
                            try {
                                const MAX_MP = 19.5 * 1_000_000;
                                const contextImg = new Image();
                                await new Promise((res, rej) => {
                                    contextImg.onload = res;
                                    contextImg.onerror = rej;
                                    contextImg.src = luxScalerState.imageData!;
                                });

                                const contextMP = contextImg.width * contextImg.height;
                                if (contextMP > MAX_MP) {
                                    addLuxLog(`⚠️ Contexto excede 19.5MP (${(contextMP / 1000000).toFixed(1)}MP). Reduciendo...`);
                                    const scaleFactor = Math.sqrt(MAX_MP / contextMP);
                                    const newW = Math.floor(contextImg.width * scaleFactor);
                                    const newH = Math.floor(contextImg.height * scaleFactor);

                                    const resizeCanvas = document.createElement('canvas');
                                    resizeCanvas.width = newW;
                                    resizeCanvas.height = newH;
                                    const rCtx = resizeCanvas.getContext('2d');
                                    rCtx?.drawImage(contextImg, 0, 0, newW, newH);

                                    // Replace contextData with resized/compressed version
                                    const resizedB64 = resizeCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                                    bodyPayload.contextData = resizedB64;
                                    addLuxLog(`✅ Contexto reducido a ${newW}x${newH} (~${(newW * newH / 1000000).toFixed(1)}MP)`);
                                } else {
                                    // Ensure format is efficient JPEG 80% even if size is OK
                                    // If rawContext is PNG, we might want to convert to JPEG 0.8 to save bandwidth
                                    const rawContext = luxScalerState.imageData!.includes('base64,')
                                        ? luxScalerState.imageData!.split('base64,')[1]
                                        : luxScalerState.imageData!;
                                    // Optimization: If original is huge PNG < 19.5MP, still convert to JPEG? 
                                    // The requirement says "pasa siempre a jpeg 80%".
                                    // So we should probably do it always.

                                    if (luxScalerState.imageMime !== 'image/jpeg') {
                                        const cvs = document.createElement('canvas');
                                        cvs.width = contextImg.width;
                                        cvs.height = contextImg.height;
                                        cvs.getContext('2d')?.drawImage(contextImg, 0, 0);
                                        bodyPayload.contextData = cvs.toDataURL('image/jpeg', 0.8).split(',')[1];
                                        addLuxLog(`✅ Contexto convertido a JPEG 80%`);
                                    } else {
                                        bodyPayload.contextData = rawContext;
                                    }
                                }
                            } catch (resizeErr) {
                                console.error("Context Resize Error", resizeErr);
                                addLuxLog(`❌ Error optimizando contexto: ${resizeErr}`);
                                // Fallback to raw
                            }

                            // ðŸ§© NEIGHBORHOOD CONTEXT (Anti-Frankenstein Logic)
                            const prevRowKey = `${row - 1}-${col}`;
                            const prevColKey = `${row}-${col - 1}`;

                            if (luxScalerState.tiles[prevRowKey]?.data) {
                                bodyPayload.neighborTop = luxScalerState.tiles[prevRowKey].data;
                                addLuxLog(`ðŸ§© [${row},${col}] Inyectando vecino SUPERIOR.`);
                            }
                            if (luxScalerState.tiles[prevColKey]?.data) {
                                bodyPayload.neighborLeft = luxScalerState.tiles[prevColKey].data;
                                addLuxLog(`ðŸ§© [${row},${col}] Inyectando vecino IZQUIERDO.`);
                            }
                            addLuxLog(`âœ… [${row},${col}] Recorte generado y adjuntado.`);

                        } catch (cropErr) {
                            console.error("Crop Error", cropErr);
                            addLuxLog(`âŒ [${row},${col}] Error generando recorte: ${cropErr}`);
                            continue; // Skip this tile if crop fails
                        }
                    }

                    const { data: result, error: funcError } = await supabase.functions.invoke('luxscaler-tile', {
                        body: bodyPayload

                    });

                    if (funcError) {
                        let details = '';
                        try { details = await funcError.context?.json(); } catch { }
                        console.error("Invoke Error:", funcError, details);
                        throw new Error(`Edge Function Error: ${funcError.message} ${JSON.stringify(details)}`);
                    }
                    if (!result.success) {
                        throw new Error(result.error || 'Unknown error');
                    }
                    const tileData = result.tileData;

                    if (result.generatedPrompt) {
                        console.log(`[Tile ${row},${col} Orchestrated Prompt]`, result.generatedPrompt);
                    }

                    if (tileData) {
                        setLuxScalerState(prev => ({
                            ...prev,
                            tiles: {
                                ...prev.tiles,
                                [tileKey]: {
                                    status: 'done',
                                    data: tileData,
                                    debug: {
                                        generatedPrompt: result.generatedPrompt,
                                        inputUrl: bodyPayload.tileUrl,        // URL del recorte original (Input)
                                        outputUrl: result.storageUrl,         // URL de la generaciÃ³n (Output)
                                        timestamp: new Date().toISOString()
                                    }
                                }
                            }
                        }));
                        addLuxLog(`âœ… Celda (${row},${col}) completada`);
                    } else {
                        throw new Error('No image data in response');
                    }
                } catch (err: any) {
                    setLuxScalerState(prev => ({ ...prev, tiles: { ...prev.tiles, [tileKey]: { status: 'error', data: null } } }));
                    addLuxLog(`âŒ Tile (${row},${col}): ${err.message}`);
                }

                completed++;
                setLuxScalerState(prev => ({ ...prev, progress: (completed / total) * 100 }));

                // Rate limiting
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        addLuxLog('ðŸ GeneraciÃ³n completada!');
        setLuxScalerState(prev => ({ ...prev, processing: false }));
    };

    const performClientSideCrop = async () => {
        if (!luxScalerState.imageData) return;
        setLuxScalerState(prev => ({ ...prev, processing: true }));
        addLuxLog('âœ‚ï¸ Iniciando motor de recorte...');
        const supabase = getSupabaseClient();

        const img = new Image();
        img.src = luxScalerState.imageData;
        await new Promise((resolve) => { img.onload = resolve; });

        const cols = luxScalerState.gridCols;
        const rows = luxScalerState.gridRows;
        const tileW = Math.floor(img.width / cols);
        const tileH = Math.floor(img.height / rows);

        const newCroppedTiles: Record<string, string> = {};

        // INITIALIZE TILES FOR VISIBILITY
        const initialTiles: Record<string, any> = {};
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                initialTiles[`${r}-${c}`] = { status: 'waiting', debug: { status: 'pending_cut' } };
            }
        }


        addLuxLog(`âœ‚ï¸ Dimensiones: ${img.width}Ã—${img.height} â†’ Grid ${cols}Ã—${rows} (${tileW}Ã—${tileH}px/tile)`);

        const timestamp = Date.now();
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const canvas = document.createElement('canvas');
                canvas.width = tileW;
                canvas.height = tileH;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Draw slice
                    ctx.drawImage(img, col * tileW, row * tileH, tileW, tileH, 0, 0, tileW, tileH);

                    // Upload to Storage
                    const tileKey = `${row}-${col}`;
                    addLuxLog(`â˜ï¸ Subiendo Tile [${row},${col}]...`);

                    await new Promise<void>((resolveBlob) => {
                        canvas.toBlob(async (blob) => {
                            if (!blob) {
                                addLuxLog(`âŒ Error blob [${row},${col}]`);
                                resolveBlob();
                                return;
                            }

                            const fileName = `temp/lux_${timestamp}_${row}_${col}.jpg`;
                            const { data, error } = await supabase.storage
                                .from('lux-cache')
                                .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });

                            if (error) {
                                addLuxLog(`âŒ Upload error [${row},${col}]: ${error.message}`);
                            } else {
                                const { data: publicUrlData } = supabase.storage.from('lux-cache').getPublicUrl(fileName);
                                newCroppedTiles[tileKey] = publicUrlData.publicUrl;
                                addLuxLog(`âœ… Subido: ${fileName}`);
                            }
                            // v4.0: ENFORCE JPEG 80% COMPRESSION (<20MP input limit usually handled by grid but compression helps)
                            // v4.0: ENFORCE JPEG 80% COMPRESSION (<20MP input limit usually handled by grid but compression helps)
                            resolveBlob();
                        }, 'image/jpeg', 0.8);
                    });

                    // Artificial delay for UX
                    await new Promise(r => setTimeout(r, 50));
                }
            }
        }

        setLuxScalerState(prev => ({
            ...prev,
            croppedTiles: newCroppedTiles,
            step: 2,
            processing: false
        }));
        addLuxLog('âœ… Todos los tiles han sido cortados en memoria.');
        addLuxLog('ðŸ‘‰ Listo para enviar a Nano Banana Pro.');
    };

    const callAdminAction = async (action: string, payload: any = {}) => {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`${supabaseUrl}/functions/v1/admin-actions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, payload })
        });

        if (!response.ok) throw new Error(`Admin Action Failed: ${await response.text()}`);
        return await response.json();
    };

    // --- PRICING & TOKEN LOGIC (NUEVO) ---
    // VALUES FROM B_GuÃ­a TÃ©cnica API - Gemini & Vertex AI Image Generation.md
    const PRICING_TABLE = {
        'gemini-3-pro-image-preview': { input: 2.00, output: 12.00, image_out: 120.00, est_per_image: 0.136, desc: 'Nano Banana Pro (Gemini 3 Pro)' },
        'gemini-2.5-flash-image': { input: 0.50, output: 30.00, image_out: 30.00, est_per_image: 0.04, desc: 'Nano Banana (Gemini 2.5 Flash)' },
        'imagen-4.0-ultra-generate-001': { per_image: 0.060, desc: 'Imagen 4 Ultra' },
        'imagen-4.0-generate-001': { per_image: 0.040, desc: 'Imagen 4 Standard' },
        'imagen-4.0-fast-generate-001': { per_image: 0.020, desc: 'Imagen 4 Fast' },
        'default': { input: 1.0, output: 3.0, desc: 'Generic Model' }
    };

    const calculateCost = (v: any) => {
        if (v.cost_cogs && v.cost_cogs > 0) return v.cost_cogs;

        const modelKey = v.prompt_payload?.model || 'default';
        const pricing = Object.entries(PRICING_TABLE).find(([k]) => modelKey.includes(k))?.[1] || PRICING_TABLE.default;

        // Fallback: Calculate from tokens if missing
        if (v.usage_meta) {
            // Per Image Pricing (Imagen Models)
            if ((pricing as any).per_image) return (pricing as any).per_image;

            // Token Pricing (Gemini Models)
            const inCost = (v.usage_meta.promptTokenCount / 1_000_000) * (pricing as any).input;

            // Note: Gemini Image Generation is billed as OUTPUT TOKENS, but with a high multiplier for images.
            // Price is $120/1M output tokens for images.
            const outRate = (pricing as any).image_out || (pricing as any).output;
            const outCost = (v.usage_meta.candidatesTokenCount / 1_000_000) * outRate;

            return inCost + outCost;
        }

        // Final Fallback: Estimated per image (if no telemetry)
        if ((pricing as any).per_image) return (pricing as any).per_image;
        if ((pricing as any).est_per_image) return (pricing as any).est_per_image;

        return 0; // No telemetry = $0
    };

    // LAB FUNCTION
    const runBenchStrategy = async (strategy: string) => {
        setBenchLoading(prev => ({ ...prev, [strategy]: true }));
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        try {
            const res = await fetch(`${supabaseUrl}/functions/v1/admin-bench-lab`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    strategy,
                    imageUrl: benchBaseImage,
                    prompt: benchPrompt
                })
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            if (data.success && data.url) {
                setBenchResults(prev => ({ ...prev, [strategy]: data.url }));
                setBenchActiveResult(data.url);
            }
        } catch (e: any) {
            alert(`Error en estrategia ${strategy}: ${e.message}`);
        } finally {
            setBenchLoading(prev => ({ ...prev, [strategy]: false }));
        }
    };

    const fetchData = async () => {
        setLoading(true);
        const supabase = getSupabaseClient();

        try {
            // FETCH STATS VIA EDGE FUNCTION (Bypasses RLS)
            const statsRes = await callAdminAction('get_dashboard_stats');
            if (statsRes.stats) setStats(statsRes.stats);

            if (currentTab === 'REGISTRO_DATOS') {
                // FETCH GENERATIONS LOG VIA EDGE FUNCTION (Bypasses RLS)
                const genRes = await callAdminAction('get_generations_log', { page, limit: ITEMS_PER_PAGE });
                setGenerationsList(genRes.data || []);
                if (genRes.count !== null) setTotalRecords(genRes.count);

            } else if (currentTab === 'LISTA_ESPERA') {
                const { data: waitData } = await supabase.from('beta_waitlist')
                    .select('*').eq('status', 'pending').order('created_at', { ascending: false });
                setWaitlist(waitData || []);
            } else if (currentTab === 'CONFIG_VIVA') {
                // Fetch Config
                const { data: styles } = await supabase.from('lux_productions').select('*').order('category_id');
                const { data: sys } = await supabase.from('system_config').select('*');
                setStylesConfig(styles || []);
                setSystemConfig(sys || []);
            } else if (currentTab === 'ALMACENAMIENTO') {
                fetchStorageFiles();
            }
        } catch (e: any) {
            console.error("Admin Fetch Error:", e);
        }

        setLoading(false);
    };

    // --- CONFIG HANDLERS ---
    const handleSaveConfig = async () => {
        setIsSavingConfig(true);
        const supabase = getSupabaseClient();

        try {
            if (stylesConfig.length > 0) {
                const { error: styleErr } = await supabase.from('lux_productions').upsert(stylesConfig);
                if (styleErr) throw styleErr;
            }
            if (systemConfig.length > 0) {
                const { error: sysErr } = await supabase.from('system_config').upsert(systemConfig);
                if (sysErr) throw sysErr;
            }
            alert("ConfiguraciÃ³n Guardada.");
        } catch (e: any) {
            alert("Error guardando config: " + e.message);
        } finally {
            setIsSavingConfig(false);
        }
    };

    // --- STORAGE LOGIC ---
    const fetchStorageFiles = async () => {
        setIsStorageLoading(true);
        setSelectedFiles(new Set());
        const supabase = getSupabaseClient();
        const pathString = currentPath.length > 0 ? currentPath.join('/') : '';

        const { data, error } = await supabase.storage.from(storageBucket).list(pathString, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'desc' },
        });
        if (error) console.error("Error fetching files:", error);
        else setFiles(data || []);
        setIsStorageLoading(false);
    };

    useEffect(() => { if (currentTab === 'ALMACENAMIENTO') fetchStorageFiles(); }, [currentPath, storageBucket, currentTab]);

    const handleNavigate = (folderName: string) => setCurrentPath([...currentPath, folderName]);
    const handleNavigateBreadcrumb = (index: number) => setCurrentPath(index === -1 ? [] : currentPath.slice(0, index + 1));
    const handleNavigateUp = () => { if (currentPath.length > 0) { const p = [...currentPath]; p.pop(); setCurrentPath(p); } };
    const toggleFileSelection = (name: string) => { const s = new Set(selectedFiles); s.has(name) ? s.delete(name) : s.add(name); setSelectedFiles(s); };

    // NEW: Create Folder
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        const pathPrefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
        const folderPath = `${pathPrefix}${newFolderName.trim()}/.keep`;

        try {
            const { error } = await supabase.storage.from(storageBucket).upload(folderPath, new Blob([''], { type: 'text/plain' }), { upsert: true });
            if (error) throw error;
            setNewFolderName('');
            setIsCreatingFolder(false);
            fetchStorageFiles();
        } catch (e: any) {
            alert('Error creando carpeta: ' + e.message);
        }
    };

    // NEW: Upload Files with Auto-Optimization
    const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        setIsUploading(true);
        setUploadProgress({ current: 0, total: fileList.length });

        const pathPrefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            try {
                // Optimization DISABLED to preserve quality and original formats
                let blobToUpload: Blob = file;
                let fileName = file.name;
                /*
                                if (file.type.startsWith('image/')) {
                                    // Convert to WebP with 80% quality
                                    const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
                                        const img = new Image();
                                        img.onload = () => {
                                            const canvas = document.createElement('canvas');
                                            canvas.width = img.width;
                                            canvas.height = img.height;
                                            const ctx = canvas.getContext('2d');
                                            if (!ctx) { reject(new Error('No ctx')); return; }
                                            ctx.drawImage(img, 0, 0);
                                            canvas.toBlob((b) => {
                                                if (b) resolve(b);
                                                else reject(new Error('WebP error'));
                                            }, 'image/webp', 0.8);
                                        };
                                        img.onerror = reject;
                                        img.src = URL.createObjectURL(file);
                                    });
                                    blobToUpload = optimizedBlob;
                                    // Change extension to .webp
                                    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                                    fileName = `${nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_')}.webp`;
                                }
                */

                const fullPath = `${pathPrefix}${fileName}`;
                const { error } = await supabase.storage.from(storageBucket).upload(fullPath, blobToUpload, {
                    upsert: true,
                    contentType: file.type.startsWith('image/') ? 'image/webp' : file.type,
                    cacheControl: '3600'
                });

                if (error) throw error;
                setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
            } catch (err: any) {
                console.error(`Error uploading ${file.name}:`, err);
            }
        }

        setIsUploading(false);
        fetchStorageFiles();
        // Reset input
        e.target.value = '';
    };

    const handleDeleteFiles = async () => {
        if (!selectedFiles.size) return;

        const isTrash = currentPath[0] === '.trash';
        const actionText = isTrash ? "ELIMINAR PERMANENTEMENTE" : "Mover a Papelera";

        if (!confirm(`${actionText} ${selectedFiles.size} archivos?`)) return;
        setIsStorageLoading(true);

        const supabase = getSupabaseClient();
        const pathPrefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';

        try {
            for (const fileName of Array.from(selectedFiles)) {
                const srcPath = `${pathPrefix}${fileName}`;

                if (isTrash) {
                    // Permanent Delete
                    const { error } = await supabase.storage.from(storageBucket).remove([srcPath]);
                    if (error) throw error;
                } else {
                    // Soft Delete (Move to .trash)
                    // Construct dest path: .trash/original_path/filename
                    // To avoid deep nesting if repeated, let's just prepend .trash/ to the current relative path hierarchy
                    const destPath = `.trash/${srcPath}`;
                    const { error } = await supabase.storage.from(storageBucket).move(srcPath, destPath);
                    if (error) {
                        // Fallback: If move fails (e.g. across buckets which isn't the case here, or other error), try copy+delete? 
                        // Move is native to Supabase Storage v2.
                        throw error;
                    }
                }
            }
            await fetchStorageFiles();
            setSelectedFiles(new Set()); // Clear selection
        } catch (e: any) {
            console.error("Delete error", e);
            alert(`Error (${actionText}): ` + e.message);
        } finally {
            setIsStorageLoading(false);
        }
    };

    const handleRenameFile = async (oldName: string) => {
        if (!newName.trim() || newName === oldName) {
            setRenamingFile(null);
            return;
        }

        setIsStorageLoading(true);
        const pathPrefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
        const srcPath = `${pathPrefix}${oldName}`;
        const destPath = `${pathPrefix}${newName.trim()}`;

        try {
            const { error } = await supabase.storage.from(storageBucket).move(srcPath, destPath);
            if (error) throw error;
            setRenamingFile(null);
            setNewName('');
            fetchStorageFiles();
        } catch (e: any) {
            alert('Error renombrando: ' + e.message);
        } finally {
            setIsStorageLoading(false);
        }
    };

    const handleMoveFile = async (fileName: string, targetFolderName: string) => {
        setIsStorageLoading(true);
        const pathPrefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
        const srcPath = `${pathPrefix}${fileName}`;
        // Destination: current folder + targetFolderName + fileName
        const destPath = `${pathPrefix}${targetFolderName}/${fileName}`;

        try {
            const { error } = await supabase.storage.from(storageBucket).move(srcPath, destPath);
            if (error) throw error;
            fetchStorageFiles();
        } catch (e: any) {
            alert('Error moviendo archivo: ' + e.message);
        } finally {
            setIsStorageLoading(false);
        }
    };

    const handleSendToLab = (fileUrl: string) => {
        setBenchBaseImage(fileUrl);
        setCurrentTab('LABORATORIO');
    };

    const handleLoadAsSession = (folderName: string) => {
        // Attempt to load session even if name isn't a perfect UUID (rescue mode)
        if (folderName.length > 10) {
            handleOpenSession(folderName);
            setCurrentTab('REGISTRO_DATOS');
        } else {
            alert("Nombre de carpeta demasiado corto para ser una sesiÃ³n.");
        }
    };

    // --- GALLERY OPTIMIZER ---
    const handleGalleryOptimize = async (fileName: string, fileUrl: string, pathPrefixOverride?: string) => {
        setOptimizingItems(prev => new Set(prev).add(fileName));
        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();

            const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { reject(new Error("No ctx")); return; }
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((b) => {
                        if (b) resolve(b);
                        else reject(new Error("WebP error"));
                    }, 'image/webp', 0.8);
                };
                img.onerror = (e) => reject(e);
                img.src = createObjectURL(blob);
            });

            // Clean name + .webp
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
            const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
            const targetName = `${cleanName}.webp`;

            // Use override if provided (for recursive calls), otherwise global state
            const pathPrefix = pathPrefixOverride !== undefined
                ? pathPrefixOverride
                : (currentPath.length > 0 ? currentPath.join('/') + '/' : '');

            const fullPath = `${pathPrefix}${targetName}`;

            const supabase = getSupabaseClient();
            const { error } = await supabase.storage.from(storageBucket).upload(fullPath, optimizedBlob, {
                upsert: true,
                contentType: 'image/webp',
                cacheControl: '3600'
            });

            if (error) throw error;

            // DELETE ORIGINAL if different name (Destructive Replace)
            if (fileName !== targetName) {
                const deletePath = `${pathPrefix}${fileName}`;
                await supabase.storage.from(storageBucket).remove([deletePath]);
            }

            // Force refresh to show changes (only if not in recursive batch, or let the caller handle it)
            // For single file optimize, we want refresh. For batch, the caller controls it.
            // But since this function is 'smart', we can just let it try.
            // If called rapidly in batch, this might be redundant but safe.
            // @ts-ignore
            if (typeof fetchStorageFiles === 'function') fetchStorageFiles();

        } catch (e: any) {
            console.error("Optimize error", e);
            // Don't alert in batch loops to avoid spamming modal, log instead.
            // We can check if pathPrefixOverride is set to guess if it's batch.
            if (!pathPrefixOverride) alert(`Error optimizing ${fileName}: ${e.message}`);
        } finally {
            setOptimizingItems(prev => {
                const next = new Set(prev);
                next.delete(fileName);
                return next;
            });
        }
    };

    const handleCopySelection = async () => {
        if (!selectedFiles.size) return;

        const pathPrefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
        const urls: string[] = [];

        selectedFiles.forEach(name => {
            const isFolder = files.find(f => f.name === name && !f.id);
            if (!isFolder) {
                const url = `https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/${storageBucket}/${pathPrefix}${name}`;
                urls.push(url);
            }
        });

        if (urls.length > 0) {
            try {
                await navigator.clipboard.writeText(urls.join('\n'));
                alert(`ðŸ“‹ ${urls.length} URLs copiadas al portapapeles.`);
            } catch (err) {
                console.error('Failed to copy', err);
                alert('Error copiando al portapapeles');
            }
        }
    };


    const handleOptimizeSelection = async () => {
        if (!selectedFiles.size) return;
        if (!confirm(`Optimizar ${selectedFiles.size} elementos? Si seleccionaste CARPETAS, se optimizarÃ¡ todo su contenido (Recursivo).`)) return;

        setIsOptimizing(true);
        // Reset progress, but we don't know total yet if folders are involved. 
        // We'll increment total dynamically or just show "Processing..."
        setOptimizationProgress({ current: 0, total: selectedFiles.size }); // Initial guess

        const currentPathStr = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
        const supabase = getSupabaseClient();

        // Helper to process a prefix (folder)
        const processFolder = async (prefix: string) => {
            const { data: folderFiles, error } = await supabase.storage.from(storageBucket).list(prefix, { limit: 100 });
            if (error || !folderFiles) return;

            for (const f of folderFiles) {
                if (!f.id) {
                    // It's a subfolder, recurse
                    await processFolder(`${prefix}${f.name}/`);
                } else {
                    // It's a file
                    if (f.name.toLowerCase().endsWith('.webp')) continue; // Skip already optimized in recursive mode to save time, or allow re-optimize? user said "optimize all". Let's skip valid WebPs to be faster, unless specifically requested.

                    const url = `https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/${storageBucket}/${prefix}${f.name}`;
                    // Update total valid count for progress UI (approximate since we discover as we go)
                    setOptimizationProgress(prev => ({ ...prev, total: prev.total + 1 }));

                    await handleGalleryOptimize(f.name, url, prefix); // Need to pass prefix to handleOptimize to construct correct delete path!

                    setOptimizationProgress(prev => ({ ...prev, current: prev.current + 1 }));
                }
            }
        };

        try {
            for (const name of Array.from(selectedFiles)) {
                const file = files.find(f => f.name === name);
                if (!file) continue;

                if (!file.id) {
                    // IS FOLDER
                    await processFolder(`${currentPathStr}${name}/`);
                } else {
                    // IS FILE
                    const url = `https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/${storageBucket}/${currentPathStr}${name}`;
                    await handleGalleryOptimize(name, url); // impl uses global currentPath? Need to check handleGalleryOptimize
                    setOptimizationProgress(prev => ({ ...prev, current: prev.current + 1 }));
                }
            }
        } catch (err) {
            console.error("Batch optimize error", err);
        }

        setIsOptimizing(false);
        // @ts-ignore
        if (typeof fetchStorageFiles === 'function') fetchStorageFiles();
    };

    const handleOptimizeFolder = async () => {
        const fileList = files.filter(f => f.id);
        if (!fileList.length) return alert("Carpeta vacÃ­a");
        if (!confirm(`OPTIMIZAR CARPETA (${fileList.length} archivos)? Se reemplazarÃ¡n los originales.`)) return;

        setIsOptimizing(true);
        const total = fileList.length;
        let current = 0;
        setOptimizationProgress({ current, total });

        const pathPrefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
        for (const file of fileList) {
            const url = `https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/${storageBucket}/${pathPrefix}${file.name}`;
            await handleGalleryOptimize(file.name, url);
            current++;
            setOptimizationProgress({ current, total });
        }
        setIsOptimizing(false);
        // @ts-ignore
        if (typeof fetchStorageFiles === 'function') fetchStorageFiles();
    };

    // Helper for URL.createObjectURL compatibility
    const createObjectURL = (blob: Blob) => (window.URL || window.webkitURL).createObjectURL(blob);

    // --- GENERIC HANDLERS ---
    const handleOpenSession = async (sessionId: string) => {
        setIsLoadingDetails(true);
        setSelectedGenId(sessionId);
        setActiveGenDetails(null);

        try {
            // FETCH SESSION DETAILS VIA EDGE FUNCTION (Bypasses RLS)
            const res = await callAdminAction('get_session_details', { sessionId });
            const data = res.data;

            if (data) {
                setActiveGenDetails(data);
                const winner = data.variations.find((v: any) => v.rating === 5);
                setSelectedVariation(winner || data.variations[0]);
            } else {
                alert("SesiÃ³n no encontrada en Base de Datos. (Puede existir solo en archivos).");
            }
        } catch (e: any) {
            console.error("Session load error:", e);
            alert("Error cargando sesiÃ³n (Ver consola).");
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleDeleteGeneration = async (genId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("ELIMINAR SESIÃ“N COMPLETA?")) return;

        try {
            setLoading(true);
            await deleteGeneration(genId);
            setGenerationsList(prev => prev.filter(g => g.id !== genId));
        } catch (e: any) {
            try {
                await callAdminAction('delete_generation_force', { generationId: genId });
                setGenerationsList(prev => prev.filter(g => g.id !== genId));
            } catch (err2: any) {
                alert("Error fatal borrando: " + err2.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(0); fetchData(); }, [currentTab]);
    useEffect(() => { if (currentTab === 'REGISTRO_DATOS') fetchData(); }, [page]);

    const handleGenerateMaster = async (variationId: string, settings: any) => {
        try {
            setLuxScalerState(prev => ({ ...prev, isMasterProcessing: true }));
            const result = await generateMaster(variationId, settings);

            // Re-fetch details to show the new master in the list if applicable
            if (activeGenDetails) {
                const { data: updatedDetail } = await supabase
                    .from('generations')
                    .select('*, variations(*)')
                    .eq('id', activeGenDetails.id)
                    .single();
                if (updatedDetail) {
                    setActiveGenDetails(updatedDetail);
                    // Automatically select the new variation if it was created
                    const newVar = updatedDetail.variations.find((v: any) => v.id === result.id);
                    if (newVar) setSelectedVariation(newVar);
                }
            }

            alert("MASTER CREADO CON Ã‰XITO. Revisalo en tu librerÃ­a.");
        } catch (e: any) {
            console.error("Master Error:", e);
            alert("Error creando Master: " + e.message);
        } finally {
            setLuxScalerState(prev => ({ ...prev, isMasterProcessing: false }));
        }
    };

    // RENDER HELPERS
    const renderTelemetryComparison = (variation: any, gen: any) => {
        const inputMixer = gen.semantic_analysis?.telemetry?.input_settings?.mixer || {};
        const payload = variation.prompt_payload || {};
        const cost = calculateCost(variation);

        return (
            <div className="grid grid-cols-2 gap-4 h-full overflow-hidden">
                {/* LEFT: INPUT */}
                <div className="bg-black/30 p-4 rounded border border-white/5 overflow-y-auto">
                    <h4 className="text-[10px] font-bold text-lumen-gold uppercase mb-2 border-b border-white/10 pb-1 flex justify-between">
                        <span>Input & Coste</span>
                        <span className="text-green-400 flex items-center gap-1"><DollarSign className="w-3 h-3" /> {cost.toFixed(4)}</span>
                    </h4>
                    <div className="space-y-3 text-[10px] font-mono text-gray-400">
                        <div>
                            <span className="block text-gray-600 mb-1">User Prompt:</span>
                            <span className="text-white bg-white/5 p-1 rounded block">{gen.semantic_analysis?.telemetry?.input_settings?.userPrompt || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="block text-gray-600 mb-1">Archetype:</span>
                            <span className="text-lumen-gold">{variation.style_id}</span>
                        </div>
                        <div>
                            <span className="block text-gray-600 mb-1">Token Usage:</span>
                            <div className="bg-white/5 p-2 rounded text-[9px] font-mono text-gray-300">
                                In: {variation.usage_meta?.promptTokenCount || 0} <br />
                                Out: {variation.usage_meta?.candidatesTokenCount || 0}
                            </div>
                        </div>
                        <div>
                            <span className="block text-gray-600 mb-1">Mixer Settings:</span>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="bg-white/5 p-1 rounded text-center border border-white/5"><ScanLine className="w-3 h-3 inline mb-1" /><br />Photo: {inputMixer.photoScaler}</div>
                                <div className="bg-white/5 p-1 rounded text-center border border-white/5"><Palette className="w-3 h-3 inline mb-1" /><br />Style: {inputMixer.styleScaler}</div>
                                <div className="bg-white/5 p-1 rounded text-center border border-white/5"><Settings className="w-3 h-3 inline mb-1" /><br />Light: {inputMixer.lightScaler}</div>
                                <div className="bg-white/5 p-1 rounded text-center border border-white/5"><Maximize className="w-3 h-3 inline mb-1" /><br />Upscale: {inputMixer.upScaler}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: OUTPUT PROMPT */}
                <div className="bg-black/30 p-4 rounded border border-white/5 overflow-y-auto relative">
                    <h4 className="text-[10px] font-bold text-prismatic-blue uppercase mb-2 border-b border-white/10 pb-1">Output Prompt (Lo que vio Gemini)</h4>
                    <pre className="text-[9px] text-gray-300 whitespace-pre-wrap font-mono leading-relaxed h-[300px] overflow-y-auto custom-scrollbar p-2 bg-black/20 rounded border border-white/5">
                        {payload.prompt || payload.prompt_used || 'Prompt data missing'}
                    </pre>
                    <button
                        onClick={() => navigator.clipboard.writeText(payload.prompt || '')}
                        className="absolute top-2 right-2 p-1 bg-white/10 rounded hover:bg-white/20"
                        title="Copiar Prompt"
                    >
                        <Copy className="w-3 h-3 text-white" />
                    </button>
                </div>
            </div>
        )
    };


    // --- RENDER ---

    // NEW LOGOUT HANDLER
    const handleLogout = async () => {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        if (onBack) onBack();
    };

    // Helper to get user email (simple heuristic or use auth hook if available upstream)
    const [userEmail, setUserEmail] = useState<string>('admin@luxscaler.com');

    useEffect(() => {
        const loadUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) setUserEmail(session.user.email);
        };
        loadUser();
    }, []);

    // Navigation Interceptor
    const handleTabNavigation = (tab: TabView) => {
        if (tab === 'LUXCANVAS') {
            navigate('/admin/canvas');
            return;
        }
        setCurrentTab(tab);
    };

    return (
        <AdminLayout
            currentTab={currentTab}
            onTabChange={handleTabNavigation}
            userEmail={userEmail}
            onLogout={handleLogout}
            standAloneMode={standAloneMode}
        >
            <ImageInspectorModal
                isOpen={isInspectorOpen}
                onClose={() => setIsInspectorOpen(false)}
                processedImage={getDisplayUrl(selectedVariation?.image_path || '')}
                originalImage={activeGenDetails?.original_image_path}
                title="Admin Deep Inspection"
                variation={selectedVariation}
                generation={activeGenDetails}
                onGenerateMaster={handleGenerateMaster}
                isProcessing={luxScalerState.isMasterProcessing}
            />

            <div className="flex-1 overflow-hidden flex flex-col">


                {/* --- TAB: RESUMEN --- */}
                {currentTab === 'RESUMEN' && !selectedGenId && (
                    <div className="animate-[fadeIn_0.3s]">
                        {/* STATS ROW */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[
                                { label: t('dashboard.total_users'), val: stats.users, color: 'text-white' },
                                { label: t('dashboard.total_cost'), val: `$${stats.total_cost.toFixed(2)}`, color: 'text-green-400' },
                                { label: t('dashboard.generated_sessions'), val: stats.generations, color: 'text-blue-400' },
                                { label: t('dashboard.unique_variations'), val: stats.variations, color: 'text-lumen-gold' },
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-[#0A0A0F] border border-white/10 p-5 rounded-sm shadow-lg">
                                    <h3 className="text-[9px] uppercase text-gray-500 font-bold mb-2 tracking-widest">{stat.label}</h3>
                                    <p className={`text-3xl font-mono font-bold ${stat.color}`}>{stat.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- TAB: USUARIOS (Includes Marketing) --- */}
                {currentTab === 'USUARIOS' && <AdminUserManagement />}

                {/* --- TAB: INFRAESTRUCTURA --- */}
                {currentTab === 'INFRAESTRUCTURA' && <AdminInfrastructure />}

                {/* --- TAB: STRIPE --- */}
                {currentTab === 'STRIPE' && <AdminStripe />}

                {/* --- TAB: GOD_MODE --- */}
                {currentTab === 'LUXCANVAS' && (
                    <div className="h-full w-full relative overflow-hidden flex flex-col">
                        <button
                            onClick={() => setCurrentTab('RESUMEN')}
                            className="absolute top-4 left-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <AdminLuxCanvas />
                    </div>
                )}
                {currentTab === 'GOD_MODE' && <AdminGodMode />}

                {/* --- TAB: LISTA_ESPERA REMOVED (Moved to AdminUserManagement) --- */}

                {/* --- TAB: CONFIG_VIVA --- */}
                {currentTab === 'CONFIG_VIVA' && (
                    <div className="flex-1 overflow-y-auto bg-[#0A0A0F] border border-white/10 rounded-sm p-6 animate-[fadeIn_0.3s]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* ESTILOS */}
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2"><Palette className="w-4 h-4" /> LibrerÃ­a de Estilos (Maestros)</h3>
                                {stylesConfig.length === 0 && <p className="text-gray-500 text-xs italic">No hay estilos definidos en DB (usando hardcoded en Edge). Inserta filas en `lux_productions` para editar aquÃ­.</p>}
                                <div className="space-y-4">
                                    {stylesConfig.map((style, idx) => (
                                        <div key={style.id} className="bg-black/40 border border-white/10 p-4 rounded group">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-xs font-bold text-lumen-gold">{style.id}</span>
                                                <span className="text-[10px] text-gray-500">{style.category_id}</span>
                                            </div>
                                            <textarea
                                                className="w-full bg-black/50 border border-white/10 rounded p-2 text-[10px] text-gray-300 font-mono focus:border-lumen-gold focus:outline-none min-h-[80px]"
                                                value={style.prompt_instruction}
                                                onChange={(e) => {
                                                    const newStyles = [...stylesConfig];
                                                    newStyles[idx].prompt_instruction = e.target.value;
                                                    setStylesConfig(newStyles);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CONSTANTES */}
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2"><Settings className="w-4 h-4" /> Constantes del Sistema</h3>
                                <div className="space-y-2">
                                    {systemConfig.map((conf, idx) => (
                                        <div key={conf.key} className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/10">
                                            <label className="text-[10px] font-mono text-gray-400 w-1/3 truncate" title={conf.description}>{conf.key}</label>
                                            <input
                                                type="text"
                                                className="flex-1 bg-transparent border-b border-white/20 text-white text-xs py-1 focus:border-lumen-gold focus:outline-none"
                                                value={conf.value}
                                                onChange={(e) => {
                                                    const newSys = [...systemConfig];
                                                    newSys[idx].value = e.target.value;
                                                    setSystemConfig(newSys);
                                                }}
                                            />
                                        </div>
                                    ))}
                                    {systemConfig.length === 0 && <p className="text-gray-500 text-xs italic">Sin variables globales.</p>}
                                </div>

                                {/* DEV SIMULATOR */}
                                <div className="mt-8 border-t border-white/10 pt-6">
                                    <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-lumen-gold" /> Simulador de Plataforma (Dev)
                                    </h3>
                                    <div className="bg-lumen-gold/5 border border-lumen-gold/20 p-4 rounded-sm">
                                        <p className="text-[10px] text-lumen-gold mb-3 font-mono">
                                            ⚠️ MODO ESPEJO: Visualiza la interfaz móvil en este navegador.
                                            Úsalo para diseñar sin desplegar.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    localStorage.setItem('LUX_DEV_PLATFORM_OVERRIDE', 'native');
                                                    window.dispatchEvent(new Event('lux-platform-change'));
                                                }}
                                                className="px-3 py-2 bg-lumen-gold text-black text-xs font-bold rounded uppercase hover:bg-white transition-colors"
                                            >
                                                Simular App Móvil
                                            </button>
                                            <button
                                                onClick={() => {
                                                    localStorage.removeItem('LUX_DEV_PLATFORM_OVERRIDE');
                                                    window.dispatchEvent(new Event('lux-platform-change'));
                                                }}
                                                className="px-3 py-2 border border-white/10 text-gray-400 text-xs font-bold rounded uppercase hover:bg-white/10 transition-colors"
                                            >
                                                Reset (Web Admin)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRICING TABLE (READ-ONLY FOR VERIFICATION) */}
                        <div className="mt-8 border-t border-white/10 pt-6">
                            <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-400" /> Tabla de Costes (Referencia)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(PRICING_TABLE).map(([key, price]: any) => (
                                    <div key={key} className="bg-black/40 border border-white/10 p-3 rounded">
                                        <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
                                            <span className="text-[10px] font-bold text-lumen-gold uppercase">{key}</span>
                                            <span className="text-[9px] text-gray-400">{price.desc}</span>
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-300 space-y-1">
                                            {price.input && <div>Input: <span className="text-white">${price.input}</span> / 1M tok</div>}
                                            {price.output && <div>Output: <span className="text-white">${price.output}</span> / 1M tok</div>}
                                            {price.per_image && <div>Per Image: <span className="text-white">${price.per_image}</span></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: REGISTRO_DATOS (Enhanced) --- */}
                {currentTab === 'REGISTRO_DATOS' && !selectedGenId && (
                    <div className="flex-1 flex flex-col bg-[#0A0A0F] border border-white/10 rounded-sm overflow-hidden animate-[fadeIn_0.3s]">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase flex items-center gap-2">
                                <Database className="w-4 h-4 text-prismatic-blue" /> Registro de Sesiones
                            </h3>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] text-gray-500 font-mono hidden md:inline">
                                    Total: {totalRecords} | PÃ¡g {page + 1} de {Math.ceil(totalRecords / ITEMS_PER_PAGE) || 1}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading} className="p-1.5 bg-black border border-white/10 rounded hover:bg-white/10 text-white"><ChevronLeft className="w-4 h-4" /></button>
                                    <button onClick={() => setPage(p => (p + 1) * ITEMS_PER_PAGE < totalRecords ? p + 1 : p)} disabled={(page + 1) * ITEMS_PER_PAGE >= totalRecords || loading} className="p-1.5 bg-black border border-white/10 rounded hover:bg-white/10 text-white"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left text-[10px] md:text-xs font-mono border-collapse">
                                <thead className="bg-white/5 text-gray-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 border-b border-white/10">ID</th>
                                        <th className="p-3 border-b border-white/10">Preview</th>
                                        <th className="p-3 border-b border-white/10">User</th>
                                        <th className="p-3 border-b border-white/10">Vars</th>
                                        <th className="p-3 border-b border-white/10">Cost (Est)</th>
                                        <th className="p-3 border-b border-white/10">AcciÃ³n</th>
                                        <th className="p-3 border-b border-white/10 text-right">Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {generationsList.map(g => {
                                        const sessionCost = g.variations?.reduce((acc: number, v: any) => acc + calculateCost(v), 0) || 0;
                                        return (
                                            <tr key={g.id} onClick={() => handleOpenSession(g.id)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                                <td className="p-3 text-lumen-gold font-bold font-mono">{g.id.substring(0, 8)}</td>
                                                <td className="p-3"><img src={getThumbnailUrl(g.original_image_thumbnail || g.original_image_path)} className="w-8 h-8 object-cover rounded-sm border border-white/10" loading="lazy" /></td>
                                                <td className="p-3 text-gray-400 font-mono">{g.user_id.substring(0, 8)}...</td>
                                                <td className="p-3"><span className="bg-gray-800 px-2 py-0.5 rounded text-[9px]">{g.variations.length}</span></td>
                                                <td className="p-3 text-green-400">${sessionCost.toFixed(4)}</td>
                                                <td className="p-3"><ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" /></td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        onClick={(e) => handleDeleteGeneration(g.id, e)}
                                                        className="p-1.5 hover:bg-crimson-glow hover:text-white text-gray-600 rounded transition-all"
                                                        title="Borrar SesiÃ³n Completa"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- DETAIL VIEW (TELEMETRY) --- */}
                {selectedGenId && activeGenDetails && (
                    <div className="flex-1 flex flex-col h-full animate-[fadeIn_0.2s]">
                        <div className="flex items-center justify-between mb-4 bg-[#111116] p-4 border border-white/10 rounded-sm">
                            <div className="flex items-center gap-4">
                                <button onClick={() => { setSelectedGenId(null); setSelectedVariation(null); }} className="text-xs uppercase font-bold text-gray-500 hover:text-white flex items-center gap-1">
                                    <ArrowLeft className="w-3 h-3" /> Volver
                                </button>
                                <div className="h-6 w-[1px] bg-white/10"></div>
                                <div>
                                    <h2 className="text-sm font-bold text-white uppercase">SesiÃ³n: {activeGenDetails.id}</h2>
                                    <p className="text-[10px] text-gray-500 font-mono">Creado: {new Date(activeGenDetails.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 overflow-x-auto max-w-[50vw]">
                                {activeGenDetails.variations.map((v: any) => (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVariation(v)}
                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase border transition-all whitespace-nowrap ${selectedVariation?.id === v.id ? 'bg-lumen-gold text-black border-lumen-gold' : 'bg-black text-gray-400 border-white/10'}`}
                                    >
                                        {v.style_id.split('_')[1] || v.style_id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
                            {/* LEFT: IMAGE VIEWER */}
                            <div className="bg-checkered border border-white/10 rounded-sm relative flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={() => setIsInspectorOpen(true)}>
                                {selectedVariation ? (
                                    <div className="w-full h-full relative group/view">
                                        <ComparisonSlider
                                            originalImage={activeGenDetails.original_image_path}
                                            processedImage={getDisplayUrl(selectedVariation.image_path)}
                                            isLocked={false}
                                            objectFit="contain"
                                        />
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`/upscale-tool?imageUrl=${encodeURIComponent(getDisplayUrl(selectedVariation.image_path))}`, '_blank');
                                                }}
                                                className="bg-purple-600 backdrop-blur border border-purple-400 text-white p-2 rounded hover:bg-purple-700 hover:border-purple-300 transition-all shadow-lg"
                                            >
                                                <Zap className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsInspectorOpen(true); }}
                                                className="bg-black/60 backdrop-blur border border-white/20 text-white p-2 rounded hover:text-lumen-gold hover:border-lumen-gold transition-all shadow-lg"
                                            >
                                                <ZoomIn className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : <div className="text-center text-gray-500"><Images className="w-12 h-12 mx-auto mb-2 opacity-20" /><p className="text-xs uppercase tracking-widest">Select Variation</p></div>}
                            </div>

                            {/* RIGHT: TELEMETRY */}
                            <div className="flex flex-col h-full overflow-hidden">
                                {selectedVariation ? renderTelemetryComparison(selectedVariation, activeGenDetails) : <div className="flex-1 bg-black/20 border border-white/5 rounded"></div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STORAGE MANAGER TAB --- */}
                {currentTab === 'ALMACENAMIENTO' && (
                    <div className="flex-1 flex flex-col bg-[#0A0A0F] border border-white/10 rounded-sm overflow-hidden animate-[fadeIn_0.3s]">
                        {/* Header Bar */}
                        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-wrap gap-4 justify-between items-center">
                            <div className="flex items-center gap-4">
                                <select
                                    value={storageBucket}
                                    onChange={(e) => setStorageBucket(e.target.value)}
                                    className="bg-black border border-white/20 text-white text-xs py-1.5 px-3 rounded font-mono focus:border-lumen-gold outline-none"
                                >
                                    <option value="lux-storage">lux-storage</option>
                                    <option value="original-photos">original-photos</option>
                                </select>

                                {/* Breadcrumbs - Compact */}
                                <div className="flex items-center gap-1 text-xs font-mono text-gray-400 overflow-x-auto max-w-[300px] no-scrollbar">
                                    <button onClick={() => handleNavigateBreadcrumb(-1)} className="hover:text-white px-1">ROOT</button>
                                    {currentPath.map((folder, idx) => (
                                        <React.Fragment key={idx}>
                                            <span>/</span>
                                            <button onClick={() => handleNavigateBreadcrumb(idx)} className="hover:text-white px-1 font-bold text-white whitespace-nowrap">{folder}</button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            {/* EXPLORER CONTROLS */}
                            <div className="flex items-center gap-2">
                                {/* Sort Controls */}
                                <div className="flex items-center bg-black/50 rounded border border-white/10 p-0.5">
                                    <select
                                        value={sortConfig.column}
                                        onChange={(e) => setSortConfig(prev => ({ ...prev, column: e.target.value as any }))}
                                        className="bg-transparent text-[10px] text-white outline-none px-2 py-1 font-mono uppercase"
                                    >
                                        <option value="name">Nombre</option>
                                        <option value="created_at">Fecha</option>
                                        <option value="size">Peso</option>
                                    </select>
                                    <button
                                        onClick={() => setSortConfig(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }))}
                                        className="p-1 hover:bg-white/10 text-gray-400 rounded"
                                        title={sortConfig.order === 'asc' ? "Ascendente" : "Descendente"}
                                    >
                                        {sortConfig.order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                    </button>
                                </div>

                                {/* Zoom Controls */}
                                <div className="flex items-center gap-2 bg-black/50 rounded border border-white/10 px-2 py-1">
                                    <ZoomIn className="w-3 h-3 text-gray-500" />
                                    <input
                                        type="range"
                                        min="80"
                                        max="400"
                                        step="20"
                                        value={thumbnailSize}
                                        onChange={(e) => setThumbnailSize(parseInt(e.target.value))}
                                        className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-lumen-gold"
                                    />
                                </div>

                                {/* View Mode Toggle */}
                                <div className="flex items-center bg-black/50 rounded border border-white/10 p-0.5">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}
                                        title="Vista Cuadrícula Regular"
                                    >
                                        <LayoutGrid className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('masonry')}
                                        className={`p-1.5 rounded transition-colors ${viewMode === 'masonry' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}
                                        title="Vista Mosaico Dinámico"
                                    >
                                        <Box className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}
                                        title="Vista Lista"
                                    >
                                        <List className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* FOLDER STATUS BADGE */}

                                {files.filter(f => f.id).length > 0 && files.filter(f => f.id && !f.name.toLowerCase().endsWith('.webp')).length === 0 && (
                                    <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-default shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                        <Check className="w-3 h-3" /> Carpeta Optimizada
                                    </div>
                                )}

                                <button
                                    onClick={handleOptimizeFolder}
                                    disabled={isOptimizing || (files.filter(f => f.id && !f.name.toLowerCase().endsWith('.webp')).length === 0 && files.filter(f => f.id).length > 0)}
                                    className={`p-2 border rounded transition-colors ${files.filter(f => f.id && !f.name.toLowerCase().endsWith('.webp')).length === 0 && files.filter(f => f.id).length > 0
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 opacity-50 hidden' // Hide button if badge is shown to reduce clutter, OR keep it distinct. Let's hide or dim it.
                                        : 'border-white/10 hover:bg-lumen-gold hover:text-black text-gray-400'
                                        }`}
                                    title="Optimizar Carpeta (WebP 80%)"
                                >
                                    <Zap className={`w-4 h-4 ${isOptimizing && selectedFiles.size === 0 ? 'animate-pulse text-lumen-gold' : ''}`} />
                                </button>
                                {files.length > 0 && (
                                    <button
                                        onClick={() => {
                                            if (selectedFiles.size === files.filter(f => f.id).length) {
                                                setSelectedFiles(new Set());
                                            } else {
                                                setSelectedFiles(new Set(files.filter(f => f.id).map(f => f.name)));
                                            }
                                        }}
                                        className="px-3 py-1.5 bg-white/5 border border-white/10 text-gray-400 rounded text-[10px] font-bold uppercase hover:bg-white/10 hover:text-white flex items-center gap-1"
                                        title="Seleccionar Todo"
                                    >
                                        <CheckSquare className="w-3 h-3" />
                                        {selectedFiles.size === files.filter(f => f.id).length && files.filter(f => f.id).length > 0 ? 'Deselec.' : 'Todo'}
                                    </button>
                                )}

                                {currentPath[0] === '.trash' && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm("VACIAR PAPELERA COMPLETAMENTE? Esta acciÃ³n es irreversible.")) return;
                                            setIsStorageLoading(true);
                                            try {
                                                const trashFiles = files.filter(f => f.id).map(f => `.trash/${f.name}`);
                                                if (trashFiles.length > 0) {
                                                    const { error } = await supabase.storage.from(storageBucket).remove(trashFiles);
                                                    if (error) throw error;
                                                }
                                                fetchStorageFiles();
                                            } catch (e: any) {
                                                alert("Error vaciando papelera: " + e.message);
                                            } finally {
                                                setIsStorageLoading(false);
                                            }
                                        }}
                                        className="px-3 py-1.5 bg-crimson-glow text-white rounded text-[10px] font-bold uppercase hover:bg-red-600 flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" /> Vaciar Papelera
                                    </button>
                                )}

                                {selectedFiles.size > 0 && (
                                    <>
                                        <button
                                            onClick={handleCopySelection}
                                            className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded text-[10px] font-bold uppercase hover:bg-white hover:text-black flex items-center gap-1"
                                            title="Copiar URLs seleccionadas"
                                        >
                                            <Copy className="w-3 h-3" /> Copiar
                                        </button>
                                        <button
                                            onClick={handleOptimizeSelection}
                                            disabled={isOptimizing}
                                            className="px-3 py-1.5 bg-lumen-gold/10 border border-lumen-gold/50 text-lumen-gold rounded text-[10px] font-bold uppercase hover:bg-lumen-gold hover:text-black flex items-center gap-1"
                                        >
                                            <Zap className="w-3 h-3" /> Optimizar Sel.
                                        </button>
                                        <span className="text-[10px] text-lumen-gold font-bold mr-2">{selectedFiles.size} Sel.</span>
                                        <button
                                            onClick={handleDeleteFiles}
                                            disabled={isOptimizing}
                                            className="px-3 py-1.5 bg-crimson-glow/10 border border-crimson-glow/50 text-crimson-glow rounded text-[10px] font-bold uppercase hover:bg-crimson-glow hover:text-white flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </>
                                )}
                                {isOptimizing && (
                                    <div className="flex items-center gap-2 mr-2 bg-lumen-gold/10 px-2 py-1 rounded border border-lumen-gold/30">
                                        <Loader2 className="w-3 h-3 animate-spin text-lumen-gold" />
                                        <span className="text-[10px] font-mono text-lumen-gold font-bold">
                                            {optimizationProgress.current}/{optimizationProgress.total} ({Math.round((optimizationProgress.current / optimizationProgress.total) * 100) || 0}%)
                                        </span>
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="flex items-center gap-2 mr-2 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">
                                        <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                            Subiendo {uploadProgress.current}/{uploadProgress.total}
                                        </span>
                                    </div>
                                )}

                                {/* CREAR CARPETA */}
                                {isCreatingFolder ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            placeholder="Nombre carpeta..."
                                            className="bg-black border border-white/20 text-white text-xs py-1.5 px-2 rounded w-32 focus:border-lumen-gold outline-none"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                        />
                                        <button onClick={handleCreateFolder} className="p-2 bg-lumen-gold text-black rounded hover:bg-lumen-gold/80" title="Crear">
                                            <Check className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }} className="p-2 bg-white/10 text-gray-400 rounded hover:bg-white/20" title="Cancelar">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsCreatingFolder(true)} className="p-2 border border-white/10 rounded hover:bg-white/10 text-gray-400 hover:text-white" title="Nueva Carpeta">
                                        <Folder className="w-4 h-4" />
                                    </button>
                                )}

                                {/* SUBIR ARCHIVOS */}
                                <label className="p-2 border border-white/10 rounded hover:bg-lumen-gold hover:text-black text-gray-400 cursor-pointer transition-all" title="Subir Archivos (auto-optimiza a WebP)">
                                    <Upload className="w-4 h-4" />
                                    <input type="file" multiple accept="image/*" onChange={handleUploadFiles} className="hidden" />
                                </label>

                                <button onClick={fetchStorageFiles} className="p-2 border border-white/10 rounded hover:bg-white/10 text-white">
                                    <RefreshCw className={`w-4 h-4 ${isStorageLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>


                        {/* File Grid/List */}
                        <div className="flex-1 overflow-y-auto p-4 bg-[#08080C]">
                            {currentPath.length > 0 && (
                                <div
                                    onClick={handleNavigateUp}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-sm cursor-pointer hover:bg-white/10 mb-4 text-xs text-gray-400"
                                >
                                    <ArrowLeft className="w-3 h-3" /> Volver arriba
                                </div>
                            )}

                            {isStorageLoading && files.length === 0 ? (
                                <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-lumen-gold animate-spin" /></div>
                            ) : (
                                <>
                                    {viewMode === 'list' ? (
                                        <div className="w-full text-[10px] folder-list">
                                            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-2 py-2 border-b border-white/10 text-gray-500 font-bold uppercase tracking-wider sticky top-0 bg-[#08080C] z-10">
                                                <div className="w-8"></div>
                                                <div>Nombre</div>
                                                <div className="w-20 text-right">TamaÃ±o</div>
                                                <div className="w-32 text-right">Fecha</div>
                                                <div className="w-24 text-right">Acciones</div>
                                            </div>
                                            {(() => {
                                                const sorted = [...(files || [])].sort((a, b) => {
                                                    let valA = a[sortConfig.column];
                                                    let valB = b[sortConfig.column];

                                                    // Handle missing props safely
                                                    if (sortConfig.column === 'size') {
                                                        valA = a.metadata?.size || 0;
                                                        valB = b.metadata?.size || 0;
                                                    }

                                                    if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
                                                    if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
                                                    return 0;
                                                });

                                                return sorted.map((file, idx) => {
                                                    if (!file || !file.name) return null;
                                                    const isRealFolder = !file.id;
                                                    const isSelected = selectedFiles.has(file.name);
                                                    const pathPrefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
                                                    const fileUrl = isRealFolder ? '' : `https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/${storageBucket}/${pathPrefix}${file.name}`;
                                                    const fileSize = isRealFolder ? '-' : ((file.metadata?.size || 0) / 1024).toFixed(1) + ' KB';
                                                    const fileDate = new Date(file.created_at || file.updated_at).toLocaleDateString() + ' ' + new Date(file.created_at || file.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={(e) => {
                                                                // Prevent navigation if clicking specific action buttons logic if needed, but row click usually selects or navigates
                                                                if (isRealFolder) handleNavigate(file.name);
                                                                else toggleFileSelection(file.name);
                                                            }}
                                                            className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-2 py-2 border-b border-white/5 items-center hover:bg-white/5 cursor-pointer ${isSelected ? 'bg-lumen-gold/10' : ''}`}
                                                        >
                                                            <div className="w-8 flex justify-center">
                                                                {isRealFolder ? <Folder className="w-4 h-4 text-lumen-gold" /> : (
                                                                    file.metadata?.mimetype?.startsWith('image') ? <Images className="w-4 h-4 text-prismatic-blue" /> : <FileText className="w-4 h-4 text-gray-500" />
                                                                )}
                                                            </div>
                                                            <div className="font-mono truncate text-gray-300">{file.name}</div>
                                                            <div className="text-right font-mono text-gray-500">{fileSize}</div>
                                                            <div className="text-right font-mono text-gray-600 text-[9px] whitespace-nowrap">{fileDate}</div>
                                                            <div className="flex justify-end gap-1">
                                                                {!isRealFolder && (
                                                                    <>
                                                                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(fileUrl); alert('URL copiada'); }} className="p-1 hover:bg-white/10 rounded" title="Copiar URL"><Copy className="w-3 h-3 text-gray-400" /></button>
                                                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 hover:bg-white/10 rounded"><ArrowUpRight className="w-3 h-3 text-gray-400" /></a>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleSendToLab(fileUrl); }} className="p-1 hover:bg-white/10 rounded"><FlaskConical className="w-3 h-3 text-gray-400" /></button>
                                                                    </>
                                                                )}
                                                                {file.debug?.storageUrl && (
                                                                    <div className="mt-1">
                                                                        <span className="text-[7px] text-orange-400 block mb-0.5">Corte (Storage):</span>
                                                                        <a href={file.debug.storageUrl} target="_blank" rel="noopener noreferrer">
                                                                            <img src={file.debug.storageUrl} className="w-20 h-auto object-contain border border-orange-500/30 bg-black/50 rounded" />
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                });
                                            })()}
                                        </div>
                                    ) : (
                                        <div
                                            className={`${viewMode === 'masonry' ? 'flex flex-wrap' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'} gap-px bg-white/5 border border-white/5 rounded-sm overflow-hidden`}
                                            style={viewMode === 'grid' ? { gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))` } : {}}
                                        >
                                            {(() => {
                                                const sorted = [...(files || [])].sort((a, b) => {
                                                    let valA = a[sortConfig.column];
                                                    let valB = b[sortConfig.column];
                                                    if (sortConfig.column === 'size') {
                                                        valA = a.metadata?.size || 0;
                                                        valB = b.metadata?.size || 0;
                                                    }
                                                    if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
                                                    if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
                                                    return 0;
                                                });

                                                return sorted.map((file, idx) => {
                                                    if (!file || !file.name) return null;
                                                    const isRealFolder = !file.id;
                                                    const isSelected = selectedFiles.has(file.name);
                                                    const pathPrefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
                                                    const fileUrl = isRealFolder ? '' : `https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/${storageBucket}/${pathPrefix}${file.name}`;
                                                    const mimeType = file.metadata?.mimetype || '';

                                                    return (
                                                        <div
                                                            key={idx}
                                                            draggable={!isRealFolder}
                                                            onDragStart={(e) => {
                                                                e.dataTransfer.setData("text/plain", file.name);
                                                                e.dataTransfer.effectAllowed = "move";
                                                            }}
                                                            onDragOver={(e) => {
                                                                if (isRealFolder) {
                                                                    e.preventDefault();
                                                                    e.currentTarget.classList.add('bg-lumen-gold/20');
                                                                }
                                                            }}
                                                            onDragLeave={(e) => {
                                                                if (isRealFolder) {
                                                                    e.currentTarget.classList.remove('bg-lumen-gold/20');
                                                                }
                                                            }}
                                                            onDrop={(e) => {
                                                                if (isRealFolder) {
                                                                    e.preventDefault();
                                                                    e.currentTarget.classList.remove('bg-lumen-gold/20');
                                                                    const droppedFileName = e.dataTransfer.getData("text/plain");
                                                                    if (droppedFileName && droppedFileName !== file.name) {
                                                                        handleMoveFile(droppedFileName, file.name);
                                                                    }
                                                                }
                                                            }}
                                                            onClick={() => isRealFolder ? handleNavigate(file.name) : toggleFileSelection(file.name)}
                                                            className={`group relative overflow-hidden cursor-pointer transition-all border border-transparent ${isSelected ? 'ring-2 ring-lumen-gold z-10' : 'hover:border-white/20'
                                                                } ${viewMode === 'masonry' ? 'flex-grow' : 'aspect-square'}`}
                                                            style={viewMode === 'masonry' ? {
                                                                height: `${thumbnailSize}px`,
                                                                minWidth: `${thumbnailSize * 0.8}px`
                                                            } : {}}
                                                        >
                                                            {isRealFolder ? (
                                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 group-hover:text-lumen-gold bg-black/40 relative">
                                                                    <Folder className="w-8 h-8 mb-1 fill-current opacity-50 group-hover:opacity-100" />
                                                                    <span className="text-[9px] font-mono text-center px-2 truncate w-full uppercase tracking-tighter">{file.name}</span>

                                                                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleLoadAsSession(file.name); }}
                                                                            className="p-1 bg-white/10 hover:bg-lumen-gold hover:text-black rounded transition-colors"
                                                                            title="Forzar Carga como SesiÃ³n"
                                                                        >
                                                                            <Download className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {/* IMAGE / FILE CONTENT */}
                                                                    <div className="w-full h-full bg-[#050505] flex items-center justify-center relative">
                                                                        {mimeType.startsWith('image') ? (
                                                                            <img
                                                                                src={getThumbnailUrl(fileUrl)}
                                                                                className={`w-full h-full ${viewMode === 'masonry' ? 'object-cover' : 'object-contain'} transition-transform duration-500 group-hover:scale-105`}
                                                                                loading="lazy"
                                                                            />
                                                                        ) : (
                                                                            <FileText className="w-8 h-8 text-gray-600" />
                                                                        )}

                                                                        {/* RENAMING OVERLAY */}
                                                                        {renamingFile === file.name && (
                                                                            <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col p-2 items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                                                <input
                                                                                    className="w-full bg-black border border-lumen-gold text-[10px] text-white p-1.5 focus:outline-none rounded font-mono"
                                                                                    value={newName}
                                                                                    onChange={e => setNewName(e.target.value)}
                                                                                    autoFocus
                                                                                    onKeyDown={e => e.key === 'Enter' && handleRenameFile(file.name)}
                                                                                />
                                                                                <div className="flex gap-1 w-full">
                                                                                    <button onClick={() => handleRenameFile(file.name)} className="flex-1 bg-lumen-gold text-black text-[9px] font-bold py-1 rounded">SAVE</button>
                                                                                    <button onClick={() => { setRenamingFile(null); setNewName(''); }} className="flex-1 bg-white/10 text-white text-[9px] font-bold py-1 rounded">CANCEL</button>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* SELECTION OVERLAY */}
                                                                        {isSelected && (
                                                                            <div className="absolute inset-0 bg-lumen-gold/10 pointer-events-none" />
                                                                        )}

                                                                        {/* FILE INFO OVERLAY (BOTTOM) */}
                                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                                            <p className="text-[8px] text-white truncate font-mono opacity-80 mb-0.5">{file.name}</p>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-[7px] text-gray-400">{((file.metadata?.size || 0) / 1024).toFixed(0)} KB</span>
                                                                                <span className="text-[7px] text-lumen-gold uppercase font-bold tracking-tighter">{file.name.split('.').pop()}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* ACTIONS (TOP) */}
                                                                        <div className="absolute top-1 left-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setRenamingFile(file.name); setNewName(file.name); }}
                                                                                className="p-1.5 bg-black/60 hover:bg-lumen-gold hover:text-black rounded border border-white/10 text-white transition-all shadow-lg"
                                                                                title="Renombrar"
                                                                            >
                                                                                <PenTool className="w-3 h-3" />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleSendToLab(fileUrl); }}
                                                                                className="p-1.5 bg-black/60 hover:bg-prismatic-blue hover:text-white rounded border border-white/10 text-white transition-all shadow-lg"
                                                                                title="Enviar a Forensic Lab"
                                                                            >
                                                                                <FlaskConical className="w-3 h-3" />
                                                                            </button>
                                                                        </div>

                                                                        {/* STATUS INDICATORS */}
                                                                        <div className="absolute top-1 right-1 flex flex-col gap-1">
                                                                            {file.name.toLowerCase().endsWith('.webp') && (
                                                                                <div className="bg-emerald-500/80 text-white rounded-full p-0.5 shadow-lg" title="Optimizado">
                                                                                    <Zap className="w-2 h-2" />
                                                                                </div>
                                                                            )}
                                                                            {isSelected && (
                                                                                <div className="bg-lumen-gold text-black rounded-full p-0.5 shadow-lg">
                                                                                    <Check className="w-2.5 h-2.5" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB: LABORATORIO (FORENSIC LAB) --- */}
                {
                    currentTab === 'LABORATORIO' && (
                        <div className="flex-1 min-h-0 bg-black/20 rounded border border-white/5 overflow-hidden">
                            <ForensicLab />
                        </div>
                    )
                }

                {/* --- TAB: LUXSCALER PRO --- */}
                {
                    currentTab === 'LUXSCALER' && (<>
                        <LuxScalerPro
                            state={luxScalerState}
                            setState={setLuxScalerState}
                            onRun={runLuxScaler}
                            onReassemble={handleReassemble}
                            onLog={addLuxLog}
                            calculateGrid={calculateDynamicGrid}
                            onOpenLab={() => setCurrentTab('LABORATORIO')}
                        />
                        {false && (
                            <div className="flex-1 flex flex-col bg-[#0A0A0F] border border-white/10 rounded-sm overflow-hidden animate-[fadeIn_0.3s]">
                                <div className="bg-[#050505] border-b border-white/10 p-0">
                                    {/* TOP MENU UPSCALER */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-900 to-[#0A0A0F]">
                                        <div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-lumen-gold animate-pulse" />
                                                ENGINE 4: UPSCALER™
                                            </h3>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1 hidden md:block">
                                                Virtual Optics Engine. Simulates 85mm prime lens physics and perspective correction.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setCurrentTab('LABORATORIO')}
                                            className="px-3 py-1.5 bg-crimson-glow/20 text-crimson-glow border border-crimson-glow/30 rounded text-[10px] font-bold hover:bg-crimson-glow hover:text-white transition-all flex items-center gap-2"
                                        >
                                            <FlaskConical className="w-3 h-3" /> OPEN FORENSIC LAB
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden p-4 min-h-0 relative">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full min-h-0">
                                        {/* LEFT: CONTROLS */}
                                        <div className="space-y-4 overflow-y-auto max-h-full pr-2">
                                            {/* Upload */}
                                            <div>
                                                <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-1">Imagen</h4>
                                                <div
                                                    className="border border-dashed border-white/10 rounded p-2 text-center hover:border-green-500/50 cursor-pointer transition-all"
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
                                                                    const { cols, rows } = calculateDynamicGrid(img.width, img.height, luxScalerState.targetRes);
                                                                    setLuxScalerState(prev => ({
                                                                        ...prev,
                                                                        imageData: result.split(',')[1],
                                                                        imageMime: file.type,
                                                                        imagePreview: result,
                                                                        imgWidth: img.width,
                                                                        imgHeight: img.height,
                                                                        gridCols: cols,
                                                                        gridRows: rows,
                                                                        tiles: {}
                                                                    }));
                                                                };
                                                                img.src = result;
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} />
                                                    {luxScalerState.imagePreview ? (
                                                        <div className="relative">
                                                            <img src={luxScalerState.imagePreview} className="max-h-20 mx-auto rounded" />
                                                            <div className="text-[8px] text-gray-500 mt-1">{luxScalerState.imgWidth}x{luxScalerState.imgHeight}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500 text-[9px]">Click para subir</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Resolution Scale */}
                                            <div>
                                                <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-1">Escala</h4>
                                                <div className="grid grid-cols-4 gap-1">
                                                    {['x1.5', 'x2', 'x3', 'x4'].map(scale => (
                                                        <button
                                                            key={scale}
                                                            onClick={() => {
                                                                const { cols, rows } = calculateDynamicGrid(luxScalerState.imgWidth, luxScalerState.imgHeight, scale);
                                                                setLuxScalerState(prev => ({ ...prev, targetRes: scale, gridCols: cols, gridRows: rows }));
                                                            }}
                                                            className={`p-1.5 rounded border text-center transition-all ${luxScalerState.targetRes === scale
                                                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                                                : 'bg-black border-white/10 text-gray-400 hover:border-white/30'
                                                                }`}
                                                        >
                                                            <div className="font-bold text-sm">{scale}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Info + Verification */}
                                            <div className="bg-black/50 border border-white/10 rounded p-2 text-[9px] font-mono space-y-1">
                                                <div className="flex justify-between"><span className="text-gray-500">Grid:</span><span className="text-white">{luxScalerState.gridCols}×{luxScalerState.gridRows} = {luxScalerState.gridCols * luxScalerState.gridRows} celdas</span></div>
                                                {luxScalerState.imgWidth > 0 && (() => {
                                                    const scale = parseFloat(luxScalerState.targetRes.replace('x', '')) || 2;
                                                    const targetW = Math.round(luxScalerState.imgWidth * scale);
                                                    const targetH = Math.round(luxScalerState.imgHeight * scale);

                                                    // Helper functions for Pixel-Perfect calculation
                                                    const getTileW = (col: number, cols: number, totalW: number) => {
                                                        const baseW = Math.floor(totalW / cols);
                                                        const remW = totalW % cols;
                                                        return col < remW ? baseW + 1 : baseW;
                                                    };
                                                    const getTileH = (row: number, rows: number, totalH: number) => {
                                                        const baseH = Math.floor(totalH / rows);
                                                        const remH = totalH % rows;
                                                        return row < remH ? baseH + 1 : baseH;
                                                    };
                                                    const sumTilesW = (cols: number, totalW: number) => {
                                                        let acc = 0;
                                                        for (let c = 0; c < cols; c++) acc += getTileW(c, cols, totalW);
                                                        return acc;
                                                    };
                                                    const sumTilesH = (rows: number, totalH: number) => {
                                                        let acc = 0;
                                                        for (let r = 0; r < rows; r++) acc += getTileH(r, rows, totalH);
                                                        return acc;
                                                    };

                                                    const tileWidths = Array.from({ length: luxScalerState.gridCols }, (_, c) => getTileW(c, luxScalerState.gridCols, targetW));
                                                    const tileHeights = Array.from({ length: luxScalerState.gridRows }, (_, r) => getTileH(r, luxScalerState.gridRows, targetH));
                                                    const sumW = sumTilesW(luxScalerState.gridCols, targetW);
                                                    const sumH = sumTilesH(luxScalerState.gridRows, targetH);
                                                    const deltaW = targetW - sumW;
                                                    const deltaH = targetH - sumH;

                                                    return (
                                                        <>
                                                            <div className="flex justify-between"><span className="text-gray-500">Target:</span><span className="text-green-400">{targetW}×{targetH}px</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-500">Tiles W:</span><span className="text-blue-400">[{tileWidths.join(", ")}]</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-500">Tiles H:</span><span className="text-blue-400">[{tileHeights.join(", ")}]</span></div>
                                                            <div className="flex justify-between border-t border-white/5 pt-1"><span className="text-gray-500">Σ Total (real):</span><span className="text-yellow-400">{sumW}×{sumH}px</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-500">Δ:</span><span className={deltaW === 0 && deltaH === 0 ? "text-green-400" : "text-red-400"}>{deltaW}px, {deltaH}px</span></div>
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* Step-by-Step Workflow */}
                                            <div className="space-y-1">
                                                {/* Step 1: Confirm Grid */}
                                                {luxScalerState.step === 0 && luxScalerState.imageData && (() => {
                                                    const scale = parseFloat(luxScalerState.targetRes.replace('x', '')) || 2;
                                                    const targetW = Math.round(luxScalerState.imgWidth * scale);
                                                    const targetH = Math.round(luxScalerState.imgHeight * scale);

                                                    // IN Helper Logic (Base + Remainder)
                                                    const getInTileW = (col: number, cols: number, totalW: number) => {
                                                        const baseW = Math.floor(totalW / cols);
                                                        const remW = totalW % cols;
                                                        return col < remW ? baseW + 1 : baseW;
                                                    };
                                                    const getInTileH = (row: number, rows: number, totalH: number) => {
                                                        const baseH = Math.floor(totalH / rows);
                                                        const remH = totalH % rows;
                                                        return row < remH ? baseH + 1 : baseH;
                                                    };

                                                    // OUT Helper Logic (Base + Remainder)
                                                    const getOutTileW = (col: number, cols: number, totalW: number) => {
                                                        const baseW = Math.floor(totalW / cols);
                                                        const remW = totalW % cols;
                                                        return col < remW ? baseW + 1 : baseW;
                                                    };
                                                    const getOutTileH = (row: number, rows: number, totalH: number) => {
                                                        const baseH = Math.floor(totalH / rows);
                                                        const remH = totalH % rows;
                                                        return row < remH ? baseH + 1 : baseH;
                                                    };

                                                    const inTileWidths = Array.from({ length: luxScalerState.gridCols }, (_, c) => getInTileW(c, luxScalerState.gridCols, luxScalerState.imgWidth));
                                                    const inTileHeights = Array.from({ length: luxScalerState.gridRows }, (_, r) => getInTileH(r, luxScalerState.gridRows, luxScalerState.imgHeight));

                                                    const outTileWidths = Array.from({ length: luxScalerState.gridCols }, (_, c) => getOutTileW(c, luxScalerState.gridCols, targetW));
                                                    const outTileHeights = Array.from({ length: luxScalerState.gridRows }, (_, r) => getOutTileH(r, luxScalerState.gridRows, targetH));

                                                    return (
                                                        <div className="space-y-1">
                                                            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-[8px] font-mono text-blue-300 space-y-0.5">
                                                                <div className="font-bold text-blue-400 uppercase">📍 PASO 1: CONFIRMAR CONFIG</div>
                                                                <div>• Imagen: {luxScalerState.imgWidth}×{luxScalerState.imgHeight}px</div>
                                                                <div>• Grid: {luxScalerState.gridCols}×{luxScalerState.gridRows} = {luxScalerState.gridCols * luxScalerState.gridRows} celdas</div>
                                                                <div className="flex flex-col">
                                                                    <span>• IN Tiles W: [{inTileWidths.join(", ")}]</span>
                                                                    <span>• IN Tiles H: [{inTileHeights.join(", ")}]</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span>• OUT Tiles W: [{outTileWidths.join(", ")}]</span>
                                                                    <span>• OUT Tiles H: [{outTileHeights.join(", ")}]</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    addLuxLog(`📍 Grid: ${luxScalerState.gridCols}×${luxScalerState.gridRows}`);
                                                                    addLuxLog(`📍 IN Tiles W: [${inTileWidths.join(", ")}] H: [${inTileHeights.join(", ")}]`);
                                                                    addLuxLog(`📍 OUT Tiles W: [${outTileWidths.join(", ")}] H: [${outTileHeights.join(", ")}]`);
                                                                    setLuxScalerState(prev => ({ ...prev, step: 1 }));
                                                                }}
                                                                className="w-full py-1 bg-blue-500/20 border border-blue-500 text-blue-400 font-bold uppercase rounded text-[9px] hover:bg-blue-500/30 flex items-center justify-center gap-1"
                                                            >
                                                                <Check className="w-3 h-3" /> CONFIRMAR
                                                            </button>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Step 2: Crop Tiles */}
                                                {luxScalerState.step === 1 && (
                                                    <div className="space-y-1">
                                                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-[8px] font-mono text-yellow-300 space-y-0.5">
                                                            <div className="font-bold text-yellow-400 uppercase">âœ‚ï¸ PASO 2: SEGMENTAR</div>
                                                            <div>• Total: {luxScalerState.gridCols * luxScalerState.gridRows} segmentos</div>
                                                            <div>• Tamaño: {Math.round(luxScalerState.imgWidth / luxScalerState.gridCols)}×{Math.round(luxScalerState.imgHeight / luxScalerState.gridRows)}px cada uno</div>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                setLuxScalerState(prev => ({ ...prev, processing: true }));
                                                                addLuxLog(`âœ‚ï¸ Iniciando segmentación y subida a Base de Datos (Storage)...`);

                                                                // Load Source Image with Universal Loader (URL/Base64/Raw)
                                                                let imgSource = luxScalerState.imageData;
                                                                if (!imgSource) {
                                                                    addLuxLog(`âŒ Error: No hay imagen en memoria.`);
                                                                    setLuxScalerState(prev => ({ ...prev, processing: false }));
                                                                    return;
                                                                }

                                                                const isUrl = imgSource.startsWith('http') || imgSource.startsWith('blob:');
                                                                const isData = imgSource.startsWith('data:image');

                                                                addLuxLog(`ðŸ” Source Type: ${isUrl ? 'URL (Remote/Blob)' : isData ? 'Base64 (Valid)' : 'Unknown (Raw?)'} - Length: ${imgSource.length}`);

                                                                // AUTO-FIX: Missing Header (Only if NOT a URL and NOT valid Base64)
                                                                if (!isUrl && !isData) {
                                                                    addLuxLog(`âš ï¸ RAW String detectado. Intentando Auto-Fix (Add Header)...`);
                                                                    imgSource = `data:image/png;base64,${imgSource}`;
                                                                }

                                                                const img = new Image();
                                                                // CRITICAL: Allow CORS for external URLs (Supabase Storage) to avoid Tainted Canvas
                                                                if (isUrl) {
                                                                    img.crossOrigin = "anonymous";
                                                                }

                                                                try {
                                                                    await new Promise((resolve, reject) => {
                                                                        img.onload = () => {
                                                                            addLuxLog(`âœ… Imagen cargada exitosamente (${img.width}x${img.height}px).`);
                                                                            resolve(true);
                                                                        };
                                                                        img.onerror = (e) => {
                                                                            // Detailed error logging
                                                                            console.error("Image Load Error:", e);
                                                                            reject(new Error(isUrl ? "FallÃ³ carga URL (posible CORS/404)" : "FallÃ³ decodificaciÃ³n Base64"));
                                                                        };
                                                                        img.src = imgSource;
                                                                    });
                                                                } catch (loadErr) {
                                                                    addLuxLog(`âŒ Error fatal: ${loadErr}`);
                                                                    setLuxScalerState(prev => ({ ...prev, processing: false }));
                                                                    return;
                                                                }

                                                                // 0. GENERATE LEGIBLE SESSION FOLDER
                                                                const { data: { session } } = await supabase.auth.getSession();
                                                                const userEmail = session?.user?.email?.split('@')[0] || 'anon';
                                                                const now = new Date();
                                                                const timestampStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
                                                                const sessionFolder = `upscaler/${userEmail}/${timestampStr}`;

                                                                const newCroppedTiles: Record<string, string> = {};

                                                                // INITIALIZE TILES FOR VISIBILITY
                                                                const rows = luxScalerState.gridRows;
                                                                const cols = luxScalerState.gridCols;
                                                                const initialTiles: Record<string, any> = {};
                                                                for (let r = 0; r < rows; r++) {
                                                                    for (let c = 0; c < cols; c++) {
                                                                        initialTiles[`${r}-${c}`] = { status: 'waiting', debug: { status: 'pending_cut' } };
                                                                    }
                                                                }


                                                                // Update state with folder name for step 3
                                                                setLuxScalerState(prev => ({ ...prev, sessionFolder, tiles: initialTiles, finalStitchedImage: null }));

                                                                // SMART SLICING ALGORITHM (Pixel Perfect)
                                                                const naturalW = img.naturalWidth || img.width;
                                                                const naturalH = img.naturalHeight || img.height;
                                                                // Get Selected Tile Config (v4.1)
                                                                // We need to know which tile strategy was chosen.
                                                                // For now, let's recalculate or assume based on grid?
                                                                // Better: Use UpscalerTileCalculator logic again or store it.
                                                                // Re-calculating to be safe (idempotent)
                                                                const scale = parseFloat(luxScalerState.targetRes.replace('x', '')) || 2;
                                                                const targetResPx = Math.max(naturalW, naturalH) * scale;
                                                                const result = UpscalerTileCalculator.calculate(naturalW, naturalH, targetResPx);
                                                                const tileConfig = result.tile_info;

                                                                // Required Input Tile Size (to match Output AR exactly)
                                                                // Input = Output / Scale
                                                                // (Using scale derived from targetRes string logic provided in other steps)
                                                                // Actually, let's derive scale from Target / Input? 
                                                                // No, user selects x1.5 etc.
                                                                const inputTileW = Math.floor(tileConfig.w / scale);
                                                                const inputTileH = Math.floor(tileConfig.h / scale);

                                                                // Overlap Calculation (from Calculator)
                                                                const overlap = UpscalerTileCalculator.OVERLAP_PCT;
                                                                const stepW = inputTileW * (1 - overlap);
                                                                const stepH = inputTileH * (1 - overlap);

                                                                for (let row = 0; row < rows; row++) {
                                                                    for (let col = 0; col < cols; col++) {
                                                                        try {
                                                                            // SLIDING WINDOW LOGIC (Deformation Fix)
                                                                            // Standard tiles: x = col * step
                                                                            // Last tile: x = Width - TileW (Clamp to right/bottom edge)

                                                                            let x, y;

                                                                            if (col === cols - 1) {
                                                                                x = naturalW - inputTileW;
                                                                                if (x < 0) x = 0; // Safety
                                                                            } else {
                                                                                x = Math.floor(col * stepW);
                                                                            }

                                                                            if (row === rows - 1) {
                                                                                y = naturalH - inputTileH;
                                                                                if (y < 0) y = 0;
                                                                            } else {
                                                                                y = Math.floor(row * stepH);
                                                                            }

                                                                            // Verify bounds
                                                                            const finalW = Math.min(inputTileW, naturalW - x);
                                                                            const finalH = Math.min(inputTileH, naturalH - y);

                                                                            const canvas = document.createElement('canvas');
                                                                            canvas.width = finalW;
                                                                            canvas.height = finalH;
                                                                            const ctx = canvas.getContext('2d');

                                                                            if (ctx) {
                                                                                ctx.imageSmoothingEnabled = false; // Disable smoothing for exact cut
                                                                                ctx.drawImage(img, x, y, finalW, finalH, 0, 0, finalW, finalH);

                                                                                // BLOB & UPLOAD
                                                                                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
                                                                                if (blob) {
                                                                                    const path = `${sessionFolder}/CORTE_${row}_${col}.png`;
                                                                                    const { error: uploadError } = await supabase.storage.from('lux-storage').upload(path, blob);

                                                                                    if (!uploadError) {
                                                                                        const { data: { publicUrl } } = supabase.storage.from('lux-storage').getPublicUrl(path);
                                                                                        const key = `${row}-${col}`;
                                                                                        newCroppedTiles[key] = publicUrl;

                                                                                        // Update UI with the cut preview
                                                                                        setLuxScalerState(prev => ({
                                                                                            ...prev,
                                                                                            tiles: {
                                                                                                ...prev.tiles,
                                                                                                [key]: {
                                                                                                    ...prev.tiles[key],
                                                                                                    status: 'ready',
                                                                                                    debug: {
                                                                                                        ...prev.tiles[key]?.debug,
                                                                                                        inputUrl: publicUrl,
                                                                                                        status: 'cut_ready'
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }));

                                                                                        addLuxLog(`✅ [${row},${col}] Guardado en Storage: ...${path.slice(-15)} (${finalW}x${finalH})`);
                                                                                    } else {
                                                                                        throw uploadError;
                                                                                    }
                                                                                }
                                                                            }
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                            addLuxLog(`❌ [${row},${col}] Falló subida: ${err}`);
                                                                        }
                                                                        // Small delay to prevent UI freeze
                                                                        await new Promise(r => setTimeout(r, 50));
                                                                    }
                                                                }
                                                                addLuxLog(`📦 Segmentación finalizada. Procediendo a Generación.`);
                                                                setLuxScalerState(prev => ({
                                                                    ...prev,
                                                                    step: 2,
                                                                    processing: false,
                                                                    croppedTiles: { ...prev.croppedTiles, ...newCroppedTiles }
                                                                }));
                                                            }}
                                                            disabled={luxScalerState.processing}
                                                            className="w-full py-1 bg-yellow-500/20 border border-yellow-500 text-yellow-400 font-bold uppercase rounded text-[9px] hover:bg-yellow-500/30 disabled:opacity-50 flex items-center justify-center gap-1"
                                                        >
                                                            {luxScalerState.processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scissors className="w-3 h-3" />}
                                                            CORTAR
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Step 3: Generate One by One */}
                                                {luxScalerState.step === 2 && (
                                                    <div className="space-y-1">
                                                        <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-[8px] font-mono text-green-300 space-y-0.5">
                                                            <div className="font-bold text-green-400 uppercase">🚀 PASO 3: GENERAR UPSCALE</div>
                                                            <div>• Segmentos: {luxScalerState.gridCols * luxScalerState.gridRows}</div>
                                                            <div>• Motor: AI Pro</div>
                                                            <div>• Output: {Math.round(luxScalerState.imgWidth / luxScalerState.gridCols * (parseFloat(luxScalerState.targetRes.replace('x', '')) || 2))}×{Math.round(luxScalerState.imgHeight / luxScalerState.gridRows * (parseFloat(luxScalerState.targetRes.replace('x', '')) || 2))}px/segmento</div>
                                                        </div>
                                                        <button
                                                            onClick={runLuxScaler}
                                                            disabled={luxScalerState.processing}
                                                            className="w-full py-1 bg-gradient-to-r from-green-500 to-blue-500 text-black font-bold uppercase rounded text-[9px] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1"
                                                        >
                                                            {luxScalerState.processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                                            GENERAR
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Step 4: Reassemble */}
                                                {luxScalerState.step === 3 && (
                                                    <div className="space-y-1">
                                                        <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 text-[8px] font-mono text-purple-300 space-y-0.5">
                                                            <div className="font-bold text-purple-400 uppercase">🧩 PASO 4: REENSAMBLAR</div>
                                                            <div>• Motor: Stitcher Interno</div>
                                                            <div>• Objetivo: {Math.round(luxScalerState.imgWidth * (parseFloat(luxScalerState.targetRes.replace('x', '')) || 2))}×{Math.round(luxScalerState.imgHeight * (parseFloat(luxScalerState.targetRes.replace('x', '')) || 2))}px</div>
                                                        </div>
                                                        <button
                                                            onClick={handleReassemble}
                                                            disabled={luxScalerState.processing}
                                                            className="w-full py-1 bg-purple-500/20 border border-purple-500 text-purple-400 font-bold uppercase rounded text-[9px] hover:bg-purple-500/30 disabled:opacity-50 flex items-center justify-center gap-1"
                                                        >
                                                            {luxScalerState.processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                                                            UNIR SEGMENTOS
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Step 5: Final Result */}
                                                {luxScalerState.step === 4 && luxScalerState.finalStitchedImage && (
                                                    <div className="space-y-1">
                                                        <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-[8px] font-mono text-green-300">
                                                            <div className="font-bold text-green-400 uppercase">ðŸ PROCESO COMPLETADO</div>
                                                            <div className="mt-1 truncate text-gray-400 underline italic cursor-pointer" onClick={() => window.open(luxScalerState.finalStitchedImage!, '_blank')}>
                                                                Ver Imagen Final
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={luxScalerState.finalStitchedImage}
                                                            download="luxscaler_master.png"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full py-1 bg-green-500 text-black font-bold uppercase rounded text-[9px] hover:bg-green-600 flex items-center justify-center gap-1 no-underline"
                                                        >
                                                            <Download className="w-3 h-3" /> DESCARGAR RESULTADO
                                                        </a>
                                                        <button
                                                            onClick={() => setLuxScalerState(prev => ({ ...prev, step: 0, tiles: {}, croppedTiles: {}, finalStitchedImage: null, sessionFolder: null }))}
                                                            className="w-full py-1 bg-white/5 border border-white/10 text-gray-400 font-bold uppercase rounded text-[9px] hover:bg-white/10 flex items-center justify-center gap-1"
                                                        >
                                                            NUEVA TAREA
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Progress */}
                                                {luxScalerState.processing && (
                                                    <div className="bg-black/50 rounded overflow-hidden">
                                                        <div className="h-1 bg-gradient-to-r from-green-500 to-blue-500" style={{ width: `${luxScalerState.progress}%` }} />
                                                    </div>
                                                )}

                                                {/* Status */}
                                                {!luxScalerState.imageData && (
                                                    <div className="text-center text-[9px] text-gray-600 py-2">Sube una imagen para comenzar</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* RIGHT: TILE GRID (Much Smaller) */}
                                        <div className="lg:col-span-2 flex flex-col h-full min-h-0 gap-2">
                                            {/* Grid Container - Much smaller */}
                                            {/* Grid Container - Dynamic & Large */}
                                            <div className="flex-1 min-h-[400px] flex items-center justify-center bg-black/20 rounded p-2 border border-white/5 relative">
                                                <div
                                                    className="grid gap-[1px] bg-black p-[1px] rounded border border-white/10 shadow-2xl shadow-black/50"
                                                    style={{
                                                        aspectRatio: `${luxScalerState.gridCols}/${luxScalerState.gridRows}`,
                                                        gridTemplateColumns: `repeat(${luxScalerState.gridCols}, 1fr)`,
                                                        width: 'auto',
                                                        height: 'auto',
                                                        maxWidth: '100%',
                                                        maxHeight: '100%',
                                                        margin: 'auto'
                                                    }}
                                                >
                                                    {Array.from({ length: luxScalerState.gridCols * luxScalerState.gridRows }).map((_, i) => {
                                                        const row = Math.floor(i / luxScalerState.gridCols);
                                                        const col = i % luxScalerState.gridCols;
                                                        const tileKey = `${row}-${col}`;
                                                        const tile = luxScalerState.tiles[tileKey];
                                                        const scale = parseFloat(luxScalerState.targetRes.replace('x', '')) || 2;
                                                        // FIX: Use same Pixel-Perfect logic for preview
                                                        const targetW = Math.round(luxScalerState.imgWidth * scale);
                                                        const targetH = Math.round(luxScalerState.imgHeight * scale);
                                                        const baseW = Math.floor(targetW / luxScalerState.gridCols);
                                                        const remW = targetW % luxScalerState.gridCols;
                                                        const baseH = Math.floor(targetH / luxScalerState.gridRows);
                                                        const remH = targetH % luxScalerState.gridRows;

                                                        const tgtW = (col < remW) ? baseW + 1 : baseW;
                                                        const tgtH = (row < remH) ? baseH + 1 : baseH;

                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`relative aspect-square border rounded flex flex-col items-center justify-center font-mono text-[7px] leading-none ${tile?.status === 'done' ? 'border-green-500 bg-green-900/30' :
                                                                    tile?.status === 'processing' ? 'border-blue-500 bg-blue-900/30 animate-pulse' :
                                                                        tile?.status === 'error' ? 'border-red-500 bg-red-900/30' :
                                                                            'border-white/10 bg-black/50'
                                                                    }`}
                                                                style={{ minWidth: '30px', minHeight: '30px' }}
                                                            >
                                                                {tile?.data ? (
                                                                    <div className="w-full h-full relative group">
                                                                        <img src={`data:image/png;base64,${tile.data}`} className="w-full h-full object-cover absolute inset-0 z-10" />
                                                                        {/* Hover to see original crop */}
                                                                        {luxScalerState.croppedTiles[tileKey] && (
                                                                            <img src={luxScalerState.croppedTiles[tileKey]} className="w-full h-full object-cover absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        )}
                                                                    </div>
                                                                ) : luxScalerState.croppedTiles[tileKey] ? (
                                                                    <div className="w-full h-full relative">
                                                                        {/* Show crop as preview (sepia/dimmed to indicate 'todo') */}
                                                                        <img src={luxScalerState.croppedTiles[tileKey]} className="w-full h-full object-cover absolute inset-0 opacity-50 grayscale hover:grayscale-0 transition-all" />
                                                                        <span className="absolute bottom-0.5 right-0.5 text-[6px] text-white/50 bg-black/50 px-0.5 rounded">{tgtW}×{tgtH}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-blue-400">{tgtW}×{tgtH}</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Summary Row */}
                                            <div className="bg-black/40 border border-white/10 rounded p-2 text-[9px] font-mono flex justify-between items-center shrink-0">
                                                <span className="text-gray-500">
                                                    Σ = {(() => {
                                                        const scale = parseFloat(luxScalerState.targetRes.replace('x', '')) || 2;
                                                        const tileW = Math.round(Math.round(luxScalerState.imgWidth / luxScalerState.gridCols) * scale);
                                                        const tileH = Math.round(Math.round(luxScalerState.imgHeight / luxScalerState.gridRows) * scale);
                                                        return `${tileW * luxScalerState.gridCols}×${tileH * luxScalerState.gridRows}px`;
                                                    })()}
                                                </span>
                                                <span className="text-green-400 font-bold">
                                                    Target: {Math.round(luxScalerState.imgWidth * (parseFloat(luxScalerState.targetRes.replace('x', '')) || 2))}×{Math.round(luxScalerState.imgHeight * (parseFloat(luxScalerState.targetRes.replace('x', '')) || 2))}px
                                                </span>
                                            </div>

                                            {/* LIVE ORCHESTRATOR LOG (Debug Panel) */}
                                            <div className="flex-1 bg-[#050505] border border-white/10 rounded overflow-hidden flex flex-col min-h-0 mt-2">
                                                <div className="bg-white/5 border-b border-white/10 px-2 py-1 flex justify-between items-center">
                                                    <span className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-2">
                                                        <Terminal className="w-3 h-3 text-blue-400" />
                                                        Live Orchestrator Log
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        {luxScalerState.sessionFolder && (
                                                            <span className="text-[7px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-tighter">
                                                                Sesion: {luxScalerState.sessionFolder.split('/').pop()}
                                                            </span>
                                                        )}
                                                        <span className="text-[8px] font-mono text-gray-600">
                                                            {Object.keys(luxScalerState.tiles).filter(k => luxScalerState.tiles[k].status === 'done').length}/{luxScalerState.gridCols * luxScalerState.gridRows}
                                                        </span>
                                                    </div>
                                                </div>
                                                {luxScalerState.sessionFolder && (
                                                    <div className="px-2 py-1 bg-blue-500/5 border-b border-white/5 text-[7px] font-mono text-gray-500 truncate">
                                                        <span className="opacity-50">Storage:</span> {luxScalerState.sessionFolder}
                                                    </div>
                                                )}
                                                <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-[9px]">
                                                    {Object.keys(luxScalerState.tiles).length === 0 ? (
                                                        <div className="text-gray-700 text-center mt-4 italic">Esperando inicialización...</div>
                                                    ) : (
                                                        Object.entries(luxScalerState.tiles).map(([key, tile]) => {
                                                            const [row, col] = key.split('-').map(Number);
                                                            if (!tile) return null;

                                                            return (
                                                                <div key={key} className={`border-l-2 pl-2 ${tile.status === 'done' ? 'border-green-500' :
                                                                    tile.status === 'processing' ? 'border-blue-500' :
                                                                        tile.status === 'error' ? 'border-red-500' : 'border-gray-800'
                                                                    }`}>
                                                                    <div className="flex justify-between text-white/80">
                                                                        <span className="font-bold">Celda [{row},{col}]</span>
                                                                        <span className={`uppercase ${tile.status === 'done' ? 'text-green-400' :
                                                                            tile.status === 'processing' ? 'text-blue-400 animate-pulse' :
                                                                                tile.status === 'error' ? 'text-red-400' : 'text-gray-600'
                                                                            }`}>{tile.status}</span>
                                                                    </div>
                                                                    {tile.debug && (
                                                                        <div className="mt-1 space-y-1">
                                                                            {tile.debug.generatedPrompt && (
                                                                                <div className="text-gray-500 break-words">
                                                                                    <span className="text-blue-500/50">PROMPT:</span> <span className="text-gray-400">{tile.debug.generatedPrompt.substring(0, 120)}...</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {(tile.debug?.inputUrl || tile.debug?.outputUrl) && (
                                                                        <div className="mt-2 text-[7px] border-t border-white/5 pt-1">
                                                                            <div className="flex gap-2">
                                                                                {/* INPUT (Corte) */}
                                                                                {tile.debug?.inputUrl && (
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <span className="text-gray-500 uppercase block mb-0.5">Antes (Input)</span>
                                                                                        <a href={tile.debug.inputUrl} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded border border-white/10 bg-black">
                                                                                            <img src={tile.debug.inputUrl} crossOrigin="anonymous" className="w-full aspect-square object-contain" />
                                                                                            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                        </a>
                                                                                    </div>
                                                                                )}

                                                                                {/* ARROW */}
                                                                                <div className="flex flex-col justify-center text-gray-600">
                                                                                    <ArrowRight className="w-3 h-3" />
                                                                                </div>

                                                                                {/* OUTPUT (Upscale) */}
                                                                                <div className="flex-1 min-w-0">
                                                                                    <span className="text-green-500 uppercase block mb-0.5">Después (AI)</span>
                                                                                    {tile.data || tile.debug?.outputUrl ? (
                                                                                        <a href={tile.debug?.outputUrl || '#'} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded border border-green-500/20 bg-black">
                                                                                            <img src={tile.debug?.outputUrl || `data:image/png;base64,${tile.data}`} crossOrigin="anonymous" className="w-full aspect-square object-contain" />
                                                                                        </a>
                                                                                    ) : (
                                                                                        <div className="w-full aspect-square rounded border border-gray-800 bg-black/50 flex items-center justify-center animate-pulse">
                                                                                            <Loader2 className="w-3 h-3 text-gray-600" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {/* DETAILED METADATA LINKS */}
                                                                            <div className="mt-1 flex flex-col gap-0.5 text-[6px] font-mono opacity-50 hover:opacity-100 transition-opacity">
                                                                                {tile.debug?.inputUrl && (
                                                                                    <a href={tile.debug.inputUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 truncate">
                                                                                        IN: ...{tile.debug.inputUrl.split('/').pop()}
                                                                                    </a>
                                                                                )}
                                                                                {tile.debug?.outputUrl && (
                                                                                    <a href={tile.debug.outputUrl} target="_blank" rel="noopener noreferrer" className="hover:text-green-300 truncate">
                                                                                        OUT: ...{tile.debug.outputUrl.split('/').pop()}
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                    }
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-black/60 border border-white/10 rounded p-2 overflow-y-auto font-mono text-[8px] space-y-0.5 min-h-[80px]">
                                                <div className="text-gray-600 border-b border-white/5 pb-1 mb-1 font-bold uppercase">📋 Log de Operaciones</div>
                                                {luxScalerState.logs.length === 0 ? (
                                                    <div className="text-gray-600">Esperando acciones...</div>
                                                ) : (
                                                    luxScalerState.logs.map((log, i) => (
                                                        <div key={i} className={`${log.includes('✅') ? 'text-green-400' :
                                                            log.includes('âŒ') ? 'text-red-400' :
                                                                log.includes('â³') ? 'text-blue-400' :
                                                                    log.includes('📦') ? 'text-yellow-400' :
                                                                        log.includes('âœ‚ï¸') ? 'text-orange-400' : 'text-gray-400'
                                                            }`}>{log}</div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>)
                }

                {/* --- TAB: THEME_DESIGNER --- */}
                {
                    currentTab === 'THEME_DESIGNER' && (
                        <div className="flex-1 overflow-hidden animate-[fadeIn_0.3s]">
                            <ThemeDesigner />
                        </div>
                    )
                }
            </div >
            {/* ENVIRONMENT BADGE - WEB ADMIN */}
            < div className="fixed bottom-4 right-4 z-50 bg-black/80 backdrop-blur border border-lumen-gold/30 px-3 py-1.5 rounded-full shadow-2xl pointer-events-none flex items-center gap-2" >
                <div className="w-2 h-2 bg-lumen-gold rounded-full animate-pulse"></div>
                <span className="text-[9px] font-mono text-lumen-gold font-bold uppercase tracking-widest">
                    🛠️ EDITING: WEB ADMIN PANEL
                </span>
            </div >
        </AdminLayout >
    );
};
