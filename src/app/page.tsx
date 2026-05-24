'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/screens/SplashScreen';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { AppShell } from '@/components/layout/AppShell';
import { TenantShell } from '@/components/layout/TenantShell';
import { useAppStore } from '@/store/useAppStore';
import { getStoredSession, setStoredSession, clearStoredSession } from '@/lib/session';
import type { User } from '@/types';

type AppState = 'splash' | 'login' | 'app';

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<AppState>('splash');
  const { user, setUser, setAccessToken, setMustChangePassword } = useAppStore();

  // Restore session from localStorage on mount
  useEffect(() => {
    if (state !== 'login') return;
    const session = getStoredSession();
    if (session?.user && session?.accessToken) {
      routeAfterLogin(session.user, session.accessToken);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!user && state === 'app') {
      setState('login');
    }
  }, [user, state]);

  function routeAfterLogin(u: User, accessToken: string, mustChange = false) {
    setUser(u);
    setAccessToken(accessToken);
    setMustChangePassword(mustChange);
    setStoredSession(u, accessToken);

    // Tenants bypass subscription checks
    if (u.role === 'tenant') {
      setState('app');
      return;
    }

    // Legacy / demo users with no explicit status → treat as active
    const subStatus = u.subscriptionStatus;
    const onboardingDone = u.onboardingCompleted !== false;

    if (!onboardingDone) {
      router.push('/onboarding');
      return;
    }

    if (!subStatus || subStatus === 'active') {
      setState('app');
      return;
    }

    if (subStatus === 'trial') {
      if (u.trialEndsAt && new Date(u.trialEndsAt) < new Date()) {
        clearStoredSession();
        router.push('/plans?reason=trial_expired');
      } else {
        setState('app');
      }
      return;
    }

    if (subStatus === 'expired' || subStatus === 'cancelled') {
      clearStoredSession();
      router.push(`/plans?reason=${subStatus}`);
      return;
    }

    if (subStatus === 'pending') {
      router.push('/plans');
      return;
    }

    setState('app');
  }

  function handleLogin(u: User, accessToken: string, mustChangePassword?: boolean) {
    routeAfterLogin(u, accessToken, mustChangePassword ?? false);
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
