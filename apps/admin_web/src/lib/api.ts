export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.warn('Could not attach auth token to request:', error);
  }

  return headers;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  const authHeaders = await getAuthHeaders();

  const mergedHeaders = {
    ...authHeaders,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    let errorData: unknown;
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
        errorMessage = String((errorData as { error: unknown }).error);
      } else if (typeof errorData === 'object' && errorData !== null && 'message' in errorData) {
        errorMessage = String((errorData as { message: unknown }).message);
      }
    } catch {
      // Body is not JSON
    }
    throw new ApiError(errorMessage, response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, headers?: Record<string, string>): Promise<T> =>
    request<T>(path, { method: 'GET', headers }),

  post: <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> =>
    request<T>(path, {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> =>
    request<T>(path, {
      method: 'PATCH',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, headers?: Record<string, string>): Promise<T> =>
    request<T>(path, { method: 'DELETE', headers }),
};
