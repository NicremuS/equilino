'use client';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ApiErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <AlertTriangle size={20} className="text-red-400" />
      </div>
      <div>
        <p className="text-foreground text-sm font-semibold">Erro ao carregar dados</p>
        {message && <p className="text-muted-foreground text-xs mt-1 max-w-xs">{message}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors"
        >
          <RefreshCw size={12} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="premium-surface rounded-2xl p-4 space-y-3">
      <Skeleton className="h-4 w-24 bg-muted" />
      <Skeleton className="h-8 w-32 bg-muted" />
      <Skeleton className="h-3 w-20 bg-muted" />
    </div>
  );
}

export function ListItemSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Carregando…">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="premium-surface rounded-2xl p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-muted" />
            <Skeleton className="h-3 w-1/2 bg-muted" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full bg-muted" />
        </div>
      ))}
      <span className="sr-only">Carregando conteúdo</span>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('premium-surface rounded-2xl p-4', className)}>
      <Skeleton className="h-5 w-32 mb-4 bg-muted" />
      <Skeleton className="h-40 w-full rounded-xl bg-muted" />
    </div>
  );
}
