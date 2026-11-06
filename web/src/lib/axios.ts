import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Storage keys
export const ACCESS_TOKEN_KEY = 'smart_hire_access_token';
export const REFRESH_TOKEN_KEY = 'smart_hire_refresh_token';

const apiBase = (import.meta as any).env?.VITE_API_URL || '';

const api = axios.create({
  baseURL: apiBase, // Proxied by Vite to http://localhost:8000 in dev or set via VITE_API_URL
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Single in-flight refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh once on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Avoid infinite loop on auth endpoints
    if (
      originalRequest?.url?.includes('/api/auth/login') ||
      originalRequest?.url?.includes('/api/auth/signup') ||
      originalRequest?.url?.includes('/api/auth/refresh')
    ) {
      const reqId = error.response?.headers?.['x-request-id'] || '-';
    if ((import.meta as any).env?.DEV) {
      console.warn(`[smart-hire API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} (${error.response?.status}) - Request ID: ${reqId}`, error.response?.data);
    }
    return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        // Only redirect if inside /app
        if (window.location.pathname.startsWith('/app')) {
          window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
        const reqId = error.response?.headers?.['x-request-id'] || '-';
    if ((import.meta as any).env?.DEV) {
      console.warn(`[smart-hire API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} (${error.response?.status}) - Request ID: ${reqId}`, error.response?.data);
    }
    return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${apiBase}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);

        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        }

        processQueue(null, data.access_token);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        if (window.location.pathname.startsWith('/app')) {
          window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const reqId = error.response?.headers?.['x-request-id'] || '-';
    if ((import.meta as any).env?.DEV) {
      console.warn(`[smart-hire API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} (${error.response?.status}) - Request ID: ${reqId}`, error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default api;

