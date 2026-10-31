import React, { useState, useMemo } from 'react';
import { Search, Pencil, Ban, User, Phone, AlertTriangle } from 'lucide-react';
import type { Driver } from '@captain-campus/shared_types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

export interface DriverTableProps {
  drivers: Driver[];
  isLoading: boolean;
  onEdit: (driver: Driver) => void;
  onDeactivate: (driver: Driver) => void;
}

export const DriverTable: React.FC<DriverTableProps> = ({
  drivers,
  isLoading,
  onEdit,
  onDeactivate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return drivers;
    const q = searchQuery.toLowerCase().trim();
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.licenceNumber.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        (d.employeeId && d.employeeId.toLowerCase().includes(q))
    );
  }, [drivers, searchQuery]);

  const getStatusBadge = (status: Driver['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" withDot>Active</Badge>;
      case 'on_leave':
        return <Badge variant="warning" withDot>On Leave</Badge>;
      case 'suspended':
        return <Badge variant="danger" withDot>Suspended</Badge>;
      case 'inactive':
        return <Badge variant="neutral" withDot>Inactive</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const renderExpiry = (expiryDateStr: string) => {
    if (!expiryDateStr) return <span className="text-slate-400">N/A</span>;
    const expiryTime = new Date(expiryDateStr).getTime();
    const now = Date.now();
    const isExpired = expiryTime < now;
    const isNearExpiry = !isExpired && expiryTime - now < 30 * 24 * 60 * 60 * 1000; // 30 days

    const dateFormatted = new Date(expiryDateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          {dateFormatted} (Expired)
        </span>
      );
    }

    if (isNearExpiry) {
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          {dateFormatted} (Expiring)
        </span>
      );
    }

    return <span className="text-slate-600 dark:text-slate-300 text-xs">{dateFormatted}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by driver name, licence #, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 self-center">
          Showing {filteredDrivers.length} of {drivers.length} drivers
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Driver Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Licence #</th>
                <th className="py-3.5 px-4">Licence Expiry</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-20" />
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
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4">
                    <EmptyState
                      icon={<User className="w-10 h-10 text-slate-400" />}
                      title={searchQuery ? 'No matching drivers found' : 'No drivers registered'}
                      description={
                        searchQuery
                          ? 'Try adjusting your search keywords.'
                          : 'Register licensed drivers to assign them to campus routes.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr
                    key={driver.driverId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <div>{driver.name}</div>
                          {driver.employeeId && (
                            <div className="text-[11px] font-normal text-slate-400">
                              ID: {driver.employeeId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{driver.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {driver.licenceNumber}
                    </td>
                    <td className="py-4 px-4">
                      {renderExpiry(driver.licenceExpiry)}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(driver.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(driver)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                          title="Edit Driver"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeactivate(driver)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                          title="Deactivate Driver"
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
