'use client';
import { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/screens/SplashScreen';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { AppShell } from '@/components/layout/AppShell';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/types';

type AppState = 'splash' | 'login' | 'app';

const DEMO_USER: User = {
  id: 'user-001',
  name: 'Lucas Oliveira',
  email: 'lucas@equilino.com.br',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
  role: 'admin',
  plan: 'pro',
  createdAt: '2024-01-15T10:00:00Z',
};

export default function Home() {
  const [state, setState] = useState<AppState>('splash');
  const { user, setUser } = useAppStore();

  useEffect(() => {
    if (!user && state === 'app') {
      setState('login');
    }
  }, [user, state]);

  function handleLogin() {
    setUser(DEMO_USER);
    setState('app');
  }

  return (
    <>
      {state === 'splash' && <SplashScreen onDone={() => setState('login')} />}
      {state === 'login' && <LoginScreen onLogin={handleLogin} />}
      {state === 'app' && <AppShell />}
    </>
  );
}
