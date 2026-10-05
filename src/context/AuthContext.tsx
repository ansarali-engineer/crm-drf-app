import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, clearTokens, getAccessToken, setOnAuthError, setTokens } from '@/api/client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    setIsAuthenticated(!!token);
    setIsLoading(false);
    setOnAuthError(() => {
      setIsAuthenticated(false);
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { access, refresh } = await authApi.login(username, password);
    setTokens(access, refresh);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, login, logout }),
    [isAuthenticated, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
