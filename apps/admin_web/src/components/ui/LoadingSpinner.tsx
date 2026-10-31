import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'slate';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  label,
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorStyles = {
    primary: 'text-indigo-600 dark:text-indigo-400',
    white: 'text-white',
    slate: 'text-slate-500 dark:text-slate-400',
  };

  return (
    <div className={clsx('inline-flex flex-col items-center justify-center gap-2', className)}>
      <Loader2
        className={clsx('animate-spin', sizeStyles[size], colorStyles[color])}
      />
      {label && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}
    </div>
  );
};
