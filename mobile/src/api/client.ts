import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getTokens, saveTokens, clearTokens } from '@utils/keychain';
import { getApiBaseUrl } from '@utils/apiBaseUrl';

/** Oracle Cloud Node backend (http://129.146.186.180 via getApiBaseUrl). */
const BASE_URL = getApiBaseUrl();
console.log('[NET_DEBUG] Target URL:', BASE_URL);
console.log('[NET_DEBUG] Full base URL:', BASE_URL);

export { getApiBaseUrl };

// ── Axios instance ─────────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const ts = () => new Date().toISOString();

// ── Request: attach JWT + log every outgoing request ───────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log('[NET_DEBUG] Fetching with IP...');
    const method = (config.method ?? 'get').toUpperCase();
    const url = config.url ?? config.baseURL ?? '';
    console.log(`[NET_REQ] ${ts()} ${method} ${url}`);
    const tokens = await getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response: log every response status ───────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const status = response?.status ?? 0;
    const url = response?.config?.url ?? '';
    console.log(`[NET_RES] ${ts()} ${status} ${url}`);
    return response;
  },
  (error) => {
    const status = error?.response?.status ?? 'err';
    const url = error?.config?.url ?? '';
    console.log(`[NET_RES] ${ts()} ${status} ${url}`);
    if (status === 404) {
      error.message = error.message || 'This feature is not available on the current backend.';
      error.is404 = true;
    }
    try {
      const errPayload = {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        data: error?.response?.data,
      };
      console.error('[API_ERROR] Full Error:', JSON.stringify(errPayload));
    } catch (_) {
      console.error('[API_ERROR] Full Error:', String(error));
    }
    return Promise.reject(error);
  },
);

// ── Response interceptor: auto-refresh on 401 ─────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const tokens = await getTokens();
      if (!tokens?.refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: tokens.refreshToken,
      });

      const newAccessToken: string = data.data.access_token;
      const newRefreshToken: string = data.data.refresh_token;

      await saveTokens(newAccessToken, newRefreshToken);
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      // Emit event so the auth store can sign the user out
      authEvents.emit('signout');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Simple event emitter for auth state changes ───────────────────────────────
type AuthEventListener = () => void;
const authEventListeners: Record<string, AuthEventListener[]> = {};

export const authEvents = {
  emit(event: string) {
    (authEventListeners[event] ?? []).forEach((fn) => fn());
  },
  on(event: string, listener: AuthEventListener) {
    if (!authEventListeners[event]) authEventListeners[event] = [];
    authEventListeners[event].push(listener);
    return () => {
      authEventListeners[event] = authEventListeners[event].filter((fn) => fn !== listener);
    };
  },
};

/** Ping GET /health on Node backend (Oracle Cloud). */
export async function checkServerStatus(): Promise<boolean> {
  const t0 = Date.now();
  try {
    const res = await api.get('/health', { timeout: 5000, validateStatus: () => true });
    const elapsed = Date.now() - t0;
    const ok = res?.status === 200;
    console.log(`[SERVER_CHECK] ${ok ? 'ALIVE' : 'DOWN'} ${res?.status} /health (${elapsed}ms)`);
    return ok;
  } catch (e: any) {
    const elapsed = Date.now() - t0;
    const code = e?.code ?? e?.errno ?? 'unknown';
    console.warn(`[SERVER_CHECK] /health unreachable (${elapsed}ms) code=${code}`);
    return false;
  }
}

export default api;
