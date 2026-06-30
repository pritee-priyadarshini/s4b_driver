import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Called from AuthContext so a 401 clears session and redirects to login. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

const TOKEN_KEY = 'driverAccessToken';

const api = axios.create({
  baseURL: 'https://s4b.saveful.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config: any) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    config.transformRequest = [(data: any) => data];
  }

  const method = (config.method ?? 'get').toUpperCase();
  const base = config.baseURL ?? '';
  const path = config.url ?? '';
  const query = config.params
    ? `?${new URLSearchParams(
        Object.entries(config.params).reduce<Record<string, string>>((acc, [key, value]) => {
          if (value != null) acc[key] = String(value);
          return acc;
        }, {}),
      ).toString()}`
    : '';
  console.log(`[API] → ${method} ${base}${path}${query}`);

  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = (response.config.method ?? 'get').toUpperCase();
    const base = response.config.baseURL ?? '';
    const path = response.config.url ?? '';
    console.log(`[API] ← ${response.status} ${method} ${base}${path}`);
    return response;
  },
  async (error) => {
    const config = error.config;
    const method = (config?.method ?? 'get').toUpperCase();
    const base = config?.baseURL ?? '';
    const path = config?.url ?? '';
    console.log(
      `[API] ← ERROR ${error.response?.status ?? 'NETWORK'} ${method} ${base}${path}`,
      error.response?.data ?? error.message,
    );

    const url = config?.url ?? '';
    const isLoginRequest = url.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      try {
        await unauthorizedHandler?.();
      } catch {
        // session teardown failed — token is already cleared
      }
    }

    return Promise.reject(error);
  },
);

export default api;
