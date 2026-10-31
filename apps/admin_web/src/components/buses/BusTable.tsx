import React, { useState, useMemo } from 'react';
import { Search, Pencil, Ban, Bus as BusIcon } from 'lucide-react';
import type { Bus } from '@captain-campus/shared_types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

export interface BusTableProps {
  buses: Bus[];
  isLoading: boolean;
  onEdit: (bus: Bus) => void;
  onDeactivate: (bus: Bus) => void;
}

export const BusTable: React.FC<BusTableProps> = ({
  buses,
  isLoading,
  onEdit,
  onDeactivate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBuses = useMemo(() => {
    if (!searchQuery.trim()) return buses;
    const q = searchQuery.toLowerCase().trim();
    return buses.filter(
      (bus) =>
        bus.busNumber.toLowerCase().includes(q) ||
        bus.registrationNumber.toLowerCase().includes(q) ||
        (bus.make && bus.make.toLowerCase().includes(q))
    );
  }, [buses, searchQuery]);

  const getStatusBadge = (status: Bus['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" withDot>Active</Badge>;
      case 'maintenance':
        return <Badge variant="warning" withDot>Maintenance</Badge>;
      case 'inactive':
        return <Badge variant="neutral" withDot>Inactive</Badge>;
      case 'decommissioned':
        return <Badge variant="danger" withDot>Decommissioned</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by bus no. or registration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 self-center">
          Showing {filteredBuses.length} of {buses.length} buses
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Bus No.</th>
                <th className="py-3.5 px-4">Registration</th>
                <th className="py-3.5 px-4">Capacity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 text-center">
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredBuses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4">
                    <EmptyState
                      icon={<BusIcon className="w-10 h-10 text-slate-400" />}
                      title={searchQuery ? 'No matching buses found' : 'No buses registered'}
                      description={
                        searchQuery
                          ? 'Try adjusting your search query or clear the filter.'
                          : 'Get started by adding your first shuttle bus to the fleet.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredBuses.map((bus, index) => (
                  <tr
                    key={bus.busId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <td className="py-4 px-4 text-center text-xs text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          <BusIcon className="w-4 h-4" />
                        </div>
                        <span>{bus.busNumber}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {bus.registrationNumber}
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">{bus.capacity}</span>{' '}
                      <span className="text-xs text-slate-400">seats</span>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(bus.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(bus)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                          title="Edit Bus"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeactivate(bus)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                          title="Deactivate Bus"
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
    </div>
  );
};
