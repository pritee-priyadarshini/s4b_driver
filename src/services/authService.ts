import api from './api';
import * as SecureStore from 'expo-secure-store';
import { isAxiosError } from 'axios';

import { AuthProfile, LoginResponse } from '../types/auth';

const TOKEN_KEY = 'driverAccessToken';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Live API may not know `targetApp` yet (forbidNonWhitelisted). */
function isUnknownTargetAppError(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== 400) return false;
  const data = error.response?.data as { message?: string | string[] } | undefined;
  const raw = data?.message;
  const messages = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return messages.some((m) => {
    const lower = String(m).toLowerCase();
    return lower.includes('targetapp') && lower.includes('should not exist');
  });
}

export const authService = {
  login: async (email: string, password: string) => {
    const body = {
      email: normalizeEmail(email),
      password,
      targetApp: 'driver' as const,
    };

    try {
      return await api.post<LoginResponse>('/auth/login', body);
    } catch (error: unknown) {
      // Older backends reject unknown `targetApp` — retry without it.
      // Driver-role check still runs client-side via assertDriverAccount.
      if (isUnknownTargetAppError(error)) {
        return api.post<LoginResponse>('/auth/login', {
          email: body.email,
          password: body.password,
        });
      }
      throw error;
    }
  },

  profile: () => api.get<AuthProfile>('/auth/profile'),

  forgotPassword: async (email: string) => {
    const body = {
      email: normalizeEmail(email),
      targetApp: 'driver' as const,
    };

    try {
      return await api.post('/auth/forgot-password', body);
    } catch (error: unknown) {
      if (isUnknownTargetAppError(error)) {
        return api.post('/auth/forgot-password', { email: body.email });
      }
      throw error;
    }
  },

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
