
// NOTE: This file is large; changes focus on wiring & UX only.

import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
// import posthog from 'posthog-js';

// Initialize PostHog (Analytics)
// posthog.init('phc_PLACEHOLDER_KEY', { api_host: 'https://us.i.posthog.com' });
import { Navigation } from './components/Navigation';
import { MobileCameraView } from './components/mobile/MobileCameraView';
import { usePlatform } from './hooks/usePlatform';
import { LuxButton } from './components/LuxButton';
import { JobMonitor } from './components/JobMonitor';
import { ArchivesDashboard } from './components/ArchivesDashboard';
import { AuthModal } from './components/AuthModal';
import { AccessCodeModal } from './components/AccessCodeModal';
import { AdminDashboard } from './components/AdminDashboard';
import { LuxCanvasPage } from './pages/LuxCanvasPage';
import { ProductShowcase } from './components/ProductShowcase';
import { PHOTOSCALER_EXAMPLES, STYLESCALER_EXAMPLES, LIGHTSCALER_EXAMPLES, UPSCALER_EXAMPLES } from './constants/showcaseData';
import { ComparisonSlider } from './components/ComparisonSlider';
import { HeroGallery } from './components/HeroGallery';
import { PurchaseModal } from './components/PurchaseModal';
import { MobileConfigWizard } from './components/MobileConfigWizard';
import { AdvancedConfigModal } from './components/AdvancedConfigModal';
import { ImageInspectorModal } from './components/ImageInspectorModal';
import { ProfileConfigModal } from './components/ProfileConfigModal';
import { UnifiedConfigModal } from './components/UnifiedConfigModal';
import { TermsPage, PrivacyPage, CookiesPage, LegalNoticePage, APIDocsPage, ContactPage, InfoPages } from './components/InfoPages';
import { InfoToast, ToastState } from './components/InfoToast';

import TutorialInteractive from './components/TutorialInteractive';
import FAQInteractive from './components/FAQInteractive';
import { ScalerInfoPage } from './components/ScalerInfoPage';
import { PricingPage } from './components/PricingPage';
import { OutputSelector } from './components/OutputSelector';
import { GlobalFooter } from './components/GlobalFooter';
import { UpscalePage } from './pages/UpscalePage';

import { CookieBanner } from './components/CookieBanner';
import { AgentStatus, AgentMessage, LuxConfig, UserProfile, ArchivedVariation, SemanticAnalysis } from './types';
import { compressAndResizeImage, uploadImageToStorage, generatePreviewGrid, analyzeImage, generateMaster } from './services/geminiService';
import { analyzeImageWithVision, analyzeImageBase64WithVision, compilePrompt, generateEnhancedImage, generateImageWithSliders } from './services/edgeFunctionsService';
import { getCurrentUserProfile, signOutUser } from './services/authService';
import { spendLumens, getBalance } from './services/paymentService';
import { getDisplayUrl, getMasterUrl, getThumbnailUrl } from './utils/imageUtils';
import { Upload, ArrowLeft, Terminal, Check, SlidersHorizontal, BrainCircuit, Contrast, Hexagon, ScanFace, Crown, ExternalLink, Zap, Settings2, Sparkles, Lock, ArrowRight, Wallet, Download, Camera, Image as ImageIcon, Loader2, Hourglass, AlertTriangle, Search, X, ZoomIn, ZoomOut, Activity, Wifi, WifiOff, RefreshCw, Grid, FileText, ScanLine, Palette, Sun, Maximize, Smartphone, Bookmark, Save, Sliders } from 'lucide-react';
import { saveUserPreset } from './services/presetService';

import { ProcessingOverlay } from './components/mobile/ProcessingOverlay';

// Helper Icon
import { RotateCcw as RotateIcon } from 'lucide-react';
const RotateCcw = RotateIcon;

// ViewState removed in favor of Routes

// --- SYSTEM MESSAGES ---
const LOADING_PHRASES = [
    "PhotoScaler™: Calibrando Lente 85mm...",
    "Corrigiendo Distorsión Geométrica...",
    "StyleScaler™: Revelando RAW Digital...",
    "Aplicando Etalonaje de Cine...",
    "LightScaler™: Posicionando Luz Principal...",
    "Ajustando Reflectores de Relleno...",
    "UpScaler™: Renderizando Textura 4K...",
    "Finalizando Simulación Óptica..."
];

const IMMINENT_PHRASES = [
    "Revelando...",
    "Montando Luces...",
    "Enfocando...",
    "Casi listo..."
];

type GridItem = ArchivedVariation | { id: string; error: boolean; style_id: string; errorMessage?: string };

// ========================
// 🛡️ PROTECTED ADMIN ROUTE
// ========================
interface ProtectedAdminRouteProps {
    userProfile: UserProfile | null;
    isLoading: boolean;
    children: React.ReactNode;
    onOpenAuth: () => void;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ userProfile, isLoading, children, onOpenAuth }) => {
    // 0. Si está cargando, mostrar nada o un spinner (bloquear redirección)
    if (isLoading) {
        return <div className="h-screen w-full flex items-center justify-center bg-void-black text-lumen-gold font-mono text-xs">VERIFICANDO CREDENCIALES NIVEL 5...</div>;
    }

    // 1. Si no hay usuario logueado, redirigir a home y mostrar modal de auth
    if (!userProfile) {
        console.warn('[Security] Acceso denegado a /admin: No hay sesión activa');
        return <Navigate to="/" replace />;
    }

    // 2. Si el usuario no es admin, redirigir a home
    if (!userProfile.is_admin) {
        console.warn('[Security] Acceso denegado a /admin: Usuario no es administrador');
        return <Navigate to="/" replace />;
    }

    // 3. Usuario es admin, renderizar el contenido
    return <>{children}</>;
};

const App: React.FC = () => {
    // --- NATIVE PLATFORM DETECTION ---
    const { isNative } = usePlatform();
    const navigate = useNavigate();
    const location = useLocation();

    // Auth & Access State
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true); // 🔄 NEW: Loading state
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

    // Browser notifications
    const requestNotifications = async () => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            try { await Notification.requestPermission(); } catch { /* ignore */ }
        }
    };

    const notify = (title: string, body: string) => {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;
        try { new Notification(title, { body }); } catch { /* ignore */ }
    };

    const [accessGranted, setAccessGranted] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModal] = useState(false);
    const [authMessage, setAuthMessage] = useState<string | null>(null);

    // Config Wizard State
    // Legacy wizard is disabled for v28 (single new flow)
    const [showConfigWizard, setShowConfigWizard] = useState(false);
    const [showProfileSelector, setShowProfileSelector] = useState(false); // NEW: Profile selector
    const [showVisionConfirm, setShowVisionConfirm] = useState(false); // NEW: Vision confirm modal
    const [analysisResult, setAnalysisResult] = useState<SemanticAnalysis | null>(null);
    const [visionAnalysis, setVisionAnalysis] = useState<any>(null); // NEW: Edge function vision result
    const [userTokenBalance, setUserTokenBalance] = useState(0); // NEW: Current token balance

    // PWA State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);

    // Core State
    const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
    const [agentMsg, setAgentMsg] = useState<AgentMessage>({ text: "", type: 'info' });
    const [queuePosition, setQueuePosition] = useState<number | null>(null);
    const [systemLogs, setSystemLogs] = useState<string[]>([]);
    const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
    const [isSculpting, setIsSculpting] = useState(false);

    // Data State
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // v28 flow staging (avoid showing legacy workspace before vision confirmation)
    const [stagedImageUrl, setStagedImageUrl] = useState<string | null>(null);
    const [stagedMasterImageUrl, setStagedMasterImageUrl] = useState<string | null>(null);

    const [inputImageUrl, setInputImageUrl] = useState<string | null>(null);
    const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

    // UX overlay (upload/generate progress)
    const [showProcessingOverlay, setShowProcessingOverlay] = useState(false);

    // small informational toast (on every user action)
    const [toastState, setToastState] = useState<ToastState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });
    const [processingPhase, setProcessingPhase] = useState<'upload' | 'vision' | 'compile' | 'generate' | null>(null);
    const [phaseStartedAt, setPhaseStartedAt] = useState<number | null>(null);
    const [phaseEtaSeconds, setPhaseEtaSeconds] = useState<number | null>(null);
    const [phaseProgress, setPhaseProgress] = useState<number>(0);
    const [phaseLabel, setPhaseLabel] = useState<string>('');
    const [gridZoom, setGridZoom] = useState(3); // 2 to 6 columns
    const [showBeforeAfter, setShowBeforeAfter] = useState(false); // Toggle for B/A
    const [aspectRatio, setAspectRatio] = useState<number>(3 / 4);

    // Inspection State
    const [isMicroscopeOpen, setIsMicroscopeOpen] = useState(false);
    const [showTelemetry, setShowTelemetry] = useState(false);

    // Output Selector State
    const [showOutputSelector, setShowOutputSelector] = useState(false);

    // Pending Actions
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    // Variations from Server
    const [previews, setPreviews] = useState<GridItem[]>([]);

    // NEW: Generation Timer
    const [elapsedTime, setElapsedTime] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const generatedObjectUrlsRef = useRef<string[]>([]);
    const masterUploadPromiseRef = useRef<Promise<string> | null>(null);

    // Update elapsed display while overlay visible
    useEffect(() => {
        if (!showProcessingOverlay || !phaseStartedAt) return;
        const t = setInterval(() => setElapsedTime(prev => prev + 0.1), 100);
        return () => clearInterval(t);
    }, [showProcessingOverlay, phaseStartedAt]);

    // --- EFFECTS ---

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (status === AgentStatus.GENERATING_PREVIEWS && previews.length < 6) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 0.1);
            }, 100);
        } else if (status === AgentStatus.IDLE && !showProcessingOverlay) {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [status, previews.length, showProcessingOverlay]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const profile = await getCurrentUserProfile();
                setUserProfile(profile);
                if (profile) setAccessGranted(true);
            } catch (e) {
                console.error("Auth check failed:", e);
            } finally {
                setIsAuthLoading(false); // ✅ Auth check done
            }
        };
        checkAuth();

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        });

        // Footer navigation handler
        const handleFooterNav = (e: Event) => {
            const customEvent = e as CustomEvent;
            const target = customEvent.detail as string;
            if (target) {
                // Map legacy ViewState to Routes
                switch (target) {
                    case 'HOME': navigate('/'); break;
                    case 'ARCHIVES': navigate('/archives'); break;
                    case 'ADMIN': navigate('/admin'); break;
                    case 'PRICING': navigate('/pricing'); break;
                    case 'TUTORIAL': navigate('/tutorial'); break;
                    // Info Pages
                    case 'TERMS': navigate('/terms'); break;
                    case 'PRIVACY': navigate('/privacy'); break;
                    case 'COOKIES': navigate('/cookies'); break;
                    case 'LEGAL_NOTICE': navigate('/legal'); break;
                    case 'API_DOCS': navigate('/api-docs'); break;
                    case 'CONTACT': navigate('/contact'); break;
                    case 'FAQ': navigate('/faq'); break;
                    default: navigate('/');
                }
            }
        };
        window.addEventListener('lux-navigate', handleFooterNav);

        return () => {
            window.removeEventListener('lux-navigate', handleFooterNav);
        };
    }, []);

    useEffect(() => {
        let interval: any;
        if (status === AgentStatus.GENERATING_PREVIEWS) {
            interval = setInterval(() => {
                setLoadingPhraseIndex(prev => (prev + 1) % LOADING_PHRASES.length);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [status]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [location.pathname]);

    // --- HANDLERS ---

    const addSystemLog = (msg: string) => {
        setSystemLogs(prev => [msg, ...prev].slice(0, 4));
    };

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstallBtn(false);
        }
        setDeferredPrompt(null);
    };

    const handleAuthSuccess = async () => {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
        setAccessGranted(true);
        if (pendingFile) {
            processFileForAnalysis(pendingFile);
        }
    };

    const handleAccessCodeSuccess = () => {
        setAccessGranted(true);
        setIsAccessModalOpen(false);
        // Small delay to ensure modal is closed before file dialog
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 500);
    };

    const handleSignOut = async () => {
        await signOutUser();
        setUserProfile(null);
        setAccessGranted(false);
        navigate('/');
        resetFlow();
    };

    const navigateToHome = () => {
        navigate('/');
    };

    const handleUnlockMaster = async () => {
        if (!userProfile) {
            alert("Acceso Restringido: Debe iniciar sesión para generar Masters 4K.");
            return;
        }

        setShowOutputSelector(true);
    };

    const handleOutputConfirm = async (resolution: string, format: string, refinePrompt?: string) => {
        setShowOutputSelector(false);
        const COST = resolution === '8K' ? 100 : (resolution === '4K' ? 50 : 25);

        // Confirmation before spending? 
        // The OutputSelector has "PROCESAR MASTER" button which implies consent.
        // We'll trust the button click.

        try {
            const success = await spendLumens(COST, `Master Print ${resolution}`);
            if (success) {
                setAgentMsg({ text: `Iniciando Master ${resolution} (${format})...`, type: 'success' });
                setIsSculpting(true);

                const currentVar = previews.find(p => 'image_path' in p && p.image_path === processedImageUrl) as ArchivedVariation;

                if (!currentVar) throw new Error("No hay variación seleccionada");

                const masterVar = await generateMaster(currentVar.id, { resolution, format }, refinePrompt);

                setProcessedImageUrl(masterVar.image_path);
                setPreviews(prev => prev.map(p => p.id === currentVar.id ? masterVar : p));
                setAgentMsg({ text: `Master ${resolution} Renderizado.`, type: 'success' });
            } else {
                setIsPurchaseModal(true);
            }
        } catch (e: any) {
            alert("Error: " + e.message);
            setAgentMsg({ text: "Fallo en Generación Master.", type: 'error' });
        } finally {
            setIsSculpting(false);
        }
    };

    const handleForceDownload = async (url: string | null) => {
        if (!url) return;
        try {
            setAgentMsg({ text: "Descargando Original 4K...", type: 'info' });
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `LUXIFIER_MASTER_${Date.now()}.webp`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            setAgentMsg({ text: "Descarga Completa.", type: 'success' });
        } catch (e) {
            console.error("Download failed:", e);
            window.open(url, '_blank');
        }
    };

    const handleStartClick = () => {
        // Permitir: usuario registrado O admin O tiene código de acceso
        if (userProfile || accessGranted) {
            fileInputRef.current?.click();
        } else {
            setIsAccessModalOpen(true);
        }
    };

    const handleGuestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPendingFile(file);
            processFileForAnalysis(file);
        }
    };

    const processFileForAnalysis = async (file: File) => {
        // ============================================================
        // PASO 0: FEEDBACK INMEDIATO (ANTES de cualquier operación)
        // ============================================================
        // Esto se ejecuta SINCRÓNICAMENTE - el usuario ve el overlay al instante
        setShowProcessingOverlay(true);
        setProcessingPhase('upload');
        setPhaseStartedAt(Date.now());
        setPhaseEtaSeconds(2);
        setPhaseProgress(5);
        setPhaseLabel('Preparando tu imagen...');
        setElapsedTime(0);
        setStatus(AgentStatus.ANALYZING);

        // Local preview instantáneo (sin await)
        const localUrl = URL.createObjectURL(file);
        generatedObjectUrlsRef.current.push(localUrl);
        setStagedImageUrl(localUrl);

        // Calcular aspect ratio del archivo original
        const img = new Image();
        img.src = localUrl;
        img.onload = () => setAspectRatio(img.width / img.height);

        // ============================================================
        // PASO 1: ANÁLISIS DE VISIÓN (imagen pequeña = RÁPIDO)
        // ============================================================
        try {
            // Cambiar a fase de visión
            setProcessingPhase('vision');
            setPhaseProgress(15);
            setPhaseLabel('Analizando tu foto con Gemini 2.5 Flash...');
            setAgentMsg({ text: "🔍 Analizando imagen...", type: 'info' });

            // OPTIMIZACIÓN: Usar imagen PEQUEÑA para análisis (1280px es suficiente para Gemini)
            // Esto reduce el tiempo de compresión de ~5-10s a <1s
            const { blob: visionBlob, aspectRatio: ratio } = await compressAndResizeImage(file, { 
                maxDimension: 1280,  // Mucho más pequeño = mucho más rápido
                quality: 0.75 
            });
            setAspectRatio(ratio);
            setPhaseProgress(30);

            // Convertir a base64
            const visionBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
                reader.readAsDataURL(visionBlob);
            });
            setPhaseProgress(40);
            setPhaseLabel('Enviando a Gemini 2.5 Flash...');

            // Llamar al backend
            const visionResult = await analyzeImageBase64WithVision(visionBase64, userProfile?.id);
            setPhaseProgress(90);

            if (!visionResult.success) {
                throw new Error(visionResult.error || "Análisis de visión falló");
            }

            setVisionAnalysis(visionResult.analysis);
            setPhaseProgress(100);

            // Calcular valores por defecto para sliders
            const ss = visionResult.analysis?.suggested_settings || {};
            const defaultMixer = {
                stylism: ss.estilo_autor ?? 5,
                atrezzo: 5,
                skin_bio: ss.styling_piel ?? 5,
                lighting: ss.contraste ?? 5,
                restoration: ss.limpieza_artefactos ?? 5,
                upScaler: 1
            };
            setVisionAnalysis((prev: any) => ({ ...prev, _defaultMixer: defaultMixer }));

            // ============================================================
            // PASO 2: SUBIR IMÁGENES EN SEGUNDO PLANO (no bloquea UI)
            // ============================================================
            const userId = userProfile ? userProfile.id : 'guest_analysis';
            
            // Iniciar subidas en background (no esperamos)
            (async () => {
                try {
                    // Thumbnail para preview
                    const { blob: thumbBlob } = await compressAndResizeImage(file, { maxDimension: 2048, quality: 0.78 });
                    const publicThumb = await uploadImageToStorage(thumbBlob, userId);
                    setStagedImageUrl(publicThumb);
                } catch (e) {
                    console.warn('Thumb upload failed:', e);
                }
            })();

            // Master para generación (en paralelo)
            masterUploadPromiseRef.current = (async () => {
                const { blob: masterBlob } = await compressAndResizeImage(file, { maxDimension: 5400, quality: 0.85 });
                const masterUrl = await uploadImageToStorage(masterBlob, userId);
                setStagedMasterImageUrl(masterUrl);
                return masterUrl;
            })();

            // Obtener balance (en paralelo, no bloquea)
            getBalance().then(balance => setUserTokenBalance(balance)).catch(() => {});

            // Solicitar permisos de notificación (no bloquea)
            requestNotifications().catch(() => {});

            // ============================================================
            // PASO 3: MOSTRAR MODAL DE CONFIRMACIÓN
            // ============================================================
            setShowProcessingOverlay(false);
            setShowVisionConfirm(true);
            setStatus(AgentStatus.CONFIGURING);

        } catch (visionError: any) {
            console.error("Vision Analysis Error:", visionError);
            setShowProcessingOverlay(false);
            setAgentMsg({ text: `Error: ${visionError.message}`, type: 'error' });
            resetFlow();
        }
    };

    // Legacy wizard handlers (disabled)
    const handleConfigConfirm = async (_config: LuxConfig) => {
        setShowConfigWizard(false);
    };

    const handleWizardConfirm = async (_config: LuxConfig) => {
        setShowConfigWizard(false);
    };

    // NEW: Handler for Profile Config Modal (v28)
    const handleProfileConfigConfirm = async (config: LuxConfig) => {
        setShowProfileSelector(false);
        let finalInputUrl = stagedMasterImageUrl || stagedImageUrl || inputImageUrl;
        if (!finalInputUrl && masterUploadPromiseRef.current) {
            setShowProcessingOverlay(true);
            setProcessingPhase('upload');
            setPhaseStartedAt(Date.now());
            setPhaseEtaSeconds(10);
            setPhaseProgress(10);
            setPhaseLabel('Subiendo original para generar...');
            try { finalInputUrl = await masterUploadPromiseRef.current; } catch { /* ignore */ }
        }

        if (finalInputUrl) {
            setInputImageUrl(finalInputUrl);
            // IMPORTANT: Use the v28 Brain pipeline (Edge Functions w/ fallback)
            setShowProcessingOverlay(true);
            setProcessingPhase('compile');
            setPhaseStartedAt(Date.now());
            setPhaseEtaSeconds(2);
            setPhaseProgress(5);
            setPhaseLabel('Compilando prompt (Brain) — ~1–2s');
            setElapsedTime(0);

            await processWithEdgeFunctions(finalInputUrl, config);
        }
    };

    const handleProfileConfigCancel = () => {
        setShowProfileSelector(false);
        resetFlow();
    };

    // NEW: Unified handler for the combined modal
    const handleUnifiedConfirm = async (confirmConfig: { mode: string; settings: any; preset?: string }) => {
        setShowVisionConfirm(false);
        setShowProfileSelector(false);
        
        // Settings already come in correct format from UnifiedConfigModal
        const sliderConfig = confirmConfig.settings;
        
        console.log('[LuxScaler] Mode:', confirmConfig.mode);
        console.log('[LuxScaler] Preset:', confirmConfig.preset || 'none');
        console.log('[LuxScaler] Settings:', JSON.stringify(sliderConfig).slice(0, 500));
        
        const config: LuxConfig = {
            userPrompt: '',
            mode: confirmConfig.mode as any,
            selectedPresetId: JSON.stringify(sliderConfig),
            mixer: {
                stylism: 5, atrezzo: 5, skin_bio: 5,
                lighting: 5, restoration: 5, upScaler: 1
            }
        };
        
        // UX overlay for generation
        setToastState({
            isOpen: true,
            title: 'Procesando',
            message: 'Puedes cerrar esta ventana. Te avisaremos cuando termine.'
        });
        setShowProcessingOverlay(true);
        setProcessingPhase('compile');
        setPhaseStartedAt(Date.now());
        setPhaseEtaSeconds(2);
        setPhaseProgress(5);
        setPhaseLabel('Compilando instrucciones...');
        setElapsedTime(0);

        // Ensure we have a public URL for generation
        let finalInputUrl = stagedMasterImageUrl || stagedImageUrl || inputImageUrl;
        if (!finalInputUrl && masterUploadPromiseRef.current) {
            setProcessingPhase('upload');
            setPhaseLabel('Subiendo original...');
            try { finalInputUrl = await masterUploadPromiseRef.current; } catch { /* ignore */ }
        }
        if (!finalInputUrl) {
            setShowProcessingOverlay(false);
            setAgentMsg({ text: 'Error: No hay imagen disponible', type: 'error' });
            return;
        }
        setInputImageUrl(finalInputUrl);

        await processWithEdgeFunctions(finalInputUrl, config);
    };

    const handleUnifiedCancel = () => {
        setShowVisionConfirm(false);
        setShowProfileSelector(false);
        setVisionAnalysis(null);
        resetFlow();
    };

    // LEGACY: Handlers for Vision Confirm Modal (kept for compatibility)
    const handleVisionConfirm = async (confirmConfig: { mode: 'auto' | 'intent' | 'custom'; intentIndex?: number; customIntent?: string; settings?: any }) => {
        setShowVisionConfirm(false);
        
        // Build config based on mode
        let config: LuxConfig;
        
        // PRIORITY: Use settings from confirmConfig (already has intensity/preset applied)
        // Fallback: use auto_settings from vision analysis
        const sliderSource = confirmConfig.settings || visionAnalysis?.auto_settings;
        
        if (confirmConfig.mode === 'auto' || confirmConfig.mode === 'intent') {
            // Check if sliderSource has the correct format (with .sliders array)
            let sliderConfig: any;
            
            if (sliderSource?.photoscaler?.sliders) {
                // Already in correct format from VisionConfirmModal
                sliderConfig = sliderSource;
                console.log('[LuxScaler] Using slider config from modal (with intensity/preset applied)');
            } else {
                // Convert from {slider_name: value} format to {sliders: [{name, value}]} format
                sliderConfig = {
                    photoscaler: { sliders: Object.entries(sliderSource?.photoscaler || {}).map(([name, value]) => ({ name, value })) },
                    stylescaler: { sliders: Object.entries(sliderSource?.stylescaler || {}).map(([name, value]) => ({ name, value })) },
                    lightscaler: { sliders: Object.entries(sliderSource?.lightscaler || {}).map(([name, value]) => ({ name, value })) }
                };
                console.log('[LuxScaler] Converted auto_settings to slider format');
            }
            
            // Log actual values being sent
            console.log('[LuxScaler] Final slider config:', JSON.stringify(sliderConfig).slice(0, 300) + '...');
            
            config = {
                userPrompt: confirmConfig.customIntent || '',
                mode: 'AUTO',
                selectedPresetId: JSON.stringify(sliderConfig),
                mixer: {
                    stylism: autoSettings?.stylescaler?.look_cine ?? 5,
                    atrezzo: autoSettings?.stylescaler?.limpieza_entorno ?? 5,
                    skin_bio: autoSettings?.stylescaler?.styling_piel ?? 5,
                    lighting: autoSettings?.lightscaler?.key_light ?? 5,
                    restoration: autoSettings?.photoscaler?.limpieza_artefactos ?? 5,
                    upScaler: 1
                }
            };
        } else {
            // Custom intent - use defaults with custom prompt
            config = {
                userPrompt: confirmConfig.customIntent || '',
                mode: 'AUTO',
                mixer: {
                    stylism: 5, atrezzo: 5, skin_bio: 5,
                    lighting: 5, restoration: 5, upScaler: 1
                }
            };
        }
        
        // UX overlay for generation
        setToastState({
            isOpen: true,
            title: 'Procesando',
            message: 'Puedes cerrar esta ventana. Te avisaremos cuando termine.'
        });
        setShowProcessingOverlay(true);
        setProcessingPhase('compile');
        setPhaseStartedAt(Date.now());
        setPhaseEtaSeconds(2);
        setPhaseProgress(5);
        setPhaseLabel('Compilando instrucciones...');
        setElapsedTime(0);

        // Ensure we have a public URL for generation
        let finalInputUrl = stagedMasterImageUrl || stagedImageUrl || inputImageUrl;
        if (!finalInputUrl && masterUploadPromiseRef.current) {
            setProcessingPhase('upload');
            setPhaseLabel('Subiendo original...');
            try { finalInputUrl = await masterUploadPromiseRef.current; } catch { /* ignore */ }
        }
        if (!finalInputUrl) {
            setShowProcessingOverlay(false);
            setAgentMsg({ text: 'Error: No hay imagen disponible', type: 'error' });
            return;
        }
        setInputImageUrl(finalInputUrl);

        await processWithEdgeFunctions(finalInputUrl, config);
    };

    const handleVisionCustomize = () => {
        setShowVisionConfirm(false);
        // Show profile selector for customization
        setShowProfileSelector(true);
    };

    const handleVisionCancel = () => {
        setShowVisionConfirm(false);
        setVisionAnalysis(null);
        resetFlow();
    };

    // NEW: Process using Edge Functions

    const persistToArchive = async (originalUrl: string, vision: any, variationImageUrl: string, promptPayload: any) => {
        try {
            const { getSupabaseClient } = await import('./services/authService');
            const supabase = getSupabaseClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: gen, error: genErr } = await supabase
                .from('generations')
                .insert({
                    user_id: user.id,
                    status: 'completed',
                    original_image_path: originalUrl,
                    original_image_thumbnail: stagedImageUrl || originalUrl,
                    semantic_analysis: vision,
                })
                .select('id')
                .single();

            if (genErr || !gen) {
                console.warn('Archive: could not create generation', genErr);
                return;
            }

            const { error: varErr } = await supabase
                .from('variations')
                .insert({
                    generation_id: gen.id,
                    type: 'preview_watermark',
                    style_id: 'edge_generated',
                    image_path: variationImageUrl,
                    prompt_payload: promptPayload,
                    is_selected: true,
                    rating: 0,
                });

            if (varErr) {
                console.warn('Archive: could not create variation', varErr);
            }
        } catch (e) {
            console.warn('Archive persist failed:', e);
        }
    };

    const processWithEdgeFunctions = async (imageUrl: string, config: LuxConfig) => {
        try {
            setAgentMsg({ text: "Compilando prompt con IA...", type: 'info' });
            // NO navegamos a /result hasta tener una imagen generada

            // Step 1: Build slider config from any mode
            let sliderConfig: any = null;
            
            // Try to get explicit slider config from selectedPresetId (PRO/PROLUX/USER)
            if (config?.selectedPresetId) {
                try {
                    const parsed = JSON.parse(config.selectedPresetId);
                    if (parsed?.photoscaler && parsed?.stylescaler && parsed?.lightscaler) {
                        sliderConfig = parsed;
                        console.log('[LuxScaler] Using slider config from selectedPresetId. Mode:', config.mode);
                    }
                } catch {
                    // ignore parse error
                }
            }

            // If no sliderConfig yet, build from mixer or use auto_settings from vision
            if (!sliderConfig) {
                // Check if we have auto_settings from vision analysis
                if (visionAnalysis?.auto_settings) {
                    console.log('[LuxScaler] Using auto_settings from vision analysis');
                    sliderConfig = {
                        photoscaler: { sliders: Object.entries(visionAnalysis.auto_settings.photoscaler || {}).map(([name, value]) => ({ name, value })) },
                        stylescaler: { sliders: Object.entries(visionAnalysis.auto_settings.stylescaler || {}).map(([name, value]) => ({ name, value })) },
                        lightscaler: { sliders: Object.entries(visionAnalysis.auto_settings.lightscaler || {}).map(([name, value]) => ({ name, value })) },
                    };
                } else if (config.mixer) {
                    // Fallback: map mixer values to all sliders in each pillar
                    const photoVal = config.mixer.restoration || 5;
                    const styleVal = config.mixer.stylism || 5;
                    const lightVal = config.mixer.lighting || 5;
                    
                    console.log('[LuxScaler] Building from mixer:', { photoVal, styleVal, lightVal });
                    
                    sliderConfig = {
                        photoscaler: { sliders: [
                            { name: 'limpieza_artefactos', value: photoVal },
                            { name: 'geometria', value: photoVal },
                            { name: 'optica', value: photoVal },
                            { name: 'chronos', value: photoVal },
                            { name: 'senal_raw', value: photoVal },
                            { name: 'sintesis_adn', value: photoVal },
                            { name: 'grano_filmico', value: Math.min(photoVal, 5) },
                            { name: 'enfoque', value: photoVal },
                            { name: 'resolucion', value: photoVal },
                        ]},
                        stylescaler: { sliders: [
                            { name: 'styling_piel', value: config.mixer.skin_bio || styleVal },
                            { name: 'styling_pelo', value: styleVal },
                            { name: 'styling_ropa', value: styleVal },
                            { name: 'maquillaje', value: Math.min(styleVal, 5) },
                            { name: 'limpieza_entorno', value: config.mixer.atrezzo || styleVal },
                            { name: 'reencuadre_ia', value: 1 },
                            { name: 'atmosfera', value: styleVal },
                            { name: 'look_cine', value: styleVal },
                            { name: 'materiales_pbr', value: styleVal },
                        ]},
                        lightscaler: { sliders: [
                            { name: 'key_light', value: lightVal },
                            { name: 'fill_light', value: lightVal },
                            { name: 'rim_light', value: Math.min(lightVal, 6) },
                            { name: 'volumetria', value: lightVal },
                            { name: 'temperatura', value: 5 },
                            { name: 'contraste', value: lightVal },
                            { name: 'sombras', value: Math.min(lightVal, 6) },
                            { name: 'estilo_autor', value: styleVal },
                            { name: 'reflejos', value: Math.min(lightVal, 6) },
                        ]},
                    };
                } else {
                    // Ultimate fallback: all 5s
                    console.log('[LuxScaler] Using default values (all 5)');
                    sliderConfig = {
                        photoscaler: { sliders: [{ name: 'limpieza_artefactos', value: 5 }, { name: 'enfoque', value: 5 }] },
                        stylescaler: { sliders: [{ name: 'estilo_autor', value: 5 }] },
                        lightscaler: { sliders: [{ name: 'contraste', value: 5 }] },
                    };
                }
            }

            console.log('[LuxScaler] Final sliderConfig:', JSON.stringify(sliderConfig).slice(0, 200));

            // v37.0: Use Universal Prompt Assembler directly with slider values
            // The backend will assemble the prompt using slider_definitions_v29.json
            setProcessingPhase('generate');
            setPhaseStartedAt(Date.now());
            setPhaseEtaSeconds(45);
            setPhaseProgress(15);
            setPhaseLabel('Generando imagen — puedes cerrar esta ventana');

            setAgentMsg({ text: "Ensamblando prompt v37.0 y generando imagen...", type: 'info' });
            addSystemLog(`Enviando ${Object.values(sliderConfig).reduce((acc, p) => acc + (p?.sliders?.length || 0), 0)} sliders al Universal Prompt Assembler v37.0`);

            // Generate directly with sliders (uses Universal Prompt Assembler v37.0)
            const generateResult = await generateImageWithSliders(
                imageUrl,
                sliderConfig,
                {
                    userMode: userProfile?.profile_type || 'auto',
                    userId: userProfile?.id,
                    includeDebug: true, // Get debug info for Archives
                }
            );
            setPhaseProgress(100);

            if (!generateResult.success) {
                throw new Error(generateResult.error || "Error generando imagen");
            }
            
            // Extract debug info from response
            const promptDebugInfo = generateResult.debug?.slider_debug || {};
            addSystemLog(`Prompt v37.0 generado con ${Object.keys(promptDebugInfo.levels_used || {}).length} slots`);

            // Normalize response into our ArchivedVariation shape
            const outputImage = generateResult.output?.image;
            if (outputImage) {
                // If backend returns base64 (common), make it a data URL
                let normalizedImage = outputImage.startsWith('data:image')
                    ? outputImage
                    : outputImage.length > 500
                        ? `data:image/png;base64,${outputImage}`
                        : outputImage;

                // If it's a data URI, convert to object URL to reduce huge-string UI freezes
                // and upload to Storage for ARCHIVE persistence.
                let archiveImageUrl = normalizedImage;
                if (normalizedImage.startsWith('data:image')) {
                    try {
                        const blob = await (await fetch(normalizedImage)).blob();
                        const objUrl = URL.createObjectURL(blob);
                        generatedObjectUrlsRef.current.push(objUrl);
                        normalizedImage = objUrl;

                        // Persistable URL (Supabase Storage)
                        const uploaderId = userProfile?.id || 'user';
                        try {
                            archiveImageUrl = await uploadImageToStorage(blob, `${uploaderId}/variations`);
                        } catch (e) {
                            console.warn('Archive image upload failed:', e);
                            archiveImageUrl = normalizedImage;
                        }
                    } catch (e) {
                        console.warn('Could not convert data URI to blob URL:', e);
                    }
                }

                const nowIso = new Date().toISOString();
                const id = `edge-${Date.now()}`;
                
                // Guardar el prompt COMPLETO y toda la info de debug
                const promptPayload = { 
                    prompt: generateResult.output?.text || '', 
                    compiledPrompt: promptResult.prompt,
                    mode: config.mode || 'AUTO',
                    selectedPresetId: JSON.stringify(sliderConfig), // Guardar los 27 sliders exactos
                    mixer: config.mixer,
                    // Guardar metadata del compilador
                    metadata: promptResult.metadata,
                    // Guardar info de debug (vetos, sanitization, etc.)
                    debugInfo: promptResult.debug_info,
                    // Tokens estimados
                    tokensEstimate: promptResult.tokens_estimate,
                    // DNA Anchor info
                    dnaAnchor: promptResult.dna_anchor,
                };

                setPreviews([{
                    id,
                    generation_id: id,
                    type: 'preview_watermark',
                    style_id: 'edge_generated',
                    image_path: normalizedImage,
                    prompt_payload: promptPayload,
                    seed: 0,
                    rating: 0,
                    is_selected: true,
                    created_at: nowIso,
                }]);
                setProcessedImageUrl(normalizedImage);

                // Persist to ARCHIVE (Supabase DB + Storage URLs)
                await persistToArchive(imageUrl, visionAnalysis, archiveImageUrl, promptPayload);
                
                // AHORA navegamos a /result porque ya tenemos imagen
                navigate('/result');
            }

            setShowProcessingOverlay(false);
            setIsMicroscopeOpen(false); // Ensure inspector is closed
            
            // Notificación del navegador
            notify('LuxScaler ✨', '¡Tu imagen está lista! Haz clic para verla.');
            
            // Toast informativo en la app
            setToastState({
                isOpen: true,
                title: '¡Generación completada!',
                message: 'Tu imagen ha sido procesada exitosamente.',
                type: 'success'
            });
            
            setStatus(AgentStatus.COMPLETED);
            setAgentMsg({ text: "¡Procesamiento completado!", type: 'success' });
            addSystemLog(`Tokens utilizados: ${generateResult.metadata?.tokens_charged ?? 0}`);

        } catch (error: any) {
            console.error("Brain pipeline processing error:", error);
            setShowProcessingOverlay(false);
            setAgentMsg({ text: `Error: ${error.message}`, type: 'error' });
            setStatus(AgentStatus.ERROR);
        }
    };

    const processFileGeneration = async (url: string, config: LuxConfig, analysis: SemanticAnalysis | null) => {
        try {
            setStatus(AgentStatus.ANALYZING);
            setAgentMsg({ text: "Montando Estudio Virtual...", type: 'info' });
            setPreviews([]);
            setQueuePosition(null);
            setSystemLogs([]);

            navigate('/result');
            setStatus(AgentStatus.GENERATING_PREVIEWS);
            setAgentMsg({ text: "Estudio Activo.", type: 'info' });
            addSystemLog("Handshake Seguro Establecido.");

            await generatePreviewGrid(url, config, analysis, (event) => {
                if (event.type === 'queue') {
                    setQueuePosition(event.position);
                    setAgentMsg({ text: `Posición ${event.position} en cola global...`, type: 'info' });
                }
                else if (event.type === 'info') {
                    addSystemLog(event.message);
                }
                else if (event.type === 'session_start') {
                    setQueuePosition(null);
                    setCurrentSessionId(event.data.generationId);
                    addSystemLog("Sesión Bloqueada. Motores Corriendo.");
                }
                else if (event.type === 'variation') {
                    setQueuePosition(null);
                    const newVariation = event.data;
                    const styleName = newVariation.styleName || newVariation.style_id.replace('uni_', '').replace('_', ' ');
                    addSystemLog(`Procesado: ${styleName}`);

                    setPreviews(prev => {
                        if (prev.find(p => p.id === newVariation.id)) return prev;
                        const newList = [...prev, newVariation];
                        if (newList.length === 1 && 'image_path' in newVariation) {
                            setProcessedImageUrl(newVariation.image_path);
                        }
                        return newList;
                    });
                }
                else if (event.type === 'variation_error') {
                    console.warn(`Variation failed: ${event.id}`, event.error);
                    addSystemLog(`❌ Var ${event.id.substring(0, 4)}: ${event.error || 'Unknown error'}`);
                    setPreviews(prev => [
                        ...prev,
                        { id: event.id, error: true, style_id: 'FAILED', errorMessage: event.error }
                    ]);
                }
                else if (event.type === 'error') {
                    throw new Error(event.message || "Error de Stream");
                }
                else if (event.type === 'done') {
                    setStatus(AgentStatus.COMPLETED);
                    setPendingFile(null);
                    addSystemLog("Pipeline Finalizado. Listo para Revisión.");
                }
            });

        } catch (error: any) {
            console.error("Process failed:", error);
            if (previews.length > 0) {
                setStatus(AgentStatus.COMPLETED);
                return;
            }
            setStatus(AgentStatus.ERROR);
            setQueuePosition(null);
            setAgentMsg({ text: `Sistema Detenido: ${error.message}`, type: 'error' });
        } finally {
            setStatus(prev => {
                if (prev === AgentStatus.GENERATING_PREVIEWS && previews.length > 0) {
                    setPendingFile(null);
                    return AgentStatus.COMPLETED;
                }
                return prev;
            });
        }
    };

    const resetFlow = () => {
        setStagedImageUrl(null);
        setStagedMasterImageUrl(null);
        masterUploadPromiseRef.current = null;
        setInputImageUrl(null);
        setProcessedImageUrl(null);
        setShowConfigWizard(false);
        setPreviews([]);
        setStatus(AgentStatus.IDLE);
        setAgentMsg({ text: "", type: 'info' });
        setShowConfigWizard(false);
        setPendingFile(null);
        setQueuePosition(null);
        setAnalysisResult(null);
        setSystemLogs([]);
        setIsSculpting(false);
        setShowTelemetry(false);
        setIsMicroscopeOpen(false); // Reset inspector modal

        // Overlay reset
        setShowProcessingOverlay(false);
        setProcessingPhase(null);
        setPhaseStartedAt(null);
        setPhaseEtaSeconds(null);
        setPhaseProgress(0);
        setPhaseLabel('');

        // Modal resets (avoid cross-flow UI mixing)
        setShowVisionConfirm(false);
        setShowProfileSelector(false);
        setVisionAnalysis(null);

        // Revoke any created blob URLs
        generatedObjectUrlsRef.current.forEach((u) => {
            try { URL.revokeObjectURL(u); } catch { }
        });
        generatedObjectUrlsRef.current = [];

        if (fileInputRef.current) fileInputRef.current.value = '';
        navigate('/');
    };

    // --- DERIVED STATE ---
    const progressPercent = Math.min(100, ((previews.length) / 6) * 100);
    const isGenerating = status === AgentStatus.GENERATING_PREVIEWS;
    const currentVar = previews.find(p => 'image_path' in p && p.image_path === processedImageUrl) as ArchivedVariation | undefined;
    const isCurrentMaster = currentVar && (currentVar.type.includes('master') || currentVar.type.includes('upscale'));

    // Calculate active view for Navigation highlighting
    const activeView = React.useMemo(() => {
        if (location.pathname === '/archives') return 'ARCHIVES';
        if (location.pathname === '/admin') return 'ADMIN';
        if (location.pathname === '/pricing') return 'PRICING';
        if (location.pathname === '/forensic') return 'ENGINE_1';
        if (location.pathname === '/art') return 'ENGINE_2';
        if (location.pathname === '/studio-light') return 'ENGINE_3';
        if (location.pathname === '/upscale') return 'ENGINE_4';
        return 'HOME';
    }, [location.pathname]);

    // --- RENDER HELPERS ---
    const MixerData = ({ mixer }: { mixer: any }) => (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] text-gray-400">
                <span className="flex items-center gap-1"><ScanLine className="w-3 h-3 text-prismatic-blue" /> PHOTO</span>
                <span className="font-mono text-white">{mixer.photoScaler}/10</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-gray-400">
                <span className="flex items-center gap-1"><Palette className="w-3 h-3 text-pink-400" /> STYLE</span>
                <span className="font-mono text-white">{mixer.styleScaler}/10</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-gray-400">
                <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-orange-400" /> LIGHT</span>
                <span className="font-mono text-white">{mixer.lightScaler}/10</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-gray-400">
                <span className="flex items-center gap-1"><Maximize className="w-3 h-3 text-gray-400" /> UPS</span>
                <span className="font-mono text-white">{mixer.upScaler}</span>
            </div>
        </div>
    );

    // --- REUSABLE STUDIO LAYOUT ---
    const StudioLayout = (
        <main className="flex-1 flex flex-col pt-16 md:pt-20 pb-0 h-full relative">

            {/* 1. HERO & SHOWCASE (LANDING STATE) */}
            {!inputImageUrl && (
                <div className="flex-1 overflow-y-auto bg-black">
                    <HeroGallery
                        onCtaClick={handleStartClick}
                        onMotorClick={(id) => {
                            // Map motor IDs to routes if needed
                            if (id === 'photo') navigate('/forensic');
                            if (id === 'style') navigate('/art');
                            if (id === 'light') navigate('/studio-light');
                            if (id === 'up') navigate('/upscale');
                        }}
                    />
                    <ProductShowcase
                        title="ENGINE SHOWCASE"
                        subtitle="Explora la potencia de nuestros motores forenses y artísticos."
                        examples={[...PHOTOSCALER_EXAMPLES, ...STYLESCALER_EXAMPLES].slice(0, 3)}
                        onBack={() => { }}
                    />
                    {/* Extra padding for footer */}
                    <div className="h-20" />
                </div>
            )}

            {/* 2. STUDIO WORKSPACE (ACTIVE STATE) */}
            {inputImageUrl && (
                <>
                    {/* GRID CONTROLS (NEW) */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider border transition-all ${showBeforeAfter ? 'bg-lumen-gold text-black border-lumen-gold' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                            >
                                <ScanLine className="w-3 h-3" />
                                {showBeforeAfter ? 'ORIGINAL' : 'COMPARE'}
                            </button>
                            <span className="text-[10px] uppercase font-bold text-gray-400 pl-2 border-l border-white/10">Layout</span>
                            <div className="flex bg-white/5 rounded-lg p-1">
                                <button onClick={() => setGridZoom(Math.max(2, gridZoom - 1))} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                                    <ZoomOut className="w-3 h-3" />
                                </button>
                                <span className="text-[10px] font-mono w-4 text-center py-1.5">{gridZoom}</span>
                                <button onClick={() => setGridZoom(Math.min(6, gridZoom + 1))} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                                    <ZoomIn className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="text-[10px] uppercase font-bold text-gray-600">
                            {previews.length} / 6 Variations
                        </div>
                    </div>

                    {/* GALLERY GRID (DYNAMIC) */}
                    <div
                        className="grid gap-4 pb-32 animate-in fade-in slide-in-from-bottom-5"
                        style={{ gridTemplateColumns: `repeat(${gridZoom}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: 6 }).map((_, idx) => { // Always show 6 slots even if configured for less? Or match batchSize? for now 6 is safe defaults.
                            const p = previews[idx];
                            const isSkeleton = !p && (status === AgentStatus.GENERATING_PREVIEWS || status === AgentStatus.SCULPTING);

                            if (p) {
                                if ('error' in p && p.error) {
                                    return (
                                        <div key={`err-${idx}`} className="relative rounded-xl bg-[#0A0A0F] border border-white/5 flex flex-col items-center justify-center cursor-not-allowed group aspect-[2/3]">
                                            <WifiOff className="w-6 h-6 text-crimson-glow mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest font-mono">LOST SIGNAL</span>
                                        </div>
                                    );
                                }
                                const variation = p as ArchivedVariation;
                                const isActive = processedImageUrl === variation.image_path;
                                const label = variation.styleName || variation.style_id.replace('uni_', '').replace('_', ' ');

                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => setProcessedImageUrl(variation.image_path)}
                                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 group ${isActive ? 'border-lumen-gold ring-4 ring-lumen-gold/20 scale-[1.02] z-10' : 'border-transparent hover:border-white/20 hover:scale-[1.01]'}`}
                                        style={{ aspectRatio: aspectRatio ? `${aspectRatio}` : '2/3' }}
                                    >
                                        <img
                                            src={showBeforeAfter && inputImageUrl ? inputImageUrl : getThumbnailUrl(variation.image_path)}
                                            className={`w-full h-full object-cover transition-opacity duration-500 ${showBeforeAfter && inputImageUrl ? 'opacity-80' : 'opacity-100'}`}
                                            alt={`Var ${idx}`}
                                            loading="lazy"
                                        />

                                        {/* OVERLAYS */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity" />

                                        {/* HOVER CONTROLS */}
                                        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMicroscopeOpen(true);
                                                    setProcessedImageUrl(variation.image_path);
                                                }}
                                                className="bg-black/50 hover:bg-white text-white hover:text-black rounded-full p-1.5 backdrop-blur-sm transition-colors"
                                            >
                                                <Maximize className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-wider leading-tight mb-1 truncate">
                                                {label}
                                            </h4>
                                            {isActive && variation.prompt_payload?.mixer && (
                                                <div className="flex items-center gap-1 text-[8px] text-lumen-gold font-mono">
                                                    <Sliders className="w-3 h-3" />
                                                    <span>S{variation.prompt_payload.mixer.stylism} L{variation.prompt_payload.mixer.lighting}</span>
                                                </div>
                                            )}
                                        </div>


                                        {isActive && (
                                            <div className="absolute top-2 right-2 bg-lumen-gold text-black rounded-full p-1 shadow-lg animate-in zoom-in">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>
                                );
                            } else if (isSkeleton) {
                                return (
                                    <div key={`skel-${idx}`} className="relative rounded-xl overflow-hidden bg-white/5 border border-white/5 flex flex-col items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer" />
                                        <Sparkles className="w-5 h-5 text-lumen-gold animate-spin mb-2" />
                                        <span className="text-[9px] text-white/40 font-mono animate-pulse tracking-widest">RENDERING</span>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={`blank-${idx}`} className="relative rounded-xl overflow-hidden bg-black/20 border border-white/5 flex flex-col items-center justify-center opacity-30">
                                        <div className="w-8 h-8 rounded-full bg-white/5" />
                                    </div>
                                );
                            }
                        })}
                    </div>

                    {/* PRESET INFO PANEL */}
                    {
                        currentVar && currentVar.prompt_payload && (
                            <div className="w-full bg-white/5 border border-white/10 rounded-lg p-4 mb-4 mt-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-lumen-gold" />
                                        <span className="text-xs font-bold text-white uppercase tracking-widest">Configuración Usada</span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!userProfile) {
                                                alert('Inicia sesión para guardar presets');
                                                return;
                                            }
                                            const name = prompt('Nombre del preset:');
                                            if (name && currentVar.prompt_payload?.mixer) {
                                                try {
                                                    await saveUserPreset(userProfile.id, name, currentVar.prompt_payload.mixer);
                                                    alert(`✅ Preset "${name}" guardado!`);
                                                } catch (e: any) {
                                                    alert('Error: ' + e.message);
                                                }
                                            }
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-lumen-gold/20 border border-lumen-gold/50 text-lumen-gold rounded hover:bg-lumen-gold hover:text-black transition-all text-[10px] font-bold uppercase"
                                    >
                                        <Bookmark className="w-3 h-3" />
                                        Guardar Preset
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                                    <div className="bg-black/40 rounded px-2 py-1.5">
                                        <span className="text-gray-500 block">Estilo</span>
                                        <span className="text-white font-mono">{currentVar.style_id}</span>
                                    </div>
                                    {currentVar.prompt_payload.mixer && (
                                        <>
                                            <div className="bg-black/40 rounded px-2 py-1.5">
                                                <span className="text-gray-500 block">Stylism</span>
                                                <span className="text-lumen-gold font-mono">{currentVar.prompt_payload.mixer.stylism}/10</span>
                                            </div>
                                            <div className="bg-black/40 rounded px-2 py-1.5">
                                                <span className="text-gray-500 block">Atrezzo</span>
                                                <span className="text-prismatic-blue font-mono">{currentVar.prompt_payload.mixer.atrezzo}/10</span>
                                            </div>
                                            <div className="bg-black/40 rounded px-2 py-1.5">
                                                <span className="text-gray-500 block">Lighting</span>
                                                <span className="text-orange-400 font-mono">{currentVar.prompt_payload.mixer.lighting}/10</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {currentVar.prompt_payload.meta_style_vibe && (
                                    <p className="text-[9px] text-gray-500 mt-2 font-mono italic truncate">
                                        Vibe: {currentVar.prompt_payload.meta_style_vibe}
                                    </p>
                                )}
                            </div>
                        )
                    }

                    {/* STATIC BOTTOM ACTION BAR (FLOW) */}
                    <div className="w-full mt-8 bg-void-black/50 border-t border-white/10 p-4 md:p-0 md:bg-transparent md:border-0">
                        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
                            <button
                                onClick={resetFlow}
                                className="px-4 py-3 border border-white/10 rounded-sm text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-3 h-3" /> Reiniciar
                            </button>

                            {isCurrentMaster ? (
                                <button
                                    onClick={() => handleForceDownload(getMasterUrl(processedImageUrl))}
                                    className={`px-4 py-3 bg-lumen-gold text-black rounded-sm hover:bg-white transition-colors uppercase tracking-widest text-[10px] font-bold flex items-center justify-center gap-2 ${!processedImageUrl ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <ExternalLink className="w-3 h-3" /> Descargar 4K
                                </button>
                            ) : (
                                <button
                                    onClick={handleUnlockMaster}
                                    disabled={!processedImageUrl}
                                    className={`px-4 py-3 bg-white text-black rounded-sm hover:bg-lumen-gold transition-all uppercase tracking-widest text-[10px] font-bold flex items-center justify-center gap-2 ${!processedImageUrl ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <Crown className="w-3 h-3" /> CREAR MASTER 4K
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </main>
    );

    if (isNative) return <MobileCameraView />;

    // 2. MAIN APPLICATION LAYOUT (Standard Nav + Views)
    return (
        <div className="min-h-screen bg-void-black text-chalk-white font-sans selection:bg-lumen-gold/30 selection:text-lumen-gold flex flex-col">
            {!location.pathname.includes('/admin/canvas') && !location.pathname.includes('/archives') && (
                <Navigation
                    currentView={activeView}
                    onNavigateToStudio={navigateToHome}
                    onUploadProject={handleStartClick}
                    onNavigateToArchive={() => navigate('/archives')}
                    onLogin={() => setIsAuthModalOpen(true)}
                    onSignOut={handleSignOut}
                    onAdminDashboard={() => navigate('/admin')}
                    onNavigateToEngine1={() => navigate('/forensic')}
                    onNavigateToEngine2={() => navigate('/art')}
                    onNavigateToEngine3={() => navigate('/studio-light')}
                    onNavigateToEngine4={() => navigate('/upscale')}
                    onNavigateToPricing={() => navigate('/pricing')}
                    userProfile={userProfile}
                    showInstallBtn={showInstallBtn}
                    onInstallApp={handleInstallClick}
                />
            )}

            {/* GLOBAL UPLOAD INPUT - Always Mounted */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleGuestUpload}
                accept="image/*"
                className="hidden"
            />

            {/* GLOBAL INFO TOAST - Always available */}
            <InfoToast
                toast={toastState}
                onClose={() => setToastState(s => ({ ...s, isOpen: false }))}
            />

            {/* GLOBAL PROCESSING OVERLAY - Shows during upload/analysis/generation */}
            {showProcessingOverlay && (
                <ProcessingOverlay
                    phase={processingPhase}
                    status={processingPhase === 'upload' || processingPhase === 'vision' ? 'ANALYZING' : 'GENERATING'}
                    logs={[
                        phaseLabel,
                        `Tiempo: ${elapsedTime.toFixed(1)}s`
                    ].filter(Boolean) as string[]}
                    progress={phaseProgress}
                    canClose={processingPhase === 'generate'}
                    onCancel={() => {
                        if (processingPhase === 'generate') {
                            setShowProcessingOverlay(false);
                        }
                    }}
                />
            )}

            {/* SHARED MODALS */}
            
            {/* NEW: Unified Config Modal (Vision + Profile combined) */}
            <UnifiedConfigModal
                isVisible={showVisionConfirm || showProfileSelector}
                imageUrl={stagedImageUrl || inputImageUrl || ''}
                analysis={visionAnalysis}
                onConfirm={handleUnifiedConfirm}
                onCancel={handleUnifiedCancel}
                tokensRequired={10}
                userTokens={userTokenBalance}
                userProfile={(userProfile?.profile_type as 'auto' | 'user' | 'pro' | 'prolux') || 'auto'}
                userId={userProfile?.id}
            />

            {/* Legacy MobileConfigWizard disabled for v28 flow */}
            <MobileConfigWizard
                imageUrl={stagedImageUrl || inputImageUrl || ''}
                onConfirm={handleWizardConfirm}
                onCancel={resetFlow}
                isVisible={false}
                analysis={analysisResult}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => { setIsAuthModalOpen(false); setAuthMessage(null); }}
                onSuccess={handleAuthSuccess}
                onRegister={() => { setIsAuthModalOpen(false); setIsAccessModalOpen(true); }}
            />

            <AccessCodeModal
                isOpen={isAccessModalOpen}
                onClose={() => setIsAccessModalOpen(false)}
                onSuccess={handleAccessCodeSuccess}
            />

            {isAuthModalOpen && authMessage && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] bg-lumen-gold text-black px-6 py-2 rounded-full font-bold shadow-lg animate-bounce text-sm text-center w-[90%] md:w-auto">
                    {authMessage}
                </div>
            )}

            <PurchaseModal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModal(false)} onSuccess={() => { }} />

            <ImageInspectorModal
                isOpen={isMicroscopeOpen}
                onClose={() => setIsMicroscopeOpen(false)}
                processedImage={getMasterUrl(processedImageUrl)}
                originalImage={inputImageUrl || undefined}
                title={isCurrentMaster ? "Inspección Master 4K" : "Inspección Previa"}
                variation={currentVar}
                generation={currentSessionId} // Assuming currentSessionId can be used or mapped
                onGenerateMaster={handleOutputConfirm}
                isProcessing={isSculpting}
            />

            <OutputSelector
                isOpen={showOutputSelector}
                onClose={() => setShowOutputSelector(false)}
                onConfirm={handleOutputConfirm}
            />

            {/* VIEW CONTENT */}
            <Routes>
                {/* STUDIO / HOME ROUTE */}
                <Route path="/" element={StudioLayout} />

                {/* APP VIEWS */}
                <Route path="/archives" element={<ArchivesDashboard onBack={navigateToHome} userId={userProfile?.id} />} />
                <Route path="/admin" element={
                    <ProtectedAdminRoute
                        userProfile={userProfile}
                        isLoading={isAuthLoading}
                        onOpenAuth={() => setIsAuthModalOpen(true)}
                    >
                        <AdminDashboard onBack={navigateToHome} />
                    </ProtectedAdminRoute>
                } />
                <Route path="/admin/canvas" element={
                    <ProtectedAdminRoute
                        userProfile={userProfile}
                        isLoading={isAuthLoading}
                        onOpenAuth={() => setIsAuthModalOpen(true)}
                    >
                        <LuxCanvasPage />
                    </ProtectedAdminRoute>
                } />
                <Route path="/pricing" element={<PricingPage onBack={navigateToHome} />} />

                {/* INFO PAGES */}
                <Route path="/tutorial" element={<InfoPages onBack={navigateToHome} mode="TUTORIAL" />} />
                <Route path="/faq" element={<InfoPages onBack={navigateToHome} mode="FAQ" />} />
                <Route path="/terms" element={<InfoPages onBack={navigateToHome} mode="TERMS" />} />
                <Route path="/privacy" element={<InfoPages onBack={navigateToHome} mode="PRIVACY" />} />
                <Route path="/cookies" element={<InfoPages onBack={navigateToHome} mode="COOKIES" />} />
                <Route path="/legal" element={<InfoPages onBack={navigateToHome} mode="LEGAL_NOTICE" />} />
                <Route path="/api-docs" element={<InfoPages onBack={navigateToHome} mode="API_DOCS" />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* ALIASES FOR ENGINES - RENDER MAIN STUDIO VIEW (Persist URL for Navigation State) */}
                {/* ALIASES FOR ENGINES - INFO PAGES */}
                <Route path="/forensic" element={<ScalerInfoPage mode="FORENSIC" onBack={navigateToHome} />} />
                <Route path="/art" element={<ScalerInfoPage mode="ART" onBack={navigateToHome} />} />
                <Route path="/studio-light" element={<ScalerInfoPage mode="STUDIO_LIGHT" onBack={navigateToHome} />} />
                <Route path="/upscale" element={<ScalerInfoPage mode="UPSCALE" onBack={navigateToHome} />} />

                {/* UPSCALE TOOL (Solo desde Admin) */}
                <Route path="/upscale-tool" element={<UpscalePage />} />

                {/* RESULT PAGE */}
                <Route path="/result" element={StudioLayout} />

                {/* 404 FALLBACK */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>

            {/* NEW ADVANCED CONFIG MODAL */}
            <AdvancedConfigModal
                isVisible={showConfigWizard}
                imageUrl={inputImageUrl || ''}
                analysis={analysisResult}
                onConfirm={handleConfigConfirm}
                onCancel={resetFlow}
            />

            {/* GLOBAL FOOTER - Hidden in Studio/Result/Archives/Canvas */}
            {(!location.pathname.includes('/result') && !location.pathname.includes('/admin/canvas') && !location.pathname.includes('/archives') && !inputImageUrl) && (
                <GlobalFooter onNavigate={(view) => {
                    switch (view) {
                        case 'HOME': navigate('/'); break;
                        case 'ARCHIVES': navigate('/archives'); break;
                        case 'ADMIN': navigate('/admin'); break;
                        case 'PRICING': navigate('/pricing'); break;
                        case 'FAQ': navigate('/faq'); break;
                        case 'TERMS': navigate('/terms'); break;
                        case 'PRIVACY': navigate('/privacy'); break;
                        case 'COOKIES': navigate('/cookies'); break;
                        case 'LEGAL_NOTICE': navigate('/legal'); break;
                        case 'CONTACT': navigate('/contact'); break;
                        default: navigate('/');
                    }
                }} />
            )}

            {/* LEGAL & COMPLIANCE */}
            <CookieBanner />
        </div >
    );
};

export default App;
