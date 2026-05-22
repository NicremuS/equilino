'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, FileText, Calendar, CreditCard, Users,
  CheckCircle2, AlertCircle, Clock, XCircle, MinusCircle,
  MapPin, Shield, TrendingUp, Bed, Bath, Maximize,
  Star, Phone, Mail, Building2, Hash, Award,
} from 'lucide-react';
import { useTenants, useProperties, usePayments } from '@/hooks/useApi';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import type { Contract, PaymentStatus, ContractStatus } from '@/types';

// ─── Configs ──────────────────────────────────────────────────────────────────

const contractStatusConfig: Record<ContractStatus, { label: string; color: string; bg: string; border: string }> = {
  active:     { label: 'Ativo',      color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25'  },
  expiring:   { label: 'Vencendo',   color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25' },
  expired:    { label: 'Expirado',   color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25'    },
  terminated: { label: 'Rescindido', color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/25'   },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  paid:    { label: 'Pago',     icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
  pending: { label: 'Pendente', icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  overdue: { label: 'Atrasado', icon: AlertCircle,  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  partial: { label: 'Parcial',  icon: MinusCircle,  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
};

const guaranteeLabel: Record<string, string> = {
  deposit:   'Depósito Caução',
  guarantor: 'Fiador',
  insurance: 'Seguro Fiança',
};

const guaranteeIcon: Record<string, React.ElementType> = {
  deposit:   CreditCard,
  guarantor: Users,
  insurance: Shield,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function contractDurationMonths(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function contractProgress(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'detalhes' | 'pagamentos' | 'partes';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'detalhes',   label: 'Detalhes',  icon: FileText   },
  { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
  { id: 'partes',     label: 'Partes',    icon: Users      },
];

// ─── Detalhes tab ─────────────────────────────────────────────────────────────

function DetalhesTab({ contract }: { contract: Contract }) {
  const days = daysUntil(contract.endDate);
  const pct  = contractProgress(contract.startDate, contract.endDate);
  const duration = contractDurationMonths(contract.startDate, contract.endDate);
  const GuaranteeIcon = guaranteeIcon[contract.guaranteeType];

  const totalRevenue = duration * contract.rentAmount;

  return (
    <div className="space-y-4">
      {/* Timeline progress */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="premium-surface rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-sm font-semibold">Duração do contrato</p>
          <span className="text-muted-foreground text-xs">{duration} meses</span>
        </div>

        <div className="relative h-2 rounded-full bg-muted/70 dark:bg-white/5 overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className={`h-full rounded-full ${
              pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-violet-500'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Início</p>
            <p className="text-white font-semibold mt-0.5">{formatDate(contract.startDate)}</p>
          </div>
          <div className="text-center px-3">
            <p className={`text-2xl font-bold ${pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-yellow-400' : 'text-violet-400'}`}>
              {pct}%
            </p>
            <p className="text-muted-foreground text-[10px]">decorrido</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Término</p>
            <p className="text-white font-semibold mt-0.5">{formatDate(contract.endDate)}</p>
          </div>
        </div>

        {days > 0 ? (
          <div className={`mt-3 flex items-center gap-2 p-2.5 rounded-xl border ${
            days <= 30  ? 'bg-red-500/10 border-red-500/20' :
            days <= 90  ? 'bg-yellow-500/10 border-yellow-500/20' :
                          'bg-green-500/10 border-green-500/20'
          }`}>
            <Calendar size={12} className={days <= 30 ? 'text-red-400' : days <= 90 ? 'text-yellow-400' : 'text-green-400'} />
            <p className={`text-xs font-semibold ${days <= 30 ? 'text-red-300' : days <= 90 ? 'text-yellow-300' : 'text-green-300'}`}>
              {days <= 30 ? `⚠️ Vence em ${days} dias — renove com urgência` :
               days <= 90 ? `Vence em ${days} dias — agende a renovação` :
               `${days} dias restantes`}
            </p>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <XCircle size={12} className="text-red-400" />
            <p className="text-red-300 text-xs font-semibold">Contrato vencido há {Math.abs(days)} dias</p>
          </div>
        )}
      </motion.div>

      {/* Financial grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Aluguel mensal',   value: formatCurrency(contract.rentAmount),   icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Depósito caução',  value: formatCurrency(contract.depositAmount), icon: Shield,     color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'    },
          { label: 'Receita estimada', value: formatCurrency(totalRevenue),           icon: Award,      color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20'  },
          { label: 'Índice de reajuste', value: contract.adjustmentIndex,             icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }}
              className={`rounded-2xl border p-3.5 ${stat.bg}`}
            >
              <Icon size={14} className={`${stat.color} mb-2`} />
              <p className={`text-base font-bold leading-none ${stat.color}`}>{stat.value}</p>
              <p className="text-muted-foreground text-[10px] mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Guarantee */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="premium-surface rounded-2xl p-4 flex items-center gap-4"
      >
        <div className="p-3 rounded-xl bg-violet-500/10 flex-shrink-0">
          <GuaranteeIcon size={18} className="text-violet-400" />
        </div>
        <div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-0.5">Tipo de garantia</p>
          <p className="text-white text-sm font-bold">{guaranteeLabel[contract.guaranteeType]}</p>
          {contract.depositAmount > 0 && (
            <p className="text-muted-foreground text-xs mt-0.5">Valor: {formatCurrency(contract.depositAmount)}</p>
          )}
        </div>
      </motion.div>

      {/* Clauses */}
      {contract.clauses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="premium-surface rounded-2xl p-4"
        >
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-3">Cláusulas especiais</p>
          <div className="space-y-2.5">
            {contract.clauses.map((clause, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-violet-400 text-[9px] font-bold">{i + 1}</span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">{clause}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Signed info */}
      {contract.signedAt && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-green-500/20 bg-green-500/5 p-3.5 flex items-center gap-3"
        >
          <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 text-xs font-semibold">Contrato assinado</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">{formatDate(contract.signedAt)}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Pagamentos tab ───────────────────────────────────────────────────────────

function PagamentosTab({ contract }: { contract: Contract }) {
  const { data: allPayments = [] } = usePayments();

  const payments = allPayments
    .filter(p => p.contractId === contract.id)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const totalRecebido = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPendente = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
  const adimplencia   = payments.length > 0
    ? Math.round((payments.filter(p => p.status === 'paid').length / payments.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3.5">
          <p className="text-green-400 text-[10px] uppercase tracking-wider font-semibold mb-1">Recebido</p>
          <p className="text-green-300 text-lg font-bold">{formatCurrency(totalRecebido)}</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3.5">
          <p className="text-yellow-400 text-[10px] uppercase tracking-wider font-semibold mb-1">Pendente</p>
          <p className="text-yellow-300 text-lg font-bold">{formatCurrency(totalPendente)}</p>
        </div>
      </div>

      {/* Adimplência */}
      <div className="premium-surface rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white text-sm font-semibold">Adimplência</p>
          <span className={`text-sm font-bold ${adimplencia >= 90 ? 'text-green-400' : adimplencia >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            {adimplencia}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted/70 dark:bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${adimplencia}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="h-full rounded-full"
            style={{ background: adimplencia >= 90 ? '#22C55E' : adimplencia >= 70 ? '#F59E0B' : '#EF4444' }}
          />
        </div>
        <p className="text-muted-foreground text-[10px] mt-1.5">
          {payments.filter(p => p.status === 'paid').length} de {payments.length} pagamentos em dia
        </p>
      </div>

      {/* Payment list */}
      {payments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CreditCard size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum pagamento registrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment, i) => {
            const cfg = paymentStatusConfig[payment.status];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${cfg.bg} border ${cfg.border} flex-shrink-0`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{formatCurrency(payment.amount)}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{payment.month}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} flex-shrink-0`}>
                    {cfg.label}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-premium flex items-center justify-between text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={9} /> Venc.: {formatDate(payment.dueDate)}</span>
                  {payment.paidDate && (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle2 size={9} /> Pago em {formatDate(payment.paidDate)}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Partes tab ───────────────────────────────────────────────────────────────

function PartesTab({ contract }: { contract: Contract }) {
  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();

  const tenant   = tenants.find(t => t.id === contract.tenantId);
  const property = properties.find(p => p.id === contract.propertyId);

  const scoreColor = tenant
    ? tenant.score >= 85 ? '#22C55E' : tenant.score >= 65 ? '#F59E0B' : '#EF4444'
    : '#6B7280';

  return (
    <div className="space-y-4">
      {/* Tenant card */}
      {tenant ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="premium-surface rounded-2xl overflow-hidden"
        >
          <div className="h-1.5 bg-gradient-to-r from-violet-500 to-violet-700" />
          <div className="p-4 space-y-3">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Inquilino</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {getInitials(tenant.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold">{tenant.name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{tenant.email}</p>
                <p className="text-muted-foreground text-xs">{tenant.phone}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 justify-end mb-1">
                  <Star size={11} className="text-yellow-400" fill="currentColor" />
                  <span className="text-xs font-bold" style={{ color: scoreColor }}>{tenant.score}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tenant.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
                  {tenant.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            {/* Score bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[10px]">Score de pagamento</span>
                <span className="text-[10px] font-bold" style={{ color: scoreColor }}>{tenant.score} pts</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/70 dark:bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tenant.score}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: scoreColor }}
                />
              </div>
            </div>

            {/* Last 6 months dots */}
            <div className="flex gap-1.5">
              {tenant.paymentHistory.slice(-6).map((status, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full ${
                    status === 'paid'    ? 'bg-green-500' :
                    status === 'overdue' ? 'bg-red-500'   :
                    status === 'partial' ? 'bg-orange-500' :
                                          'bg-yellow-500'
                  }`}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-[10px]">Últimos 6 meses de pagamento</p>

            {/* CPF + since */}
            <div className="pt-1 border-t border-premium flex gap-4 text-[10px] text-gray-500">
              <span>CPF: <span className="text-gray-400 font-mono">{tenant.cpf}</span></span>
              <span>Desde {formatDate(tenant.joinedAt)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <a href={`tel:${tenant.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                <Phone size={12} /> Ligar
              </a>
              <a href={`mailto:${tenant.email}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Mail size={12} /> E-mail
              </a>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Users size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Inquilino não encontrado</p>
        </div>
      )}

      {/* Property card */}
      {property ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="premium-surface rounded-2xl overflow-hidden"
        >
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700" />
          <div className="p-4 space-y-3">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Imóvel</p>

            <div className="relative h-32 rounded-xl overflow-hidden bg-gray-800">
              {property.image && (
                <img src={property.image} alt={property.name} className="w-full h-full object-cover opacity-80" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-white text-sm font-bold truncate">{property.name}</p>
                <p className="text-gray-300 text-[10px] flex items-center gap-1 mt-0.5">
                  <MapPin size={9} /> {property.address}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {property.bedrooms && (
                <div className="rounded-xl bg-muted/60 dark:bg-white/3 p-2">
                  <Bed size={12} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-white text-xs font-bold">{property.bedrooms}</p>
                  <p className="text-muted-foreground text-[10px]">Quartos</p>
                </div>
              )}
              {property.bathrooms && (
                <div className="rounded-xl bg-muted/60 dark:bg-white/3 p-2">
                  <Bath size={12} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-white text-xs font-bold">{property.bathrooms}</p>
                  <p className="text-muted-foreground text-[10px]">Banheiros</p>
                </div>
              )}
              <div className="rounded-xl bg-muted/60 dark:bg-white/3 p-2">
                <Maximize size={12} className="text-gray-400 mx-auto mb-1" />
                <p className="text-white text-xs font-bold">{property.area}</p>
                <p className="text-muted-foreground text-[10px]">m²</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Building2 size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Imóvel não encontrado</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ContractProfileScreenProps {
  contract: Contract;
  onBack: () => void;
}

export function ContractProfileScreen({ contract, onBack }: ContractProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('detalhes');
  const { data: tenants = [] } = useTenants();
  const { data: properties = [] } = useProperties();

  const tenant   = tenants.find(t => t.id === contract.tenantId);
  const property = properties.find(p => p.id === contract.propertyId);
  const statusCfg = contractStatusConfig[contract.status];
  const days = daysUntil(contract.endDate);
  const pct  = contractProgress(contract.startDate, contract.endDate);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25 }}
      className="space-y-5 pb-2"
    >
      {/* Back header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-muted/70 dark:bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-base font-bold truncate">{tenant?.name ?? 'Contrato'}</p>
          <p className="text-muted-foreground text-xs truncate">{property?.name ?? '—'}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="premium-surface rounded-3xl p-5 space-y-4"
      >
        {/* Icon + value + days */}
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-violet-500/15 flex-shrink-0">
            <FileText size={22} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-2xl font-bold">{formatCurrency(contract.rentAmount)}<span className="text-muted-foreground text-sm font-normal">/mês</span></p>
            <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
              <Hash size={10} /> {contract.id} · {contract.adjustmentIndex}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-2xl font-bold ${days <= 30 ? 'text-red-400' : days <= 90 ? 'text-yellow-400' : 'text-white'}`}>
              {days > 0 ? days : 0}
            </p>
            <p className="text-muted-foreground text-[10px]">dias rest.</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px]">{formatDate(contract.startDate)}</span>
            <span className={`text-[10px] font-bold ${pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-yellow-400' : 'text-violet-400'}`}>{pct}%</span>
            <span className="text-muted-foreground text-[10px]">{formatDate(contract.endDate)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/70 dark:bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
              className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-violet-500'}`}
            />
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <p className="text-white text-sm font-bold">{contractDurationMonths(contract.startDate, contract.endDate)}</p>
            <p className="text-muted-foreground text-[10px]">meses total</p>
          </div>
          <div className="text-center border-x border-premium">
            <p className="text-white text-sm font-bold">{formatCurrency(contract.depositAmount)}</p>
            <p className="text-muted-foreground text-[10px]">depósito</p>
          </div>
          <div className="text-center">
            <p className="text-white text-sm font-bold">{guaranteeLabel[contract.guaranteeType].split(' ')[0]}</p>
            <p className="text-muted-foreground text-[10px]">garantia</p>
          </div>
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                isActive
                  ? 'bg-violet-500 border-violet-500 text-white'
                  : 'border-border bg-card text-muted-foreground hover:border-violet-500/30 hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'detalhes'   && <DetalhesTab   contract={contract} />}
          {activeTab === 'pagamentos' && <PagamentosTab contract={contract} />}
          {activeTab === 'partes'     && <PartesTab     contract={contract} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
