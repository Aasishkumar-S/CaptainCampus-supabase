import { ApiResponse, ApiError, PaginatedResponse } from '@captain-campus/shared_types';

/**
 * Wraps success data into standardized ApiResponse format
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates standardized paginated response format
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);
  return {
    items: data,
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}
