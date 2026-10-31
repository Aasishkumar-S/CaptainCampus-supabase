import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Driver, ApiResponse } from '@captain-campus/shared_types';

const DRIVERS_KEY = ['drivers'];

export function useDrivers() {
  return useQuery({
    queryKey: DRIVERS_KEY,
    queryFn: () => apiClient.get<ApiResponse<Driver[]>>('/admin/drivers').then((r) => r.data ?? []),
    staleTime: 30_000,
  });
}

export function useDriver(driverId: string) {
  return useQuery({
    queryKey: [...DRIVERS_KEY, driverId],
    queryFn: () => apiClient.get<ApiResponse<Driver>>(`/admin/drivers/${driverId}`).then((r) => r.data),
    enabled: !!driverId,
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Driver>) => apiClient.post<ApiResponse<Driver>>('/admin/drivers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DRIVERS_KEY }),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, data }: { driverId: string; data: Partial<Driver> }) =>
      apiClient.patch<ApiResponse<Driver>>(`/admin/drivers/${driverId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DRIVERS_KEY }),
  });
}

export function useDeactivateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) => apiClient.delete<ApiResponse<{ driverId: string }>>(`/admin/drivers/${driverId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: DRIVERS_KEY }),
  });
}

export function useAssignDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, busId }: { driverId: string; busId: string }) =>
      apiClient.post<ApiResponse<Driver>>(`/admin/drivers/${driverId}/assign`, { busId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DRIVERS_KEY });
      qc.invalidateQueries({ queryKey: ['buses'] });
    },
  });
}

export function useUnassignDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) =>
      apiClient.post<ApiResponse<Driver>>(`/admin/drivers/${driverId}/unassign`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DRIVERS_KEY });
      qc.invalidateQueries({ queryKey: ['buses'] });
    },
  });
}
