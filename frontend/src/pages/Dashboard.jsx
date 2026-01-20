import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PillarColumn from '../components/PillarColumn';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
// Using simple icons instead of phosphor icons for now
const Sparkles = () => <span>✨</span>;
const Terminal = () => <span>💻</span>;

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [inputText, setInputText] = useState("Describe a futuristic city with golden lights.");

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

  const handleSliderUpdate = async (pillarName, sliderName, value) => {
    // Optimistic update
    const newConfig = { ...config };
    const pillar = newConfig[pillarName];
    const slider = pillar.sliders.find(s => s.name === sliderName);
    slider.value = value;
    // Note: Snippet won't update optimistically perfectly without local dictionary logic, 
    // but we will wait for server response to be 100% sure or map it locally.
    // For MVP we just wait for server response to update snippet text to avoid duplication logic.
    
    // Quick local snippet update could be added here if we imported the dictionary.
    
    setConfig(newConfig);

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pillars/slider-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pilarName: pillarName, sliderName, value })
      });
      const data = await res.json();
      if (data.success) {
        // Update with real snippet from server
        const updatedConfig = { ...config };
        const p = updatedConfig[pillarName];
        const s = p.sliders.find(sl => sl.name === sliderName);
        s.snippet = data.updated.snippet;
        s.levelText = data.updated.levelText;
        setConfig(updatedConfig);
      }
    } catch (e) {
      toast.error("Failed to update slider");
    }
  };

  const handleToggle = async (pillarName, mode) => {
    const newConfig = { ...config };
    newConfig[pillarName].mode = mode;
    setConfig(newConfig);

    await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pillars/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pilarName: pillarName, mode })
    });
  };

  const handleModeChange = async (mode) => {
      const newConfig = { ...config, user_mode: mode };
      setConfig(newConfig);
       await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/pillars/update-user-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, mode })
    });
    toast.success(`Mode switched to ${mode.toUpperCase()}`);
  }

  const handleGenerate = async () => {
    setProcessing(true);
    setResult(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/process/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, input: { content: inputText } })
      });
      const data = await res.json();
      setResult(data.output.text);
      toast.success("Processing complete");
    } catch (e) {
      toast.error("Generation failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !config) return <div className="h-screen bg-black text-gold flex items-center justify-center">Loading LuxScaler...</div>;

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#020204] z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-serif text-primary tracking-tighter">LUXSCALER <span className="text-xs font-sans text-muted-foreground tracking-widest ml-2">v27.0</span></h1>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-sm gap-1">
            {['user', 'pro', 'prolux'].map((m) => (
                <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`px-4 py-1 text-xs uppercase tracking-widest rounded-sm transition-all ${config.user_mode === m ? 'bg-primary text-black font-bold' : 'text-muted-foreground hover:text-white'}`}
                >
                    {m}
                </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-right text-muted-foreground">
                <p>{user.email}</p>
                <p className="font-mono text-[10px] opacity-50">{config.user_mode.toUpperCase()} MODE</p>
            </div>
            <button onClick={() => window.location.href = '/login'} className="text-xs text-red-500 hover:text-red-400">LOGOUT</button>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
            {/* Pillars Section (9 cols) */}
            <div className="col-span-9 grid grid-cols-3 h-full overflow-hidden bg-[#050505]">
                <PillarColumn pillar={config.photoscaler} onToggle={handleToggle} onSliderUpdate={handleSliderUpdate} />
                <PillarColumn pillar={config.stylescaler} onToggle={handleToggle} onSliderUpdate={handleSliderUpdate} />
                <PillarColumn pillar={config.lightscaler} onToggle={handleToggle} onSliderUpdate={handleSliderUpdate} />
            </div>

            {/* Preview/Action Section (3 cols) */}
            <div className="col-span-3 border-l border-white/10 bg-[#08080A] flex flex-col p-6">
                <div className="mb-8">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Input Request</label>
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full h-32 bg-black/40 border border-white/10 p-4 text-sm font-mono text-white focus:border-primary outline-none resize-none rounded-sm"
                        placeholder="Describe what you want to generate..."
                    />
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={processing}
                    className="w-full bg-primary text-black font-bold h-12 uppercase tracking-widest hover:bg-[#E5C158] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-8"
                >
                    {processing ? <Sparkles className="animate-spin" /> : <Sparkles />}
                    {processing ? 'Processing...' : 'Generate'}
                </button>

                <div className="flex-1 overflow-auto bg-black/20 border border-white/5 p-4 rounded-sm">
                    <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                        <Terminal size={14} />
                        <span className="text-xs uppercase tracking-widest">System Output</span>
                    </div>
                    {result ? (
                        <p className="text-sm font-light leading-relaxed whitespace-pre-wrap animate-in fade-in duration-500">
                            {result}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground/50 italic">Waiting for input...</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
}
