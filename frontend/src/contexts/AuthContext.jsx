import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('xtrix_token'));
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getMe();
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem('xtrix_token');
      localStorage.removeItem('xtrix_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: userData, token: newToken } = res.data;
    localStorage.setItem('xtrix_token', newToken);
    localStorage.setItem('xtrix_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setShowAuthModal(false);
    return userData;
  };

  const register = async (username, email, password, displayName) => {
    const res = await authAPI.register({ username, email, password, displayName });
    const { user: userData, token: newToken } = res.data;
    localStorage.setItem('xtrix_token', newToken);
    localStorage.setItem('xtrix_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setShowAuthModal(false);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('xtrix_token');
    localStorage.removeItem('xtrix_user');
    setToken(null);
    setUser(null);
  };

  const requireAuth = (callback) => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    if (callback) callback();
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout,
      showAuthModal, setShowAuthModal, requireAuth,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
