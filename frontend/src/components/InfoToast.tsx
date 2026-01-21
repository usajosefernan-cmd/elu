import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'error';

export interface ToastState {
  isOpen: boolean;
  title: string;
  message?: string;
  type?: ToastType;
}

export const InfoToast: React.FC<{
  toast: ToastState;
  onClose: () => void;
  durationMs?: number;
}> = ({ toast, onClose, durationMs }) => {
  // Duración por defecto: success=5s, error=8s, info=3s
  const defaultDuration = toast.type === 'success' ? 5000 : toast.type === 'error' ? 8000 : 3000;
  const duration = durationMs ?? defaultDuration;

  useEffect(() => {
    if (!toast.isOpen) return;
    const t = window.setTimeout(() => onClose(), duration);
    return () => window.clearTimeout(t);
  }, [toast.isOpen, duration, onClose]);

  if (!toast.isOpen) return null;

  const config = {
    success: {
      border: 'border-emerald-400/40',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />
    },
    error: {
      border: 'border-red-400/40',
      bg: 'bg-red-500/10',
      text: 'text-red-300',
      icon: <AlertCircle className="w-5 h-5 text-red-400" />
    },
    info: {
      border: 'border-lumen-gold/40',
      bg: 'bg-lumen-gold/10',
      text: 'text-lumen-gold',
      icon: <Info className="w-5 h-5 text-lumen-gold" />
    }
  };

  const style = config[toast.type || 'info'];

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={`${style.bg} backdrop-blur-xl border ${style.border} rounded-2xl px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.75)]`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-bold ${style.text}`}>{toast.title}</div>
            {toast.message && (
              <div className="text-xs text-gray-300 mt-1 leading-relaxed">{toast.message}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
