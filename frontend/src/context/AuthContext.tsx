import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, AUTH_EXPIRED_EVENT, tokenStorage } from '../api/client';
import { AuthResponse, User } from '../types';

interface AuthContextValue {
  user: User | null;
  /** True while we're validating a stored token on first load. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => tokenStorage.get() !== null);

  // Restore the session from a stored token.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    api
      .me()
      .then(({ user: current }) => setUser(current))
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  // The API client announces expired/invalid tokens; drop the session when that happens.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const completeAuth = useCallback(({ user: authed, token }: AuthResponse) => {
    tokenStorage.set(token);
    setUser(authed);
  }, []);

  const login = useCallback(async (email: string, password: string) => completeAuth(await api.login({ email, password })), [completeAuth]);
  const register = useCallback(
    async (name: string, email: string, password: string) => completeAuth(await api.register({ name, email, password })),
    [completeAuth],
  );
  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
