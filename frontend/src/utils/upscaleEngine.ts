import { UpscalerTileCalculator, CalculationResult } from './luxScalerCalculator';
import { getSupabaseClient } from '../services/authService';
import { paths, getUserHandle, createSessionFolder } from './storagePaths';

// PLIEGOS REALES (CONTRATO)
export const SHEETS = [
    { name: '16:9', w: 5120, h: 2880, ratio: 1.777 },
    { name: '21:9', w: 6400, h: 2740, ratio: 2.335 },
    { name: '9:16', w: 2880, h: 5120, ratio: 0.562 },
];

export interface TileInfo {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    xStartPct: number;
    xEndPct: number;
    yStartPct: number;
    yEndPct: number;
    edgeInfo: string;
}

export interface UpscaleJob {
    imageData: string;
    imageMime: string;
    scale: number;
    sessionFolder?: string;
    tiles: Record<string, {
        status: 'pending' | 'processing' | 'done' | 'error';
        data?: string;
        outputUrl?: string;
        error?: string;
    }>;
    gridCols: number;
    gridRows: number;
    imgWidth: number;
    imgHeight: number;
    targetWidth: number;
    targetHeight: number;
    contextUrl?: string;
    calculation?: CalculationResult;
}

/**
 * Elige el pliego óptimo basado en aspect ratio
 */
export const chooseSheet = (targetW: number, targetH: number) => {
    const ratio = targetW / targetH;
    return SHEETS.reduce((prev, curr) =>
        Math.abs(curr.ratio - ratio) < Math.abs(prev.ratio - ratio) ? curr : prev
    );
};

export function calculateUpscaleParams(
    imgWidth: number,
    imgHeight: number,
    scale: number
): {
    targetWidth: number;
    targetHeight: number;
    calculation: CalculationResult;
} {
    const targetWidth = Math.round(imgWidth * scale);
    const targetHeight = Math.round(imgHeight * scale);

    const sheet = chooseSheet(targetWidth, targetHeight);

    // Forzamos el uso del pliego seleccionado en el calculador
    const calculation = UpscalerTileCalculator.calculate(imgWidth, imgHeight, Math.max(targetWidth, targetHeight));

    // Sobrescribimos con los datos del pliego real para el grid
    (calculation as any).tile_info = { w: sheet.w, h: sheet.h };
    calculation.tile_name = sheet.name;
    calculation.grid_h = Math.ceil(targetWidth / sheet.w);
    calculation.grid_v = Math.ceil(targetHeight / sheet.h);
    calculation.total_tiles = calculation.grid_h * calculation.grid_v;

    return {
        targetWidth,
        targetHeight,
        calculation
    };
}

export function getTileCoordinates(
    row: number,
    col: number,
    totalRows: number,
    totalCols: number,
    imgWidth: number,
    imgHeight: number
): TileInfo {
    const tileWidth = imgWidth / totalCols;
    const tileHeight = imgHeight / totalRows;

    const x0 = Math.floor(col * tileWidth);
    const y0 = Math.floor(row * tileHeight);
    const x1 = col === totalCols - 1 ? imgWidth : Math.floor((col + 1) * tileWidth);
    const y1 = row === totalRows - 1 ? imgHeight : Math.floor((row + 1) * tileHeight);

    return {
        x0, y0, x1, y1,
        xStartPct: (x0 / imgWidth) * 100,
        xEndPct: (x1 / imgWidth) * 100,
        yStartPct: (y0 / imgHeight) * 100,
        yEndPct: (y1 / imgHeight) * 100,
        edgeInfo: '' // Simplificado para refactor
    };
}

/**
 * Convierte un tile a un canvas con el ratio del pliego destino,
 * usando LETTERBOX (padding negro) en vez de stretch.
 * Así Nanobananapro recibe algo que ya es 16:9/21:9/9:16.
 */
function padTileToSheetRatio(
    sourceCanvas: HTMLCanvasElement,
    sheetW: number,
    sheetH: number
): HTMLCanvasElement {
    const srcW = sourceCanvas.width;
    const srcH = sourceCanvas.height;
    const srcRatio = srcW / srcH;
    const sheetRatio = sheetW / sheetH;

    const padded = document.createElement('canvas');
    const ctx = padded.getContext('2d')!;

    // El canvas "padded" tendrá el ratio del pliego
    // pero con tamaño proporcional al input (no el pliego entero)
    let paddedW: number, paddedH: number;
    let dx: number, dy: number, dw: number, dh: number;

    if (srcRatio > sheetRatio) {
        // Input más ancho → añadir barras arriba/abajo
        paddedW = srcW;
        paddedH = Math.round(srcW / sheetRatio);
        dx = 0;
        dy = Math.round((paddedH - srcH) / 2);
        dw = srcW;
        dh = srcH;
    } else {
        // Input más alto → añadir barras izq/der
        paddedH = srcH;
        paddedW = Math.round(srcH * sheetRatio);
        dx = Math.round((paddedW - srcW) / 2);
        dy = 0;
        dw = srcW;
        dh = srcH;
    }

    padded.width = paddedW;
    padded.height = paddedH;

    // Fondo negro
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, paddedW, paddedH);

    // Dibujar el contenido centrado
    ctx.drawImage(sourceCanvas, dx, dy, dw, dh);

    return padded;
}

export async function splitAndUploadTiles(
    imageElement: HTMLImageElement,
    job: UpscaleJob,
    onProgress: (log: string) => void
): Promise<{ tiles: Record<string, string>; folder: string; contextUrl: string }> {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userHandle = getUserHandle(session) || 'guest';
    const folder = createSessionFolder(userHandle);

    onProgress(`🔐 Sesión: ${folder}`);

    const tiles: Record<string, string> = {};
    const naturalW = imageElement.naturalWidth;
    const naturalH = imageElement.naturalHeight;

    // Obtener el pliego elegido para este job
    const sheet = chooseSheet(job.targetWidth, job.targetHeight);
    onProgress(`📐 Pliego elegido: ${sheet.name} (${sheet.w}×${sheet.h})`);

    const inputTileW = Math.ceil(naturalW / job.gridCols);
    const inputTileH = Math.ceil(naturalH / job.gridRows);

    for (let r = 0; r < job.gridRows; r++) {
        for (let c = 0; c < job.gridCols; c++) {
            const x = Math.floor(c * inputTileW);
            const y = Math.floor(r * inputTileH);
            const w = (c === job.gridCols - 1) ? naturalW - x : inputTileW;
            const h = (r === job.gridRows - 1) ? naturalH - y : inputTileH;

            // 1. Cortar el tile original
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = w;
            tileCanvas.height = h;
            const tileCtx = tileCanvas.getContext('2d');
            if (tileCtx) tileCtx.drawImage(imageElement, x, y, w, h, 0, 0, w, h);

            // 2. NUEVO: Aplicar padding al ratio del pliego
            const paddedCanvas = padTileToSheetRatio(tileCanvas, sheet.w, sheet.h);
            onProgress(`📦 Tile [${r},${c}]: ${w}×${h} → padded ${paddedCanvas.width}×${paddedCanvas.height}`);

            // 3. Subir el tile CON PADDING
            const blob = await new Promise<Blob | null>(res => paddedCanvas.toBlob(res, 'image/png'));
            if (blob) {
                const filePath = paths.corte(folder, r, c);
                await supabase.storage.from('lux-storage').upload(filePath, blob);
                const { data } = supabase.storage.from('lux-storage').getPublicUrl(filePath);
                tiles[`${r}-${c}`] = data.publicUrl;
                onProgress(`✅ CORTE [${r},${c}] subido (padded)`);
            }
        }
    }

    // --- NUEVO: Subir imagen original para contexto ---
    onProgress(`📤 Subiendo imagen original para contexto...`);
    const originalBlob = await new Promise<Blob | null>(res => {
        const canvas = document.createElement('canvas');
        canvas.width = naturalW;
        canvas.height = naturalH;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(imageElement, 0, 0);
        canvas.toBlob(res, 'image/png');
    });

    let contextUrl = '';
    if (originalBlob) {
        const originalPath = `${folder}/MAESTRO_ORIGINAL.png`;
        await supabase.storage.from('lux-storage').upload(originalPath, originalBlob);
        const { data } = supabase.storage.from('lux-storage').getPublicUrl(originalPath);
        contextUrl = data.publicUrl;
    }

    return { tiles, folder, contextUrl };
}

export async function mergeTilesWithCoverCrop(
    job: UpscaleJob,
    tiles: Record<string, { data?: string; outputUrl?: string }>,
    onProgress: (log: string) => void
): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = job.targetWidth;
    canvas.height = job.targetHeight;
    const ctx = canvas.getContext('2d')!;

    for (const key of Object.keys(tiles)) {
        const tile = tiles[key];
        const [r, c] = key.split('-').map(Number);
        const dst = getTileCoordinates(r, c, job.gridRows, job.gridCols, job.targetWidth, job.targetHeight);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = tile.outputUrl || `data:image/png;base64,${tile.data}`;
        await new Promise((res) => { img.onload = res; });

        // DRAW IMAGE COVER (Object-fit equivalent)
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const slotW = dst.x1 - dst.x0;
        const slotH = dst.y1 - dst.y0;

        const slotRatio = slotW / slotH;
        const imgRatio = iw / ih;
        let sx = 0, sy = 0, sw = iw, sh = ih;

        if (imgRatio > slotRatio) {
            sw = ih * slotRatio;
            sx = (iw - sw) / 2;
        } else {
            sh = iw / slotRatio;
            sy = (ih - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, dst.x0, dst.y0, slotW, slotH);
        onProgress(`🧩 Pegado TILE [${r},${c}]`);
    }

    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
    if (!blob) throw new Error('No se pudo generar master');

    const supabase = getSupabaseClient();
    const finalPath = paths.master(job.sessionFolder!);
    await supabase.storage.from('lux-storage').upload(finalPath, blob, { upsert: true });

    onProgress(`🔥 RESULTADO_MAESTRO listo`);
    return (supabase.storage.from('lux-storage').getPublicUrl(finalPath)).data.publicUrl;
}

