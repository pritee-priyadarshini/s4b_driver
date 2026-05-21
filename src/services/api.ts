
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'https://s4b.saveful.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync('driverAccessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const url = error.config?.url || '';

    const isLoginRequest =
      url.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      await SecureStore.deleteItemAsync('driverAccessToken');
    }

    return Promise.reject(error);
  }
);

export default api;