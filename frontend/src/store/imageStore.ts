import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { BiopsyPayload } from '../utils/biopsy-engine';
import { AnalysisResult, SliderConfig } from '../components/Lux/SimplePillarControl';

// Init Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export interface Generation {
    id: string;
    url: string; // watermarked
    clean_url: string;
    is_preview: boolean;
    prompt_used: string;
    config_used: any;
}

interface ImageState {
    // Current User State
    userId: string | null; // 'guest' or UUID
    userTier: 'AUTO' | 'USER' | 'PRO' | 'PRO_LUX';

    // Definitions (Loaded from DB)
    sliderDefs: Record<string, any>;
    macroDefs: Record<string, any>;
    tierConfig: Record<string, any>;

    // Upload state
    uploadId: string | null;
    biopsyPayload: BiopsyPayload | null;

    // Analysis state
    analysisResult: AnalysisResult | null;
    status: 'IDLE' | 'LOADING_CONFIG' | 'UPLOADING' | 'ANALYZING' | 'REVIEW_REQUIRED' | 'GENERATING' | 'DONE' | 'ERROR';
    error: string | null;

    // UI state
    currentProfile: 'AUTO' | 'USER' | 'PRO' | 'PRO_LUX';
    sliderConfig: SliderConfig;

    // Generation state
    generations: Generation[];
    selectedGenerationId: string | null;

    // Actions
    initApp: () => Promise<void>;
    setUploadId: (id: string) => void;
    setBiopsyPayload: (payload: BiopsyPayload) => void;
    setAnalysisResult: (result: AnalysisResult, profile: 'AUTO' | 'USER' | 'PRO' | 'PRO_LUX') => void;
    setStatus: (status: ImageState['status']) => void;
    setError: (error: string | null) => void;
    setSliderConfig: (config: SliderConfig) => void;
    addGeneration: (gen: Generation) => void;
    setSelectedGenerationId: (id: string | null) => void;
    reset: () => void;
}

export const useImageStore = create<ImageState>((set, get) => ({
    userId: 'guest',
    userTier: 'AUTO',
    sliderDefs: {},
    macroDefs: {},
    tierConfig: {},

    uploadId: null,
    biopsyPayload: null,
    analysisResult: null,
    status: 'IDLE',
    error: null,
    currentProfile: 'USER',
    sliderConfig: {},
    generations: [],
    selectedGenerationId: null,

    // Actions
    initApp: async () => {
        set({ status: 'LOADING_CONFIG' });
        try {
            // Load essential config from DB to ensure parity
            const [slidersParam, macrosParam, tiersParam] = await Promise.all([
                supabase.from('slider_definitions').select('*'),
                supabase.from('macro_definitions').select('*'),
                supabase.from('tier_config').select('*')
            ]);

            if (slidersParam.error) throw slidersParam.error;
            if (macrosParam.error) throw macrosParam.error;
            if (tiersParam.error) throw tiersParam.error;

            set({
                sliderDefs: slidersParam.data.reduce((acc, curr) => ({ ...acc, [curr.slider_key]: curr }), {}),
                macroDefs: macrosParam.data.reduce((acc, curr) => ({ ...acc, [curr.macro_key]: curr }), {}),
                tierConfig: tiersParam.data.reduce((acc, curr) => ({ ...acc, [curr.tier_code]: curr }), {}),
                status: 'IDLE'
            });
            console.log('Supabase Sync Complete: Config Loaded');
        } catch (e: any) {
            console.error('Supabase Sync Failed:', e);
            set({ error: 'Failed to load system configuration from database.', status: 'ERROR' });
        }
    },

    setUploadId: (id) => set({ uploadId: id }),
    setBiopsyPayload: (payload) => set({ biopsyPayload: payload }),
    setAnalysisResult: (result, profile) => set({
        analysisResult: result,
        currentProfile: profile,
        status: 'REVIEW_REQUIRED'
    }),
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error, status: 'ERROR' }),
    setSliderConfig: (config) => set({ sliderConfig: config }),
    addGeneration: (gen) => set(state => ({
        generations: [...state.generations, gen]
    })),
    setSelectedGenerationId: (id) => set({ selectedGenerationId: id }),
    reset: () => set({
        uploadId: null,
        biopsyPayload: null,
        analysisResult: null,
        status: 'IDLE',
        error: null,
        sliderConfig: {},
        generations: [],
        selectedGenerationId: null
    })
}));
