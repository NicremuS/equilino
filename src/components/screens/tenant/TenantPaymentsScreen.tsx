'use client';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, Clock, AlertCircle, Receipt } from 'lucide-react';
import { useTenantPayments } from '@/hooks/useTenantApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';
import type { PaymentStatus } from '@/types';

const STATUS = {
  paid:    { label: 'Pago',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  pending: { label: 'Pendente', color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: Clock },
  overdue: { label: 'Atrasado', color: 'text-red-400',     bg: 'bg-red-500/10',     icon: AlertCircle },
  partial: { label: 'Parcial',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: Clock },
} satisfies Record<PaymentStatus, { label: string; color: string; bg: string; icon: React.ElementType }>;

export function TenantPaymentsScreen() {
  const { data: payments, isLoading, isError, refetch } = useTenantPayments();

  if (isLoading) return <ListItemSkeleton count={4} />;
  if (isError) return <ApiErrorState onRetry={refetch} />;

  const total = payments?.reduce((s, p) => s + (p.status === 'paid' ? p.amount : 0), 0) ?? 0;
  const pending = payments?.find(p => p.status === 'pending' || p.status === 'overdue');

  return (
    <div className="space-y-5 pb-4">
      <motion.h1
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground"
      >
        Pagamentos
      </motion.h1>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="premium-surface rounded-2xl p-4">
          <p className="text-muted-foreground text-xs mb-1">Total pago</p>
          <p className="text-foreground font-bold text-lg">{formatCurrency(total)}</p>
        </div>
        <div className={`rounded-2xl p-4 ${pending ? 'bg-red-500/10 border border-red-500/20' : 'premium-surface'}`}>
          <p className="text-muted-foreground text-xs mb-1">Próximo</p>
          {pending ? (
            <>
              <p className="text-red-400 font-bold text-lg">{formatCurrency(pending.amount)}</p>
              <p className="text-red-400/70 text-xs">{pending.month}</p>
            </>
          ) : (
            <p className="text-emerald-400 font-bold text-sm mt-1">Em dia ✓</p>
          )}
        </div>
      </motion.div>

      {/* Payment list */}
      <div className="space-y-2">
        {(payments ?? []).map((payment, i) => {
          const s = STATUS[payment.status];
          const Icon = s.icon;
          return (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
              className="premium-surface rounded-2xl p-4 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <Icon size={17} className={s.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-semibold text-sm">{payment.month}</p>
                <p className="text-muted-foreground text-xs">
                  Vence {formatDate(payment.dueDate)}
                  {payment.paidDate && ` · Pago ${formatDate(payment.paidDate)}`}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-foreground font-bold">{formatCurrency(payment.amount)}</p>
                <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
              </div>
            </motion.div>
          );
        })}

        {payments?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum pagamento encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
