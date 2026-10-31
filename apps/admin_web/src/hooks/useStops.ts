import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Stop, ApiResponse } from '@captain-campus/shared_types';

const STOPS_KEY = ['stops'];

export function useStops() {
  return useQuery({
    queryKey: STOPS_KEY,
    queryFn: () => apiClient.get<ApiResponse<Stop[]>>('/stops').then((r) => r.data ?? []),
    staleTime: 30_000,
  });
}

export function useStop(stopId: string) {
  return useQuery({
    queryKey: [...STOPS_KEY, stopId],
    queryFn: () => apiClient.get<ApiResponse<Stop>>(`/stops/${stopId}`).then((r) => r.data),
    enabled: !!stopId,
  });
}

export function useCreateStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Stop>) => apiClient.post<ApiResponse<Stop>>('/admin/stops', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOPS_KEY }),
  });
}

export function useUpdateStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stopId, data }: { stopId: string; data: Partial<Stop> }) =>
      apiClient.patch<ApiResponse<Stop>>(`/admin/stops/${stopId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOPS_KEY }),
  });
}

export function useDeactivateStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stopId: string) => apiClient.delete<ApiResponse<{ stopId: string }>>(`/admin/stops/${stopId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: STOPS_KEY }),
  });
}
