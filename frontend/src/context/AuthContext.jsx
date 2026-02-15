import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { login as apiLogin, signup as apiSignup, getCurrentUser, setToken, clearToken } from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  // Initialize state from sessionStorage synchronously (not in useEffect)
  // This avoids the setState-in-effect error
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Check for saved token on first render
  // We use a Promise pattern instead of useEffect + setState
  if (!initialized) {
    setInitialized(true);
    const savedToken = sessionStorage.getItem('gg_nexus_token');
    if (savedToken) {
      setToken(savedToken);
      getCurrentUser()
        .then(data => {
          setUser(data.user);
          setLoading(false);
        })
        .catch(() => {
          sessionStorage.removeItem('gg_nexus_token');
          clearToken();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }

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

  const value = useMemo(() => ({
    user, login, signup, logout, loading
  }), [user, login, signup, logout, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}