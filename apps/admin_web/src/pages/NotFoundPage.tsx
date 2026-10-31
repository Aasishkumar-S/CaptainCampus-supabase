import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
            <Compass className="w-12 h-12 animate-pulse-slow" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The destination you are trying to reach does not exist in the transit management portal, or the route has been altered.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/dashboard')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
