import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from './Skeleton';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue';
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'indigo',
  isLoading = false,
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-900/40',
      accent: 'from-indigo-500/10 to-transparent',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/40',
      accent: 'from-emerald-500/10 to-transparent',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/40',
      accent: 'from-amber-500/10 to-transparent',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900/40',
      accent: 'from-rose-500/10 to-transparent',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/40',
      accent: 'from-blue-500/10 to-transparent',
    },
  };

  const scheme = colorMap[color];

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
      {/* Subtle gradient highlight in corner */}
      <div
        className={clsx(
          'absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl rounded-bl-full pointer-events-none transition-opacity opacity-50 group-hover:opacity-80',
          scheme.accent
        )}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div
          className={clsx(
            'p-2.5 rounded-xl border transition-transform duration-200 group-hover:scale-105',
            scheme.bg,
            scheme.text,
            scheme.border
          )}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>

        {trend && (
          <div
            className={clsx(
              'flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
            )}
            <span>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {trend.label}
        </div>
      )}
    </div>
  );
};
