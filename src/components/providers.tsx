'use client';
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppStore } from '@/store/useAppStore';

const AUTH_ERRORS = ['Não autorizado', 'Sessão expirada', 'Token inválido'];

function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return AUTH_ERRORS.some(msg => error.message.includes(msg));
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
          if (isAuthError(error)) return false;
          return failureCount < 1;
        },
      },
      mutations: { retry: 0 },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        if (!isAuthError(error)) console.error('[Query error]', error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error('[Mutation error]', error);
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
