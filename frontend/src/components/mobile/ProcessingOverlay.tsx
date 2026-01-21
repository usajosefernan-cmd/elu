import React, { useState, useEffect } from 'react';
import {
    Loader2, Sparkles, BrainCircuit, ScanLine,
    Zap, Sliders, Activity, Check, AlertTriangle, ShieldCheck,
    Camera, Wand2, X
} from 'lucide-react';

interface ProcessingOverlayProps {
    profiles?: any[];
    onComplete?: () => void;
    onCancel?: () => void;
    status: 'ANALYZING' | 'GENERATING' | 'DONE' | 'ERROR';
    logs: string[];
    progress: number; // 0-100
    phase?: 'upload' | 'vision' | 'compile' | 'generate' | null;
    canClose?: boolean;
}

// Mensajes claros para el usuario
const PHASE_MESSAGES = {
    upload: {
        title: '📤 Preparando tu imagen',
        subtitle: 'Optimizando para análisis...',
        tip: 'Esto solo toma unos segundos'
    },
    vision: {
        title: '🔍 Analizando tu foto',
        subtitle: 'Gemini 2.5 Flash está estudiando tu imagen',
        tip: 'Detectando elementos, iluminación y estilo...'
    },
    compile: {
        title: '🧠 Compilando instrucciones',
        subtitle: 'Preparando las instrucciones para la IA',
        tip: 'Optimizando parámetros de generación...'
    },
    generate: {
        title: '✨ Generando tu imagen',
        subtitle: 'La IA está creando tu resultado',
        tip: 'Puedes cerrar esta ventana. Te avisaremos cuando termine.'
    }
};

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
    profiles = [],
    status,
    logs,
    progress,
    phase,
    onCancel,
    canClose = false
}) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        let timer: any;
        if (status === 'ANALYZING' || status === 'GENERATING') {
            timer = setInterval(() => setElapsed(prev => prev + 0.1), 100);
        }
        return () => clearInterval(timer);
    }, [status]);

    const currentPhase = phase || (status === 'ANALYZING' ? 'vision' : 'generate');
    const phaseInfo = PHASE_MESSAGES[currentPhase] || PHASE_MESSAGES.vision;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-hidden">
            {/* Header con botón cerrar */}
            <div className="w-full p-4 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-lumen-gold animate-pulse" />
                    <span className="text-xs font-bold text-white/60 uppercase tracking-widest">LuxScaler Procesando</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="font-mono text-lg font-black text-white">
                        {elapsed.toFixed(1)}<span className="text-[10px] text-lumen-gold/50 ml-1">s</span>
                    </div>
                    {canClose && onCancel && (
                        <button 
                            onClick={onCancel}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={18} className="text-white/60" />
                        </button>
                    )}
                </div>
            </div>

            {/* PANEL PRINCIPAL - Mensaje claro para el usuario */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                {/* Icono grande animado */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-lumen-gold/20 rounded-full blur-3xl animate-pulse" />
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        {/* Anillos animados */}
                        <div className="absolute inset-0 border-2 border-lumen-gold/20 rounded-full animate-ping" />
                        <div className="absolute inset-4 border border-lumen-gold/40 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                        
                        {/* Icono central */}
                        <div className="relative z-10 w-16 h-16 bg-lumen-gold/10 rounded-full flex items-center justify-center border border-lumen-gold/30">
                            {currentPhase === 'upload' && <Camera size={28} className="text-lumen-gold" />}
                            {currentPhase === 'vision' && <ScanLine size={28} className="text-lumen-gold animate-pulse" />}
                            {currentPhase === 'compile' && <BrainCircuit size={28} className="text-lumen-gold" />}
                            {currentPhase === 'generate' && <Wand2 size={28} className="text-lumen-gold animate-bounce" />}
                        </div>
                    </div>
                </div>

                {/* Mensaje principal */}
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-black text-white mb-2">
                        {phaseInfo.title}
                    </h2>
                    <p className="text-base text-lumen-gold mb-3">
                        {phaseInfo.subtitle}
                    </p>
                    <p className="text-sm text-white/50">
                        {phaseInfo.tip}
                    </p>
                </div>

                {/* Barra de progreso */}
                <div className="w-full max-w-sm mt-8 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-white/40 uppercase tracking-wider">Progreso</span>
                        <span className="text-lumen-gold font-mono">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-lumen-gold to-yellow-300 rounded-full transition-all duration-500 ease-out shadow-[0_0_20px_rgba(212,175,55,0.5)]"
                            style={{ width: `${Math.max(5, progress)}%` }}
                        />
                    </div>
                </div>

                {/* Indicador de fases */}
                <div className="flex items-center gap-2 mt-8">
                    {['upload', 'vision', 'compile', 'generate'].map((p, i) => {
                        const phaseOrder = ['upload', 'vision', 'compile', 'generate'];
                        const currentIndex = phaseOrder.indexOf(currentPhase);
                        const isActive = p === currentPhase;
                        const isComplete = i < currentIndex;
                        
                        return (
                            <div key={p} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold uppercase transition-all ${
                                    isActive ? 'bg-lumen-gold text-black scale-110' :
                                    isComplete ? 'bg-lumen-gold/30 text-lumen-gold' :
                                    'bg-white/10 text-white/30'
                                }`}>
                                    {isComplete ? <Check size={14} /> : i + 1}
                                </div>
                                {i < 3 && (
                                    <div className={`w-8 h-0.5 ${isComplete ? 'bg-lumen-gold/50' : 'bg-white/10'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Logs en la parte inferior */}
            <div className="w-full bg-black/50 border-t border-white/10 p-4">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={12} className="text-lumen-gold/50" />
                        <span className="text-[10px] text-white/30 uppercase tracking-widest">Log del sistema</span>
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                        {logs.slice(-3).map((log, i) => (
                            <div key={i} className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in">
                                <div className="w-1 h-1 rounded-full bg-lumen-gold/40" />
                                <p className="text-[11px] font-mono text-white/40 truncate">{log}</p>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <p className="text-[11px] font-mono text-white/20">Iniciando proceso...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
