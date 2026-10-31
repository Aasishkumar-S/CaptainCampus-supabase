import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import type { Stop, StopStatus } from '@captain-campus/shared_types';
import { useCreateStop, useUpdateStop } from '@/hooks/useStops';

export interface StopFormModalProps {
  isOpen: boolean;
  stop?: Stop | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const StopFormModal: React.FC<StopFormModalProps> = ({
  isOpen,
  stop,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(stop);
  const createMutation = useCreateStop();
  const updateMutation = useUpdateStop();

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<StopStatus>('active');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (stop) {
      setName(stop.name || '');
      setShortName(stop.shortName || '');
      setLatitude(stop.latitude !== undefined ? String(stop.latitude) : '');
      setLongitude(stop.longitude !== undefined ? String(stop.longitude) : '');
      setAddress(stop.address || '');
      setStatus(stop.status || 'active');
    } else {
      setName('');
      setShortName('');
      setLatitude('');
      setLongitude('');
      setAddress('');
      setStatus('active');
    }
    setFormError(null);
  }, [stop, isOpen]);

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (!trimmedName) {
      setFormError('Stop Name is required.');
      return;
    }
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setFormError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setFormError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    const payload: Partial<Stop> = {
      name: trimmedName,
      shortName: shortName.trim() || undefined,
      latitude: latNum,
      longitude: lngNum,
      address: address.trim() || undefined,
      status,
    };

    try {
      if (isEdit && stop) {
        await updateMutation.mutateAsync({ stopId: stop.stopId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving the stop.';
      setFormError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-scaleUp"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? `Edit Stop: ${stop?.name}` : 'Add New Bus Stop'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stop Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Main Gate Terminal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Short Name (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. MG-01"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Latitude (-90 to 90) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="12.9716"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Longitude (-180 to 180) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="77.5946"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Address / Landmark
            </label>
            <input
              type="text"
              placeholder="e.g. Near Science Block & Library Lawn"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StopStatus)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="temporary">Temporary</option>
            </select>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />}
              {isEdit ? 'Save Changes' : 'Create Stop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
