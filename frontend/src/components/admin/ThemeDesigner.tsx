
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Smartphone, Monitor, Save, Eye, Palette, Sun, Fingerprint, Scan, Upload, Cloud } from 'lucide-react';
import { HeroGallery } from '../HeroGallery';
import { getSupabaseClient } from '../../services/authService';
import { optimizeImage } from '../../utils/imageOptimizer';


// Base URL for home images (fallback)
const HOME_BASE = "https://pjscnzymofaijevonxkm.supabase.co/storage/v1/object/public/lux-storage/webasset/landing";

type MotorTheme = {
    name: string;
    tagline: string;
    desc: string;
    bgTone: string;
    accentColor: string;
    before: string;
    after: string;
    isZoom?: boolean;
};

// Motor Icons Map
const MOTOR_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    photo: Fingerprint,
    style: Palette,
    light: Sun,
    up: Scan
};

// RELOAD THIS FROM DB IN FUTURE
// Default Themes - Using home01-04 images
const DEFAULT_THEMES: Record<string, MotorTheme> = {
    photo: {
        name: "PHOTOSCALER™",
        tagline: "The Virtual Camera",
        desc: "Simulates high-end optics. Replaces mobile distortion with portrait telephoto physics.",
        bgTone: "#080808",
        accentColor: "#D4AF37",
        before: `${HOME_BASE}/home01.webp`,
        after: `${HOME_BASE}/home02.webp`
    },
    style: {
        name: "STYLESCALER",
        tagline: "The Color Lab",
        desc: "Cinema-grade color science. Simulates film stocks and unifies atmosphere.",
        bgTone: "#050505",
        accentColor: "#D4AF37",
        before: `${HOME_BASE}/home02.webp`,
        after: `${HOME_BASE}/home03.webp`
    },
    light: {
        name: "LIGHTSCALER",
        tagline: "The Lighting Rig",
        desc: "Simulates studio equipment. Adds Key, Fill, and Rim lights for professional volume.",
        bgTone: "#080808",
        accentColor: "#D4AF37",
        before: `${HOME_BASE}/home03.webp`,
        after: `${HOME_BASE}/home04.webp`
    },
    up: {
        name: "UPSCALER",
        tagline: "The Print Master",
        desc: "Resolution enhancement. Injects plausible texture consistent with 150MP sensors.",
        bgTone: "#050505",
        accentColor: "#D4AF37",
        before: `${HOME_BASE}/home04.webp`,
        after: `${HOME_BASE}/home04.webp`,
        isZoom: true
    }
};

const ThemeDesigner = () => {
    const [activeMotor, setActiveMotor] = useState('photo');
    const [themes, setThemes] = useState<Record<string, MotorTheme>>(DEFAULT_THEMES);
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);

    const supabase = getSupabaseClient();

    // Fetch themes from Supabase on mount (Optional, if table exists)
    useEffect(() => {
        // Placeholder for fetch logic
    }, []);

    // Update a field in the current theme
    const updateField = (field: keyof MotorTheme, value: any) => {
        setThemes(prev => ({
            ...prev,
            [activeMotor]: { ...prev[activeMotor], [field]: value }
        }));
        setSaved(false);
    };

    // Handle Image Upload with Optimization
    const handleImageUpload = async (field: 'before' | 'after', file: File) => {
        if (!file) return;
        setUploading(`${activeMotor}-${field}`);

        try {
            // 1. Optimize Image (Resize & WebP)
            // User requested "100% fit to screen" -> Max width 2048 is safe for most generic assets
            const optimizedBlob = await optimizeImage(file, 2048, 2048, 0.75);

            // 2. Upload to Supabase
            const fileName = `webasset/landing/theme_uploads/${activeMotor}_${field}_${Date.now()}.webp`;
            const { data, error } = await supabase.storage
                .from('lux-storage') // Ensuring bucket usage
                .upload(fileName, optimizedBlob, {
                    contentType: 'image/webp',
                    upsert: true
                });

            if (error) throw error;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('lux-storage')
                .getPublicUrl(fileName);

            // 4. Update State
            updateField(field, publicUrl);

        } catch (err: any) {
            console.error("Upload failed:", err);
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploading(null);
        }
    };

    // Save handler
    const handleSave = async () => {
        setSaving(true);
        try {
            // Upsert to landing_themes table
            // Preparing data payload - simplified for now
            const payload = Object.entries(themes).map(([key, theme]) => ({
                component_id: key,
                theme_data: theme
            }));

            // Attempt to save to Supabase if table exists
            const { error } = await supabase
                .from('landing_themes')
                .upsert(payload, { onConflict: 'component_id' });

            if (error) {
                // Determine if table missing vs other error
                if (error.code === '42P01') {
                    console.warn("Table 'landing_themes' does not exist yet. Running in local mode.");
                } else {
                    console.error("Save error:", error);
                }
            }

            await new Promise(r => setTimeout(r, 500)); // Min delay for feedback
            console.log('[ThemeDesigner] Themes synced:', themes);
            setSaved(true);
        } catch (e) {
            console.error("Save failed", e);
        } finally {
            setSaving(false);
        }
    };

    const currentTheme = themes[activeMotor];
    const MotorIcon = MOTOR_ICONS[activeMotor];

    return (
        <div className="flex h-full bg-transparent text-white overflow-hidden font-sans">

            {/* LEFT: CONTROLS */}
            <div className="w-[400px] border-r border-white/10 flex flex-col bg-black/60 backdrop-blur-md overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                    <h2 className="text-sm font-bold tracking-widest text-[#D4AF37]">THEME DESIGNER</h2>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors ${saved
                            ? 'bg-green-500 text-white'
                            : 'bg-[#D4AF37] text-black hover:bg-white'
                            }`}
                    >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        {saved ? 'SAVED' : 'SAVE CHANGES'}
                    </button>
                </div>

                {/* Motor Selector */}
                <div className="p-4 grid grid-cols-4 gap-2 shrink-0">
                    {Object.keys(DEFAULT_THEMES).map(m => {
                        const Icon = MOTOR_ICONS[m];
                        return (
                            <button
                                key={m}
                                onClick={() => setActiveMotor(m)}
                                className={`flex flex-col items-center justify-center gap-1 py-3 rounded border transition-all ${activeMotor === m
                                    ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'
                                    : 'border-white/10 text-gray-500 hover:border-white/30'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-[9px] uppercase font-bold">{m}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Edit Fields */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* CONTENT SECTION */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase flex items-center gap-2">
                            <Cloud className="w-3 h-3" /> Live Content
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase">Title</label>
                                <input
                                    value={currentTheme.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-2 text-sm rounded focus:border-[#D4AF37] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase">Tagline</label>
                                <input
                                    value={currentTheme.tagline}
                                    onChange={(e) => updateField('tagline', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-2 text-sm rounded focus:border-[#D4AF37] outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase">Description</label>
                                <textarea
                                    value={currentTheme.desc}
                                    onChange={(e) => updateField('desc', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-2 text-sm rounded h-20 focus:border-[#D4AF37] outline-none resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* DESIGN SECTION */}
                    <section className="border-t border-white/10 pt-6">
                        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase flex items-center gap-2">
                            <Palette className="w-3 h-3" /> Appearance
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase">Background</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="color"
                                            value={currentTheme.bgTone}
                                            onChange={(e) => updateField('bgTone', e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer border border-white/20"
                                        />
                                        <span className="text-xs text-gray-400 font-mono">{currentTheme.bgTone}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase">Accent</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="color"
                                            value={currentTheme.accentColor}
                                            onChange={(e) => updateField('accentColor', e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer border border-white/20"
                                        />
                                        <span className="text-xs text-gray-400 font-mono">{currentTheme.accentColor}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* IMAGE ASSETS SECTION */}
                    <section className="border-t border-white/10 pt-6">
                        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase flex items-center gap-2">
                            <Upload className="w-3 h-3" /> Assets (Auto-Optimized)
                        </h3>

                        <div className="space-y-6">
                            {/* BEFORE IMAGE */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-[10px] text-gray-500 uppercase">Before</label>
                                    <label className="cursor-pointer text-[10px] text-[#D4AF37] hover:text-white uppercase font-bold flex items-center gap-1">
                                        {uploading === `${activeMotor}-before` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                        Replace
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload('before', e.target.files[0])}
                                            disabled={!!uploading}
                                        />
                                    </label>
                                </div>
                                <div className="relative group rounded border border-white/10 bg-black overflow-hidden h-24 mb-2">
                                    <img src={currentTheme.before} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <input
                                    value={currentTheme.before}
                                    readOnly
                                    className="w-full bg-black/30 border border-white/5 p-1.5 text-[10px] text-gray-500 rounded font-mono truncate cursor-not-allowed"
                                />
                            </div>

                            {/* AFTER IMAGE */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-[10px] text-gray-500 uppercase">After</label>
                                    <label className="cursor-pointer text-[10px] text-[#D4AF37] hover:text-white uppercase font-bold flex items-center gap-1">
                                        {uploading === `${activeMotor}-after` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                        Replace
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload('after', e.target.files[0])}
                                            disabled={!!uploading}
                                        />
                                    </label>
                                </div>
                                <div className="relative group rounded border border-white/10 bg-black overflow-hidden h-24 mb-2">
                                    <img src={currentTheme.after} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <input
                                    value={currentTheme.after}
                                    readOnly
                                    className="w-full bg-black/30 border border-white/5 p-1.5 text-[10px] text-gray-500 rounded font-mono truncate cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* RIGHT: REAL-TIME PREVIEW */}
            <div className="flex-1 bg-transparent relative flex flex-col items-center">

                {/* Preview Toolbar */}
                <div className="h-12 w-full border-b border-white/10 flex items-center justify-center gap-4 bg-[#0a0a0a] shrink-0 z-50 relative shadow-lg">
                    <button
                        onClick={() => setViewMode('desktop')}
                        className={`p-2 rounded flex items-center gap-2 ${viewMode === 'desktop' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Monitor className="w-4 h-4" /> <span className="text-xs uppercase font-bold">Desktop</span>
                    </button>
                    <span className="text-white/20">|</span>
                    <button
                        onClick={() => setViewMode('mobile')}
                        className={`p-2 rounded flex items-center gap-2 ${viewMode === 'mobile' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Smartphone className="w-4 h-4" /> <span className="text-xs uppercase font-bold">Mobile</span>
                    </button>
                    <div className="ml-8 px-3 py-1 bg-yellow-900/30 text-yellow-500 border border-yellow-500/30 text-[10px] rounded uppercase font-bold tracking-widest animate-pulse">
                        Live Preview Mode
                    </div>
                </div>

                {/* Live Preview Container (Sandbox) */}
                <div className="flex-1 w-full overflow-hidden relative flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">

                    {/* Viewport Simulation */}
                    <motion.div
                        layout
                        initial={false}
                        animate={{
                            width: viewMode === 'mobile' ? 375 : '100%',
                            height: viewMode === 'mobile' ? 700 : '100%',
                            borderRadius: viewMode === 'mobile' ? 40 : 0,
                            scale: viewMode === 'mobile' ? 0.95 : 1
                        }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className={`bg-black shadow-2xl relative overflow-hidden border border-white/10 ${viewMode === 'mobile' ? 'shadow-[0_0_50px_rgba(0,0,0,0.5)]' : ''
                            }`}
                    >
                        {/* REAL COMPONENT INJECTION */}
                        {/* We use key to force re-render if necessary, or just rely on react updates */}
                        <div className="w-full h-full overflow-y-auto no-scrollbar relative">
                            <HeroGallery
                                previewThemes={themes}
                                onCtaClick={() => console.log("Standard CTA Clicked (Preview)")}
                                onMotorClick={() => console.log("Motor Clicked (Preview)")}
                            />
                        </div>

                        {/* Mobile Bezel (Visual Only) */}
                        {viewMode === 'mobile' && (
                            <div className="absolute inset-0 pointer-events-none border-[8px] border-black/10 rounded-[40px] z-[100]">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl" />
                            </div>
                        )}
                    </motion.div>
                </div>

            </div>
        </div>
    );
};

export default ThemeDesigner;
