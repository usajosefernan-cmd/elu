import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './authService';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserPreset {
    id: string;
    name: string;
    config: any; // MixerConfig
    is_favorite: boolean;
    created_at: string;
}

export const getUserPresets = async (userId: string): Promise<UserPreset[]> => {
    const { data, error } = await supabase
        .from('user_presets')
        .select('*')
        .eq('user_id', userId)
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Error fetching presets (table might not exist yet):', error);
        return [];
    }
    return data || [];
};

export const saveUserPreset = async (userId: string, name: string, config: any): Promise<UserPreset | null> => {
    const { data, error } = await supabase
        .from('user_presets')
        .insert([{
            user_id: userId,
            name: name,
            config: config
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteUserPreset = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('user_presets')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};
