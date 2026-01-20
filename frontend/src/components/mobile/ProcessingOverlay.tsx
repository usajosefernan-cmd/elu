import React, { useState, useEffect } from 'react';
import {
    Loader2, Sparkles, BrainCircuit, ScanLine,
    Zap, Sliders, Activity, Check, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface ProcessingOverlayProps {
    profiles: any[];
    onComplete?: () => void;
    status: 'ANALYZING' | 'GENERATING' | 'DONE' | 'ERROR';
    logs: string[];
    progress: number; // 0-100
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
    profiles,
    status,
    logs,
    progress
}) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        let timer: any;
        if (status === 'ANALYZING' || status === 'GENERATING') {
            timer = setInterval(() => setElapsed(prev => prev + 0.1), 100);
        }
        return () => clearInterval(timer);
    }, [status]);

    return (
        <div className="absolute inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-xl animate-in fade-in duration-500 overflow-hidden">
            {/* Top Status */}
            <div className="w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-3">
                    <Activity size={16} className="text-lumen-gold animate-pulse" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Neural Core Active</span>
                        <span className="text-[8px] font-mono text-white/40 uppercase">Encrypted Handshake v5.2</span>
                    </div>
                </div>
                <div className="font-mono text-xl font-black text-white">
                    {elapsed.toFixed(1)}<span className="text-[10px] text-lumen-gold/50 ml-1">S</span>
                </div>
            </div>

            {/* Main Visualizer */}
            <div className="flex-1 flex flex-col items-center justify-center relative px-8">
                {/* Global Glow */}
                <div className="absolute w-64 h-64 bg-lumen-gold/5 rounded-full blur-[100px] animate-pulse pointer-events-none" />

                {/* Central Animation */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-12">
                    {/* Ring 1 - Pulse */}
                    <div className="absolute inset-0 border border-lumen-gold/20 rounded-full animate-ping opacity-20" />
                    {/* Ring 2 - Spin */}
                    <div className="absolute inset-2 border-t-2 border-r-2 border-lumen-gold/40 rounded-full animate-spin duration-[3000ms]" />
                    {/* Ring 3 - Counter Spin */}
                    <div className="absolute inset-6 border-b-2 border-l-2 border-white/10 rounded-full animate-spin-reverse duration-[4000ms]" />

                    {/* Status Icon */}
                    <div className="relative z-10 flex flex-col items-center text-center">
                        {status === 'ANALYZING' && <ScanLine size={32} className="text-lumen-gold animate-bounce mb-2" />}
                        {status === 'GENERATING' && <BrainCircuit size={32} className="text-lumen-gold animate-pulse mb-2" />}
                        {status === 'DONE' && <ShieldCheck size={32} className="text-green-500 mb-2" />}
                        {status === 'ERROR' && <AlertTriangle size={32} className="text-red-500 mb-2" />}

                        <span className="text-xs font-black text-white tracking-widest uppercase">
                            {status === 'ANALYZING' ? 'Diagnosing Scene' :
                                status === 'GENERATING' ? 'Generating Previews' :
                                    status === 'DONE' ? 'Pipeline Complete' : 'System Failure'}
                        </span>
                        <span className="text-[8px] font-mono text-white/30 uppercase mt-1 tracking-tighter">
                            {progress.toFixed(0)}% Computed
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Global Compute</span>
                        <span className="text-[10px] font-mono text-lumen-gold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-lumen-gold shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Profiles & Logs Area */}
            <div className="h-1/3 w-full bg-black/40 border-t border-white/5 p-6 flex flex-col gap-4">
                {/* Profiles Status */}
                <div className="grid grid-cols-3 gap-2">
                    {profiles.map((p, i) => (
                        <div key={p.id || i} className={`p-2 rounded border transition-all ${i < Math.floor(progress / (100 / profiles.length)) ? 'bg-lumen-gold/10 border-lumen-gold/30' : 'bg-white/5 border-white/10 opacity-40'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[7px] font-black text-white/30 uppercase truncate">{p.name}</span>
                                {i < Math.floor(progress / (100 / profiles.length)) ? <Check size={8} className="text-lumen-gold" /> : <Loader2 size={8} className="animate-spin text-white/20" />}
                            </div>
                            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${i < Math.floor(progress / (100 / profiles.length)) ? 'bg-lumen-gold' : 'bg-white/10'}`}
                                    style={{ width: i < Math.floor(progress / (100 / profiles.length)) ? '100%' : '0%' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Live Logs */}
                <div className="flex-1 bg-black/20 rounded border border-white/5 p-3 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/20 pointer-events-none" />
                    <div className="space-y-1">
                        {logs.slice(-4).map((log, i) => (
                            <div key={i} className="flex items-center gap-2 animate-in slide-in-from-left-2 fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="w-1 h-1 rounded-full bg-lumen-gold/40" />
                                <p className="text-[9px] font-mono text-white/50 uppercase tracking-tighter truncate">
                                    <span className="text-lumen-gold/20 pr-1">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    {log}
                                </p>
                            </div>
                        ))}
                    </div>
                    {logs.length === 0 && (
                        <div className="h-full flex items-center justify-center opacity-20">
                            <span className="text-[9px] font-mono uppercase tracking-[0.3em]">Awaiting Uplink...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
