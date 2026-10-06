'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AccountUser, ApiError, accountApi, authApi } from './api-client';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AccountUser | null;
  /** Network failure while checking the session (backend down), distinct from "signed out". */
  connectionError: string | null;
  reload: () => Promise<void>;
  setUser: (user: AccountUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds only the public profile in memory. The source of truth for "am I signed in" is the API
 * (GET /account/me with the HTTP-only cookie), never a client-side flag.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUserState] = useState<AccountUser | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const { user: me } = await accountApi.me();
      setUserState(me);
      setStatus('authenticated');
      setConnectionError(null);
    } catch (err) {
      setUserState(null);
      setStatus('unauthenticated');
      setConnectionError(err instanceof ApiError && err.code === 'NETWORK_ERROR' ? err.message : null);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setUser = useCallback((next: AccountUser | null) => {
    setUserState(next);
    setStatus(next ? 'authenticated' : 'unauthenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUserState(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo(
    () => ({ status, user, connectionError, reload, setUser, logout }),
    [status, user, connectionError, reload, setUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>.');
  return ctx;
}
