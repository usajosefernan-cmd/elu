
/**
 * UTILITY: SMART IMAGE OPTIMIZATION
 * Handles the distinction between "Display" (UI) and "Master" (Download/Inspect) URLs.
 * Implements the "Pure Speed Architecture": WebP 80% + Resize.
 */

// Check if URL is from our Supabase Storage to apply transforms
const isSupabaseUrl = (url: string) => url.includes('supabase.co') && url.includes('/storage/v1/object/public');

/**
 * Returns a lightweight WebP version of the image for UI display.
 * @param url The original high-res URL
 * @param width Target width (default 1920px for Full HD landing experience)
 * @param quality Compression quality (default 80 for optimal speed/quality balance)
 */
export const getDisplayUrl = (url: string | null, width: number = 1920, quality: number = 80): string => {
    if (!url) return '';
    if (!isSupabaseUrl(url)) return url; // Return as-is if blob/external

    // Clean existing params and force extension update
    let cleanUrl = url.split('?')[0];

    // NOTE: Do NOT change file extension - Supabase CDN handles format conversion via params

    // Append Supabase Transformation params (CDN Logic)
    // width: Resize to target to avoid loading 8K masters on the web
    // quality: 80 is the sweet spot recommended for WebP
    // format: force WebP (lighter than PNG/JPG)
    return `${cleanUrl}?width=${width}&quality=${quality}&format=webp&resize=contain`;
};

/**
 * Returns the raw, untouched original file URL for downloading or 1:1 inspection.
 * Strips any transformation parameters.
 */
export const getMasterUrl = (url: string | null): string => {
    if (!url) return '';
    return url.split('?')[0];
};

/**
 * Generates a tiny thumbnail for lists/grids.
 */
export const getThumbnailUrl = (url: string | null): string => {
    if (!url) return '';
    if (!isSupabaseUrl(url)) return url;
    let cleanUrl = url.split('?')[0];
    // NOTE: Do NOT change file extension - Supabase CDN handles format conversion via params
    return `${cleanUrl}?width=400&quality=50&format=webp&resize=cover`;
};
