'use client';
import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/screens/SplashScreen';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { AppShell } from '@/components/layout/AppShell';
import { TenantShell } from '@/components/layout/TenantShell';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/types';

type AppState = 'splash' | 'login' | 'app';

export default function Home() {
  const [state, setState] = useState<AppState>('splash');
  const { user, setUser, setAccessToken, setMustChangePassword } = useAppStore();

  useEffect(() => {
    if (!user && state === 'app') {
      setState('login');
    }
  }, [user, state]);

  function handleLogin(user: User, accessToken: string, mustChangePassword?: boolean) {
    setUser(user);
    setAccessToken(accessToken);
    setMustChangePassword(mustChangePassword ?? false);
    setState('app');
  }

  return (
    <>
      {state === 'splash' && <SplashScreen onDone={() => setState('login')} />}
      {state === 'login' && <LoginScreen onLogin={handleLogin} />}
      {state === 'app' && user?.role === 'tenant' && <TenantShell />}
      {state === 'app' && user?.role !== 'tenant' && <AppShell />}
    </>
  );
}
