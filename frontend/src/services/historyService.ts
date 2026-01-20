
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

    // Check if user is admin to allow "Rescue Mode" (Seeing all data)
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    let query = supabase
        .from('generations')
        .select(`
            *,
            variations (
                *
            )
        `)
        .order('created_at', { ascending: false });

    // FILTER LOGIC:
    // If Admin: Fetch ALL (Rescue mode for lost synthetic accounts)
    // If User: Fetch ONLY own data
    if (!profile?.is_admin) {
        query = query.eq('user_id', user.id);
    }
    
    const { data, error } = await query;

    if (error) {
        console.error("Error fetching history:", JSON.stringify(error, null, 2));
        return [];
    }

    if (!data) return [];

    // Map DB types to Frontend types
    return data.map((gen: any) => ({
        id: gen.id,
        user_id: gen.user_id,
        status: gen.status,
        original_image_path: gen.original_image_path,
        original_image_thumbnail: gen.original_image_thumbnail || gen.original_image_path,
        created_at: gen.created_at,
        semantic_analysis: gen.semantic_analysis,
        variations: (gen.variations || []).map((v: any) => ({
            id: v.id,
            generation_id: v.generation_id,
            type: v.type,
            style_id: v.style_id,
            image_path: v.image_path,
            prompt_payload: v.prompt_payload,
            seed: v.seed,
            rating: v.rating,
            is_selected: v.is_selected,
            feedback: v.feedback, 
            created_at: v.created_at,
            engineering_report: v.engineering_report
        })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }));
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
