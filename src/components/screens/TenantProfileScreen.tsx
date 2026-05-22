'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Phone, Mail, MessageCircle,
  Calendar, FileText, Home, Wrench, ClipboardCheck,
  CheckCircle2, AlertCircle, Clock, XCircle, MinusCircle,
  MapPin, Shield, CreditCard, Award, Star,
  Building2, User, Hash, TrendingUp, ChevronRight,
} from 'lucide-react';
import {
  useProperties, useContracts, usePayments,
  useTickets, useInspections,
} from '@/hooks/useApi';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import { PaymentProfileScreen } from './PaymentProfileScreen';
import type {
  Tenant, Payment, PaymentStatus, TicketPriority, TicketStatus,
  ContractStatus, InspectionStatus, InspectionType,
} from '@/types';

// ─── Configs ──────────────────────────────────────────────────────────────────

const paymentStatusConfig: Record<PaymentStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  paid:    { label: 'Pago',     icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
  pending: { label: 'Pendente', icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  overdue: { label: 'Atrasado', icon: AlertCircle,  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  partial: { label: 'Parcial',  icon: MinusCircle,  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
};

const ticketPriorityConfig: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low:    { label: 'Baixa',   color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  medium: { label: 'Média',   color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  high:   { label: 'Alta',    color: 'text-orange-400', bg: 'bg-orange-500/10' },
  urgent: { label: 'Urgente', color: 'text-red-400',    bg: 'bg-red-500/10'    },
};

const ticketStatusConfig: Record<TicketStatus, { label: string; icon: React.ElementType; color: string }> = {
  open:        { label: 'Aberto',      icon: AlertCircle,  color: 'text-yellow-400' },
  in_progress: { label: 'Em andamento', icon: Clock,       color: 'text-blue-400'   },
  resolved:    { label: 'Resolvido',   icon: CheckCircle2, color: 'text-green-400'  },
  closed:      { label: 'Encerrado',   icon: XCircle,      color: 'text-gray-500'   },
};

const contractStatusConfig: Record<ContractStatus, { label: string; color: string; bg: string; border: string }> = {
  active:     { label: 'Ativo',      color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25'  },
  expiring:   { label: 'Vencendo',   color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25' },
  expired:    { label: 'Expirado',   color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25'    },
  terminated: { label: 'Rescindido', color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/25'   },
};

const inspectionTypeConfig: Record<InspectionType, { label: string; color: string; bg: string }> = {
  entrada:  { label: 'Entrada',   color: 'text-violet-400', bg: 'bg-violet-500/15' },
  saida:    { label: 'Saída',     color: 'text-orange-400', bg: 'bg-orange-500/15' },
  periodica: { label: 'Periódica', color: 'text-blue-400',  bg: 'bg-blue-500/15'   },
};

const inspectionStatusConfig: Record<InspectionStatus, { label: string; color: string }> = {
  agendada:     { label: 'Agendada',     color: 'text-blue-400'   },
  em_andamento: { label: 'Em andamento', color: 'text-yellow-400' },
  concluida:    { label: 'Concluída',    color: 'text-green-400'  },
  cancelada:    { label: 'Cancelada',    color: 'text-red-400'    },
};

const categoryLabel: Record<string, string> = {
  plumbing:   'Hidráulico',
  electrical: 'Elétrico',
  structural: 'Estrutural',
  appliance:  'Eletrodoméstico',
  other:      'Outro',
};

const guaranteeLabel: Record<string, string> = {
  deposit:   'Depósito Caução',
  guarantor: 'Fiador',
  insurance: 'Seguro Fiança',
};

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 85 ? '#22C55E' : score >= 65 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1F2937" strokeWidth={5} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - fill }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.4 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none" style={{ fontSize: size * 0.24, color }}>{score}</span>
        <span className="text-gray-500 leading-none mt-0.5" style={{ fontSize: size * 0.14 }}>score</span>
      </div>
    </div>
  );
}

// ─── History dot ─────────────────────────────────────────────────────────────

function HistoryDot({ status, month }: { status: PaymentStatus; month: string }) {
  const cfg = paymentStatusConfig[status];
  const Icon = cfg.icon;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-8 h-8 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
        <Icon size={12} className={cfg.color} />
      </div>
      <span className="text-[9px] text-gray-600 text-center leading-tight">{month}</span>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'resumo' | 'pagamentos' | 'chamados' | 'vistorias';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'resumo',     label: 'Resumo',    icon: User          },
  { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard   },
  { id: 'chamados',   label: 'Chamados',  icon: Wrench        },
  { id: 'vistorias',  label: 'Vistorias', icon: ClipboardCheck },
];

// ─── Resumo tab ───────────────────────────────────────────────────────────────

function ResumoTab({ tenant }: { tenant: Tenant }) {
  const { data: properties = [] } = useProperties();
  const { data: contracts = [] } = useContracts();
  const { data: payments = [] } = usePayments();
  const { data: tickets = [] } = useTickets();

  const property = properties.find(p => p.id === tenant.propertyId);
  const contract = contracts.find(c => c.id === tenant.contractId);
  const tenantPayments = payments.filter(p => p.tenantId === tenant.id);

  const now = new Date();
  const joinedDate = new Date(tenant.joinedAt);
  const months = Math.max(1,
    (now.getFullYear() - joinedDate.getFullYear()) * 12 +
    (now.getMonth() - joinedDate.getMonth())
  );
  const totalPaid = tenantPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const paidOnTime = tenant.paymentHistory.filter(p => p === 'paid').length;
  const paymentRate = Math.round((paidOnTime / Math.max(1, tenant.paymentHistory.length)) * 100);

  const daysUntilEnd = contract
    ? Math.ceil((new Date(contract.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const contractCfg = contract ? contractStatusConfig[contract.status] : null;
  const openTickets = tickets.filter(t => t.tenantId === tenant.id && t.status !== 'resolved' && t.status !== 'closed').length;

  return (
    <div className="space-y-4">
      {/* Score + rate */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="premium-surface rounded-3xl p-5"
      >
        <div className="flex items-center gap-5">
          <ScoreRing score={tenant.score} size={80} />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-1">Score de pagamento</p>
              <p className="text-white text-sm font-bold">
                {tenant.score >= 85 ? 'Excelente pagador' : tenant.score >= 65 ? 'Bom pagador' : 'Atenção necessária'}
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Pontualidade</span>
                <span className="text-white text-xs font-bold">{paymentRate}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/70 dark:bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${paymentRate}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{ background: paymentRate >= 85 ? '#22C55E' : paymentRate >= 65 ? '#F59E0B' : '#EF4444' }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Meses como inquilino', value: `${months}`, icon: Calendar, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Total pago', value: formatCurrency(totalPaid), icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Chamados abertos', value: String(openTickets), icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
              className={`rounded-2xl border p-3 ${stat.bg}`}
            >
              <Icon size={14} className={`${stat.color} mb-1.5`} />
              <p className={`text-base font-bold leading-none ${stat.color}`}>{stat.value}</p>
              <p className="text-muted-foreground text-[10px] mt-1 leading-tight">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Payment history dots */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="premium-surface rounded-2xl p-4"
      >
        <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-3">Últimos {tenant.paymentHistory.length} meses</p>
        <div className="flex gap-2 justify-between">
          {tenant.paymentHistory.map((status, i) => {
            const monthsAgo = tenant.paymentHistory.length - 1 - i;
            const d = new Date(now);
            d.setMonth(d.getMonth() - monthsAgo);
            const label = d.toLocaleString('pt-BR', { month: 'short' });
            return <HistoryDot key={i} status={status} month={label} />;
          })}
        </div>
      </motion.div>

      {/* Contract */}
      {contract && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="premium-surface rounded-2xl p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-white text-sm font-semibold">Contrato ativo</p>
            {contractCfg && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${contractCfg.bg} ${contractCfg.border} ${contractCfg.color}`}>
                {contractCfg.label}
              </span>
            )}
          </div>

          {property && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 dark:bg-white/3 border border-premium">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
                {property.image && <img src={property.image} alt="" className="w-full h-full object-cover opacity-70" />}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{property.name}</p>
                <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5"><MapPin size={9} />{property.city}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-0.5">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Aluguel mensal</p>
              <p className="text-white font-bold text-base">{formatCurrency(contract.rentAmount)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Depósito</p>
              <p className="text-white font-bold text-base">{formatCurrency(contract.depositAmount)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Índice de reajuste</p>
              <p className="text-white font-semibold">{contract.adjustmentIndex}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Garantia</p>
              <p className="text-white font-semibold">{guaranteeLabel[contract.guaranteeType]}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 p-2.5 rounded-xl bg-muted/60 dark:bg-white/3 border border-premium">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-0.5">Início</p>
              <p className="text-white text-xs font-semibold">{formatDate(contract.startDate)}</p>
            </div>
            <div className="flex-1 p-2.5 rounded-xl bg-muted/60 dark:bg-white/3 border border-premium">
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-0.5">Término</p>
              <p className="text-white text-xs font-semibold">{formatDate(contract.endDate)}</p>
            </div>
          </div>

          {daysUntilEnd !== null && daysUntilEnd > 0 && daysUntilEnd <= 90 && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <AlertCircle size={13} className="text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-300 text-xs font-medium">Contrato vence em {daysUntilEnd} dias</p>
            </div>
          )}

          {contract.clauses.length > 0 && (
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-2">Cláusulas especiais</p>
              <div className="space-y-1.5">
                {contract.clauses.map((clause, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-400 flex-shrink-0 mt-1.5" />
                    <p className="text-gray-300 text-xs leading-relaxed">{clause}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Pagamentos tab ───────────────────────────────────────────────────────────

function PagamentosTab({ tenant, onSelectPayment }: { tenant: Tenant; onSelectPayment: (p: Payment) => void }) {
  const { data: allPayments = [] } = usePayments();

  const payments = allPayments
    .filter(p => p.tenantId === tenant.id)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const totalPago = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPendente = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3.5">
          <p className="text-green-400 text-[10px] uppercase tracking-wider font-semibold mb-1">Total recebido</p>
          <p className="text-green-300 text-lg font-bold">{formatCurrency(totalPago)}</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3.5">
          <p className="text-yellow-400 text-[10px] uppercase tracking-wider font-semibold mb-1">A receber</p>
          <p className="text-yellow-300 text-lg font-bold">{formatCurrency(totalPendente)}</p>
        </div>
      </div>

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
                onClick={() => onSelectPayment(payment)}
                className={`rounded-2xl border p-4 cursor-pointer hover:brightness-110 transition-all ${cfg.bg} ${cfg.border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${cfg.bg} border ${cfg.border} flex-shrink-0`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{formatCurrency(payment.amount)}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{payment.month}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} flex-shrink-0`}>
                      {cfg.label}
                    </span>
                    <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-premium flex items-center justify-between text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={9} /> Venc.: {formatDate(payment.dueDate)}
                  </span>
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

      {/* Historical dots */}
      <div className="premium-surface rounded-2xl p-4">
        <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-3">Histórico resumido</p>
        <div className="grid grid-cols-6 gap-2">
          {tenant.paymentHistory.map((status, i) => {
            const cfg = paymentStatusConfig[status];
            const Icon = cfg.icon;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                  <Icon size={14} className={cfg.color} />
                </div>
                <span className={`text-[9px] font-semibold ${cfg.color}`}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Chamados tab ─────────────────────────────────────────────────────────────

function ChamadosTab({ tenant }: { tenant: Tenant }) {
  const { data: allTickets = [] } = useTickets();

  const tickets = allTickets
    .filter(t => t.tenantId === tenant.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const totalCost = tickets.reduce((s, t) => s + (t.cost ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Abertos', value: open, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Resolvidos', value: resolved, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Custo total', value: formatCurrency(totalCost), color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl border p-3 ${stat.bg}`}>
            <p className={`text-base font-bold leading-none ${stat.color}`}>{stat.value}</p>
            <p className="text-muted-foreground text-[10px] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Wrench size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum chamado registrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket, i) => {
            const priCfg = ticketPriorityConfig[ticket.priority];
            const staCfg = ticketStatusConfig[ticket.status];
            const StaIcon = staCfg.icon;
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="premium-surface rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${priCfg.bg} flex-shrink-0`}>
                    <Wrench size={13} className={priCfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-tight">{ticket.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priCfg.bg} ${priCfg.color}`}>
                        {priCfg.label}
                      </span>
                      <span className={`text-[10px] font-semibold flex items-center gap-1 ${staCfg.color}`}>
                        <StaIcon size={9} /> {staCfg.label}
                      </span>
                      <span className="text-[10px] text-gray-600">{categoryLabel[ticket.category]}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-premium flex items-center justify-between text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={9} /> {formatDate(ticket.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    {ticket.assignedTo && (
                      <span className="flex items-center gap-1"><User size={9} /> {ticket.assignedTo}</span>
                    )}
                    {ticket.cost && (
                      <span className="text-orange-400 font-semibold">{formatCurrency(ticket.cost)}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Vistorias tab ────────────────────────────────────────────────────────────

function VistoriasTab({ tenant }: { tenant: Tenant }) {
  const { data: allInspections = [] } = useInspections();

  const inspections = allInspections
    .filter(i => i.tenantId === tenant.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-4">
      {inspections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ClipboardCheck size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma vistoria registrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inspections.map((insp, i) => {
            const typeCfg = inspectionTypeConfig[insp.type];
            const staCfg = inspectionStatusConfig[insp.status];
            const scoreColor = insp.generalScore >= 80 ? '#22C55E' : insp.generalScore >= 55 ? '#F59E0B' : '#EF4444';
            return (
              <motion.div
                key={insp.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="premium-surface rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  {insp.status === 'concluida' && insp.generalScore > 0 ? (
                    <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
                      <svg width={44} height={44} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={22} cy={22} r={18} fill="none" stroke="#1F2937" strokeWidth={4} />
                        <motion.circle
                          cx={22} cy={22} r={18} fill="none"
                          stroke={scoreColor} strokeWidth={4} strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 18}
                          initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 18 - (insp.generalScore / 100) * 2 * Math.PI * 18 }}
                          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 + i * 0.1 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[11px] font-bold" style={{ color: scoreColor }}>{insp.generalScore}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-muted/70 dark:bg-white/5 flex-shrink-0">
                      <ClipboardCheck size={16} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                      <span className={`text-[10px] font-semibold ${staCfg.color}`}>{staCfg.label}</span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1.5 flex items-center gap-1">
                      <User size={9} /> {insp.inspector}
                    </p>
                    {insp.generalObservations && (
                      <p className="text-muted-foreground text-[10px] mt-1 leading-relaxed line-clamp-2">{insp.generalObservations}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                        <Calendar size={9} />
                        {formatDate(insp.completedDate ?? insp.scheduledDate)}
                      </span>
                      <span className="text-muted-foreground text-[10px]">{insp.rooms.length} cômodos</span>
                    </div>
                  </div>
                </div>

                {insp.status === 'concluida' && (
                  <div className="mt-3 pt-3 border-t border-premium flex gap-3">
                    <div className={`flex items-center gap-1.5 text-[10px] font-medium ${insp.signedByTenant ? 'text-green-400' : 'text-gray-600'}`}>
                      <CheckCircle2 size={10} /> Inquilino {insp.signedByTenant ? 'assinou' : 'pendente'}
                    </div>
                    <div className={`flex items-center gap-1.5 text-[10px] font-medium ${insp.signedByOwner ? 'text-green-400' : 'text-gray-600'}`}>
                      <Shield size={10} /> Proprietário {insp.signedByOwner ? 'assinou' : 'pendente'}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TenantProfileScreenProps {
  tenant: Tenant;
  onBack: () => void;
}

export function TenantProfileScreen({ tenant, onBack }: TenantProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('resumo');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const { data: properties = [] } = useProperties();
  const property = properties.find(p => p.id === tenant.propertyId);

  const scoreColor = tenant.score >= 85 ? 'text-green-400' : tenant.score >= 65 ? 'text-yellow-400' : 'text-red-400';

  if (selectedPayment) {
    return (
      <PaymentProfileScreen
        payment={selectedPayment}
        onBack={() => setSelectedPayment(null)}
      />
    );
  }

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
          <p className="text-foreground text-base font-bold truncate">{tenant.name}</p>
          <p className="text-muted-foreground text-xs">{property?.name ?? 'Sem imóvel ativo'}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tenant.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
          {tenant.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="premium-surface rounded-3xl overflow-hidden"
      >
        {/* Top gradient band */}
        <div className="h-16 bg-gradient-to-r from-violet-600/30 via-violet-500/20 to-blue-600/20" />

        <div className="px-5 pb-5">
          {/* Avatar */}
          <div className="-mt-8 mb-3 flex items-end justify-between">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-xl font-bold text-white border-4 border-[#111827] flex-shrink-0 shadow-lg">
              {getInitials(tenant.name)}
            </div>
            {/* Contact actions */}
            <div className="flex gap-2">
              {[
                { icon: Phone,          color: 'text-green-400',  bg: 'bg-green-500/15',  href: `tel:${tenant.phone}` },
                { icon: MessageCircle,  color: 'text-green-400',  bg: 'bg-green-500/15',  href: `https://wa.me/${tenant.phone.replace(/\D/g, '')}` },
                { icon: Mail,           color: 'text-blue-400',   bg: 'bg-blue-500/15',   href: `mailto:${tenant.email}` },
              ].map(({ icon: Icon, color, bg, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center hover:opacity-80 transition-opacity`}
                >
                  <Icon size={15} className={color} />
                </a>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2">
            <div>
              <h3 className="text-foreground text-lg font-bold leading-tight">{tenant.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <Mail size={10} /> {tenant.email}
                </p>
              </div>
              <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                <Phone size={10} /> {tenant.phone}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1 border-t border-premium">
              <div className="flex items-center gap-1.5">
                <Hash size={11} className="text-gray-600" />
                <span className="text-muted-foreground text-xs font-mono">{tenant.cpf}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={11} className="text-gray-600" />
                <span className="text-muted-foreground text-xs">Desde {formatDate(tenant.joinedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
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
          {activeTab === 'resumo'     && <ResumoTab     tenant={tenant} />}
          {activeTab === 'pagamentos' && <PagamentosTab tenant={tenant} onSelectPayment={setSelectedPayment} />}
          {activeTab === 'chamados'   && <ChamadosTab   tenant={tenant} />}
          {activeTab === 'vistorias'  && <VistoriasTab  tenant={tenant} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
