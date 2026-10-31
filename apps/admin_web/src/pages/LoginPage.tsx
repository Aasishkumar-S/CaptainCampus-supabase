import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Eye, EyeOff, ShieldAlert, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { signIn, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn(email.trim(), password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setLocalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-900 text-slate-100">
      {/* Left Decorative Branding Section */}
      <div className="relative flex-1 bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 p-8 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Animated Background Decorative Elements */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-400 flex items-center justify-center shadow-xl shadow-indigo-500/30 ring-1 ring-white/20">
            <Bus className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-white">Captain Campus</span>
            <div className="text-xs uppercase tracking-widest text-indigo-300 font-semibold">
              Admin & Fleet Command
            </div>
          </div>
        </div>

        {/* Bus Route Graphic / Visual showcase */}
        <div className="relative z-10 my-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-xs font-medium text-indigo-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Transportation Management</span>
          </div>

          <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight mb-6">
            Real-time control for smart campus transit.
          </h2>

          <p className="text-slate-300 text-base lg:text-lg font-normal leading-relaxed mb-8">
            Track active campus shuttles in real-time, optimize stop schedules, broadcast critical alerts, and keep thousands of students moving safely.
          </p>

          {/* Graphical Bus Route SVG illustration */}
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs text-indigo-200">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Network Active
              </span>
              <span>Campus North ➔ South Hub</span>
            </div>

            {/* Custom SVG Transit Path */}
            <div className="relative py-2">
              <svg className="w-full h-12" viewBox="0 0 400 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M 10 24 Q 100 8, 200 24 T 390 24"
                  stroke="#4338ca"
                  strokeWidth="4"
                  strokeDasharray="6 6"
                />
                <path
                  d="M 10 24 Q 100 8, 200 24 T 260 24"
                  stroke="#818cf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="24" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                <circle cx="120" cy="18" r="4" fill="#a5b4fc" />
                <circle cx="200" cy="24" r="4" fill="#a5b4fc" />
                <circle cx="260" cy="24" r="8" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                <circle cx="390" cy="24" r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Main Gate (Dep 07:45)</span>
              <span className="text-indigo-300 font-medium">Bus CC-04 • Stop 3 (Next)</span>
              <span>Hostel Block 4</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} Captain Campus Transportation Systems. Authorized personnel only.
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="w-full lg:w-[480px] xl:w-[540px] bg-white dark:bg-slate-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-center shadow-2xl">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Sign In to Command Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter your administrator credentials to access fleet oversight.
            </p>
          </div>

          {displayError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-sm animate-fadeIn">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{displayError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
              >
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@campus.edu"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">Remember session</span>
              </label>

              <span className="text-xs text-slate-400 italic">
                Protected system
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full py-3"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Admin Notice */}
          <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
              Restricted Area
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This terminal is configured exclusively for Campus Transportation Administrators and Supervisors. Student and driver accounts cannot log into this portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
