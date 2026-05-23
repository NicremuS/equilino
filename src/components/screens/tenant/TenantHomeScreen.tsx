'use client';
import { motion } from 'framer-motion';
import { Home, FileText, Wrench, ChevronRight, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTenantProperty, useTenantContract, useTenantPayments, useTenantTickets } from '@/hooks/useTenantApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';

const STATUS_MAP = {
  paid:              { label: 'Pago',               color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  pending:           { label: 'Pendente',            color: 'text-amber-400',   bg: 'bg-amber-500/10',   icon: Clock        },
  overdue:           { label: 'Atrasado',            color: 'text-red-400',     bg: 'bg-red-500/10',     icon: AlertCircle  },
  partial:           { label: 'Parcial',             color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: Clock        },
  awaiting_approval: { label: 'Aguardando',          color: 'text-violet-400',  bg: 'bg-violet-500/10',  icon: Clock        },
  rejected:          { label: 'Rejeitado',           color: 'text-red-400',     bg: 'bg-red-500/10',     icon: AlertCircle  },
};

export function TenantHomeScreen() {
  const { user, setActiveTab } = useAppStore();

  const { data: property, isLoading: loadingProp, isError: errProp, refetch: refetchProp } = useTenantProperty();
  const { data: contract, isLoading: loadingCon } = useTenantContract();
  const { data: payments, isLoading: loadingPay } = useTenantPayments();
  const { data: tickets } = useTenantTickets();

  const nextPayment = payments?.find(p => p.status === 'pending' || p.status === 'overdue');
  const openTickets = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length ?? 0;

  if (errProp) return <ApiErrorState onRetry={refetchProp} />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-muted-foreground text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-foreground">
          {user?.name.split(' ')[0]} <span className="text-emerald-400">👋</span>
        </h1>
      </motion.div>

      {/* Property card */}
      {loadingProp ? (
        <ListItemSkeleton count={1} />
      ) : property ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card"
        >
          {property.image && (
            <div className="h-36 w-full overflow-hidden">
              <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Home size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-semibold text-sm truncate">{property.name}</p>
                <p className="text-muted-foreground text-xs truncate">{property.address}</p>
                <p className="text-muted-foreground text-xs">{property.city}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              {property.bedrooms && (
                <span className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-2 py-1">
                  {property.bedrooms} quartos
                </span>
              )}
              <span className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-2 py-1">
                {property.area} m²
              </span>
              <span className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-2 py-1">
                {property.bathrooms} banheiro{(property.bathrooms ?? 0) > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Next payment */}
      {(loadingPay) ? (
        <ListItemSkeleton count={1} />
      ) : nextPayment ? (
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => setActiveTab('payments')}
          className="w-full premium-surface rounded-2xl p-4 flex items-center gap-3 hover:bg-muted/60 transition-colors text-left"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${STATUS_MAP[nextPayment.status].bg}`}>
            {(() => { const Icon = STATUS_MAP[nextPayment.status].icon; return <Icon size={18} className={STATUS_MAP[nextPayment.status].color} />; })()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-sm">{nextPayment.month}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Calendar size={11} className="text-muted-foreground" />
              <p className="text-muted-foreground text-xs">
                Vence {formatDate(nextPayment.dueDate)}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-foreground font-bold text-base">{formatCurrency(nextPayment.amount)}</p>
            <span className={`text-xs font-medium ${STATUS_MAP[nextPayment.status].color}`}>
              {STATUS_MAP[nextPayment.status].label}
            </span>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="premium-surface rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <p className="text-foreground text-sm font-medium">Nenhum pagamento pendente</p>
        </motion.div>
      )}

      {/* Contract summary */}
      {loadingCon ? <ListItemSkeleton count={1} /> : contract ? (
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={() => setActiveTab('contract')}
          className="w-full premium-surface rounded-2xl p-4 flex items-center gap-3 hover:bg-muted/60 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-sm">Contrato ativo</p>
            <p className="text-muted-foreground text-xs">
              Vence em {formatDate(contract.endDate)} · Índice {contract.adjustmentIndex}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </motion.button>
      ) : null}

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <button
          onClick={() => setActiveTab('maintenance')}
          className="premium-surface rounded-2xl p-4 flex flex-col items-start gap-2 hover:bg-muted/60 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Wrench size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">Manutenção</p>
            <p className="text-muted-foreground text-xs">
              {openTickets > 0 ? `${openTickets} em aberto` : 'Sem chamados'}
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('contract')}
          className="premium-surface rounded-2xl p-4 flex flex-col items-start gap-2 hover:bg-muted/60 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <FileText size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">Contrato</p>
            <p className="text-muted-foreground text-xs">Ver detalhes</p>
          </div>
        </button>
      </motion.div>
    </div>
  );
}
