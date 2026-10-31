import React, { useState, useMemo } from 'react';
import {
  Route as RouteIcon,
  Plus,
  Pencil,
  Ban,
  Search,
  ChevronDown,
  ChevronRight,
  MapPin,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { Route, RouteDirection, RouteStatus } from '@captain-campus/shared_types';
import { useRoutes, useCreateRoute, useUpdateRoute, useDeactivateRoute } from '@/hooks/useRoutes';
import { useStops } from '@/hooks/useStops';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const PRESET_COLORS = [
  '#4f46e5', // indigo
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // rose/red
  '#7c3aed', // purple
];

interface RouteFormModalProps {
  isOpen: boolean;
  route?: Route | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RouteFormModal: React.FC<RouteFormModalProps> = ({
  isOpen,
  route,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(route);
  const createMutation = useCreateRoute();
  const updateMutation = useUpdateRoute();

  const [routeCode, setRouteCode] = useState('');
  const [routeName, setRouteName] = useState('');
  const [direction, setDirection] = useState<RouteDirection>('outbound');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [status, setStatus] = useState<RouteStatus>('active');
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    if (route) {
      setRouteCode(route.routeCode || '');
      setRouteName(route.routeName || '');
      setDirection(route.direction || 'outbound');
      setDescription(route.description || '');
      setColor(route.color || PRESET_COLORS[0]);
      setStatus(route.status || 'active');
    } else {
      setRouteCode('');
      setRouteName('');
      setDirection('outbound');
      setDescription('');
      setColor(PRESET_COLORS[0]);
      setStatus('active');
    }
    setFormError(null);
  }, [route, isOpen]);

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedCode = routeCode.trim().toUpperCase();
    const trimmedName = routeName.trim();

    if (!trimmedCode) {
      setFormError('Route Code is required.');
      return;
    }
    if (!trimmedName) {
      setFormError('Route Name is required.');
      return;
    }

    const payload: Partial<Route> = {
      routeCode: trimmedCode,
      routeName: trimmedName,
      direction,
      description: description.trim() || undefined,
      color,
      status,
      stopSequence: route?.stopSequence || [],
      operatingDays: route?.operatingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      originStopId: route?.originStopId || '',
      destinationStopId: route?.destinationStopId || '',
    };

    try {
      if (isEdit && route) {
        await updateMutation.mutateAsync({ routeId: route.routeId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving the route.';
      setFormError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-scaleUp">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? `Edit Route: ${route?.routeName}` : 'Add New Route'}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
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
                Route Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. R1"
                value={routeCode}
                onChange={(e) => setRouteCode(e.target.value)}
                className="w-full px-3 py-2 text-sm uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Direction <span className="text-rose-500">*</span>
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as RouteDirection)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
                <option value="circular">Circular</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Route Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. North Campus Express"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Route details and stops overview..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Route Display Color
            </label>
            <div className="flex items-center gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-white ring-2 ring-indigo-500' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RouteStatus)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />}
              {isEdit ? 'Save Changes' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RoutesPage: React.FC = () => {
  const { data: routes = [], isLoading, refetch } = useRoutes();
  const { data: stops = [] } = useStops();
  const deactivateMutation = useDeactivateRoute();
  const { showSuccess, showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRouteIds, setExpandedRouteIds] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [routeToDeactivate, setRouteToDeactivate] = useState<Route | null>(null);

  const stopMap = useMemo(() => new Map(stops.map((s) => [s.stopId, s])), [stops]);

  // Compute stats
  const stats = useMemo(() => {
    const total = routes.length;
    const active = routes.filter((r) => r.status === 'active').length;
    const suspended = routes.filter((r) => r.status === 'suspended').length;
    const inactive = routes.filter((r) => r.status === 'inactive').length;
    return { total, active, suspended, inactive };
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const q = searchQuery.toLowerCase().trim();
    return routes.filter(
      (r) =>
        r.routeCode.toLowerCase().includes(q) ||
        r.routeName.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [routes, searchQuery]);

  const toggleExpand = (routeId: string) => {
    setExpandedRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  };

  const handleOpenAdd = () => {
    setSelectedRoute(null);
    setIsModalOpen(true);
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  const handlePromptDeactivate = (route: Route) => {
    setRouteToDeactivate(route);
    setIsConfirmOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!routeToDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(routeToDeactivate.routeId);
      showSuccess(`Route "${routeToDeactivate.routeName}" deactivated.`);
      setIsConfirmOpen(false);
      setRouteToDeactivate(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate route.';
      showError(msg);
    }
  };

  const getStatusBadge = (status: Route['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" withDot>Active</Badge>;
      case 'suspended':
        return <Badge variant="warning" withDot>Suspended</Badge>;
      case 'inactive':
        return <Badge variant="neutral" withDot>Inactive</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getDirectionBadge = (dir: RouteDirection) => {
    switch (dir) {
      case 'inbound':
        return <Badge variant="info">Inbound</Badge>;
      case 'outbound':
        return <Badge variant="neutral">Outbound</Badge>;
      case 'circular':
        return <Badge variant="warning">Circular</Badge>;
      default:
        return <Badge variant="neutral">{dir}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transit Routes Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Establish and organize campus shuttle routes, stop orders, and schedules.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Add Route
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Routes"
          value={stats.total}
          icon={<RouteIcon className="w-5 h-5" />}
          color="indigo"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Routes"
          value={stats.active}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="Suspended Routes"
          value={stats.suspended}
          icon={<RouteIcon className="w-5 h-5" />}
          color="amber"
          isLoading={isLoading}
        />
        <StatCard
          title="Inactive Routes"
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
            placeholder="Search routes by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 self-center">
          Showing {filteredRoutes.length} of {routes.length} routes
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4 w-10"></th>
                <th className="py-3.5 px-4">Route Code</th>
                <th className="py-3.5 px-4">Route Name</th>
                <th className="py-3.5 px-4">Direction</th>
                <th className="py-3.5 px-4">Stop Count</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4">
                    <EmptyState
                      icon={<RouteIcon className="w-10 h-10 text-slate-400" />}
                      title={searchQuery ? 'No matching routes found' : 'No routes established'}
                      description="Create campus shuttle routes and define their stops."
                    />
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route) => {
                  const isExpanded = expandedRouteIds.has(route.routeId);
                  const stopCount = route.stopSequence?.length || 0;

                  return (
                    <React.Fragment key={route.routeId}>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors text-slate-700 dark:text-slate-200">
                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpand(route.routeId)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                            aria-label={isExpanded ? 'Collapse stops' : 'Expand stops'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: route.color || '#4f46e5' }}
                            />
                            <span>{route.routeCode}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-900 dark:text-white">
                          <div>{route.routeName}</div>
                          {route.description && (
                            <div className="text-xs text-slate-400 font-normal truncate max-w-xs">
                              {route.description}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {getDirectionBadge(route.direction)}
                        </td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">{stopCount}</span> stops
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(route.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(route)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                              title="Edit Route"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePromptDeactivate(route)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                              title="Deactivate Route"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Stops Sequence Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 dark:bg-slate-900/40">
                          <td colSpan={7} className="p-4 pl-12 border-b border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                Stop Sequence ({stopCount})
                              </h4>
                              {stopCount === 0 ? (
                                <p className="text-xs text-slate-400 italic">
                                  No stops configured for this route yet.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                                  {[...route.stopSequence]
                                    .sort((a, b) => a.sequence - b.sequence)
                                    .map((entry) => {
                                      const stop = stopMap.get(entry.stopId);
                                      return (
                                        <div
                                          key={entry.stopId}
                                          className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs shadow-2xs"
                                        >
                                          <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                                            {entry.sequence}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                              {stop?.name || `Stop: ${entry.stopId}`}
                                            </div>
                                            {entry.scheduledOffset !== undefined && (
                                              <div className="text-[10px] text-slate-400">
                                                +{entry.scheduledOffset} mins
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Form Modal */}
      <RouteFormModal
        isOpen={isModalOpen}
        route={selectedRoute}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          showSuccess(selectedRoute ? 'Route updated successfully.' : 'New route established successfully.');
          refetch();
        }}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={`Deactivate Route "${routeToDeactivate?.routeName}"?`}
        message={`Are you sure you want to deactivate route [${routeToDeactivate?.routeCode}] "${routeToDeactivate?.routeName}"? Trips mapped to this route will be affected.`}
        confirmLabel="Deactivate Route"
        variant="danger"
        isLoading={deactivateMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => {
          setIsConfirmOpen(false);
          setRouteToDeactivate(null);
        }}
      />
    </div>
  );
};
export default RoutesPage;
