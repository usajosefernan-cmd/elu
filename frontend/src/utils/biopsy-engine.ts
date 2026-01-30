
export interface BiopsyPayload {
    thumbnail_base64: string;        // Thumbnail como base64 para Gemini
    center_base64: string;           // Center crop para generación
    shadow_base64: string;           // Shadow para debugging
    detail_base64: string;           // Detail para análisis de textura
    originalWidth: number;
    originalHeight: number;
}

export async function generateBiopsyPayload(file: File): Promise<BiopsyPayload> {
    // PASO 1: Crear bitmap desde File
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // VALIDACIÓN: Límite lógico (no hardcodeado)
    if (width * height > 19.5e6) {
        throw new Error('Image exceeds 19.5MP limit');
    }

    // PASO 2: THUMBNAIL (Downscale al contexto)
    // Proposito: Darle a Gemini la composición completa sin perder aspecto
    const thumbCanvas = new OffscreenCanvas(1024, 1024 * (height / width));
    const thumbCtx = thumbCanvas.getContext('2d')!;
    thumbCtx.drawImage(bitmap, 0, 0, 1024, 1024 * (height / width));
    const thumbBlob = await thumbCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
    const thumbnail_base64 = await blobToBase64(thumbBlob);

    // PASO 3: CENTER CROP (512x512 desde el centro)
    // Proposito: La zona "más importante" típicamente es el centro
    const centerX = Math.max(0, width / 2 - 256);
    const centerY = Math.max(0, height / 2 - 256);
    const centerCrop = await cropAt(bitmap, centerX, centerY, 512, 0.85);
    const center_base64 = await blobToBase64(centerCrop);

    // PASO 4: SHADOW CROP (512x512 desde la región más oscura)
    // Proposito: Descubrir si el motor puede recuperar detalles en sombras
    // Algoritmo: Barrer la imagen en bloques, encontrar el que tenga menor promedio de luminancia
    const shadowCoords = await findDarkestRegion(bitmap, 512);
    const shadowCrop = await cropAt(bitmap, shadowCoords.x, shadowCoords.y, 512, 0.85);
    const shadow_base64 = await blobToBase64(shadowCrop);

    // PASO 5: DETAIL CROP (512x512 desde la región de mayor entropía)
    // Proposito: Descubrir si el motor preserva texturas finas (poros, telas, detalles)
    // Algoritmo: Calcular entropía Shannon en bloques (varianza de píxeles)
    const detailCoords = await findHighEntropyRegion(bitmap, 512);
    const detailCrop = await cropAt(bitmap, detailCoords.x, detailCoords.y, 512, 0.85);
    const detail_base64 = await blobToBase64(detailCrop);

    // Retornar payload comprimido
    return {
        thumbnail_base64,
        center_base64,
        shadow_base64,
        detail_base64,
        originalWidth: width,
        originalHeight: height
    };
}

async function cropAt(bitmap: ImageBitmap, x: number, y: number, size: number, quality: number): Promise<Blob> {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, x, y, size, size, 0, 0, size, size);
    return await canvas.convertToBlob({ type: 'image/jpeg', quality });
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                // Remove data:image/jpeg;base64, prefix
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Helper 1: Encontrar Región Más Oscura
async function findDarkestRegion(
    bitmap: ImageBitmap,
    regionSize: number
): Promise<{ x: number; y: number }> {
    // Note: In a real implementation this might need optimization for very large images.
    // However, OffscreenCanvas is quite fast.
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    const data = imageData.data;

    let minBrightness = Infinity;
    let bestX = 0, bestY = 0;

    // Barrer en bloques de regionSize para eficiencia
    // We step regionSize/2 to allow overlap? No, document says step by regionSize implies no overlap or just checking grid.
    // The document loop uses regionSize as step.
    for (let y = 0; y < bitmap.height - regionSize; y += regionSize) {
        for (let x = 0; x < bitmap.width - regionSize; x += regionSize) {

            // Sample 100 píxeles aleatorios en este bloque
            let totalBrightness = 0;
            for (let sample = 0; sample < 100; sample++) {
                const px = x + Math.random() * regionSize;
                const py = y + Math.random() * regionSize;
                const idx = (Math.floor(py) * bitmap.width + Math.floor(px)) * 4;

                // Luminancia = (R + G + B) / 3
                totalBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            }
            const avgBrightness = totalBrightness / 100;

            if (avgBrightness < minBrightness) {
                minBrightness = avgBrightness;
                bestX = x;
                bestY = y;
            }
        }
    }

    return { x: bestX, y: bestY };
}

// Helper 2: Encontrar Región de Alta Entropía
async function findHighEntropyRegion(
    bitmap: ImageBitmap,
    regionSize: number
): Promise<{ x: number; y: number }> {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    const data = imageData.data;

    let maxEntropy = -Infinity;
    let bestX = 0, bestY = 0;

    for (let y = 0; y < bitmap.height - regionSize; y += regionSize) {
        for (let x = 0; x < bitmap.width - regionSize; x += regionSize) {

            // Construir histograma de luminancia (10 bins) - Wait code says map
            const histogram = new Map<number, number>();

            for (let sample = 0; sample < 100; sample++) {
                const px = x + Math.random() * regionSize;
                const py = y + Math.random() * regionSize;
                const idx = (Math.floor(py) * bitmap.width + Math.floor(px)) * 4;

                const gray = Math.round((data[idx] + data[idx + 1] + data[idx + 2]) / 3 / 25);
                histogram.set(gray, (histogram.get(gray) ?? 0) + 1);
            }

            // Calcular entropía Shannon: -Σ(p * log2(p))
            let entropy = 0;
            for (const count of histogram.values()) {
                const p = count / 100;
                entropy -= p * Math.log2(p + 1e-10);
            }

            if (entropy > maxEntropy) {
                maxEntropy = entropy;
                bestX = x;
                bestY = y;
            }
        }
    }

    return { x: bestX, y: bestY };
}
