import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PillarColumn from '../components/PillarColumn';
import UserMacroControl from '../components/UserMacroControl';
import ProMacroGallery from '../components/ProMacroGallery';
import VisionAnalysisModal from '../components/VisionAnalysisModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Sparkles, Terminal, Camera, Zap } from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [inputText, setInputText] = useState("Mejorar esta imagen con estilo cinematográfico.");
  const [imageUrl, setImageUrl] = useState("https://images.pexels.com/photos/35501372/pexels-photo-35501372.jpeg"); // Default mock image
  
  // Vision Analysis State
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchConfig = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pillars/config?userId=${user.id}`);
      const data = await res.json();
      setConfig(data);
    } catch (e) {
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [user]);

  // Handle Updates
  const handleSliderUpdate = async (pillarName, sliderName, value) => {
    // Optimistic update logic same as before...
    const newConfig = { ...config };
    const pillar = newConfig[pillarName];
    const slider = pillar.sliders.find(s => s.name === sliderName);
    slider.value = value;
    setConfig(newConfig);
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pillars/slider-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pilarName: pillarName, sliderName, value })
    });
  };

  const handleUserMacroUpdate = async (values) => {
    // Call user macro endpoint
    try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/process/apply-user-macro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, ...values })
        });
        const data = await res.json();
        if(data.success) setConfig(data.config);
    } catch (e) { console.error(e); }
  };

  const handleProMacroSelect = async (macroKey) => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/process/apply-pro-macro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, macroKey })
        });
        const data = await res.json();
        if(data.success) {
            setConfig(data.config);
            toast.success("Receta aplicada correctamente");
        }
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (pillarName, mode) => { /* Same as before */ };

  const handleGenerateClick = async () => {
    if (config.user_mode === 'user') {
        // User mode: Direct generation (Auto analysis in backend)
        await runGeneration();
    } else {
        // Pro/Prolux: Analyze first
        setAnalyzing(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/process/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, imageUrl })
            });
            const data = await res.json();
            if (data.success) {
                setAnalysisData(data.analysis);
                setShowAnalysis(true);
            }
        } catch (e) {
            toast.error("Análisis falló");
        } finally {
            setAnalyzing(false);
        }
    }
  };

  const runGeneration = async () => {
    setProcessing(true);
    setResult(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/process/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, input: { content: inputText, imageUrl }, analysisResult: analysisData })
      });
      const data = await res.json();
      setResult(data.output.text);
      setShowAnalysis(false);
      toast.success("Procesamiento completado");
    } catch (e) {
      toast.error("Generación falló");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !config) return <div className="h-screen bg-black text-gold flex items-center justify-center">Loading...</div>;

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#020204] z-20">
          <h1 className="text-xl font-serif text-primary tracking-tighter">LUXSCALER <span className="text-xs font-sans text-muted-foreground ml-2">v27.0</span></h1>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono px-3 py-1 bg-white/5 rounded-full border border-white/10 uppercase text-primary">
                {config.user_mode} MODE
            </span>
            <button onClick={() => navigate('/modes')} className="text-xs text-muted-foreground hover:text-white">SWITCH MODE</button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
            
            {/* LEFT PANEL: CONTROLS */}
            <div className="col-span-8 bg-[#050505] overflow-y-auto relative border-r border-white/10">
                
                {/* USER MODE UI */}
                {config.user_mode === 'user' && (
                    <UserMacroControl onUpdate={handleUserMacroUpdate} />
                )}

                {/* PRO MODE UI */}
                {config.user_mode === 'pro' && (
                    <ProMacroGallery onSelect={handleProMacroSelect} />
                )}

                {/* PROLUX MODE UI (Full Grid) */}
                {config.user_mode === 'prolux' && (
                    <div className="grid grid-cols-3 h-full">
                         <PillarColumn pillar={config.photoscaler} onToggle={handleToggle} onSliderUpdate={handleSliderUpdate} />
                         <PillarColumn pillar={config.stylescaler} onToggle={handleToggle} onSliderUpdate={handleSliderUpdate} />
                         <PillarColumn pillar={config.lightscaler} onToggle={handleToggle} onSliderUpdate={handleSliderUpdate} />
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: PREVIEW & ACTION */}
            <div className="col-span-4 bg-[#08080A] flex flex-col p-6 overflow-hidden">
                {/* Image Input Simulation */}
                <div className="mb-6 relative group aspect-video bg-black rounded-sm border border-white/10 overflow-hidden">
                    <img src={imageUrl} alt="Input" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Camera className="text-white/20" size={48} />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Instrucción / Prompt</label>
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full h-24 bg-black/40 border border-white/10 p-4 text-sm font-mono text-white focus:border-primary outline-none resize-none rounded-sm"
                    />
                </div>

                <button 
                    onClick={handleGenerateClick}
                    disabled={processing || analyzing}
                    className="w-full bg-primary text-black font-bold h-14 uppercase tracking-widest hover:bg-[#E5C158] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
                >
                    {analyzing ? <Zap className="animate-pulse" /> : <Sparkles />}
                    {analyzing ? 'Analizando...' : processing ? 'Procesando...' : config.user_mode === 'user' ? 'Generar' : 'Analizar y Generar'}
                </button>

                <div className="flex-1 overflow-auto bg-black/20 border border-white/5 p-4 rounded-sm font-mono text-xs">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground border-b border-white/5 pb-2">
                        <Terminal size={12} />
                        <span className="uppercase tracking-widest">System Output</span>
                    </div>
                    {result ? (
                         <div className="text-white/80 whitespace-pre-wrap">{result}</div>
                    ) : (
                        <div className="text-white/20 italic">Waiting for execution...</div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <VisionAnalysisModal 
        open={showAnalysis} 
        analysis={analysisData}
        onConfirm={runGeneration}
        onCancel={() => setShowAnalysis(false)}
        generating={processing}
      />
    </Layout>
  );
}
