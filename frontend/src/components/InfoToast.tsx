import React, { useEffect } from 'react';

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
}> = ({ toast, onClose, durationMs = 2600 }) => {
  useEffect(() => {
    if (!toast.isOpen) return;
    const t = window.setTimeout(() => onClose(), durationMs);
    return () => window.clearTimeout(t);
  }, [toast.isOpen, durationMs, onClose]);

  if (!toast.isOpen) return null;

  const color =
    toast.type === 'success'
      ? 'border-emerald-400/30 text-emerald-200'
      : toast.type === 'error'
        ? 'border-red-400/30 text-red-200'
        : 'border-white/15 text-white';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-xl">
      <div className={`bg-black/85 backdrop-blur-xl border ${color} rounded-2xl px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.75)]`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-widest">{toast.title}</div>
            {toast.message && (
              <div className="text-[11px] text-gray-300 mt-1 leading-snug">{toast.message}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[10px] text-gray-400 hover:text-white uppercase tracking-widest"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
