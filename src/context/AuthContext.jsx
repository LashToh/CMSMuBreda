import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchMe, loginAccount, logoutAccount, registerAccount } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchMe();
      setUser(data.data?.user || null);
    } catch {
      setUser(null);
      localStorage.removeItem('mubreda_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (credentials) => {
    const data = await loginAccount(credentials);
    setUser(data.data?.user || null);
    return data;
  };

  const register = async (payload) => registerAccount(payload);

  const logout = async () => {
    await logoutAccount();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: Boolean(user?.isAdmin),
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
