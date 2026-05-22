'use client';
import { useEffect } from 'react';
import { useAppStore, getSavedTheme } from '@/store/useAppStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useAppStore();

  // On mount: read persisted theme from localStorage
  useEffect(() => {
    const saved = getSavedTheme();
    setTheme(saved);
  }, [setTheme]);

  // Sync class on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
}
