'use client';
import { create } from 'zustand';
import { User } from '@/types';

type Theme = 'dark' | 'light';

interface AppState {
  user: User | null;
  accessToken: string | null;
  mustChangePassword: boolean;
  activeTab: string;
  isLoading: boolean;
  theme: Theme;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setMustChangePassword: (v: boolean) => void;
  setActiveTab: (tab: string) => void;
  setLoading: (v: boolean) => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  logout: () => void;
}

function getSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('equilino-theme') as Theme) ?? 'dark';
}

function applyThemeToDom(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  accessToken: null,
  mustChangePassword: false,
  activeTab: 'dashboard',
  isLoading: false,
  theme: getSavedTheme(),
  setUser: (user) => set({ user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setMustChangePassword: (v) => set({ mustChangePassword: v }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (v) => set({ isLoading: v }),
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('equilino-theme', next);
      applyThemeToDom(next);
      return { theme: next };
    }),
  setTheme: (t) => {
    localStorage.setItem('equilino-theme', t);
    applyThemeToDom(t);
    set({ theme: t });
  },
  logout: () => {
    set({ user: null, accessToken: null, mustChangePassword: false, activeTab: 'dashboard' });
  },
}));

export { getSavedTheme };
