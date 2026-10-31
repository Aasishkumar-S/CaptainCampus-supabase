import React, { useState, useMemo } from 'react';
import { UserCheck, Plus, CheckCircle, Clock, Ban } from 'lucide-react';
import type { Driver } from '@captain-campus/shared_types';
import { useDrivers, useDeactivateDriver } from '@/hooks/useDrivers';
import { useToast } from '@/components/ui/Toast';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { DriverTable } from '@/components/drivers/DriverTable';
import { DriverFormModal } from '@/components/drivers/DriverFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const DriversPage: React.FC = () => {
  const { data: drivers = [], isLoading, refetch } = useDrivers();
  const deactivateMutation = useDeactivateDriver();
  const { showSuccess, showError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [driverToDeactivate, setDriverToDeactivate] = useState<Driver | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    const total = drivers.length;
    const active = drivers.filter((d) => d.status === 'active').length;
    const onLeave = drivers.filter((d) => d.status === 'on_leave').length;
    const inactive = drivers.filter((d) => d.status === 'inactive' || d.status === 'suspended').length;
    return { total, active, onLeave, inactive };
  }, [drivers]);

  const handleOpenAdd = () => {
    setSelectedDriver(null);
    setIsModalOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const handlePromptDeactivate = (driver: Driver) => {
    setDriverToDeactivate(driver);
    setIsConfirmOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!driverToDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(driverToDeactivate.driverId);
      showSuccess(`Driver "${driverToDeactivate.name}" deactivated successfully.`);
      setIsConfirmOpen(false);
      setDriverToDeactivate(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate driver.';
      showError(msg);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Driver Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain driver credentials, licenses, active assignments, and contact records.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Add Driver
        </Button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Drivers"
          value={stats.total}
          icon={<UserCheck className="w-5 h-5" />}
          color="indigo"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Drivers"
          value={stats.active}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="On Leave"
          value={stats.onLeave}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          isLoading={isLoading}
        />
        <StatCard
          title="Inactive / Suspended"
          value={stats.inactive}
          icon={<Ban className="w-5 h-5" />}
          color="rose"
          isLoading={isLoading}
        />
      </div>

      {/* Drivers Table */}
      <DriverTable
        drivers={drivers}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDeactivate={handlePromptDeactivate}
      />

      {/* Driver Form Modal */}
      <DriverFormModal
        isOpen={isModalOpen}
        driver={selectedDriver}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          showSuccess(selectedDriver ? 'Driver updated successfully.' : 'New driver registered successfully.');
          refetch();
        }}
      />

      {/* Confirm Deactivation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={`Deactivate Driver "${driverToDeactivate?.name}"?`}
        message={`Are you sure you want to deactivate driver "${driverToDeactivate?.name}" (Licence: ${driverToDeactivate?.licenceNumber})? They will be unassigned from any bus schedule.`}
        confirmLabel="Deactivate Driver"
        variant="danger"
        isLoading={deactivateMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => {
          setIsConfirmOpen(false);
          setDriverToDeactivate(null);
        }}
      />
    </div>
  );
};
export default DriversPage;
