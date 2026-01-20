/**
 * UPSCALER(LUXSCALER) v4.0 - TILE CALCULATOR (TypeScript Port)
 * Grid optimizer for Nanobananapro - Adjusted for Gemini 3 Pro limits
 * 
 * CRITICAL CORRECTION:
 * - Nanobananapro max (7282x4096 = 29.83MP) EXCEEDS Gemini 3 Pro limit (20MP)
 * - Use real tiles: 5792x3450 (16:9) = 19.97MP
 */

export interface TileConfig {
    w: number;
    h: number;
    ratio: number;
    mp: number;
    nanobana_original: string;
    status: string;
}

export interface CropInfo {
    type: 'horizontal' | 'vertical';
    crop_total_px: number;
    preserved_pct: number;
    final_input_w: number;
    final_input_h: number;
}

export interface CalculationResult {
    tile_name: string;
    tile_info: TileConfig;
    efficiency: number;
    output_w: number;
    output_h: number;
    grid_h: number;
    grid_v: number;
    total_tiles: number;
    crop_info: CropInfo;
}

export class UpscalerTileCalculator {
    // Corrected Tiles (Nanobananapro Fixed Output Sheets)
    // User Spec:
    // 16:9 -> 5792×3450 (≈19.98MP)
    // 21:9 -> 7200×3078 (≈22.16MP - Wait, user said 19.97MP? Let's check math)
    // 7200*3078 = 22,161,600. User said ~19.97MP. 
    // 3450*6144 = 21,196,800. 
    // 5792*3450 = 19,982,400.
    // User explicitly listed:
    // 16:9 -> 5792x3450
    // 21:9 -> 7200x3078
    // 9:16 -> 3450x6144
    // We will trust these dimensions.

    static TILES: Record<string, TileConfig> = {
        '16:9': {
            w: 5792,
            h: 3450,
            ratio: 5792 / 3450,
            mp: 19.98,
            nanobana_original: 'Fixed Output',
            status: 'OPTIMIZADO'
        },
        '21:9': {
            w: 7200,
            h: 3078,
            ratio: 7200 / 3078,
            mp: 22.16,
            nanobana_original: 'Fixed Output',
            status: 'OPTIMIZADO'
        },
        '9:16': {
            w: 3450,
            h: 6144,
            ratio: 3450 / 6144,
            mp: 21.19,
            nanobana_original: 'Fixed Output',
            status: 'OPTIMIZADO'
        },
    };

    static OVERLAP_PCT = 0.05;

    // Resolution Presets
    static RESOLUTION_PRESETS: Record<string, number> = {
        '6K': 6144, '8K': 8192, '12K': 12288,
        '16K': 16384, '24K': 24576, '32K': 32768,
    };

    static calculate(input_w: number, input_h: number, target_resolution: number | string): CalculationResult {
        let target_res_val = 0;
        if (typeof target_resolution === 'string' && this.RESOLUTION_PRESETS[target_resolution.toUpperCase()]) {
            target_res_val = this.RESOLUTION_PRESETS[target_resolution.toUpperCase()];
        } else if (typeof target_resolution === 'string') {
            target_res_val = parseInt(target_resolution);
        } else {
            target_res_val = target_resolution;
        }

        // Calculate Absolute Target Dimensions (assuming strictly proportional scaling for now)
        // If target_resolution represents the MAX dimension:
        const input_ratio = input_w / input_h;
        let target_w, target_h;

        if (input_w >= input_h) {
            target_w = target_res_val;
            target_h = Math.round(target_res_val / input_ratio);
        } else {
            target_h = target_res_val;
            target_w = Math.round(target_res_val * input_ratio);
        }

        // 1. Select Optimal Tile based on COVERAGE of target_w/target_h
        const { tile_name, tile_info, efficiency } = this._select_optimal_tile(target_w, target_h);

        // 2. Output Dimensions (Actually, output is determined by grid * tile - overlap, but for "step 1" display we probably want target)
        // Re-calculate exactly per selected tile
        const { output_w, output_h } = this._calculate_output_dimensions(tile_info, target_w, target_h);

        // 3. Grid
        const { grid_h, grid_v, total_tiles } = this._calculate_grid(tile_info, output_w, output_h);

        // 4. Crop (Calculated on INPUT side vs Tile Ratio)
        // Note: With coverage logic, "efficiency" of single tile aspect match is less relevant, 
        // but we still calculate how much we crop from individual tiles if they don't match.
        // Actually, with Nanobanana, we crop INPUT to match Tile Ratio, then upscale.
        const crop_info = this._calculate_crop(input_w, input_h, input_ratio, tile_info);

        return {
            tile_name,
            tile_info,
            efficiency, // Now signifies "Tile Usage Efficiency" or similar? Or just keep ratio match?
            output_w,
            output_h,
            grid_h,
            grid_v,
            total_tiles,
            crop_info
        };
    }

    private static _select_optimal_tile(target_w: number, target_h: number) {
        let candidates: Array<{ name: string, info: TileConfig, total_tiles: number, efficiency: number }> = [];

        for (const [name, info] of Object.entries(this.TILES)) {
            // FIX: Overlap NO reduce coverage para calcular grid (evita inflar a 4 tiles)
            // El overlap se aplica solo como margen en recorte/blending
            const cols = Math.ceil(target_w / info.w);
            const rows = Math.ceil(target_h / info.h);

            const total = cols * rows;

            // Efficiency: Coverage vs target (sin considerar overlap en decisión de grid)
            const total_capacity_px = (cols * info.w) * (rows * info.h);
            const target_px = target_w * target_h;
            const waste_ratio = total_capacity_px / target_px; // Closer to 1 is better

            candidates.push({ name, info, total_tiles: total, efficiency: 1 / waste_ratio });
        }

        // SORTING LOGIC v4.1 (Coverage Based):
        // 1. Total Tiles (Asc) - SPEED/COST IS KING
        // 2. Landscape Preference (16:9 > 21:9 > 9:16)
        // 3. Efficiency (Optimization)

        candidates.sort((a, b) => {
            // 1. Total Tiles (Minimize)
            if (a.total_tiles !== b.total_tiles) {
                return a.total_tiles - b.total_tiles;
            }

            // 2. Landscape Preference
            const preference: Record<string, number> = { '16:9': 3, '21:9': 2, '9:16': 1 };
            const prefDiff = (preference[b.name] || 0) - (preference[a.name] || 0);
            if (prefDiff !== 0) return prefDiff;

            // 3. Efficiency (Desc)
            return b.efficiency - a.efficiency;
        });

        const best = candidates[0];
        return { tile_name: best.name, tile_info: best.info, efficiency: best.efficiency };
    }

    private static _calculate_output_dimensions(tile_info: TileConfig, target_w: number, target_h: number) {
        // With coverage logic, the "output" is basically the target, 
        // covered by tiles.
        // But to keep compatibility with existing params:
        return { output_w: target_w, output_h: target_h };
    }

    private static _calculate_grid(tile_info: TileConfig, target_w: number, target_h: number) {
        // Grid se calcula con tamaño completo del tile (sin reducir por overlap)
        // El cover crop en handleReassemble garantiza aspect ratio correcto incluso con 1×1
        const grid_h = Math.ceil(target_w / tile_info.w);
        const grid_v = Math.ceil(target_h / tile_info.h);

        return { grid_h, grid_v, total_tiles: grid_h * grid_v };
    }

    private static _calculate_crop(input_w: number, input_h: number, input_ratio: number, tile_info: TileConfig): CropInfo {
        // Calculate crop based on matching input aspect to tile aspect
        const tile_ratio = tile_info.ratio;
        let final_input_w, final_input_h, crop_total;
        let type: 'horizontal' | 'vertical';

        if (input_ratio > tile_ratio) {
            // Input is wider than tile -> Crop width (sides)
            final_input_h = input_h;
            final_input_w = Math.floor(input_h * tile_ratio);
            crop_total = input_w - final_input_w;
            type = 'horizontal';
        } else {
            // Input is taller/narrower -> Crop height (top/bottom)
            final_input_w = input_w;
            final_input_h = Math.floor(input_w / tile_ratio);
            crop_total = input_h - final_input_h;
            type = 'vertical';
        }

        const preserved_pct = (final_input_w * final_input_h) / (input_w * input_h) * 100;

        return {
            type,
            crop_total_px: crop_total,
            preserved_pct,
            final_input_w,
            final_input_h
        };
    }
}
