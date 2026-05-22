'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, getInitials } from '@/lib/utils';
import { usePayments, useTenants } from '@/hooks/useApi';
import { AlertCircle, Clock, ChevronRight } from 'lucide-react';

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

const statusConfig = {
  overdue: {
    stripe: 'bg-red-500',
    badge: 'bg-red-500/15 text-red-400 border-red-500/25',
    icon: AlertCircle,
    iconColor: 'text-red-400',
    label: 'Atrasado',
  },
  pending: {
    stripe: 'bg-yellow-500',
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    icon: Clock,
    iconColor: 'text-yellow-400',
    label: 'Pendente',
  },
} as const;

export function UpcomingPayments() {
  const { data: payments = [], isLoading } = usePayments();
  const { data: tenants = [] } = useTenants();

  const upcoming = useMemo(
    () =>
      payments
        .filter(p => p.status === 'pending' || p.status === 'overdue')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5),
    [payments]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.45 }}
      className="premium-surface rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-premium">
        <div>
          <h3 className="text-foreground font-semibold text-sm">Próximos Pagamentos</h3>
          <p className="text-muted-foreground text-[10px] mt-0.5">
            {isLoading ? '…' : `${upcoming.length} pendentes`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2.5 py-1">
          <Clock size={10} className="text-yellow-400" />
          <span className="text-yellow-400 text-[10px] font-bold">
            {isLoading ? '–' : upcoming.length}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-muted/70 dark:bg-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted/70 dark:bg-white/5 rounded w-3/4" />
                <div className="h-2.5 bg-muted/70 dark:bg-white/5 rounded w-1/2" />
              </div>
              <div className="h-4 w-16 bg-muted/70 dark:bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-xs">
          Nenhum pagamento pendente
        </div>
      ) : (
        <div className="divide-y divide-border">
          {upcoming.map((payment, i) => {
            const tenant = tenants.find(t => t.id === payment.tenantId);
            const cfg = statusConfig[payment.status as 'pending' | 'overdue'] ?? statusConfig.pending;
            const StatusIcon = cfg.icon;
            const days = daysUntil(payment.dueDate);
            const daysLabel =
              days < 0 ? `${Math.abs(days)}d atrasado` : days === 0 ? 'Vence hoje' : `${days}d restantes`;

            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.07 }}
                className="flex items-center gap-0 relative hover:bg-black/[0.025] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <div className={`w-1 self-stretch flex-shrink-0 ${cfg.stripe}`} />
                <div className="flex items-center gap-3 flex-1 min-w-0 px-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm">
                    {tenant ? getInitials(tenant.name) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-xs font-semibold truncate">{tenant?.name ?? 'Inquilino'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StatusIcon size={9} className={cfg.iconColor} />
                      <p className={`text-[10px] font-medium ${cfg.iconColor}`}>{daysLabel}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-foreground text-xs font-bold">{formatCurrency(payment.amount)}</p>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <ChevronRight size={13} className="text-muted-foreground flex-shrink-0 ml-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
