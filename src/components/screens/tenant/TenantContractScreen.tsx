'use client';
import { motion } from 'framer-motion';
import { FileText, Calendar, DollarSign, Shield, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useTenantContract, useTenantProperty } from '@/hooks/useTenantApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ListItemSkeleton, ApiErrorState } from '@/components/shared/LoadingSkeleton';

const STATUS_CONFIG = {
  active:     { label: 'Ativo',          color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  expiring:   { label: 'Próximo ao venc.', color: 'text-amber-400',  bg: 'bg-amber-500/10',  icon: Clock },
  expired:    { label: 'Expirado',       color: 'text-red-400',     bg: 'bg-red-500/10',    icon: AlertTriangle },
  terminated: { label: 'Rescindido',     color: 'text-muted-foreground', bg: 'bg-muted/60', icon: AlertTriangle },
};

const GUARANTEE_LABELS = {
  deposit:   'Depósito caução',
  guarantor: 'Fiador',
  insurance: 'Seguro fiança',
};

export function TenantContractScreen() {
  const { data: contract, isLoading: loadingCon, isError, refetch } = useTenantContract();
  const { data: property, isLoading: loadingProp } = useTenantProperty();

  if (loadingCon || loadingProp) return <ListItemSkeleton count={4} />;
  if (isError) return <ApiErrorState onRetry={refetch} />;

  if (!contract) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <FileText size={44} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">Nenhum contrato ativo encontrado.</p>
      </div>
    );
  }

  const s = STATUS_CONFIG[contract.status];
  const StatusIcon = s.icon;

  const startDate = new Date(contract.startDate);
  const endDate = new Date(contract.endDate);
  const totalMonths = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const elapsed = Math.round((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const progress = Math.min(100, Math.max(0, (elapsed / totalMonths) * 100));

  return (
    <div className="space-y-5 pb-4">
      <motion.h1
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground"
      >
        Contrato
      </motion.h1>

      {/* Status card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="premium-surface rounded-2xl p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
            <StatusIcon size={20} className={s.color} />
          </div>
          <div>
            <p className="text-foreground font-bold">Contrato de locação</p>
            <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(contract.startDate)}</span>
          <span>{formatDate(contract.endDate)}</span>
        </div>
        <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-emerald-500 rounded-full"
          />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1.5">{Math.round(progress)}% do período concluído</p>
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="premium-surface rounded-2xl divide-y divide-border overflow-hidden"
      >
        {[
          { icon: DollarSign, color: 'text-emerald-400', label: 'Aluguel mensal', value: formatCurrency(contract.rentAmount) },
          { icon: Calendar, color: 'text-blue-400', label: 'Início', value: formatDate(contract.startDate) },
          { icon: Calendar, color: 'text-orange-400', label: 'Término', value: formatDate(contract.endDate) },
          { icon: Shield, color: 'text-violet-400', label: 'Garantia', value: GUARANTEE_LABELS[contract.guaranteeType] },
          ...(contract.depositAmount > 0
            ? [{ icon: DollarSign, color: 'text-slate-400', label: 'Depósito caução', value: formatCurrency(contract.depositAmount) }]
            : []),
          { icon: FileText, color: 'text-slate-400', label: 'Índice de reajuste', value: contract.adjustmentIndex },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
              <Icon size={15} className={color} />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">{label}</p>
              <p className="text-foreground font-semibold text-sm">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Property */}
      {property && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="premium-surface rounded-2xl p-4"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Imóvel</p>
          <p className="text-foreground font-semibold">{property.name}</p>
          <p className="text-muted-foreground text-sm">{property.address}</p>
          <p className="text-muted-foreground text-sm">{property.city}</p>
        </motion.div>
      )}

      {/* Clauses */}
      {contract.clauses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="premium-surface rounded-2xl p-4"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Cláusulas</p>
          <ul className="space-y-2">
            {contract.clauses.map((clause, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-emerald-400 mt-0.5">•</span>
                {clause}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
