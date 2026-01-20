/**
 * LUXIFIER STORAGE PROTOCOL (V19.1 - OMNIBUS)
 * Centralized logic for naming and hierarchy according to B_Storage_Naming_Protocol.md
 * Applies to: Previews, Masters (4K/8K), Web-Assets, Metadata, and Lab Results.
 */

export type StorageContext =
    | 'LAB_FORENSIC'
    | 'LUX_SCALER'
    | 'INK_FACTORY'
    | 'PROFILE_ASSETS'
    | 'WEB_ASSETS'
    | 'SYSTEM_CACHE';

export type ResolutionTag = 'PREVIEW_1K' | 'MASTER_4K' | 'MASTER_8K' | 'THUMB' | 'META' | 'ORIGINAL';

/**
 * Builds a standardized storage path following:
 * /{USER_ID} / {CONTEXTO} / {FECHA_ISO} / {SESION_TAG} / {FILENAME}
 */
export function buildStandardStoragePath(
    userId: string,
    context: StorageContext,
    generationId: string,
    fileName: string
): string {
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sessionTag = generationId === 'static' ? 'Common' : `Session_${generationId.substring(0, 8)}`;

    // Pattern: USER_ID/CONTEXT/YYYY-MM-DD/Session_XXXX/filename.ext
    return `${userId}/${context}/${dateStr}/${sessionTag}/${fileName}`;
}

/**
 * Builds a standardized file name following:
 * {BASE_NAME}_{RES_TAG}_{MODIFICADOR}_{VERSION}.{EXT}
 */
export function buildStandardFileName(
    originalUrl: string,
    resTag: ResolutionTag,
    modifier: string = '',
    version: string = 'v1',
    extension: string = 'png'
): string {
    let baseName = 'asset';
    try {
        if (originalUrl.startsWith('data:')) {
            baseName = `upload_${Date.now()}`;
        } else {
            const urlParts = originalUrl.split('/');
            const lastPart = urlParts[urlParts.length - 1].split('?')[0];
            if (lastPart.includes('.')) {
                baseName = lastPart.split('.')[0];
            } else if (lastPart.length > 0) {
                baseName = lastPart;
            }
        }
    } catch (e) {
        baseName = `img_${Date.now()}`;
    }

    // Clean names
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanModifier = modifier.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanExt = extension.replace('.', '').toLowerCase();

    // Pattern construction
    const parts = [cleanBaseName, resTag.toLowerCase()];
    if (cleanModifier) parts.push(cleanModifier);
    parts.push(version);

    return `${parts.join('_')}.${cleanExt}`;
}
