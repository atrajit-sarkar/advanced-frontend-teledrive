"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchMe, Me, getSessionId, clearSession, logoutBackend } from '@/lib/backend';

interface AuthContextValue {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const sid = getSessionId();
    if (!sid) { setMe(null); setLoading(false); return; }
    try {
      const data = await fetchMe();
      setMe(data.authorized ? data : null);
    } catch {
      setMe(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const logout = async () => {
    await logoutBackend();
    setMe(null);
  };

  return <AuthContext.Provider value={{ me, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}