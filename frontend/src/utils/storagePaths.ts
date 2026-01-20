import { Session } from '@supabase/supabase-js';

/**
 * UTILS PARA RUTAS DE ALMACENAMIENTO ESTÁNDAR
 */

export const getUserHandle = (session: Session | null): string | null => {
    if (!session?.user?.email) return null;
    // "usa.jose.fernan@gmail.com" → "usajosefernan"
    return session.user.email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
};

export const getReadableTimestamp = (): string => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

export const createSessionFolder = (userHandle: string): string => {
    return `upscaler/${userHandle}/${getReadableTimestamp()}`;
};

// Paths estandarizados dentro de la sesión
export const paths = {
    corte: (folder: string, row: number, col: number) =>
        `${folder}/CORTE_${row}_${col}.png`,

    tile: (folder: string, row: number, col: number) =>
        `${folder}/TILE_${row}_${col}.png`,

    master: (folder: string) =>
        `${folder}/RESULTADO_MAESTRO.png`,
};
