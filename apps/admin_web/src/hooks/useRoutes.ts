import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Route, ApiResponse } from '@captain-campus/shared_types';

const ROUTES_KEY = ['routes'];

export function useRoutes() {
  return useQuery({
    queryKey: ROUTES_KEY,
    queryFn: () => apiClient.get<ApiResponse<Route[]>>('/routes').then((r) => r.data ?? []),
    staleTime: 30_000,
  });
}

export function useRoute(routeId: string) {
  return useQuery({
    queryKey: [...ROUTES_KEY, routeId],
    queryFn: () => apiClient.get<ApiResponse<Route>>(`/routes/${routeId}`).then((r) => r.data),
    enabled: !!routeId,
  });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Route>) => apiClient.post<ApiResponse<Route>>('/admin/routes', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROUTES_KEY }),
  });
}

export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Partial<Route> }) =>
      apiClient.patch<ApiResponse<Route>>(`/admin/routes/${routeId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROUTES_KEY }),
  });
}

export function useDeactivateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => apiClient.delete<ApiResponse<{ routeId: string }>>(`/admin/routes/${routeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROUTES_KEY }),
  });
}
