
import React, { useState } from 'react';
import { signInUser } from '../services/authService';
import { LuxButton } from './LuxButton';
import { X, Mail, AlertCircle, Fingerprint, Lock } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onRegister?: () => void; // Used to trigger AccessCodeModal
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, onRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Only Allow Login
            await signInUser(email, password);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Credenciales inválidas.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-void-black/95 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative bg-black border border-white/10 w-full max-w-sm p-8 rounded-sm shadow-[0_0_80px_rgba(230,199,139,0.15)] animate-[fadeIn_0.3s_ease-out] overflow-hidden">

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10">
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                            <Lock className="w-4 h-4 text-lumen-gold" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1 uppercase tracking-widest">
                        Operador Login
                    </h2>
                    <p className="text-[10px] text-gray-500 font-mono">Acceso restringido a personal autorizado.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Identificador</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-lumen-gold transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-sm py-2 pl-10 pr-4 text-white text-sm focus:border-lumen-gold focus:outline-none transition-all placeholder-gray-700"
                                placeholder="operative@luxscaler.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Clave de Acceso</label>
                        <div className="relative group">
                            <Fingerprint className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-lumen-gold transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-sm py-2 pl-10 pr-4 text-white text-sm focus:border-lumen-gold focus:outline-none transition-all placeholder-gray-700"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-crimson-glow text-[10px] bg-crimson-glow/10 p-3 rounded-sm border border-crimson-glow/20 justify-center">
                            <AlertCircle className="w-3 h-3" />
                            <span className="uppercase font-bold">{error}</span>
                        </div>
                    )}

                    <LuxButton type="submit" isLoading={isLoading} className="w-full justify-center">
                        Iniciar Sesión
                    </LuxButton>
                </form>

                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    <p className="text-[9px] text-gray-600 mb-2">¿No tienes credenciales?</p>
                    <button
                        onClick={() => { onClose(); onRegister?.(); }}
                        className="text-[10px] text-lumen-gold hover:text-white uppercase font-bold transition-colors border border-lumen-gold/30 px-4 py-2 rounded hover:bg-lumen-gold/10"
                    >
                        Solicitar Acceso Beta
                    </button>
                </div>
            </div>
        </div>
    );
};
