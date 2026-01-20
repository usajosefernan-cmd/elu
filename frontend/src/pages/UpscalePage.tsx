import React, { useState, useEffect } from 'react';
import { Upload, Zap, Download, Loader2, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { calculateUpscaleParams, splitAndUploadTiles, mergeTilesWithCoverCrop, UpscaleJob } from '../utils/upscaleEngine';
import { getSupabaseClient } from '../services/authService';

export const UpscalePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [scale, setScale] = useState<number>(2);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [job, setJob] = useState<UpscaleJob | null>(null);
    const [result, setResult] = useState<string | null>(null);

    // Cargar imagen desde URL si viene como query param
    useEffect(() => {
        const imageUrl = searchParams.get('imageUrl');
        if (imageUrl) {
            setImagePreview(decodeURIComponent(imageUrl));
            addLog(`✅ Imagen cargada desde generación`);
        }
    }, [searchParams]);

    const addLog = (log: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setImagePreview(dataUrl);
            setResult(null);
            setLogs([]);
            addLog(`✅ Imagen cargada: ${file.name}`);
        };
        reader.readAsDataURL(file);
    };

    const handleProcess = async () => {
        if (!imagePreview) return;

        setProcessing(true);
        setProgress(0);
        setResult(null);
        setLogs([]);

        try {
            addLog(`🚀 Iniciando upscale x${scale}...`);

            // Cargar imagen
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((res, rej) => {
                img.onload = res;
                img.onerror = rej;
                img.src = imagePreview;
            });

            const imgWidth = img.naturalWidth;
            const imgHeight = img.naturalHeight;

            addLog(`📐 Dimensiones originales: ${imgWidth}×${imgHeight}`);

            // Calcular parámetros
            const params = calculateUpscaleParams(imgWidth, imgHeight, scale);
            addLog(`🎯 Target: ${params.targetWidth}×${params.targetHeight}`);
            addLog(`📊 Grid: ${params.calculation.grid_h}×${params.calculation.grid_v} tiles`);
            addLog(`🎨 Pliego: ${params.calculation.tile_name} (${params.calculation.tile_info.w}×${params.calculation.tile_info.h})`);

            const newJob: UpscaleJob = {
                imageData: imagePreview.includes('base64,') ? imagePreview.split('base64,')[1] : imagePreview,
                imageMime: 'image/png',
                scale,
                tiles: {},
                gridCols: params.calculation.grid_h,
                gridRows: params.calculation.grid_v,
                imgWidth,
                imgHeight,
                targetWidth: params.targetWidth,
                targetHeight: params.targetHeight,
                calculation: params.calculation
            };

            setJob(newJob);
            setProgress(10);

            // Paso 1: Segmentar y subir tiles
            addLog(`✂️ Segmentando imagen...`);
            const { tiles, folder, contextUrl } = await splitAndUploadTiles(img, newJob, addLog);
            newJob.sessionFolder = folder;
            newJob.contextUrl = contextUrl;
            setProgress(30);

            // Paso 2: Procesar cada tile con Edge Function
            addLog(`🧠 Procesando tiles con lux-logic...`);
            const totalTiles = params.calculation.total_tiles;
            let completed = 0;

            const supabase = getSupabaseClient();
            const { data: { session } } = await supabase.auth.getSession();

            for (let r = 0; r < newJob.gridRows; r++) {
                for (let c = 0; c < newJob.gridCols; c++) {
                    const key = `${r}-${c}`;
                    const tileUrl = tiles[key];

                    addLog(`⏳ Procesando tile [${r},${c}]...`);

                    newJob.tiles[key] = { status: 'processing' };
                    setJob({ ...newJob });

                    try {
                        const { data: tileResult, error: invokeError } = await supabase.functions.invoke('lux-logic', {
                            body: {
                                tileUrl,
                                contextUrl: newJob.contextUrl, // Enviamos el URL en lugar del base64 completo
                                imageMime: newJob.imageMime,
                                tileInfo: {
                                    row: r,
                                    col: c,
                                    gridCols: newJob.gridCols,
                                    gridRows: newJob.gridRows
                                },
                                storageFolder: folder
                            }
                        });

                        if (invokeError) throw invokeError;
                        newJob.tiles[key] = {
                            status: 'done',
                            data: tileResult.tileData,
                            outputUrl: tileResult.storageUrl || tileResult.outputUrl
                        };

                        addLog(`✅ Tile [${r},${c}] completado`);
                    } catch (err: any) {
                        newJob.tiles[key] = { status: 'error', error: err.message };
                        addLog(`❌ Tile [${r},${c}] error: ${err.message}`);
                    }

                    completed++;
                    setProgress(30 + (completed / totalTiles) * 60);
                    setJob({ ...newJob });
                }
            }

            // Paso 3: Merge con cover crop
            addLog(`🧩 Reensamblando resultado final...`);
            const finalUrl = await mergeTilesWithCoverCrop(newJob, newJob.tiles, addLog);

            setResult(finalUrl);
            setProgress(100);
            addLog(`🎉 ¡Proceso completado!`);

        } catch (err: any) {
            addLog(`❌ Error: ${err.message}`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver
                    </button>
                    <div className="text-center">
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                            LuxScaler Ultra
                        </h1>
                        <p className="text-gray-400 text-lg">Upscaling de imágenes con IA (Nanobananapro)</p>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Upload & Controls */}
                    <div className="space-y-6">
                        {/* Upload */}
                        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                1. Subir Imagen
                            </h2>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                                disabled={processing}
                            />
                            {imagePreview && (
                                <div className="mt-4 rounded-lg overflow-hidden border border-white/20">
                                    <img src={imagePreview} alt="Preview" className="w-full" />
                                </div>
                            )}
                        </div>

                        {/* Scale Selector */}
                        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                2. Escala de Upscaling
                            </h2>
                            <div className="grid grid-cols-4 gap-2">
                                {[1.5, 2, 3, 4].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setScale(s)}
                                        disabled={processing}
                                        className={`py-3 px-4 rounded-lg font-bold transition-all ${scale === s
                                            ? 'bg-purple-600 text-white shadow-lg scale-105'
                                            : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        x{s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Process Button */}
                        <button
                            onClick={handleProcess}
                            disabled={!imagePreview || processing}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando... {Math.round(progress)}%
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    Iniciar Upscale
                                </>
                            )}
                        </button>

                        {/* Progress Bar */}
                        {processing && (
                            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Result & Logs */}
                    <div className="space-y-6">
                        {/* Result */}
                        {result && (
                            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    Resultado Final
                                </h2>
                                <div className="rounded-lg overflow-hidden border border-white/20 mb-4">
                                    <img src={result} alt="Result" className="w-full" />
                                </div>
                                <a
                                    href={result}
                                    download="luxscaler_result.png"
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Descargar Resultado
                                </a>
                            </div>
                        )}

                        {/* Logs */}
                        {logs.length > 0 && (
                            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                                <button
                                    onClick={() => setShowLogs(!showLogs)}
                                    className="w-full flex items-center justify-between text-xl font-bold mb-4"
                                >
                                    <span>Logs del Proceso</span>
                                    {showLogs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                {showLogs && (
                                    <div className="bg-black/50 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs space-y-1">
                                        {logs.map((log, i) => (
                                            <div key={i} className="text-gray-300">
                                                {log}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
