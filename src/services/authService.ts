import api from './api';
import * as SecureStore from 'expo-secure-store';

import { AuthProfile, LoginResponse } from '../types/auth';

const TOKEN_KEY = 'driverAccessToken';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', {
      email: normalizeEmail(email),
      password,
    }),

  profile: () => api.get<AuthProfile>('/auth/profile'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email: normalizeEmail(email) }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', {
      email: normalizeEmail(email),
      otp,
      newPassword,
    }),
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await authService.login(email, password);
  return res.data;
}

export async function getProfile(): Promise<AuthProfile> {
  const res = await authService.profile();
  return res.data;
}

export async function storeAccessToken(accessToken: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
}

export async function clearAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const logout = clearAccessToken;
