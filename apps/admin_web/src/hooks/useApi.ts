import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function useApiQuery<T>(
  queryKey: string[],
  path: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T>({
    queryKey,
    queryFn: () => apiClient.get<T>(path),
    ...options,
  });
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    ...options,
  });
}

export { useQueryClient };
