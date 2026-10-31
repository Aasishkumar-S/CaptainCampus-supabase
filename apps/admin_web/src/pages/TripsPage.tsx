import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Plus,
  Play,
  Square,
  XCircle,
  Bus as BusIcon,
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type { Trip, TripStatus } from '@captain-campus/shared_types';
import { useTrips, useStartTrip, useEndTrip, useCancelTrip, useCreateTrip } from '@/hooks/useTrips';
import { useBuses } from '@/hooks/useBuses';
import { useDrivers } from '@/hooks/useDrivers';
import { useRoutes } from '@/hooks/useRoutes';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

export const TripsPage: React.FC = () => {
  const { data: trips = [], isLoading, refetch } = useTrips();
  const { data: buses = [] } = useBuses();
  const { data: drivers = [] } = useDrivers();
  const { data: routes = [] } = useRoutes();

  const startTripMutation = useStartTrip();
  const endTripMutation = useEndTrip();
  const cancelTripMutation = useCancelTrip();
  const createTripMutation = useCreateTrip();

  const { showSuccess, showError } = useToast();

  // Status Filter
  const [selectedFilter, setSelectedFilter] = useState<'all' | TripStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [tripToCancel, setTripToCancel] = useState<Trip | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Create Trip form state
  const [newBusId, setNewBusId] = useState('');
  const [newDriverId, setNewDriverId] = useState('');
  const [newRouteId, setNewRouteId] = useState('');
  const [newScheduledStart, setNewScheduledStart] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  // Maps for quick lookup
  const busMap = useMemo(() => new Map(buses.map((b) => [b.busId, b])), [buses]);
  const driverMap = useMemo(() => new Map(drivers.map((d) => [d.driverId, d])), [drivers]);
  const routeMap = useMemo(() => new Map(routes.map((r) => [r.routeId, r])), [routes]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (selectedFilter !== 'all' && t.status !== selectedFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const busNum = busMap.get(t.busId)?.busNumber.toLowerCase() || '';
        const driverName = driverMap.get(t.driverId)?.name.toLowerCase() || '';
        const routeName = routeMap.get(t.routeId)?.routeName.toLowerCase() || '';
        const routeCode = routeMap.get(t.routeId)?.routeCode.toLowerCase() || '';
        return (
          busNum.includes(q) ||
          driverName.includes(q) ||
          routeName.includes(q) ||
          routeCode.includes(q)
        );
      }
      return true;
    });
  }, [trips, selectedFilter, searchQuery, busMap, driverMap, routeMap]);

  const handleStart = async (tripId: string) => {
    try {
      await startTripMutation.mutateAsync(tripId);
      showSuccess('Trip started successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start trip.';
      showError(msg);
    }
  };

  const handleEnd = async (tripId: string) => {
    try {
      await endTripMutation.mutateAsync(tripId);
      showSuccess('Trip ended successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to end trip.';
      showError(msg);
    }
  };

  const handlePromptCancel = (trip: Trip) => {
    setTripToCancel(trip);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!tripToCancel) return;
    try {
      await cancelTripMutation.mutateAsync({
        tripId: tripToCancel.tripId,
        reason: cancelReason.trim() || undefined,
      });
      showSuccess('Trip cancelled successfully.');
      setIsCancelModalOpen(false);
      setTripToCancel(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel trip.';
      showError(msg);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);

    if (!newBusId) {
      setCreateFormError('Please select a bus.');
      return;
    }
    if (!newDriverId) {
      setCreateFormError('Please select a driver.');
      return;
    }
    if (!newRouteId) {
      setCreateFormError('Please select a route.');
      return;
    }
    if (!newScheduledStart) {
      setCreateFormError('Scheduled start time is required.');
      return;
    }

    try {
      await createTripMutation.mutateAsync({
        busId: newBusId,
        driverId: newDriverId,
        routeId: newRouteId,
        scheduledStart: new Date(newScheduledStart).toISOString(),
        notes: newNotes.trim() || undefined,
        status: 'scheduled',
      });
      showSuccess('Scheduled trip created successfully.');
      setIsCreateModalOpen(false);
      setNewBusId('');
      setNewDriverId('');
      setNewRouteId('');
      setNewScheduledStart('');
      setNewNotes('');
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create trip.';
      setCreateFormError(msg);
    }
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="success" withDot>In Progress</Badge>;
      case 'scheduled':
        return <Badge variant="info" withDot>Scheduled</Badge>;
      case 'completed':
        return <Badge variant="neutral" withDot>Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger" withDot>Cancelled</Badge>;
      case 'delayed':
        return <Badge variant="warning" withDot>Delayed</Badge>;
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
            Trip Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule departures, monitor running shuttles, and supervise timetable dispatches.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setCreateFormError(null);
            setIsCreateModalOpen(true);
          }}
        >
          Create Trip
        </Button>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          {(
            [
              { key: 'all', label: 'All Trips' },
              { key: 'in_progress', label: 'Active' },
              { key: 'scheduled', label: 'Scheduled' },
              { key: 'completed', label: 'Completed' },
              { key: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedFilter(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                selectedFilter === tab.key
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by bus, driver, route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Bus #</th>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-4">Driver</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Scheduled Start</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-20 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4">
                    <EmptyState
                      icon={<CalendarClock className="w-10 h-10 text-slate-400" />}
                      title={searchQuery || selectedFilter !== 'all' ? 'No matching trips found' : 'No trips recorded'}
                      description="Create and dispatch scheduled campus trips to see them listed here."
                    />
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const bus = busMap.get(trip.busId);
                  const driver = driverMap.get(trip.driverId);
                  const route = routeMap.get(trip.routeId);

                  const startFormatted = trip.scheduledStart
                    ? new Date(trip.scheduledStart).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A';

                  const isScheduled = trip.status === 'scheduled';
                  const isInProgress = trip.status === 'in_progress';

                  return (
                    <tr
                      key={trip.tripId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors text-slate-700 dark:text-slate-200"
                    >
                      <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <BusIcon className="w-4 h-4 text-indigo-500" />
                          <span>{bus?.busNumber || trip.busId}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {route?.routeName || trip.routeId}
                        </div>
                        {route?.routeCode && (
                          <div className="text-xs text-slate-400 font-mono">
                            {route.routeCode}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        {driver?.name || trip.driverId}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(trip.status)}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300 text-xs font-mono">
                        {startFormatted}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isScheduled && (
                            <button
                              type="button"
                              onClick={() => handleStart(trip.tripId)}
                              disabled={startTripMutation.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                              title="Start Trip"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Start
                            </button>
                          )}
                          {isInProgress && (
                            <button
                              type="button"
                              onClick={() => handleEnd(trip.tripId)}
                              disabled={endTripMutation.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                              title="End Trip"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                              End
                            </button>
                          )}
                          {(isScheduled || isInProgress) && (
                            <button
                              type="button"
                              onClick={() => handlePromptCancel(trip)}
                              disabled={cancelTripMutation.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 transition-colors"
                              title="Cancel Trip"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Trip Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !createTripMutation.isPending && setIsCreateModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Create Scheduled Trip
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createFormError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{createFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bus <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newBusId}
                  onChange={(e) => setNewBusId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select bus...</option>
                  {buses.map((b) => (
                    <option key={b.busId} value={b.busId}>
                      {b.busNumber} ({b.registrationNumber}) - {b.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Driver <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select driver...</option>
                  {drivers.map((d) => (
                    <option key={d.driverId} value={d.driverId}>
                      {d.name} ({d.phone}) - {d.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Route <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newRouteId}
                  onChange={(e) => setNewRouteId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select route...</option>
                  {routes.map((r) => (
                    <option key={r.routeId} value={r.routeId}>
                      [{r.routeCode}] {r.routeName} ({r.direction})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scheduled Start Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newScheduledStart}
                  onChange={(e) => setNewScheduledStart(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions or timetable comments..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createTripMutation.isPending}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTripMutation.isPending}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {createTripMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
                  )}
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Trip Modal with Reason */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !cancelTripMutation.isPending && setIsCancelModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cancel Trip
              </h3>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Are you sure you want to cancel this trip? Please provide an optional cancellation reason.
              </p>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cancellation Reason
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Mechanical breakdown, road maintenance..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={cancelTripMutation.isPending}
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelTripMutation.isPending}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
              >
                {cancelTripMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
                )}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TripsPage;
