
import { getSupabaseClient } from './authService';
import { GenerationSession, ArchivedVariation } from "../types";

const supabase = getSupabaseClient();

export const uploadImageToSupabase = async (base64Data: string, folder: 'previews' | 'masters' | 'originals'): Promise<string | null> => {
    // NOTE: This logic is now handled inside your Edge Function 'preview-generator'.
    return null; 
};

export const getGenerations = async (): Promise<GenerationSession[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn("History fetch aborted: No active user session.");
        return [];
    }

    try {
        // v41: Consultar desde uploads + analysis_results + generations
        let query = supabase
            .from('uploads')
            .select(`
                id,
                user_id,
                original_width,
                original_height,
                biopsy_urls,
                status,
                created_at,
                analysis_results (
                    cat_code,
                    detected_defects,
                    visual_summary,
                    severity_score,
                    auto_settings
                ),
                generations (
                    id,
                    prompt_used,
                    config_used,
                    watermarked_url,
                    final_url,
                    is_preview,
                    created_at
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
            console.error("Error fetching v41 history:", error);
            return [];
        }
        
        if (!data || data.length === 0) {
            console.log("[History] No uploads found for user");
            return [];
        }
        
        // Transformar a formato legacy para compatibilidad con UI
        const sessions: GenerationSession[] = data
            .filter(upload => upload.generations && upload.generations.length > 0)
            .map(upload => {
                const analysis = Array.isArray(upload.analysis_results) ? upload.analysis_results[0] : upload.analysis_results;
                const generations = Array.isArray(upload.generations) ? upload.generations : [upload.generations];
                
                return {
                    id: upload.id,
                    user_id: upload.user_id,
                    created_at: upload.created_at,
                    original_image_path: upload.biopsy_urls?.thumbnail_base64 
                        ? `data:image/jpeg;base64,${upload.biopsy_urls.thumbnail_base64}`
                        : '',
                    original_image_thumbnail: upload.biopsy_urls?.thumbnail_base64 
                        ? `data:image/jpeg;base64,${upload.biopsy_urls.thumbnail_base64}`
                        : '',
                    category: analysis?.cat_code || 'UNKNOWN',
                    visual_summary: analysis?.visual_summary || '',
                    variations: generations.map((gen: any) => ({
                        id: gen.id,
                        generation_id: upload.id,
                        type: gen.is_preview ? 'preview' : 'final',
                        url: gen.watermarked_url 
                            ? `data:image/jpeg;base64,${gen.watermarked_url}`
                            : (gen.final_url || ''),
                        created_at: gen.created_at,
                        luxmixer_values: gen.config_used || {},
                        prompt_used: gen.prompt_used || ''
                    }))
                };
            });
        
        console.log(`[History v41] Loaded ${sessions.length} sessions with ${sessions.reduce((acc, s) => acc + s.variations.length, 0)} variations`);
        
        return sessions;
        
    } catch (error) {
        console.error("[History v41] Exception:", error);
        return [];
    }
};

export const deleteGeneration = async (id: string) => {
    console.log(`[Delete Protocol] Initiating purge for session: ${id}`);

    // 1. Fetch the generation and variations to get file paths BEFORE deleting DB records
    const { data: generation, error: fetchError } = await supabase
        .from('generations')
        .select(`
            original_image_path,
            original_image_thumbnail,
            variations ( image_path )
        `)
        .eq('id', id)
        .single();

    if (fetchError) {
        console.warn("Could not fetch session details (might already be deleted). Proceeding to force DB delete.", fetchError);
    } else if (generation) {
        // 2. Extract paths for Storage Deletion (Smart Bucket Detection)
        const filesByBucket: Record<string, string[]> = {
            'lux-storage': [],
            'original-photos': []
        };

        // Helper to extract bucket and path from public URL
        const parseUrl = (fullUrl: string) => {
            if (!fullUrl) return;
            try {
                // Typical format: .../storage/v1/object/public/{bucket_name}/{path/to/file}?params
                if (fullUrl.includes('/storage/v1/object/public/')) {
                    const afterPublic = fullUrl.split('/storage/v1/object/public/')[1];
                    const [bucket, ...pathParts] = afterPublic.split('/');
                    const cleanPath = pathParts.join('/').split('?')[0]; // Remove query params
                    
                    if (filesByBucket[bucket]) {
                        filesByBucket[bucket].push(cleanPath);
                    } else {
                        // Dynamically add bucket key if new one encountered
                        filesByBucket[bucket] = [cleanPath];
                    }
                }
            } catch (e) {
                console.warn("Failed to parse URL for deletion:", fullUrl);
            }
        };

        parseUrl(generation.original_image_path);
        parseUrl(generation.original_image_thumbnail);
        
        if (generation.variations) {
            generation.variations.forEach((v: any) => {
                parseUrl(v.image_path);
            });
        }

        // 3. Delete Files from Correct Buckets
        for (const [bucket, paths] of Object.entries(filesByBucket)) {
            if (paths.length > 0) {
                console.log(`Deleting ${paths.length} files from bucket: ${bucket}`);
                const { error: storageError } = await supabase.storage
                    .from(bucket)
                    .remove(paths);
                
                if (storageError) console.error(`Storage deletion warning (${bucket}):`, storageError);
            }
        }
    }

    // 4. Delete the parent Generation from DB
    // Variations cascade delete automatically via foreign key
    const { error } = await supabase.from('generations').delete().eq('id', id);
    
    if (error) {
        console.error("Error deleting generation record:", JSON.stringify(error, null, 2));
        throw new Error(`Failed to delete DB record: ${error.message}`);
    }
    
    console.log("[Delete Protocol] Purge successful.");
};

export const updateVariationRating = async (sessionId: string, variationId: string, rating: number) => {
    const { error } = await supabase.from('variations').update({ rating }).eq('id', variationId);
    if (error) {
         console.error("Error updating rating:", JSON.stringify(error, null, 2));
    }
};

export const submitVariationFeedback = async (variationId: string, feedback: string) => {
    const { error } = await supabase
        .from('variations')
        .update({ feedback })
        .eq('id', variationId);
        
    if (error) {
        console.error("Error saving feedback:", JSON.stringify(error, null, 2));
        throw error;
    }
};
