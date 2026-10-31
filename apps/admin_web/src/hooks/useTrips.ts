import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Trip, TripSummary, ApiResponse } from '@captain-campus/shared_types';

export interface TripFilters {
  status?: string;
  routeId?: string;
  busId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
}

const TRIPS_KEY = ['trips'];

export function useTrips(filters?: TripFilters) {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, String(value));
      }
    });
  }
  const queryString = queryParams.toString();
  const path = queryString ? `/admin/trips?${queryString}` : '/admin/trips';

  return useQuery({
    queryKey: [...TRIPS_KEY, filters || {}],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Trip[] | { items: Trip[] } | TripSummary[]>>(path);
      if (Array.isArray(res.data)) {
        return res.data as Trip[];
      }
      if (res.data && typeof res.data === 'object' && 'items' in res.data) {
        return (res.data as { items: Trip[] }).items;
      }
      return [] as Trip[];
    },
    staleTime: 15_000,
  });
}

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: [...TRIPS_KEY, tripId],
    queryFn: () => apiClient.get<ApiResponse<Trip>>(`/admin/trips/${tripId}`).then((r) => r.data),
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Trip>) => apiClient.post<ApiResponse<Trip>>('/admin/trips', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRIPS_KEY });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useStartTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => apiClient.patch<ApiResponse<Trip>>(`/admin/trips/${tripId}/start`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRIPS_KEY });
      qc.invalidateQueries({ queryKey: ['buses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useEndTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => apiClient.patch<ApiResponse<Trip>>(`/admin/trips/${tripId}/end`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRIPS_KEY });
      qc.invalidateQueries({ queryKey: ['buses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCancelTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, reason }: { tripId: string; reason?: string }) =>
      apiClient.patch<ApiResponse<Trip>>(`/admin/trips/${tripId}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRIPS_KEY });
      qc.invalidateQueries({ queryKey: ['buses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDelayTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, delayMinutes, reason }: { tripId: string; delayMinutes: number; reason?: string }) =>
      apiClient.patch<ApiResponse<Trip>>(`/admin/trips/${tripId}/delay`, { delayMinutes, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRIPS_KEY });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
