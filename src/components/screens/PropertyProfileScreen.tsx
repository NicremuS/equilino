'use client';
import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, MapPin, Bed, Bath, Maximize, Building2,
  Home, Wrench, ClipboardCheck, CreditCard, User,
  CheckCircle2, AlertCircle, Clock, XCircle, MinusCircle,
  Calendar, Phone, TrendingUp, Star, Shield, ChevronRight,
  Layers, Hash,
} from 'lucide-react';
import { useTenants, useContracts, usePayments, useTickets, useInspections } from '@/hooks/useApi';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import { PaymentProfileScreen } from './PaymentProfileScreen';
import type {
  Property, Payment, PaymentStatus, TicketPriority, TicketStatus,
  InspectionStatus, InspectionType, PropertyStatus,
} from '@/types';

// ─── Configs ──────────────────────────────────────────────────────────────────

const propertyTypeLabel: Record<Property['type'], string> = {
  apartment:  'Apartamento',
  house:      'Casa',
  commercial: 'Comercial',
  studio:     'Studio',
};

const propertyStatusConfig: Record<PropertyStatus, { label: string; color: string; bg: string; border: string }> = {
  occupied:    { label: 'Ocupado',    color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/25'  },
  vacant:      { label: 'Vago',       color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/25'   },
  maintenance: { label: 'Manutenção', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/25' },
  reserved:    { label: 'Reservado',  color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/25' },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  paid:              { label: 'Pago',               icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
  pending:           { label: 'Pendente',            icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  overdue:           { label: 'Atrasado',            icon: AlertCircle,  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  partial:           { label: 'Parcial',             icon: MinusCircle,  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  awaiting_approval: { label: 'Aguard. aprovação',  icon: Clock,        color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  rejected:          { label: 'Rejeitado',           icon: AlertCircle,  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
};

const ticketPriorityConfig: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low:    { label: 'Baixa',   color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  medium: { label: 'Média',   color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  high:   { label: 'Alta',    color: 'text-orange-400', bg: 'bg-orange-500/10' },
  urgent: { label: 'Urgente', color: 'text-red-400',    bg: 'bg-red-500/10'    },
};

const ticketStatusConfig: Record<TicketStatus, { label: string; icon: React.ElementType; color: string }> = {
  open:        { label: 'Aberto',       icon: AlertCircle,  color: 'text-yellow-400' },
  in_progress: { label: 'Em andamento', icon: Clock,        color: 'text-blue-400'   },
  resolved:    { label: 'Resolvido',    icon: CheckCircle2, color: 'text-green-400'  },
  closed:      { label: 'Encerrado',    icon: XCircle,      color: 'text-gray-500'   },
};

const inspectionTypeConfig: Record<InspectionType, { label: string; color: string; bg: string }> = {
  entrada:   { label: 'Entrada',   color: 'text-violet-400', bg: 'bg-violet-500/15' },
  saida:     { label: 'Saída',     color: 'text-orange-400', bg: 'bg-orange-500/15' },
  periodica: { label: 'Periódica', color: 'text-blue-400',   bg: 'bg-blue-500/15'   },
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

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'geral' | 'financeiro' | 'manutencao' | 'vistorias';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'geral',       label: 'Geral',       icon: Home          },
  { id: 'financeiro',  label: 'Financeiro',  icon: CreditCard    },
  { id: 'manutencao',  label: 'Manutenção',  icon: Wrench        },
  { id: 'vistorias',   label: 'Vistorias',   icon: ClipboardCheck },
];

// ─── Geral tab ────────────────────────────────────────────────────────────────

function GeralTab({ property }: { property: Property }) {
  const { data: tenants = [] } = useTenants();
  const { data: contracts = [] } = useContracts();
  const tenant   = tenants.find(t => t.id === property.tenantId);
  const contract = contracts.find(c => c.id === property.contractId);
  const statusCfg = propertyStatusConfig[property.status];
  const [now] = useState(() => Date.now());

  const daysUntilEnd = contract
    ? Math.ceil((new Date(contract.endDate).getTime() - now) / 86_400_000)
    : null;

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Aluguel mensal', value: formatCurrency(property.rentAmount), icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Área',           value: `${property.area} m²`,               icon: Maximize,   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
          ...(property.bedrooms ? [{ label: 'Quartos', value: String(property.bedrooms), icon: Bed,    color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20'  }] : []),
          ...(property.bathrooms ? [{ label: 'Banheiros', value: String(property.bathrooms), icon: Bath, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' }] : []),
          ...(property.floor ? [{ label: 'Andar', value: `${property.floor}º`, icon: Layers, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' }] : []),
          { label: 'Tipo', value: propertyTypeLabel[property.type], icon: Building2, color: 'text-gray-300', bg: 'bg-gray-500/10 border-gray-500/20' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border p-3.5 ${stat.bg}`}
            >
              <Icon size={14} className={`${stat.color} mb-2`} />
              <p className={`text-lg font-bold leading-none ${stat.color}`}>{stat.value}</p>
              <p className="text-muted-foreground text-[10px] mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Address */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="premium-surface rounded-2xl p-4 flex items-center gap-3"
      >
        <div className="p-2.5 rounded-xl bg-violet-500/10 flex-shrink-0">
          <MapPin size={15} className="text-violet-400" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{property.address}</p>
          <p className="text-muted-foreground text-xs mt-0.5">{property.city}</p>
        </div>
      </motion.div>

      {/* Amenities */}
      {property.amenities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="premium-surface rounded-2xl p-4"
        >
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-3">Comodidades</p>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map(a => (
              <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/70 dark:bg-white/5 border border-white/8 text-gray-300 text-xs font-medium">
                <Star size={10} className="text-yellow-400" /> {a}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Current tenant */}
      {tenant ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="premium-surface rounded-2xl p-4 space-y-3"
        >
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Inquilino atual</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {getInitials(tenant.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">{tenant.name}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{tenant.email}</p>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Star size={11} fill="currentColor" />
              <span className="text-xs font-bold">{tenant.score}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${tenant.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
              <Phone size={12} /> {tenant.phone}
            </a>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl border border-dashed border-white/10 p-6 text-center"
        >
          <User size={24} className="mx-auto mb-2 text-gray-600" />
          <p className="text-gray-400 text-sm font-medium">Sem inquilino</p>
          <p className="text-muted-foreground text-xs mt-0.5">Imóvel disponível para locação</p>
        </motion.div>
      )}

      {/* Contract summary */}
      {contract && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="premium-surface rounded-2xl p-4 space-y-3"
        >
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Contrato</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-muted/60 dark:bg-white/3 border border-premium">
              <p className="text-muted-foreground text-[10px] font-semibold mb-0.5">Início</p>
              <p className="text-white text-xs font-semibold">{formatDate(contract.startDate)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/60 dark:bg-white/3 border border-premium">
              <p className="text-muted-foreground text-[10px] font-semibold mb-0.5">Término</p>
              <p className="text-white text-xs font-semibold">{formatDate(contract.endDate)}</p>
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="text-gray-500">Índice: <span className="text-white font-semibold">{contract.adjustmentIndex}</span></span>
            <span className="text-gray-500">Depósito: <span className="text-white font-semibold">{formatCurrency(contract.depositAmount)}</span></span>
          </div>
          {daysUntilEnd !== null && daysUntilEnd > 0 && daysUntilEnd <= 90 && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <AlertCircle size={12} className="text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-300 text-xs font-medium">Vence em {daysUntilEnd} dias</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Financeiro tab ───────────────────────────────────────────────────────────

function FinanceiroTab({ property, onSelectPayment }: { property: Property; onSelectPayment: (p: Payment) => void }) {
  const { data: allPayments = [] } = usePayments();
  const payments = allPayments
    .filter(p => p.propertyId === property.id)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const totalRecebido = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPendente = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
  const totalAtrasado = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3.5">
          <p className="text-green-400 text-[10px] uppercase tracking-wider font-semibold mb-1">Recebido</p>
          <p className="text-green-300 text-lg font-bold">{formatCurrency(totalRecebido)}</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3.5">
          <p className="text-yellow-400 text-[10px] uppercase tracking-wider font-semibold mb-1">Pendente</p>
          <p className="text-yellow-300 text-lg font-bold">{formatCurrency(totalPendente)}</p>
        </div>
        {totalAtrasado > 0 && (
          <div className="col-span-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 flex items-center gap-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 text-xs font-semibold">Valor em atraso</p>
              <p className="text-red-300 text-base font-bold">{formatCurrency(totalAtrasado)}</p>
            </div>
          </div>
        )}
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
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} flex-shrink-0`}>
                      {cfg.label}
                    </span>
                    <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-premium flex items-center justify-between text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={9} /> Venc.: {formatDate(payment.dueDate)}</span>
                  {payment.paidDate && (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle2 size={9} /> {formatDate(payment.paidDate)}
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

// ─── Manutenção tab ───────────────────────────────────────────────────────────

function ManutencaoTab({ property }: { property: Property }) {
  const { data: allTickets = [] } = useTickets();
  const tickets = allTickets
    .filter(t => t.propertyId === property.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const open     = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const totalCost = tickets.reduce((s, t) => s + (t.cost ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Abertos',    value: open,                     color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Resolvidos', value: resolved,                  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20'  },
          { label: 'Custo',      value: formatCurrency(totalCost), color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
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
                  <span className="flex items-center gap-1"><Calendar size={9} /> {formatDate(ticket.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    {ticket.assignedTo && <span className="flex items-center gap-1"><User size={9} /> {ticket.assignedTo}</span>}
                    {ticket.cost && <span className="text-orange-400 font-semibold">{formatCurrency(ticket.cost)}</span>}
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

function VistoriasTab({ property }: { property: Property }) {
  const { data: allInspections = [] } = useInspections();
  const inspections = allInspections
    .filter(i => i.propertyId === property.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-3">
      {inspections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ClipboardCheck size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma vistoria registrada</p>
        </div>
      ) : (
        inspections.map((insp, i) => {
          const typeCfg = inspectionTypeConfig[insp.type];
          const staCfg  = inspectionStatusConfig[insp.status];
          const scoreColor = insp.generalScore >= 80 ? '#22C55E' : insp.generalScore >= 55 ? '#F59E0B' : '#EF4444';
          const circ = 2 * Math.PI * 15;

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
                      <circle cx={22} cy={22} r={15} fill="none" stroke="#1F2937" strokeWidth={4} />
                      <motion.circle
                        cx={22} cy={22} r={15} fill="none"
                        stroke={scoreColor} strokeWidth={4} strokeLinecap="round"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: circ - (insp.generalScore / 100) * circ }}
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
                      <Calendar size={9} /> {formatDate(insp.completedDate ?? insp.scheduledDate)}
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
        })
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PropertyProfileScreenProps {
  property: Property;
  onBack: () => void;
}

export function PropertyProfileScreen({ property, onBack }: PropertyProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('geral');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const statusCfg = propertyStatusConfig[property.status];

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
          className="w-9 h-9 rounded-xl bg-muted/70 dark:bg-white/5 flex items-center justify-center hover:bg-muted dark:hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-base font-bold truncate">{property.name}</p>
          <p className="text-muted-foreground text-xs flex items-center gap-1"><MapPin size={9} /> {property.city}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="relative h-48 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900"
      >
        {property.image && (
          <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white font-bold text-lg leading-tight">{property.name}</p>
              <p className="text-gray-300 text-xs mt-0.5 flex items-center gap-1">
                <MapPin size={10} /> {property.address}
              </p>
            </div>
            <div className="text-right">
              <p className="text-violet-300 font-bold text-xl">{formatCurrency(property.rentAmount)}</p>
              <p className="text-muted-foreground text-xs">/mês</p>
            </div>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="absolute top-3 left-3 flex gap-2">
          {property.bedrooms && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold">
              <Bed size={10} /> {property.bedrooms} qts
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold">
              <Bath size={10} /> {property.bathrooms} bnh
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold">
            <Maximize size={10} /> {property.area}m²
          </span>
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
          {activeTab === 'geral'      && <GeralTab      property={property} />}
          {activeTab === 'financeiro' && <FinanceiroTab  property={property} onSelectPayment={setSelectedPayment} />}
          {activeTab === 'manutencao' && <ManutencaoTab  property={property} />}
          {activeTab === 'vistorias'  && <VistoriasTab   property={property} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
