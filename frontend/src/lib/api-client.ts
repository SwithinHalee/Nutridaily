/**
 * Browser API client for the NutriDaily auth API (port 4000).
 *
 * Security model
 * - Session tokens live only in HTTP-only cookies set by the API. This file never sees them,
 *   so XSS cannot exfiltrate them (no localStorage, no sessionStorage).
 * - The CSRF token is held in memory and sent as the X-CSRF-Token header on every
 *   state-changing request.
 * - An expired access token triggers one silent, de-duplicated refresh and a single retry.
 */

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors: FieldError[] = [],
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }

  /** First error message for a given field, for inline form hints. */
  fieldMessage(field: string): string | undefined {
    return this.fieldErrors.find((e) => e.field === field)?.message;
  }
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const REFRESH_PATH = '/api/v1/auth/refresh';

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;
let refreshPromise: Promise<boolean> | null = null;

async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!csrfPromise) {
    csrfPromise = rawFetch('GET', '/api/v1/auth/csrf')
      .then(async (res) => {
        const body = await res.json();
        csrfToken = body.csrfToken as string;
        return csrfToken;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

async function rawFetch(method: string, path: string, body?: unknown, csrf?: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrf) headers['X-CSRF-Token'] = csrf;
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      cache: 'no-store',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Tidak dapat terhubung ke server NutriDaily. Pastikan backend berjalan di port 4000, lalu coba lagi.',
    );
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: { code?: string; message?: string; errors?: FieldError[]; details?: { retryAfterSeconds?: number } } = {};
  try {
    body = await res.json();
  } catch {
    // Non-JSON error (proxy, crash). Fall through to a generic message.
  }
  return new ApiError(
    res.status,
    body.code || 'UNKNOWN_ERROR',
    body.message || 'Terjadi kendala. Silakan coba lagi.',
    Array.isArray(body.errors) ? body.errors : [],
    body.details?.retryAfterSeconds,
  );
}

/**
 * Single-flight refresh: concurrent 401s share one refresh request. If another tab rotated the
 * token first (REFRESH_RACE), the browser already holds the new cookie, so we just retry.
 */
export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const csrf = await fetchCsrfToken();
        const res = await rawFetch('POST', REFRESH_PATH, undefined, csrf);
        if (res.ok) return true;
        const err = await toApiError(res);
        if (err.code === 'REFRESH_RACE') {
          await new Promise((r) => setTimeout(r, 350));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface RequestOptions {
  /** Internal: prevents infinite retry loops. */
  _retried?: boolean;
  /** Skip silent refresh (used by the auth endpoints themselves). */
  skipRefresh?: boolean;
}

export async function apiRequest<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const csrf = UNSAFE_METHODS.has(method) ? await fetchCsrfToken() : undefined;
  const res = await rawFetch(method, path, body, csrf);

  if (res.ok) {
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  const error = await toApiError(res);

  if (!options._retried) {
    if (error.code === 'CSRF_INVALID') {
      csrfToken = null;
      return apiRequest<T>(method, path, body, { ...options, _retried: true });
    }
    const sessionExpired = error.code === 'ACCESS_TOKEN_EXPIRED' || error.code === 'UNAUTHENTICATED';
    if (sessionExpired && !options.skipRefresh && (await refreshSession())) {
      return apiRequest<T>(method, path, body, { ...options, _retried: true });
    }
  }

  throw error;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => apiRequest<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => apiRequest<T>('PATCH', path, body, options),
  delete: <T>(path: string, body?: unknown, options?: RequestOptions) => apiRequest<T>('DELETE', path, body, options),
};

// ---------------------------------------------------------------- Typed endpoints

export interface AccountUser {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  passwordChangedAt: string | null;
}

export interface SessionInfo {
  id: string;
  current: boolean;
  device: string;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}

interface MessageResponse {
  message: string;
}

const AUTH = { skipRefresh: true };

export const authApi = {
  register: (input: { fullName: string; email: string; phone: string; password: string; confirmPassword: string }) =>
    api.post<MessageResponse>('/api/v1/auth/register', input, AUTH),
  verifyEmail: (token: string) => api.post<MessageResponse>('/api/v1/auth/verify-email', { token }, AUTH),
  resendVerification: (email: string) => api.post<MessageResponse>('/api/v1/auth/resend-verification', { email }, AUTH),
  login: (email: string, password: string) =>
    api.post<MessageResponse & { user: AccountUser }>('/api/v1/auth/login', { email, password }, AUTH),
  logout: () => api.post<MessageResponse>('/api/v1/auth/logout', undefined, AUTH),
  logoutAll: () => api.post<MessageResponse>('/api/v1/auth/logout-all'),
  forgotPassword: (email: string) => api.post<MessageResponse>('/api/v1/auth/forgot-password', { email }, AUTH),
  resetPassword: (token: string, password: string, confirmPassword: string) =>
    api.post<MessageResponse>('/api/v1/auth/reset-password', { token, password, confirmPassword }, AUTH),
};

export interface LoginHistoryItem {
  id: string;
  status: 'SUCCESS' | 'FAILED';
  reason: string | null;
  device: string;
  ipAddress: string | null;
  createdAt: string;
}

export const accountApi = {
  me: () => api.get<{ user: AccountUser }>('/api/v1/account/me'),
  updateProfile: (input: { fullName?: string; phone?: string }) =>
    api.patch<MessageResponse & { user: AccountUser }>('/api/v1/account/me', input),
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api.post<MessageResponse>('/api/v1/account/change-password', { currentPassword, newPassword, confirmPassword }),
  sessions: () => api.get<{ sessions: SessionInfo[] }>('/api/v1/account/sessions'),
  loginHistory: () => api.get<{ history: LoginHistoryItem[] }>('/api/v1/account/login-history'),
  deleteAccount: (password: string, confirmation: string) =>
    api.delete<MessageResponse>('/api/v1/account/me', { password, confirmation }),
};

export const subscriptionApi = {
  getMySubscription: () =>
    api.get<{ data: any; currentWibTime: any; cutoffNotice: string }>('/api/v1/subscriptions/me'),
  pause: (id: string, effectiveDate: string) =>
    api.patch<{ message: string; data: any }>(`/api/v1/subscriptions/${id}/pause`, { effectiveDate }),
  resume: (id: string, effectiveDate: string) =>
    api.patch<{ message: string; data: any }>(`/api/v1/subscriptions/${id}/resume`, { effectiveDate }),
  swapMenu: (id: string, orderDate: string, recipeId: string, recipeTitle: string) =>
    api.patch<{ message: string; data: any }>(`/api/v1/subscriptions/${id}/swap-menu`, {
      orderDate,
      recipeId,
      recipeTitle,
    }),
  updateAddress: (id: string, effectiveDate: string, addressId: string, label: string, fullAddress: string) =>
    api.patch<{ message: string; data: any }>(`/api/v1/subscriptions/${id}/address`, {
      effectiveDate,
      addressId,
      label,
      fullAddress,
    }),
};

export const recipesApi = {
  getCatalog: (week?: 'current' | 'next') =>
    api.get<{ data: { days: any[]; meals: any[] } }>(
      week === 'next' ? '/api/v1/recipes/catalog?week=next' : '/api/v1/recipes/catalog',
    ),
  getCleanLabel: () => api.get<{ data: any[] }>('/api/v1/recipes/clean-label'),
  verifyCleanLabel: (qrCode: string) => api.get<{ data: any }>(`/api/v1/recipes/verify/${qrCode}`),
};

/** Same rules as the backend Zod schema, for live feedback only. The server stays authoritative. */
export const PASSWORD_RULES: Array<{ id: string; label: string; test: (v: string) => boolean }> = [
  { id: 'length', label: 'Minimal 8 karakter', test: (v) => v.length >= 8 },
  { id: 'lower', label: 'Huruf kecil (a-z)', test: (v) => /[a-z]/.test(v) },
  { id: 'upper', label: 'Huruf besar (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'digit', label: 'Angka (0-9)', test: (v) => /[0-9]/.test(v) },
  { id: 'symbol', label: 'Simbol, misalnya ! @ # $', test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

/** Accepts only same-site relative paths, to prevent open redirects via ?next=. */
export function safeNextPath(raw: string | null | undefined, fallback = '/account'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  return raw;
}
