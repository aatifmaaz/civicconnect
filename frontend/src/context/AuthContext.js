/**
 * Authentication Context
 * Manages user authentication state globally
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    const savedUserId = localStorage.getItem('userId');
    const savedRole = localStorage.getItem('userRole');
    const savedUser = localStorage.getItem('user');

    if (savedToken) {
      setToken(savedToken);
      setUser(savedUser ? JSON.parse(savedUser) : { id: savedUserId, role: savedRole });
    }
    setLoading(false);
  }, []);

  const login = (newToken, userId, role, userData = null) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userRole', role);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setToken(newToken);
    setUser(userData || { id: userId, role });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
