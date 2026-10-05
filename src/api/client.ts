import type {
  ApiError,
  Branch,
  BranchInput,
  BranchResponse,
  Customer,
  CustomerInput,
  Lead,
  LeadActivity,
  LeadActivityInput,
  LeadInput,
  ListParams,
  PaginatedResponse,
  Role,
  RoleInput,
  RolePermission,
  RolePermissionInput,
  User,
  UserInput,
} from '@/types';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const API_BASE_URL = 'https://drf-api-app.vercel.app/api';
const ACCESS_KEY = 'crm_access_token';
const REFRESH_KEY = 'crm_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class HttpError extends Error {
  status: number;
  data: ApiError;
  constructor(status: number, data: ApiError, message: string) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type OnAuthError = () => void;
let onAuthErrorCallback: OnAuthError | null = null;
export function setOnAuthError(cb: OnAuthError): void {
  onAuthErrorCallback = cb;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) throw new Error('refresh failed');
    const data = await res.json();
    if (data.access) {
      localStorage.setItem(ACCESS_KEY, data.access);
      if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
      return data.access as string;
    }
    return null;
  } catch {
    clearTokens();
    onAuthErrorCallback?.();
    return null;
  }
}

async function getValidAccessToken(): Promise<string | null> {
  const access = getAccessToken();
  if (access) return access;
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = refreshAccessToken().finally(() => {
      isRefreshing = false;
    });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: ListParams;
  isAuth?: boolean;
  isBranchEndpoint?: boolean;
}

function buildURL(path: string, params?: ListParams): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

function extractErrorData(raw: unknown): ApiError {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as ApiError;
  }
  if (typeof raw === 'string') {
    return { detail: raw };
  }
  return { detail: 'An unexpected error occurred' };
}

function formatError(data: ApiError, status: number): string {
  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);
  const fields = Object.entries(data).filter(([k]) => k !== 'success');
  if (fields.length > 0) {
    return fields
      .map(([key, val]) => {
        if (Array.isArray(val)) return `${key}: ${val.join(', ')}`;
        return `${key}: ${String(val)}`;
      })
      .join('; ');
  }
  if (status === 401) return 'Authentication credentials were not provided or are invalid.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status >= 500) return 'A server error occurred. Please try again later.';
  return 'An unexpected error occurred';
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, isAuth = true, isBranchEndpoint = false } = opts;
  const url = buildURL(path, params);

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (isAuth) {
    const token = await getValidAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Try token refresh on 401
  if (res.status === 401 && isAuth && !path.includes('/token/') && !path.includes('/login/')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(retryRes, isBranchEndpoint);
    }
    clearTokens();
    onAuthErrorCallback?.();
    throw new HttpError(401, { detail: 'Session expired. Please log in again.' }, 'Session expired');
  }

  return handleResponse<T>(res, isBranchEndpoint);
}

async function handleResponse<T>(res: Response, isBranchEndpoint: boolean): Promise<T> {
  const text = await res.text();
  const raw = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const data = extractErrorData(raw);
    throw new HttpError(res.status, data, formatError(data, res.status));
  }

  if (isBranchEndpoint && raw && typeof raw === 'object' && 'success' in raw) {
    const envelope = raw as BranchResponse<T>;
    if (!envelope.success) {
      throw new HttpError(res.status, { detail: envelope.message }, envelope.message);
    }
    // If the data is a plain array, normalize it into a paginated response shape
    // so the rest of the app (which expects { count, results, next, previous }) works.
    if (Array.isArray(envelope.data)) {
      return {
        count: envelope.data.length,
        next: null,
        previous: null,
        results: envelope.data,
      } as unknown as T;
    }
    return envelope.data;
  }

  return raw as T;
}

// --- Auth API ---
export const authApi = {
  login(username: string, password: string): Promise<{ access: string; refresh: string }> {
    return request('/login/', {
      method: 'POST',
      body: { username, password },
      isAuth: false,
    });
  },
  token(username: string, password: string): Promise<{ access: string; refresh: string }> {
    return request('/token/', {
      method: 'POST',
      body: { username, password },
      isAuth: false,
    });
  },
  refreshToken(refresh: string): Promise<{ access: string; refresh?: string }> {
    return request('/token/refresh/', {
      method: 'POST',
      body: { refresh },
      isAuth: false,
    });
  },
};

// --- Generic CRUD factory ---
function crudResource<T, TInput>(basePath: string, isBranch = false) {
  return {
    list(params?: ListParams): Promise<PaginatedResponse<T>> {
      return request<PaginatedResponse<T>>(`${basePath}/`, { params, isBranchEndpoint: isBranch });
    },
    retrieve(id: number): Promise<T> {
      return request<T>(`${basePath}/${id}/`, { isBranchEndpoint: isBranch });
    },
    create(data: TInput): Promise<T> {
      return request<T>(`${basePath}/`, { method: 'POST', body: data, isBranchEndpoint: isBranch });
    },
    update(id: number, data: Partial<TInput>): Promise<T> {
      return request<T>(`${basePath}/${id}/`, { method: 'PATCH', body: data, isBranchEndpoint: isBranch });
    },
    remove(id: number): Promise<void> {
      return request<void>(`${basePath}/${id}/`, { method: 'DELETE', isBranchEndpoint: isBranch });
    },
  };
}

export const branchesApi = crudResource<Branch, BranchInput>('/branches', true);
export const usersApi = crudResource<User, UserInput>('/users');
export const rolesApi = crudResource<Role, RoleInput>('/roles');
export const rolesPermissionsApi = crudResource<RolePermission, RolePermissionInput>('/rolespermissions');
export const customersApi = crudResource<Customer, CustomerInput>('/customers');
export const leadsApi = crudResource<Lead, LeadInput>('/leads');
export const leadActivitiesApi = crudResource<LeadActivity, LeadActivityInput>('/leadactivities');

export { API_BASE_URL };
