import React, { useEffect, useState, useRef } from 'react';
// ... imports ...
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PillarColumn from '../components/PillarColumn';
import UserMacroControl from '../components/UserMacroControl';
import ProMacroGallery from '../components/ProMacroGallery';
import VisionAnalysisModal from '../components/VisionAnalysisModal';
import ResultOverlay from '../components/ResultOverlay';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Sparkles, Terminal, Camera, Zap, Upload, X } from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // Now stores full result object
  const [inputText, setInputText] = useState("Mejorar esta imagen con estilo cinematográfico.");
  
  const [imageUrl, setImageUrl] = useState("https://images.pexels.com/photos/35501372/pexels-photo-35501372.jpeg"); 
  const [isCustomImage, setIsCustomImage] = useState(false);
  const fileInputRef = useRef(null);

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
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

  useEffect(() => { fetchConfig(); }, [user]);

  // ... Handlers (Slider, Macro, Toggle) same as before ...
  const handleSliderUpdate = async (p, s, v) => { /*...*/ };
  const handleUserMacroUpdate = async (v) => { /*...*/ };
  const handleProMacroSelect = async (k) => { /*...*/ };
  const handleToggle = async (p, m) => { /*...*/ };

  // File Upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result);
            setIsCustomImage(true);
            toast.success("Imagen cargada");
        };
        reader.readAsDataURL(file);
    }
  };
  const triggerFileUpload = () => fileInputRef.current.click();
  const resetImage = () => { setImageUrl("https://images.pexels.com/photos/35501372/pexels-photo-35501372.jpeg"); setIsCustomImage(false); };

  // Generate
  const handleGenerateClick = async () => {
    if (config.user_mode === 'user') {
        await runGeneration();
    } else {
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
      
      // Update: Store full output object (text + image)
      setResult(data.output); 
      
      setShowAnalysis(false);
      setShowResult(true); 
      toast.success("Generación completada");
    } catch (e) {
      toast.error("Generación falló");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Simplified Header for brevity in this update */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#020204] z-20">
             <h1 className="text-xl font-serif text-primary">LUXSCALER</h1>
             <button onClick={() => navigate('/modes')} className="text-xs text-muted-foreground">SWITCH MODE</button>
        </header>

        <div className="flex-1 grid grid-cols-12 overflow-hidden">
            <div className="col-span-8 bg-[#050505] overflow-y-auto relative border-r border-white/10">
                {/* Simplified Controls Render */}
                {config && config.user_mode === 'user' && <UserMacroControl onUpdate={handleUserMacroUpdate} />}
                {config && config.user_mode === 'pro' && <ProMacroGallery onSelect={handleProMacroSelect} />}
                {config && config.user_mode === 'prolux' && (
                    <div className="grid grid-cols-3 h-full">
                         <PillarColumn pillar={config.photoscaler} onToggle={handleToggle} onSliderUpdate={handleSliderUpdate} />
                         <PillarColumn pillar={config.stylescaler} onToggle={handleToggle} onSliderUpdate={handleSliderUpdate} />
                         <PillarColumn pillar={config.lightscaler} onToggle={handleToggle} onSliderUpdate={handleSliderUpdate} />
                    </div>
                )}
            </div>

            <div className="col-span-4 bg-[#08080A] flex flex-col p-6 overflow-hidden">
                <div className="mb-6 relative group aspect-video bg-black rounded-sm border border-white/10 overflow-hidden cursor-pointer" onClick={triggerFileUpload}>
                    <img src={imageUrl} alt="Input" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" />
                </div>
                <div className="mb-4">
                    <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 p-4 text-sm font-mono text-white outline-none rounded-sm" />
                </div>
                <button onClick={handleGenerateClick} disabled={processing || analyzing} className="w-full bg-primary text-black font-bold h-14 uppercase hover:bg-[#E5C158] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-6">
                    {analyzing ? <Zap className="animate-pulse" /> : <Sparkles />}
                    {analyzing ? 'Analizando...' : processing ? 'Procesando...' : 'Generar'}
                </button>
            </div>
        </div>

        <VisionAnalysisModal open={showAnalysis} analysis={analysisData} onConfirm={runGeneration} onCancel={() => setShowAnalysis(false)} generating={processing} />
        <ResultOverlay open={showResult} onClose={() => setShowResult(false)} resultData={result} onSave={() => toast.success("Saved")} onRefine={() => {}} />
      </div>
    </Layout>
  );
}
