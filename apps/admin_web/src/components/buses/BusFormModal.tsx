import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import type { Bus, BusStatus } from '@captain-campus/shared_types';
import { useCreateBus, useUpdateBus } from '@/hooks/useBuses';

export interface BusFormModalProps {
  isOpen: boolean;
  bus?: Bus | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const BusFormModal: React.FC<BusFormModalProps> = ({
  isOpen,
  bus,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(bus);
  const createMutation = useCreateBus();
  const updateMutation = useUpdateBus();

  const [busNumber, setBusNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [capacity, setCapacity] = useState<number>(40);
  const [status, setStatus] = useState<BusStatus>('active');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (bus) {
      setBusNumber(bus.busNumber || '');
      setRegistrationNumber(bus.registrationNumber || '');
      setCapacity(bus.capacity || 40);
      setStatus(bus.status || 'active');
      setMake(bus.make || '');
      setModel(bus.model || '');
      setYear(bus.year ? String(bus.year) : '');
    } else {
      setBusNumber('');
      setRegistrationNumber('');
      setCapacity(40);
      setStatus('active');
      setMake('');
      setModel('');
      setYear('');
    }
    setFormError(null);
  }, [bus, isOpen]);

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedBusNo = busNumber.trim();
    const trimmedRegNo = registrationNumber.trim().toUpperCase();

    if (!trimmedBusNo) {
      setFormError('Bus Number is required.');
      return;
    }
    if (!trimmedRegNo) {
      setFormError('Registration Number is required.');
      return;
    }
    if (!capacity || capacity < 1 || capacity > 100) {
      setFormError('Capacity must be between 1 and 100.');
      return;
    }

    const payload: Partial<Bus> = {
      busNumber: trimmedBusNo,
      registrationNumber: trimmedRegNo,
      capacity: Number(capacity),
      status,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      year: year ? parseInt(year, 10) : undefined,
    };

    try {
      if (isEdit && bus) {
        await updateMutation.mutateAsync({ busId: bus.busId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving the bus.';
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
            {isEdit ? `Edit Bus ${bus?.busNumber}` : 'Add New Bus'}
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
                Bus Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BUS-01"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registration Plate <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. KA01AB1234"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                onBlur={() => setRegistrationNumber((prev) => prev.toUpperCase())}
                className="w-full px-3 py-2 text-sm uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Passenger Capacity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BusStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Make
              </label>
              <input
                type="text"
                placeholder="e.g. Tata"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Model
              </label>
              <input
                type="text"
                placeholder="e.g. Starbus"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Year
              </label>
              <input
                type="number"
                placeholder="2023"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
              {isEdit ? 'Save Changes' : 'Create Bus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
