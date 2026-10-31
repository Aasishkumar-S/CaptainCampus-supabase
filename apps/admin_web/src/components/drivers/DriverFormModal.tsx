import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import type { Driver, DriverStatus } from '@captain-campus/shared_types';
import { useCreateDriver, useUpdateDriver } from '@/hooks/useDrivers';

export interface DriverFormModalProps {
  isOpen: boolean;
  driver?: Driver | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DriverFormModal: React.FC<DriverFormModalProps> = ({
  isOpen,
  driver,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(driver);
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceExpiry, setLicenceExpiry] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<DriverStatus>('active');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (driver) {
      setName(driver.name || '');
      setPhone(driver.phone || '');
      setLicenceNumber(driver.licenceNumber || '');
      setLicenceExpiry(driver.licenceExpiry ? driver.licenceExpiry.substring(0, 10) : '');
      setEmployeeId(driver.employeeId || '');
      setStatus(driver.status || 'active');
    } else {
      setName('');
      setPhone('');
      setLicenceNumber('');
      setLicenceExpiry('');
      setEmployeeId('');
      setStatus('active');
    }
    setFormError(null);
  }, [driver, isOpen]);

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const trimmedLicence = licenceNumber.trim().toUpperCase();

    if (!trimmedName) {
      setFormError('Full Name is required.');
      return;
    }
    if (cleanPhone.length < 10) {
      setFormError('Valid 10-digit phone number is required.');
      return;
    }
    if (!trimmedLicence) {
      setFormError('Licence Number is required.');
      return;
    }
    if (!licenceExpiry) {
      setFormError('Licence Expiry date is required.');
      return;
    }

    const payload: Partial<Driver> = {
      name: trimmedName,
      phone: cleanPhone,
      licenceNumber: trimmedLicence,
      licenceExpiry: new Date(licenceExpiry).toISOString(),
      employeeId: employeeId.trim() || undefined,
      status,
    };

    try {
      if (isEdit && driver) {
        await updateMutation.mutateAsync({ driverId: driver.driverId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving the driver.';
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
            {isEdit ? `Edit Driver: ${driver?.name}` : 'Register New Driver'}
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
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Chandra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (10 digits) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Licence Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="DL-0420110012345"
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Licence Expiry <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={licenceExpiry}
                onChange={(e) => setLicenceExpiry(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID (optional)
              </label>
              <input
                type="text"
                placeholder="EMP-8021"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DriverStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
              </select>
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
              {isEdit ? 'Save Changes' : 'Register Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
