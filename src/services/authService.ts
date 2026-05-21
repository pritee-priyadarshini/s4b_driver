import api from './api';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'driverAccessToken';

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', {
    email,
    password,
  });

  const { accessToken, user, siteAccess } = res.data;

  if (siteAccess?.siteRole !== 'DRIVER') {
    throw new Error('This account is not a driver');
  }

  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);

  return {
    user,
    siteAccess,
    accessToken,
  };
};

export const logout = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};