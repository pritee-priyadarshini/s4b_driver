import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";

import { login as loginService, logout as logoutService } from "../services/authService";
import { Driver } from "../types/domain";

type AuthContextType = {

  driver: Driver | null;
  accessToken: string | null;
  authenticated: boolean;
  loading: boolean;
  authLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  restoreSession: () => Promise<void>;

  setDriver: React.Dispatch<React.SetStateAction<Driver | null>>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY = "driverAccessToken";
const DRIVER_KEY = "driver";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  async function restoreSession() {
    try {
      setAppLoading(true);

      const storedDriver = await SecureStore.getItemAsync(DRIVER_KEY);
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);

      if (storedDriver && storedToken) {
        setDriver(JSON.parse(storedDriver));
        setAccessToken(storedToken);
      } else {
        setDriver(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.log("RESTORE SESSION ERROR", error);
      setDriver(null);
      setAccessToken(null);
    } finally {
      setAppLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      setAuthLoading(true);
      const { user, siteAccess, accessToken } = await loginService(email, password);
      const driverData: Driver = {
        ...user,
        ...siteAccess,
      };

      setDriver(driverData);
      setAccessToken(accessToken);

      await SecureStore.setItemAsync(DRIVER_KEY, JSON.stringify(driverData));
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);

    } catch (error) {
      // console.log("LOGIN ERROR", error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    try {
      setAuthLoading(true);
      await logoutService();
      await SecureStore.deleteItemAsync(DRIVER_KEY);
      setDriver(null);
      setAccessToken(null);

    } catch (error) {
      console.log("LOGOUT ERROR", error);
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    restoreSession();
  }, []);

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
      setDriver,
    }),
    [driver, accessToken, appLoading, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}