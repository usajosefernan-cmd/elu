import React, { useState, useEffect, useRef } from 'react';
import { FlaskConical, Play, Layout, Lock, Save, Settings, Terminal, Image as ImageIcon, History, Search, Download, Trash2, Maximize2, Upload, Edit3, Check, X } from 'lucide-react';
import { ComparisonSlider } from './ComparisonSlider';
import { getSupabaseClient } from '@/services/authService';
import { ImageInspectorModal } from './ImageInspectorModal';
import { Session } from '@supabase/supabase-js';

// URL del servidor local Forense
// Cloud-First Switch
const USE_CLOUD_EDGE = false; // Set true to use Edge Function, false for local Python 8081
// const LAB_API_URL = "http://localhost:8081/api";
const LAB_API_URL = USE_CLOUD_EDGE ? "EDGE_FUNCTION" : "/api";

type Strategy = 'seedream_forensic' | 'sora_forensic' | 'nano_banana_pro' | 'nano_banana';

const STRATEGIES: { id: Strategy; label: string; desc: string }[] = [
    { id: 'sora_forensic', label: 'SORA_GEN_V2', desc: 'Raw Sora reconstruction.' },
    { id: 'seedream_forensic', label: 'SEEDREAM_4.0', desc: 'Experimental 2K Forensic.' },
    { id: 'nano_banana_pro', label: 'BANANA_PRO_2K', desc: 'Gemini 3 Pro Restoration.' },
    { id: 'nano_banana', label: 'BANANA_FLASH', desc: 'Gemini 2.5 Flash Quick Edit.' }
];

const BENCH_PATH = "./bench_samples";

const BENCH_SAMPLES = [
    "bad_influencer_bedroom_mirror_1767962947246.webp",
    "bad_influencer_night_flash_1767962961846.webp",
    "bad_influencer_failed_backlit_1767962977795.webp",
    "mid_tier_cafe_lifestyle_1767964329600.webp",
    "mid_tier_street_backlit_1767964351680.webp",
    "mid_tier_indoor_ringlight_1767964367999.webp",
    "high_potential_fashion_rooftop_1767964769380.webp",
    "portrait_disaster_wb_focus.webp",
    "street_disaster_iso_noise.webp",
    "portrait_burnt_orange.webp",
    "cinematic_street_high_iso.webp",
    "failed_night_portrait.webp",
    "flash_club_portrait.webp",
    "broken_flare_ruined.webp",
    "lens_fungus_ruined.webp",
    "sensor_dust_ruined.webp",
    "TEST_ACCIDENTE_OPTICO_flare.webp",
    "TEST_AUTOFOCO_FALLIDO_man.webp",
    "TEST_CONDENSACION_FOG_portrait.webp"
];

export const ForensicLab: React.FC = () => {
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy>('nano_banana_pro');
    const [imagePath, setImagePath] = useState<string>('');

    const [isLoading, setIsLoading] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null]);
    const [selectedSlot, setSelectedSlot] = useState<number>(0);
    const [history, setHistory] = useState<{ url: string; strategy: string; timestamp: string; filename: string }[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [activeView, setActiveView] = useState<'visualizer' | 'logs' | 'prompts'>('visualizer');
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [genAll, setGenAll] = useState(false);
    const [inputAspectRatio, setInputAspectRatio] = useState<number>(16 / 9);
    const [slotModels, setSlotModels] = useState<(string | null)[]>([null, null, null, null]);
    const [prompts, setPrompts] = useState<Record<string, string>>({});
    const [isSavingPrompt, setIsSavingPrompt] = useState<string | null>(null); // strategy key or null
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const timerRef = useRef<any>(null);
    const supabase = getSupabaseClient();
    const [session, setSession] = useState<Session | null>(null);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    useEffect(() => {
        fetchPrompts();

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchPrompts = async () => {
        try {
            if (USE_CLOUD_EDGE) {
                const { data, error } = await supabase.functions.invoke('forensic-lab', {
                    body: { action: 'FETCH_PROMPTS' }
                });
                if (error) throw error;
                if (!data.success) throw new Error(data.error || "Failed to fetch prompts");
                setPrompts(data.prompts);
            } else {
                const res = await fetch(`${LAB_API_URL}/prompts`);
                const data = await res.json();
                if (data.success) {
                    setPrompts(data.prompts);
                }
            }
        } catch (e: any) {
            console.error("Error fetching prompts", e);
            addLog(`❌ Error fetching prompts: ${e.message}`);
        }
    };

    const updatePrompt = async (strategy: string, prompt: string) => {
        setIsSavingPrompt(strategy);
        try {
            if (USE_CLOUD_EDGE) {
                const { data, error } = await supabase.functions.invoke('forensic-lab', {
                    body: { action: 'UPDATE_PROMPT', strategy, prompt, userId: session?.user?.id }
                });
                if (error) throw error;
                if (!data.success) throw new Error(data.error || "Failed to update prompt");
            } else {
                // Legacy Local
                const res = await fetch(`${LAB_API_URL}/update_prompt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ strategy, prompt })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
            }

            setPrompts(prev => ({ ...prev, [strategy]: prompt }));
            addLog(`✅ Prompt para ${strategy} actualizado (Cloud Synced).`);
        } catch (e: any) {
            addLog(`❌ Error actualizando prompt: ${e.message}`);
        } finally {
            setIsSavingPrompt(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        addLog(`📂 Preparando subida: ${file.name}...`);
        setUploadProgress(10);

        const reader = new FileReader();
        reader.onload = async (event) => {
            setUploadProgress(30);
            const base64 = event.target?.result as string;
            try {
                setUploadProgress(60);
                const res = await fetch(`${LAB_API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: file.name,
                        content: base64
                    })
                });
                setUploadProgress(90);
                const data = await res.json();
                if (data.success) {
                    setImagePath(data.path);
                    addLog(`✅ Archivo subido con éxito: ${file.name}`);
                } else {
                    throw new Error(data.error);
                }
            } catch (e: any) {
                addLog(`❌ Error subiendo archivo: ${e.message}`);
            } finally {
                setUploadProgress(0);
            }
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (imagePath) {
            const img = new Image();
            img.src = getPreviewUrl(imagePath);
            img.onload = () => {
                if (img.width && img.height) {
                    setInputAspectRatio(img.width / img.height);
                }
            };
        }
    }, [imagePath]);

    const runTest = async () => {
        setIsLoading(true);
        setElapsedTime(0);
        timerRef.current = setInterval(() => setElapsedTime(prev => prev + 0.1), 100);

        const slotsToFill = genAll ? [0, 1, 2, 3] : [selectedSlot];
        addLog(`🚀 Iniciando ráfaga ${genAll ? 'QUAD PARALELO' : `Slot ${selectedSlot + 1}`}...`);

        try {
            const requests = slotsToFill.map(async (slotIdx) => {
                const currentStrategy = genAll ? (STRATEGIES[slotIdx]?.id || selectedStrategy) : selectedStrategy;

                addLog(`📡 Enviando ${currentStrategy} (Slot ${slotIdx + 1})...`);

                const res = await fetch(`${LAB_API_URL}/run`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        strategy: currentStrategy,
                        imagePath: imagePath.trim()
                    })
                });

                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(`${currentStrategy}: ${data.error || 'Err'}`);

                const taskId = data.task_id;
                addLog(`⚙️ Task ${taskId.slice(0, 8)} [${currentStrategy}] en cola.`);

                // Start polling for this specific task
                pollTaskStatus(taskId, slotIdx, currentStrategy);
            });

            // Fire all requests at once
            await Promise.all(requests);

        } catch (e: any) {
            addLog(`❌ Error en ráfaga: ${e.message}`);
            setIsLoading(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const pollTaskStatus = async (taskId: string, slotIdx: number, strategy: string) => {
        const supabase = getSupabaseClient();
        let attempts = 0;
        const maxAttempts = 120; // 2 minutes

        const interval = setInterval(async () => {
            attempts++;
            const { data, error } = await supabase
                .from('forensic_results')
                .select('*')
                .eq('id', taskId)
                .single();

            if (error) {
                console.error("Poll error", error);
                return;
            }

            if (data.status === 'completed') {
                clearInterval(interval);
                addLog(`✅ Slot ${slotIdx + 1} listo: ${strategy}`);

                const newRes = {
                    url: data.result_url,
                    strategy: strategy,
                    timestamp: new Date().toLocaleTimeString(),
                    filename: data.result_url?.split('/').pop() || 'result.webp'
                };

                setSlots(prev => {
                    const next = [...prev];
                    next[slotIdx] = data.result_url;
                    return next;
                });
                setSlotModels(prev => {
                    const next = [...prev];
                    next[slotIdx] = strategy;
                    return next;
                });
                setResultUrl(data.result_url);
                setHistory(prev => [newRes, ...prev]);

                // If all active slots are done, stop loading
                // (Oversimplified: this only works for single runs without additional logic)
                setIsLoading(false);
            } else if (data.status === 'error') {
                clearInterval(interval);
                addLog(`❌ Slot ${slotIdx + 1} falló: ${data.error_message}`);
                setIsLoading(false);
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                addLog(`⚠️ Slot ${slotIdx + 1} timeout`);
                setIsLoading(false);
            }
        }, 2000);
    };

    const clearHistory = () => {
        if (confirm("¿Borrar historial de sesión?")) {
            setHistory([]);
            setResultUrl(null);
        }
    };

    const getPreviewUrl = (path: string) => `http://localhost:8081/file?path=${encodeURIComponent(path)}`;

    return (
        <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden select-none font-sans">

            {/* 1. TOP BAR (ONE SCREEN CONTROLS) */}
            <div className="bg-[#0a0a0a] border-b border-white/10 p-2 md:px-4 flex flex-col gap-2 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-4 shrink-0">
                        <FlaskConical className="text-yellow-500" size={20} />
                        <span className="font-bold text-sm tracking-tight hidden sm:inline">FORENSIC LAB</span>
                    </div>

                    <div className="flex-1 max-w-xl flex gap-2">
                        <div className="relative group flex-1">
                            <ImageIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-500/50" size={14} />
                            <input
                                type="text"
                                value={imagePath}
                                onChange={(e) => setImagePath(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-[11px] font-mono text-white/80 focus:ring-1 focus:ring-yellow-500/30 outline-none"
                                placeholder="Ruta local..."
                            />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg px-2 flex items-center gap-2 text-white/60 transition-colors"
                            title="Subir imagen desde el ordenador"
                        >
                            <Upload size={14} />
                        </button>
                    </div>

                    {/* STRATEGY DROPDOWN/SELECT */}
                    <select
                        value={selectedStrategy}
                        onChange={(e) => setSelectedStrategy(e.target.value as Strategy)}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] outline-none text-white/80 hover:bg-white/10 cursor-pointer"
                    >
                        {STRATEGIES.map(st => (
                            <option key={st.id} value={st.id} className="bg-[#0a0a0a]">{st.label}</option>
                        ))}
                    </select>

                    {/* RUN CONTROLS */}
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input type="checkbox" checked={genAll} onChange={e => setGenAll(e.target.checked)} className="accent-yellow-500" />
                            <span className="text-[10px] font-bold text-white/40 uppercase">QUAD_MODE</span>
                        </label>

                        <button
                            onClick={runTest}
                            disabled={isLoading}
                            className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${isLoading
                                ? 'bg-white/10 text-white/40'
                                : 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-[0_0_15px_rgba(202,138,4,0.3)]'
                                }`}
                        >
                            {isLoading ? <span className="animate-pulse">RUNNING ({elapsedTime.toFixed(1)}s)</span> : <><Play size={12} fill="currentColor" /> GENERAR</>}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <div className="p-1 px-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-bold flex items-center gap-1">
                            ADJUST_SOURCE
                        </div>
                    </div>
                </div>

                {/* BENCH QUICK PICKER */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <span className="text-[9px] font-bold text-white/20 uppercase shrink-0">Bench Samples:</span>
                    {BENCH_SAMPLES.map((sample, idx) => (
                        <button
                            key={idx}
                            onClick={() => setImagePath(`${BENCH_PATH}/${sample}`)}
                            className={`px-2 py-0.5 rounded border text-[9px] whitespace-nowrap transition-all ${imagePath.includes(sample)
                                ? 'bg-yellow-500 text-black border-yellow-500 font-bold'
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                                }`}
                        >
                            {sample
                                .replace('.webp', '')
                                .replace('RESTORED_', '')
                                .replace('TEST_', '')
                                .replace(/_\d+$/, '') // Remove timestamp suffix
                                .replace(/_/g, ' ')   // Replace underscores with spaces
                            }
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. SUB-NAV / TABS */}
            <div className="flex bg-[#080808] border-b border-white/5 shrink-0">
                <button
                    onClick={() => setActiveView('visualizer')}
                    className={`px-6 py-2 text-[10px] font-bold tracking-widest border-b-2 transition-all ${activeView === 'visualizer' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5' : 'border-transparent text-white/40'
                        }`}
                >
                    VISUALIZER
                </button>
                <button
                    onClick={() => setActiveView('prompts')}
                    className={`px-6 py-2 text-[10px] font-bold tracking-widest border-b-2 transition-all ${activeView === 'prompts' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5' : 'border-transparent text-white/40'
                        }`}
                >
                    PROMPT_EDITOR
                </button>
                <button
                    onClick={() => setActiveView('logs')}
                    className={`px-6 py-2 text-[10px] font-bold tracking-widest border-b-2 transition-all ${activeView === 'logs' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/5' : 'border-transparent text-white/40'
                        }`}
                >
                    LOGS {logs.length > 0 && `(${logs.length})`}
                </button>
            </div>

            {/* 3. MAIN AREA (TWO COLUMNS) */}
            <div className="flex-1 flex overflow-hidden bg-black">
                {/* LEFT SIDE: VISUALIZER/LOGS */}
                <div className="flex-1 relative flex flex-col border-r border-white/5 overflow-hidden">
                    {activeView === 'visualizer' ? (
                        <div className="flex-1 flex flex-col min-h-0 bg-[#050505] p-2">
                            <div
                                className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5 min-h-0 overflow-hidden p-1"
                            >
                                {slots.map((slot, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedSlot(i)}
                                        className={`relative border rounded-lg flex flex-col overflow-hidden transition-all group cursor-crosshair shadow-2xl ${selectedSlot === i ? 'border-yellow-500 ring-2 ring-yellow-500/20 bg-yellow-500/5' : 'border-white/5 bg-black/40 hover:border-white/20'
                                            }`}
                                        style={{
                                            aspectRatio: inputAspectRatio.toString(),
                                            maxHeight: 'calc(45vh - 30px)',
                                            margin: '0 auto'
                                        }}
                                    >
                                        <div className={`absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-lg backdrop-blur-md ${selectedSlot === i ? 'bg-yellow-500 text-black' : 'bg-black/90 text-white/30 border border-white/5'
                                            }`}>
                                            {slotModels[i] ? STRATEGIES.find(s => s.id === slotModels[i])?.label : `SLOT ${i + 1}`}
                                        </div>

                                        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
                                            {/* SCANLINE OVERLAY */}
                                            {isLoading && selectedSlot === i && (
                                                <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                                                    <div className="w-full h-[2px] bg-yellow-500/30 blur-[1px] absolute top-1/2 animate-[scanline_2s_linear_infinite]" />
                                                    <div className="absolute inset-0 bg-yellow-500/5 mix-blend-overlay animate-pulse" />
                                                </div>
                                            )}

                                            {slot ? (
                                                <div className="relative w-full h-full animate-[fadeIn_0.5s_ease-out]">
                                                    <ComparisonSlider
                                                        originalImage={getPreviewUrl(imagePath)}
                                                        processedImage={slot}
                                                        aspectRatio={inputAspectRatio}
                                                        className="w-full h-full"
                                                    />
                                                    <div className="absolute bottom-1.5 left-1.5 flex gap-1.5 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="px-1 py-0.5 bg-black/60 text-white/40 text-[6px] font-bold rounded border border-white/10 uppercase">Before</span>
                                                        <span className="px-1 py-0.5 bg-yellow-500/80 text-black text-[6px] font-bold rounded uppercase">After</span>
                                                    </div>
                                                </div>
                                            ) : imagePath ? (
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    <img src={getPreviewUrl(imagePath)} className="w-full h-full object-contain grayscale opacity-10 transition-all group-hover:opacity-25" />
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="text-[6px] text-white/10 font-black tracking-[0.5em] uppercase">STANDBY_NODE</span>
                                                        {isLoading && selectedSlot === i && (
                                                            <div className="mt-2 flex gap-1">
                                                                <div className="w-1 h-1 bg-yellow-500 animate-bounce [animation-delay:-0.3s]" />
                                                                <div className="w-1 h-1 bg-yellow-500 animate-bounce [animation-delay:-0.15s]" />
                                                                <div className="w-1 h-1 bg-yellow-500 animate-bounce" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[8px] text-white/5 font-mono italic tracking-[0.3em]">NO_SOURCE</div>
                                            )}

                                            {slot && (
                                                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                                                    <button onClick={(e) => { e.stopPropagation(); setIsInspectorOpen(true); setResultUrl(slot); }} className="p-1 bg-yellow-500 text-black rounded shadow-lg hover:bg-white transition-all transform hover:scale-110 active:scale-95">
                                                        <Maximize2 size={10} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* FOOTER BAR */}
                            <div className="flex bg-[#0a0a0a] border-t border-white/10 h-8 divide-x divide-white/10 shrink-0 mt-2">
                                <div className="flex-1 flex items-center px-4 gap-2 overflow-hidden">
                                    <span className="text-[8px] text-white/30 uppercase font-bold shrink-0">SOURCE:</span>
                                    <span className="text-[9px] text-white/60 font-mono truncate">{imagePath.split('/').pop()}</span>
                                </div>
                                <div className="px-4 flex items-center gap-2 ml-auto shrink-0">
                                    <span className="text-[8px] text-white/20 font-bold uppercase">LUXIFIER_LAB_V4.0</span>
                                </div>
                            </div>
                        </div>
                    ) : activeView === 'logs' ? (
                        <div className="flex-1 bg-black p-4 font-mono text-[11px] text-green-500/80 overflow-y-auto">
                            <div className="flex items-center gap-2 border-b border-green-500/20 pb-2 mb-4">
                                <Terminal size={14} />
                                <span className="font-bold tracking-widest uppercase">Forensic Engine Terminal</span>
                            </div>
                            {logs.length === 0 ? (
                                <div className="text-white/10">No engine activity recorded yet.</div>
                            ) : logs.map((log, i) => (
                                <div key={i} className="mb-1 leading-relaxed border-l border-green-500/20 pl-4">{log}</div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 bg-[#050505] overflow-y-auto p-4 flex flex-col gap-6">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                <Edit3 size={16} className="text-yellow-500" />
                                <span className="text-xs font-bold tracking-widest uppercase">Prompts Matrix Editor</span>
                            </div>

                            <div className="grid grid-cols-1 gap-6 pb-20">
                                {STRATEGIES.map(st => {
                                    const key = st.id;
                                    const promptValue = prompts[key];
                                    if (promptValue === undefined) return null;

                                    return (
                                        <div key={key} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-white/80 uppercase tracking-wider">{st.label}</span>
                                                    <span className="text-[8px] text-white/20 font-mono">[{key}]</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {isSavingPrompt === key && <span className="text-[8px] text-yellow-500 animate-pulse font-bold uppercase py-1">Saving Cluster...</span>}
                                                    <button
                                                        onClick={() => fetchPrompts()}
                                                        className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/40 transition-all uppercase"
                                                    >
                                                        Reset
                                                    </button>
                                                    <button
                                                        disabled={isSavingPrompt !== null}
                                                        onClick={() => updatePrompt(key as string, promptValue)}
                                                        className="p-1 px-3 rounded bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-[9px] font-bold text-black transition-all uppercase flex items-center gap-1.5 shadow-lg shadow-yellow-600/10"
                                                    >
                                                        {isSavingPrompt === key ? "..." : <><Save size={10} /> Save Changes</>}
                                                    </button>
                                                </div>
                                            </div>
                                            <textarea
                                                value={promptValue}
                                                onChange={(e) => setPrompts(prev => ({ ...prev, [key]: e.target.value }))}
                                                className="w-full h-48 bg-white/5 border border-white/10 rounded-lg p-3 text-[10px] font-mono leading-relaxed text-white/80 focus:ring-1 focus:ring-yellow-500/30 outline-none scrollbar-thin scrollbar-thumb-white/10 focus:bg-white/[0.07] transition-all overflow-y-auto whitespace-pre-wrap"
                                                placeholder={`Instruction for ${st.label}...`}
                                            />
                                            <div className="flex justify-between items-center text-[8px] text-white/20 px-1">
                                                <div>
                                                    {key === 'seedream_forensic' ? (
                                                        <>Use <span className="text-yellow-500/40 font-bold">---NEGATIVE---</span> separator.</>
                                                    ) : (
                                                        "Standard Forensic Instruction Mode."
                                                    )}
                                                </div>
                                                <div className="font-mono">CHARS: {promptValue.length}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDE: HISTORY/VERSIONS */}
                <div className="w-56 bg-[#0a0a0a] flex flex-col shrink-0">
                    <div className="p-3 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-white/40">
                            <History size={12} />
                            VERSIONS
                        </div>
                        <button onClick={clearHistory} className="text-white/20 hover:text-red-500 transition-colors">
                            <Trash2 size={12} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
                        {history.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-10 p-4 text-center">
                                <ImageIcon size={32} />
                                <p className="text-[9px] mt-2 uppercase font-bold text-center">Empty Records</p>
                            </div>
                        )}
                        {history.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => setResultUrl(item.url)}
                                className={`group relative flex flex-col border rounded transition-all cursor-pointer overflow-hidden ${resultUrl === item.url ? 'border-yellow-500 bg-yellow-500/5 shadow-[0_0_10px_rgba(202,138,4,0.15)]' : 'border-white/5 bg-black/20 hover:border-white/20'
                                    }`}
                            >
                                <div className="p-1 px-1.5 flex flex-col items-center bg-[#080808]">
                                    <img src={item.url} className="w-full h-auto object-contain opacity-50 group-hover:opacity-100 transition-opacity border border-white/5 shadow-inner" style={{ maxHeight: '120px' }} />
                                </div>
                                <div className="p-1 px-2 border-t border-white/5 flex justify-between items-center bg-black/40">
                                    <span className="text-[7px] font-bold text-yellow-500 truncate tracking-tighter uppercase">{item.strategy}</span>
                                    <span className="text-[6px] text-white/20 font-mono">{item.timestamp}</span>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                    <Download size={10} className="text-white/40 hover:text-white" onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-2 bg-white/5 border-t border-white/10 shrink-0">
                        <button className="w-full h-8 bg-white/10 hover:bg-white/20 rounded text-[8px] font-bold tracking-widest transition-all uppercase">
                            Flush Cache
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL INSPECTOR */}
            <ImageInspectorModal
                isOpen={isInspectorOpen}
                onClose={() => setIsInspectorOpen(false)}
                processedImage={resultUrl || ''}
                originalImage={getPreviewUrl(imagePath)}
                title={`Forensic Audit: ${selectedStrategy}`}
            />
        </div>
    );
};
