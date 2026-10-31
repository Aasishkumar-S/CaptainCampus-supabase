import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, message, type, duration };

      setToasts((prev) => {
        // Keep max 4 toasts
        const slice = prev.length >= 4 ? prev.slice(prev.length - 3) : prev;
        return [...slice, newToast];
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}
    >
      {children}
      {/* Toast container in top-right */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const typeConfigs = {
            success: {
              border: 'border-l-4 border-l-emerald-500',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
              bg: 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100',
            },
            error: {
              border: 'border-l-4 border-l-rose-500',
              icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
              bg: 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100',
            },
            warning: {
              border: 'border-l-4 border-l-amber-500',
              icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
              bg: 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100',
            },
            info: {
              border: 'border-l-4 border-l-indigo-500',
              icon: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
              bg: 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100',
            },
          };

          const cfg = typeConfigs[toast.type];

          return (
            <div
              key={toast.id}
              className={clsx(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/80 transition-all duration-300 ease-in-out transform translate-y-0 opacity-100',
                cfg.bg,
                cfg.border
              )}
            >
              <div className="mt-0.5">{cfg.icon}</div>
              <div className="flex-1 text-sm font-medium leading-snug break-words">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
