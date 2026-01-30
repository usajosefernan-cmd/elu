import React, { useState, useEffect } from 'react';
import { useImageStore, supabase } from '../store/imageStore';
import { generateBiopsyPayload } from '../utils/biopsy-engine';
import { SimplePillarControl, AnalysisResult, SliderConfig } from '../components/Lux/SimplePillarControl';
import { MacroSliderGallery } from '../components/Lux/MacroSliderGallery';
import { MicroSliderGrid } from '../components/Lux/MicroSliderGrid';

// Import icons from a reliable source or use simple SVGs
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);
const LoaderIcon = () => (
    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);

const LuxV41Page: React.FC = () => {
    const store = useImageStore();
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<'AUTO' | 'USER' | 'PRO' | 'PRO_LUX'>('USER');

    // Init App (Load Definitions) on Mount
    useEffect(() => {
        store.initApp();
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setUploadError(null);
        setIsProcessing(true);
        store.setStatus('UPLOADING');

        try {
            // 1. Generate Biopsy
            const biopsy = await generateBiopsyPayload(file);
            store.setBiopsyPayload(biopsy);

            // 2. Upload to Supabase Storage (Optional for this flow, but good practice)
            // For v41, we primarily need the DB record.

            // 3. Create Upload Record in DB
            const { data: uploadData, error: uploadError } = await supabase
                .from('uploads')
                .insert({
                    user_id: (await supabase.auth.getUser()).data.user?.id, // Null for anon/guest
                    original_width: biopsy.originalWidth,
                    original_height: biopsy.originalHeight,
                    biopsy_urls: {
                        center: biopsy.center_base64.substring(0, 50) + '...', // Truncate for log, usually stored in storage bucket
                        // In real production, upload blobs to storage and save URLs here.
                        // For this demo/v41, we pass base64 directly to function or store in DB (DB size limit warning!)
                        // CORRECT V41 FLOW: Upload Base64 to Storage Bucket -> Get URL -> Save to DB
                        // OPTIMIZED FLOW: Send Base64 directly to Edge Function, let it handle storage? 
                        // Let's stick to the Edge Function handling it for now as per `vision-orchestrator` design.
                    } as any, // Cast to Json
                    status: 'biopsy_ready'
                })
                .select()
                .single();

            if (uploadError) throw new Error(`DB Upload Error: ${uploadError.message}`);
            if (!uploadData) throw new Error('No upload data returned');

            const uploadId = uploadData.id;
            store.setUploadId(uploadId);

            // 4. Call Vision Orchestrator
            store.setStatus('ANALYZING');

            const { data: funcData, error: funcError } = await supabase.functions.invoke('vision-orchestrator', {
                body: {
                    uploadId,
                    biopsy: {
                        thumbnail: biopsy.thumbnail_base64,
                        center: biopsy.center_base64,
                        shadow: biopsy.shadow_base64,
                        detail: biopsy.detail_base64
                    }
                }
            });

            if (funcError) throw new Error(`Vision Function Error: ${funcError.message}`);

            // Parse and set result
            // Assuming funcData returns { status: 'REVIEW_REQUIRED', analysis: {...} }
            if (funcData.status === 'REVIEW_REQUIRED' || funcData.analysis) {
                // Map snake_case from DB/Function to camelCase if needed, or keep snake_case
                // Our store expects AnalysisResult which matches DB structure essentially
                store.setAnalysisResult(funcData.analysis, selectedProfile);
            } else {
                throw new Error('Unexpected function response format');
            }

        } catch (error: any) {
            console.error(error);
            setUploadError(error.message);
            store.setError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGeneration = async (sliderConfig: SliderConfig) => {
        store.setSliderConfig(sliderConfig);
        store.setStatus('GENERATING');

        try {
            if (!store.uploadId) throw new Error('No upload ID found');

            const { data, error } = await supabase.functions.invoke('generate-image', {
                body: {
                    uploadId: store.uploadId,
                    sliderConfig,
                    profile: selectedProfile
                }
            });

            if (error) throw error;

            // Handle generation result (e.g. add to gallery)
            if (data.image_url) {
                store.addGeneration({
                    id: data.generation_id,
                    url: data.image_url,
                    clean_url: data.clean_url,
                    is_preview: true,
                    prompt_used: data.prompt,
                    config_used: data.config
                });
                store.setStatus('DONE');
            }

        } catch (e: any) {
            console.error(e);
            store.setError(e.message);
        }
    };

    // Determine which control to show based on profile
    const renderControls = () => {
        if (store.status === 'LOADING_CONFIG') return <div className="text-gray-500 animate-pulse">Loading system configuration...</div>;
        if (!store.analysisResult) return <div className="text-gray-500">Waiting for analysis...</div>;

        switch (selectedProfile) {
            case 'USER':
                return <SimplePillarControl analysisResult={store.analysisResult} onSubmit={handleGeneration} />;
            case 'PRO':
                return <MacroSliderGallery analysisResult={store.analysisResult} onSubmit={handleGeneration} />;
            case 'PRO_LUX':
                return <MicroSliderGrid analysisResult={store.analysisResult} onSubmit={handleGeneration} />;
            default:
                return <div>Auto Mode Running...</div>;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 font-sans">
            <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold">L</div>
                    <h1 className="text-2xl font-bold tracking-tight">LuxScaler <span className="text-gray-500 font-normal">v41</span></h1>
                </div>

                <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
                    {(['AUTO', 'USER', 'PRO', 'PRO_LUX'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => { setSelectedProfile(mode); if (store.analysisResult) store.setAnalysisResult(store.analysisResult, mode); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedProfile === mode
                                ? 'bg-gray-700 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {mode.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Preview / Upload */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-gray-900 rounded-xl aspect-[4/5] flex items-center justify-center border-2 border-dashed border-gray-800 relative overflow-hidden group">

                        {store.biopsyPayload?.thumbnail_base64 ? (
                            <img
                                src={`data:image/jpeg;base64,${store.biopsyPayload.thumbnail_base64}`}
                                className="w-full h-full object-cover"
                                alt="Preview"
                            />
                        ) : (
                            <div className="text-center p-8">
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-700 transition-colors">
                                    <UploadIcon />
                                </div>
                                <h3 className="text-lg font-medium mb-1">Cargar Imagen</h3>
                                <p className="text-gray-500 text-sm mb-4">Soporta JPG, PNG, WEBP (Max 20MB)</p>
                                <label className="bg-white text-black px-6 py-2 rounded-full font-semibold cursor-pointer hover:bg-gray-200 transition-colors">
                                    Explorar
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                </label>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                                <LoaderIcon />
                                <p className="text-blue-300 font-mono text-sm">{store.status}...</p>
                            </div>
                        )}
                    </div>

                    {store.analysisResult && (
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-3">
                                ⚡ DIAGNOSIS
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Categoría</span>
                                    <span className="font-mono text-blue-400">{store.analysisResult.cat_code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Severidad</span>
                                    <span className="font-mono text-orange-400">{store.analysisResult.severity_score}/10</span>
                                </div>
                                <div className="p-3 bg-black/50 rounded text-gray-400 text-xs italic">
                                    {store.analysisResult.visual_summary}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Controls */}
                <div className="lg:col-span-7">
                    {uploadError && (
                        <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg mb-4 flex items-center gap-3">
                            <AlertIcon />
                            <p className="text-sm">{uploadError}</p>
                        </div>
                    )}

                    {renderControls()}
                </div>

            </main>
        </div>
    );
};

export default LuxV41Page;
