'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';


const AuthContext = createContext(null);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken]     = useState(null);


  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      fetchUser(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (t) => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      setUser(res.data.user);
    } catch (err) {
      console.error("Fetch user error:", err);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const setUserAndToken = (userData, newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      if (res.data.requiresOtp || res.data.blockedMobile) {
        return res.data;
      }

      if (res.data.token && res.data.user) {
        setUserAndToken(res.data.user, res.data.token);
      }
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        phone,
      });

      const backendUser = res.data.user;
      const backendToken = res.data.token;
      
      setUserAndToken(backendUser, backendToken);
      return { token: backendToken, user: backendUser };
    } catch (backendError) {
       throw backendError;
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    if (token) await fetchUser(token);
  };

  const getAuthHeaders = () => ({ Authorization: `Bearer ${token}` });

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout,
      refreshUser, getAuthHeaders,
      setUserAndToken, API_URL,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
