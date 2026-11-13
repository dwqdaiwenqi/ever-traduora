import axios from 'axios';
import { getToken } from '../utils/token';

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_ENDPOINT,
});

apiClient.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor — the store handles 401 logout logic via the callback
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedCallback(cb: () => void) {
  onUnauthorized = cb;
}

apiClient.interceptors.response.use(
  res => res,
  error => {
    const url = error.config?.url || '';
    const status = error.response?.status;
    const whitelisted = url.includes('change-password') || url.endsWith('/auth/signup');
    if (status === 401 && !whitelisted && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);
