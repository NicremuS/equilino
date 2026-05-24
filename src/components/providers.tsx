'use client';
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppStore } from '@/store/useAppStore';

const isDev = process.env.NODE_ENV === 'development';

const AUTH_ERRORS = ['Não autorizado', 'Sessão expirada', 'Token inválido'];

function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return AUTH_ERRORS.some(msg => error.message.includes(msg));
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 2 minutes — reduces redundant re-fetches
        // on tab focus / component remounts (critical for mobile performance).
        staleTime: 2 * 60 * 1000,
        // Keep unused data in cache for 10 minutes before garbage collecting.
        gcTime: 10 * 60 * 1000,
        // Don't re-fetch on window focus — prevents a burst of requests every
        // time the user switches apps on mobile and comes back.
        refetchOnWindowFocus: false,
        // One retry on network errors; skip retry entirely on auth errors.
        retry: (failureCount, error) => {
          if (isAuthError(error)) return false;
          return failureCount < 1;
        },
        // Show cached data immediately while re-validating in the background.
        placeholderData: (prev: unknown) => prev,
      },
      mutations: { retry: 0 },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        // Only log to console in development — keeps prod logs clean.
        if (isDev && !isAuthError(error)) {
          console.error('[Query error]', error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (isDev) console.error('[Mutation error]', error);
      },
    }),
  });
}

function CacheCleaner({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    return useAppStore.subscribe((state, prev) => {
      if (prev.user && !state.user) {
        queryClient.cancelQueries();
        queryClient.clear();
      }
    });
  }, [queryClient]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <CacheCleaner queryClient={queryClient} />
      <ThemeProvider>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
