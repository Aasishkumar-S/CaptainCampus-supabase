import React, { useState, useMemo } from 'react';
import { MapPin, Plus, Pencil, Ban, Search, CheckCircle } from 'lucide-react';
import type { Stop } from '@captain-campus/shared_types';
import { useStops, useDeactivateStop } from '@/hooks/useStops';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StopFormModal } from '@/components/stops/StopFormModal';

export const StopsPage: React.FC = () => {
  const { data: stops = [], isLoading, refetch } = useStops();
  const deactivateMutation = useDeactivateStop();
  const { showSuccess, showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [stopToDeactivate, setStopToDeactivate] = useState<Stop | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    const total = stops.length;
    const active = stops.filter((s) => s.status === 'active').length;
    const temporary = stops.filter((s) => s.status === 'temporary').length;
    const inactive = stops.filter((s) => s.status === 'inactive').length;
    return { total, active, temporary, inactive };
  }, [stops]);

  const filteredStops = useMemo(() => {
    if (!searchQuery.trim()) return stops;
    const q = searchQuery.toLowerCase().trim();
    return stops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.shortName && s.shortName.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
    );
  }, [stops, searchQuery]);

  const handleOpenAdd = () => {
    setSelectedStop(null);
    setIsModalOpen(true);
  };

  const handleEdit = (stop: Stop) => {
    setSelectedStop(stop);
    setIsModalOpen(true);
  };

  const handlePromptDeactivate = (stop: Stop) => {
    setStopToDeactivate(stop);
    setIsConfirmOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!stopToDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(stopToDeactivate.stopId);
      showSuccess(`Stop "${stopToDeactivate.name}" deactivated successfully.`);
      setIsConfirmOpen(false);
      setStopToDeactivate(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate stop.';
      showError(msg);
    }
  };

  const getStatusBadge = (status: Stop['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" withDot>Active</Badge>;
      case 'temporary':
        return <Badge variant="warning" withDot>Temporary</Badge>;
      case 'inactive':
        return <Badge variant="neutral" withDot>Inactive</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bus Stops Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure campus shuttle boarding stations, GPS coordinates, and arrival zones.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Add Stop
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Bus Stops"
          value={stats.total}
          icon={<MapPin className="w-5 h-5" />}
          color="indigo"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Stops"
          value={stats.active}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="Temporary Stops"
          value={stats.temporary}
          icon={<MapPin className="w-5 h-5" />}
          color="amber"
          isLoading={isLoading}
        />
        <StatCard
          title="Inactive Stops"
          value={stats.inactive}
          icon={<Ban className="w-5 h-5" />}
          color="rose"
          isLoading={isLoading}
        />
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search stops by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 self-center">
          Showing {filteredStops.length} of {stops.length} stops
        </div>
      </div>

      {/* Stops Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Stop Name</th>
                <th className="py-3.5 px-4">Coordinates (Lat, Lng)</th>
                <th className="py-3.5 px-4">Address / Landmark</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredStops.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4">
                    <EmptyState
                      icon={<MapPin className="w-10 h-10 text-slate-400" />}
                      title={searchQuery ? 'No matching stops found' : 'No bus stops registered'}
                      description="Create bus stops along transit routes for passengers to track arrival ETAs."
                    />
                  </td>
                </tr>
              ) : (
                filteredStops.map((stop) => (
                  <tr
                    key={stop.stopId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div>{stop.name}</div>
                          {stop.shortName && (
                            <div className="text-[11px] font-mono text-slate-400 font-normal">
                              Code: {stop.shortName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {typeof stop.latitude === 'number' && typeof stop.longitude === 'number'
                        ? `${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}`
                        : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 text-xs">
                      {stop.address || '—'}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(stop.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(stop)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                          title="Edit Stop"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePromptDeactivate(stop)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                          title="Deactivate Stop"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stop Form Modal */}
      <StopFormModal
        isOpen={isModalOpen}
        stop={selectedStop}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          showSuccess(selectedStop ? 'Stop updated successfully.' : 'New stop created successfully.');
          refetch();
        }}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={`Deactivate Stop "${stopToDeactivate?.name}"?`}
        message={`Are you sure you want to deactivate bus stop "${stopToDeactivate?.name}"? It will no longer receive ETA estimations.`}
        confirmLabel="Deactivate Stop"
        variant="danger"
        isLoading={deactivateMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => {
          setIsConfirmOpen(false);
          setStopToDeactivate(null);
        }}
      />
    </div>
  );
};
export default StopsPage;
