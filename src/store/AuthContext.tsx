import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as SecureStore from "expo-secure-store";

import { Driver } from "../types/domain";

type AuthContextType = {

  driver: Driver | null;
  accessToken: string | null;
  authenticated: boolean;
  loading: boolean;

  login: (
    driverData: Driver,
    token?: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  restoreSession: () => Promise<void>;

  setDriver: React.Dispatch<React.SetStateAction<Driver | null>>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [driver, setDriver] = useState<Driver | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  async function restoreSession() {
    try {
      setLoading(true);
      const storedDriver = await SecureStore.getItemAsync("driver");
      const storedToken = await SecureStore.getItemAsync("accessToken");
      if (storedDriver && storedToken) {
        setDriver(JSON.parse(storedDriver));
        setAccessToken(storedToken);
      }

    } catch (error) {
      console.log("RESTORE SESSION ERROR", error);
    } finally {
      setLoading(false);
    }
  }

  async function login(
    driverData: Driver,
    token?: string
  ) {

    try {
      setLoading(true);
      setDriver(driverData);
      const finalToken = token || "mock-token";
      setAccessToken(finalToken);
      await SecureStore.setItemAsync("driver", JSON.stringify(driverData));
      await SecureStore.setItemAsync("accessToken", finalToken);
    } catch (error) {
      console.log("LOGIN ERROR", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      setLoading(true);
      await SecureStore.deleteItemAsync("driver");
      await SecureStore.deleteItemAsync("accessToken");
      setDriver(null);
      setAccessToken(null);
    } catch (error) {
      console.log("LOGOUT ERROR", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    restoreSession();
  }, []);

  const value = useMemo(() => ({
    driver,
    accessToken,
    authenticated: !!driver && !!accessToken,
    loading,
    login,
    logout,
    restoreSession,
    setDriver,
  }),
    [
      driver,
      accessToken,
      loading,
    ]
  );
  return (

    <AuthContext.Provider value={value} >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }
  return context;
}