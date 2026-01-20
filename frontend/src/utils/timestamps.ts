/**
 * Genera un timestamp legible para nombres de archivos
 * Formato: YYYYMMDD_HHMMSS
 * Ejemplo: 20260113_203254
 */
export const getReadableTimestamp = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

/**
 * Genera un timestamp ISO legible para carpetas
 * Formato: YYYY-MM-DD_HH-MM-SS
 * Ejemplo: 2026-01-13_20-32-54
 */
export const getISOTimestamp = (): string => {
    const now = new Date();
    return now.toISOString()
        .replace(/T/, '_')
        .replace(/:/g, '-')
        .split('.')[0];
};
