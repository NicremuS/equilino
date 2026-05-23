'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, Paperclip, Clock } from 'lucide-react';
import { usePayments, useTenants, useProperties } from '@/hooks/useApi';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';
import { PaymentProfileScreen } from './PaymentProfileScreen';
import type { Payment, PaymentStatus } from '@/types';

type FilterValue = PaymentStatus | 'all' | 'with_receipt';

const filters: { label: string; value: FilterValue }[] = [
  { label: 'Todos',             value: 'all'               },
  { label: 'Aguardando',        value: 'awaiting_approval' },
  { label: 'Pagos',             value: 'paid'              },
  { label: 'Pendentes',         value: 'pending'           },
  { label: 'Atrasados',         value: 'overdue'           },
  { label: 'Rejeitados',        value: 'rejected'          },
  { label: 'Com comprovante',   value: 'with_receipt'      },
];

const summaryColors = {
  paid:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  pending: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
  overdue: { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20'     },
};

const METHOD_PT: Record<string, string> = {
  pix: 'Pix', transfer: 'TED', boleto: 'Boleto', cash: 'Dinheiro', other: 'Outro',
};

export function PaymentsScreen() {
  const { data: payments, isLoading, isError, refetch } = usePayments();
  const { data: tenants    = [] } = useTenants();
  const { data: properties = [] } = useProperties();
  const [active,   setActive]   = useState<FilterValue>('all');
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState<Payment | null>(null);

  const filtered = (payments ?? []).filter(p => {
    const tenant = tenants.find(t => t.id === p.tenantId);
    const matchesStatus =
      active === 'all'          ? true :
      active === 'with_receipt' ? !!p.receiptUrl :
      p.status === active;
    const matchesSearch = !search ||
      tenant?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPaid    = (payments ?? []).filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalOverdue = (payments ?? []).filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  const totalPending = (payments ?? []).filter(p => p.status === 'pending' || p.status === 'awaiting_approval').reduce((s, p) => s + p.amount, 0);
  const awaitingCount = (payments ?? []).filter(p => p.status === 'awaiting_approval').length;

  return (
    <AnimatePresence mode="wait">
    {selected ? (
      <PaymentProfileScreen key="profile" payment={selected} onBack={() => setSelected(null)} />
    ) : (
    <div className="space-y-5 pb-2">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-foreground text-xl font-bold">Pagamentos</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Acompanhe todas as cobranças</p>
      </motion.div>

      {/* Awaiting approval alert */}
      <AnimatePresence>
        {awaitingCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => setActive('awaiting_approval')}
            className="w-full rounded-2xl border border-violet-500/30 bg-violet-500/8 p-4 flex items-center gap-3 hover:bg-violet-500/12 transition-colors text-left"
          >
            <div className="p-2 rounded-xl bg-violet-500/15 flex-shrink-0">
              <Clock size={16} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-violet-400 font-semibold text-sm">
                {awaitingCount} comprovante{awaitingCount > 1 ? 's' : ''} aguardando sua aprovação
              </p>
              <p className="text-violet-400/60 text-xs mt-0.5">Clique para revisar</p>
            </div>
            <span className="flex-shrink-0 relative">
              <span className="flex w-2.5 h-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60" />
                <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-violet-400" />
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2"
      >
        {[
          { label: 'Recebido', value: totalPaid,    key: 'paid'    as const },
          { label: 'Pendente', value: totalPending,  key: 'pending' as const },
          { label: 'Atrasado', value: totalOverdue,  key: 'overdue' as const },
        ].map((item) => (
          <div key={item.key} className={`rounded-2xl border p-3 ${summaryColors[item.key].bg} ${summaryColors[item.key].border}`}>
            <p className={`text-xs font-semibold ${summaryColors[item.key].text} mb-1`}>{item.label}</p>
            {isLoading ? (
              <div className="h-5 w-16 rounded-md bg-muted/70 dark:bg-white/5 animate-pulse" />
            ) : (
              <p className="text-foreground text-sm font-bold leading-tight">{formatCurrency(item.value)}</p>
            )}
          </div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar inquilino ou descrição..."
          className="w-full pl-9 pr-4 py-3 premium-surface rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors"
        />
      </motion.div>

      {/* Filter chips */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              active === f.value
                ? 'bg-violet-500 border-violet-500 text-white'
                : 'border-border text-muted-foreground hover:border-violet-500/30 hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            {f.label}
            {f.value === 'awaiting_approval' && awaitingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-400/20 text-violet-300 text-[9px] font-bold">
                {awaitingCount}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* List */}
      {isError ? (
        <ApiErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ListItemSkeleton count={5} />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filtered.map((payment, i) => {
              const tenant   = tenants.find(t => t.id === payment.tenantId);
              const property = properties.find(p => p.id === payment.propertyId);
              const isAwaiting = payment.status === 'awaiting_approval';
              const isRejected = payment.status === 'rejected';

              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(payment)}
                  className={`premium-surface rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all ${
                    isAwaiting
                      ? 'border-violet-500/30 hover:border-violet-500/50 bg-violet-500/3'
                      : isRejected
                      ? 'border-red-500/20 hover:border-red-500/35'
                      : 'hover:border-violet-500/25'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {tenant ? getInitials(tenant.name) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">
                      {tenant?.name ?? 'Inquilino'}
                    </p>
                    <p className="text-muted-foreground text-xs truncate">{property?.name ?? payment.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <p className="text-muted-foreground text-xs">{payment.month}</p>
                      {payment.paymentMethod && (
                        <span className="text-muted-foreground/60 text-[10px]">· {METHOD_PT[payment.paymentMethod]}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-foreground text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                    <StatusBadge type="payment" status={payment.status} />
                    {payment.receiptUrl && payment.status !== 'awaiting_approval' && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full">
                        <Paperclip size={9} /> comprovante
                      </span>
                    )}
                    {payment.paidDate && payment.status === 'paid' && (
                      <p className="text-muted-foreground text-[10px]">{formatDate(payment.paidDate)}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum pagamento encontrado</p>
                <p className="text-xs mt-1 opacity-70">Tente ajustar os filtros de busca</p>
              </div>
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
    )}
    </AnimatePresence>
  );
}
