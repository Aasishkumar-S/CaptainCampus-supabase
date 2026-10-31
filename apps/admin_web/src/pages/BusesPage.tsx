import React, { useState, useMemo } from 'react';
import { Bus as BusIcon, Plus, CheckCircle, Wrench, Ban } from 'lucide-react';
import type { Bus } from '@captain-campus/shared_types';
import { useBuses, useDeactivateBus } from '@/hooks/useBuses';
import { useToast } from '@/components/ui/Toast';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { BusTable } from '@/components/buses/BusTable';
import { BusFormModal } from '@/components/buses/BusFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export const BusesPage: React.FC = () => {
  const { data: buses = [], isLoading, refetch } = useBuses();
  const deactivateMutation = useDeactivateBus();
  const { showSuccess, showError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [busToDeactivate, setBusToDeactivate] = useState<Bus | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    const total = buses.length;
    const active = buses.filter((b) => b.status === 'active').length;
    const maintenance = buses.filter((b) => b.status === 'maintenance').length;
    const inactive = buses.filter((b) => b.status === 'inactive' || b.status === 'decommissioned').length;
    return { total, active, maintenance, inactive };
  }, [buses]);

  const handleOpenAdd = () => {
    setSelectedBus(null);
    setIsModalOpen(true);
  };

  const handleEdit = (bus: Bus) => {
    setSelectedBus(bus);
    setIsModalOpen(true);
  };

  const handlePromptDeactivate = (bus: Bus) => {
    setBusToDeactivate(bus);
    setIsConfirmOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!busToDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(busToDeactivate.busId);
      showSuccess(`Bus ${busToDeactivate.busNumber} deactivated successfully.`);
      setIsConfirmOpen(false);
      setBusToDeactivate(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate bus.';
      showError(msg);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bus Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register, configure, and monitor campus shuttle fleet vehicles.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Add Bus
        </Button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Buses"
          value={stats.total}
          icon={<BusIcon className="w-5 h-5" />}
          color="indigo"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Buses"
          value={stats.active}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="In Maintenance"
          value={stats.maintenance}
          icon={<Wrench className="w-5 h-5" />}
          color="amber"
          isLoading={isLoading}
        />
        <StatCard
          title="Inactive / Decommissioned"
          value={stats.inactive}
          icon={<Ban className="w-5 h-5" />}
          color="rose"
          isLoading={isLoading}
        />
      </div>

      {/* Bus Table */}
      <BusTable
        buses={buses}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDeactivate={handlePromptDeactivate}
      />

      {/* Create / Edit Modal */}
      <BusFormModal
        isOpen={isModalOpen}
        bus={selectedBus}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          showSuccess(selectedBus ? 'Bus updated successfully.' : 'New bus registered successfully.');
          refetch();
        }}
      />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={`Deactivate Bus ${busToDeactivate?.busNumber}?`}
        message={`Are you sure you want to deactivate bus "${busToDeactivate?.busNumber}" (${busToDeactivate?.registrationNumber})? This will unassign any active trips and remove it from active dispatch.`}
        confirmLabel="Deactivate Bus"
        variant="danger"
        isLoading={deactivateMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => {
          setIsConfirmOpen(false);
          setBusToDeactivate(null);
        }}
      />
    </div>
  );
};
export default BusesPage;
