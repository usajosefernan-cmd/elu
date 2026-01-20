import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../hooks/usePlatform';
import {
    Settings, Zap, Aperture, Scan, Palette,
    SwitchCamera, ChevronLeft, Image as ImageIcon,
    MoreHorizontal, Battery, Wifi, Disc, Layers,
    LayoutTemplate, Sparkles, Grid, Sliders,
    Film, Share2, X, Check, Sun, Moon,
    HelpCircle, RotateCcw, Power, AlertTriangle, Bug, Plus, Trash2, Edit3, Loader2, Database
} from 'lucide-react';
import { ProcessingOverlay } from './ProcessingOverlay';
import { generatePreviewGrid, analyzeImage } from '../../services/geminiService';

/**
 * MOBILE SIMULATOR V7.2: "CINEMA PRO OS" - ADVANCED ENGINE
 * - Added: PER-PREVIEW PROFILES (Add/Delete/Edit)
 * - Added: MASTER ENGINE TOGGLE (LuxScaler ON/OFF)
 * - Added: HUD STATUS (ENG: ON [N])
 */

interface PreviewProfile {
    id: string;
    name: string;
    strength: number; // 0-100
    hdr: number; // 0-100
}

export const MobileCameraView: React.FC = () => {
    const { isNative, isSimulated } = usePlatform();

    // --- APP STATE ---
    const [view, setView] = useState<'CAMERA' | 'GALLERY' | 'EDITOR' | 'PRESETS' | 'SETTINGS'>('CAMERA');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // Advanced Configuration
    const [config, setConfig] = useState({
        engineEnabled: true,
        profiles: [
            { id: '1', name: 'RAW NEUTRAL', strength: 0, hdr: 10 },
            { id: '2', name: 'LUX SOFT', strength: 40, hdr: 30 },
            { id: '3', name: 'LUX ULTRA', strength: 95, hdr: 80 }
        ] as PreviewProfile[],
        showGrid: true,
        devMode: true
    });

    // Camera/Editor State
    const [appMode, setAppMode] = useState<'AUTO' | 'USER' | 'PRO' | 'PROLUX'>('PROLUX');
    const [activeLens, setActiveLens] = useState<'WIDE' | '1x' | '2x' | '5x'>('1x');
    const [flashOn, setFlashOn] = useState(false);
    const [editState, setEditState] = useState({
        exposure: 100, contrast: 100, vibrance: 100, preset: 'NONE'
    });

    // Processing State
    const [procStatus, setProcStatus] = useState<'IDLE' | 'ANALYZING' | 'GENERATING' | 'DONE' | 'ERROR'>('IDLE');
    const [procLogs, setProcLogs] = useState<string[]>([]);
    const [procProgress, setProcProgress] = useState(0);

    // History (Real results from Engine)
    const [history, setHistory] = useState<any[]>([]);

    // Toast Timer
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (msg: string) => setToast(msg);

    // --- ACTIONS ---
    const toggleSim = () => {
        if (confirm("EXIT SIMULATOR?")) {
            localStorage.removeItem('LUX_DEV_PLATFORM_OVERRIDE');
            window.location.reload();
        }
    };

    const handleCapture = async () => {
        if (!config.engineEnabled) {
            showToast("CAPTURING: RAW MODE");
            setTimeout(() => {
                setSelectedImage("https://images.unsplash.com/photo-1621252179027-94459dba115e?q=80&w=2670&auto=format&fit=crop");
                setView('EDITOR');
            }, 800);
            return;
        }

        // --- REAL ENGINE FLOW ---
        setProcStatus('ANALYZING');
        setProcLogs(["Initializing Uplink...", "Calibrating Neural Sensors..."]);
        setProcProgress(5);

        try {
            const rawImageUrl = "https://images.unsplash.com/photo-1621252179027-94459dba115e?q=80&w=2670";
            setProcLogs(prev => [...prev, "Performing Vision Analysis..."]);

            // Mock or Real Analysis
            // For the simulator, we might want to simulate the analysis or actually call it
            // const analysis = await analyzeImage(rawImageUrl); 
            // setProcLogs(prev => [...prev, `Detected: ${analysis.classification.primary}`]);

            setProcStatus('GENERATING');
            setProcLogs(prev => [...prev, "Rendering Preview Variations..."]);

            let completed = 0;
            const total = config.profiles.length;

            // Use the real generatePreviewGrid service
            // We'll pass our config.profiles as the "settings" (we might need to adapt them)
            await generatePreviewGrid(
                rawImageUrl,
                config as any, // The service expects LuxConfig, we pass our simulator config
                null,
                (event) => {
                    if (event.type === 'info') setProcLogs(prev => [...prev, event.message]);
                    if (event.type === 'variation') {
                        completed++;
                        setProcProgress(20 + (completed / total) * 80);
                        setHistory(prev => [event.data, ...prev]);
                        setProcLogs(prev => [...prev, `Look Saved: ${event.data.style_id}`]);
                    }
                    if (event.type === 'done') {
                        setProcStatus('DONE');
                        setProcProgress(100);
                        setTimeout(() => {
                            setProcStatus('IDLE');
                            setView('GALLERY');
                            showToast(`${total} VARIATIONS COMPLETED`);
                        }, 1500);
                    }
                    if (event.type === 'error' || event.type === 'variation_error') {
                        throw new Error(event.type === 'error' ? event.message : event.error);
                    }
                }
            );

        } catch (err: any) {
            console.error("Engine Error:", err);
            setProcStatus('ERROR');
            setProcLogs(prev => [...prev, `FATAL: ${err.message}`]);
            setTimeout(() => setProcStatus('IDLE'), 3000);
        }
    };

    const addProfile = () => {
        const newP = { id: Date.now().toString(), name: `PROFILE ${config.profiles.length + 1}`, strength: 50, hdr: 20 };
        setConfig({ ...config, profiles: [...config.profiles, newP] });
        showToast("ADDED PREVIEW SLOT");
    };

    const updateProfile = (id: string, field: keyof PreviewProfile, value: any) => {
        setConfig({
            ...config,
            profiles: config.profiles.map(p => p.id === id ? { ...p, [field]: value } : p)
        });
    };

    const deleteProfile = (id: string) => {
        if (config.profiles.length <= 1) return showToast("MIN 1 PROFILE REQ");
        setConfig({ ...config, profiles: config.profiles.filter(p => p.id !== id) });
    };

    return (
        <div className="w-full h-screen bg-black text-white overflow-hidden relative font-sans flex flex-col select-none">

            {/* === GLOBAL STATUS BAR === */}
            <div className="w-full px-6 py-4 flex justify-between items-center z-50 bg-black border-b border-white/5 h-16 relative">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold text-lumen-gold tracking-widest cursor-pointer" onClick={() => setShowHelp(!showHelp)}>
                        LUXSCALER OS <span className="text-white/30">v2.4</span>
                    </span>
                    <div className={`px-2 py-0.5 rounded-full border text-[8px] font-bold ${config.engineEnabled ? 'border-lumen-gold text-lumen-gold bg-lumen-gold/10' : 'border-white/20 text-white/40'}`}>
                        ENG: {config.engineEnabled ? `ON [${config.profiles.length}]` : 'OFF'}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/80">
                    <button onClick={toggleSim} className="text-red-500/50 hover:text-red-500 mr-2"><Power size={14} /></button>
                    <button onClick={() => setShowHelp(!showHelp)} className="text-white/30 hover:text-lumen-gold"><HelpCircle size={14} /></button>
                    <Wifi className="w-3 h-3 text-white/30" />
                    <Battery className="w-4 h-4 text-lumen-gold" />
                </div>
            </div>

            {/* === MAIN CONTENT AREA === */}
            <div className="flex-1 relative overflow-hidden bg-[#0a0a0a] z-0">

                {/* TOAST */}
                <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 pointer-events-none ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                    <div className="bg-lumen-gold/10 backdrop-blur-md border border-lumen-gold/50 px-4 py-1 rounded shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                        <p className="text-[10px] font-mono font-bold text-lumen-gold tracking-wider">{toast}</p>
                    </div>
                </div>

                {config.devMode && procStatus === 'IDLE' && (
                    <div className="absolute bottom-4 right-4 z-[100]">
                        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono px-2 py-1 rounded flex items-center gap-2">
                            <AlertTriangle size={12} /> <span>STATUS: ACTIVE</span>
                        </div>
                    </div>
                )}

                {procStatus !== 'IDLE' && (
                    <ProcessingOverlay
                        status={procStatus}
                        logs={procLogs}
                        progress={procProgress}
                        profiles={config.profiles}
                    />
                )}

                {view === 'CAMERA' && (
                    <CameraHUD
                        appMode={appMode} setAppMode={setAppMode}
                        activeLens={activeLens} setActiveLens={setActiveLens}
                        flashOn={flashOn} setFlashOn={() => setFlashOn(!flashOn)}
                        onOpenGallery={() => setView('GALLERY')}
                        onProcess={handleCapture}
                        onSettings={() => setView('SETTINGS')}
                        showGrid={config.showGrid}
                    />
                )}

                {view === 'GALLERY' && (
                    <GalleryView
                        history={history}
                        onClose={() => setView('CAMERA')}
                        onSelect={(img: any) => { setSelectedImage(img); setView('EDITOR'); }}
                    />
                )}

                {view === 'EDITOR' && (
                    <EditorView
                        image={selectedImage}
                        editState={editState} setEditState={setEditState}
                        onBack={() => setView('GALLERY')}
                        onPresets={() => setView('PRESETS')}
                        onReset={() => setEditState({ exposure: 100, contrast: 100, vibrance: 100, preset: 'NONE' })}
                    />
                )}

                {view === 'SETTINGS' && (
                    <SettingsView
                        config={config} setConfig={setConfig}
                        addProfile={addProfile} updateProfile={updateProfile} deleteProfile={deleteProfile}
                        onClose={() => setView('CAMERA')} onExit={toggleSim}
                    />
                )}
            </div>

            {/* NAV BAR */}
            {view !== 'CAMERA' && view !== 'SETTINGS' && (
                <div className="bg-black border-t border-white/10 p-4 shrink-0 flex justify-around items-center z-50 h-20">
                    <NavBtn icon={<Aperture />} label="Camera" onClick={() => setView('CAMERA')} />
                    <NavBtn icon={<Grid />} label="Gallery" active={view === 'GALLERY'} onClick={() => setView('GALLERY')} />
                    <NavBtn icon={<Sliders />} label="Studio" active={view === 'EDITOR'} onClick={() => setView('EDITOR')} />
                </div>
            )}
        </div>
    );
};

// ==============================================
// 5. SETTINGS VIEW (REFACTORED FOR ENGINES)
// ==============================================
const SettingsView = ({ config, setConfig, addProfile, updateProfile, deleteProfile, onClose, onExit }: any) => (
    <div className="absolute inset-0 z-[60] bg-[#050505] p-6 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#050505] py-2 z-10">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Settings size={20} className="text-lumen-gold" /> LUX ENGINE CONFIG
            </h2>
            <button onClick={onClose} className="p-2"><X className="text-white/50" /></button>
        </div>

        <div className="space-y-8">
            {/* MASTER TOGGLE */}
            <div className="bg-white/5 p-4 rounded border border-white/10">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-white">LuxScaler Engine</h3>
                        <p className="text-[10px] text-white/30 uppercase tracking-tighter">Process photos during capture</p>
                    </div>
                    <button onClick={() => setConfig({ ...config, engineEnabled: !config.engineEnabled })} className={`w-10 h-5 rounded-full transition-colors ${config.engineEnabled ? 'bg-lumen-gold' : 'bg-white/10'} relative`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${config.engineEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>

            {/* PROFILES MANAGER */}
            {config.engineEnabled && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Preview Profiles</h3>
                        <button onClick={addProfile} className="text-[10px] text-lumen-gold border border-lumen-gold/30 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-lumen-gold/10">
                            <Plus size={10} /> ADD SLOT
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {config.profiles.map((p: PreviewProfile) => (
                            <div key={p.id} className="bg-white/[0.03] p-4 rounded border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <input
                                        type="text" value={p.name}
                                        onChange={(e) => updateProfile(p.id, 'name', e.target.value.toUpperCase())}
                                        className="bg-transparent border-b border-white/10 text-xs font-bold text-lumen-gold focus:border-lumen-gold outline-none w-1/2"
                                    />
                                    <button onClick={() => deleteProfile(p.id)} className="text-red-500/40 hover:text-red-500"><Trash2 size={12} /></button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[8px] text-white/30 uppercase block mb-1">Scale Power: {p.strength}%</label>
                                        <input type="range" min="0" max="100" value={p.strength} onChange={(e) => updateProfile(p.id, 'strength', parseInt(e.target.value))} className="w-full accent-lumen-gold h-1" />
                                    </div>
                                    <div>
                                        <label className="text-[8px] text-white/30 uppercase block mb-1">HDR Boost: {p.hdr}%</label>
                                        <input type="range" min="0" max="100" value={p.hdr} onChange={(e) => updateProfile(p.id, 'hdr', parseInt(e.target.value))} className="w-full accent-lumen-gold h-1" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GENERAL */}
            <div className="bg-white/5 p-4 rounded border border-white/10 space-y-4">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Simulator Settings</h3>
                <div className="flex justify-between text-sm"><span>Viewfinder Grid</span>
                    <button onClick={() => setConfig({ ...config, showGrid: !config.showGrid })} className={`w-10 h-5 rounded-full ${config.showGrid ? 'bg-white/40' : 'bg-white/10'} relative`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full ${config.showGrid ? 'right-1' : 'left-1'}`}></div>
                    </button>
                </div>
                <div className="flex justify-between text-sm"><span>Developer Mode</span>
                    <button onClick={() => setConfig({ ...config, devMode: !config.devMode })} className={`w-10 h-5 rounded-full ${config.devMode ? 'bg-red-500/50' : 'bg-white/10'} relative`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full ${config.devMode ? 'right-1' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>

            <button onClick={onExit} className="w-full py-4 border border-red-500/30 text-red-500 font-bold uppercase text-[10px] tracking-widest rounded-sm hover:bg-red-500 hover:text-white transition-all">
                Kill Process & Shutdown
            </button>
        </div>
    </div>
);


const CameraHUD = ({ appMode, setAppMode, activeLens, setActiveLens, flashOn, setFlashOn, onOpenGallery, onProcess, onSettings, showGrid }: any) => {
    const zoomMap: Record<string, number> = { 'WIDE': 0.6, '1x': 1, '2x': 2, '5x': 4 };
    return (
        <div className="absolute inset-0 flex flex-col z-0 bg-black">
            <div className="absolute inset-0 z-0 bg-[#0f0f0f] overflow-hidden">
                <div className="w-full h-full transition-transform duration-500 ease-out origin-center" style={{ transform: `scale(${zoomMap[activeLens]})` }}>
                    <img src="https://images.unsplash.com/photo-1621252179027-94459dba115e?q=80&w=2670" className="w-full h-full object-cover opacity-80" />
                </div>
                {showGrid && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                        {[...Array(9)].map((_, i) => <div key={i} className="border border-white/40"></div>)}
                    </div>
                )}
            </div>

            <div className="relative z-20 w-full p-6 flex justify-between items-start">
                <div className="flex flex-col gap-2">
                    <ConfigBtn label="ENGINE" value={appMode} onClick={() => setAppMode(appMode === 'PROLUX' ? 'PRO' : 'PROLUX')} />
                    <ConfigBtn label="HDR" value="ULTRA" />
                </div>
                <div className="flex flex-col gap-4">
                    <button onClick={onSettings} className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white/50 hover:text-lumen-gold"><Settings size={20} /></button>
                    <button onClick={setFlashOn} className={`p-3 bg-black/40 backdrop-blur-md rounded-full border ${flashOn ? 'border-lumen-gold text-lumen-gold' : 'border-white/10 text-white/50'}`}><Zap size={20} /></button>
                </div>
            </div>

            <div className="mt-auto relative z-20 w-full p-6 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center">
                <div className="flex gap-4 mb-8">
                    {['WIDE', '1x', '2x', '5x'].map(l => (
                        <button key={l} onClick={() => setActiveLens(l)} className={`w-12 h-12 rounded-full border text-[10px] font-bold ${activeLens === l ? 'bg-lumen-gold text-black border-lumen-gold' : 'text-white/40 border-white/10'}`}>{l}</button>
                    ))}
                </div>
                <div className="flex items-center justify-between w-full px-8">
                    <button onClick={onOpenGallery} className="w-14 h-14 bg-white/5 rounded border border-white/10 overflow-hidden"><img src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=100" className="w-full h-full object-cover opacity-50" /></button>
                    <button onClick={onProcess} className="w-24 h-24 rounded-full border-4 border-white/5 p-1 flex items-center justify-center group active:scale-90 transition-transform"><div className="w-full h-full bg-white rounded-full group-hover:bg-lumen-gold transition-colors"></div></button>
                    <button className="w-14 h-14 bg-white/5 rounded-full border border-white/10 flex items-center justify-center text-white/20"><SwitchCamera /></button>
                </div>
            </div>
        </div>
    );
};

const GalleryView = ({ history, onClose, onSelect }: any) => (
    <div className="absolute inset-0 z-10 bg-[#050505] p-6 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#050505] py-2 z-10">
            <h2 className="text-xl font-bold tracking-tighter flex items-center gap-2">
                <Database size={18} className="text-lumen-gold" /> MASTER ARCHIVE
            </h2>
            <button onClick={onClose} className="p-2"><X className="text-white/50" /></button>
        </div>
        
        {history && history.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
                {history.map((item: any, i: number) => (
                    <div 
                        key={item.id || i} 
                        onClick={() => onSelect(item.image_path)} 
                        className="aspect-[2/3] bg-white/5 border border-white/10 rounded overflow-hidden relative group active:scale-95 transition-all"
                    >
                        <img src={item.image_path} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                            <span className="text-[7px] font-black text-lumen-gold uppercase tracking-[0.2em]">{item.style_id}</span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-20">
                <ImageIcon size={48} />
                <p className="text-[10px] uppercase font-bold tracking-widest leading-loose">
                    Archive is Empty<br/>
                    Capture with LUX Engine to Populate
                </p>
            </div>
        )}

        {/* Legacy placeholders when history is empty */}
        {(!history || history.length === 0) && (
            <div className="mt-8 pt-8 border-t border-white/5">
                <h3 className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-4">Sample Data</h3>
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-square bg-white/5 border border-white/5 rounded-sm overflow-hidden opacity-20 grayscale">
                            <img src={`https://images.unsplash.com/photo-${1621252179027 + i}?w=400`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const EditorView = ({ image, editState, setEditState, onBack, onPresets, onReset }: any) => {
    const adjust = (k: any, d: any) => setEditState({ ...editState, [k]: Math.max(0, Math.min(200, editState[k] + d)) });
    return (
        <div className="absolute inset-0 z-10 flex flex-col bg-black">
            <div className="flex-1 relative flex items-center justify-center p-4">
                <img src={image} className="max-h-full max-w-full object-contain" style={{ filter: `brightness(${editState.exposure}%) contrast(${editState.contrast}%) saturate(${editState.vibrance}%)` }} />
                <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-black/40 rounded-full border border-white/10"><ChevronLeft /></button>
                <div className="absolute top-6 right-6 flex gap-2">
                    <button onClick={onReset} className="px-3 py-1 bg-black/40 border border-white/10 text-[10px] rounded uppercase font-bold text-white/40">Reset</button>
                    <button onClick={onPresets} className="px-3 py-1 bg-black/40 border border-lumen-gold/30 text-[10px] rounded uppercase font-bold text-lumen-gold flex items-center gap-1"><Film size={12} /> {editState.preset}</button>
                </div>
            </div>
            <div className="h-1/3 bg-[#0a0a0a] border-t border-white/5 p-8 flex flex-col justify-between">
                <div className="flex justify-around items-center">
                    <Dial label="EXP" val={editState.exposure} icon={<Sun size={10} />} color="text-yellow-400" onInc={() => adjust('exposure', 5)} onDec={() => adjust('exposure', -5)} />
                    <Dial label="CON" val={editState.contrast} icon={<Aperture size={10} />} color="text-white" onInc={() => adjust('contrast', 5)} onDec={() => adjust('contrast', -5)} />
                    <Dial label="VIB" val={editState.vibrance} icon={<Palette size={10} />} color="text-pink-400" onInc={() => adjust('vibrance', 5)} onDec={() => adjust('vibrance', -5)} />
                </div>
                <button className="w-full py-4 bg-lumen-gold text-black font-bold uppercase text-xs tracking-widest rounded-sm">Export Master V2</button>
            </div>
        </div>
    );
};

const PresetsView = ({ onClose, onApply }: any) => (
    <div className="absolute inset-0 z-30 bg-[#050505] p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#050505] py-2 z-10">
            <h2 className="text-xl font-bold">ENGINE LOOKS</h2>
            <button onClick={onClose} className="text-lumen-gold"><Check /></button>
        </div>
        <div className="space-y-4">
            <LookRow name="RAW FLAT" color="bg-white/10" onClick={() => onApply('RAW FLAT', { exposure: 100, contrast: 80, vibrance: 90 })} />
            <LookRow name="VIVID PUNCH" color="bg-orange-500/20" onClick={() => onApply('VIVID PUNCH', { exposure: 110, contrast: 120, vibrance: 130 })} />
            <LookRow name="NOIR 800" color="bg-white/5" onClick={() => onApply('NOIR 800', { exposure: 100, contrast: 140, vibrance: 0 })} />
        </div>
    </div>
);

const ConfigBtn = ({ label, value, onClick }: any) => (
    <button onClick={onClick} className="bg-black/40 backdrop-blur-md px-3 py-1 border border-white/10 flex flex-col items-start w-20 rounded-sm hover:bg-white/5 transition-all active:scale-95">
        <span className="text-[7px] text-white/30 font-bold">{label}</span>
        <span className="text-[10px] font-mono font-bold text-white">{value}</span>
    </button>
);

const NavBtn = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-lumen-gold' : 'text-white/30 hover:text-white'} transition-colors`}>{icon}<span className="text-[8px] font-bold uppercase">{label}</span></button>
);

const Dial = ({ label, val, icon, color, onInc, onDec }: any) => (
    <div className="flex flex-col items-center gap-2 group">
        <div className="w-14 h-14 rounded-full border border-white/10 relative flex items-center justify-center bg-black/40">
            <div className="absolute inset-y-0 left-0 w-1/2 cursor-pointer" onClick={onDec}></div>
            <div className="absolute inset-y-0 right-0 w-1/2 cursor-pointer" onClick={onInc}></div>
            <div className={`text-[10px] font-mono font-bold ${color}`}>{val}%</div>
        </div>
        <div className="flex items-center gap-1 text-[8px] text-white/30 font-bold uppercase tracking-widest">{icon}{label}</div>
    </div>
);

const LookRow = ({ name, color, onClick }: any) => (
    <div onClick={onClick} className="p-5 bg-white/[0.03] border border-white/5 rounded-sm flex items-center gap-4 cursor-pointer hover:border-white/20 active:scale-[0.98]">
        <div className={`w-12 h-12 rounded ${color}`}></div>
        <span className="text-sm font-bold text-white">{name}</span>
    </div>
);
