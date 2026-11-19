import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toast: {
    id: number;
    message: string;
    type: 'info' | 'success' | 'error';
  } | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce-short">
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
          isSuccess
            ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-200'
            : isError
            ? 'bg-slate-900/95 border-rose-500/40 text-rose-200'
            : 'bg-slate-900/95 border-indigo-500/40 text-indigo-200'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : isError ? (
            <AlertCircle className="h-5 w-5 text-rose-400" />
          ) : (
            <Info className="h-5 w-5 text-indigo-400" />
          )}
        </div>

        <div className="text-xs font-sans pr-2">
          <p className="font-semibold text-white">Routiva Pulse Alert</p>
          <p className="text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors shrink-0 ml-auto"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
