/**
 * LuxScaler v41 - Biopsy Engine
 * Genera 4 crops quirúrgicos de la imagen:
 * - Thumbnail (1024px): Contexto completo
 * - Center (512x512): Zona central más importante
 * - Shadow (512x512): Región más oscura
 * - Detail (512x512): Región de mayor entropía (textura)
 * 
 * Total: ~200-400KB vs 50-200MB original
 */

export interface BiopsyPayload {
  thumbnail_base64: string;
  center_base64: string;
  shadow_base64: string;
  detail_base64: string;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Convierte blob a base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remover el prefijo data:image/jpeg;base64,
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Crop en coordenadas específicas
 */
async function cropAt(
  bitmap: ImageBitmap,
  x: number,
  y: number,
  size: number,
  quality: number
): Promise<Blob> {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  
  // Dibujar crop
  ctx.drawImage(
    bitmap,
    x, y, size, size,  // Source
    0, 0, size, size   // Destination
  );
  
  return await canvas.convertToBlob({
    type: 'image/jpeg',
    quality
  });
}

/**
 * Encuentra la región más oscura de la imagen
 */
async function findDarkestRegion(
  bitmap: ImageBitmap,
  regionSize: number
): Promise<{ x: number; y: number }> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  const data = imageData.data;
  
  let minBrightness = Infinity;
  let bestX = 0, bestY = 0;
  
  // Barrer en bloques para eficiencia
  const step = Math.max(regionSize, 100);
  
  for (let y = 0; y < bitmap.height - regionSize; y += step) {
    for (let x = 0; x < bitmap.width - regionSize; x += step) {
      // Sample 50 píxeles aleatorios en este bloque
      let totalBrightness = 0;
      
      for (let sample = 0; sample < 50; sample++) {
        const px = Math.floor(x + Math.random() * regionSize);
        const py = Math.floor(y + Math.random() * regionSize);
        const idx = (py * bitmap.width + px) * 4;
        
        // Luminancia
        totalBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      }
      
      const avgBrightness = totalBrightness / 50;
      
      if (avgBrightness < minBrightness) {
        minBrightness = avgBrightness;
        bestX = x;
        bestY = y;
      }
    }
  }
  
  return { x: bestX, y: bestY };
}

/**
 * Encuentra la región de mayor entropía (más textura/detalle)
 */
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
  
  const step = Math.max(regionSize, 100);
  
  for (let y = 0; y < bitmap.height - regionSize; y += step) {
    for (let x = 0; x < bitmap.width - regionSize; x += step) {
      // Construir histograma de luminancia (10 bins)
      const histogram = new Map<number, number>();
      
      for (let sample = 0; sample < 50; sample++) {
        const px = Math.floor(x + Math.random() * regionSize);
        const py = Math.floor(y + Math.random() * regionSize);
        const idx = (py * bitmap.width + px) * 4;
        
        const gray = Math.floor((data[idx] + data[idx + 1] + data[idx + 2]) / 3 / 25);
        histogram.set(gray, (histogram.get(gray) || 0) + 1);
      }
      
      // Calcular entropía Shannon: -Σ(p * log2(p))
      let entropy = 0;
      for (const count of histogram.values()) {
        const p = count / 50;
        if (p > 0) {
          entropy -= p * Math.log2(p);
        }
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

/**
 * Genera el payload de biopsia completo
 */
export async function generateBiopsyPayload(file: File): Promise<BiopsyPayload> {
  console.log('[BiopsyEngine] Generating biopsy payload...');
  
  // PASO 1: Crear bitmap desde File
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  
  console.log(`[BiopsyEngine] Original size: ${width}x${height}`);
  
  // Validación: Límite de 19.5MP
  if (width * height > 19.5e6) {
    throw new Error('Image exceeds 19.5MP limit');
  }
  
  // PASO 2: THUMBNAIL (1024px max)
  const thumbWidth = Math.min(1024, width);
  const thumbHeight = Math.floor(thumbWidth * (height / width));
  
  const thumbCanvas = new OffscreenCanvas(thumbWidth, thumbHeight);
  const thumbCtx = thumbCanvas.getContext('2d')!;
  thumbCtx.drawImage(bitmap, 0, 0, thumbWidth, thumbHeight);
  
  const thumbBlob = await thumbCanvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.85
  });
  
  const thumbnail_base64 = await blobToBase64(thumbBlob);
  
  // PASO 3: CENTER CROP (512x512)
  const centerX = Math.max(0, Math.floor(width / 2 - 256));
  const centerY = Math.max(0, Math.floor(height / 2 - 256));
  const centerSize = Math.min(512, width, height);
  
  const centerCrop = await cropAt(bitmap, centerX, centerY, centerSize, 0.85);
  const center_base64 = await blobToBase64(centerCrop);
  
  // PASO 4: SHADOW CROP (512x512 - región más oscura)
  console.log('[BiopsyEngine] Finding darkest region...');
  const shadowCoords = await findDarkestRegion(bitmap, 512);
  const shadowCrop = await cropAt(bitmap, shadowCoords.x, shadowCoords.y, 512, 0.85);
  const shadow_base64 = await blobToBase64(shadowCrop);
  
  // PASO 5: DETAIL CROP (512x512 - mayor entropía)
  console.log('[BiopsyEngine] Finding highest entropy region...');
  const detailCoords = await findHighEntropyRegion(bitmap, 512);
  const detailCrop = await cropAt(bitmap, detailCoords.x, detailCoords.y, 512, 0.85);
  const detail_base64 = await blobToBase64(detailCrop);
  
  console.log('[BiopsyEngine] Biopsy payload generated successfully');
  
  return {
    thumbnail_base64,
    center_base64,
    shadow_base64,
    detail_base64,
    originalWidth: width,
    originalHeight: height
  };
}
