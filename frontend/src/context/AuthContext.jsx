import { createContext, useContext, useState, useEffect } from 'react';
import { login as authLogin, signup as authSignup, logout as authLogout, loginWithProvider as authLoginWithProvider } from '../api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored);
        setUser(user);
        setToken(token);
      } catch (err) {
        console.error('Failed to parse auth data from localStorage', err);
        localStorage.removeItem('auth');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authLogin({ email, password });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('auth', JSON.stringify({ user: res.user, token: res.token }));
      return res;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await authSignup({ name, email, password });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('auth', JSON.stringify({ user: res.user, token: res.token }));
      return res;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithProvider = async (provider) => {
    setLoading(true);
    try {
      const res = await authLoginWithProvider(provider);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('auth', JSON.stringify({ user: res.user, token: res.token }));
      return res;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authLogout();
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    loginWithProvider,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
