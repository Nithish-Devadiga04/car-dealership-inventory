import { AuthResponse, User, Vehicle, VehicleFilters, VehicleInput } from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const TOKEN_KEY = 'dealership.token';

export interface FieldError {
  path: string;
  message: string;
}

/** Error carrying the HTTP status and any per-field validation details from the API. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode) – session just won't persist */
    }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** Fired when the API rejects our token so the UI can drop back to the login screen. */
export const AUTH_EXPIRED_EVENT = 'auth:expired';

interface RequestOptions {
  method?: string;
  body?: unknown;
  authenticated?: boolean;
}

async function request<T>(path: string, { method = 'GET', body, authenticated = true }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStorage.get();
  if (authenticated && token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(response.status, payload?.error?.message ?? 'Something went wrong', payload?.error?.details ?? []);
  }
  return payload as T;
}

const toQuery = (filters: VehicleFilters): string => {
  const params = new URLSearchParams();
  (Object.keys(filters) as Array<keyof VehicleFilters>).forEach((key) => {
    const value = filters[key].trim();
    if (value) params.set(key, value);
  });
  return params.toString();
};

export const api = {
  register: (input: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: input, authenticated: false }),
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: input, authenticated: false }),
  me: () => request<{ user: User }>('/api/auth/me'),

  listVehicles: () => request<Vehicle[]>('/api/vehicles'),
  searchVehicles: (filters: VehicleFilters) => request<Vehicle[]>(`/api/vehicles/search?${toQuery(filters)}`),
  createVehicle: (input: VehicleInput) => request<Vehicle>('/api/vehicles', { method: 'POST', body: input }),
  updateVehicle: (id: number, input: Partial<VehicleInput>) =>
    request<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: input }),
  deleteVehicle: (id: number) => request<void>(`/api/vehicles/${id}`, { method: 'DELETE' }),
  purchaseVehicle: (id: number) => request<Vehicle>(`/api/vehicles/${id}/purchase`, { method: 'POST', body: {} }),
  restockVehicle: (id: number, quantity: number) =>
    request<Vehicle>(`/api/vehicles/${id}/restock`, { method: 'POST', body: { quantity } }),
};
