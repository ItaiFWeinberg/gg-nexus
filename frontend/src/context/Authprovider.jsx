import { useState, useCallback, useMemo, useEffect } from 'react';
import AuthContext from './AuthContext';
import { login as apiLogin, signup as apiSignup, getCurrentUser, setToken, clearToken } from '../services/api';

const hasToken = !!sessionStorage.getItem('gg_nexus_token');

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasToken);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('gg_nexus_token');
    if (!savedToken) return;

    setToken(savedToken);
    getCurrentUser()
      .then(data => setUser(data.user))
      .catch(() => {
        sessionStorage.removeItem('gg_nexus_token');
        clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    setToken(data.token);
    sessionStorage.setItem('gg_nexus_token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const signup = useCallback(async (username, email, password) => {
    const data = await apiSignup(username, email, password);
    setToken(data.token);
    sessionStorage.setItem('gg_nexus_token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    sessionStorage.removeItem('gg_nexus_token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
      return data.user;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(() => ({
    user, login, signup, logout, loading, refreshUser
  }), [user, login, signup, logout, loading, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}