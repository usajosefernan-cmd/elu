
import React, { useState } from 'react';
import { Sparkles, X, Mail, Send, Check, Key, ArrowRight } from 'lucide-react';
import { LuxButton } from './LuxButton';
import { getSupabaseClient, authenticateWithBetaCode } from '../services/authService';

interface AccessCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Mode = 'WAITLIST' | 'ENTER_CODE';

export const AccessCodeModal: React.FC<AccessCodeModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState<Mode>('WAITLIST');

    // Waitlist State
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);

    // Code State
    const [accessCode, setAccessCode] = useState('');

    // UI State
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleWaitlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!acceptTerms || !acceptPrivacy) {
            setFeedback({ type: 'error', msg: "Debes aceptar los términos y la política de privacidad." });
            return;
        }

        setIsLoading(true);
        setFeedback(null);

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.from('beta_waitlist').insert({
                email: email,
                name: name,
                status: 'pending'
            });

            if (error) {
                // If unique constraint error, just pretend success to not leak info
                if (error.code !== '23505') throw error;
            }

            setFeedback({ type: 'success', msg: "Solicitud recibida. Te contactaremos pronto." });
        } catch (err: any) {
            console.error("Waitlist error:", err);
            setFeedback({ type: 'error', msg: "Error de conexión. Intenta más tarde." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFeedback(null);

        try {
            await authenticateWithBetaCode(accessCode);
            onSuccess(); // Trigger App login state
            onClose();
        } catch (err: any) {
            setFeedback({ type: 'error', msg: "Código inválido o expirado." });
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToLegal = (target: 'TERMS' | 'PRIVACY') => {
        window.dispatchEvent(new CustomEvent('lux-navigate', { detail: target }));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-void-black/95 backdrop-blur-xl" onClick={onClose}></div>

            <div className="relative w-full max-w-sm bg-black border border-white/10 rounded-sm shadow-[0_0_50px_rgba(230,199,139,0.1)] overflow-hidden animate-[fadeIn_0.3s_ease-out]">

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10">
                    <X className="w-5 h-5" />
                </button>

                {/* HEADER */}
                <div className="p-8 pb-4 text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 mx-auto">
                        <Sparkles className="w-5 h-5 text-prismatic-blue" />
                    </div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-1">
                        Private Beta
                    </h2>
                    <p className="text-[10px] text-gray-400 font-mono">
                        LuxScaler v1.0 • Acceso Controlado
                    </p>
                </div>

                {/* TABS */}
                <div className="flex border-b border-white/10 mx-8 mb-6">
                    <button
                        onClick={() => { setMode('WAITLIST'); setFeedback(null); }}
                        className={`flex-1 pb-2 text-[10px] uppercase font-bold transition-colors ${mode === 'WAITLIST' ? 'text-white border-b-2 border-lumen-gold' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        Solicitar Acceso
                    </button>
                    <button
                        onClick={() => { setMode('ENTER_CODE'); setFeedback(null); }}
                        className={`flex-1 pb-2 text-[10px] uppercase font-bold transition-colors ${mode === 'ENTER_CODE' ? 'text-white border-b-2 border-lumen-gold' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        Tengo un Código
                    </button>
                </div>

                {/* BODY */}
                <div className="px-8 pb-8">
                    {feedback?.type === 'success' ? (
                        <div className="text-center py-4 animate-[fadeIn_0.5s]">
                            <div className="inline-block p-3 bg-green-500/10 rounded-full mb-4 border border-green-500/20">
                                <Check className="w-6 h-6 text-green-500" />
                            </div>
                            <h3 className="text-white font-bold text-sm mb-2">Estás en la lista</h3>
                            <p className="text-xs text-gray-400 leading-relaxed mb-6 font-mono">
                                {feedback.msg}
                            </p>
                            <button
                                onClick={onClose}
                                className="text-[10px] uppercase font-bold text-lumen-gold hover:underline"
                            >
                                Cerrar
                            </button>
                        </div>
                    ) : (
                        <>
                            {mode === 'WAITLIST' && (
                                <form onSubmit={handleWaitlistSubmit} className="space-y-4 animate-[fadeIn_0.3s]">
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-bold text-gray-500">Nombre Completo</label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-sm py-2 px-3 text-white text-sm focus:border-prismatic-blue focus:outline-none transition-all placeholder-gray-600"
                                            placeholder="Tu Nombre"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-bold text-gray-500">Correo Electrónico</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-sm py-2 pl-10 pr-3 text-white text-sm focus:border-prismatic-blue focus:outline-none transition-all placeholder-gray-600"
                                                placeholder="tu@email.com"
                                            />
                                        </div>
                                    </div>

                                    {/* LEGAL CHECKBOXES */}
                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={acceptTerms}
                                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                                className="mt-1 w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-lumen-gold focus:ring-0 focus:ring-offset-0"
                                            />
                                            <span className="text-[10px] text-gray-500 leading-tight group-hover:text-gray-400 transition-colors">
                                                Acepto los <button type="button" onClick={() => navigateToLegal('TERMS')} className="text-lumen-gold hover:underline">Términos de Servicio</button> de LuxScaler, incluyendo la política de varianza de IA y procesamiento internacional de datos.
                                            </span>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={acceptPrivacy}
                                                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                                                className="mt-1 w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-lumen-gold focus:ring-0 focus:ring-offset-0"
                                            />
                                            <span className="text-[10px] text-gray-500 leading-tight group-hover:text-gray-400 transition-colors">
                                                He leído y acepto la <button type="button" onClick={() => navigateToLegal('PRIVACY')} className="text-lumen-gold hover:underline">Política de Privacidad</button> de LuxScaler.
                                            </span>
                                        </label>
                                    </div>

                                    <LuxButton
                                        type="submit"
                                        variant="secondary"
                                        isLoading={isLoading}
                                        className={`w-full justify-center mt-2 ${(!acceptTerms || !acceptPrivacy) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                        disabled={!acceptTerms || !acceptPrivacy}
                                    >
                                        Unirse a la Espera
                                    </LuxButton>
                                </form>
                            )}

                            {mode === 'ENTER_CODE' && (
                                <form onSubmit={handleCodeSubmit} className="space-y-4 animate-[fadeIn_0.3s]">
                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase font-bold text-gray-500">Código de Invitación</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-2.5 w-4 h-4 text-lumen-gold" />
                                            <input
                                                type="text"
                                                required
                                                value={accessCode}
                                                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                                className="w-full bg-white/5 border border-white/10 rounded-sm py-2 pl-10 pr-3 text-lumen-gold font-mono font-bold text-sm focus:border-lumen-gold focus:outline-none transition-all placeholder-gray-700 tracking-wider"
                                                placeholder="LUX-XXXX"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <LuxButton type="submit" isLoading={isLoading} className="w-full justify-center mt-4">
                                        Acceder al Core <ArrowRight className="w-4 h-4 ml-2" />
                                    </LuxButton>
                                </form>
                            )}

                            {feedback?.type === 'error' && (
                                <div className="mt-4 p-2 bg-crimson-glow/10 border border-crimson-glow/20 rounded text-center">
                                    <p className="text-[10px] text-crimson-glow font-bold uppercase">{feedback.msg}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
