import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiFetch, getStoredToken, setStoredToken } from '../lib/api';

export interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  role: 'admin' | 'user';
  full_name: string | null;
  whatsapp: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  signup: (payload: { username: string; email?: string; password: string; full_name?: string; whatsapp?: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => { throw new Error('not ready'); },
  signup: async () => { throw new Error('not ready'); },
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch('/auth');
      setUser(data);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (username: string, password: string) => {
    const data = await apiFetch('/auth', { method: 'POST', body: JSON.stringify({ action: 'login', username, password }) });
    setStoredToken(data.token);
    setUser(data.user);
    return data.user as AuthUser;
  };

  const signup = async (payload: { username: string; email?: string; password: string; full_name?: string; whatsapp?: string }) => {
    const data = await apiFetch('/auth', { method: 'POST', body: JSON.stringify({ action: 'signup', ...payload }) });
    setStoredToken(data.token);
    setUser(data.user);
    return data.user as AuthUser;
  };

  const logout = async () => {
    try {
      await apiFetch('/auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }) });
    } catch { /* ignore */ }
    setStoredToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
