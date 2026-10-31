import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { ApiResponse } from '@captain-campus/shared_types';

export interface AuditLogEntry {
  id?: string;
  logId?: string;
  action: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  details?: Record<string, unknown> | string;
  timestamp: string | number;
}

export interface AnnouncementEntry {
  id?: string;
  announcementId?: string;
  title: string;
  message?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt?: string;
  channels?: string[];
}

export interface DashboardStats {
  totalBuses: number;
  activeBuses: number;
  inactiveBuses: number;
  maintenanceBuses: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRoutes: number;
  activeRoutes: number;
  activeTrips: number;
  scheduledTrips: number;
  delayedTrips: number;
  gpsDevicesTotal: number;
  gpsDevicesOnline: number;
  gpsDevicesStale: number;
  totalStops: number;
  recentAuditLogs: AuditLogEntry[];
  recentAnnouncements: AnnouncementEntry[];
  generatedAt: string;
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard').then((r) => r.data),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
