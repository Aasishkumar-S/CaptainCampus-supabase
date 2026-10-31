import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Bus, ApiResponse } from '@captain-campus/shared_types';

const BUSES_KEY = ['buses'];

export function useBuses() {
  return useQuery({
    queryKey: BUSES_KEY,
    queryFn: () => apiClient.get<ApiResponse<Bus[]>>('/buses').then((r) => r.data ?? []),
    staleTime: 30_000,
  });
}

export function useBus(busId: string) {
  return useQuery({
    queryKey: [...BUSES_KEY, busId],
    queryFn: () => apiClient.get<ApiResponse<Bus>>(`/buses/${busId}`).then((r) => r.data),
    enabled: !!busId,
  });
}

export function useCreateBus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Bus>) => apiClient.post<ApiResponse<Bus>>('/admin/buses', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUSES_KEY }),
  });
}

export function useUpdateBus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ busId, data }: { busId: string; data: Partial<Bus> }) =>
      apiClient.patch<ApiResponse<Bus>>(`/admin/buses/${busId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUSES_KEY }),
  });
}

export function useDeactivateBus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (busId: string) => apiClient.delete<ApiResponse<{ busId: string }>>(`/admin/buses/${busId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUSES_KEY }),
  });
}
