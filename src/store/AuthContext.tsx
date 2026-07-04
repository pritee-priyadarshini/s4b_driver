import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import {
  clearAccessToken,
  getProfile,
  login as loginRequest,
  storeAccessToken,
  logout as logoutService,
} from '../services/authService';
import { setUnauthorizedHandler } from '../services/api';
import { AuthDriver } from '../types/auth';
import {
  assertDriverAccount,
  buildAuthDriver,
  isDriverSiteRole,
} from '../utils/authSession';
import { useNotificationsStore } from './notificationsStore';

type AuthContextType = {
  driver: AuthDriver | null;
  accessToken: string | null;
  authenticated: boolean;
  loading: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setDriver: React.Dispatch<React.SetStateAction<AuthDriver | null>>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const DRIVER_KEY = 'driver';

async function persistDriver(driver: AuthDriver) {
  await SecureStore.setItemAsync(DRIVER_KEY, JSON.stringify(driver));
}

async function clearPersistedSession() {
  await Promise.all([
    clearAccessToken(),
    SecureStore.deleteItemAsync(DRIVER_KEY),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [driver, setDriver] = useState<AuthDriver | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const clearSession = useCallback(async () => {
    const notificationsStore = useNotificationsStore.getState();
    notificationsStore.teardownPushHandlers();
    try {
      await notificationsStore.unregisterDeviceToken();
    } catch {
      // Non-critical — token is already invalid if we're here from a 401
    }
    notificationsStore.reset();

    await clearPersistedSession();
    setDriver(null);
    setAccessToken(null);
  }, []);

  const applyDriverSession = useCallback(async (nextDriver: AuthDriver) => {
    setDriver(nextDriver);
    setAccessToken(nextDriver.accessToken);
    await persistDriver(nextDriver);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await getProfile();
    const token = await SecureStore.getItemAsync('driverAccessToken');

    if (!token) {
      throw new Error('Missing access token');
    }

    const siteRole = profile.role.siteRole ?? profile.sites[0]?.siteRole;
    if (!isDriverSiteRole(siteRole)) {
      await clearSession();
      throw new Error('NOT_A_DRIVER');
    }

    const nextDriver = buildAuthDriver(profile, token, driver?.siteAccess);
    await applyDriverSession(nextDriver);
  }, [applyDriverSession, clearSession, driver?.siteAccess]);

  async function restoreSession() {
    try {
      setAppLoading(true);

      const storedToken = await SecureStore.getItemAsync('driverAccessToken');
      if (!storedToken) {
        await clearSession();
        return;
      }

      const profile = await getProfile();
      const siteRole = profile.role.siteRole ?? profile.sites[0]?.siteRole;

      if (!isDriverSiteRole(siteRole)) {
        await clearSession();
        return;
      }

      const nextDriver = buildAuthDriver(profile, storedToken);
      await applyDriverSession(nextDriver);
    } catch (error) {
      console.log('RESTORE SESSION ERROR', error);
      await clearSession();
    } finally {
      setAppLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      setAuthLoading(true);

      const loginResponse = await loginRequest(email, password);
      await storeAccessToken(loginResponse.accessToken);

      let profile;
      try {
        profile = await getProfile();
      } catch (profileError) {
        await clearAccessToken();
        throw profileError;
      }

      assertDriverAccount(loginResponse, profile);

      const nextDriver = buildAuthDriver(
        profile,
        loginResponse.accessToken,
        loginResponse.siteAccess,
      );

      await applyDriverSession(nextDriver);
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    try {
      setAuthLoading(true);
      const notificationsStore = useNotificationsStore.getState();
      notificationsStore.teardownPushHandlers();
      await notificationsStore.unregisterDeviceToken();
      await logoutService();
      notificationsStore.reset();
      await clearPersistedSession();
      setDriver(null);
      setAccessToken(null);
    } catch (error) {
      console.log('LOGOUT ERROR', error);
      await clearSession();
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (!driver || !accessToken) return;

    const notificationsStore = useNotificationsStore.getState();
    void notificationsStore.registerDeviceToken({ prompt: true });
    notificationsStore.setupPushHandlers();

    return () => {
      useNotificationsStore.getState().teardownPushHandlers();
    };
  }, [driver?.id, accessToken]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const value = useMemo(
    () => ({
      driver,
      accessToken,
      authenticated: !!driver && !!accessToken,
      loading: appLoading,
      authLoading,
      login,
      logout,
      restoreSession,
      refreshProfile,
      setDriver,
    }),
    [driver, accessToken, appLoading, authLoading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
