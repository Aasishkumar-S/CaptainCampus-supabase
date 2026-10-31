import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const iconConfig = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      bg: 'bg-rose-100 dark:bg-rose-950/60',
      confirmButtonClass:
        'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 shadow-rose-600/30 text-white',
    },
    warning: {
      icon: <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      bg: 'bg-amber-100 dark:bg-amber-950/60',
      confirmButtonClass:
        'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 shadow-amber-600/30 text-white',
    },
    info: {
      icon: <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-100 dark:bg-indigo-950/60',
      confirmButtonClass:
        'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-indigo-600/30 text-white',
    },
  };

  const currentConfig = iconConfig[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onCancel : undefined}
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all z-10 animate-scaleUp"
      >
        <button
          onClick={!isLoading ? onCancel : undefined}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={clsx('p-3 rounded-xl shrink-0', currentConfig.bg)}>
            {currentConfig.icon}
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h3
              id="confirm-dialog-title"
              className="text-lg font-bold text-slate-900 dark:text-white leading-snug"
            >
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50',
              currentConfig.confirmButtonClass
            )}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
