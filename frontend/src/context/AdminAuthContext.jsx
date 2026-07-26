import { createContext, useContext, useState, useEffect } from 'react';
import { adminLogin as apiAdminLogin, getAdminMe } from '../api/adminService.js';
import { setAdminToken } from '../api/client.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('adminAuth');
    if (stored) {
      try {
        const { admin, token } = JSON.parse(stored);
        setAdmin(admin);
        setToken(token);
        setAdminToken(token);
      } catch (err) {
        console.error('Failed to parse admin auth data', err);
        localStorage.removeItem('adminAuth');
      }
    }
    setLoading(false);
  }, []);

  const login = async ({ username, password, favoritePerson, favoriteNumber }) => {
    setLoading(true);
    try {
      const res = await apiAdminLogin({ username, password, favoritePerson, favoriteNumber });
      setAdmin(res.admin);
      setToken(res.token);
      setAdminToken(res.token);
      localStorage.setItem('adminAuth', JSON.stringify({ admin: res.admin, token: res.token }));
      return res;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    setAdminToken(null);
    localStorage.removeItem('adminAuth');
  };

  const refresh = async () => {
    if (!token) return;
    try {
      const me = await getAdminMe();
      setAdmin(me);
    } catch (err) {
      console.error('Admin refresh failed', err);
      logout();
    }
  };

  const value = {
    admin,
    token,
    loading,
    login,
    logout,
    refresh,
    isAdmin: !!admin,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
